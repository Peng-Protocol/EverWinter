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

1. `_sweepExpiredData()` — evicts lock-in entries past their 6h TTL, expired banlist entries (7-day TTL), and expired potential-gainers/losers watchlist entries.
2. Drawdown throttle check — if halted, returns early.
3. `runScan()` — fetches all USDT perpetual tickers in a single bulk call (`GET /v5/market/tickers?category=linear`), filters and ranks them, then evaluates per-symbol gates for each candidate (banlist, lock-in, RSI). Qualifying symbols open positions up to `maxPos`.
4. `bot.lastScanAt` updated; `bot.lastScan` set to human-readable timestamp.

The bulk ticker call is reused for funding rate seeding and 24h change data. A second per-symbol ticker call is made only when a single-symbol price is needed (e.g. position watcher mark-price check).

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
| `pw_v1` | `cfg`, `positions`, `sess`, `closedTrades`, `bot.startTime/lastScan/lastScanAt`, `gainerLockIn`, `loserLockIn`, `symbolBanlist`, `lostValue`, `laggardId` |
| `pw_v1_log` | Activity log array (capped at 300 entries) |
| `__pw_plugins_v1` | Serialized plugin list (see Plugin System) |

### PseudoChaser

| Key | Contents |
|---|---|
| `pc_v1` | Same structure as `pw_v1` |
| `pc_v1_log` | Activity log array |
| `__pw_plugins_v1` | Plugin list (same key, separate namespace per page origin) |

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

Plugins are stored as serialized objects in `localStorage.__pw_plugins_v1`. Each entry includes all manifest fields plus `transformSrc` (the `transform` function stringified). On page load, the plugin system IIFE runs before Alpine initializes, deserializes stored plugins, topologically sorts them by `after`/`before` manifest fields (Kahn's algorithm), and wraps the component function (`pw()` or `pc()`).

### Transform Pipeline

```
pw()  →  plugin[0].transform(def)  →  plugin[1].transform(def)  →  ...  →  Alpine
```

Each plugin's `transform(def)` receives the current component definition object and returns a modified version. Methods are replaced or wrapped by closing over the original. The final definition is what Alpine receives at `x-data` evaluation time.

### CSS and HTML Slots

Plugin `css` strings are injected into `<head>` synchronously during the IIFE. Plugin `slots` objects are keyed by slot name (e.g. `"config-bottom"`, `"account-bar-extra"`); the IIFE finds matching `data-plugin-slot` anchor divs and sets their `innerHTML` before Alpine starts.

### Loading a Plugin File

The Plugin Manager accepts `.js` or `.html` files via `<input type="file">`. For `.html` files, `DOMParser` extracts all `<script>` tag contents and concatenates them. The extracted code is executed via `new Function(code)()`, which must set `window.__BotPlugin`. The plugin object is serialized (with `transform.toString()` stored as `transformSrc`) and saved to localStorage.

**A page reload is required after loading or removing a plugin.** The transform pipeline runs once at page load before Alpine initializes; plugins saved to localStorage during a session take effect on the next load.

### Manifest Fields

| Field | Type | Purpose |
|---|---|---|
| `id` | string | Unique identifier; used for deduplication and conflict resolution |
| `name` | string | Display name in Plugin Manager UI |
| `version` | string | Shown in UI |
| `targetBot` | string | `"PseudoWinter"` or `"PseudoChaser"` — informational |
| `after` | string[] | Load after these plugin IDs |
| `before` | string[] | Load before these plugin IDs |
| `conflicts` | string[] | Hard-reject if any of these are also loaded |
| `requires` | string[] | Warn if any of these are missing |
| `touches` | string[] | Method names this plugin modifies — surfaces overlap warnings |

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
| Last | Outermost | Strategy plugins (Drifters, etc.) — entry gating, position stamping |

Without `after`/`before` declarations the topological sort falls back to registration order. Always declare ordering explicitly for any plugin that wraps `pseudoOpenShort`.

---

## Live Trading Plugins

### EverWinter (PseudoWinter → SHORT)

Overrides `pseudoOpenShort`, `pseudoClosePosition`, `pseudoWatchPositions`.

**Open**: Places `Sell` market order → polls execution list for fill → constructs position object with `totalSize` from fill → calls `POST /v5/position/trading-stop` to set TP (trigger at `fillPrice * (1 - tpPct/100/lev) * 1.001`) and SL natively.

**Close**: Places `Buy` reduceOnly limit at `markPrice * 1.003` (above mark, ensures taker fill) → fetches `closed-pnl` for actual exit price → calls original simulation close logic.

**Sync**: `_ewSyncPositions()` runs every 8 s inside `pseudoWatchPositions` when credentials are present. Fetches all open linear positions from the exchange. Any position present in the simulation book but absent from the exchange response is closed via the original simulation close path using the `closed-pnl` exit price.

### SunChaser (PseudoChaser → LONG)

Mirror of EverWinter for long side. `Buy` market to open, `Sell` reduceOnly limit at `markPrice * 0.997` to close. TP trigger at `fillPrice * (1 + tpPct/100/lev) * 0.999`. Creds in `__sc_creds`.

### Balance Display

Both plugins override `refreshBalance()` to fetch `GET /v5/account/wallet-balance?accountType=UNIFIED` and populate `acct.balance` (walletBalance) and `acct.available` (availableToWithdraw) for the USDT coin. The market menu balance display switches from `∞` to the live wallet balance once credentials are present and the first scan cycle completes. Without credentials it remains `∞`.

---

## Drifters Plugins

`plugins/strategies/Drifters-Winter.html` (id `drifters-winter`, `after: ['everwinter']`) targets PseudoWinter; `plugins/strategies/Drifters-Chaser.html` (id `drifters-chaser`, `after: ['sunchaser']`) targets PseudoChaser. The `after` declaration makes each the outermost transform so it can gate entries ahead of the live-API open (see Plugin Stack Order). Strategy rationale lives in the Strategy Book; this section documents the implementation.

### Internals

- `_driftersBias()` — sums the `trades` field across the persisted lock-in maps and compares the sides against `cfg.driftersThreshold` (default `2`). Winter compares `gainerLockIn` vs `loserLockIn`; Chaser compares `gainerStratLockIn` (bullish activity) vs `gainerLockIn` (roof/bearish activity). Returns `'bullish'`, `'bearish'`, or `'neutral'` (also neutral when both sides are zero).
- `_driftersRunScan()` — appended to `runScan`. Returns early when `cfg.driftersEnabled` is off, the book is at `maxPos`, or the bias opposes the bot's direction. Otherwise fetches the full ticker list, takes the top 30 non-banned, non-BTC USDT symbols by 24h turnover (skipping symbols already in the book), classifies each with `_drifterRsiClass(rsi6, rsi12, rsi24)` — `'high'` (all ≥ 50), `'low'` (all ≤ 50), `'lukewarm'` (mixed → skip) — and opens via `pseudoOpenShort` with `_drifterType` set on the candidate.
- `driftLockIn` — third lock-in map keyed by symbol: `{ rsi6, rsi12, rsi24, trades, setAt, drifterType }`, 6-hour TTL. One entry per symbol: a same-direction re-fire ratchets each timeframe (`Math.max` for high, `Math.min` for low), increments `trades`, and refreshes `setAt`; an opposite-direction fire replaces the entry outright. Persisted under the plugin's own localStorage key (restored on init with expired entries dropped) and swept by the wrapped `_sweepExpiredData()`.
- Re-entry gate: a fresh same-direction `driftLockIn` entry blocks the symbol unless all three RSI readings are strictly past the stored values (above for high, below for low).
- `pseudoOpenShort` wrap — non-drift candidates pass straight through to the original. For drift candidates, the main lock-in bumps are suppressed for the duration of the call (Winter: gainer/loser bumps; Chaser: `gainerStratLockInBump`), the new position is stamped with `pos._drifterType`, and `driftLockInBump(...)` records the drift entry.
- `pseudoClosePosition` wrap — carries `_drifterType` onto the newly prepended `closedTrades[0]` record so history rendering can tag it.
- Transform hooks touched: `runScan`, `pseudoOpenShort`, `pseudoClosePosition`, `renderTradeFeed`, `persist`, `_sweepExpiredData`.

### UI Elements

- **Mode label suffix** — the `mode-label-extra` slot appends "+ Drifters" to the header mode label while `cfg.driftersEnabled` is on.
- **Config accordion** — the `strategy-accordions` slot adds a "〜 Drifters Strategy" accordion to the config column with an ice-blue **ON** / grey **OFF** state chip in its header. Inside: a **Drifters Mode** toggle (with a hint line summarizing the strategy) and, when enabled, a **Bias Threshold** slider — `cfg.driftersThreshold`, range 1.0×–5.0× in 0.1 steps, default 2.0×, current value rendered next to the label. Both respect the config lock.
- **DRIFT badge** — `renderTradeFeed` is wrapped to append a small monospace `DRIFT` chip to closed-trade cards whose record carries `_drifterType`: green border/text for `'high'`, red for `'low'`. The badge text never varies; color alone encodes direction. Open-position cards are not badged — the marker lives on the position object and surfaces once the trade closes.
- **Activity log** — bias changes log once per change (not per scan): 📈 "Today is bullish — Drifters deferred (short-only bias)" (Winter) / 📉 "Today is bearish — Drifters deferred (long-only bias)" (Chaser). Each entry logs `[DFT] ▲/▼ SYM @ price RSI a/b/c — high|low drifter entry`; each lock-in bump logs the ratcheted RSI triple and the accumulated trade count.

---

## EDa (Effective Debt Adjusted) System

The EDa system distributes the financial cost of losing trades across all open positions, adjusting their take-profit targets to ensure the portfolio collectively recovers the debt. It runs in both PseudoWinter (shorts) and PseudoChaser (longs) and activates whenever `laggardCheckEnabled` is true.

### Core Concepts

| Term | Definition |
|---|---|
| **EV (Expected Value)** | The profit a position is expected to earn when it closes at its configured TP: `margin × tpPct / 100`. |
| **LV (Lost Value)** | `_lostValue` — a running accumulator updated on every close: `_lostValue += totalPnl`. Profitable closes push it toward zero; losing closes push it negative. Snapped to 0 when it drifts above −0.01. |
| **ED (Effective Debt)** | Per-position debt: `ED = EV − (lvShare + uPnL)`. A positive ED means the position owes more than its current unrealised value. Negative uPnL increases ED; positive uPnL reduces it. |
| **Laggard** | Always the **oldest open position** (lowest `openedAt`). It absorbs uncapped debt and has its TP overridden by the raw EDa price. |
| **Non-laggard** | Every other open position. Receives a capped share of lost value (up to `edaLvCapMult × EV`, default 2×). |
| **EDa TP** | A derived TP price that, if hit, covers the position's full ED. Stored on the position as `_edaTpPrice` and written to `currentTpPrice` whenever active. |

### `_updateLostValue(totalPnl)` (PseudoWinter)

Called on every close. Adds `totalPnl` (net after fees) to `_lostValue`. Snaps to zero if the result is > −0.01 (eliminates floating-point drift).

### `_electLaggard()` (PseudoWinter)

Sets `_laggardId` to the `id` of the position with the lowest `openedAt` among all pseudo-positions. Called after every open and close. PseudoChaser uses an equivalent inline `reduce` in the EDa block.

### `_redistributeED()` (PseudoWinter) / inline EDa block (PseudoChaser)

Runs after every close and after `_electLaggard`. Three-step algorithm:

**Step 1 — Compute EV and base ED**

For each position:
```
p._ev = p.margin × (_baseTpPct || tpPct || entryTpRoi) / 100
p._ed = p._ev − p.upnl
```

**Step 2 — Distribute lost value**

If `_lostValue ≠ 0`, each position receives an equal per-slot share `lv / n`. Non-laggard shares are capped at `±(edaLvCapMult × _ev)`. The laggard absorbs whatever is left over — uncapped.

```
perPos = _lostValue / numPositions
share  = clamp(perPos, −cap, +cap)   // non-laggard
laggard._ed += (_lostValue − Σ absorbed)  // unbounded remainder
```

**Step 3 — Compute and apply EDa TP**

For a short (PseudoWinter), the EDa TP is the exit price at which the position's PnL equals its ED:
```
pnl = (entry − exit) / entry × lev × margin = ED
→  exit = entry × (1 − ED / (lev × margin))
```
For a long (PseudoChaser) the formula is additive:
```
exit = entry + debt × entry / (lev × margin)
```

**Assignment rules:**

| Role | Rule |
|---|---|
| **Laggard** | Raw EDa TP applied unconditionally — can be below 3% ROI or even require a loss. Closes fast; debt recovery falls to non-laggards. |
| **Non-laggard (normal phase)** | EDa TP only applied when it demands *more* profit than the config TP. Shorts: `min(rawEdaTp, configTp)` keeps the lower (deeper) price. Longs: `max(rawEdaTp, configTp)` keeps the higher price. |
| **Non-laggard (reduce phase)** | Same logic, but the floor is the 3% reduce-phase TP instead of configTp. |
| **No debt (`ED ≤ 0`)** | `_edaTpPrice` is cleared and `currentTpPrice` is restored to the phase TP. |

When EDa is active, `currentTpPrice` and `tpPct` are overwritten immediately and become the single source of truth for TP checks in `pseudoWatchPositions`.

### Laggard Stats UI

The stats column shows per-laggard metrics: **EV**, **LV Share** (the per-position slice of `_lostValue`), **uPnL**, and derived **ED**. The EDa TP price is shown when non-zero. PseudoChaser additionally shows **Value Lost — Non-Laggards** (total and per-position share distributed to non-laggards).

---

## Lock-in State

`gainerLockIn` and `loserLockIn` are plain objects keyed by symbol: `{ rsi6, rsi12, rsi24, setAt, trades }`. Both are refreshed at **position close** (in addition to open), so the 6-hour TTL restarts from close time.

### PseudoWinter

| Store | Direction | Ratchet | Re-entry condition |
|---|---|---|---|
| `gainerLockIn[sym]` | Floor (shorts on high RSI) | `Math.max` — rises each trade | RSI must be **strictly above** the floor on all three timeframes |
| `loserLockIn[sym]` | Ceiling (shorts on low RSI) | `Math.min` — falls each trade | RSI must be **strictly below** the ceiling on all three timeframes |

### PseudoChaser

| Store | Direction | Ratchet | Re-entry condition |
|---|---|---|---|
| `gainerLockIn[sym]` | Roof (longs — blocks if RSI bounced too high) | `Math.min` — falls each trade | RSI must be **strictly below** the roof |
| `gainerStratLockIn[sym]` | Floor (gainer-strat longs on high RSI) | `Math.max` — rises each trade | RSI must be **strictly above** the floor |

**Strict inequality**: the gate blocks at-or-beyond the lock-in level, requiring RSI to move past it for re-entry. For a floor of 75, the next entry needs RSI > 75; the ratchet then sets the new floor to that entry's RSI, requiring yet higher RSI next time.

`_sweepExpiredData()` removes entries where `Date.now() − setAt > 6 × 3600 × 1000`.

With a Drifters plugin loaded, a third map `driftLockIn` exists alongside these — same TTL, same sweep — documented under Drifters Plugins above.

---

## Drawdown Throttle

When enabled, `runScheduledCycle()` checks rolling 6-hour PnL. If net PnL over the window falls below `-(drawdownThrottleFactor × entry margin)`, `_drawdownHaltUntil` is set to `Date.now() + 12 * 3600 * 1000`. New entries are blocked until `_drawdownHaltUntil` passes. The halt can be manually cancelled from the config panel (resets `_drawdownHaltUntil` to null).

---

## Activity Log

The activity log array is capped at 300 entries in memory and written to the `_log` localStorage key after each append. Entries are objects `{ t, m, type }` where `t` is a formatted timestamp, `m` is the message string (with ticker symbols stripped of `USDT` suffix for display), and `type` is `info`, `warn`, or `error`. The feed panel renders from this array with color coding per type.

---

## Data Export / Import

The Export button serializes `{ cfg, positions, sess, closedTrades, gainerLockIn, loserLockIn, symbolBanlist, lostValue, laggardId }` as a JSON blob downloaded as a `.json` file. Import reads the file via `FileReader`, parses it, and merges into current state — positions are replaced wholesale, config fields are merged field-by-field to avoid clobbering keys added in newer versions. A 5 s debounce prevents accidental double-imports.

---

## ChartWinter

Standalone single-file chart tool. Runs its own scan (same `GET /v5/market/tickers` + per-symbol klines) with independent RSI computation. Gainers/Losers toggle. Pinnable tickers persist chart lines (price levels and candle annotations) per symbol in `cw_v1`. No position management, no order execution.

---
