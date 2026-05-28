# ❄️ EVERWINTER

**EverWinter** is a single-file, browser-based bot for Bybit USDT Perpetuals targeting mean-reversion on top gainers via multi-timeframe RSI gating, tiered DCA, and a risk management suite. See the [Strategy Guide](https://github.com/Peng-Protocol/EverWinter/blob/main/Strategy_book.md) for entry logic and rationale.

---

## Technical Stack

- **Frontend:** Alpine.js, Bootstrap 5, "Glacier-Void" CSS theme
- **API:** Bybit V5 REST (`category: linear`)
- **Architecture:** Single-file HTML/JS — no build step, no backend. All API calls go directly to Bybit.
- **Persistence:** `localStorage` — config, session stats, trade history, and positions survive page reloads.
- **Credentials:** Keys held in volatile Alpine state; never transmitted outside `api.bybit.com`.

---

## Getting Started

1. Download `EverWinter1.0.html` and open it in any modern desktop or mobile browser.
2. Generate a Bybit API key with **Contract/Derivatives** read + trade permissions.
3. Enter the key pair in the API panel, configure leverage and margin, then click **Start Bot**.

---

## Position Types

EverWinter operates (4) distinct position archetypes:

* **Standard Gainer**
* **Advanced Follow-Through (ADV FT)**
* **Fund Chasing (FUN)**
* **Sale Fishing (SalF)**

All explained in the [Strategy Guide](https://github.com/Peng-Protocol/EverWinter/blob/main/Strategy_book.md). ADV FT, FUN, and SalF carry a unique badge; Standard Gainers carry none.

---

## Watchlists

### Potential Entries Watchlist
Symbols within a configurable RSI shortfall of the full entry gate (default 10%). The 5-second poller re-checks all gates and opens immediately on qualification — no waiting for the next full scan. Tickers failing other filters (OE, funding, volume divergence) are evicted mid-watch.

### Follow-Through Watchlist
ADV FT candidates only, rebuilt each scan from the persisted `ftCandidates` roster. Shows status per candidate with OE hit count (⚡) and trades opened. When full, eviction priority is lowest FR first, then oldest.

---

## Pollers

### Scan Countdown (`_cdTimer`)
Fires every second; triggers the full scan when it reaches zero.

### Position Watcher (`_watchTimer`)
Fires every 5 seconds. Handles TP drift, phase transitions, DCA stage progression, and SL placement.

### Potential Entries Poller (`_potEntryTimer`)
Fires every 5 seconds. Kline cache is force-evicted per symbol on every tick to prevent stale reads.

### Market Refresh
Manual-only in PseudoWinter via the **Refresh** button. Calls `pseudoWatchPositions()` and `watchPotentialEntries()` on demand.

### Audio Keepalive (`_audioTimer`)
Fires every 25 seconds; replays a silent clip to keep `AudioContext` alive on Android. The **SYNC** indicator blinks orange on interruption.

---

## Scan Behaviour

### 1. Gainers Scan (`runScan`)
1. **Ticker fetch** — all USDT perpetuals in one bulk call; funding rates and 24h volume seeded into kline cache.
2. **Gainer filter** — positive-change, non-BTC, price ≥ $0.001, sorted by 24h change. Top `topN + 10` retained; only `topN` evaluated.
3. **Per-symbol gates** — symbol banlist → ADV FT graylist → extender graylist → funding → high/low volume divergence → RSI proximity block → RSI6 max → RSI gate triplet (RSI6/RSI12/RSI24).
4. **Historical look-back** — ADV FT–eligible symbols with an OE this cycle are graylisted; no gainer entry opens.

### 2. FUN Scan
Runs inline after the gainers pass using the same bulk fetch. Per candidate: symbol banlist → position check → FR classification → slot check → FR gate (lock-in in Super FUN, creep in normal) → RSI6 OE look-back → loser OE reclassification → RSI6 proximity block → RSI minimum gate (RSI6/RSI12/RSI24 all ≥ `funRsiMin`, default 25) → vol momentum gate → LSA check for losers.

### 3. ADV FT Scan (`scanFollowThroughs`)
Runs against `ftCandidates` after `runScan`. Per symbol: funding → RSI floor (> 45) → RSI6 ceiling (< 75) → Close Confirmation (≥3 of last 4 15m bars red) → LSA band. ClC and LSA reuse `_klineCache[${symbol}_15]` — no extra fetch.

### 4. SalF Scan (`runSalfScan`)
Separate pass each cycle; evaluates gainers and losers pools. Per symbol: banlist → position check → funding → over-shorted filter → RSI floor → red candle count (≥3 of last 4) → LSA window → SalF median creep. Reuses cached 15m candles.

### 5. Extender Ticks
Once per cycle, tracked symbols within their 3h TTL fetch a fresh RSI6 and bump if still extended. Kline cache freshness is candle-boundary based: entries reuse until `lastCompletedTs` falls behind the current 15m boundary, then refresh automatically on the next close.

---

## Order Execution

### Take Profit Orders
TPs are placed as **GTC Limit Buy reduceOnly** orders — fills as maker, no market-order slippage on trigger. Each position tracks `tpOrderId`; the order is cancelled and replaced whenever the TP target changes. Any exchange-native TP on a position is cleared on first limit-TP placement. (Note; The bots use exchange native TPs as a precaution, then cancel them when a limit can be successfully placed. The exception is reduce phase which purely uses limit orders to prevent race conditions if immediately triggered). 

### Entry and Close Orders
Entries are **Market**. Force/manual closes are **Limit IOC** at `markPrice × 1.001`, falling back to Market if no mark is available. DCA adds are **conditional limit** (stop-limit) at the configured add price.

### Phase Management

**Take Profit Configuration & Debt Management**
Target profit boundaries are established dynamically, but execution logic heavily depends on the presence of collective debt and the active lifecycle phase. The bot adheres to the following procedural hierarchy:
* **Entry Phase:** The initial TP is set strictly at the time of position creation based on the configured ROI parameter.
* **Reduce Phase (No Debt):** If there is no collective debt, the `reduce` phase is respected and the profit target is overridden to a hard 3% floor to facilitate safe exits.
* **Debt Override (EDa TP):** If collective debt exists, the Effective Debt adjusted (EDa) TP configuration acts as an absolute override. The EDa TP is enforced across all phases (including normal and reduce), ensuring systemic debt recovery takes priority over standard lifecycle targets.

---

## Loss Absorption (Passive)

Passive, timer-based — fires every base interval (default 45 min) regardless of loss depth; cuts 5% of current size at market. No loss threshold is required; the cut fires whenever the interval elapses and the position has margin above the base floor. The base interval (`lossAbsorptionIntervalMins`) shortens per DCA stage when Passive Second Wind is enabled:

| DCA Stage | Interval |
|-----------|----------|
| 0 | base |
| 1 | ⅔ × base |
| 2 | ⅓ × base, min 5 min |
| 3+ | 5 min |

During re-entries in Super FUN mode the system uses "uPnL Absorption" which absorbs at a 30s interval if uPnL is; 

$$
-(\text{baseMargin} \times 0.20) 
$$

### Saved Margin (`_savedMargin`)
Each cut accumulates `cutMgn = cutQty × entryPrice / leverage` into `pos._savedMargin` after subtracting absorbed loss. Visible in the activity log as `| saved $X.XX`.

**Ruleset**
The bot employs a staged approach to unrealized loss absorption to optimize capital efficiency. Execution scales based on the current DCA depth of the position:
* **Stage 1 or Lower:** The bot(s) maintain the relative position minimum margin. Absorption logic is throttled to prevent unnecessary capital drain on positions hovering near the entry price.
* **Stage 2 and Beyond:** The system aggressively escalates to "cutting to the bone." The bot absorbs the position down to the base notional, minimizing exposure on deeply extended trades.

### Passive Second Wind
Fires when absorption is due but the position is at minimum margin and `_savedMargin > 0`. Computes `extraStages = floor(_savedMargin / baseMargin)` and places that many conditional orders above the last stage trigger at 3% compounding increments, each stamped `_secondWind: true`. After activation: `_stageCount` expands, SL is recomputed to the new highest stage, and the interval resets to relative stage 0 from `_secondWindBaseStage` — the bot re-earns faster intervals as second-wind stages fill.

### Infinite Second Wind (toggle, default on)
When enabled, second wind re-fires each time enough margin has been saved since the last activation — there is no single-use cap. Savings from every absorbing position are pooled across all open positions' `_savedMargin`, so every position can accumulate second-wind runway funded by the whole book. The laggard's `runtimeHours` force-close is suspended, letting it run until its EDa TP is hit.

---


## Congestion Auto-Reduce

When **Laggard Auto-Reduce** is enabled and open positions reach `laggardAutoReduceThreshold` (or `maxPos`), positions are pushed into reduce phase early.

- Positions already at effective TP ROI `≤ 3%` (including TP ingress-reduced entries) are skipped — they are already at reduce-floor TP.
- If EDa is not valid/placeable on that tick, it falls back to native **3% TP**.

This means congestion can fire correctly while making no visible TP change on positions already at 3%.

---

## Stats Menu

### Session
Trade count, wins, losses, win rate, net PnL, Force Closes, and TP Reduces. Resets on **Clear Stats** or bot restart; survives page reload.

### FUN Lock-in
Super FUN mode only. Each FUN close stamps a minimum FR re-entry gate for that symbol (`funFundingHigh` for HFG/HFL/OE, `funFundingLow` for LFG/LFL). At 1+ closes in the 6h window: fast absorption activates on any open FUN position; with absorption off, re-entry is deferred entirely.

### FUN VM Creep
Per-symbol VM floor creep in normal FUN mode. Shows close count, effective VM floor per sub-type, FR re-entry gate, and 6h TTL countdown. OE hits shown inline with multiplicative VM effect.

### TP Ingress
Per-symbol TP reduction for non-Gainer strategies. Each close multiplies the stage-0 TP by `0.5^count`, floored at `minTpRoi` (default 3%). Resets after a 3h TTL.

### SalF Creep
Per-symbol LSA window tightening after SalF closes. Floor rises and cap falls toward midpoint per close count. 6h TTL.

### Activity Log
300-entry capped feed; colour-coded: `scan` (light blue), `trade` (ice blue), `success` (green), `warn` (amber), `error` (red), `info` (muted). Cleared on **Clear Stats**.

### Persistence
Full-state export/import (config, stats, trades, positions). Import overwrites all local data; open positions re-sync on next connect.

---

## Trades Menu

Reverse-chronological feed of closed positions: symbol, entry/exit price, DCA stage, duration, PnL, close reason. Rendered via `renderTradeFeed()`, not Alpine `x-for`, to avoid reactivity issues on large lists. Old cards are rolled up into a period card as the list grows.

> **Session PnL vs Trades:** These won't match — expected. Absorption cuts credit PnL immediately without a trade card. The laggard's EDa TP close shows inflated PnL because it includes recovered book losses; session PnL booked those losses early and the trades feed shows the recovery late.

---

## PseudoWinter (Simulation Mode)

PseudoWinter runs the complete EverWinter logic against live market data with phantom capital — no API key required, no real orders. Funding fees are deducted from simulated PnL. Works from `file://` protocol where Bybit's public API would reject cross-origin requests.

---

## PsychoWinter

**PsychoWinter** (`PsychoWinter1.0.html`) is a standalone single-file bot running Psycho Mode — no RSI gates, ADV FT, FUN, SalF, or TP reduce. `localStorage` namespaced separately (`psychowinter_v1`). Runs pseudo by default; live mode requires Bybit credentials.

### Positions Menu

Open position feed. Sort buttons: **PnL**, **DCA** (by triggered stage, not current band), **Mgn**. DCA stage boxes show: triggered, current band, set (live conditional), queued (5-min delay), missed, default. The SL displayed is pre-computed from simulated full-stage fill — **no actual SL fires until the final stage fills**.

### Trades Menu

Reverse-chronological closed feed. Rapid force/laggard closes roll up per 15-minute window: ticker count, net PnL/ROI, wins, common DCA, avg duration, best/worst performers. Rolls up old trades into a period roll-up to avoid the 200 max entries cap. 

### Log Menu

Session counters, laggard status (buffered EV, lost value, deficit; "→ CLOSING" when deficit hits zero), Open Now snapshot, DCA Spread (S0–S7), Conditionals table, EXHUMED table (absorbed loss, EH TP, cut count, distance-to-TP; ✦ = also laggard). Activity log capped at 300 entries. Rolls up similar messages within 15 minute window. 

### Scan Control

**START/STOP SCAN** controls only new-position entry — position management, absorption, laggard, and cascade continue regardless. **SCAN NOW** manually triggers a cycle.

### Scan

Bulk ticker fetch → filter by absolute 24h change ≥ threshold → Fisher-Yates shuffle → first `psychoPerCycle` not already held → SHORT each. Halts at position cap.

### Position Watcher

Fires every 5 seconds regardless of scan state; single bulk mark-price fetch per tick. Per position: DCA trigger → TP check → funding accrual → force-close deadline → SL after final stage. One full linear book download every 5 seconds (~12 req, 600–1,200 KB/min).

### Loss Absorption (Aggressive)

Triggers at 2.5× base margin loss; cuts 5% at market. Speeds up with each uninterrupted round. 

| Round (rel) | Interval |
|-------------|----------|
| 0 | 5 min |
| 1 | ~3 min 20 s |
| 2 | ~1 min 40 s (min 30 s) |
| 3+ | 30 s |

Resets if the ticker falls below threshold, floors at 30 s. Paused during pending DCA delay windows and when stage 7 is placed or triggered.

**Outlier Acceleration** — positions whose margin or absolute loss exceeds 2.5× the book average absorb at the 30 s floor. Deferred if a single 5% cut would crystallise > 2.5× base notional. Updates average entry price and TP. 

**Outlier Deceleration** — positions whose  margin deficit is 2.5× the book average have 5% added at market. Same cooldown as acceleration.

### Exhumation

If a position's absorption tab shows net negative PnL, it is exhumed and assigned an EH TP:
```
exhEdaTp = entryPrice − (buffedEV + |absorbedLoss|) × entryPrice / (leverage × margin)
```
Exhumed positions block regular TP, recompute EH TP on each DCA fill or absorption cut, and suspend laggard force-close. Only SL or EH TP can close them (sacrifice as last resort). Clears when `tab.totalPnl ≥ 0`.

### Laggard

Evaluates oldest position (or deepest-stage with **Age Mode**); force-closes when `buffedEV − lostValue − uPnL ≤ 0`. Every close and absorption cut feeds into the lost-value tally. **80% margin floor**: cuts skipped if they'd leave < 80% of base margin, preventing EDa TP from computing negative. **Profit Offset** scales the EV buffer (default +50% = 1.5× EV); **Laggard Absorption** trims 5% every 5 min instead of force-closing.

### Cascade Trigger

When collective uPnL exceeds 2.5× entry margin, closes the 2 most profitable non-laggard, non-exhumed positions. Closed PnL feeds the laggard's lost-value tally. 5-minute cooldown.

### Position Cascade Trigger

When any single position's loss drops below −2.5× entry margin, closes the most profitable position and runs a scan to replace it. Each successive trigger closes more positions per the **PPC Escalation Multiplier** (default 2×: 1, 2, 4, 8…). Exhumed positions excluded.

### Sacrifice and Retraction

Sacrifice activates when allocated margin exceeds 4× the per-position baseline; closes one position per cycle (priority: DCA-staged, near break-even; exhumed last; laggard excluded). **Retraction** is a second trigger: collective uPnL below −2.5× entry margin activates sacrifice regardless of margin ratio.

---

## ChartWinter

**ChartWinter** (`ChartWinter.html`) is a standalone chart and scan research tool sharing EverWinter's config schema. Runs its own scan with RSI and funding-rate parameters; computes RSI6/RSI12/RSI24 client-side via Wilder's method. Gainers/Losers toggle, configurable change range, pinnable tickers, persistent price/candle lines saved per symbol in `localStorage`.

---
