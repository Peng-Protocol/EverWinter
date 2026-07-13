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

#### Drawdown Throttling & Gains Locking

A session that consistently loses on both sides is either a choppy, undirected market or a wrong read on the day's character. In either case, opening more positions compounds the damage. To mitigate this, drawdown throttling works in tandem with a structural and psychological "gains locking" quota system.

When drawdown reaches the configured threshold, or conversely, once a specific profit quota is achieved, new position entries are suspended for a designated period of time. For drawdown; this serves to prevent exposure to continuation of adverse conditions, stay down and wait out the storm. For gains locking; it serves to protect the trader against sudden - violent regime changes, while giving psychological and operational space to prepare for subsequent legs of operation. Crucially, data collection, market scanning, and historical scorecard tracking continue uninterrupted even while the system is sitting out on a drawdown throttle or a gains lock. The throttle can be lifted either after a fixed interval or if the opposing directional side suffers a similar drawdown, indicating a shift in market direction. Do not override it early.

---

#### Market Reading

The entry gate is built from slots. Each slot is a set of criteria that must all be true simultaneously. A ticker qualifies for entry when it satisfies every criterion in any one slot. Each slot is a distinct thesis — "funding rate elevated and price rising" is a different case from "high participation confirming momentum." Both can be active at the same time; each runs on its own terms. A position opens when any slot is satisfied; when none are, the scan passes.

Every slot requires a liquidation reading as its base — nothing else opens a position on its own. Liquidation is the strongest tell the system has; everything else (funding, momentum, participation, candle shape) exists to confirm or refine a liquidation-driven entry, not to replace one. A slot built entirely from non-liquidation criteria simply never fires.

**The criteria:**

- **fund>N** — The funding rate has reached tier N (longs paying shorts). At the default 0.25% step, `fund>1` requires FR ≥ 0.25%. Elevated positive funding means longs are carrying the cost — an overcrowded long side often vulnerable to reversal.
- **fund<-N** — The funding rate has reached tier −N (shorts paying longs). At the default step, `fund<-1` requires FR ≤ −0.25%. An overcrowded short side with carry embedded for the long.
- **Price shape** — Where has this coin's price actually been today, not just up or down but in what shape? Each reading below looks at three different windows at once — the last six hours, the last twelve, and the full day — and compares them against each other, giving a rough shape of the day rather than a single up/down number. Nothing here needs waiting for a candle to close; it reads directly off however much of the day has already happened.
  - **PEC Overbought** — Every window, short and long, is stretched to the bullish extreme at once. A move that's overheated at every horizon, not just the headline number — worth treating as due for a pause rather than fresh momentum.
  - **PEC Oversold** — The mirror: every window is stretched to the bearish extreme together. The coin is beaten down at every horizon, not just today's tally.
  - **Red Mountain** — The middle stretch of the day is more bullish than both the start of the day and the very latest reading — a peak sitting in the middle of the day's shape rather than at either end. Useful for spotting a move that already crested rather than one still building.
  - **Green Delta** — The mirror: the middle of the day dipped lower than both the start and the latest reading — a trough sitting in the middle rather than at either end.
  - **Bullish Momentum** — The most recent hours read more bullish than the last half-day, which in turn reads more bullish than the full day — each shorter window hotter than the one before it. A move that's been building steam, strongest right now rather than fading.
  - **Bearish Momentum** — The mirror: the most recent hours read weaker than the half-day, which reads weaker than the full day — a move accelerating to the downside.
- **V/M>N** — The ticker's 24-hour trading volume exceeds tier N of its market cap (1% step by default). `V/M>10` requires volume above 10% of market cap. A significant fraction of the coin's entire value changed hands in a day — unusually high participation that confirms momentum is broadly backed, not a thin-market artifact.
- **V/M<N** — Volume below tier N of market cap. The coin moved but the market did not chase it. This is the fade case: momentum without conviction.
- **lsa>N** — The last completed hourly candle had volume at least N tiers above the 24h hourly average and closed lower than it opened. A high-volume down candle is sell-side pressure with the market actively participating — not drifting, not choppy, but decisively pointing down. Use this to confirm bearish momentum with volume backing before entering the short side.
- **lba>N** — The mirror: volume at least N tiers above average, green close. The market pushed up into the candle and held the gains. Use this to confirm bullish momentum with genuine buying participation before entering the long side.
- **rasl>N** — The last completed hourly candle closed red with volume at least N tiers *below* the daily average — the market moved down without a volume surge. Quiet, uncontested selling: no crowd participation, no obvious catalyst. Can signal a slow bleed or a low-conviction pullback that is easier to trade than a violent spike.
- **rabl>N** — The mirror: a green candle with volume at least N tiers below average. The market drifted up without conviction. Useful for entries where you expect a measured continuation rather than a sharp move.
- **iot>N / iot<N** — OI relative to 24h turnover at tier N (1% step by default). High OI relative to turnover signals conviction or stickiness — the market is holding open positions rather than trading them away.
- **iom>N / iom<N** — OI relative to market cap at tier N. High OI signals leverage concentration — a large share of the coin's float is leveraged open interest.
- **OCS>N / OCS<N** — Order-count skew at tier N (1% step by default), measured as buy-fill share versus parity. Positive tiers are buy-dominant; negative tiers are sell-dominant.
- **OCX>N / OCX<N** — Order-count speed deviation at tier N (1% step by default), measured as percentage faster or slower than the full-window average order interval. Positive tiers mean this ticker is trading faster than the population average; negative tiers mean slower.
- **S-Liq (Sell-Liquidation)** — Short positions on this ticker account for at least 70% of its liquidation turnover so far — a decisively one-sided reading, acted on the instant it crosses that line rather than waiting for anything to close. Short liquidations are bullish; the market forced out the short side with conviction. Use this to confirm the long case has real pressure behind it. An optional depth gate can additionally require the liquidated value to sit a set percentage above or below the average liquidation size seen across all recorded history — a read on whether this event is unusually large or unusually small compared to what's typical.
- **B-Liq (Buy-Liquidation)** — Long positions on this ticker account for at least 70% of its liquidation turnover, same immediate reaction as S-Liq. Long liquidations are bearish; the market forced out the long side with conviction. Use this to confirm the short case. The same optional depth gate applies.
- **mS-Liq (Mixed Sell-Liquidation)** — On this ticker, sell liquidations lead, but buy liquidations still hold at least 30% of its turnover — a contested reading with a sell lean, same immediate reaction. Use this to capture the short-liq thesis when a clean one-sided signal is absent. The same depth gate applies.
- **mB-Liq (Mixed Buy-Liquidation)** — On this ticker, buy liquidations lead, but sell liquidations still hold at least 30% — a contested reading with a buy lean, same immediate reaction. Use this to capture the long-liq thesis under mixed but directionally leaning conditions.
- **0-Liq (No Liquidation)** — Nothing was liquidated on this ticker for the entire sample window — the mirror case to every liquidation reading above. Unlike the four above, there's no way to observe an absence in real time, so this one only resolves once the latest cycle finishes. If one-sided liquidation flow across the market is consistently bullish, the complete absence of liquidation is a distinct condition worth treating on its own terms rather than lumping in with a quiet mixed cycle.
- **Past Liquidation (recently active, not decisive)** — This ticker had a real liquidation event recently, but it never grew large or one-sided enough to trigger an instant S-Liq/B-Liq-style reading, and it wasn't clean enough to qualify as 0-Liq either. It sits in the gap between the two — something happened, just not decisively. Rather than throw these tickers out, this reading lets any of the other confirming conditions (funding, participation, price shape, candle character) trade on their own merits against exactly this pool, without pretending the ticker is either liquidation-decisive or liquidation-free.
- **Buy/Sell Skew** — What share of a ticker's recent order flow was buys versus sells, measured directly from filled trades rather than inferred from price. A strong buy lean confirms genuine demand behind a move; a strong sell lean confirms genuine supply. Unlike most criteria here, order flow exists on every liquid ticker at every moment — there is no waiting for a spike or a fresh data fetch to line up. Treat it the way you'd treat the day's up/down direction: nearly always available, and worth including in almost any slot as a light confirming filter rather than reserving it for rare setups.
- **Order Count Deviation** — How a ticker's order pace compares to the broader market's current pace, not a fixed speed — and by how much. The comparison point is a rolling average built from a wide window of recent readings across many tickers, so it moves with the market rather than sitting on some fixed number that goes stale as the overall pace shifts. A ticker running well ahead of that pace is trading unusually rapidly right now; one running well behind it is quiet relative to what's typical. Pace also tends to quicken in an uptrend and slow in a downtrend, consistent with other order-count-based readings — treat a ticker pulling ahead of the pack as mild bullish confirmation and one falling behind as mild bearish confirmation, not a standalone signal. Same always-on caveat as Buy/Sell Skew: this is one of the few signals with no downtime, so it shows up often and should be weighted as a routine confirming factor, not a special case. One exception: on a ticker whose live liquidation reading just triggered entry, running well ahead of pace is expected on its own — a liquidation cascade is itself a burst of forced trades. There, a fast reading isn't independent confirmation of anything; it's a direct side effect of the same event that already opened the position, and shouldn't be weighted as though it adds new information.

**Building slots**: A slot containing only "S-Liq" behaves like a bare liquidation filter — no confirmation, just the base signal. A slot containing "S-Liq" and "V/M>10" requires the liquidation to also come with unusually high participation. A slot with "S-Liq", "V/M>10", and "fund<-1" requires liquidation, participation, and a funding premium to all align before opening. Adding "R-ABL>25" to that same slot demands the last hourly candle confirm the move with volume too. Each addition narrows the filter from permissive to strict without changing the underlying logic — but the liquidation reading itself is never optional, it's the base every slot is built on. The one exception is Past Liquidation: since that reading is really about *which tickers the slot gets tested against* rather than a condition written into the slot, a Past Liquidation slot is built entirely from secondary criteria with no liquidation reading named in it at all — the pool restriction does that job instead.

**Auto-slot builder**: Instead of building slots by hand, the system can generate the entry gate automatically from a chosen minimum: a ticker qualifies once it satisfies a liquidation reading (or the Past Liquidation pool restriction) plus at least that many secondary criteria — a floor, not a fixed count. A ticker satisfying more conditions than the minimum is credited for everything it actually exhibits, not sliced down to only the first few that happen to clear the floor — a ticker showing five genuine confirming conditions is scored on all five, not an arbitrary subset. When Past Liquidation is one of the active readings, the same floor applies to secondary-only qualification, since there's no liquidation reading to anchor on there — see **Building slots** above. Tiered criteria (Fund, V/M, spike, IO/T, IO/M, Order Count Deviation) record the specific tier value at entry, so even a single qualifying condition can produce many distinct scorecard entries depending on how strong the reading was at each trade — and because a ticker's full exhibited set is scored rather than a fixed slice of it, the tracked variety reflects everything that was actually true at entry. Some secondary criteria are inherently opposed and cannot coexist: the three price-shape opposite pairs (PEC Overbought/Oversold, Red Mountain/Green Delta, Bullish/Bearish Momentum), and any two from the candle group (lsa, lba, rasl, rabl) — a candle can only close in one direction with one volume character simultaneously, so no ticker can ever exhibit both sides of one of these pairs at once. Combined with auto-correction, this creates a self-pruning strategy: every genuinely satisfied condition counts toward the scorecard, and the ones that consistently lose are disabled without manual intervention. Because Buy/Sell Skew and Order Count Deviation are backed by data that is essentially always present, expect them to appear in a large share of matched positions once order flow tracking is turned on — that is expected behavior, not over-triggering.

---

#### Slot Blocking

Some strategies track win/loss performance not just per ticker but per originating condition — the specific market situation that triggered entry. If entries opened on a given condition have lost more than an acceptable share of position size, new entries on that specific condition pause automatically, while every other condition keeps trading normally. The pause lifts on its own once that condition's record recovers — no manual review needed.

This lets a strategy trading several independent conditions at once retire the ones quietly losing money in the current environment, without shutting down the whole strategy or waiting for someone to notice and intervene by hand.

Not every condition is a good fit for this. A condition worth pausing has to be narrow enough that turning it off only affects entries actually built on that specific case — the liquidation reading itself is always eligible, and the more situational secondary readings can be added on top of it. Which readings actually belong on that list is a judgment call, not a fixed rule: conditions that show up in a large share of entries regardless of outcome are poor candidates, since pausing on something that broad wouldn't retire a genuinely bad idea, it would just quietly shut down most of the strategy over one rough stretch that had little to do with that particular reading. Funding rate is the clearest example of this trap — it tends to sit in a similar band across most entries in a given environment, so putting it on the pause list risks reacting to the environment rather than to anything specific about how that condition performs.

---

#### Re-entry Cooldown

A symbol that just closed doesn't immediately re-qualify for entry — it sits out for one refresh of the market snapshot before becoming eligible again. This prevents chasing the same ticker straight back into the same setup that just resolved, on information that's already gone stale.

This can apply to both outcomes alike, or to losses only — letting a symbol that just closed in profit come right back if it re-qualifies. Whether that's the better default depends on how directional the underlying signal tends to be for a given ticker: one that tends to repeat in the same direction favors letting winners run back in; one that behaves more like a coin flip favors treating both outcomes the same and sitting out regardless.

---

#### Substitution

A full book doesn't turn away a strong new candidate. Its case is scored the same way entries are, and if it clearly beats the weakest current holding, the weakest closes and the new one opens.

The bar for swapping is deliberate, not marginal — a small edge doesn't justify the round trip. A newly opened position also gets a grace period before it can be swapped out.

A currently-winning position is protected by default regardless of rank, and a confirmed liquidation-absence reading can't be bumped by a live liquidation-driven candidate. Both protections can be turned off, leaving the decision on rank alone.

This is an entry-gate decision, not a reaction to a struggling position.

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

The README covers the specific sacrifice and cascade variations Winter-Chaser runs in more detail.

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

The system learns from its own closed positions — and from simulated positions that were never actually opened — which entry conditions have been profitable and which have not. Combinations that win rise to the top of the entry queue; consistently losing combinations are deprioritized.

The definitive directional and regime signal for the system is the presence or absence of liquidation events on a ticker, serving as the most potent gauge available.

The system does not presuppose which way the market will move. It runs the liquidation-event read, the liquidation-absence read, and the recently-active-but-not-decisive read on both sides at once, rather than committing to one based on an assumed regime. The scorecard decides which reads are actually working: a losing path pauses itself while the winning paths keep trading, no regime label required. This is Market Intelligence applied directly — no fixed assumptions, only continuous adjustment to what is actually working.

The scorecard also remains highly useful for the explicit acts of substitution and ordering entries, as secondary, lesser indicators frequently prove to be valuable supplemental filters to refine your execution queue.

Both sides use the same record. A win for the short side is a loss for the long side, and the scorecard accounts for this — each side sees the other's outcomes inverted, so consistently losing combinations are deprioritized from both directions rather than just one.

When one side enters gains quota and halts, the other halts as well. This is more psychological than functional, one side winning the session is an indicator both sides should take a break and prepare for regime change. 

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
- *Loss Absorption* — threshold-triggered, halving cooldown
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
