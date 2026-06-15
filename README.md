# ❄️ EVERWINTER

**EverWinter** is a browser-based trading suite for Bybit USDT Perpetuals executing the **Winter-Chaser** strategy. See the [Strategy Guide](https://github.com/Peng-Protocol/EverWinter/blob/main/Strategy_book.md) for trading logic and rationale.

---

## Files

| File | Description |
|---|---|
| `PseudoWinter.html` | Shorts-only simulation bot (Glacier-Void theme) |
| `PseudoChaser.html` | Longs-only simulation bot (Ember-Void theme) |
| `PsychoWinter1.0.html` | Reactive approach standalone bot |
| `ChartWinter.html` | Chart and scan research tool |
| `plugins/modes/EverWinter.html` | Live trading plugin for PseudoWinter |
| `plugins/modes/SunChaser.html` | Live trading plugin for PseudoChaser |

---

## Architecture

Each bot is a single self-contained HTML file. No build step, no backend, no server. All logic is inline JavaScript; Alpine.js and Bootstrap 5 are loaded from CDN at runtime.

**Component pattern**: A plain function (e.g. `pw()`) returns the Alpine component definition object. `Alpine.data()` is not used — the function is referenced directly in the `x-data` attribute. The CDN script tag comes last in the file so Alpine finds the function already defined.

**Timer architecture**: Four module-level variables (`_cdTimer`, `_watchTimer`, `_refreshTimer`, `_audioTimer`) hold timer handles outside the Alpine proxy. This prevents Alpine from wrapping them in reactive proxies, which would break `clearInterval`.

**Module-level state**: `_closingIds` (Set), `_klineCache` (object), `_instrCache` (object), `_auditRunning`, `_auditPromise` are all declared outside the Alpine component. They are shared across all method calls for the lifetime of the page.

---

## Timers and Cycle Timing

| Timer | Interval | Purpose |
|---|---|---|
| `tick` counter | 1 s (`setInterval`) | Drives reactive countdown displays in the template |
| `_watchTimer` | 5 s (`setInterval`) | Calls `pseudoWatchPositions()` continuously |
| `_cdTimer` | 1 s (`setInterval`) | Checks whether `scanMins` has elapsed; fires `runScheduledCycle()` when due |
| `_refreshTimer` | Varies | UI refresh for account balance (live mode only) |

`scanMins` is user-configurable (5–60, default 15). The scan bar in the UI shows elapsed time as a shrinking fill, computed from `Date.now() - bot.lastScanAt`.

`runScheduledCycle()` is guarded by `_cycleRunning` to prevent re-entrant execution. `pseudoWatchPositions()` is not guarded — it is designed to be interruptible and idempotent.

On `visibilitychange` (tab returns to foreground): if a scan is overdue, it fires immediately; open positions are re-watched; the keepalive timer is resumed.

---

## Scan Cycle (`runScheduledCycle`)

1. `_sweepExpiredData()` — evicts lock-in entries past their 6h TTL and expired banlist entries (7-day TTL).
2. Drawdown throttle check — if halted, returns early.
3. `runScan()` — fetches all USDT perpetual tickers in a single bulk call (`GET /v5/market/tickers?category=linear`), filters and ranks them, then evaluates per-symbol gates for each candidate (banlist, lock-in, RSI). Qualifying symbols open positions up to `maxPos`.
4. `bot.lastScanAt` updated; `bot.lastScan` set to human-readable timestamp.

The bulk ticker call is reused for funding rate seeding and 24h change data. A second per-symbol ticker call is made only when a single-symbol price is needed (e.g. position watcher mark-price check).

The full response is also cached on the instance as `_lastAllTickers`, with `_lastAllTickersAt` (epoch ms) recording when it was fetched. **Strategy plugins that append their own scan pass should reuse this cache when it is under 60 s old instead of re-fetching the endpoint** — a pass appended via the `runScan` wrap runs seconds after the host scan populated it. The age check makes the fallback fetch kick in automatically when the cache is stale (e.g. samplers running during a halt, when scans are skipped before the fetch).

---

## Position Watcher (`pseudoWatchPositions`)

Runs every 5 s. For each open position:

- Computes unrealized PnL from current mark price vs entry price.
- Checks TP and SL conditions against mark price.
- Runs whiplash audit: when mark price is within `whiplashProximityPct` of TP, fetches 1-minute klines over the last ~6 minutes to confirm whether TP was touched (catches cases where price spiked through TP between watcher cycles).
- Checks funding rate drop condition if enabled.
- Checks runtime deadline (`runtimeHours`) and TP-reduce phase (`tpReduceMins`).

A full-ticker batch fetch inside the watcher is throttled to at most once per 15 s (`TICKER_THROTTLE_MS`). Per-symbol kline fetches use a 60 s in-memory cache (`_klineCache`).

---

## RSI Computation

`calcRSI(closes, period)` implements Wilder's smoothing method:
1. Seed average gain and average loss from the first `period` changes.
2. Apply Wilder's EMA (`(prev × (n−1) + curr) / n`) for each subsequent close.
3. Return `100 − (100 / (1 + avgGain/avgLoss))`.

RSI6, RSI12, RSI24 each use this function with `period = 6`, `12`, `24` on 60-minute kline close prices. Klines are fetched as `interval=60&limit=30` — 30 hourly candles, enough for RSI24 warmup with 6 extra candles.

---

## Persistence

### PseudoWinter

| Key | Contents |
|---|---|
| `pw_v1` | `cfg`, `positions`, `sess`, `closedTrades`, `bot.startTime/lastScan/lastScanAt`, `symbolBanlist`, `lostValue`, `laggardId` |
| `pw_v1_log` | Activity log array (capped at 300 entries) |
| `__pw_plugins_v1` | Serialized plugin list (see Plugin System) |

### PseudoChaser

| Key | Contents |
|---|---|
| `pc_v1` | Same structure as `pw_v1` |
| `pc_v1_log` | Activity log array |
| `__pc_plugins_v1` | Serialized plugin list (own key — the bots previously shared `__pw_plugins_v1`, which clobbered each other's lists when served from the same origin) |

### PsychoWinter

| Key | Contents |
|---|---|
| `psychowinter_v1_cfg` | Config object |
| `psychowinter_v1_pseudo` | Positions and session state (simulation) |
| `psychowinter_v1_live` | Positions and session state (live) |
| `psychowinter_v1_pseudo_log` / `_live_log` | Activity logs |

### ChartWinter

| Key | Contents |
|---|---|
| `cw_v1` | Config, pinned tickers, saved price/candle lines per symbol |

### Live Trading Plugins

| Key | Contents |
|---|---|
| `__ew_creds` | `{ key, secret }` for EverWinter (Bybit API credentials) |
| `__sc_creds` | `{ key, secret }` for SunChaser |

`persist()` is called on every config change and after every position open/close. The activity log is written separately to keep the main key small. `closedTrades` is compacted before write (oldest entries pruned first) to avoid hitting localStorage size limits.

---

## Bybit API Endpoints

All calls target `https://api.bybit.com` with `category=linear`.

### Public (no auth required)

| Endpoint | Usage |
|---|---|
| `GET /v5/market/tickers?category=linear` | Bulk ticker fetch — all perpetuals; used for scan, watcher price updates, funding rate seeding |
| `GET /v5/market/tickers?category=linear&symbol=X` | Single-symbol price and funding rate |
| `GET /v5/market/kline?category=linear&symbol=X&interval=60&limit=30` | Hourly klines for RSI computation |
| `GET /v5/market/kline?category=linear&symbol=X&interval=15&limit=N` | 15-minute klines for volume/candle analysis |
| `GET /v5/market/kline?category=linear&symbol=X&interval=1&...` | 1-minute klines for whiplash audit |
| `GET /v5/market/instruments-info?category=linear&symbol=X` | Tick size and quantity step for order precision |

### Signed (live trading plugins only)

| Endpoint | Usage |
|---|---|
| `GET /v5/account/wallet-balance` | Account balance |
| `GET /v5/position/list?category=linear&settleCoin=USDT` | Sync open positions from exchange |
| `GET /v5/execution/list?category=linear&symbol=X&orderId=Y` | Fill price after order execution |
| `GET /v5/position/closed-pnl?category=linear&symbol=X` | Actual exit price and realized PnL on close |
| `GET /v5/market/time` | Server timestamp for clock sync |
| `POST /v5/order/create` | Place market order to open position |
| `POST /v5/order/create` (reduceOnly) | Place limit order to close position |
| `POST /v5/position/trading-stop` | Set TP and SL natively on exchange |
| `POST /v5/order/cancel` | Cancel open orders before close |

**Signing**: HMAC-SHA-256 via `crypto.subtle.sign`. Signature string is `timestamp + apiKey + recvWindow + payload`. Headers: `X-BAPI-API-KEY`, `X-BAPI-TIMESTAMP`, `X-BAPI-RECV-WINDOW` (5000 ms), `X-BAPI-SIGN`. A minimum 250 ms gap is enforced between signed requests.

---

## Plugin System

### Storage and Load Order

Plugins are stored as serialized objects in `localStorage.__pw_plugins_v1` (PseudoWinter) / `localStorage.__pc_plugins_v1` (PseudoChaser). Each entry includes all manifest fields plus `src` — the plugin's **raw source code**. On page load, the plugin system IIFE runs before Alpine initializes, deserializes stored plugins (skipping any whose `targetBot` names a different bot), topologically sorts them by `after`/`before` manifest fields (Kahn's algorithm), and wraps the component function (`pw()` or `pc()`).

Storing raw source matters: an earlier loader stored `transform.toString()` (`transformSrc`) and revived it with `new Function`, which broke on shorthand-method syntax and severed the plugin's closure over its module constants — no transform ever applied. The current loader **re-executes the stored source** at boot, rebuilding the live plugin object with closures intact, and takes `transform` from that. Legacy `transformSrc` entries cannot be revived; they are flagged as inactive by the conflict checker and must be re-loaded from their file once.

### Transform Pipeline

```
pw()  →  plugin[0].transform(def)  →  plugin[1].transform(def)  →  ...  →  Alpine
```

Each plugin's `transform(def)` receives the current component definition object and returns a modified version. The final definition is what Alpine receives at `x-data` evaluation time.

Two styles are supported, and a plugin may mix them per method:

- **Wrap** — capture the original via a `_orig*` closure and call it (`await _origScan.call(this)`), adding behavior before/after. Use this whenever the host behavior should be preserved: it composes with other plugins and inherits host bugfixes for free. Declare wrapped methods in `touches`.
- **Replace (suppress)** — return a definition whose method does **not** call the original. Use this when extending is contorted (e.g. the live-trading plugins' `pseudoOpenShort`, which substitutes real API execution for the simulation fill). Declare replaced methods in `suppresses` (in addition to `touches`): replacement is last-writer-wins, so the manager hard-warns when two loaded plugins suppress the same method.

### CSS and HTML Slots

Plugin `css` strings are injected into `<head>` synchronously during the IIFE. Plugin `slots` objects are keyed by slot name (e.g. `"config-bottom"`, `"account-bar-extra"`); the IIFE appends the HTML to matching `data-plugin-slot` anchors before Alpine starts. The injector also recurses into `<template>` fragments, so anchors inside Alpine `x-for` templates work — e.g. `"pos-card-badges"` sits inside the position-card template and injected markup can bind to the loop variable (`x-show="p._myFlag"`). A position-card badge plugin can also stamp `pos._roleBadgeOverride = true` to suppress the host's default role badge in favor of its own.

### Log Roll-ups

Bulk operations batch their activity-log chatter into one entry via host helpers `_logBatchBegin()` / `_logBatchEnd(label)`. While a batch is open, every `log()` call **except errors** buffers instead of printing; the outermost `_logBatchEnd` flushes the buffer as a single multi-line entry (`label — N events` followed by one `·`-prefixed line per event). Errors always print individually and immediately; a batch that collected a single message passes it through unchanged, and the rolled entry takes the worst severity collected (warn > success > info). Wrapped paths: host scan entry bursts, Bail All, and the Blizzard/Firestorm entry, exit, and cascade loops (the plugins call the helpers with optional chaining, so they degrade gracefully on an older host).

### Loading a Plugin File

The Plugin Manager accepts `.js` or `.html` files via `<input type="file">`. For `.html` files, `DOMParser` extracts all `<script>` tag contents and concatenates them. The extracted code is executed via `new Function(code)()`, which must set `window.__BotPlugin`. A plugin whose `targetBot` does not match the host bot is rejected at this point. The manifest fields plus the raw extracted source (`src`) are saved to localStorage; the source is re-executed at every page load to produce the live transform.

**A page reload is required after loading or removing a plugin.** The transform pipeline runs once at page load before Alpine initializes; plugins saved to localStorage during a session take effect on the next load.

### Manifest Fields

| Field | Type | Purpose |
|---|---|---|
| `id` | string | Unique identifier; used for deduplication and conflict resolution |
| `name` | string | Display name in Plugin Manager UI |
| `version` | string | Shown in UI |
| `targetBot` | string | `"pseudowinter"` or `"pseudochaser"` — **enforced**: file load is rejected on mismatch, and stored entries for another bot are skipped at boot |
| `after` | string[] | Load after these plugin IDs |
| `before` | string[] | Load before these plugin IDs |
| `conflicts` | string[] | Hard-reject if any of these are also loaded |
| `requires` | string[] | Warn if any of these are missing |
| `touches` | string[] | Method names this plugin modifies (wraps or replaces) — informational |
| `suppresses` | string[] | Method names this plugin **replaces without calling the original** — the conflict checker warns when two loaded plugins suppress the same method |

---

### Plugin Stack Order

The transform pipeline runs left-to-right, innermost to outermost:

```
pw()  →  plugin[0].transform(def)  →  plugin[1].transform(def)  →  ...  →  Alpine
```

When `pseudoOpenShort` is called at runtime, the **last** transform's version executes first. Each plugin captures the previous version via a `_orig*` closure and can call it, wrap it, or gate it.

**Rule: strategy plugins must declare `after: ['everwinter']` / `after: ['sunchaser']` in their manifest.**

The live trading plugin (EverWinter, SunChaser) completely replaces `pseudoOpenShort` with a real-API version that pushes the position itself — it does not call any prior version. Strategy plugins must therefore be the **outermost** wrapper so they can gate entries before the API call and post-process the newly pushed position after it.

If a strategy plugin loaded before the live plugin, the live plugin would discard the strategy wrapper by replacing the method at the end of the chain — the strategy would never execute.

| Load order | Chain position | Role |
|---|---|---|
| First | Innermost | Live trading plugin (EverWinter / SunChaser) — API execution |
| Last | Outermost | Strategy plugins — entry gating, position stamping |

Without `after`/`before` declarations the topological sort falls back to registration order. Always declare ordering explicitly for any plugin that wraps `pseudoOpenShort`.

---

## Live Trading Plugins

### EverWinter (PseudoWinter → SHORT)

Overrides `pseudoOpenShort`, `pseudoClosePosition`, `pseudoWatchPositions`. Both live plugins declare `suppresses: ['pseudoOpenShort', 'refreshBalance']` — those two are full replacements that never call the simulation originals; the close and watch overrides wrap them.

**Open**: Places `Sell` market order → polls execution list for fill → constructs position object with `totalSize` from fill → calls `POST /v5/position/trading-stop` to set TP (trigger at `fillPrice * (1 - tpPct/100/lev) * 1.001`) and SL natively.

**Close**: Places `Buy` reduceOnly limit at `markPrice * 1.003` (above mark, ensures taker fill) → fetches `closed-pnl` for actual exit price → calls original simulation close logic.

**Sync**: `_ewSyncPositions()` runs every 8 s inside `pseudoWatchPositions` when credentials are present. Fetches all open linear positions from the exchange. Any position present in the simulation book but absent from the exchange response is closed via the original simulation close path using the `closed-pnl` exit price.

### SunChaser (PseudoChaser → LONG)

Mirror of EverWinter for long side. `Buy` market to open, `Sell` reduceOnly limit at `markPrice * 0.997` to close. TP trigger at `fillPrice * (1 + tpPct/100/lev) * 0.999`. Creds in `__sc_creds`.

### Balance Display

Both plugins override `refreshBalance()` to fetch `GET /v5/account/wallet-balance?accountType=UNIFIED` and populate `acct.balance` (walletBalance) and `acct.available` (availableToWithdraw) for the USDT coin. The market menu balance display switches from `∞` to the live wallet balance once credentials are present and the first scan cycle completes. Without credentials it remains `∞`.

---

## Permafrost / Ashfall Plugins

`plugins/strategies/Permafrost-Winter.html` (id `permafrost-winter`, `after: ['everwinter']`) targets PseudoWinter; `plugins/strategies/Ashfall-Chaser.html` (id `ashfall-chaser`, `after: ['sunchaser']`) targets PseudoChaser. Same code, two profiles: the plugin is direction-agnostic — it learns only from this installation's realized PnL — so each bot grows its own map and the two must never share data.

Both replace the fixed 12h drawdown-throttle / gains-lock timers with a learned **market-climate profile**. The moment a halt fires, the plugin records the market structure at that instant; over time these events teach it which climates are hostile (drawdowns) and which favorable (gains locks). A halt then ends when the climate changes — not when a clock runs out.

### Market structure reading

Computed from the **full** USDT-perp ticker universe (same filters as the scan: USDT pairs, no BTCUSDT, `lastPrice ≥ 0.001`) — deliberately *not* the curated gainer/loser pools, whose dynamic floors make pool membership endogenous to the top mover. The reading reuses the host's `_lastAllTickers` cache when fresh (< 60 s); the slow-tick sampler during halts fetches its own copy, since scans (and therefore cache refreshes) don't run while halted:

- `skew` (displayed as **mag** in the status block) = (Σ gainer 24h% − Σ |loser 24h%|) / (Σ both) — magnitude lens: how far movers moved, size-weighted, −1…+1
- `breadth` = (gainer count − loser count) / (total count) — participation lens: how many tickers are moving, unweighted, −1…+1
- `ioScore` = mean(fundingRate across all tickers) / 0.05%, clamped −1…+1 — crowd-sentiment lens: positive = longs paying (crowd net bullish); zero extra bandwidth (already in the ticker response)

### Profile

- **Events** (weight 10) — recorded by wrapping the halt-trigger seams (`_checkDrawdownThrottle`/`_checkGainsLock` in Winter; `recordDrawdownPnl`/`recordGainsPnl` in Chaser). A drawdown event votes −1 at its (skew, breadth) point; a gains-lock event votes +1.
- **Samples** (weight 1) — a structure reading is taken on every `runScan` and every slow tick during halts; 6h later it is labeled with the realized PnL (`totalPnl`, matching the halt windows) of trades closed in that window, normalized by entry margin and clamped to ±1. Windows with no closed trades are dropped — no evidence either way.
- **Score** — gaussian-kernel weighted vote (bandwidth 0.25) of all entries near the current reading, with 7-day half-life recency decay so stale scars fade. Returns `score` ∈ [−1, +1] and `mass` (effective evidence weight nearby).

### Structure trajectory (the wave)

Every structure reading appends a `{ ts, lean, io }` point to a rolling wave array, where `lean = (skew + breadth) / 2 ∈ [−1, +1]` (+1 strongly bullish, −1 strongly bearish) and `io` is the `ioScore` at that moment (null for older entries recorded before IO was stored — the wave graph skips those for the IO line). This is kept **separate from samples** — it is never labeled, scored, or pruned for evidence; its only job is to record the path of the market. Points older than 7 days are pruned; the array is hard-capped at 2000 points.

`_afTrajectory()` / `_pfTrajectory()` derives two numbers from the wave:
- `lean` — the most recent point's value
- `slope` — mean of the newest third minus mean of the oldest third; positive = drifting bullish, negative = drifting bearish

The wave is plotted as an inline SVG in the accordion (bull/bear reference lines, current-direction color, live dot at the latest point; IO overlaid as a dashed purple line when data is available) and its direction label ("rising ▲ / falling ▼ / steady ▬") is shown next to the graph header.

### Effective score and inherent prior

A raw `score` from the learned profile is only available once `mass ≥ MIN_MASS (6)`. Before that — and as a blending term even after — the plugin uses an **inherent prior** derived purely from the wave:

```
inherent = DIR × (0.6 × lean + 0.4 × clamp(slope / 0.3, −1, +1) + 0.15 × io)
```

`DIR = −1` for Winter (shorts favor bearish/falling), `DIR = +1` for Chaser (longs favor bullish/rising). The slope term is what prevents longing into a dump or shorting into a pump: a mildly bullish but falling tape gives a negative inherent score for longs. The IO term adds crowd-sentiment pressure directly: a market where longs are paying high funding rates is net bullish regardless of price action. IO defaults to 0 when the toggle is off or data is unavailable.

The **effective score** blends learned history with the inherent prior by how full the evidence cup is:

```
massFrac = clamp(mass / STRONG_MASS, 0, 1)     (STRONG_MASS = 12)
eff = (score is null) ? inherent
                      : massFrac × score + (1 − massFrac) × inherent
```

At `mass = 0` the inherent prior drives everything. At `mass ≥ 12` the learned profile is in full control. Between those extremes the two are blended. `eff` (not raw `score`) is what gates the PLK and is shown as "effective" in the status block; the slow-tick sampler's early-thaw decision also uses `eff`.

### PLK (Preemptive Lock)

A proactive entry lock that fires *before* any PnL damage, during routine scan structure checks. When `eff ≤ cfg.permafrostPlkScore` / `cfg.ashfallPlkScore` (default −0.15, range −0.50…−0.05) with sufficient evidence (`mass ≥ MIN_MASS`), a PLK engages for a duration that scales with `|eff|` as a fraction of the hard cap:

```
durMs = clamp(|eff| × capMs, 1h, capMs)
```

This produces arbitrary durations (e.g. 3h 20m) rather than fixed blocks. The PLK rides the drawdown gate (`_isDrawdownHalted()` is overridden to return true while a PLK is active), so every entry choke point — including strategy plugins — respects it automatically. A real drawdown or gains-lock halt supersedes an active PLK (the `kind` field is overwritten; the PLK cooldown still starts from that moment).

**Dynamic cooldown**: after any PLK ends (elapsed, early-thaw, or manual lift), the next PLK cannot engage until `plkLastDurationMs` has passed — the cooldown matches the last lock's own duration, preventing back-to-back locks.

**Manual lift**: available via the "Lift PLK" button in the accordion status block and via the topbar countdown pill (which also shows remaining time and is click-to-lift). Lifting starts the cooldown immediately.

Under a **strong bias** (`mass ≥ 12` and `|score| ≥ cfg.*StrongScore`, default ±0.30), the PLK gets the `strong` flag, which enables early thaw/settle: the sampler checks `eff` each tick and lifts the PLK once it crosses the Thaw/Settle Score, same as for a drawdown/gainslock halt.

### Halt lifecycle

1. Halt fires → structure captured, event recorded.
2. If `mass ≥ 6` the halt becomes **profile-governed**: the halt timestamp is extended to the hard cap (`cfg.permafrostCapHours` / `cfg.ashfallCapHours`, default 24h, range 12–48h) and a slow sampler starts at `max(1h, 4 × scanMins)`. Profile too thin → stock 12h timer stands untouched.
3. Early lift requires a **strong bias** (`mass ≥ 12` and `|score| ≥ cfg.*StrongScore`): each slow tick checks `eff ≥ Thaw/Settle Score` (default 0) after at least 1h has elapsed. Without a strong bias the halt always runs to the 12h default or the hard cap — it is never lifted early. Lifting clears the corresponding rolling PnL window.
4. The hard cap is the exploration arm: it resumes trading regardless, so a region the profile distrusts is re-tested rather than avoided forever.
5. Manual halt clears are respected — the sampler notices the halt is gone and stands down.

Transform hooks touched: `init`, `persist`, `runScan`, `pseudoClosePosition`, plus the two halt seams per bot. Profile persists under `__permafrost_winter_v1` / `__ashfall_chaser_v1` (events capped at 200, samples at 1000, wave at 2000 points with 7-day TTL). **These keys are plugin-owned and are not touched when the plugin is removed** — data survives an uninstall and is restored automatically on reinstall.

### UI Elements

- **Mode label suffix** — "+ Permafrost" / "+ Ashfall" via `mode-label-extra` while enabled.
- **Config accordion** — "❄ Permafrost" (ice chip) / "♨ Ashfall" (ember chip) in `strategy-accordions`: mode toggle, **Thaw/Settle Score** slider, **Hard Cap** slider, PLK toggle and trigger slider, and a live status block (event/sample counts, latest reading with score and mass, active-halt state with governed/fallback mode and elapsed hours). Buttons: **Export** (JSON download of events, samples, and wave history), **Import** (replaces current events, samples, and wave from a JSON file — guarded by `confirm()`), and **Clear Profile** (zeroes events, samples, PnL log, and wave — guarded by `confirm()`). All controls respect the config lock.
- **Danger Zone** — collapsible section always visible at the bottom of the accordion (outside the enabled-guard). Contains **Clear Plugin State**: removes the plugin's localStorage key entirely and resets all in-memory data including halt and PLK state. Guarded by `confirm()`. Use before uninstalling to prevent orphaned data, or to guarantee a fully clean slate.
- **Activity log** — `[PFR]`/`[ASH]` lines: climate recorded at each halt (with mag/breadth/slope/io/score/mass and whether the halt is profile-governed), and the early-lift line with elapsed hours and clearing score. `mag` = the magnitude lens (`skew` in code); `breadth` = the participation lens; `slope` = wave trajectory direction; `io` = crowd funding-rate sentiment (omitted when unavailable).

Note: for the first weeks the plugin behaves almost exactly like the stock timers — that is by design. It refuses to override the clock until enough evidence has accumulated near the current reading.

---

## Blizzard / Firestorm Plugins

`plugins/strategies/Blizzard-Winter.html` (id `blizzard-winter`, `after: ['everwinter', 'permafrost-winter']`) targets PseudoWinter; `plugins/strategies/Firestorm-Chaser.html` (id `firestorm-chaser`, `after: ['sunchaser', 'ashfall-chaser']`) targets PseudoChaser. Same code, two profiles. Strategy rationale lives in the Strategy Book's **Scattershot** section; this section documents the implementation.

A vol/mcap-filtered scattershot bet on the market at large: each scan cycle ranks the baseline-qualifying pool by 24h turnover, inspects the top 10, fetches market cap per ticker from CoinGecko, and selects only those whose turnover-to-mcap ratio signals alignment with the bot's direction. Blizzard (short) requires vol < 10% of mcap — low relative volume suggests the broad market has not yet chased the move, making it a fade candidate. Firestorm (long) requires vol > 10% of mcap — high relative volume confirms momentum is actively backing the move. If none of the inspected tickers pass, the cycle logs this and skips entry. Passing tickers are opened with a fixed SL and a far TP; survivors force-close after 12 hours. The barrier geometry (TP 105% buffered → 70% functional / SL 18% by default) means one TP win covers ~3.9 SL exits; the edge is meant to come from broad market drift combined with the vol/mcap filter providing directional signal quality. Drawdown throttle and gains lock gate all entries; Permafrost/Ashfall governs those halts when loaded.

### Entry pass (`_blzRunScan` / `_fstRunScan`)

Appended to `runScan`. Skips the cycle when disabled, at `maxPos`, drawdown-halted, or gains-locked — logging a brief `"Scatter skipped"` line each time. Candidate pool: the host's `_lastAllTickers` cache (fallback fetch when stale), filtered to USDT pairs, no BTCUSDT, `lastPrice ≥ 0.001`, |24h%| ≥ `blizzardBaselinePct`/`firestormBaselinePct` (default 6%, range 1–20%) in **either direction**, excluding held and banned symbols. The pool is sorted by `turnover24h` descending and the **top 10** are inspected: for each, `_blzGetMcap`/`_fstGetMcap` resolves a CoinGecko market cap (see Market cap data below) and computes `turnover24h / mcap`. Blizzard keeps tickers where the ratio is **< 0.10**; Firestorm keeps tickers where the ratio is **> 0.10**. If zero tickers pass, the cycle logs `"none met vol/mcap criteria"` and exits without opening. Otherwise up to `blizzardPicks`/`firestormPicks` (default 3, range 1–10) are drawn at random from the passing set, retried up to 3× picks on failed opens. Each cycle logs the baseline pool size, the passing count, and opens.

### Market cap data (CoinGecko)

Blizzard and Firestorm are the only plugins in the suite that call an external third-party API. A two-level cache limits traffic:

- **ID cache** (permanent, session-scoped) — maps base symbol (e.g. `eth`) to a CoinGecko coin ID (e.g. `ethereum`). Populated on first encounter via `GET /api/v3/search?query={base}`; never expires. After the first scan cycle touching a symbol the search call is never repeated.
- **Market cap cache** (1-hour TTL) — maps coin ID to `usd_market_cap` from `GET /api/v3/simple/price?ids={id}&vs_currencies=usd&include_market_cap=true`. Refreshed at most once per hour per symbol regardless of scan frequency.

**Call budget per cycle**: unknown symbols → 1 search call each (once per symbol per session); known symbols with stale mcap → 1 price call each. After warm-up: 0–10 calls per cycle total.

**Limitations:**

- Symbol resolution uses the first search result. For well-known symbols this is reliable; for symbols shared by multiple tokens the matched coin may be incorrect, producing a wrong market cap and a false ratio result. This only affects candidate selection — it cannot cause incorrect exits on open positions.
- Tickers that fail to resolve (no search hit, API error, or zero market cap returned) are excluded from the candidate pool. If all 10 inspected tickers fail to resolve, the log reads `"none met vol/mcap criteria"` — indistinguishable from tickers that resolved but failed the ratio test.
- The free CoinGecko tier enforces rate limits (~10–30 req/min). With up to 20 calls on a cold start this is well within limits; a burst of cold-start cycles in quick succession could trigger throttling (HTTP 429), causing lookups to return `null` and the cycle to defer entry silently.
- **No API key is required.** If CoinGecko is unreachable, all lookups return `null` silently and the cycle defers entry to the next scan.

### Open mechanics (cfg-swap)

Both the sim hosts and the live plugins read binary-mode TP/SL from `cfg` at open time, so `_blzOpen`/`_fstOpen` swaps `binaryModeEnabled: true`, `binaryTpPct`, and `binarySlPct` in around the `pseudoOpenShort` call and restores them in `finally` (re-persisting the restored cfg). Entries are therefore always binary-style: TP and SL stamped at entry, no DCA ladder. The TP slider (`blizzardTpPct`/`firestormTpPct`, default 105, range 20–300) is the **buffered (EV)** value, same convention as the general-settings TP UI — it is passed straight through as `binaryTpPct` and the host derives the functional TP as slider ÷ `_buffMul` (105% → 70% at +50% offset; a one-time v1.1 migration resets stored pre-buffer values to the new default). Main lock-in bumps are suppressed during the call (Drifters precedent — scatter entries are not signal trades); RSIs are fetched for the position record. New positions are stamped `_blizzard`/`_firestorm` plus `_slPctOverride`.

### Cascade

`blizzardCascadeEnabled`/`firestormCascadeEnabled` (default **on**, toggle in the accordion): each watcher pass, before the per-position checks, the plugin sums uPnL across **all** open positions (scatter and stock alike). When the collective total reaches the TP target — `TpPct% × base margin` (`minNotional ÷ leverage`), $1.05 at default settings — every open position is bailed at mark price with reason `'cascade'` for a net profit. The realized PnL feeds the host's gains-lock window (readily triggering it) and, when Permafrost/Ashfall is loaded, seeds its climate profile with favorable samples. Active only while the scatter mode itself is enabled; an in-flight guard prevents re-entry while a cascade is closing.

`_slPctOverride` is a small host accommodation added for this plugin but usable by any: the watcher's binary **SL drift-correction** (which re-targets `slPrice` from the global `cfg.binarySlPct` each tick) and the position-card SL display honor a per-position override when present, so a plugin-set SL survives instead of being corrected back to the global slider.

### Exits

The plugin's `pseudoWatchPositions` wrap is the authoritative exit for stamped positions (it manages them even if the mode is toggled off mid-flight): per tick it computes ROI as `upnl / margin` and closes at `roi ≥ TP% ÷ buffMul` (`'tp'`, the functional level), `roi ≤ −SL%` (`'sl'`), or age ≥ 12h (`'blizzard-12h'`/`'firestorm-12h'`), always at mark price. The host enforces the same TP/SL independently (exchange-native in live mode — note the live TP order sits at the buffered slider value since the live open does not divide by the buffer; the wrap closes at the functional level first). Closed records carry the stamp and the trade feed badges them `BLZ` (ice) / `FST` (ember).

### Interactions

- **EDa** — scatter positions participate fully: they hold debt shares, can be elected laggard, and their SL losses feed `_lostValue` redistribution. (TP targets survive EDa recomputes via `_baseTpPct`, which stores the swapped value.)
- **Drawdown throttle / gains lock** — scatter PnL feeds both windows, and both halts block new scatter entries.
- **maxPos** — shared with the stock strategy; scatter entries stop at the global cap.

---

## EDa (Effective Debt Adjusted) System

The EDa system distributes the financial cost of losing trades across all open positions, adjusting their take-profit targets to ensure the portfolio collectively recovers the debt. It runs in both PseudoWinter (shorts) and PseudoChaser (longs) and activates whenever `laggardCheckEnabled` is true.

### Core Concepts

| Term | Definition |
|---|---|
| **buffMul (TP buffer)** | `1 + laggardProfitOffset/100` (default `1.5` at +50%). The TP slider is the *buffered* value; the functional (debt-free) TP is `slider ÷ buffMul` — 18% on the slider closes at 12%. All stage-0 TP price computations divide by `buffMul` (the old hardcoded `1.5`). |
| **Functional EV** | Profit at the functional TP: `margin × (slider ÷ buffMul) / 100`. |
| **Buffered EV** | `margin × slider% ` (= functional EV × buffMul). PseudoChaser stamps this at open as `_laggardInitialEV`; PseudoWinter computes it per pass as `_bufferedEV`. |
| **Lost Value / debt** | PseudoWinter: global `_lostValue` accumulator (`+= totalPnl` on every close, snapped to 0 above −0.01 — never positive). PseudoChaser: per-position `_laggardLostValue` (negative = held loss, positive = banked credit from profitable closes). |
| **Laggard** | Always the **oldest open position**. It is the debt repository: holds unbounded lost value (the remainder after non-laggard caps). |
| **Non-laggard** | Every other open position. Holds at most its own **buffered EV** in lost value (so the max EDa target is 2× buffered EV — e.g. $0.36 on a $1-margin/18% position). `edaLvCapPct`/`laggardDebtCapPct` are legacy and unused. |
| **EDa TP** | When a position holds lost value, its TP price is moved so the close covers `bufferedEV + heldLoss` (e.g. $0.18 + $0.09 → $0.27 → 27% ROI at $1 margin). With no held loss the position rests at the functional TP. Stored as `_edaTpPrice`, mirrored into `currentTpPrice`/`tpPct`. |

### `_updateLostValue(totalPnl)` (PseudoWinter)

Called on every close. Adds `totalPnl` (net after fees) to `_lostValue`. Snaps to zero if the result is > −0.01 (eliminates floating-point drift).

### `_electLaggard()` (PseudoWinter)

Sets `_laggardId` to the `id` of the position with the lowest `openedAt` among all pseudo-positions. Called after every open and close. PseudoChaser uses an equivalent inline `reduce` in the EDa block.

### `_redistributeED()` (PseudoWinter) / `_edaTargetPrice()` + `runLaggardCheck` (PseudoChaser)

PseudoWinter, after every open/close/watch tick:

1. Per position compute `_funcPct` (slider ÷ buffMul for stage 0, raw `_tpRoi(stage)` otherwise), `_funcEV`, `_bufferedEV`.
2. Distribute `totalDebt = −_lostValue` equally; non-laggard shares capped at their own `_bufferedEV` (`p._edDebt`), laggard takes the unbounded remainder.
3. TP per position: no debt → functional TP. With debt → exit price where `pnl = bufferedEV + debt`:
```
SHORT: exit = entry × (1 − (bufferedEV + debt) / (lev × margin))
LONG:  exit = entry + (bufferedEV + heldLoss) × entry / (lev × margin)
```

PseudoChaser keeps per-position lost value: `_notifyLaggardClose` distributes each close's PnL (slot-weighted, non-laggards capped at buffered EV, overflow → laggard) and `_edaTargetPrice(pos)` derives the TP from the position's own held loss. The `runLaggardCheck` close-check (`bufferedEV − lostValue − uPnL ≤ 0`) releases a position early when banked credit plus its own uPnL covers the buffered target.

**Laggard loss-close debt carry-forward:** when a position closes in loss while holding lost value, the held value is added to the redistribution instead of evaporating with the position (activity log: "closed in loss holding $X lost value — redistributing"). If the book is left empty, the outstanding loss is retained — PseudoWinter keeps it in `_lostValue`, PseudoChaser in `_retainedLostValue` (persisted) — and placed on the next position to open, which is logged as it inheriting the debt repository role.

### Laggard Stats UI

The stats column shows per-laggard metrics: **Buffered EV**, **Lost Value** (the debt the laggard holds), **uPnL**, and derived **ED** (`bufferedEV + heldLoss − uPnL`). PseudoWinter and PseudoChaser additionally show **Value Lost — Non-Laggards** (total and per-position held loss, each capped at that position's buffered EV).

---

## Lock-in State

Lock-in maps are plain objects keyed by symbol, entries `{ change, setAt, trades }` — both bots gate on **24h change** (values rounded to 4 decimal places on write). Entries are refreshed at **position close** (in addition to open), so the 6-hour TTL restarts from close time. The two bots gate in opposite directions.

### PseudoWinter (continuation)

Winter's gates are continuation bets — re-entry only when the move has pushed *further* in the entry direction, with **strict inequality** (at-the-level blocks):

| Store | Direction | Ratchet | Re-entry condition |
|---|---|---|---|
| `gainerLockIn[sym]` | Bullish-side entries | `Math.max` — floor rises each trade | 24h change must be **strictly above** the floor — the ticker must stretch further before it is entered again |
| `loserLockIn[sym]` | Bearish-side entries | `Math.min` — ceiling falls each trade | 24h change must be **strictly below** the ceiling — the ticker must bleed further before it is entered again |

### PseudoChaser (mean-reversion-aware)

Chaser's gates deliberately invert Winter's continuation logic, and **equality is allowed** (re-entry *at* the locked level passes):

| Store | Used by | Ratchet | Re-entry condition |
|---|---|---|---|
| `gainerLockIn[sym]` | Loser strategy (longs) | `Math.max` — floor rises each trade | 24h change must be **at or above** the floor — a recovering loser is picking up energy and can keep going up |
| `gainerStratLockIn[sym]` | Gainer strategy (longs) | `Math.min` — ceiling falls each trade | 24h change must be **at or below** the ceiling — a faltering gainer may rebound, so re-entry waits for the pullback |

In both bots the ratchet moves the level to each new trade's change, tightening in the strategy's preferred direction. Chaser's watchlist-promotion paths (potential gainers/losers — currently **disabled and hidden from the UI**) carry the same gates for consistency, reading the current 24h change from the cycle's `_lastAllTickers` cache via `_change24h(symbol)`.

`_sweepExpiredData()` removes entries where `Date.now() − setAt > 6 × 3600 × 1000`.

---

## Drawdown Throttle

When enabled, `runScheduledCycle()` checks rolling 6-hour PnL. If net PnL over the window falls below `-(drawdownThrottleFactor × entry margin)`, `_drawdownHaltUntil` is set to `Date.now() + 12 * 3600 * 1000`. New entries are blocked until `_drawdownHaltUntil` passes. The halt can be manually cancelled from the config panel (resets `_drawdownHaltUntil` to null).

---

## Gains Lock

The profit-side mirror of the Drawdown Throttle: instead of halting after losses, it banks a winning streak by halting new entries once rolling profit hits a target. Runs in both PseudoWinter and PseudoChaser; enabled by default (`cfg.gainsLockEnabled: true`).

### Mechanism

- Every position close feeds realized PnL into a rolling window (`_gainsWindow`, entries `{ pnl, ts }`, 6-hour TTL) — `_recordGainsPnl(pnl)` in PseudoWinter, `recordGainsPnl(pnl)` in PseudoChaser.
- The trigger threshold is `gainsLockFactor × entry margin`, where entry margin = `minNotional ÷ leverage`. `cfg.gainsLockFactor` ranges 0.1–5.0 in 0.1 steps, default 1.0×.
- When window PnL ≥ threshold, `_gainsLockHaltUntil = now + 12h` and the `[GLK] 🔒` trigger line is logged. While locked, `_isGainsLocked()` makes `runScheduledCycle()`/`runScan()` return early (scan-deferred log line with hours remaining), so no new entries open; **open positions are unaffected** — the watcher keeps managing TP/SL as usual.
- Expiry is checked each cycle; on lapse the lock clears itself and logs `[GLK] ✅ Gains lock lifted`.
- `_gainsLockHaltUntil` is persisted (`gainsLockHaltUntil` in the main state key), so the lock survives reloads.

### Trigger check (PseudoWinter `_checkGainsLock`)

```
windowPnl = Σ pnl over last 6h
threshold = max(0.1, cfg.gainsLockFactor) × (minNotional / leverage)
windowPnl ≥ threshold  →  _gainsLockHaltUntil = now + 12h
```

PseudoChaser performs the equivalent check inline in `recordGainsPnl` (window pruned by `GL_TTL`, factor not floored).

### UI

The config panel exposes the toggle, the **Profit Factor** slider (with the computed dollar threshold at current margin), and — while locked — a countdown with a **Cancel Lock** / **clear manually** action that nulls the halt and empties the window. PseudoWinter's market menu additionally shows a `GLK Xh` badge while the lock is active; PseudoChaser shows `🔒 GLK` with a clear action.

### Interactions

- **Permafrost / Ashfall** — replace the fixed 12-hour lock duration with the learned market-climate profile: a gains lock under their governance ends when the climate score crosses the thaw/settle threshold (hard-capped at `permafrostCapHours`/`ashfallCapHours`), and lifting clears the rolling window just like a manual clear. See the Permafrost / Ashfall section.

### Gains sequestration (interaction with the Drawdown Throttle)

The lock is not just a brake — it **re-arms the drawdown throttle's sensitivity** through the time axis of the rolling windows. Without it, a profitable run sits in `_drawdownWindow` as cushion: at +$1 of window PnL, the throttle (limit −0.5× entry margin) only trips after the bot gives back the full $1 *plus* $0.50 of fresh losses. With the lock, the halt stops new closes entirely; the profitable entries age out of both 6h windows during the freeze, and trading resumes with the drawdown count near zero — only $0.50 of fresh losses now trips the throttle. The gains are sequestered as realized PnL instead of being spent as throttle cushion. Even a 1h pause shifts the 6h window materially.

**Caveat — early lifts**: the sequestration is only complete when the halt outlasts the 6h window TTL. The stock 12h timer always does. Permafrost/Ashfall can settle a gains-lock halt after as little as 1h (`MIN_HALT_MS`); the early lift clears `_gainsWindow` but **not** `_drawdownWindow`, so the winning closes that triggered the lock remain in the drawdown window for up to 5 more hours and act as cushion during that span — the bot can give back the locked gains plus 0.5× margin before throttling. Accepted behavior: the governor only settles early when the climate profile reads the structure as favorable, which is exactly when that cushion is least likely to be consumed.

---

## Activity Log

The activity log array is capped at 300 entries in memory and written to the `_log` localStorage key after each append. Entries are objects `{ t, m, type }` where `t` is a formatted timestamp, `m` is the message string (with ticker symbols stripped of `USDT` suffix for display), and `type` is `info`, `warn`, or `error`. The feed panel renders from this array with color coding per type.

---

## Data Export / Import

The Export button serializes `{ cfg, positions, sess, closedTrades, symbolBanlist, lostValue, laggardId }` as a JSON blob downloaded as a `.json` file. Import reads the file via `FileReader`, parses it, and merges into current state — positions are replaced wholesale, config fields are merged field-by-field to avoid clobbering keys added in newer versions. A 5 s debounce prevents accidental double-imports.

---

## ChartWinter

Standalone single-file chart tool. Runs its own scan (same `GET /v5/market/tickers` + per-symbol klines) with independent RSI computation. Gainers/Losers toggle. Pinnable tickers persist chart lines (price levels and candle annotations) per symbol in `cw_v1`. No position management, no order execution.

---
