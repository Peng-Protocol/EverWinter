# Winter-Chaser Strategy Book
**A Comprehensive Guide For All Seasons**

---

## Table of Contents
1. [Philosophy Overview](#philosophy-overview)
2. [Techniques](#techniques)
   - [Proactive Techniques](#proactive-techniques)
   - [Reactive Techniques](#reactive-techniques)
3. [Psycho Mode](#psycho-mode)
4. [Sizing](#sizing)
5. [Conclusion](#conclusion)

---

## Philosophy Overview

A seasoned trader has no directional bias. On one side they open shorts; the other they open longs, thereby covering both sides of the market from the same analytical framework.

The core insight is about **meta-structure**, not individual tickers. In any given period the market moves with a character — broadly bullish, broadly bearish, or choppy. Trying to predict what any single ticker will do inside that character is hard. Reading the character itself and trading alongside it is easier, and more consistent.

In a **bullish period**: gainers are likely to continue pumping, and losers are likely to revert upward. The better trades are longs — longs on gaining momentum, longs on oversold coins recovering. Shorts taken into that environment face headwind.

In a **bearish period**: gainers that ran up are likely to retrace, and losers are likely to extend further downward. The better trades are shorts — shorts on overbought gainers, shorts on coins still in freefall.

In a **volatile period**: neither side dominates. Coins pump and dump freely in both directions — overbought tickers snap back, oversold tickers bounce hard. Both the short side and the long side can be profitable (or in loss) simultaneously because the market is producing clear extremes on both ends.

Meta-structure is necessary without being sufficient: it says what the market has done, not what it will do in the next period. Trading with the structure still loses when the entry itself is careless, so the entry is where the proactive approach spends its effort, and the exit is where the reactive approach does.

**Two approaches coexist within this system:**

**Proactive**: Design budget spent at the entry — this asks where a ticker should be entered, and how far it is allowed to travel before the trade is judged, based on how that ticker actually behaves.

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

A session that consistently loses is either a choppy, undirected market or a wrong read on the day's character. In either case, opening more positions compounds the damage. To mitigate this, drawdown throttling works in tandem with a structural and psychological "gains locking" quota system.

When drawdown reaches the configured threshold, or conversely, once a specific profit quota is achieved, new position entries are to be suspended for a designated period of time. For drawdown; this serves to prevent exposure to continuation of adverse conditions, stay down and wait out the storm. For gains locking; it serves to protect the trader against sudden, violent regime changes, while giving psychological and operational space to prepare for subsequent legs of operation. Crucially, market scanning should continue uninterrupted even while the trader is sitting out on a drawdown throttle or a gains lock. The throttle can be lifted after a fixed interval. 

If running both longs and shorts, you may lift the throttle on your short-side operation if the long-side suffers a drawdown halt, and vice versa, an adversarial market for one end of the operation is favourable for the other. 
**Gains Continuation** extends this same logic across the aisle: a sustained winning streak on the long-side is read as confirmation of a bullish market character and therefore headwind for the short-side and vice versa. So the trader ought to trigger a halt pre-emptively on the disadvantafed side rather than waiting for the market to trigger a drawdown. 

---

#### Breakout

> "Don't chase the ticker. Make it come to you."

With Breakout, the trader enters through a conditional order placed away from the current price, at a distance taken from the ticker's own recent behavior rather than from a fixed percentage.

The idea is; tickers often move in oscillations, if the target is currently at its local top, then a long is better placed at the nearest local bottom, expecting a pullback. Whereas with shorts; if the ticker is currently at its local bottom, then a short is better placed at the nearest local top. This style of entry attempts to pre-empt adverse changes in price based on the idea that the market is constantly fluctuating. 
If the ticker moves in the opposite direction and exceeds your "worst" price (i.e you missed a good entry), then you simply open another conditional order, hoping for a new entry. Ideally you would catch the pullback before the continuation. 

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

#### Laggard Snipping

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

The Handbook covers the specific sacrifice and cascade variations Winter-Chaser runs in more detail.

---

#### Cascade Triggers

**Collective Profit Cascade (CPC)**: When total unrealized book PnL crosses 2.5× entry margin, the two most profitable positions close immediately. Banked gains pass into the laggard's deficit tally. 5-minute cooldown.

**Per-Position Cascade (PPC)**: When any single position's unrealized loss drops below −2.5× entry margin, the most profitable positions close, escalating in count on each successive trigger.

---

#### Anti-Martingale (AMa)

Positions open with no TP; as price moves in the profitable direction, flat adds are placed at −1.5%, −3%, −6%, −9%, −12%, −15%, and −18% from entry. At the seventh add, a TP is set at −22% from the original entry.

A perfect AMa run returns roughly **709% on the original entry margin** at 6× leverage. If price reverses and a DCA level triggers, AMa cancels and a standard stage-based TP is set against the current weighted average.

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

Breakout runs in binary mode, so the same sizing applies. Sizing for binary mode is simple: `total margin = positions × (notional / leverage)`. Size notional so total margin across all positions is within comfortable loss tolerance — binary SL means all positions could close at max loss simultaneously on an extreme adverse day.

**Psycho Mode:**

DCA structure adds margin at each subsequent stage, but two other mechanisms keep that growth from running away: Loss Absorption trims oversized positions before they get too large, and Sacrifice trims the book once total allocation gets too high. Layered on top of both, the Operational Balance Cap puts a hard ceiling on any single position's DCA escalation.

At default settings (50 max positions, $6 notional, 6× leverage, Operational Balance Cap on at its $500 default), the book typically uses around **$200** in allocated margin before Sacrifice starts trimming, and — because of the Operational Balance Cap — no single position's margin will grow past **$500** regardless of how far its DCA ladder runs.

**Sacrifice and Loss Absorption thresholds**

Both of these should scale with your actual operational balance rather than sitting at defaults sized for the $200–$500 range above, once you're running a smaller book.

- *Sacrifice Trigger Threshold* — set to roughly 50% of your operational balance. Example: 5 max positions and a $40 balance calls for a threshold of **4×**, landing the ceiling around $20 — half your balance, kept low deliberately for safety margin.
- *Absorption Trigger Threshold* — set to roughly 0.01× your total balance. For the same $40 balance, that's **0.40×**. This keeps individual positions from growing too large relative to your book before Loss Absorption starts trimming them.

These figures ($40 balance, 5 max positions, 4× Sacrifice, 0.40× Absorption) are the smallest configuration tested against the live setup so far. Every other setting can stay at default.

**Below $40, Winter and Chaser diverge**

At this size, Loss Absorption's lowered trigger threshold means cuts fire often — the book is simply too small to avoid tripping it regularly. Whether that's a problem depends on which side you're running:

- **Winter (short bias), below $40**: turn **Exhumation** off, turn **Laggard Absorption** off, and set **Cascade Trigger Threshold** to **0.50×**. A bearish read struggles to pay back debt that's already been absorbed off a position — Exhumation's per-position EH TP recovery target assumes the position can climb back to a personalized recovery ROI, and at this balance the debt from frequent cuts outpaces what a short can realistically claw back. With Exhumation off, that per-position repayment path is gone — so Laggard Absorption needs to come off too, since leaving it on blocks the laggard's own EDa TP (see the Handbook's *Nuances of Laggard Absorption*), and without Exhumation, EDa TP is the only recovery path left for absorbed debt. Cascade Trigger drops to 0.50× because the default threshold is sized for a much larger book — at $40, the odds of the collective float ever reaching the normal target are low enough that cascade payback events would rarely fire at all.
- **Chaser (long bias), below $40**: only **Laggard Absorption** needs to come off. Exhumation can stay on — a bullish read can generally pay back absorbed debt at this balance where a bearish one can't, so the per-position EH TP recovery path still works. Laggard Absorption still comes off regardless, for the same reason as Winter: it blocks EDa TP, and with cuts firing often at this size, giving the laggard the patient, widened EDa TP target is worth more than the cut-based absorption path it would otherwise use.

**Psycho Mode recommended Balance**: **$500** with default settings (50 max positions, $6 notional, 6× leverage).

---

## Conclusion

These strategies are designed for automation. The mental overhead of manually tracking drawdown throttle states, EDa TP adjustments across multiple open positions, pending entry orders and simultaneous management of a full position book is overwhelming in real time. Automation handles it without error.

The meta-structure approach means neither side needs to be right all day — just more right than wrong over a session. Drawdown throttling enforces a hard floor on any session's loss. The system works best when you let it run and resist the impulse to override.

**Thanks for reading, have fun!**

---
