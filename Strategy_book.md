# Winter-Chaser Strategy Book
**A Comprehensive Guide For All Seasons**

---

## Table of Contents
1. [Philosophy Overview](#philosophy-overview)
2. [Techniques](#techniques)
   - [Proactive Techniques](#proactive-techniques)
   - [Reactive Techniques](#reactive-techniques)
3. [Strategies](#strategies)
   - [Multi-Indicator](#multi-indicator-strategy)
   - [Psycho Mode](#psycho-mode)
4. [Market Intelligence](#market-intelligence)
   - [Structure Learning](#structure-learning)
   - [Structure Sampling](#structure-sampling)
   - [Slot Scorecard](#slot-scorecard)
   - [Cross-Side Coordination](#cross-side-coordination)
5. [Sizing](#sizing)
6. [Conclusion](#conclusion)

---

## Philosophy Overview

The system has no directional bias. One side opens shorts; the other opens longs. Together they cover both sides of the market from the same analytical framework.

The core insight is about **meta-structure**, not individual tickers. On any given day the market moves with a character — broadly bullish, broadly bearish, or choppy. Trying to predict what any single ticker will do inside that character is hard. Reading the character itself and trading alongside it is easier, and more consistent.

On a **bullish day**: gainers are likely to continue pumping, and losers are likely to revert upward. The better trades are longs — longs on gaining momentum, longs on oversold coins recovering. Shorts taken into that environment face headwind.

On a **bearish day**: gainers that ran up are likely to retrace, and losers are likely to extend further downward. The better trades are shorts — shorts on overbought gainers, shorts on coins still in freefall.

On a **volatile day**: neither side dominates. Coins pump and dump freely in both directions — overbought tickers snap back, oversold tickers bounce hard. Both the short side and the long side can be profitable simultaneously because the market is producing clear extremes on both ends.

Neither system predicts the day in advance. The approach is to run both sides simultaneously and let drawdown throttling limit damage on the side that is wrong today. The side aligned with the day's meta-structure runs profitably; the opposing side hits its SLs cleanly and closes bounded losses. Over a session the net of both sides reflects the actual character of that day.

**Two approaches coexist within this system:**

**Proactive**: Design budget spent at the entry gate — RSI filters across timeframes, lock-in ratchets. Binary mode bounds every position at entry with a fixed TP and SL; no DCA, no extended exposure. A missed entry is acceptable; a bad entry costs exactly the configured SL percentage and nothing more.

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

- **Bullish lock-in**: stored RSI is a **rising floor** — ratchets to the maximum RSI seen at entry across the TTL window. Re-entry is blocked when current RSI is below the floor. The ticker must pump to a higher RSI than the last entry before it qualifies again.

- **Bearish lock-in**: stored RSI is a **falling ceiling** — ratchets to the minimum RSI seen at entry across the TTL window. Re-entry is blocked when current RSI is above the ceiling. The ticker must decline to a lower RSI than the last entry before it qualifies again.

As a session progresses, lock-ins accumulate. The count on each side reflects how many tickers have already moved hard enough in that direction to have been entered and locked out. A session with many bearish-side lock-ins has been producing declining, oversold coins at a high rate — it leaned bearish. A session with many bullish-side lock-ins leaned bullish. The relative density of locked-in tickers is an implicit record of recent market character, written by the trades themselves.

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

### Multi-Indicator Strategy

**The premise**: Rather than betting on a single signal, build an entry condition from a combination of signals that must align simultaneously. Funding rate, 24-hour price direction, and relative volume each capture something different about a ticker's current state. When several of these point the same way at once, the case for entry is stronger than any one of them alone — and the combination defines a tradeable edge without requiring a ticker-level price prediction.

**Slots**: The entry logic is built from "slots" — each slot is a set of criteria that must all be true at the same time. A ticker qualifies for entry if it satisfies every criterion in any one slot. Think of each slot as a distinct thesis about when to open: "funding rate elevated and price trending up" is a different case than "high participation confirming momentum." Both can be active simultaneously; each runs on its own terms.

**The criteria**:

- **+fund** — The funding rate is above the threshold (typically 0.1%). Longs are paying shorts. There is a premium embedded in holding the short side, and heavy long positioning often signals a crowded trade vulnerable to reversal.
- **-fund** — The funding rate is below the negative threshold. Shorts are paying longs. This is the mirror: an overcrowded short side with embedded carry for longs.
- **+24h** — The ticker's 24-hour price change is positive. The day's character is currently bullish for this coin.
- **-24h** — The 24-hour price change is negative. The day is currently bearish for this coin.
- **>10%** — The ticker's 24-hour trading volume exceeds 10% of its total market capitalization. A significant fraction of the coin's entire value changed hands in a day — unusually high participation that confirms momentum is broadly backed, not a thin-market artifact.
- **<10%** — The volume is below 10% of market cap. The coin moved but the market did not chase it. This is the fade case: momentum without conviction.
- **LSA (Sell Spike)** — The last completed hourly candle had a volume spike above the daily average in the configured range, and it closed lower than it opened. A high-volume down candle is sell-side pressure with the market actively participating — not drifting, not choppy, but decisively pointing down. Use this to confirm bearish momentum with volume backing before entering the short side.
- **LBA (Buy Spike)** — The mirror: high volume in the configured range, green close. The market pushed up into the candle and held the gains. Use this to confirm bullish momentum with genuine buying participation before entering the long side.

**Default configuration**: The default slots cover the primary entry cases. The short side uses: positive funding with price rising, negative funding with price falling, rising price with high participation, and falling price with low participation. The long side uses the directional mirrors of the same. Any slot can be edited, removed, or replaced to build entirely different configurations.

**Why this is flexible**: A slot containing only "+fund" behaves exactly like the fund-chasing approach. A slot containing "+24h" and ">10%" behaves like the momentum filter. A slot with all three — "+24h", ">10%", and "+fund" — requires momentum, participation, and a funding premium to align before opening. Adding "LSA" to a bearish slot demands that the last hourly candle confirm the move with volume before the position opens. The building-block design lets you dial the filter from permissive (one broad criterion) to strict (multiple simultaneous conditions) without changing the underlying logic.

**Exits**: All positions opened through this strategy exit through the standard take-profit and stop-loss settings by default. Three optional group-exit modes add further control.

**Group exit: Cascade** — when the combined unrealized profit of all positions opened through this strategy crosses a configured threshold (as a percentage of average entry margin), every one of those positions closes at once. This banks the move before it can reverse. Use it when you want to enforce collective profit-taking across the whole group rather than waiting for each position to reach its individual target.

**Group exit: Sacrifice** — the mirror of cascade. When combined unrealized loss crosses a threshold, all positions in the group close to cap the damage. This is a group stop-loss — it fires when the thesis has clearly broken down across the book and further holding would only deepen the loss.

**Rolling Window Sacrifice** — a softer version of sacrifice. When the loss threshold is crossed, instead of closing all positions at once, only the oldest one closes. The exposure is reduced gradually, one position per trigger, rather than being eliminated in a single action. Use this when you want staged de-risking rather than a clean sweep.

**Fade Away** — a directional market response. If the broad sample of hourly candles is skewed sufficiently in one direction (configurable threshold, default 50%), the oldest open position closes. For the short side, the trigger is a broadly bullish tape — when the market is broadly going up, the oldest short gets cut first. For the long side, the trigger is a broadly bearish tape. Like rolling sacrifice, this closes one position per cycle. The difference is the trigger: sacrifice fires on your own portfolio's loss level; fade away fires on the market's structural direction as read from the candle sample.

**Components used**:
- Slot-based AND-gate filter (user-configurable; any combination of criteria per slot, unlimited slots)
- Funding rate threshold gate (+fund, -fund)
- 24-hour price direction (+24h, -24h)
- Vol/mcap ratio filter (>10%, <10%)
- 1h volume spike and candle direction (LSA, LBA)
- Group cascade exit, group sacrifice exit, rolling window sacrifice, fade away
- Drawdown throttle and gains lock
- Climate gate (learned market-structure profile, when Structure Learning plugins are loaded)

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

## Market Intelligence

The system learns over time. Beyond the slot-based filters and technique configuration, there is an observational layer that watches how the market behaves at the moments that matter most — when positions are closed at a gain or at a loss — and builds a record of what the market looked like in those moments. That record becomes a guide for future sessions.

---

### Structure Learning

Every time a meaningful event occurs — a position closes at target, a drawdown halt triggers, a relief rally is detected — the system takes a snapshot of what the broader market looked like at that moment: how many coins are trending up versus down, the balance of buying and selling pressure, the velocity of the trend. Over many sessions, these snapshots accumulate into a profile.

Before opening new positions, the system compares current market conditions against this profile. If conditions closely resemble what the market looked like during previous drawdown events, the entry gate narrows. If conditions match what the market looked like during profitable periods, the gate opens wider.

This is not a prediction. The system does not know what the market will do next. What it knows is what the market has looked like in the past when things went well and when they went badly — and it lets that pattern shift its confidence before each decision.

The profile improves with time. A fresh installation has no history and places no weight on past structure. After weeks of operation, the profile represents a genuine statistical record of the market's behavior during this system's sessions, shaped by its own entry logic and sizing decisions. It is, in that sense, a learned intuition specific to how this system trades.

---

### Structure Sampling

Before each entry pass, the system reads the last completed hourly candle for a random sample of tickers across the market and counts how many closed red versus how many closed green. The result is displayed as a two-sided bar — red on one end, green on the other — that gives a live read on the market's hourly directional balance.

This is a snapshot, not a forecast. It tells you what the broad market actually did in the last hour, not what it will do next. Paired with the Fade Away exit, it forms a closed loop: the same candle sample that is plotted in the bar is the one that triggers the position close when the balance is sufficiently one-sided. When the bar skews heavily in one direction, the positions exposed to that direction are at risk — Fade Away uses that observation to act automatically.

---

### Slot Scorecard

The scorecard tracks how each entry combination has performed historically. Every time a position opened through the slot-based strategy closes, the system records whether it was a win or a loss and ties that outcome to the specific combination of criteria that triggered the entry.

Over time, the scorecard surfaces which combinations have been consistently profitable and which have been consistently losing. The combinations are displayed as chips sorted from highest net score to lowest. When two sides are running simultaneously, the scores account for direction: a win on the short side represents the same market move as a loss on the long side, so the long side's scorecard inverts the short side's records when displaying them — and vice versa. The result is a single view where each combination is judged relative to the direction of the side showing it.

The scorecard is a diagnostic, not a control. It does not automatically enable or disable slots — it informs the trader which combinations are earning their keep. A combination that consistently shows a negative net score is a candidate for removal or reconfiguration; one with strong wins is worth preserving or even expanding.

---

### Cross-Side Coordination

Each side of the system — the long side and the short side — trades independently. But their outcomes are not independent. When one side is closing positions at a loss, the market is moving against it, which means the market is moving *in favor of* the other side. When one side is closing at a profit and exiting, the move that made those longs profitable is the same move that should be warning the short side to get out.

**The signals:**

A **cascade** on one side — a wave of positions closing at profit — means the market made a decisive move in that direction. For the side that just cashed out, the run may be over. For the *other* side, it is a warning: the market just moved hard against you, and any open positions you're holding into that momentum are likely bleeding. The correct response is to halt new entries and close whatever is exposed.

A **sacrifice** on one side — a wave of positions closing at a loss, absorbed and cut — means the market moved decisively against that side. The same move is relief for the other side. If the other side had been halted waiting for conditions to improve, this is the signal that the pressure has shifted. The halt lifts; entries can resume.

**Why speed matters:**

These trends can reverse within a few hours. A market that cascades bullish in the morning can sacrifice by afternoon. Waiting for manual confirmation introduces the exact delay that turns a signal into yesterday's news. The window for acting on a cross-side signal is narrow — the value is in responding immediately, not in confirming it after the fact.

**The larger vision:**

The goal is a system that never needs to be manually overridden. A human monitoring both sides would notice when the long side starts closing profitably and would manually pause the short side — but that requires attention, correct interpretation, and quick action. The cross-side coordination handles this automatically. Each side watches the other's outcomes and adjusts in real time.

Combined with the structure-learning layer, this produces a system that gets progressively less reliant on fixed rules and more responsive to the actual conditions it encounters. Fixed configuration handles the stable environment it was tuned for; learned structure handles drift; cross-side signals handle intraday regime shifts. The goal, reached incrementally, is a system that corrects itself before the damage accumulates — without requiring any intervention from the trader.

---

## Sizing

At the default **$6 notional** with **6× leverage**, each position consumes **$1 margin** at stage 0.

**Binary Mode:**

Each position uses exactly the configured notional. No DCA means no additional margin commitment after entry. Maximum exposure per position is known at open.

| Positions | Notional | Margin per Position | Total Margin |
|---|---|---|---|
| 10 | $6 | $1 | $10 |
| 10 | $12 | $2 | $20 |

Sizing for binary mode is simple: `total margin = positions × (notional / leverage)`. Size notional so total margin across all positions is within comfortable loss tolerance — binary SL means all positions could close at max loss simultaneously on an extreme adverse day.

**Psycho Mode:**

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
