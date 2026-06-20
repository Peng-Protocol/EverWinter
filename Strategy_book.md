# Winter-Chaser Strategy Book
**A Comprehensive Guide For All Seasons**

---

## Table of Contents
1. [Philosophy Overview](#philosophy-overview)
2. [Techniques](#techniques)
   - [Proactive Techniques](#proactive-techniques)
   - [Reactive Techniques](#reactive-techniques)
3. [Market Intelligence](#market-intelligence)
   - [Structure Learning](#structure-learning)
   - [Structure Sampling](#structure-sampling)
   - [Slot Scorecard](#slot-scorecard)
   - [Cross-Side Coordination](#cross-side-coordination)
4. [Psycho Mode](#psycho-mode)
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

Meta-structure is necessary but not sufficient. It is possible to trade with the structure and still lose when the specific signals driving entries are not genuinely aligned with it. Knowing which indicators are actually bullish or bearish within the current environment — not just nominally available — determines whether the entries within a favorable structure produce profit or drag. The slot scorecard system addresses this directly: it tracks which entry combinations have historically won and lost and prunes the ones that are not working. This same mechanism benefits the counter-structure side too. Rather than absorbing consistent losses, it identifies pockets where the counter-trend case is supported — and in some sessions, the scorecard data is enough to put the counter-structure side in profit despite the broader directional headwind.

**Two approaches coexist within this system:**

**Proactive**: Design budget spent at the entry gate — slot-based multi-criterion filters. Binary mode bounds every position at entry with a fixed TP and SL; no DCA, no extended exposure. A missed entry is acceptable; a bad entry costs exactly the configured SL percentage and nothing more.

**Reactive (Psycho Mode)**: Design budget spent in the exit system — DCA escalation, aggressive absorption, laggard debt tracking, cascade triggers. Entry filter is one change-percent threshold. Accepts that many entries will be wrong and structures for it mechanically. Capital headroom is the tradeoff.

Neither is strictly better. Proactive suits tighter risk tolerance and cleaner books. Reactive suits traders comfortable with simultaneous multi-stage drawdown and wider capital headroom in exchange for higher throughput.

---

## Techniques

Techniques are the building blocks. Each strategy assembles a specific combination of them.

---

### Proactive Techniques

Proactive techniques decide whether and when to enter. They filter noise from signal at the entry gate.

---

#### Binary Mode

Binary Mode is the default position structure. Each position opens with exactly one take profit and one stop loss set natively on the exchange at entry. No DCA orders. TP and SL percentages are configurable.

The philosophy is a hard commitment to bounded exposure. The thesis is either right within the configured range, or wrong and closed at a fixed cost. There is no middle state.

Binary Mode suits the meta-structure approach: when the read is correct, positions close fast at TP. When the read is wrong, positions close at a known, fixed loss and capital is immediately free for redeployment.

---

#### Drawdown Throttling

A session that consistently loses on both sides is either a choppy, undirected market or a wrong read on the day's character. In either case, opening more positions compounds the damage. When drawdown reaches the configured threshold, stop entering new positions and wait. The market will either clarify its direction — at which point recovery begins naturally — or it stays choppy, in which case standing down was the right call. The throttle lifts when PnL recovers past the threshold. Do not override it early.

---

#### Market Reading

The entry gate is built from slots. Each slot is a set of criteria that must all be true simultaneously. A ticker qualifies for entry when it satisfies every criterion in any one slot. Each slot is a distinct thesis — "funding rate elevated and price rising" is a different case from "high participation confirming momentum." Both can be active at the same time; each runs on its own terms. A position opens when any slot is satisfied; when none are, the scan passes.

**The criteria:**

- **+fund** — The funding rate is above the threshold. Longs are paying shorts. There is carry embedded in holding the short side, and heavy long positioning often signals a crowded trade vulnerable to reversal.
- **-fund** — The funding rate is below the negative threshold. Shorts are paying longs. An overcrowded short side with embedded carry for longs.
- **+24h** — The ticker's 24-hour price change is positive. The day's character is currently bullish for this coin.
- **-24h** — The 24-hour price change is negative. The day is currently bearish for this coin.
- **>10%** — The ticker's 24-hour trading volume exceeds 10% of its total market capitalization. A significant fraction of the coin's entire value changed hands in a day — unusually high participation that confirms momentum is broadly backed, not a thin-market artifact.
- **<10%** — The volume is below 10% of market cap. The coin moved but the market did not chase it. This is the fade case: momentum without conviction.
- **LSA (Sell Spike)** — The last completed hourly candle had a volume spike above the daily average in the configured range, and it closed lower than it opened. A high-volume down candle is sell-side pressure with the market actively participating — not drifting, not choppy, but decisively pointing down. Use this to confirm bearish momentum with volume backing before entering the short side.
- **LBA (Buy Spike)** — The mirror: high volume in the configured range, green close. The market pushed up into the candle and held the gains. Use this to confirm bullish momentum with genuine buying participation before entering the long side.
- **R-ASL (Quiet Red)** — The last completed hourly candle closed red and its volume was *below* the configured lower spike bound — the market moved down without a volume surge. Quiet, uncontested selling: no crowd participation, no obvious catalyst. Can signal a slow bleed or a low-conviction pullback that is easier to trade than a violent spike.
- **R-ABL (Quiet Green)** — The mirror: a green candle with volume below the spike threshold. The market drifted up without conviction. Useful for entries where you expect a measured continuation rather than a sharp move.
- **S-Liq (Sell-Liquidation)** — Short positions accounted for the majority of liquidation turnover in the cycle, above the configured threshold. Short liquidations are bullish — the market forced out the short side. Use this to confirm that the long case has real pressure behind it. An optional depth gate can additionally require the liq flow to be above or below a certain intensity relative to the ticker's typical hourly liq volume — use this to filter for unusually heavy or unusually light signals beyond the threshold.
- **B-Liq (Buy-Liquidation)** — Long positions accounted for the majority of liquidation turnover above the threshold. Long liquidations are bearish — the market forced out the long side. Use this to confirm that the short case has real pressure behind it. The same optional depth gate applies.

**Building slots**: A slot containing only "+fund" behaves exactly like a fund-chasing filter. A slot containing "+24h" and ">10%" behaves like a momentum filter. A slot with all three — "+24h", ">10%", and "+fund" — requires momentum, participation, and a funding premium to align before opening. Adding "LSA" to a bearish slot demands that the last hourly candle confirm the move with volume. The building-block design lets you dial the filter from permissive to strict without changing the underlying logic.

**Auto-slot builder**: Instead of building slots by hand, the system can generate every possible combination of criteria at a chosen size automatically. At size 2 with twelve available criteria, it produces 66 distinct slots. At size 3, 220 slots. Combined with auto-correction, this creates a self-pruning strategy: all combinations run, and the ones that consistently lose are disabled without manual intervention.

**Group exits**: Positions opened through this strategy exit at their individual TP or SL by default. Three optional group modes add further control.

**Cascade** — when the combined unrealized profit of all positions crosses a configured threshold, every position closes at once. This banks the move before it can reverse. Use it when you want to enforce collective profit-taking rather than waiting for each position to reach its individual target.

**Rolling Window Sacrifice** — when combined unrealized loss crosses a threshold, instead of closing all positions at once, only the oldest one closes. Exposure is reduced gradually, one position per trigger. Use this for staged de-risking rather than a clean sweep.

**Fade Away** — if the broad hourly candle sample is skewed sufficiently in one direction, the oldest open position closes. For the short side, the trigger is a broadly bullish tape; for the long side, a broadly bearish tape. Like rolling sacrifice, this closes one position per cycle. The difference is the trigger: sacrifice fires on your own portfolio's loss level; fade away fires on the market's structural direction as read from the candle sample.

**Liq Fade Away** — the same graduated response, driven by liquidation flow instead of candle direction. The liquidation surveillance layer accumulates real-money forced-close events across a rolling sample of volatile tickers. The fade only triggers when two conditions are met simultaneously: the adverse liquidation type dominates beyond the threshold, **and** the slot scorecard shows that this liquidation type has historically corresponded to losses for positions opened through the same slots. If the scorecard has no history, or the record is ambiguous, the fade does not fire. An optional block-entries mode holds new positions until the adverse signal clears.

When a position is opened via a liquidation signal, the intensity of that signal is recorded alongside the trade outcome. The scorecard bias check accounts for this intensity tag, so outcomes from heavy signals and light signals are tracked separately — the bias verdict is drawn from trades opened under comparable conditions, not from a flat average.

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

## Market Intelligence

Market Intelligence is the strategy used by PseudoWinter and PseudoChaser. Rather than trading on a single signal or a fixed rule, it builds a living picture of the market — learning what conditions have preceded wins and losses, tracking what the broad tape is doing right now, and filtering entries against everything the system has observed so far.

---

### Structure Learning

Structure Learning is the observational counterpart to Psycho Mode's mechanical approach. Where Psycho Mode handles the position book mechanically — absorbing, escalating, exhuming — Structure Learning watches the broader market and asks what conditions surrounded past wins and losses.

Every significant event — a position closes at target, a drawdown halt triggers, a relief rally is detected — captures a snapshot of what the market looked like at that moment: trend balance, buying and selling pressure, velocity. Over many sessions these accumulate into a profile.

Before each entry pass, current conditions are compared against the profile. Conditions resembling past drawdown events narrow the entry gate. Conditions resembling profitable periods widen it.

A fresh installation has no history and places no weight on structure. After weeks of operation, the profile reflects the market as this system has actually experienced it — a learned intuition shaped by its own trading logic, not a generic market model.

---

### Structure Sampling

Before each entry pass, the system reads the last completed hourly candle for a random sample of tickers across the market and counts how many closed red versus how many closed green. The result is displayed as a two-sided bar — red on one end, green on the other — that gives a live read on the market's hourly directional balance.

This is a snapshot, not a forecast. It tells you what the broad market actually did in the last hour, not what it will do next. Paired with the Fade Away exit, it forms a closed loop: the same candle sample that is plotted in the bar is the one that triggers the position close when the balance is sufficiently one-sided. When the bar skews heavily in one direction, the positions exposed to that direction are at risk — Fade Away uses that observation to act automatically.

---

### Slot Scorecard

The scorecard tracks realized PnL per entry combination. Every time a position opened through the slot-based strategy closes, the outcome is tied to the specific combination of criteria that triggered the entry.

Combinations are displayed sorted by total PnL. When both sides run simultaneously, the scores account for direction: a win on the short side is a loss for the long side, so each side inverts the other's records in its own view.

**Auto-correction**: when enabled, the system uses scorecard data to block combinations automatically. Each combination has a single combined score — own wins raise it, own losses lower it, partner wins lower it further, partner losses raise it back. When the score drops below a configured threshold the combination is blocked. When it recovers above the threshold — because conditions shifted and the partner started losing on it — it unblocks automatically. Combinations that sink deep stay blocked indefinitely; combinations near the threshold fluctuate with the market.

The **CLEAR** button resets all scorecard records and lifts all auto-blocks.

---

### Cross-Side Coordination

Each side of the system — the long side and the short side — trades independently. But their outcomes are not independent. When one side is closing positions at a loss, the market is moving against it, which means the market is moving *in favor of* the other side. When one side is closing at a profit and exiting, the move that made those longs profitable is the same move that should be warning the short side to get out.

**The signals:**

A **cascade** on one side — a wave of positions closing at profit — means the market made a decisive move in that direction. For the side that just cashed out, the run may be over. For the *other* side, it is a warning: the market just moved hard against you, and any open positions you're holding into that momentum are likely bleeding. The correct response is to halt new entries and close whatever is exposed.

~~A **sacrifice** on one side — a wave of positions closing at a loss, absorbed and cut — means the market moved decisively against that side. The same move is relief for the other side. If the other side had been halted waiting for conditions to improve, this is the signal that the pressure has shifted. The halt lifts; entries can resume.~~

**Why speed matters:**

These trends can reverse within a few hours. A market that cascades bullish in the morning can ~~sacrifice~~ by afternoon. Waiting for manual confirmation introduces the exact delay that turns a signal into yesterday's news. The window for acting on a cross-side signal is narrow — the value is in responding immediately, not in confirming it after the fact.

**The larger vision:**

The goal is a system that never needs to be manually overridden. A human monitoring both sides would notice when the long side starts closing profitably and would manually pause the short side — but that requires attention, correct interpretation, and quick action. The cross-side coordination handles this automatically. Each side watches the other's outcomes and adjusts in real time.

Combined with the structure-learning layer, this produces a system that gets progressively less reliant on fixed rules and more responsive to the actual conditions it encounters. Fixed configuration handles the stable environment it was tuned for; learned structure handles drift; cross-side signals handle intraday regime shifts. The goal, reached incrementally, is a system that corrects itself before the damage accumulates — without requiring any intervention from the trader.

---

## Psycho Mode

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
