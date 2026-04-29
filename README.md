# ❄️ EVERWINTER

**EverWinter** is a single-file, browser-based bot for Bybit USDT Perpetuals. It targets mean-reversion opportunities on top gainers using multi-timeframe RSI gating, tiered DCA, and a suite of risk management routines. This document covers the application's architecture, UI sections, position lifecycle, and polling behaviour. For the underlying trading strategy — including entry logic, RSI gate tuning, and risk rationale — see the [Strategy Guide](https://drive.google.com/file/d/1T2YXmIT8E-u0TvvR5QT7qvXI8T5SHEbr/view?usp=drivesdk).

---

## Technical Stack

- **Frontend:** Alpine.js (reactive state), Bootstrap 5, custom "Glacier-Void" CSS theme
- **API:** Bybit V5 REST (USDT Perpetuals — `category: linear`)
- **Architecture:** Single-file HTML/JS application — no build step, no backend, no third-party data routing. All API calls go directly to Bybit.
- **Persistence:** `localStorage` — config, session stats, trade history, positions, and rodeo state all survive page reloads.
- **Credentials:** API keys are held in volatile Alpine state and optionally persisted to `localStorage`. They are never transmitted to any server other than `api.bybit.com`.

---

## Getting Started

1. Download `EverWinter1.0.html` and open it in any modern desktop or mobile browser.
2. Generate a Bybit API key with **Contract/Derivatives** read + trade permissions.
3. Enter the key pair in the API panel, configure leverage and margin, then click **Start Bot**.

---

## Position Types

EverWinter operates (6) distinct position archetypes. Both share the same DCA/TP mechanics but differ in how they are entered and how re-entry state is tracked.
These are; 

* **Standard Gainer Positions**
* **Extension Diving (EXD)**
* **Follow-Through (FT)**
* **Advanced Follow-Through (ADV)**
* **Pile-on Follow-Through (P-FT)**
* **Faders**
* **Carry-On Faders**

All of which are explained in the [Strategy Guide](https://drive.google.com/file/d/1T2YXmIT8E-u0TvvR5QT7qvXI8T5SHEbr/view?usp=drivesdk).

### Position Badges 
Each position type has a unique badge pinned to its header which makes it instantly identifiable. 

---

## Watchlists

EverWinter maintains (3) distinct watchlists, each with different entry criteria and lifecycle rules.

### Potential Entries Watchlist
Populated during each main scan pass for symbols that are within a configurable RSI shortfall percentage of the full entry gate (default 10%). These are near-threshold candidates that aren't yet tradeable. Each entry carries a snapshot of the RSI gates that were in effect at placement time (including any current Rodeo Creep offset) and expires after a configurable window (default set in the Potential Entries config section). The 5-second RSI poller monitors this list independently; once all gates are cleared, the position opens immediately without waiting for the next full scan.
This watchlist also evicts any tickers that fail other filters such as over-extension, funding rate, volume divergence etc during the course of their watch. 

### Follow-Through Watchlist (`ftWatchlist`)
A display-only list rebuilt each scan cycle from the persisted `ftCandidates` roster. Shows the current status of every FT candidate — `LOW RSI`, `HIGH RSI`, `OVER-SHORTED`, `WAITING`, `MAX TRADES`, `VOL MOM`, or `READY` — along with its Rodeo/over-extension/Pile-on count and how many FT trades have been opened against it. The roster itself (`ftCandidates`) is persisted and survives restarts; the watchlist display is ephemeral.

### Rodeo Creep Panel
Not a tradeable watchlist but a live display of all symbols currently under active Rodeo Creep, showing the accumulated RSI gate offset and the countdown to expiry. Creep entries expire after 6 hours from the last qualifying close.

---

## Pollers

EverWinter runs four independent `setInterval` loops with different cadences and responsibilities.

### Scan Countdown (`_cdTimer`)
Fires every second. Decrements `bot.scanCd` for the UI countdown display and triggers the full `scan()` routine when it reaches zero. The interval between scans is configurable (`scanMins`, default 15 minutes).

### Position Watcher (`_watchTimer`)
Fires every **15 seconds**. Calls `watchPositions()` to fetch current mark prices and order fill status for all open positions, then dispatches to `ftWatchPositions()` for any FT-tagged positions. Handles TP drift correction, 12-hour time-decay phase transitions, 24-hour force-close, DCA stage progression, and SL placement after DCA3.

### Potential Entries Poller (`_potEntryTimer`)
Fires every **5 seconds**. For each symbol on the Potential Entries watchlist it fetches a fresh RSI (kline cache is force-evicted per symbol on every tick to prevent stale reads), re-checks all gates including current Rodeo Creep and volume divergence, and opens a short immediately if the symbol qualifies. This is the only routine that can open a position between main scan cycles.

### Market Refresh (`_refreshTimer`)
Fires every **60 seconds**. Calls `refreshMarket()` to update the gainer table with current prices and 24-hour change percentages. Does not trigger a scan and does not interfere with the scan countdown.

### Audio Keepalive (`_audioTimer`)
Fires every **25 seconds** when the bot is running. Replays a silent audio clip to maintain an active `AudioContext`, which prevents Android browsers from suspending the page when the screen is off or the tab is backgrounded. If the context is interrupted the **SYNC** indicator in the header blinks orange; tapping it attempts a manual resync.

---

## Scan Behaviour

A full scan runs at the configured interval or on demand via the **SCAN NOW** button. The sequence is:

1. **Prune** — expired Rodeo Creep entries are removed.
2. **Ticker fetch** — the top `topN + 10` gainers by 24-hour change are retrieved in a single call. Funding rates are extracted from the ticker payload and written to the kline cache to avoid per-symbol funding-rate requests later.
3. **Ticker snapshot** — the top `topN` tickers are stored as `_scanTickerSnapshot` for use by the Potential Entries poller's volume-divergence re-check (the poller cannot afford a fresh fetch on every 5-second tick).
4. **Per-symbol evaluation** — for each of the top `topN` symbols: klines are fetched once and shared across RSI6, RSI12, and RSI24 calculations; all gates are checked in order (funding filter → volume divergence → max positions → already open → RSI gates including Rodeo Creep → RSI6 max); qualifying symbols open immediately, near-threshold symbols are added to the Potential Entries watchlist.
5. **FT scan** — if Follow-Through is enabled, `scanFollowThroughs()` runs against the persisted `ftCandidates` roster.
6. **Countdown reset** — `bot.scanCd` is reset to `scanMins × 60`.

The kline cache (`_klineCache`) stores candle arrays keyed by `symbol_15` with a scan-interval TTL. Cache entries are evicted at the start of each scan cycle; the Potential Entries poller force-evicts its own entries on every tick for real-time accuracy.

---

## Stats Menu

The right-hand column contains several distinct sections.

### Session
Running totals for the current bot session: trade count, wins, losses, win rate, and net PnL in USDT. Also tracks **Force Closes** (positions closed by the 24-hour hard stop or laggard system) and **TP Reduces** (positions that transitioned to the 3% time-decay TP). The session timer shows elapsed time since the last **Start Bot**. Stats reset on **Clear Stats** or when the bot is stopped and restarted — they do not reset on page reload.

### Trade History
A compact summary of the closed-trade log: most recent symbol and result, best PnL percentage, and worst PnL percentage. The full feed is in the Trades column.

### Constants
Displays the computed SL exposure after DCA3 based on current notional and leverage settings. This is a read-only reference, not a configurable value.

### Rodeo Creep
Lists all symbols currently under active Rodeo Creep with their ride count, current RSI gate offsets, and countdown to reset. Empty when no creep is active.

### Extenders Counter 
Lists tickers that were recently "Over-Extended", shows the number of times they've returned over-extended again. Uses a timestamp based poll at scan time that allows synced RSI6 fetches to determine over-extension tick. 
Shows the current "VM" at scan time if "EXD" is currently active, the VM poller lasts 30 minutes. 

### Pile-ons Counter
Similar to the "Extenders" Counter, but keeps tab of tickers that have returned "Over-Shorted". 

### Persistence
Export and import controls for the full application state (config, session stats, trade history, positions, rodeo creep). Import overwrites all local data; open positions are preserved and re-synced on the next connect. A separate **Clear Stats** button in the Danger Zone resets only session counters and trade history without affecting config or open positions.

---

## Trades Menu

The Trades column (mobile: **📋 Trades** tab) is a reverse-chronological feed of all closed positions for the current session. Each card shows:

- Symbol, close direction, and win/loss badge
- Entry price, exit price, and DCA stage at close
- Duration, realised PnL (USDT and %), and close reason (`TP`, `Force`, `Manual`)
- For FT positions: the Rodeo count that qualified the entry, rendered in purple

The feed is rendered via a vanilla JS `renderTradeFeed()` function rather than Alpine `x-for` to avoid reactivity performance issues with large lists. A **CLEAR** button truncates the feed and resets the closed-trades array in state and storage.

---

## PseudoWinter (Simulation Mode)

PseudoWinter runs the complete EverWinter logic against live market data with phantom capital — no real orders are placed. It requires only a read-only API key and is suitable for strategy calibration before live deployment.

**Features (canonical specification; full integration into EverWinter is in progress):**

- All scan, RSI, and DCA logic runs identically to the live bot, including TP drift compensation and Rodeo Creep.
- Funding fees are deducted from simulated PnL over the duration of each phantom position.
- A **Closed Trades** scorecard section records each completed phantom trade with its symbol, DCA stage, duration, and PnL percentage.
- Latency compensation applies the same slippage model used by the live bot, giving an accurate representation of real execution timing.
- Operates correctly when opened via the local file system (i.e. `file://` protocol), unlike the Bybit public API which rejects cross-origin requests from file explorer contexts.

> PseudoWinter's closed-trade PnL scorecard and funding-fee accounting are implemented and canonical but not yet fully integrated into the live EverWinter build.

---

## ChartWinter

**ChartWinter** (`ChartWinter.html`) is a standalone companion charting tool in the same single-file format. It deviates by having a gray/ash visual theme, it has a compatible config schema with EverWinter, but operates entirely independently — no shared state, no inter-app communication.

### Core Function
ChartWinter runs its own configurable top-gainer scan (identical `topN`, `scanMins`, RSI gate, and funding-rate filter parameters) and renders a candlestick chart with a separate volume pane for the selected ticker. RSI values (RSI6, RSI12, RSI24) are computed client-side using Wilder's method, matching PseudoWinter's implementation exactly.

### Scan Results Panel
The left panel lists scan results with per-symbol price, 24-hour change, funding rate, and RSI6. Results can be sorted by change or RSI6. A full-text search mode lets you load any Bybit ticker directly, bypassing the scan filter.

### Charting
Charts are rendered via LightweightCharts. Kline data is cached per symbol and is exportable/importable as JSON. A configurable poll interval auto-refreshes the active chart. Lookback depth and the number of extended candles rendered are configurable.

### Persistent Price Lines
Users can draw, label, and colour-code horizontal price lines on any ticker. Lines are persisted per symbol in `localStorage` and survive page reloads. A **Manage Lines** modal allows editing and deletion.

### Settings Export / Import
All ChartWinter settings can be exported and re-imported as JSON, independent of EverWinter's state.

---

## Background Sync
Same as EverWinter. 

---