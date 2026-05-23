# Strategy Book
**Trading Strategy Documentation**

---

## Table of Contents
1. [Philosophy Overview](#philosophy-overview)
2. [Techniques](#techniques)
   - [Proactive Techniques](#proactive-techniques)
   - [Reactive Techniques](#reactive-techniques)
3. [Strategies](#strategies)
   - [Gainers](#gainers-strategy)
   - [Advanced Follow-Through (ADV FT)](#advanced-follow-through-strategy)
   - [Fund Chasing (FUN)](#fun-fund-chasing-strategy)
   - [Sale Fishing (SalF)](#sale-fishing-salf-strategy)
   - [Psycho Mode](#psycho-mode)
4. [Sizing](#sizing)
5. [Conclusion](#conclusion)

---

## Philosophy Overview

There are two fundamentally different approaches to the same market.

**The proactive approach** spends its design budget at the entry gate — RSI filters across timeframes, volume momentum thresholds, funding rate classification, extension counters. The goal is to be selectively right before committing capital. Each strategy tries to identify a specific type of price behavior and enter only when confidence is high. Win rate matters. A missed entry is acceptable; a bad entry is a design failure.

**The reactive approach** spends almost no energy at the entry gate — a single change-percent threshold is the only filter. Instead, all design budget goes into the exit system: DCA escalation absorbs adverse moves and improves the average entry, the laggard check applies continuous pressure to the weakest position, and cascade triggers use winners to force resolution on losers. The reactive approach accepts that many entries will be wrong and plans for it structurally. Win rate is low by design. The exits are where the edge lives.

The proactive approach is more regime-dependent — it performs best when the conditions its filters are tuned for are present. The reactive approach is more consistent across market regimes because it doesn't bet on any signal being valid. It bets on the aggregate behavior of a large position book under mechanical pressure. The tradeoff is capital headroom: the reactive approach requires more margin and tolerates more simultaneous open drawdown than the proactive approach.

Neither is strictly better. They are different tools for different risk tolerances and market readings.

---

## Techniques

Techniques are the building blocks. Each strategy assembles a specific combination of them. This section defines what each technique does and why, once — strategy descriptions reference techniques without repeating their rationale.

---

### Proactive Techniques

Proactive techniques are used to decide whether and when to enter. They filter noise from signal at the entry gate.

---

#### RSI Gating

RSI is measured across three timeframes (RSI6, RSI12, RSI24) using Wilder's method. The multi-timeframe requirement ensures the over-bought or over-sold condition is present at multiple levels of resolution simultaneously — a single timeframe spike is noise; alignment across three is signal.

**Floor gates** confirm momentum is sufficiently developed for a mean-reversion trade to have fuel. **Ceiling gates** (when present) block entries into tickers still in an active pump phase — a ticker passing the floor but failing the ceiling is still pumping, not cooling.

The standard Gainers gate is **70-70-80**: RSI6 ≥ 70, RSI12 ≥ 70, RSI24 ≥ 80. RSI24 at 80 acts as the final gatekeeper to confirm genuine over-bought conditions on the daily timeframe.

RSI calibration history:
- **70-70-70**: Too aggressive — frequent false positives on runaway pumps
- **70-70-75**: Balanced — best risk/reward for most market conditions
- **70-70-80**: Strictest — fewer positions, cleanest setups

---

#### Over-Extension Detection

RSI6 hitting ≥ the configured maximum (default 90) signals a parabolic, non-mean-reverting state. These tickers are not suitable for standard entry — they require higher-conviction conditions. Two mechanisms track over-extension:

**RSI6 Maximum (Hard Disqualifier)**: When RSI6 ≥ the maximum, a standard entry is blocked. The ticker is flagged for monitoring under a more patient entry gate.

**3-Hour Graylist**: Before any entry, a historical check is advised across 15-minute candles over the past 3 hours — if any candle had RSI6 ≥ the configured maximum, the ticker is graylisted for the rest of the window. A recently over-extended ticker is prone to re-spiking rather than stabilizing — the graylist prevents premature re-entry after a parabolic move.

---

#### Close Confirmation (ClC)

Requires 3 of the last 4 completed 15-minute candles to have closed red (close < open). A backward-looking signal — the trend must already be demonstrably shifting before entry is taken.

Over-extended tickers run almost entirely on green candles up until they don't. Requiring 3/4 red closes means the reversal has shown up on the chart as a confirmed pattern, not a single-bar anomaly. Confirmed evidence is a stronger entry basis than any predictive metric for tickers exiting a parabolic phase.

---

#### Localized Sell Average (LSA)

LSA measures current selling intensity relative to the ticker's recent baseline. It compares a recent candle's volume against the average volume of the preceding lookback window.

Applied as a band — neither too thin nor too thick:
- **Floor**: Selling must be above the baseline. The ticker is actively distributing, not just drifting.
- **Cap**: Selling must not be excessively above the baseline. A volume blowoff — extreme selling crammed into one window — marks exhaustion rather than continuation.

**Post-OE reversal context**: Floor 125%, cap 150% by default. An OE ticker's baseline is heavily bullish — almost all recent candles were green. The first significant red candle reads elevated against that baseline. 125% is aggressive for a normal ticker but realistic for one that has been running hot.

**Sustained decline context**: A ticker that has been falling for hours already has selling activity baked into its recent baseline. The threshold for "above average" drops accordingly — a 25% elevation against the 24-hour hourly average is enough to confirm selling is still present and not merely drifting, capped at 50% to block exhaustion flushes even on a declining baseline.

---

#### Volume Divergence Filter

Compares a ticker's 24-hour turnover against the turnover of the top 3 and bottom 3 tickers in the candidate pool (excluding Bitcoin and the ticker itself).

- **Abnormally high volume divergence**: Coordinated pump with artificial demand injection.
- **Abnormally low volume divergence**: Thin or illiquid move — whale manipulation or shallow depth.

Despite differences in market cap, tickers with extreme volume divergence in either direction consistently exhibit manipulated pump characteristics. The filter accepts false negatives — some valid setups are missed — over false positives.

---

#### Volume Momentum (VM)

VM measures the ratio of recent volume to a prior baseline. Applied to rising tickers it confirms that active selling pressure has arrived; applied to falling tickers it confirms the decline is continuing rather than exhausting.

A volume spike far above baseline signals exhaustion rather than continuation — sellers crammed into one window are spent, not building pressure. VM is most useful applied as a band rather than a floor alone.

VM is a forward-looking signal — it measures current momentum to anticipate a coming move, as distinct from Close Confirmation which requires the reversal to already appear on the chart.

---

#### TP Ingress

When active, the entry TP for that symbol is halved on every close: the reduction follows 0.5^(close count), floored at a configurable minimum (default 3%). The reduction applies only to stage 0 and has a 3-hour TTL.

A quick re-entry after a close is showing declining sell pressure. The first entry hit TP because sellers had conviction. The second entry may not reach the same depth — downside fuel is diminishing. Tightening TP captures what is actually available rather than waiting for a move that may not come.

---

### Reactive Techniques

Reactive techniques manage positions after entry. They fire in response to how the position is behaving, not to market conditions at the time of entry.

---

#### DCA (Dollar Cost Averaging)

DCA is the core position rescue structure. When price moves against a position, pre-staged add orders trigger at progressively worse prices, increasing position size and improving the weighted-average entry. The TP rises with the average entry — each stage aims to exit cleanly from a better average, not to extract more profit from a deeper draw.

**Stage trigger spacing**:
- 3 stages: 3% / 9% / 15% above entry
- 6 stages: 1.5% / 3% / 6% / 9% / 12% / 15% above entry
- 7+ stages: continues the 3%-step progression beyond 15%

The 6-stage structure captures intermediate moves that 3-stage misses. A ticker that pumps to 10–11% and reverses is captured by the 9% and 12% triggers; 3-stage would miss it. More stages commit more margin at intermediate prices but improve precision in exactly the range where reversals most commonly occur.

**TP ROI by Stage**: The entry ROI% is divided by the stage number — stage 0 gets the full target, stage 1 half, stage 2 one-third, and so on — floored at 3%. The declining target reflects the better average entry: approximately the same dollar amount at a closer exit price.

**Final stage**: A fill on the last add is itself an invalidation of the thesis. It exists as an emergency harness, not a planned outcome.

---

#### Add-Sizing Modes

Three modes control each add's notional contribution:

**Flat**: Every add equals the base notional. Predictable and conservative. The foundation the strategy is built on — other modes trade margin for speed.

**Accumulation**: Each add scales linearly (Add1 = base × 2, Add2 = base × 3, etc.). Positions rescue faster than flat; margin grows gradually. A middle ground for traders wanting some recovery speed without heavy commitment per position.

**Doubling**: Each add multiplies by a configurable factor (default ×2). Positions rescue much faster and average entry improves aggressively, but margin scales exponentially. For traders comfortable with heavy per-position commitment in exchange for faster exits.

Neither escalation mode is recommended over the other. They are tools for traders willing to trade margin for speed.

---

#### Stop Loss (SL)

A hard exit set after all configured DCA stages have filled. Above that point nothing else can improve the average entry, and there is no further reason to hold through an unlimited adverse move.

**Placement**: Set live only after the final stage triggers — this prevents exposing the SL price during the DCA progression, where a live SL at a known price is a stop-hunt invitation.

The default threshold is −105% of entry margin. For isolated margin accounts, liquidation occurs at −75%, so this path is never reached. For cross-margin accounts, the SL prevents total account wipeout from a single position.

If the final stage has filled and the position still needs a hard stop, something is fundamentally wrong with the thesis. The SL exists to prevent catastrophic loss, not as part of normal operation.

---

#### Loss Absorption

Loss absorption trims positions that are consuming capital without recovering, freeing margin for healthier positions and progressively reducing exposure on the worst performers.

Two modes exist, differing in how aggressively they fire:

**Passive Absorption**: Cuts positions on a fixed interval unconditionally — no loss threshold required. Every active position is trimmed on a regular cadence regardless of its current PnL state. One base-notional equivalent is closed each interval. Passive absorption runs at a steady pace and does not respond to how deep in loss a position sits — it ensures every position shrinks over time regardless of behavior. Critically, "regardless of PnL state" cuts both ways: a position sitting in profit is trimmed just as readily as a losing one. Those crystallized gains feed into the laggard's payback tally and pull the EDa TP closer, meaning passive absorption chips away at the book's collective deficit from both directions simultaneously.

The interval is not fixed for the life of the position. As DCA stages fill, the clock tightens: stage 1 shortens the interval to ⅔ of the configured baseline, stage 2 to ⅓, and stage 3 to a hard 5-minute floor. A position moving against the strategy fast enough to trigger deeper DCA fills is moving fast enough to warrant faster cuts. Each cut's crystallized margin is tracked as *saved margin* — the amount that would otherwise have remained in a now-smaller position.

When a cut is due but the position is already at minimum notional, it cannot absorb further. If saved margin has accumulated, the **Passive Second Wind** fires instead: the saved margin is divided into full base-margin units, each funding one additional DCA stage placed 3% above the prior stage (compounding from the last first-wind stage). Any surplus below one full unit is added to the final new stage's notional. The existing stop-loss is cancelled immediately; it re-arms when the new highest second-wind stage fills. The DCA stage counter advances into the new stages naturally — stage 4, 5, and so on — and the SL formula applies to the new maximum as it would to any terminal stage.

Once Passive Second Wind fires, the acceleration schedule resets. The stage count used to determine the absorption interval is measured relative to the stage at which second wind activated — so the position returns to the full base interval immediately after second wind, and the clock only tightens again as further second-wind DCA stages fill. This prevents the position from entering the 5-minute floor continuously from the moment second wind fires; it must re-earn the acceleration by continuing to stage deeper.

The result is a direct conversion of margin the position has already shed into continued runway. Capital that would have remained locked in a shrinking position instead funds multiple conditional entries at progressively less favorable prices — a controlled extension of the DCA ladder, funded entirely from prior cuts, costing no new capital from the book.

**Aggressive Absorption**: Threshold-triggered — fires only when a position's unrealized loss exceeds 2.5× its base margin. Each cut is 5% of the remaining margin. The interval halves with every successive cut down to a 30-second floor; recovery above threshold resets the counter. Cuts stop once the final DCA stage fires.

If a position has been reduced to minimum notional when a cut is due, it is closed outright rather than trimmed further.

**Digestibility limit**: If a single 5% cut would crystallize more than 2.5× the base notional in loss, the cut is deferred. Forcing an oversized crystallization in one interval creates a disorderly sequence of realized losses. Deferral continues at minimum cooldown until either partial recovery or continued absorption brings the per-cut loss back within range.

DCA and absorption work the same problem from opposite ends: DCA improves where a position needs to be to close; absorption reduces how much of the position still needs to get there. Neither system completes the picture without the other.

##### Outlier Positions

When a position is disproportionate relative to the rest of the book — its margin or absolute loss exceeds a configured multiple (default 2.5×) of the average across all others — its absorption interval must be hastened to the minimum, until morale improves.

**Outlier Deceleration** is the mirror: a profit or margin outlier in the other direction (unrealized profit ≥ 2.5× average of others, or margin ≤ average/2.5) receives an add rather than a cut — 5% of current margin (minimum base notional) — updating the weighted-average entry. The same halving cooldown applies, resetting when the position is no longer an outlier.

##### The Absorption–Entry Cycle

Each absorption cut does two things simultaneously: it crystallizes a small loss and it lightens the position. When a DCA add fires into a partially absorbed position, the fixed-notional add represents a larger fraction of the remaining position than it would on an untouched entry. A heavier add relative to position size produces a more aggressive pull on the weighted-average entry — the average improves more than it would without absorption. The worse the position was when absorption started, the larger the per-add improvement becomes.

---

#### Laggard System

The laggard is the weakest position in the book, selected by either age (oldest by open time) or depth (most DCA stages triggered, age as tiebreaker). Only one laggard exists at a time.

Each position opens with an expected profit at close. The laggard's version of that target is buffered by 50% (configurable). Every subsequent close — win or loss — feeds its realized PnL into a shared tally. When the laggard's own unrealized PnL, combined with everything the rest of the book has closed, clears that buffered target, the laggard is released. A streak of strong winners can flip the tally fast enough to trigger a chain of sequential laggard closes.

The forgone profit from positions closed early is acceptable — the alternative is holding through a reversal on a position that has already stalled.

**The system is a ledger as much as an accelerant.** Profitable closes burn the deficit down; losing closes push it the other way. The laggard's required exit — the **EDa TP** (Expected Deficit Adjusted Take Profit) — moves further from the current price, hardening into debt that future wins must cover. Loss absorption cuts feed directly into this tally — each crystallized loss shifts the EDa TP further, each crystallized gain pulls it back.

**EDa Payback**: Each absorbed loss is a counted loss — it shifts the laggard's Expected Deficit and therefore its EDa TP, accumulating like a bar tab the laggard must settle directly through its own TP, or indirectly through other positions closing in profit.

**Laggard Absorption**: When the laggard's deficit reaches zero and the position is still in loss, an alternative to force-closing is available: trim 5% every 5 minutes until the position is fully drained through attrition. Unlike regular absorption, laggard absorption has no floor and will consume the position to zero. EDa TP is suppressed while this mode is active; the slow drain is the exit strategy.

---

#### Exhumation

A position that has suffered absorption cuts has proven itself difficult — repeated cuts, each crystallizing a real loss. When it eventually recovers, stopping at the regular TP means closing at profit while ignoring the debt those cuts created. Exhumation makes that debt enforceable until it is genuinely settled.

When a position carries a non-zero absorption history, its regular TP is suspended and replaced with a personalized exit — the **EH TP** (Exhumed EDa TP) — set at the level where unrealized profit covers both the original buffered expected value and every absorbed loss the position has suffered.

**Each further absorption cut pushes the EH TP lower.** Absorbed loss grows (numerator up) while margin shrinks (denominator down) — both effects widen the required spread. The position needs a more decisive favorable move after every cut.

When an exhumed position becomes the laggard, both laggard force-close and laggard absorption are suspended entirely. The position holds until its EH TP or stop-loss fires. Forcing it out early permanently forfeits the recovery.

---

#### DCA Delay

Only the first add is placed when a position opens; subsequent stages are queued and placed after a configured delay following the previous stage's fill. The delay prevents committing capital at a price the market has already passed — a ticker still moving fast enough to invalidate a stage in the minutes after a fill is not ready for the next add.

When the timer fires, the queued stage's price is checked against current price. If valid, the stage is placed as a live conditional. If price has already passed the stage, the stage is bumped higher, all remaining queued stages bump with it, and the timer restarts. Each successive bump on the same stage adds delay to the next retry — first bump waits 5 minutes, second waits 10, third 15, and so on. A running ticker progressively slows commitment; a retracing ticker finds the next attempt places immediately.

Stages are non-fungible — each stage retries at its own intended notional, never substituted with another stage's sizing.

**The delay is a boon and a bane.** Fast-moving tickers are sorted correctly. The failure mode is a ticker that pumps and then retraces while the delay is still counting: the position sits with an unrealized loss locked in, the next add is in queue, and price has already slid back through the zone where the add should have been placed. If the retrace is deep enough the position hits TP unaided. If only partial, the remaining exits are: a second pump triggers the add and the improved average finds TP before the deadline; or the deadline arrives and the position is force-closed at whatever price the ticker sits at. The delay was correctly avoiding a bad fill during the pump — the exposure that follows is the cost of that caution, not a flaw in the logic.

---

#### Second Wind

The final DCA stage filling normally arms the stop-loss. But absorption may have spent the position down significantly by that point — a position that reaches stage 7 carrying a fraction of its original margin is not the same risk as one that arrived there intact. Setting SL on a $24 position when stage 7 originally expected $64 is premature: the entry is well-averaged across all seven adds, the remaining exposure is small, and the required adverse move to SL is relatively modest.

Second Wind detects this: if current margin is meaningfully below the expected cumulative margin at the final stage, the stage count is recalibrated to the effective stage that margin represents, and new DCA orders are queued from current price. SL is deferred until the recalibrated count fills. This repeats — each time the recalibrated final stage fills under the same condition, another wind is granted.

**No thunder; no storm. No mountain; no avalanche.** In crypto, most alt pumps do not last longer than a day or two — after which they have to contract. The higher the climb, the more inevitable the fall. Aggressive absorption, DCA delay, exhumation, and second wind are designed together for exactly this: to let a position survive the worst a ticker can throw at it, then ride the reversion the next day or after. Absorption shaves exposure down through the climb. DCA delay refuses to commit capital at the wrong moment. Exhumation holds the exit door shut until the absorbed debt is genuinely settled. Second wind keeps stages alive as long as the position is lean enough to warrant more runway. By the time the avalanche arrives, what remains on the slope is a small, well-averaged position — not the bloated original.

---

#### Passive Second Wind

Where Second Wind is triggered by the final stage filling under reduced margin, **Passive Second Wind** is triggered by the absorption clock running — a cut is due, but the position is already at minimum notional and cannot absorb further. The system asks: *how much margin did we save getting here?*

Each successful absorption cut accumulates its crystallized margin into a running saved-margin tally for the position. When the tally is large enough to fund at least one additional base-margin stage, Passive Second Wind activates. The saved margin is divided into whole stage units; the remainder is added to the final new stage's notional. Each new stage is placed as a conditional 3% above the prior one, compounding from the last first-wind stage price. This is the same conditional infrastructure as DCA — it triggers on mark price, carries its own TP, and fills seamlessly into the position's stage tracking.

The existing stop-loss is cancelled on activation. The SL will re-arm automatically when the new highest second-wind stage fills, applying the same formula it would to any terminal stage. Until that fill, the position carries no SL — but it also has no margin left to lose from absorption, and the extended stages now represent the only remaining runway.

The absorption interval resets to the full base on activation. The acceleration schedule is then applied relative to the second-wind stages rather than the first-wind stages — stage 1 of the second wind (the first conditional placed after activation) re-triggers the ⅔× interval, and so on down to the 5-minute floor. The position must earn the tighter interval by filling further into the extended ladder, not simply by having been at stage 3+ before second wind fired.

Passive Second Wind costs no new capital from the book. It is entirely self-funded: the margin that left the position through earlier cuts returns as conditional entries. The position shrinks, is deemed unworthy of further capital, and then quietly converts its own debris into multiple new chances at recovery.

---

#### Negative Funding Rate Gate

When funding rates drop significantly negative, longs are being paid to hold — an incentive that draws fresh long entries and can cause sudden price spikes. For short positions already in drawdown, this is an elevated squeeze environment. Deeply negative funding is not a neutral condition; it is an active tailwind for the opposing side, and entries or further commitment made into it carry disproportionate risk.

---

#### Sacrifice and Retraction

**Sacrifice** monitors the ratio of allocated margin to what the full position cap would cost at entry stage. When allocated margin exceeds 4× that baseline — the book has DCA'd heavily — new entries pause and one recoverable position is closed each cycle until the ratio drops. Priority goes to positions with at least one DCA stage triggered and PnL above −3%, sorted profit-first. DCA depth does not protect a position; a stage 6 entry near break-even is a preferred sacrifice candidate. On broadly bullish days, sacrifice acts as a speed limiter — the strategy slows down while the market is moving against it.

Exhumed positions are deprioritized: selected only if no non-exhumed candidate exists. Sacrificing an exhumed position discards the absorption recovery path, so all other options are exhausted first.

**Retraction** adds a separate tripwire: when collective unrealized PnL falls below −2.5× entry margin, sacrifice mode activates regardless of margin ratio. Where sacrifice is a margin-usage alarm, retraction is a drawdown alarm.

**Effect on laggards**: Multiple losing closes push the laggard's EDa TP further from current price. Combined with sacrifice, a laggard can become super-hardened — requiring a strong move to TP, or enough positions closing in profit to collectively pull the EDa TP close enough to fire.

---

#### Cascade Triggers

Cascade triggers are the aggressive complement to the laggard's slow, continuous pressure.

**Collective Profit Cascade (CPC)**: When total unrealized book PnL crosses 2.5× entry margin, the two most profitable positions are closed immediately. The banked gains pass into the laggard's deficit tally — large enough wins push the deficit negative and release the laggard without it needing to reach EDa TP. The cascade is deliberate profit-taking to fund the book's debt forgiveness. 5-minute cooldown.

**Per-Position Cascade (PPC)**: When any single position's unrealized loss drops below −2.5× entry margin, the most profitable positions are closed, escalating in count on each successive trigger (default ×2 multiplier). Keeps the book circulating rather than letting a single deep loser stall everything. Escalation resets when the trigger position recovers.

Both triggers share a minimum ROI% floor — marginal winners are not consumed as cascade fuel. Exhumed positions are excluded from both triggers; their EH TP recovery path takes precedence over cascade's debt-forgiveness role.

---

#### Anti-Martingale (AMa)

Where DCA escalates into losing positions, AMa creeps into winning ones. Positions open with no take profit; as price moves in the profitable direction, flat adds are placed at −1.5%, −3%, −6%, −9%, −12%, −15%, and −18% from entry. At the seventh add, a TP is set at −22% from the original entry.

Adds are flat — the same base notional each time. Exponential sizing would create an extreme margin load if AMa staged before reversing into full DCA. Flat sizing keeps the worst-case draw manageable regardless of how far AMa progressed before the reversal.

If price reverses and a DCA level triggers, AMa is cancelled and a standard stage-based TP is set against the current weighted average entry. Prior AMa fills pull the average entry marginally less favorable, but the effect is small since flat AMa notional is dwarfed by the exponential DCA adds that follow.

A perfect AMa run — all seven adds filling and TP hitting at −22% — returns roughly **709% on the original entry margin** at 6× leverage.

---

## Strategies

Each strategy is a specific combination of techniques. The techniques are defined above; below, each strategy describes the problem it solves and which techniques it assembles to solve it.

All strategies except Psycho Mode use Passive Loss Absorption as a reactive technique — positions are trimmed on a fixed interval regardless of current profit state, with gains feeding into the laggard's payback tally alongside crystallized losses.

---

### Gainers Strategy

**"False negatives are fine, but false positives are fatal."**

Gainers identifies coins showing strong upward momentum and opens conservative short positions betting on mean reversion. It is intentionally a low-conviction, high-filter strategy — its primary role is to screen the market and feed behavioral data to downstream strategies.

**Entry assembles:**
- RSI Gating at 70-70-80 — the strictest configuration; the RSI24 at 80 acts as the final gatekeeper
- Volume Divergence Filter — organic vs. manipulated pump
- Over-Extension Disqualifier (RSI6 ≥ maximum blocks entry)
- Over-Extension Graylist (any OE hit in the past 3 hours blocks entry)
- Funding rate minimum

**Position management:**
- DCA structure (flat by default)
- Stop-loss (set after final stage fills)
- TP Ingress does not apply to Gainers

Gainers is the entry point to the tiered system. Its output is twofold: positions opened, and a stream of OE promotions to the ADV FT roster for every ticker it disqualifies on RSI6 maximum.

---

### Advanced Follow-Through (ADV FT)

ADV FT activates when a ticker demonstrates prolonged over-extension — repeated RSI6 spikes above the configured maximum within a 3-hour window. Rather than entering during the parabolic phase, ADV FT waits for the ticker to cool into a tradeable range, then enters as the reversal continues.

The core philosophy: a ticker that over-extends is exhibiting structural instability. The first hit is enough for promotion; the entry gates own the timing decision.

**Roster promotion:**
- OE Detection: RSI6 ≥ maximum triggers immediate promotion

**Entry assembles:**
- RSI Gating: floor 45 across all three timeframes; RSI6 ceiling 75 (a ticker promoted via OE sat at RSI6 ≥ 90 — by the time the reversal is confirmed, RSI6 should be meaningfully retreating, not still pinned near the top)
- Close Confirmation: 3/4 completed 15m candles red
- Funding rate minimum

Optimal LSA gate: 125% – 150%.

**Position management:**
- DCA structure at 2× margin (higher conviction than Gainers)
- TP Ingress applies on re-entry
- Stop-loss

---

### Fund Chasing (FUN)

FUN targets positive funding rates rather than RSI over-extension. A persistently positive funding rate means futures are trading above spot — that gap must close. Vol momentum confirmation verifies the downward resolution has already begun.

**"If the market is paying you to be short, that's not nothing."**

**Entry assembles:**
- Funding Rate Classification — positions are classified by rate level and ticker direction:

| Sub-Type | Condition | Slot Cost |
|---|---|---|
| HFG (High-Fund Gainer) | FR ≥ high gate, gainer | 3× |
| LFG (Low-Fund Gainer) | FR ≥ low gate, gainer | 2× |
| HFL (High-Fund Loser) | FR ≥ high gate, loser | 2× |
| LFL (Low-Fund Loser) | FR ≥ low gate, loser | 1× |

  Below the low fund floor, no entry is taken regardless of other conditions. Re-entry requires an escalating funding rate after each close on the same symbol — the gate seeds at 1.0% and multiplies ×1.5 per close, with a 6-hour TTL.
- RSI Proximity Block (RSI6 within the configured proximity of the maximum is skipped — prevents entering a ticker about to over-extend)
- RSI Minimum Gate (RSI6, RSI12, and RSI24 must all be ≥ the configured floor, default 25 — coins already oversold on any timeframe are skipped; applies in both normal and Super FUN mode)
- Historical OE Look-back (counts 15m candles at RSI6 ≥ maximum in the past 3 hours)
  - Losers with any OE hit are reclassified to the gainers gate
  - OE count scales the VM threshold multiplicatively for gainers
- Volume Momentum (threshold differs by sub-type; creeps upward per close on the same symbol)
- LSA for losers only: volume within floor/cap band confirms continued selling

**Position management:**
- DCA structure (1× to 3× margin depending on sub-type)
- TP Ingress applies on re-entry
- Stop-loss

**Re-entry Cooldown**: A configurable minimum interval (default 10 minutes) is enforced between FUN entries on the same ticker. Once opened, the ticker is gated until the cooldown expires.

**Super Fun Mode**: Strips FUN to funding rate + positive VM only. All VM thresholds, LSA checks, and creep gates are replaced by a lock-in ratchet — re-entry must match or beat the last close's funding tier within a 6-hour window. Tickers blocked by RSI proximity or OE count are admitted as the OE sub-type (1× margin, high funding gate required). Aggressive absorption is what makes this stance viable — if the ticker turns, the position is absorbed over time rather than force-closed.

After a ticker accumulates two Super FUN trades within the same hour, the bot responds based on absorption status. If absorption is active, any further re-entry on that ticker is flagged for accelerated absorption — loss cuts fire every 5 minutes rather than the standard interval. If absorption is off, re-entry is deferred entirely until the hour has cleared.

---

### Sale Fishing (SalF)

SalF is our premier red-day strategy. All previous strategies are designed around upward price action and mean reversion. SalF works in the opposite direction — it targets tickers already falling, looking for consistent and sustained selling pressure that is likely to continue rather than exhaust.

**"We're not catching a falling knife. We're riding a knife that's already falling."**

On broadly declining days, SalF is often the primary source of entries — qualifying tickers proliferate across both pools simultaneously as selling pressure spreads. On green days SalF is quiet by design; the filters naturally suppress entries when selling pressure is thin.

SalF deliberately avoids two failure modes: **exhausted entries** (the ticker has already dumped violently, sellers are spent, and a snap-back is likely — the LSA cap gates this out) and **squeezable entries** (heavy short crowding on a declining ticker increases squeeze probability — a tighter funding rate gate avoids over-shorted tickers).

**Entry assembles:**
- Close Confirmation: 3/4 completed 15m candles red (continuous decline across the past hour, not a single-candle spike)
- LSA: last-hour volume within floor/cap band (floor 25%, cap 50% vs. 24-hour hourly average)
  - The floor confirms active selling; the cap blocks entry into an exhaustion blowoff
- RSI Floor: all three timeframes above the minimum (default 25); below this, snap-back probability exceeds continuation probability
- Funding rate gate (tighter than other strategies — reduces exposure to over-shorted tickers)
- Gainer vs. Loser pool: both are scanned with the same LSA logic and separately configurable minimums
- Median Creep: the LSA floor rises and cap narrows after each close on the same symbol, tightening re-entry conditions as selling pressure weakens

**Position management:**
- DCA structure
- TP Ingress applies on re-entry
- Stop-loss

---

### Psycho Mode

Psycho Mode is the reactive approach in its purest form — no RSI gates, no volume momentum, no funding rate classification. The only filter is absolute 24-hour change exceeding a threshold. All design budget is in the exit system.

**"Short everything."**

**Book configuration:**
- 7 DCA stages at 2× escalation — each add doubles the last, deepening into the pump
- 25% entry TP ROI, decaying per stage (floored at 3%)
- Up to 50 concurrent positions, 12 tickers shorted per scan cycle
- 48-hour hard deadline as backstop; the laggard system resolves most exits before it

**Techniques in use:**

- *Aggressive Absorption* — threshold-triggered, halving cooldown; cuts directly from the offending position
- *Laggard Absorption* (optional) — trim 5% every 5 minutes through attrition when deficit clears but position remains in loss
- *Exhumation* — absorbed positions receive a personalized EH TP; regular TP and laggard rules suspended while active
- *DCA Delay* — prevents premature stage commitment on fast-moving tickers
- *Second Wind* — defers SL when absorption has reduced the position below expected margin; recalibrates and queues new stages
- *Sacrifice* — manages margin allocation; closes recoverable positions when the book has DCA'd heavily
- *Cascade Triggers* — both CPC and PPC available; exhumed positions excluded as targets
- *Anti-Martingale (AMa)* (optional) — flat adds into winning positions; TP set at −22% after all seven adds

**Why individual exhumation rather than collective payback**: A large reactive book with 2× DCA escalation and aggressive absorption accumulates losses faster than any single laggard could realistically recover. Loading all absorbed losses onto one position's tab would push the required exit to an unreachable price. Each position owning its own debt is the only workable model at this scale.

**There is no guarantee a position ever hits its EH TP.** What shifts the math: absorption has already done significant work by the time the stop fires. A position trimmed repeatedly may carry only a fraction of its original margin — $24 on what was a $64 entry. Exhumation is recovering absorbed slices from a smaller and better-entered position, not the bloated original. 2× escalation compounds the recovery — each absorption cut lightens the position; each add into a lighter position corrects the average more aggressively. Most problematic positions resolve before the deadline precisely because both systems run simultaneously. The ones that don't hit the backstop at a cost far lower than they would have carried without absorption.

Tickers that cause rapid problems are handled by the DCA delay before exhumation becomes relevant. Exhumation's domain is the slow movers — tickers that drift gradually enough for absorption to work through them, but not decisively enough for a clean TP.

---

## Sizing

At the default **$6 notional** with **6× leverage**, each position consumes **$1 margin** at stage 0. The DCA structure adds margin at each subsequent stage, so a position that fully DCA'd through all adds has consumed significantly more.

**Margin requirements for 10 open positions at $6 notional (3-stage flat):**

| Scenario | Stages Used | Margin per Position | Total Margin |
|---|---|---|---|
| Pessimistic | 0 → 2 (three stages) | $3 | $30 |
| Moderate | 0 → 1 (two stages) | $2 | $20 |
| Optimistic | 0 only (entry) | $1 | $10 |

In practice most positions close at stage 0 or 1. The final stage is an emergency — the pessimistic estimate is a true worst case.

With 6-stage flat DCA, pessimistic margin per position doubles to $6. With accumulation or doubling mode the adds scale further. If running higher stage counts or escalation modes, size notional downward accordingly — the ratios below assume flat adds.

**Sizing formula**: notional = balance × inverse ratio × leverage

| Scenario | Inverse Ratio | Balance-to-Margin | Balance-to-Notional |
|---|---|---|---|
| Pessimistic | 0.033 (1/30) | 30× (3000%) | 5× (500%) |
| Moderate | 0.05 (1/20) | 20× (2000%) | 3.3× (333%) |
| Optimistic | 0.1 (1/10) | 10× (1000%) | 1.7× (167%) |

**Example — $200 balance, moderate settings:**
200 × 0.05 × 6 = $60 notional

At $60 notional / 6× leverage = $10 margin per entry. For 10 positions at moderate depth (stage 1): 10 × $20 = $200 committed — precisely within balance.

**Psycho Mode recommended**: minimum **$250** with default settings (50 max positions, $6 notional, 6× leverage). Maximum practical exposure at 2 DCA stages average: ~**$2,500** in margin.

---

## Conclusion

These strategies are designed for automation. The mental overhead of manually tracking RSI gates across three timeframes, volume momentum calculations, historical over-extension look-backs, funding rate creep state per symbol, DCA stage management, laggard deficit tracking, LSA ratios, and multiple concurrent positions would be overwhelming and error-prone. Real-time position watching during volatile moves makes manual execution impractical.

Within these constraints the strategies yield consistent automated returns that compound over time without active management beyond initial configuration and monitoring.

**Thanks for reading, have fun!**

---
