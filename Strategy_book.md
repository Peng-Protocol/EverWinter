# Winter-Chaser Strategy Book
**A Comprehensive Guide For All Seasons**

---

## Table of Contents
1. [Philosophy Overview](#philosophy-overview)
2. [Techniques](#techniques)
   - [Proactive Techniques](#proactive-techniques)
   - [Reactive Techniques](#reactive-techniques)
3. [Strategies](#strategies)
   - [Gainers](#gainers-strategy)
   - [Losers](#losers-strategy)
   - [Psycho Mode](#psycho-mode)
4. [Sizing](#sizing)
5. [Conclusion](#conclusion)

---

## Philosophy Overview

The system has no directional bias. PseudoWinter opens shorts; PseudoChaser opens longs. Together they cover both sides of the market from the same analytical framework.

The core insight is about **meta-structure**, not individual tickers. On any given day the market moves with a character — broadly bullish, broadly bearish, or choppy. Trying to predict what any single ticker will do inside that character is hard. Reading the character itself and trading alongside it is easier, and more consistent.

On a **bullish day**: gainers are likely to continue pumping, and losers are likely to revert upward. The better trades are longs — longs on gainers extending further, longs on oversold losers recovering. Shorts taken into that environment face headwind.

On a **bearish day**: gainers that ran up are likely to retrace, and losers are likely to extend further downward. The better trades are shorts — shorts on over-extended gainers, shorts on losers continuing their decline.

Neither system predicts the day in advance. The approach is to maintain both sides simultaneously and let drawdown throttling limit damage on the side that is wrong today. The side aligned with the day's meta-structure runs profitably; the opposing side hits its SLs cleanly and closes bounded losses. Over a session the net of both sides reflects the actual character of that day.

**Two approaches coexist within this system:**

**Proactive (PseudoWinter, PseudoChaser)**: Design budget spent at the entry gate — RSI filters across timeframes, lock-in ratchets. Conservative filters mean fewer entries, cleaner setups. Binary mode bounds every position at entry with a fixed TP and SL; no DCA, no extended exposure. A missed entry is acceptable; a bad entry costs exactly the configured SL percentage and nothing more.

**Reactive (Psycho Mode)**: Design budget spent in the exit system — DCA escalation, aggressive absorption, laggard debt tracking, cascade triggers. Entry filter is one change-percent threshold. Accepts that many entries will be wrong and structures for it mechanically. Capital headroom is the tradeoff.

Neither is strictly better. Proactive suits tighter risk tolerance and cleaner books. Reactive suits traders comfortable with simultaneous multi-stage drawdown and wider capital headroom in exchange for higher throughput.

---

## Techniques

Techniques are the building blocks. Each strategy assembles a specific combination of them.

Display convention: UI surfaces, watchlists, position cards, trade menus, and activity logs show compact ticker symbols without the `USDT` suffix; full exchange symbols remain internal for API calls and persistence.

---

### Proactive Techniques

Proactive techniques decide whether and when to enter. They filter noise from signal at the entry gate.

---

#### RSI Gating

RSI is measured across three timeframes (RSI6, RSI12, RSI24) using Wilder's method. The multi-timeframe requirement ensures the overbought or oversold condition is present at multiple levels of resolution simultaneously — a single timeframe spike is noise; alignment across three is signal.

**Floor gates** confirm momentum is sufficiently developed for a mean-reversion trade to have fuel. **Ceiling gates** (used in the losers strategy) block entries where the ticker still has downward momentum — a ticker failing the ceiling is still collapsing, not stabilizing.

The standard Gainers gate is **70-70-80**: RSI6 ≥ 70, RSI12 ≥ 70, RSI24 ≥ 80. RSI24 at 80 is the final gatekeeper, confirming genuine overbought conditions on the longer timeframe.

RSI calibration history:
- **70-70-70**: Too aggressive — frequent false positives on runaway pumps
- **70-70-75**: Balanced — best risk/reward for most market conditions
- **70-70-80**: Strictest — fewer positions, cleanest setups

---

#### Over-Extension Detection

RSI6 at or above the configured maximum (default 90) signals a parabolic, non-mean-reverting state. Standard entry is blocked — the ticker is flagged and graylisted.

**RSI6 Maximum (Hard Disqualifier)**: When RSI6 ≥ the maximum, entry is blocked for that scan cycle.

**3-Hour Graylist**: If any 15-minute candle in the past 3 hours had RSI6 ≥ the maximum, the ticker is graylisted for the remainder of the window. A recently over-extended ticker is prone to re-spiking rather than stabilizing — the graylist prevents premature re-entry after a parabolic move.

---

#### Binary Mode

Binary Mode is the default position structure. Each position opens with exactly one take profit and one stop loss, both set natively on the exchange at entry. No DCA orders. TP and SL percentages are configurable (default 18% both).

The philosophy is a hard commitment to bounded exposure. Standard DCA accepts that a position may need runway and structures for it. Binary Mode refuses the possibility. The thesis is either right within the configured range, or wrong and closed at a fixed cost. There is no middle state of adding into an adverse move.

Binary Mode is suited to the meta-structure approach: when reading the market correctly, positions close fast at TP. When the read is wrong, positions close at a known, fixed loss and capital is immediately free for redeployment on the correct side.

---

#### Drawdown Throttling

When session drawdown exceeds the configured threshold, the scan stops opening new positions. The throttle lifts automatically when PnL recovers. 

Drawdown throttling is the meta-structure safety valve. A day where both sides are losing consistently signals either a choppy, untradeable environment or a wrong meta-read. Pausing new entries prevents compounding losses into a market that isn't cooperating. Once conditions improve the system resumes naturally.

---

#### Lock-in System

After a position closes, the symbol enters a lock-in window (6-hour TTL). The lock-in records RSI levels at close and enforces a ratcheting re-entry gate:

**Gainer Lock-in**: Roof lowers on each close — re-entry requires RSI to have cooled further than the last closing RSI. Prevents chasing a ticker that is resetting only slightly before pumping again.

**Loser Lock-in**: Floor rises on each close — re-entry requires the ticker to be more extended than at the last close. Prevents re-entering a falling ticker that has barely bounced.

The ratchet is one-directional and accumulates: three closes on the same symbol tighten the gate three times. Re-entry after a lock-in is always at genuinely better conditions than the last entry — not just the same conditions repeated.

---

#### Margin Size Hierarchy

Each strategy receives a different slot size based on its perceived conviction, positions that have higher filters and trade cleanly deserve more margin.

Positions are scaled at 1×, 2×, and 3× slot usage — a 2× position uses twice the configured base notional. This maximizes capital efficiency on high-conviction entries while keeping lower-conviction entries lean.

---

### Reactive Techniques

Reactive techniques manage positions after entry. They fire in response to position behavior, not to market conditions at the time of entry. Reactive techniques are used exclusively by Psycho Mode in the current system.

---

#### DCA (Dollar Cost Averaging)

DCA is the core position rescue structure for reactive strategies. When price moves against a position, pre-staged add orders trigger at progressively worse prices, improving the weighted-average entry. The TP rises with the average entry — each stage aims to exit cleanly from a better average, not to extract more profit from a deeper draw.

**Stage trigger spacing**:
- 3 stages: 3% / 9% / 15% above entry
- 6 stages: 1.5% / 3% / 6% / 9% / 12% / 15% above entry
- 7+ stages: continues the 3%-step progression beyond 15%

**TP ROI by Stage**: The entry ROI% is divided by the stage number — stage 0 gets the full target, stage 1 half, stage 2 one-third, and so on — floored at 3%.

**Final stage**: A fill on the last add is itself an invalidation of the thesis. It exists as an emergency harness, not a planned outcome.

---

#### Stop Loss (SL)

A hard exit set after all configured DCA stages have filled. Above that point nothing else can improve the average entry; there is no further reason to hold through an unlimited adverse move.

**Placement**: Set live only after the final stage triggers — this prevents exposing the SL price during the DCA progression, where a live SL at a known price is a stop-hunt invitation.

The default threshold is −105% of entry margin. For isolated margin accounts, liquidation occurs at −75%, so this path is never reached in practice. For cross-margin, the SL prevents total account wipeout from a single position.

---

#### Loss Absorption

Loss absorption trims positions consuming capital without recovering, freeing margin for healthier positions and progressively reducing exposure on the worst performers.

**Trigger model**: A cut is considered only when the position's unrealized loss breaches its configured threshold. A per-position cooldown prevents back-to-back cuts.

**Cut sizing and floors**: Stage 1 and below preserve the strategy's relative sizing; stage 2 and deeper can cut toward base margin so future adds have more average-entry leverage.

DCA and absorption work the same problem from opposite ends: DCA improves where a position needs to be to close; absorption reduces how much of the position still needs to get there.

---

#### Laggard System

The laggard is the weakest position in the book, selected by either age (oldest by open time) or depth (most DCA stages triggered). Only one laggard exists at a time.

Each position opens with an expected profit at close. The laggard's target is buffered by 50% (configurable). Every subsequent close — win or loss — feeds realized PnL into a shared tally. When the laggard's own unrealized PnL, combined with everything the rest of the book has closed, clears that buffered target, the laggard is released.

**EDa TP (Effective Debt Adjusted Take Profit)**: When collective debt exists, each position's TP is adjusted so its close contributes to debt recovery. The EDa TP is the singular source of truth for the laggard's exit — it overrides standard TP calculation and cannot be drifted or manually overridden below it.

---

#### Exhumation

When a position carries a non-zero absorption history, its regular TP is suspended and replaced with an **EH TP** (Exhumed EDa TP) — set at the level where unrealized profit covers both the original buffered expected value and every absorbed loss the position has suffered.

Each further absorption cut pushes the EH TP lower. Absorbed loss grows while margin shrinks — both effects widen the required spread. The position needs a more decisive favorable move after every cut.

---

#### DCA Delay

Only the first add is placed when a position opens; subsequent stages are queued and placed after a configured delay following the previous stage's fill. Prevents committing capital at a price the market has already passed.

When the timer fires, the queued stage's price is checked against current price. If price has already passed the stage, the stage is bumped higher and the timer restarts with added delay.

---

#### Second Wind

When the final DCA stage fills and absorption has reduced position margin significantly below expected cumulative margin, the stage count is recalibrated and new DCA orders are queued from current price. SL is deferred until the recalibrated count fills.

**Passive Second Wind**: When absorption reaches the margin floor, accumulated saved margin funds additional DCA stages placed 6% above the prior stage. Saves margin the position has already shed and converts it into continued runway — no new capital from the book.

---

#### Sacrifice and Retraction

**Sacrifice** monitors allocated margin. When allocated margin exceeds 4× the baseline per-position cost, new entries pause and one recoverable position is closed each cycle until the ratio drops. Priority: positions with at least one DCA stage triggered and PnL above −3%.

**Retraction** adds a separate tripwire: when collective unrealized PnL falls below −2.5× entry margin, sacrifice mode activates regardless of margin ratio.

---

#### Cascade Triggers

**Collective Profit Cascade (CPC)**: When total unrealized book PnL crosses 2.5× entry margin, the two most profitable positions close immediately. Banked gains pass into the laggard's deficit tally. 5-minute cooldown.

**Per-Position Cascade (PPC)**: When any single position's unrealized loss drops below −2.5× entry margin, the most profitable positions close, escalating in count on each successive trigger.

---

#### Anti-Martingale (AMa)

Positions open with no TP; as price moves in the profitable direction, flat adds are placed at −1.5%, −3%, −6%, −9%, −12%, −15%, and −18% from entry. At the seventh add, a TP is set at −22% from the original entry.

A perfect AMa run returns roughly **709% on the original entry margin** at 6× leverage. If price reverses and a DCA level triggers, AMa cancels and a standard stage-based TP is set against the current weighted average.

---

## Strategies

Each strategy is a specific combination of techniques.

---

### Gainers Strategy

**"False negatives are acceptable. False positives cost the fixed SL and nothing more."**

Gainers identifies coins showing strong upward momentum and opens positions betting on mean reversion. In PseudoWinter (shorts), the bet is that the pump exhausts and price reverts. In PseudoChaser (longs), the Gainers logic is adapted to enter oversold conditions — the mirror of the same exhaustion thesis applied to falling assets.

The strategy performs best when the meta-structure is aligned: on bearish days, pumping gainers are fighting the trend and reversions come faster and cleaner. On bullish days the same setup works but requires more patience.

**Entry assembles:**
- RSI Gating at 70-70-80 — strictest configuration; RSI24 at 80 is the final gatekeeper
- Over-Extension Disqualifier (RSI6 ≥ maximum blocks entry)
- Over-Extension Graylist (any OE hit in the past 3 hours blocks entry)
- Gainer Lock-in check (ratcheted RSI roof from prior closes on this symbol)

**Position management:**
- Binary Mode — TP and SL set at entry, no DCA
- Drawdown throttle cuts new entries if session loss exceeds threshold
- EDa TP overrides standard TP for the laggard when collective debt exists
- Lock-in bump on close — ratchets the re-entry gate for this symbol

**1× slot usage by default.**

The lock-in ratchet is the long-term filter for the Gainers strategy. Over many closes on the same symbol, the system builds a picture of what RSI levels represent genuine exhaustion on that ticker versus shallow pullbacks. Re-entry conditions tighten automatically with each trade, without manual adjustment.

---

### Losers Strategy

**"On bearish days the biggest losers are usually still falling. On bullish days they're usually reverting. Trade accordingly."**

Losers identifies coins showing strong downward momentum. In PseudoWinter (shorts), the bet is on trend continuation — the ticker is already falling and RSI alignment confirms the decline has further to go. In PseudoChaser (longs), the same watchlist is monitored for oversold conditions where a reversal is due.

The Losers strategy is the complement to Gainers in the meta-structure framework. Gainers is a mean-reversion thesis; Losers is a trend-continuation thesis. On bearish days both strategies align in the same direction. On bullish days they can work against each other — this is acceptable; the lock-in and drawdown throttle limit re-entry and total exposure.

**Entry assembles (PseudoWinter — shorts on losers):**
- RSI Ceiling Gating — RSI6, RSI12, RSI24 must all be ≤ configured ceiling thresholds, confirming sustained downward momentum across timeframes
- Loser Lock-in check (ratcheted RSI floor from prior closes on this symbol)
- Over-Extension Disqualifier applied from the short side (RSI too oversold can signal exhaustion rather than continuation)

**Position management:**
- Binary Mode — TP and SL set at entry, no DCA
- Drawdown throttle
- EDa TP for laggard when collective debt exists
- Loser lock-in bump on close — ratchets the RSI floor for re-entry

**1× slot usage by default.**

---

### Psycho Mode

Psycho Mode is the reactive approach in its purest form — no RSI gates, no lock-in, no binary mode. The only filter is absolute 24-hour change exceeding a threshold. All design budget is in the exit system.

**"Short everything."**

**Book configuration:**
- 7 DCA stages at 2× escalation — each add doubles the last
- 25% entry TP ROI, decaying per stage (floored at 3%)
- Up to 50 concurrent positions, 12 tickers per cycle
- 48-hour hard deadline as backstop

**Techniques in use:**
- *Aggressive Absorption* — threshold-triggered, halving cooldown
- *Laggard debt repository* — uncapped debt holder; non-laggard caps push overflow back to laggard
- *Exhumation* — absorbed positions receive personalized EH TP; regular TP and laggard rules suspended
- *DCA Delay* — prevents premature stage commitment on fast-moving tickers
- *Second Wind* — defers SL when absorption has reduced position below expected margin
- *Sacrifice* — closes recoverable positions when book has DCA'd heavily
- *Cascade Triggers* — CPC and PPC; exhumed positions excluded
- *Anti-Martingale (AMa)* (optional) — flat adds into winning positions; TP at −22% after seven adds

**Why individual exhumation rather than collective payback**: A large reactive book with 2× DCA escalation and aggressive absorption accumulates losses faster than any single laggard could realistically recover. Each position owning its own debt is the only workable model at this scale.

---

## Sizing

At the default **$6 notional** with **6× leverage**, each position consumes **$1 margin** at stage 0.

**Binary Mode (PseudoWinter / PseudoChaser):**

Each position uses exactly the configured notional. No DCA means no additional margin commitment after entry. Maximum exposure per position is known at open.

| Positions | Notional | Margin per Position | Total Margin |
|---|---|---|---|
| 10 | $6 | $1 | $10 |
| 10 | $12 | $2 | $20 |

Sizing for binary mode is simple: `total margin = positions × (notional / leverage)`. Size notional so total margin across all positions is within comfortable loss tolerance, since binary SL means all positions could close at max loss simultaneously on an extreme adverse day.

**Psycho Mode (PsychoWinter):**

DCA structure adds margin at each subsequent stage, so a position that fully DCA'd through all adds will consume significantly more.

**Margin requirements for 10 open positions at $6 notional (3-stage flat):**

| Scenario | Stages Used | Margin per Position | Total Margin |
|---|---|---|---|
| Pessimistic | 0 → 2 (three stages) | $3 | $30 |
| Moderate | 0 → 1 (two stages) | $2 | $20 |
| Optimistic | 0 only (entry) | $1 | $10 |

**Sizing formula (Psycho Mode)**: notional = balance × inverse ratio × leverage

| Scenario | Inverse Ratio | Balance-to-Margin |
|---|---|---|
| Pessimistic | 0.033 (1/30) | 30× |
| Moderate | 0.05 (1/20) | 20× |
| Optimistic | 0.1 (1/10) | 10× |

**Psycho Mode recommended minimum**: **$250** with default settings (50 max positions, $6 notional, 6× leverage).

---

## Conclusion

These strategies are designed for automation. The mental overhead of manually tracking RSI gates across three timeframes, lock-in ratchet state per symbol, drawdown throttle thresholds, EDa TP adjustments across multiple open positions, and simultaneous management of a full position book is overwhelming in real time. Automation handles it without error.

Within these constraints the proactive strategies (Gainers, Losers) yield clean, bounded trades that compound over time with minimal capital exposure per position. Psycho Mode provides high-throughput reactive exposure for traders comfortable with wider drawdown in exchange for more simultaneous activity.

The meta-structure approach means neither side needs to be right all day — just more right than wrong over a session. Drawdown throttling enforces a hard floor on any session's loss. The system works best when you let it run and resist the impulse to override.

**Thanks for reading, have fun!**

---
