# Winter-Chaser Strategy Book
**A Comprehensive Guide For All Seasons**

---

## Table of Contents
1. [Philosophy Overview](#philosophy-overview)
2. [Techniques](#techniques)
   - [Proactive Techniques](#proactive-techniques)
   - [Reactive Techniques](#reactive-techniques)
3. [Market Intelligence](#market-intelligence)
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

Neither system predicts the day in advance. Both sides run simultaneously; drawdown throttling limits damage on the side that is wrong while the aligned side runs with the current. Over a session the net reflects the actual character of that day — meta-structure is necessary without being sufficient. Trading with the structure still produces losses when the specific signals driving entries are not genuinely aligned with it. Knowing which indicators are actually bullish or bearish in the current environment — not just nominally available — determines whether entries within a favorable structure produce profit or drag. This is directly addressed by a scoring system that tracks which entry combinations have historically won and lost, pruning the ones that are not working. This same mechanism benefits the counter-structure side: rather than absorbing consistent losses, it identifies pockets where the counter-trend case is supported — and in some sessions, the scorecard data is enough to put the counter-structure side in profit despite the broader directional headwind.

**Two approaches coexist within this system:**

**Proactive**: Design budget spent at the entry gate — this asks what tickers are best to enter based on certain behavior or traits the ticker may be exhibiting.

**Reactive**: Design budget spent in the exit system — this asks what techniques are best to use to exit a ticker that is not cooperating.

Neither is strictly better. Proactive suits tighter risk tolerance and cleaner books. Reactive suits traders comfortable with simultaneous multi-stage drawdown and wider capital headroom in exchange for higher throughput.

---

## Techniques

Techniques are the building blocks. Each strategy assembles a specific combination of them.

---

### Proactive Techniques

Proactive techniques decide whether, how, and when to enter. They filter noise from signal at the entry gate.

---

#### Binary Mode

Binary Mode is the default position structure. Each position opens with exactly one take profit and one stop loss set natively on the exchange at entry. No DCA orders. TP and SL percentages are configurable.

The philosophy is a hard commitment to bounded exposure. The thesis is either right within the configured range, or wrong and closed at a fixed cost. There is no middle state.

Binary Mode suits the meta-structure approach: when the read is correct, positions close fast at TP. When the read is wrong, positions close at a known, fixed loss and capital is immediately free for redeployment.

---

#### Drawdown Throttling

A session that consistently loses on both sides is either a choppy, undirected market or a wrong read on the day's character. In either case, opening more positions compounds the damage. When drawdown reaches the configured threshold, stop entering new positions and wait. The market will either clarify its direction — at which point recovery begins naturally — or it stays choppy, in which case standing down was the right call. The throttle can be lifted either after a fixed interval or if the opposing directional side suffers a similar drawdown, indicating a shift in market direction. Do not override it early.

---

#### Market Reading

The entry gate is built from slots. Each slot is a set of criteria that must all be true simultaneously. A ticker qualifies for entry when it satisfies every criterion in any one slot. Each slot is a distinct thesis — "funding rate elevated and price rising" is a different case from "high participation confirming momentum." Both can be active at the same time; each runs on its own terms. A position opens when any slot is satisfied; when none are, the scan passes.

**The criteria:**

- **fund>N** — The funding rate has reached tier N (longs paying shorts). At the default 0.25% step, `fund>1` requires FR ≥ 0.25%. Elevated positive funding means longs are carrying the cost — an overcrowded long side often vulnerable to reversal.
- **fund<-N** — The funding rate has reached tier −N (shorts paying longs). At the default step, `fund<-1` requires FR ≤ −0.25%. An overcrowded short side with carry embedded for the long.
- **+24h** — The ticker's 24-hour price change is positive. The day's character is currently bullish for this coin.
- **-24h** — The 24-hour price change is negative. The day is currently bearish for this coin.
- **V/M>N** — The ticker's 24-hour trading volume exceeds tier N of its market cap (1% step by default). `V/M>10` requires volume above 10% of market cap. A significant fraction of the coin's entire value changed hands in a day — unusually high participation that confirms momentum is broadly backed, not a thin-market artifact.
- **V/M<N** — Volume below tier N of market cap. The coin moved but the market did not chase it. This is the fade case: momentum without conviction.
- **lsa>N** — The last completed hourly candle had volume at least N tiers above the 24h hourly average and closed lower than it opened. A high-volume down candle is sell-side pressure with the market actively participating — not drifting, not choppy, but decisively pointing down. Use this to confirm bearish momentum with volume backing before entering the short side.
- **lba>N** — The mirror: volume at least N tiers above average, green close. The market pushed up into the candle and held the gains. Use this to confirm bullish momentum with genuine buying participation before entering the long side.
- **rasl>N** — The last completed hourly candle closed red with volume at least N tiers *below* the daily average — the market moved down without a volume surge. Quiet, uncontested selling: no crowd participation, no obvious catalyst. Can signal a slow bleed or a low-conviction pullback that is easier to trade than a violent spike.
- **rabl>N** — The mirror: a green candle with volume at least N tiers below average. The market drifted up without conviction. Useful for entries where you expect a measured continuation rather than a sharp move.
- **iot>N / iot<N** — OI relative to 24h turnover at tier N (1% step by default). High OI relative to turnover signals conviction or stickiness — the market is holding open positions rather than trading them away.
- **iom>N / iom<N** — OI relative to market cap at tier N. High OI signals leverage concentration — a large share of the coin's float is leveraged open interest.
- **S-Liq (Sell-Liquidation)** — Short positions accounted for at least 70% of liquidation turnover in the cycle — a decisively one-sided reading. Short liquidations are bullish; the market forced out the short side with conviction. Use this to confirm the long case has real pressure behind it. An optional depth gate can additionally require the flow to be above or below a set intensity relative to the ticker's typical hourly turnover.
- **B-Liq (Buy-Liquidation)** — Long positions accounted for at least 70% of liquidation turnover. Long liquidations are bearish; the market forced out the long side with conviction. Use this to confirm the short case. The same optional depth gate applies.
- **mS-Liq (Mixed Sell-Liquidation)** — Sell liquidations lead, but buy liquidations hold at least 30% of turnover — a contested cycle with a sell lean. Use this to capture the short-liq thesis when a clean one-sided signal is absent. The same depth gate applies.
- **mB-Liq (Mixed Buy-Liquidation)** — Buy liquidations lead, but sell liquidations hold at least 30% — a contested cycle with a buy lean. Use this to capture the long-liq thesis under mixed but directionally leaning conditions.

**Building slots**: A slot containing only "fund>1" behaves like a fund-chasing filter. A slot containing "+24h" and "vm>10" behaves like a momentum filter. A slot with all three — "+24h", "vm>10", and "fund>1" — requires momentum, participation, and a funding premium to align before opening. Adding "lsa>25" to a bearish slot demands that the last hourly candle confirm the move with volume. The building-block design lets you dial the filter from permissive to strict without changing the underlying logic.

**Auto-slot builder**: Instead of building slots by hand, the system can generate every possible combination of criteria at a chosen size automatically. At size 2 with twelve available criteria, it produces 66 base combinations. At size 3, 220. These are base-name counts — the scorecard tracks a much larger space in practice. Tiered criteria (Fund, V/M, spike, IO/T, IO/M) record the specific tier value at entry, so a single base combination like "Fund + +24h" can produce dozens of distinct scorecard entries depending on how far the funding rate was at each trade. The effective tracked variety grows with data and can far exceed the base count shown. Some criteria are inherently opposed and cannot coexist: +24h and -24h, and any two from the candle group (lsa, lba, rasl, rabl) — a candle can only close in one direction with one volume character simultaneously. Auto-generated slots containing any such pair will never see a position. Combined with auto-correction, this creates a self-pruning strategy: all valid combinations run, and the ones that consistently lose are disabled without manual intervention.

---

#### Preemptive Lock *(tentative)*

When broad market volume is running above average and aggregate open interest is elevated relative to market cap, conditions tend to turn bearish. The short side waits for this signal before entering; the long side locks out when it appears. The goal — not yet fully achieved — is reliable regime identification: knowing whether the market is bullish, bearish, or transitional before price confirms it.

---

### Reactive Techniques

Reactive techniques manage positions after entry. They fire in response to position behavior or evolving market conditions, not to conditions at the time of entry.

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

#### Add-Sizing Modes

Two modes control each add's notional contribution:

**Flat**: Every add equals the base notional. Predictable and conservative.

**DCA Escalation (Martingale)**: Each add multiplies by a configurable factor (default ×2). Positions rescue much faster and average entry improves aggressively, but margin scales exponentially. For traders comfortable with heavy per-position commitment in exchange for faster exits.

---

#### Stop Loss (SL)

Unlike Binary Mode — where a stop loss is placed at entry as a hard bracket — the reactive SL is not set until all configured DCA stages have filled. Above that point nothing else can improve the average entry; there is no further reason to hold through an unlimited adverse move.

**Placement**: Set live only after the final stage triggers — this prevents exposing the SL price during the DCA progression, where a live SL at a known price is a stop-hunt invitation.

The default threshold is −105% of entry margin. For isolated margin accounts, liquidation occurs at −75%, so this path is never reached in practice. For cross-margin, the SL prevents total account wipeout from a single position.

---

#### Loss Absorption

A losing position that has been left to run will eventually consume more capital than it can realistically return. The answer is not to hold and hope — it is to trim. Cut a portion of the position at a loss, accept it, and carry a smaller stake forward. The average entry does not improve, but the exposure does.

The first cut fires when the loss crosses the threshold. If the position is still losing at the next check, cut again — and check sooner. Each successive cut halves the wait: a position that keeps losing gets trimmed faster until it recovers or reaches the minimum tradeable size, at which point the remainder closes outright. When it does recover above the threshold, the pace resets.

For positions too large to trim cleanly in a single move, the cut is deferred and the interval locked short until the size is manageable.

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

---

#### Sacrifice and Retraction

**Sacrifice** monitors allocated margin. When allocated margin exceeds 4× the baseline per-position cost, new entries pause and one recoverable position is closed each cycle until the ratio drops. Priority: positions with at least one DCA stage triggered and PnL above −3%.

**Retraction** adds a separate tripwire: when collective unrealized PnL falls below −2.5× entry margin, sacrifice mode activates regardless of margin ratio.

---

#### Rolling Window Sacrifice

When combined unrealized loss crosses a threshold, one can either close all positions at once or only the oldest — one position per trigger. The former sweeps exposure clean; the latter reduces it gradually. Use the staged approach when you want to de-risk without abandoning the book entirely.

---

#### Cascade Triggers

**Collective Profit Cascade (CPC)**: When total unrealized book PnL crosses 2.5× entry margin, the two most profitable positions close immediately. Banked gains pass into the laggard's deficit tally. 5-minute cooldown.

**Per-Position Cascade (PPC)**: When any single position's unrealized loss drops below −2.5× entry margin, the most profitable positions close, escalating in count on each successive trigger.

---

#### Anti-Martingale (AMa)

Positions open with no TP; as price moves in the profitable direction, flat adds are placed at −1.5%, −3%, −6%, −9%, −12%, −15%, and −18% from entry. At the seventh add, a TP is set at −22% from the original entry.

A perfect AMa run returns roughly **709% on the original entry margin** at 6× leverage. If price reverses and a DCA level triggers, AMa cancels and a standard stage-based TP is set against the current weighted average.

---

---

## Market Intelligence

The system learns from its own closed positions — and from simulated positions that were never actually opened — which entry conditions have been profitable and which have not. Slot combinations that consistently lose are blocked; combinations that win rise to the top of the entry queue.

The important caveat is that in a strongly bullish regime almost every long indicator will show a positive record, and in a strongly bearish regime almost every short indicator will. The scorecard reflects the regime the system has been running in as much as it reflects genuine signal quality. This is expected behaviour, not a flaw — the regime itself is information. The scorecard's value is most apparent at the margins: identifying which specific combinations hold up when conditions are mixed, and pruning the ones that only look good because the tide was with them.

Both sides use the same record. A win for the short side is a loss for the long side, and the scorecard accounts for this — each side sees the other's outcomes inverted, so consistently losing combinations get blocked from both directions rather than just one.

When one side enters drawdown and halts, the other continues. If the other side subsequently halts too, both directions have failed simultaneously — evidence of a regime shift rather than a directional mistake. The older halt lifts at that point; the condition that justified it no longer holds.

---

## Psycho Mode

Psycho Mode is the reactive approach in its purest form — no market astrology, no data voyeurism, no binary mode. The only filter is absolute 24-hour change exceeding a threshold. All design budget is in the exit system.

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

These strategies are designed for automation. The mental overhead of manually tracking drawdown throttle states, climate profile scores, scorecard blocks, EDa TP adjustments across multiple open positions, and simultaneous management of a full position book is overwhelming in real time. Automation handles it without error.

The meta-structure approach means neither side needs to be right all day — just more right than wrong over a session. Drawdown throttling enforces a hard floor on any session's loss. The system works best when you let it run and resist the impulse to override.

**Thanks for reading, have fun!**

---
