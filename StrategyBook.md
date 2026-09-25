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

Neither system predicts the day in advance. Both sides run simultaneously, and over a session the net reflects the actual character of that day — meta-structure is necessary without being sufficient. Trading with the structure still produces losses when the specific signals driving entries are not genuinely aligned with it. Knowing which indicators are actually bullish or bearish in the current environment — not just nominally available — determines whether entries within a favorable structure produce profit or drag. This is directly addressed by a scoring system that watches every entry signal and asks not just whether it wins or loses, but *where* it's actually winning — a signal is trusted at whichever pole its own readings have genuinely been paying at, extreme or lukewarm, and distrusted at the other, rather than assuming the sharp edge is always the honest read and the middle is always noise. A candidate leaning too heavily on a pole that isn't currently paying is passed over entirely, even if every individual tag on it is technically favorable. This same mechanism benefits the counter-structure side: rather than absorbing consistent losses, it identifies pockets where the counter-trend case is supported — and in some sessions, the scorecard data is enough to put the counter-structure side in profit despite the broader directional headwind; more often, the aligned side wins decently while the counter side settles for minor losses or crabs, then the roles swap when the day's character does. The same standard doesn't stop at entry, either — a trade can be walked back out once its own signals drift off the pole that was paying when it opened, rather than being held on the strength of a read that was true then but isn't now.

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

When drawdown reaches the configured threshold, or conversely, once a specific profit quota is achieved, new position entries are suspended for a designated period of time. For drawdown; this serves to prevent exposure to continuation of adverse conditions, stay down and wait out the storm. For gains locking; it serves to protect the trader against sudden - violent regime changes, while giving psychological and operational space to prepare for subsequent legs of operation. Crucially, data collection, market scanning, and historical scorecard tracking continue uninterrupted even while the system is sitting out on a drawdown throttle or a gains lock. The throttle can be lifted either after a fixed interval or if the opposing directional side suffers a similar drawdown, indicating a shift in market direction. Do not override it early. **Gains Continuation** extends the same logic across the aisle: a sustained winning streak on the opposing side is read as confirmation of the day's character and therefore headwind for this one, so it triggers the same halt pre-emptively rather than waiting for it to show up as this side's own drawdown.

---

#### Market Reading

The entry gate is built from slots. Each slot is a set of criteria that must all be true simultaneously. A ticker qualifies for entry when it satisfies every criterion in any one slot. Each slot is a distinct thesis — "funding rate elevated and price rising" is a different case from "high participation confirming momentum." Both can be active at the same time; each runs on its own terms. A position opens when any slot is satisfied; when none are, the scan passes.

**The criteria:**

- **fund>N** — The funding rate has reached tier N (longs paying shorts). At the default 0.25% step, `fund>1` requires FR ≥ 0.25%. Elevated positive funding means longs are carrying the cost — an overcrowded long side often vulnerable to reversal.
- **fund<-N** — The funding rate has reached tier −N (shorts paying longs). At the default step, `fund<-1` requires FR ≤ −0.25%. An overcrowded short side with carry embedded for the long.
- **V/A>N** — The ticker's 24-hour trading volume is running above tier N relative to the average volume across the current sampled population (1% step by default). `V/A>10` means this ticker's volume is running 10% hotter than the rest of the sampled market right now. Unusually high participation relative to the crowd — confirms momentum is broadly backed, not a thin-market artifact.
- **V/A<N** — Volume running below tier N relative to the population average. The coin moved but participation lagged the rest of the market. This is the fade case: momentum without conviction.
- **IO/A>N / IO/A<N** — Open interest running above or below tier N relative to the average open interest across the current sampled population (1% step by default). High IO/A signals this ticker is carrying unusually heavy leveraged conviction right now compared to the rest of the market — traders are holding positions open rather than trading them away. Low IO/A signals comparatively light leverage commitment relative to the crowd.
- **OCS>N / OCS<N** — Order-count skew at tier N (1% step by default), measured as buy-fill share versus parity. Positive tiers are buy-dominant; negative tiers are sell-dominant.
- **OCX>N / OCX<N** — Order-count speed deviation at tier N (1% step by default), measured as percentage faster or slower than the full-window average order interval. Positive tiers mean this ticker is trading faster than the population average; negative tiers mean slower.
- **LTA>N / LTA<N** — The ticker's most recently completed hour of trading volume, compared to its own typical hourly pace (24-hour volume ÷ 24), at tier N (10% step by default). `LTA>3` means the last hour ran roughly 30% hotter than this ticker's own average hour. Unlike V/A, this measures a ticker against itself rather than against the crowd — a burst or lull specific to this name, regardless of what the rest of the market is doing. High LTA signals a sudden spike of interest; low LTA signals it's gone quiet relative to its own norm.
- **LPA>N / LPA<N** — The ticker's price change over the most recently completed hour, compared to the average hourly price change of every other ticker in the sampled population, at tier N (0.25 percentage-point step by default). `LPA>2` means this ticker moved about half a point more than the rest of the market did over the same hour. High LPA singles out a ticker outperforming its peers in the short term; low LPA singles out one lagging or moving against the grain.

**Building slots**: A slot containing only "V/A>10" behaves like a bare participation filter — one condition, no confirmation. Adding "fund<-1" to it requires unusual participation and a funding premium to align before opening. Adding "OCS>5" on top demands order flow lean the same way too. Each addition narrows the filter from permissive to strict without changing the underlying logic. No single reading is privileged — a slot is whatever combination of conditions you are willing to open on, and a slot of one is a perfectly valid, if permissive, thesis.

**Auto-slot builder**: Instead of building slots by hand, the system can generate the entry gate automatically from a chosen minimum: a ticker qualifies once it satisfies at least that many criteria — a floor, not a fixed count. A ticker satisfying more conditions than the minimum is credited for everything it actually exhibits, not sliced down to only the first few that happen to clear the floor — a ticker showing five genuine confirming conditions is scored on all five, not an arbitrary subset. Every criterion is tiered, so each one records the specific tier value at entry: a single qualifying condition can produce many distinct scorecard entries depending on how strong the reading was at each trade, and because a ticker's full exhibited set is scored rather than a fixed slice of it, the tracked variety reflects everything that was actually true at entry. Combined with auto-correction, this creates a self-pruning strategy: every genuinely satisfied condition counts toward the scorecard, and the ones that consistently lose are disabled without manual intervention. Because Buy/Sell Skew and Order Count Deviation are backed by data that is essentially always present, expect them to appear in a large share of matched positions once order flow tracking is turned on — that is expected behavior, not over-triggering.

---

#### Slot Blocking

Some strategies track win/loss performance not just per ticker but per originating condition — the specific market situation that triggered entry. If entries opened on a given condition have lost more than an acceptable share of position size, new entries on that specific condition pause automatically, while every other condition keeps trading normally. The pause lifts on its own once that condition's record recovers — no manual review needed.

This lets a strategy trading several independent conditions at once retire the ones quietly losing money in the current environment, without shutting down the whole strategy or waiting for someone to notice and intervene by hand.

Not every condition is a good fit for this. A condition worth pausing has to be narrow enough that turning it off only affects entries actually built on that specific case. Which readings belong on that list is a judgment call, not a fixed rule: conditions that show up in a large share of entries regardless of outcome are poor candidates, since pausing on something that broad wouldn't retire a genuinely bad idea, it would just quietly shut down most of the strategy over one rough stretch that had little to do with that particular reading. Funding rate is the clearest example of this trap — it tends to sit in a similar band across most entries in a given environment, so putting it on the pause list risks reacting to the environment rather than to anything specific about how that condition performs.

---

#### Re-entry Cooldown

A symbol that just closed doesn't immediately re-qualify for entry — it sits out for one refresh of the market snapshot before becoming eligible again. This prevents chasing the same ticker straight back into the same setup that just resolved, on information that's already gone stale.

This can apply to both outcomes alike, or to losses only — letting a symbol that just closed in profit come right back if it re-qualifies. Whether that's the better default depends on how directional the underlying signal tends to be for a given ticker: one that tends to repeat in the same direction favors letting winners run back in; one that behaves more like a coin flip favors treating both outcomes the same and sitting out regardless.

---

#### Substitution

A full book doesn't turn away a strong new candidate. Its case is scored the same way entries are, and if it clearly beats the weakest current holding, the weakest closes and the new one opens.

The bar for swapping is deliberate, not marginal — a small edge doesn't justify the round trip. A newly opened position also gets a grace period before it can be swapped out.

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

The system learns from its own closed positions — and from simulated positions that were never actually opened — which entry conditions have been profitable and which have not. Combinations that win rise to the top of the entry queue; consistently losing combinations are deprioritized. A further layer sits underneath this: every criterion the system watches is split by which end of its own range is actually paying right now, not by whether a reading is merely nominally favorable — a candidate leaning mostly on a pole that isn't currently winning is passed over outright, regardless of what the raw combination-level win/loss record looks like.

Every criterion the system watches is sorted continuously into three bands against its own recent history: an extreme high end, an extreme low end, and a lukewarm middle. This isn't a ranking of which band is more trustworthy — it's just where a reading currently sits relative to where it's recently been. Which band is actually paying is a live question with a live answer, not a fixed assumption baked into the system.

That live answer takes one of several shapes at any given time. Sometimes both extreme ends are producing profit while the middle sits quiet. Sometimes only one extreme end is working and its opposite number is a trap. Sometimes it flips entirely — the lukewarm middle is where the money is, on one side or both, while the sharp edges chop. There's no fixed hierarchy where extremes beat lukewarm or the reverse; which configuration is in effect depends entirely on the prevailing market regime, and the regime is unknowable in advance. So the system does not guess and does not assume. It keeps a running tally of every band, targets whichever ones have actually been in profit — one, two, three, or all four at once — and passes over any candidate leaning too heavily on a band that isn't currently paying. When the tally shifts, the target shifts with it, and open positions are held to the same live standard for their whole life, closed once they drift onto ground that's currently losing rather than held on the strength of a read that was true when the position opened but isn't anymore.

The same logic runs two levels down, per criterion. Every criterion carries its own bullish-favoring and bearish-favoring reading — two directions on the same signal — and each of those, in turn, gets banded into its own extreme and lukewarm reads. That's four independently scored slices per criterion, not two. A reading that only pays on its bearish-favoring side, and only at the extreme, shouldn't be credited for a win its bullish-favoring lukewarm read never actually earned — pooling them together just hides which specific slice is doing the work until the criterion as a whole looks mediocre. Each of the four is scored on its own, so a criterion earns trust exactly where it's genuinely working and loses it everywhere else, without dragging the rest of the criterion down with it.

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
- *Anti-Martingale (AMa)* (optional) — flat adds into winning positions; TP set four points past the last add. Order count is a configurable field (default seven); *Dynamic Anti-Martingale (DAMa)* (optional sub-toggle) scales that count to a live win/loss streak instead of always building the max, so a hot run gets progressively longer ladders and a cold one shrinks back to a single order

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

DCA structure adds margin at each subsequent stage, but two other mechanisms keep that growth from running away: Loss Absorption trims oversized positions before they get too large, and Sacrifice trims the book once total allocation gets too high. Layered on top of both, the Operational Balance Cap puts a hard ceiling on any single position's DCA escalation.

At default settings (50 max positions, $6 notional, 6× leverage, Operational Balance Cap on at its $500 default), the book typically uses around **$200** in allocated margin before Sacrifice starts trimming, and — because of the Operational Balance Cap — no single position's margin will grow past **$500** regardless of how far its DCA ladder runs.

**Sacrifice and Loss Absorption thresholds**

Both of these should scale with your actual operational balance rather than sitting at defaults sized for the $200–$500 range above, once you're running a smaller book.

- *Sacrifice Trigger Threshold* — set to roughly 50% of your operational balance. Example: 5 max positions and a $40 balance calls for a threshold of **4×**, landing the ceiling around $20 — half your balance, kept low deliberately for safety margin.
- *Absorption Trigger Threshold* — set to roughly 0.01× your total balance. For the same $40 balance, that's **0.40×**. This keeps individual positions from growing too large relative to your book before Loss Absorption starts trimming them.

These figures ($40 balance, 5 max positions, 4× Sacrifice, 0.40× Absorption) are the smallest configuration tested against the live system so far. Every other setting can stay at default.

**Below $40, Winter and Chaser diverge**

At this size, Loss Absorption's lowered trigger threshold means cuts fire often — the book is simply too small to avoid tripping it regularly. Whether that's a problem depends on which side you're running:

- **Winter (short bias), below $40**: turn **Exhumation** off, turn **Laggard Absorption** off, and set **Cascade Trigger Threshold** to **0.50×**. A bearish read struggles to pay back debt that's already been absorbed off a position — Exhumation's per-position EH TP recovery target assumes the position can climb back to a personalized recovery ROI, and at this balance the debt from frequent cuts outpaces what a short can realistically claw back. With Exhumation off, that per-position repayment path is gone — so Laggard Absorption needs to come off too, since leaving it on blocks the laggard's own EDa TP (see the Handbook's *Nuances of Laggard Absorption*), and without Exhumation, EDa TP is the only recovery path left for absorbed debt. Cascade Trigger drops to 0.50× because the default threshold is sized for a much larger book — at $40, the odds of the collective float ever reaching the normal target are low enough that cascade payback events would rarely fire at all.
- **Chaser (long bias), below $40**: only **Laggard Absorption** needs to come off. Exhumation can stay on — a bullish read can generally pay back absorbed debt at this balance where a bearish one can't, so the per-position EH TP recovery path still works. Laggard Absorption still comes off regardless, for the same reason as Winter: it blocks EDa TP, and with cuts firing often at this size, giving the laggard the patient, widened EDa TP target is worth more than the cut-based absorption path it would otherwise use.

**Psycho Mode recommended Balance**: **$500** with default settings (50 max positions, $6 notional, 6× leverage).

---

## Conclusion

These strategies are designed for automation. The mental overhead of manually tracking drawdown throttle states, climate profile scores, scorecard blocks, EDa TP adjustments across multiple open positions, and simultaneous management of a full position book is overwhelming in real time. Automation handles it without error.

The meta-structure approach means neither side needs to be right all day — just more right than wrong over a session. Drawdown throttling enforces a hard floor on any session's loss. The system works best when you let it run and resist the impulse to override.

**Thanks for reading, have fun!**

---
