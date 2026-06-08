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
   - [Psycho Mode](#psycho-mode)
4. [Sizing](#sizing)
5. [Conclusion](#conclusion)

---

## Philosophy Overview

The system has no directional bias. PseudoWinter opens shorts; PseudoChaser opens longs. Together they cover both sides of the market from the same analytical framework.

The core insight is about **meta-structure**, not individual tickers. On any given day the market moves with a character — broadly bullish, broadly bearish, or choppy. Trying to predict what any single ticker will do inside that character is hard. Reading the character itself and trading alongside it is easier, and more consistent.

On a **bullish day**: gainers are likely to continue pumping, and losers are likely to revert upward. The better trades are longs — longs on gaining momentum, longs on oversold coins recovering. Shorts taken into that environment face headwind.

On a **bearish day**: gainers that ran up are likely to retrace, and losers are likely to extend further downward. The better trades are shorts — shorts on overbought gainers, shorts on coins still in freefall.

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

**Floor gates** confirm momentum is sufficiently developed. **Ceiling gates** block entries where momentum is still running — a ticker failing the ceiling is not ready.

The default gate is **70-70-70**: RSI6 ≥ 70, RSI12 ≥ 70, RSI24 ≥ 70. All three thresholds are configurable.

---

#### Over-Extension Filter

Tickers at the extremes of the RSI range are excluded from entry even when all gate conditions are otherwise met. A ticker with RSI too far above a ceiling, or too far below a floor, has already moved so aggressively that its next move is genuinely unpredictable — it can explode further in the same direction or snap back violently, with no reliable read on which.

**Upper ceiling**: If RSI6 exceeds the configured maximum (default 90), the ticker is skipped. The move is too mature. Entering at this point risks catching a parabolic extension right before a sharp reversal, or riding a runaway that defies the short thesis entirely.

**Lower floor**: If RSI6 falls below the configured minimum (default 10), the ticker is also skipped. A coin in freefall with RSI near zero is in capitulation — it may stabilize, but it may also continue dropping vertically. The risk profile is the same: directional certainty vanishes at the extremes.

The same logic applies to the potential-entry watchlist. If a ticker is sitting on the watchlist waiting for its gate to be reached, and RSI crosses the ceiling or floor boundary in the meantime, it is evicted immediately rather than held for an entry that is now outside acceptable parameters.

The filter is symmetric: **skip the over-extended on the way up, skip the over-extended on the way down.**

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

The Gainers strategy targets coins showing strong upward momentum. Entry requires RSI alignment across all three timeframes above the configured floor gates, confirming the move is developed and not a single-candle spike.

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

The Losers strategy targets coins showing strong downward momentum. Entry requires RSI alignment across all three timeframes below the configured ceiling gates, confirming the decline is sustained and not a brief dip.

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
