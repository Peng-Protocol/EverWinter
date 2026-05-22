# ❄️ EVERWINTER

**EverWinter** is a single-file, browser-based bot for Bybit USDT Perpetuals. It targets mean-reversion opportunities on top gainers using multi-timeframe RSI gating, tiered DCA, and a suite of risk management routines. This document covers the application's architecture, UI sections, position lifecycle, and polling behaviour. For the underlying trading strategy — including entry logic, RSI gate tuning, and risk rationale — see the [Strategy Guide](https://github.com/Peng-Protocol/EverWinter/blob/main/Strategy_book.md).

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

EverWinter operates (5) distinct position archetypes. All share the same DCA/TP mechanics but differ in how they are entered and how re-entry state is tracked. These are:

* **Standard Gainer ()**
* **Follow-Through (FT)**
* **Advanced Follow-Through (ADV FT)**
* **Fund Chasing (FUN)**
* **Sale Fishing (SalF)**

All of which are explained in the [Strategy Guide](https://github.com/Peng-Protocol/EverWinter/blob/main/Strategy_book.md).

### Position Badges
FT, ADV FT, FUN, and SalF positions each carry a unique badge pinned to their header. Standard Gainers carry no badge.

---

## Watchlists

EverWinter maintains (2) distinct watchlists, each with different entry criteria and lifecycle rules.

### Potential Entries Watchlist
Populated during each main scan pass for symbols that are within a configurable RSI shortfall percentage of the full entry gate (default 10%). These are near-threshold candidates that aren't yet tradeable. Each entry carries a snapshot of the RSI gates that were in effect at placement time (including any current Rodeo Creep offset) and expires after a configurable window (default set in the Potential Entries config section). The (5)-second RSI poller monitors this list independently; once all gates are cleared, the position opens immediately without waiting for the next full scan.
This watchlist also evicts any tickers that fail other filters such as over-extension, funding rate, volume divergence etc during the course of their watch.

### Follow-Through Watchlist (`ftWatchlist`)
A display-only list rebuilt each scan cycle from the persisted `ftCandidates` roster. Shows the current status of every FT candidate — `LOW RSI`, `HIGH RSI`, `OVER-SHORTED`, `WAITING`, `MAX TRADES`, `VOL MOM`, or `READY` — along with its count and how many FT trades have been opened against it. For regular FT entries the count is Rodeo rides; for ADV FT entries (marked ⚡) the count is over-extension hits within the 3h window. The roster itself (`ftCandidates`) is persisted and survives restarts; the watchlist display is ephemeral.


---

## Pollers

EverWinter runs (5) independent `setInterval` loop groups with different cadences and responsibilities.

### Scan Countdown (`_cdTimer`)
Fires every second. Decrements `bot.scanCd` for the UI countdown display and triggers the full scan cycle when it reaches zero. The interval between scans is configurable (`scanMins`, default (15) minutes).

### Position Watcher (`_watchTimer`)
Fires every (5) seconds. Calls `pseudoWatchPositions()` to fetch current mark prices for all open phantom positions. Handles TP drift correction, (12)-hour time-decay phase transitions, (24)-hour force-close, DCA stage progression, and SL placement after DCA3.

### Potential Entries Poller (`_potEntryTimer`)
Fires every (5) seconds. For each symbol on the Potential Entries watchlist it fetches a fresh RSI (kline cache is force-evicted per symbol on every tick to prevent stale reads), re-checks all gates including current Rodeo Creep and volume divergence, and opens a phantom short immediately if the symbol qualifies. This routine can open a gainer position between main scan cycles.


### Market Refresh
Manual-only in PseudoWinter, triggered via the **Refresh** button. Calls `pseudoWatchPositions()` and a forced pass of `watchPotentialEntries()` to update prices and re-evaluate the watchlist on demand.

### Audio Keepalive (`_audioTimer`)
Fires every (25) seconds when the bot is running. Replays a silent audio clip to maintain an active `AudioContext`, which prevents Android browsers from suspending the page when the screen is off or the tab is backgrounded. If the context is interrupted the **SYNC** indicator in the header blinks orange; tapping it attempts a manual resync.

---

## Scan Behaviour

A full scan cycle runs at the configured interval or on demand via the **SCAN NOW** button. The cycle calls two sequential routines:

### 1. Gainers Scan (`runScan`)
1. **Ticker fetch** — all USDT perpetuals are retrieved in a single bulk call. Funding rates and 24h volume baseline are seeded from the payload into the kline cache, avoiding per-symbol funding-rate requests later.
2. **Gainer filter** — positive-change, non-BTC USDT tickers with a last price ≥ $0.001 are sorted by 24h change descending. The top `topN + 10` are retained; only the top `topN` are evaluated.
3. **Per-symbol evaluation** — for each of the top `topN` symbols, gates are checked in order: symbol banlist → ADV FT graylist → extender graylist → funding filter → high-volume divergence filter → low-volume divergence filter → RSI proximity block → RSI6 max (over-extension) → RSI gate triplet (RSI6/RSI12/RSI24 with Rodeo Creep offset). Qualifying symbols open immediately; near-threshold symbols enter the Potential Entries watchlist.
4. **Historical look-back** — for ADV FT–eligible symbols that pass all other gates, a historical RSI6 peak fetch checks whether the symbol already experienced an over-extension this cycle. Missed extenders are graylisted and bumped without opening a gainer entry.

### 2. FUN Scan
Runs inline within `runScan` after the gainers pass. Evaluates the top `funGainerN` gainers and worst `funLoserN` losers (−3% to −99%) from the same bulk ticker fetch — no additional API calls for price or funding data.

For each candidate, the FUN scan applies: symbol banlist → existing position check → funding rate classification (sub-type and slot cost determined by FR level) → slot check → FR creep gate → historical RSI6 over-extension look-back (3h, 15min candles) → loser OE reclassification (losers with any over-extension in the look-back are evaluated under the gainers gate, as their behavior matches a gainer) → RSI6 proximity block → vol momentum gate (separate thresholds for gainers vs. losers, creeping upward with each close and scaling multiplicatively with over-extension count) → LSA check for losers (last completed candle must show positive but non-spike volume relative to the window average).

### 3. FT/ADV FT Scan (`scanFollowThroughs`)
Runs after `runScan` against the persisted `ftCandidates` roster. Per symbol, gates are checked in order: funding rate → RSI floor (> 45 for ADV FT with no upper ceiling, 20–60 for regular FT) → Close Confirmation / ClC (ADV FT only: ≥3 of last 4 completed 15m bars must be red) → LSA band gate (ADV FT only: last candle volume ≥ floor% and ≤ cap% of window average). Opens FT or ADV FT shorts when all conditions pass. ADV FT carries no RSI ceiling — LSA and ClC are competent enough to time entries into OE tickers.

Both ClC and LSA read directly from the `_klineCache[${symbol}_15]` entry already populated by the RSI gate check (`fetchRSIMulti`). No additional kline fetch is required — the same 15m candle array is reused for RSI computation, red-candle counting, and volume analysis.

### 4. SalF Scan (`runSalfScan`)
Runs as a separate pass each cycle. Evaluates tickers from both the top gainers pool and the worst losers pool for Sale Fishing entries. Per symbol, the scan checks (in order): symbol banlist → existing position check → funding rate gate → over-shorted filter → RSI floor (RSI6/RSI12/RSI24 all above minimum) → red candle count (≥ 3 of the last 4 completed 15m bars must be red) → LSA window (last-hour volume must be within the configured floor/cap relative to the 24h hourly average) → SalF median creep adjustment.

The LSA calculation reads directly from the `_klineCache[${symbol}_15]` entry that was already populated by the RSI gate check (`fetchRSIMulti`). No additional kline fetch is required — the 15-minute candle array is reused for both RSI computation and volume analysis.

### 5. Extender Ticks
Once per cycle, the extender counter table is polled. Each tracked symbol that is within its 3h TTL and has not been checked this cycle fetches a fresh RSI6; if it is still over-extended the counter is bumped.

The kline cache (`_klineCache`) stores candle arrays keyed by `symbol_15`. Freshness is determined by candle boundary rather than wall-clock TTL: each entry records `lastCompletedTs` (the open timestamp of the last completed candle, i.e. the second-to-last entry in the Bybit response). A cached entry is reused until `lastCompletedTs` falls behind the current 15m boundary, meaning no redundant fetches occur within a candle and a refresh happens automatically as soon as the next candle closes. The Potential Entries poller still force-evicts its own entries on every tick for real-time accuracy.

---

## Order Execution

### Take Profit Orders
Take profit targets are placed as **GTC (Good-Till-Cancelled) Limit Buy reduceOnly** orders rather than exchange-native stop orders. This means the TP sits as a passive limit order in the book and fills as a maker when price reaches it — eliminating market-order slippage on trigger.

Each position tracks its active TP order ID (`tpOrderId`). When the TP target changes — due to a DCA stage shift, reduce-phase recalculation, or drift correction — the existing limit order is cancelled and a new one placed at the updated price. Any exchange-native TP already set on a position is cleared when the first limit TP is placed, preventing double-trigger.

On manual or forced close, the TP limit order is cancelled before the close order is sent.

### Entry and Close Orders
Entry orders are placed as **Market** orders for immediate fill. Forced and manual closes use a **Limit IOC** order at `markPrice × 1.001` (0.1% slippage ceiling above mark), falling back to Market only if no mark price is available. DCA add orders are placed as **conditional limit** orders (stop-limit) triggered at the configured add price.

---

## Stats Menu

The right-hand column contains several distinct sections.

### Session
Running totals for the current bot session: trade count, wins, losses, win rate, and net PnL in USDT. Also tracks **Force Closes** (positions closed by the (24)-hour hard stop or laggard system) and **TP Reduces** (positions that transitioned to the 3% time-decay TP). The session timer shows elapsed time since the last **Start Bot**. Stats reset on **Clear Stats** or when the bot is stopped and restarted — they do not reset on page reload.

### Trade History
A compact summary of the closed-trade log: most recent symbol and result, best PnL percentage, and worst PnL percentage. The full feed is in the Trades column.

### Constants
Displays the computed SL exposure after DCA3 based on current notional and leverage settings. This is a read-only reference, not a configurable value.

### Rodeo Creep
Lists all symbols currently under active Rodeo Creep with their ride count, current RSI gate offsets, and countdown to reset. Empty when no creep is active.

### FUN VM Creep
Lists all symbols currently under active FUN vol momentum creep. Each entry shows the close count, the live effective VM floor for each sub-type (HFG, LFG, HFL, LFL), the current FR re-entry gate (seeded at 1% after first close, scaling ×1.5 per close), and the countdown to the 6h TTL reset. Over-extension hits are displayed inline with an ⚡ counter and their multiplicative effect on the VM threshold. Only visible when FUN vol momentum is enabled.

### SalF Creep
Lists all symbols currently under active SalF median creep. Each entry shows the close count, the effective LSA floor and cap currently in effect for that symbol, and the countdown to the 6h TTL reset. As the close count increases, the floor rises and the cap falls toward the midpoint, tightening the window within which a re-entry can qualify. Only visible when SalF is enabled.

### Activity Log
A capped reverse-chronological event feed, holding a maximum of (300) entries. Each entry is timestamped and colour-coded by type: `scan` events (light blue) cover scan cycle summaries and FT roster changes; `trade` events (ice blue) record every order open, DCA trigger, and close; `success` entries (green) confirm connections and bot start; `warn` entries (amber) cover Rodeo Creep registrations, TP reductions, and non-fatal anomalies; `error` entries (red) flag API failures and scan errors; and `info` entries (muted) carry general status messages. The log is purely observational — it has no effect on bot state and is cleared on **Clear Stats**.

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

> **Session PnL vs Trades feed:** The session PnL counter and the sum of all trade cards will often not match — this is expected. Two things cause this. First, loss absorption cuts are realised and credited to session PnL in real time but do not produce a trade entry in the feed; the absorbed loss sits as a deficit on the laggard's ledger until it is recovered. Second, when the laggard eventually closes it does so at a higher profit than a normal TP close would have produced — the EDa TP is buffered by default (+50% profit offset), meaning the laggard must earn at least 1.5× its original expected value before the deficit clears, plus any accumulated losses from the rest of the book. The laggard's trade card will therefore show an unusually large PnL relative to other closes; the excess above a normal TP close is the book's recovered losses appearing as laggard profit in the feed. Session PnL counted those losses early; the trades feed shows the recovery late. The two figures converge as the laggard cycle completes.

---

## PseudoWinter (Simulation Mode)

PseudoWinter runs the complete EverWinter logic against live market data with phantom capital — no real orders are placed, and **no API key is required**. It uses only Bybit's public market data endpoints and is suitable for strategy calibration before live deployment.

**Features:**

- All scan, RSI, FUN, FT/ADV FT, and DCA logic runs identically to the live bot, including TP drift compensation, Rodeo Creep, FUN VM Creep, and the extender/ADV FT pipeline.
- Funding fees are deducted from simulated PnL over the duration of each phantom position.
- A **Closed Trades** scorecard records each completed phantom trade with its symbol, DCA stage, duration, and PnL percentage.
- Latency compensation applies the same slippage model used by the live bot, giving an accurate representation of real execution timing.
- Operates correctly when opened via the local file system (i.e. `file://` protocol), unlike the Bybit public API which rejects cross-origin requests from file explorer contexts.

---

## PsychoWinter

**PsychoWinter** (`PsychoWinter1.0.html`) is a standalone single-file bot running Psycho Mode exclusively — no RSI gates, FT/ADV FT pipelines, FUN, SalF, rodeo, or TP reduce. Same Alpine.js / Bootstrap 5 / Bybit V5 REST stack as EverWinter. `localStorage` is namespaced separately (`psychowinter_v1`). Runs in **pseudo** mode by default (no API key required); live mode requires Bybit Contract/Derivatives credentials.

### Config Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `liveMode` | false | Pseudo or live trading |
| `apiKey` / `apiSecret` | — | Bybit credentials (live mode only) |
| `testnet` | false | Use Bybit testnet endpoints (live mode only) |
| `leverage` | 6 | Leverage on all positions |
| `minNotional` | 6 | Entry notional (USDT, min 6 max 66); DCA stages scale from this |
| `maxPositions` | 50 | Open position cap; scanning halts at cap |
| `psychoChangePct` | 3 | Min absolute 24h change % to qualify a ticker |
| `psychoPerCycle` | 12 | Tickers shorted per scan cycle |
| `scanMins` | 15 | Scan interval in minutes |
| `dcaStages` | 7 | DCA add stages beyond entry |
| `dcaMultiplier` | 2 | Notional multiplier per stage |
| `entryTpRoi` | 6 | Entry-stage TP ROI%; decays per stage, floors at 3% |
| `runtimeHours` | 48 | Hard force-close deadline per position |
| `laggardCheckEnabled` | true | Enable laggard force-close |
| `laggardProfitOffset` | 50 | Laggard EV buffer % (50 = 1.5× EV) |
| `cascadeTriggerEnabled` | true | Enable cascade trigger |
| `cascadeTriggerUPnL` | 2.50 | Collective uPnL threshold to fire cascade trigger |

The **Live Trading** toggle switches between pseudo and live mode. The switch is locked while the bot is running and also respects the config lock. In pseudo mode no API key is required and no real orders are placed — all logic runs against live market data with phantom capital. In live mode, Bybit Contract/Derivatives credentials are required and real orders are placed.

A **config lock** button sits above the start/stop controls. When locked, all sliders and fields are disabled regardless of whether the bot is running — useful as a safeguard against accidental changes between sessions.

### Positions Menu

Open position feed showing symbol, DCA stage indicator, entry/mark price, unrealised PnL and ROI%, time open, next add price, TP price, and a force-close countdown. The oldest position shows a laggard debt indicator when laggard is active.

Two sort buttons appear at the top of the feed:

- **PnL** — sorts open positions by unrealised PnL, toggling descending → ascending → unsorted.
- **DCA** — sorts by DCA stage triggered (not the band the mark price currently sits in), toggling the same cycle. Switching either sort resets the other.

#### DCA Stage Boxes

Each position card shows a 2×4 grid of stage boxes (0–7). Each box reflects the live state of that stage:

- **Triggered** (solid red tint) — the stage has actually filled; stage 0 is always in this state.
- **Current + triggered** (red hatched) — mark is in this price band and the stage has already filled; the position is actively in danger territory it has already crossed.
- **Current + not triggered** (orange hatched) — mark is approaching this band but the add hasn't fired yet.
- **Set** (gold border) — a conditional order for this stage is live on the exchange, waiting to fill.
- **Queued** (dim orange border) — the stage is pending the 5-minute DCA delay; no conditional has been placed yet but one is scheduled.
- **Missed** (grey dashed) — price moved through this stage too quickly for the add to be placed; the stage was skipped.
- **Default** (dim border) — stage not yet reached.

#### Progress Bar

The bar below the stage grid changes meaning depending on where mark sits:

- **Profit zone** (mark ≤ average entry) — green bar showing progress from average entry toward the current TP price.
- **Loss zone, between stages** (orange, red from stage 5+) — bar spans from the last filled stage's trigger price to the next placed conditional's trigger price, showing how far into the current DCA band mark has travelled.
- **Loss zone, beyond all placed conditionals** (red) — once mark has cleared every placed conditional, the bar switches to tracking distance from the last conditional's trigger price toward the **estimated SL price**. This is the most important state to understand: the bar is measuring proximity to the stop, not to the next add.

#### SL Timing

The SL price displayed on the card is pre-computed at position open by simulating all stages filling and finding the projected weighted-average entry. It is used as the upper bound of the red progress bar from the start. However, **no actual SL is enforced until the final configured DCA stage fills** — only then does the bot treat the SL as live and close the position if mark reaches it. Before that point, a position can pump well past the displayed SL price without being stopped out; the DCA delay windows and wick recovery are relied on instead. The red bar in this state is therefore a warning indicator, not a live stop distance.

### Trades Menu

Reverse-chronological feed of all closed positions. Each card shows entry/exit price, DCA stage, duration, PnL, and close reason.

Force closes and laggard closes that occur in rapid succession are **rolled up** into a single grouped entry rather than flooding the feed. Each rollup covers a 15-minute window and summarises: ticker count, net PnL and ROI, win/loss breakdown, average DCA stage, average duration, and best/worst performers by both PnL and ROI. Standalone TP and SL closes always appear as individual entries.

### Log Menu

Session counters at the top: trades, wins, losses, net PnL, win rate, force closes, and cascade closes (visible once at least one cascade has fired).

**Laggard status** — live view of the current laggard candidate: buffered expected value, accumulated lost value, current uPnL, and the buffered expected deficit. Turns red and shows "→ CLOSING" when the deficit hits zero.

**Open Now** — at-a-glance stats across all open positions: best uPnL, worst uPnL, and highest DCA stage reached.

**DCA Spread** — counts how many open positions are currently at each stage (S0–S7). Stages 0–3 display in orange; S4 and above display in red. Only visible when positions are open. This gives an instant read on how deep the book is sitting — something not surfaced in other EverWinter bots.

The **activity log** is a capped reverse-chronological event feed (300 entries) with an internal scroll. Force rollup entries are rendered inline with their full breakdown rather than as plain text.

### Config

Parameters listed above. DCA Ladder shows computed notional, margin, and cumulative totals per stage. TP Schedule shows ROI% and price target per stage.

### Scan

Bulk ticker fetch → filter by absolute 24h change ≥ threshold → Fisher-Yates shuffle → take first `psychoPerCycle` not already held → open SHORT on each. Halts early when open positions hit the cap. Resumes on the next scheduled cycle once positions clear.

### Position Watcher

Fires every 5 seconds. Bulk-fetches mark prices for all open positions. Per position: DCA trigger check (places next add and recalculates TP if breached) → TP hit check → 8h funding fee accrual → hard force-close deadline check → SL placement after the final DCA stage fills. After every close, updates the lost-value tally on all remaining open positions.

### Loss Absorption

Runs on each position watcher tick. Triggers on any position whose unrealised loss exceeds 2.5× base margin. Each cut closes 5% of the position's current size at market.

The interval between cuts starts at 5 minutes and **halves with every successive cut** — 5 min → 2.5 min → 1.25 min → … down to a 30-second floor. The count is per-position and persists as long as the position stays below the threshold. If the position recovers above the -2.5× threshold at any watcher tick, the cut counter **resets to zero**, so the next cut (if the position falls back below threshold) restarts the full 5-minute interval. There is no gradual ramp-up — recovery snaps the cooldown back to 5 minutes immediately.

Absorption is paused while a DCA stage is queued for delayed placement; the incoming add may improve the average entry enough to lift the position back above threshold, making absorption unnecessary. Absorption stops entirely once the final DCA stage has triggered. If a position is already at minimum notional when a cut is due, it is closed outright rather than trimmed further.

#### Outlier Positions

When **Outlier Acceleration** is enabled, absorption identifies positions that are disproportionate relative to the rest of the book. A position is flagged as an outlier if its margin or absolute unrealised loss exceeds the configured multiplier (default 2.5×) of the average across all other open positions. Outlier positions skip the normal halving schedule and are absorbed at the 30-second minimum cooldown immediately — the book treats them as requiring urgent reduction.

There is a digestibility limit: if the loss that a single 5% cut would crystallise exceeds 2.5× the base notional, the cut is deferred rather than executed. The position is re-examined after 30 seconds, and the bot waits until a cut of digestible size presents itself — either because the mark has partially recovered or because previous cuts have reduced the position size enough to bring the per-cut loss back within range. The minimum cooldown is maintained during the deferral so the check runs as frequently as possible without over-crystallising a single bad entry.

**Outlier Deceleration** is the mirror image of acceleration. Where acceleration trims positions that are too large or too deeply underwater, deceleration adds to positions that are outlier performers or outlier small — either their unrealised profit is 2.5× or more above the average of all others, or their margin is 2.5× or more below the book average. When either condition holds, the bot adds 5% of the position's current margin (minimum base notional) at market, updating the weighted-average entry price. The same cooldown mechanics apply: the interval starts at 5 minutes and halves with each successive add down to a 30-second floor, resetting to zero when the position is no longer an outlier.

Both acceleration and deceleration are paused while a DCA stage is queued for delayed placement, for the same reason as loss absorption: the pending add may shift the position's size, average entry, or unrealised PnL enough to change whether it qualifies, making any action taken during that window premature.

### Laggard

Active whenever there are at least 2 open positions — no reduce-phase gate. Evaluates the oldest position; force-closes it when `buffedEV − lostValue − unrealizedPnL ≤ 0`. Every position close (win or loss) feeds its PnL into the lost-value tally of all survivors. Loss absorption cuts do the same — each slice realised by absorption is immediately added to every position's lost-value tally, and the EDa TP is recomputed on the spot. If the laggard itself is the absorbed position, the reduced margin is already reflected in that recompute: smaller margin in the denominator widens the required price move, so the EDa TP adjusts proportionally without any separate correction step.

**Age Mode** changes which position is selected as the laggard. Default (off) picks the oldest position by open time. Age Mode on picks the position with the most DCA stages triggered — the one deepest in the hole takes priority regardless of how long it has been open. Age Mode is more aggressive: it targets the position most likely to require a large move to close rather than simply the one that has been open longest.

**Profit Offset** scales the buffered EV target. At +50% (default), the laggard must generate 1.5× its original expected value before the deficit clears — this gives winning closes more time to reduce the accumulated lost value before the laggard is forced out. Negative offsets shrink the buffer, making the laggard trigger faster but with less recovery margin. At −100% the buffer is fully removed and the laggard closes at exactly EV parity.

**Laggard Absorption** changes what happens when the deficit hits zero and the laggard is still in loss: instead of force-closing, the bot trims 5% of its size every 5 minutes, keeping the position alive while gradually reducing its exposure. This is useful when the laggard is deeply underwater but the thesis for a recovery is still intact — full force-close crystallises the maximum loss, while absorption bleeds it down incrementally and gives the price time to correct.

### Cascade Trigger

When the combined unrealised PnL across all open positions exceeds 2.5× the entry margin, the bot force-closes the 2 most profitable positions. This banks the gains immediately and passes their closed PnL into the laggard's lost-value tally — if the wins are large enough, they can push the deficit negative and release the laggard without it needing to reach EDa TP at all. The cascade is the deliberate use of profit-taking to fund the book's debt settlement. A 5-minute cooldown prevents repeated firing on the same event.

The threshold is fixed at 2.5× entry margin and scales automatically with notional and leverage — it is not configurable separately.

### Position Cascade Trigger

Similar intent to the Cascade Trigger but fires from the loss side rather than the profit side. When any single position's unrealised loss drops below −2.5× entry margin, the bot closes the most profitable open position to generate a laggard-seeding close, then immediately runs a scan to replace it. This keeps the book circulating rather than letting a single deep loser stall everything.

Each successive trigger in the same session closes more positions than the last, governed by the **PPC Escalation Multiplier**. At 2× (default), the first trigger closes 1 position, the second closes 2, the third closes 4, and so on. The count resets when no position remains below the trigger threshold. The **Cascade Close Min ROI** floor applies here too — only positions above the minimum ROI qualify as targets, preventing the bot from closing marginal winners that would not meaningfully reduce the deficit.

### Sacrifice and Retraction

Sacrifice monitors the ratio of allocated margin to what the full position cap would cost at entry stage. When allocated margin exceeds 4× that baseline — meaning the book has DCA'd heavily and is carrying far more exposure than a fresh book would — sacrifice halts scans and closes one position per cycle until the ratio drops back. Priority goes to positions that have triggered at least one DCA stage and are within 3% of break-even, since those are the ones most likely to close without a significant loss. The **Position Floor** prevents sacrifice from closing below a minimum number of open positions regardless of the ratio.

**Retraction** adds a second tripwire on top of sacrifice: when the collective unrealised PnL of all open positions falls below −2.5× entry margin, sacrifice mode activates regardless of the margin ratio. Where normal sacrifice is a margin-usage alarm, retraction is a drawdown alarm — it fires on deep collective red even if the book is not particularly over-allocated. Both conditions halt scans while active.

---

## ChartWinter

**ChartWinter** (`ChartWinter.html`) is a standalone companion tool for chart analysis and scan research. It shares EverWinter's config schema but operates entirely independently — no shared state, no inter-app communication.

It runs its own configurable scan using the same RSI and funding-rate parameters, renders candlestick charts with a volume pane, and computes RSI6/RSI12/RSI24 client-side using the same Wilder's method as EverWinter. Scan results list price, 24h change, funding rate, and RSI values per symbol with sorting and strategy badge indicators. A Gainers/Losers toggle switches scan direction; the change range is manually configurable.

Tickers can be searched directly or pinned — pinned tickers appear at the top of every scan. Persistent horizontal price lines and vertical candle lines can be drawn on any chart and are saved per symbol in `localStorage`. All settings export and import as JSON.

---
