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

## Live Trading Plugins

### EverWinter (PseudoWinter → SHORT)

Overrides `pseudoOpenShort`, `pseudoClosePosition`, `pseudoWatchPositions`.

**Open**: Places `Sell` market order → polls execution list for fill → constructs position object with `totalSize` from fill → calls `POST /v5/position/trading-stop` to set TP (trigger at `fillPrice * (1 - tpPct/100/lev) * 1.001`) and SL natively.

**Close**: Places `Buy` reduceOnly limit at `markPrice * 1.003` (above mark, ensures taker fill) → fetches `closed-pnl` for actual exit price → calls original simulation close logic.

**Sync**: `_ewSyncPositions()` runs every 8 s inside `pseudoWatchPositions` when credentials are present. Fetches all open linear positions from the exchange. Any position present in the simulation book but absent from the exchange response is closed via the original simulation close path using the `closed-pnl` exit price.

### SunChaser (PseudoChaser → LONG)

Mirror of EverWinter for long side. `Buy` market to open, `Sell` reduceOnly limit at `markPrice * 0.997` to close. TP trigger at `fillPrice * (1 + tpPct/100/lev) * 0.999`. Creds in `__sc_creds`.

---

## EDa Laggard

`_electLaggard()` sets `_laggardId` to the oldest open position (by `openedAt`). `_redistributeED()` computes the EDa TP price for the laggard: the TP is raised until the laggard's projected close PnL covers both its own expected value and the collective `_lostValue` (accumulated losses from other closed positions). `currentTpPrice` on the laggard position is the singular source of truth for its TP — the watcher uses this field, not the initial TP derived from entry price.

---

## Lock-in State

`gainerLockIn` and `loserLockIn` are plain objects (`symbol → { rsi, setAt, count }`). The `rsi` field ratchets down to the minimum RSI seen across all entries for that symbol within the 6h TTL window. Re-entry is blocked when current RSI ≤ stored `rsi`. `_sweepExpiredData()` removes entries where `Date.now() - setAt > 6 * 3600 * 1000`.

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
