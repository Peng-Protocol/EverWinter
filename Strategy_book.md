# Winter-Chaser Strategy Book
**A Comprehensive Guide For All Seasons**

---

## Table of Contents
1. [Philosophy Overview](#philosophy-overview)
2. [Techniques](#techniques)
   - [Proactive Techniques](#proactive-techniques)
     - [RSI Gating](#rsi-gating)
     - [Over-Extension Filter](#over-extension-filter)
   - [Reactive Techniques](#reactive-techniques)
3. [Strategies](#strategies)
   - [Gainers](#gainers-strategy)
   - [Losers](#losers-strategy)
   - [Drifters](#drifters-strategy)
   - [Psycho Mode](#psycho-mode)
4. [Sizing](#sizing)
5. [Conclusion](#conclusion)

---

## Philosophy Overview

The system has no directional bias. PseudoWinter opens shorts; PseudoChaser opens longs. Together they cover both sides of the market from the same analytical framework.

The core insight is about **meta-structure**, not individual tickers. On any given day the market moves with a character — broadly bullish, broadly bearish, or choppy. Trying to predict what any single ticker will do inside that character is hard. Reading the character itself and trading alongside it is easier, and more consistent.

On a **bullish day**: gainers are likely to continue pumping, and losers are likely to revert upward. The better trades are longs — longs on gaining momentum, longs on oversold coins recovering. Shorts taken into that environment face headwind.

On a **bearish day**: gainers that ran up are likely to retrace, and losers are likely to extend further downward. The better trades are shorts — shorts on overbought gainers, shorts on coins still in freefall.

On a **volatile day**: neither side dominates. Coins pump and dump freely in both directions — overbought tickers snap back, oversold tickers bounce hard. Both the short side and the long side can be profitable simultaneously because the market is producing clear extremes on both ends. The lock-in ledger on such days will show meaningful activity on both sides without either dominating by the configured threshold, producing a neutral or near-neutral bias. Drifters defers when bias is neutral, since its mid-RSI entries rely on a directional lean to have edge; without one, lukewarm conditions dominate and entries are skipped.

Some days are also **minimally skewed** — leaning slightly bullish or bearish but not enough to reach the configured Drifters threshold. These are treated as neutral for Drifters purposes. The threshold exists precisely to distinguish a meaningful lean from noise.

Neither system predicts the day in advance. The approach is to run both sides simultaneously and let drawdown throttling limit damage on the side that is wrong today. The side aligned with the day's meta-structure runs profitably; the opposing side hits its SLs cleanly and closes bounded losses. Over a session the net of both sides reflects the actual character of that day.

**Two approaches coexist within this system:**

**Proactive (PseudoWinter, PseudoChaser)**: Design budget spent at the entry gate — RSI filters across timeframes, lock-in ratchets. Binary mode bounds every position at entry with a fixed TP and SL; no DCA, no extended exposure. A missed entry is acceptable; a bad entry costs exactly the configured SL percentage and nothing more.

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

RSI is measured across three timeframes (RSI6, RSI12, RSI24) using Wilder's method. The multi-timeframe requirement ensures the condition is present at multiple levels of resolution simultaneously — a single timeframe spike is noise; alignment across three is signal.

**Floor gates** confirm upward momentum is sufficiently developed — used by the Gainers strategy. **Ceiling gates** confirm downward momentum is sufficiently developed — used by the Losers strategy. A ticker failing its respective gate is not ready.

The default **floor gate is 30-30-30**: RSI6 ≥ 30, RSI12 ≥ 30, RSI24 ≥ 30. The default **ceiling gate is 30-30-30**: RSI6 ≤ 30, RSI12 ≤ 30, RSI24 ≤ 30. All six thresholds are independently configurable.

The space above 30 and below 70 is where most tickers spend most of their time. Standard gating at 30-30-30 captures the boundary of oversold/overbought territory — momentum entering or leaving this zone is the signal. The mid-range (roughly 30–70) does become relevant under specific session conditions; see the Drifters strategy.

---

#### Over-Extension Filter

Tickers at the extremes of the RSI range are excluded from entry even when all gate conditions are otherwise met. A ticker that has moved too aggressively has lost its predictability — its next move can go either way with roughly equal conviction, which is not a setup worth taking.

**Upper over-extension** (RSI6 above the configured ceiling, default 90): bad for shorts and bad for longs. A short risks entering a parabolic extension that keeps running; a long risks entering right before the inevitable violent snap-back. Neither side has an edge when a ticker is that stretched upward.

**Lower over-extension** (RSI6 below the configured floor, default 10): equally bad in both directions. A long into capitulation risks catching a coin still in freefall; a short risks the violent snap-back that low RSI coins are prone to when selling pressure finally exhausts. The pattern is the same: the extremes strip out directional certainty.

**Over-extension applies to both gainer and loser setups.** A gainer that has pushed RSI above 90 does not become a better short because it is "more overbought" — it becomes a worse one. A loser that has collapsed below RSI 10 does not become a better long because it is "more oversold" — it becomes a worse one. At those levels the move has already happened; what comes next is a coin flip.

**Skip the over-extended, in either direction, on either side.**

---

#### Binary Mode

Binary Mode is the default position structure. Each position opens with exactly one take profit and one stop loss set natively on the exchange at entry. No DCA orders. TP and SL percentages are configurable (default 18% both).

The philosophy is a hard commitment to bounded exposure. The thesis is either right within the configured range, or wrong and closed at a fixed cost. There is no middle state.

Binary Mode suits the meta-structure approach: when the read is correct, positions close fast at TP. When the read is wrong, positions close at a known, fixed loss and capital is immediately free for redeployment.

---

#### Drawdown Throttling

When session drawdown exceeds the configured threshold, the scan stops opening new positions. The throttle lifts automatically when PnL recovers.

A session where both sides lose consistently signals a choppy, untradeable environment or a wrong meta-read. Pausing new entries prevents compounding losses into a market that isn't cooperating.

---

#### Lock-in System

When a position opens, the symbol's RSI at entry is recorded with a 6-hour TTL. Future re-entries into the same ticker are gated by that stored value. Both lock-ins share the same rationale: a ticker that just moved hard often reverses sharply before resuming. The lock-in makes you follow the move rather than re-enter at the worst point of the cycle.

- **Bullish lock-in** (Gainers strategy): stored RSI is a **rising floor** — ratchets to the maximum RSI seen at entry across the TTL window. Re-entry is blocked when current RSI is below the floor. The ticker must pump to a higher RSI than the last entry before it qualifies again.

- **Bearish lock-in** (Losers strategy): stored RSI is a **falling ceiling** — ratchets to the minimum RSI seen at entry across the TTL window. Re-entry is blocked when current RSI is above the ceiling. The ticker must decline to a lower RSI than the last entry before it qualifies again.

As a session progresses, lock-ins accumulate. The count on each side reflects how many tickers have already moved hard enough in that direction to have been entered and locked out. A session with many loser-side lock-ins has been producing declining, oversold coins at a high rate — it leaned bearish. A session with many gainer-side lock-ins leaned bullish. The relative density of locked-in tickers is an implicit record of recent market character, written by the trades themselves. This observation is the bias signal used by the Drifters strategy.

The Drifters strategy keeps a third lock-in ledger of its own, with the same six-hour memory and the same ratcheting rules as the main ones. Drift entries are recorded separately so that mid-range Drifters activity never tightens or loosens the gates the standard gainer and loser strategies rely on.

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

**EDa TP (Effective Debt Adjusted Take Profit)**: When collective debt exists, the laggard's TP is adjusted so its close recovers enough to offset the shared debt. The EDa TP is the singular source of truth for the laggard's exit — it overrides standard TP and cannot be drifted below it.

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

**Passive Second Wind**: When absorption reaches the margin floor, accumulated saved margin funds additional DCA stages placed 6% above the prior stage — no new capital from the book.

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

The Gainers strategy targets coins showing strong upward momentum. Entry requires RSI alignment across all three timeframes at or above the configured floor gates (default **30-30-30**), confirming the move is developed and not a single-candle spike.

**PseudoWinter (short)**: The biggest 24h gainers are filtered for RSI6/12/24 ≥ the configured floors. A short is opened betting the pump either exhausts and reverts, or at minimum pulls back enough to close at TP. On bearish days this is a high-probability setup — pumped coins face the full weight of the broader trend. On bullish days it still works but the move must be genuinely overbought across all timeframes to qualify, and the binary SL caps damage if the pump extends instead.

**PseudoChaser (long)**: The same RSI structure is applied to find coins with strong upward momentum on all timeframes — coins already gaining that RSI suggests have further room. A long is opened betting the momentum continues. On bullish days this is naturally aligned with the meta-structure. On bearish days, qualified gainers are still gaining against the trend, so the RSI gate acts as a genuine strength filter — only real outliers qualify.

**Entry assembles:**
- RSI floor gating across RSI6, RSI12, RSI24
- Bullish lock-in check — re-entry blocked unless RSI has risen above the stored floor

**Position management:**
- Binary Mode — TP and SL set at entry, no DCA
- Drawdown throttle
- EDa TP overrides standard TP for the laggard when collective debt exists
- Bullish lock-in bump on open — records entry RSI, ratchets the floor up

---

### Losers Strategy

The Losers strategy targets coins showing strong downward momentum. Entry requires RSI alignment across all three timeframes at or below the configured ceiling gates (default **30-30-30**), confirming the decline is sustained and not a brief dip.

**PseudoWinter (short)**: The biggest 24h losers are filtered for RSI6/12/24 ≤ the configured ceilings. A short is opened betting the decline continues. On bearish days the full meta-structure supports the trade. On bullish days even the weakest coins tend to recover — the binary SL limits damage to the configured percentage and exits cleanly.

**PseudoChaser (long)**: The strategy is applied to coins that have been falling significantly and are now deeply oversold across all three RSI timeframes. A long is opened betting on a reversal — the selling pressure is exhausted and a bounce is due. On bullish days oversold coins snap back hard. On bearish days the bounce may be shallow, but the binary TP and SL define the exact outcome either way.

**Entry assembles:**
- RSI ceiling gating across RSI6, RSI12, RSI24 — all timeframes must be at or below their configured ceiling
- Bearish lock-in check — re-entry blocked unless RSI has fallen below the stored ceiling

**Position management:**
- Binary Mode — TP and SL set at entry, no DCA
- Drawdown throttle
- EDa TP overrides standard TP for the laggard when collective debt exists
- Bearish lock-in bump on open — records entry RSI, ratchets the ceiling down

---

### Drifters Strategy

**The premise**: Standard gating requires RSI alignment at the extremes — above 70-70-70 for gainers, below 30-30-30 for losers. As a session runs, many qualifying tickers get entered and locked out. Eventually, the pool of available extreme-RSI candidates dries up. At that point the lock-in ledger holds something valuable: a record of which side the session has been trading heavily. If loser-side lock-ins significantly outnumber gainer-side lock-ins, the recent period was bearish. If gainer-side lock-ins dominate, it was bullish.

Drifters uses that aggregate lock-in trade count as a directional bias signal and reaches into the middle RSI zone — around the 50-50-50 midpoint — to find entries consistent with that bias.

**RSI midpoint gating**: An entry requires all three RSI timeframes on the same side of 50.

- **High drifter** (all three at or above 50): RSI is drifting above the midpoint.
- **Low drifter** (all three at or below 50): RSI is drifting below the midpoint.
- **Lukewarm** (mixed, some above and some below 50): skip entry. Lukewarm is this strategy's equivalent of over-extension — a mixed RSI signal provides no directional edge.

**Bias detection**: Read at scan time by totaling the trades recorded on each side of the existing lock-in ledger. No separate bookkeeping is needed — the ledger already survives reloads, and its totals reflect what the session has actually traded.

**Threshold**: The bias threshold setting (default **2×**) sets how dominant one side must be. At 2×, gainer lock-in aggregate trades must be at least double loser lock-in trades to declare a bullish bias. At 1×, any imbalance declares a bias. At 5×, only a heavily dominant side triggers.

**Deferral**:
- PseudoWinter (short-only): logs *"Today is bullish"* and defers all Drifters entries when bias is bullish. Fighting a bullish session from the short side is the wrong trade.
- PseudoChaser (long-only): logs *"Today is bearish"* and defers when bias is bearish.

The deferral message fires once per bias change, not on every scan cycle.

**Drift lock-in**: Separate from the main gainer/loser lock-ins. Each entry remembers a ticker's three RSI readings at entry, its trade count, and its drift direction for six hours. High drifters ratchet the RSI floor up — re-entry demands all three readings strictly above the last entry's. Low drifters ratchet the ceiling down. A ticker holds one drift record at a time; if it later fires in the opposite direction, the record is replaced and the ratchet starts fresh.

**Position markers**: Positions opened by Drifters carry their drift direction for the life of the trade and into the closed-trade history, where a DRIFT badge marks them — green for high drifters, red for low. Drift trades stay distinguishable from standard entries at a glance.

**Why "Drifters"**: Entries drift into the mid-RSI zone — from the standard entry extremes toward the center — guided by what the session has already proven about its character.

**Plugin stack**: Drifters ships as a strategy plugin for each bot and must load after the live-trading plugin it rides on — over EverWinter on the short side, over SunChaser on the long side. See the README's Drifters Plugins and Plugin Stack Order sections for file names, manifest declarations, and the technical rationale.

**Components used**:
- RSI Gating (midpoint variant — 50-50-50 instead of 70-70-70 or 30-30-30)
- Lock-in System (separate drift ledger)
- Session bias, read from the main lock-in ledgers at scan time
- High / low / lukewarm classification of every candidate

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

Sizing for binary mode is simple: `total margin = positions × (notional / leverage)`. Size notional so total margin across all positions is within comfortable loss tolerance — binary SL means all positions could close at max loss simultaneously on an extreme adverse day.

**Psycho Mode (PsychoWinter):**

DCA structure adds margin at each subsequent stage.

**Margin requirements for 10 open positions at $6 notional (3-stage flat):**

| Scenario | Stages Used | Margin per Position | Total Margin |
|---|---|---|---|
| Pessimistic | 0 → 2 | $3 | $30 |
| Moderate | 0 → 1 | $2 | $20 |
| Optimistic | 0 only | $1 | $10 |

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

The meta-structure approach means neither side needs to be right all day — just more right than wrong over a session. Drawdown throttling enforces a hard floor on any session's loss. The system works best when you let it run and resist the impulse to override.

**Thanks for reading, have fun!**

---
