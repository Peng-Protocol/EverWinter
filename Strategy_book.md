# PseudoWinter Strategy Book
**Version 1.1 — Trading Strategy Documentation**

---

## Table of Contents
1. [Gainers Strategy](#gainers-strategy)
2. [Advanced Follow-Through (ADV FT)](#advanced-follow-through-strategy)
3. [Fund Chasing (FUN)](#fun-fund-chasing-strategy)
4. [Sale Fishing (SalF)](#sale-fishing-salf-strategy)
5. [General Mechanics](#general-mechanics)
6. [DCA Delay](#dca-delay)
7. [Psycho Mode](#psycho-mode)
8. [Conclusion](#conclusion)

---

## Philosophy Overview

PseudoWinter employs a **tiered conviction system** where strategies cascade from low to high conviction based on price behavior and accumulated signals. Each strategy serves dual purposes:
1. **Direct profit generation** from positions opened
2. **Data collection** to inform downstream strategies

The strategies are organized around three distinct observation paths:

**Gainers path** — A ticker showing strong upward momentum is entered by Gainers. If it is simultaneously over-extended (RSI6 hitting the configured maximum), it qualifies for Advanced Follow-Through via the extender counter.

**FUN path** — A parallel, independent scan evaluates tickers with positive funding rates across the top gainers and worst losers pools. FUN entries are funding-rate-driven rather than RSI-driven, and operate on their own conviction tier.

**SalF path** — A separate red-day scan targets tickers already in a consistent, sustained decline. Where all other strategies are designed around upward price action and mean reversion, SalF is the only strategy built to perform when the market is broadly falling.

In the most advantageous scenario, a single ticker flows through multiple strategies as it degrades:
1. Gainer enters → over-extension → ADV FT entry → SalF entry
2. **Result**: Multiple trades extracted from one ticker's lifecycle

---

## Proactive vs Reactive

EverWinter and PsychoWinter represent two fundamentally different approaches to the same market.

**EverWinter is proactive.** It expends its design budget at the entry gate — RSI filters across timeframes, volume momentum thresholds, funding rate classification, extension counters. The goal is to be selectively right before committing capital. Each strategy tries to identify a specific type of price behavior and enter only when confidence is high. Win rate matters. A missed entry is acceptable; a bad entry is a design failure.

**PsychoWinter is reactive.** It expends almost no energy at the entry gate — a single change% threshold is the only filter. Instead, all design budget goes into the exit system: DCA escalation absorbs adverse moves and improves the average entry, the laggard check applies continuous pressure to the weakest position, and cascade triggers use winners to force resolution on losers. PsychoWinter accepts that many entries will be wrong and plans for it structurally. Win rate is low by design. The exits are where the edge lives.

The practical implication: EverWinter's performance is more regime-dependent — it performs best when the conditions its filters are tuned for are present. PsychoWinter's performance is more consistent across market regimes because it doesn't bet on any signal being valid. It bets instead on the aggregate behavior of a large position book under mechanical pressure. The tradeoff is capital headroom: PsychoWinter requires more margin and tolerates more simultaneous open drawdown than EverWinter.

Neither approach is strictly better. They are different tools for different risk tolerances and market readings.

---

## Gainers Strategy

### Overview
Gainers is the **entry point** for the tiered strategy system. It identifies coins showing strong upward momentum and opens conservative SHORT positions, betting on mean reversion after over-bought conditions develop. Gainers is intentionally designed as a **low-conviction, high-filter strategy** — its primary role is to screen the market and feed behavioral data to downstream strategies.

### Core Philosophy
**"False negatives are fine, but false positives are fatal."**

- **Missing a trade** (false negative) = opportunity cost only
- **Entering a runaway pump** (false positive) = actual capital loss

Gainers prioritizes **quality over quantity**. Better to pass a questionable setup to a more specialized strategy than risk capital on an unstable pump.

---

### Entry Criteria

#### 1. **RSI Gates: 70-70-80**
We check three RSI timeframes to confirm over-bought conditions:
- **RSI6**: 70 minimum
- **RSI12**: 70 minimum  
- **RSI24**: 80 minimum

**Evolution of RSI Calibration**:
- **70-70-70**: Too aggressive — frequent false positives (runaway pumps)
- **70-70-75**: Balanced — best risk/reward for most market conditions
- **70-70-80**: Strictest — fewer positions, cleanest setups

The third gate (RSI24) at 80 acts as the final **gatekeeper** to ensure the ticker is genuinely over-bought on the daily timeframe.

#### 2. **Top Gainer Pool**
- We evaluate a **finite pool of top gainers** (typically 25 candidates, sorted by 24hr% gain descending)
- This indirectly filters out large-cap tickers (BTC, ETH, SOL, BNB, XRP) which rarely experience significant inter-day price movements despite their disproportionately high volume

#### 3. **Volume Divergence Filter**
All gainers show abnormally high local volume, but extreme volume divergence indicates manipulation:

**How We Check**:
- Compare the ticker's **24-hour turnover** against the **top 3 tickers** and **bottom 3 tickers** in our candidate pool
- Exclude the ticker itself and Bitcoin from the comparison

**Red Flags**:
- **Abnormally HIGH volume** → Coordinated pump (artificial demand injection)
- **Abnormally LOW volume** → Thin/illiquid pump (whale manipulation, low market depth)

**Why This Works**:
Despite tickers having different market caps and reacting differently to buyer influx, consistently across all market conditions, coins with extreme volume divergence exhibit **manipulated pump characteristics**. The filter identifies organic gainer behavior vs. orchestrated moves.

**Edge Cases**:
- One or two low-volume pumps can crowd the top 3, giving everything else high vol div
- Abnormally high-volume coin in the low gainers creates inverse skew
- These scenarios produce **acceptable false negatives** — we simply skip those entries

#### 4. **RSI6 Maximum: 90 (Over-Extension Disqualifier)**
Rather than being a bullish signal, **RSI6 > 90 is a sign of doom**.

A coin with RSI6 at 90 is **out of control** — parabolic and non-mean-reverting. These tickers are:
- **Excluded from Gainer entries**
- **Tracked by the extender counter** for potential Advanced FT promotion

This is a **hard ceiling**, not a trading signal. Over-extended tickers require higher-conviction strategies with different risk parameters.

#### 5. **Over-Extension Memory (3-Hour Graylist)**
Before entering, we check if the ticker has **already over-extended in the past 3 hours** using 15-minute candles. If any candle in that window had RSI6 ≥ the configured maximum, the ticker is graylisted and skipped.

**Rationale**:
If a coin was recently over-extended, there's high probability it will:
- **Re-spike** instead of stabilizing
- Exhibit continued parabolic behavior
- Generate false entries that quickly reverse

The 3-hour graylist prevents premature re-entry after a parabolic move settles.

---

---

## Advanced Follow-Through Strategy

### Overview
Advanced Follow-Through activates when a ticker demonstrates **prolonged over-extension** — repeated RSI6 spikes above the configured maximum within a 3-hour window. Rather than entering during the parabolic phase, ADV FT waits for the ticker to cool into a tradeable range, then enters as the reversal continues.

ADV FT enters based on the ticker's accumulated historical behavior (repeated over-extension hits) rather than requiring repeated gainer entries to succeed against it first.

### Core Philosophy
A ticker that over-extends within a three-hour window is exhibiting structural instability. We don't need to see it burn repeatedly to act — LSA and ClC are competent enough at timing entries into OE tickers. The first hit is enough for promotion; the entry gates own the rest.

---

### Promotion to Advanced FT Roster

When a ticker's RSI6 hits ≥ the configured maximum, it is **immediately promoted** to the ADV FT roster (default threshold: 1 hit). The gainer scan graylists the symbol for the duration of the ADV FT window, suspending normal gainer entries.

The over-extension hit count is tracked within a 3-hour TTL and is visible directly in the FT roster/radar — ADV FT rows are marked with ⚡ and show the OE count. Per-tick polling continues bumping the count while the ticker remains on the roster, but entry decisions are owned entirely by LSA and ClC.

The threshold is configurable upward for operators who prefer to require repeated burns before promotion, but the default is immediate.

If the roster is full, the ticker with the **lowest funding rate** (most over-shorted, least desirable) is evicted first, then the oldest entry.

---

### Entry Criteria

#### 1. **RSI Floor: > 45**
All three RSI timeframes (RSI6, RSI12, RSI24) must be **above 45**. There is no upper ceiling.

The ticker was at RSI6 ≥ 90 during over-extension. The RSI floor ensures momentum hasn't completely collapsed before we enter. The ceiling has been removed — LSA and ClC are competent enough at timing entries into OE tickers. If selling volume is elevated but not exhausted (LSA) and closes are confirming the trend shift (ClC), the entry is valid regardless of how high RSI sits.

#### 2. **Close Confirmation (ClC)**

ADV FT uses **Close Confirmation** — recent price closes — to confirm a trend shift before entering.

* **The Gate**: Of the last 4 completed 15m candles, at least **3** must have closed red (close < open).

#### 3. **LSA (Localized Sell Average) Filter** *(optional, off by default)*

**LSA** measures the intensity of current selling relative to the ticker's recent average. For ADV FT, it gates entries to a configurable band — neither too thin (insufficient selling momentum) nor too thick (volume blowoff already spent). ClC alone may be sufficient; LSA is available if you want the extra confirmation layer.

* **The Logic**: LSA compares the volume of the most recent completed 15m candle against the average volume of the preceding candles in the lookback window. A ratio in the target band confirms that selling is elevated but not exhausted.
* **Why the High Floor**: An over-extender's baseline volume is skewed bullish — nearly all recent candles were green. By the time a reversal is underway, the first significant red candle already reads elevated relative to that baseline. A floor of **125%** is aggressive for a normal ticker, but realistic for one that has been running hot.
* **The Band Gate**: ADV FT uses a **range gate** — the ratio must fall between a configurable floor and cap:
  * **Floor** (default **125%**): The last candle's volume must be at least 125% above the window average, confirming that selling has materially overtaken the prior buying baseline.
  * **Cap** (default **150%**): If the ratio exceeds the cap, the entry is skipped — too much selling in a single bar signals a **volume blowoff**, a potential last-gasp spike before a relief bounce.
* **For FUN Losers (LFL/HFL)**: These use a separate, tighter range gate — the minimum is lower (default **15%**) and the cap is lower (default **50%**). Because these tickers do not have the same financial energy running through them, their candles naturally skew red, so the threshold for "elevated selling" is lower. The cap prevents entering into what may be a final flush rather than a sustained reversal.

#### 4. **Funding Rate Filter**
Same as Gainers: funding rate must exceed the configured minimum (default −0.05%).

---

### Why ClC Replaced VM for ADV FT

ADV FT's edge comes from entering *after* a parabolic over-extension has begun to reverse — not from predicting when it will. Volume Momentum is a forward-looking signal: it tries to anticipate a coming slump by measuring selling pressure ratios. Close Confirmation is backward-looking: it requires the reversal to have already shown up as red closes on the 15m chart.

Over-extended tickers are almost entirely green candles on the way up — right until they aren't. By the time 3 of the last 4 completed 15m candles are red, the trend has demonstrably shifted. That confirmed evidence is a stronger entry basis for ADV FT than a predictive VM score.

VM is retained for FUN, where the prediction context is different.

---

### Why 2× Margin

Advanced FT uses **2× margin**. The ticker has demonstrated extreme behavior through repeated over-extension. When it finally cools into tradeable range, the conviction is high that the downward movement will continue. This justifies higher margin than Gainers (1×).

---

## Fund Chasing (FUN) Strategy

### Overview
Fund Chasing (FUN) is a **parallel, independent strategy** that targets positive funding rates rather than RSI over-extension. It operates on the thesis that a persistently positive funding rate — one significant enough to cost shorts meaningful capital per settlement cycle — is itself a structural signal worth trading against.

FUN runs its own scan pass each cycle, evaluating two distinct pools: the **top gainers** (by 24h change) and the **worst losers** (−3% to −99% by 24h change). These are treated as separate sub-populations with different entry criteria, position costs, and vol momentum thresholds.

---

### Core Philosophy

**"If the market is paying you to be short, that's not nothing."**

A high positive funding rate signals that the futures price is trading above spot — longs are paying shorts to hold their positions. The direct carry income is negligible over a typical position duration, but the rate is a reliable structural signal: the gap between futures and spot must close. That closure happens one of two ways — spot rises to meet futures (bad for us), or futures falls to meet spot (good for us). Vol momentum confirmation is how we verify that the downward resolution has already begun.

---

### Sub-Types and Slot Cost

FUN positions are classified by funding rate level and whether the ticker is a gainer or loser. Classification determines both how many position slots the trade consumes and the base vol momentum threshold:

| Sub-Type | Condition | Slot Cost | Notes |
|---|---|---|---|
| **HFG** (High-Fund Gainer) | FR ≥ high gate (default 0.1%), gainer | 3× | Highest cost, most conviction |
| **LFG** (Low-Fund Gainer) | FR ≥ low gate (default 0.05%), gainer | 2× | Moderate cost, moderate conviction |
| **HFL** (High-Fund Loser) | FR ≥ high gate, loser | 2× | Moderate cost, downtrend already confirmed |
| **LFL** (Low-Fund Loser) | FR ≥ low gate, loser | 1× | Lowest cost, weakest signal |

If a ticker's funding rate does not meet the low gate floor, it is skipped entirely.

---

### Entry Criteria

#### 1. **Funding Rate Classification**
The funding rate determines the sub-type, slot cost, and base VM threshold. A ticker below the low-fund floor produces no FUN entry regardless of other conditions.

#### 2. **FR Creep Gate**
After the first FUN close on a symbol, a **funding rate re-entry gate** is seeded at 1.0% and multiplied ×1.5 per subsequent close (6-hour TTL). This prevents continuously re-entering the same ticker at a declining funding rate. Once the TTL expires the gate lifts automatically.

#### 3. **RSI Proximity Block**
If RSI6 is within the configured proximity band of the maximum (e.g., within 10% of 90), the ticker is skipped. This prevents entering a ticker that may be about to over-extend.

#### 4. **Historical Over-Extension Look-back**
Before evaluating vol momentum, we count how many 15-minute candles in the past 3 hours had RSI6 ≥ the configured maximum. This count is the **single source of truth** for the over-extension multiplier applied to the VM threshold — it cannot be double-counted.

- **For losers**: any over-extension in the look-back means the ticker is behaving like a gainer — it is evaluated under the gainers gate instead of the losers gate.
- **For gainers**: over-extension hits raise the VM floor multiplicatively (see below).

#### 5. **Volume Momentum Gate**
Vol momentum thresholds differ by sub-type and direction:

- **Gainer sub-types (HFG, LFG)**: Base threshold is configurable (default HFG = 10%, LFG = 20%). Per each re-entry close, the threshold creeps upward by a configurable percentage (default 10% per close). If the look-back found over-extension candles, the creeped threshold is further multiplied by `(1 + OEStepPct/100)^n` where n is the over-extension count.

- **Loser sub-types (HFL, LFL)**: The base threshold is expressed as a negative vol mom minimum (default HFL = −10%, LFL = −5%). Creep tightens the threshold toward zero. OE losers are reclassified to the gainers gate (see above).

#### 6. **LSA (Localized Sell Average) Check** — Losers Only
For loser candidates, the last completed 15-minute candle's volume must be **above the window average** but **below the spike cap** (default ±50% from average). This confirms continued selling activity without a volume blowoff that would suggest exhaustion rather than continuation.

Droughts (≤ avg), neutral (at avg), and spikes (> cap) are all blocked.
---

### Why FUN Addresses Over-Extended Tickers

Over-extended tickers are excluded from the Gainers path but can still carry a positive funding rate. FUN captures these when vol momentum — scaled by OE count — confirms that selling pressure has begun. The higher the OE count, the more confirmation required before entry.

---

## Sale Fishing (SalF) Strategy

### Overview

Sale Fishing is the only **red day** strategy in EverWinter. Every other strategy — Gainers, ADV FT, FUN — is designed around upward price action and mean reversion. SalF works in the opposite direction: it targets tickers that are already falling, looking for consistent and sustained selling pressure that is likely to continue rather than exhaust.

On red market days, SalF is often the dominant source of entries. During a market-wide meltdown, qualifying tickers proliferate across both the gainer and loser pools simultaneously. The bot's default position count was increased partly to accommodate this volume — on a bad day it could legitimately short nearly everything on the board.

On green days SalF is quieter by design. The filters naturally suppress entries when selling pressure is thin and tickers are moving upward. Calibration of those green-day boundaries is ongoing.

---

### Core Philosophy

**"We're not catching a falling knife. We're riding a knife that's already falling."**

SalF is not about picking a top or timing an exhaustion point. It's about identifying tickers that are already in a clean, continuous decline over the past hour and entering while that pressure still has room to run.

The strategy deliberately avoids two failure modes:

1. **Exhausted entries** — the ticker has already dumped violently in one or two candles, sellers are spent, and a snap-back bounce is likely. The LSA cap gates this out.

2. **Squeezable entries** — the ticker is visibly in distress, which attracts late shorts piling in after the fact. Heavy short crowding on a declining ticker increases the probability of a stop-hunt spike. The tighter funding rate gate (−0.005%) avoids such entries.

---

### Entry Criteria

#### 1. **Consistent Decline: 3/4 Red Candle Rule**

The last four completed 15-minute candles must contain at least three red closes. This confirms a continuous decline across the past hour rather than a single-candle spike pulling the average down.

#### 2. **LSA Window: Floor and Cap**

LSA (Localized Sell Average) compares the last hour's sell volume against the ticker's 24-hour hourly average. This tells us whether current selling activity is elevated relative to the ticker's normal baseline.

- **Floor**: Last-hour volume must be meaningfully above average (default +25%). This confirms active selling pressure is present — the ticker is not just drifting.
- **Cap**: Last-hour volume must not be excessively above average (default +50%). A volume blowoff — extreme selling crammed into a single window — typically marks exhaustion rather than continuation. We do not want to enter after sellers have already given everything they had.

The window tightens after each SalF close on a symbol (**median creep**): the floor rises and the cap falls toward the midpoint. This prevents repeatedly re-entering the same ticker as its selling pressure weakens over time.

#### 3. **RSI Floor**

All three RSI timeframes (RSI6, RSI12, RSI24) must be above a configurable minimum (default 25). Below this level a ticker is stretched so far oversold that a snap-back becomes more probable than continuation.

#### 4. **Funding Rate Gate (Tighter Than Other Strategies)**

SalF applies a stricter funding rate floor than other strategies. Tickers in visible distress are attractive to late shorts — people entering after the move has already started. When short interest builds on a declining ticker, the conditions for a short squeeze improve. A tighter funding rate minimum reduces exposure to tickers that are already over-shorted and susceptible to a squeeze against us.

#### 5. **Gainer vs. Loser Band**

SalF scans both the top gainers pool and the worst losers pool:

- **Gainers selling off ("fresh")**: Tickers that were positive on the day but are now actively declining. The selling pressure is working against the day's positive backdrop — if it's strong enough to push through, the move may have more runway.
- **Losers selling off ("stale")**: Tickers already down on the day continuing lower. The decline is in the direction of the day's trend, but these tickers may be closer to finding support. Both use the same LSA logic with separately configurable minimums. The gainer/loser distinction is an area of ongoing refinement.

---

## General Mechanics

### DCA (Dollar Cost Averaging) Structure

**Our Strongest Weapon**

The DCA structure is our strongest weapon and allows us to be **a little wrong** — we increase margin and get a better average entry. The structure was devised through trial and error based on observed pump capacity:

- Most coins **cannot pump 3%** after already being recently pumped or over-extended
- Some can pump **9%**
- Very few can pump **15%**

**Stage Structure**: Entry (Stage 0) → Add1 → Add2 → ... → AddN

Each "add" order triggers at a progressively higher price (price moving against us), increasing position size and improving the average entry. As a result, each subsequent stage has less weight on the average than the one before it.

The configurable stage count determines where add triggers are placed:

- **3 stages**: adds at 3% / 9% / 15% above entry
- **6 stages**: adds at 1.5% / 3% / 6% / 9% / 12% / 15% above entry
- **7+ stages**: continues the 3%-step progression beyond 15%

The 3-stage and 6-stage final triggers both land at 15%, but 6 stages inserts intermediate steps. This matters in practice: a ticker that pumps to just under the 3% A1 threshold will bounce back and crab, never hitting TP, on a 3-stage setup. On 6 stages, the 1.5% A1 catches that intermediate move. The same dynamic plays out between 9% and 15% — there are regularly tickers that pump to 10–11% and reverse, which 6 stages captures where 3 stages would not.

The trade-off with more stages is that intermediate adds pull the average entry further from the current price, committing more margin at prices that may resolve on their own. Higher stage counts are worth considering for users who frequently see positions stall just short of an add trigger. For most use cases 3 or 6 stages is sufficient — 7+ stages are available for more unusual scenarios.

**TP ROI by Stage**: `entryTpRoi / (stage + 1)`, floored at 3%

The TP percentage decreases with each stage because our average entry gets better. The structure is designed so that at each DCA stage the TP yields approximately the same dollar amount as the original entry would have if it went perfectly. We are not trying to make more profit from the DCA — just exit cleanly from a better average.

**Example at default 6% entry TP**: Stage 0 = 6%, Stage 1 = 3% (floor).

**Why This Works**: Each pump makes it relatively easier for us to exit. As price moves against us and triggers adds, our average entry price rises and our TP price rises with it. Even questionable strategies can often be rescued by the DCA structure.

**Final Stage = Emergency Harness**: A trigger on the last DCA add is itself an invalidation of the strategy. It exists as an emergency harness, not a planned outcome.

---

### Add-Sizing Modes

Three modes control how much notional each DCA add contributes:

**Flat** (default): Every add equals the base notional. Simple, predictable, and the foundation the strategy is built on. Flat DCA should function well on its own — escalation modes exist to hasten recovery, not to fix a strategy that doesn't work.

**Accumulation**: Each add scales linearly — Add1 = base × 2, Add2 = base × 3, Add3 = base × 4, and so on. This is a middle ground: positions rescue faster than flat because later adds carry more weight, but margin commitment grows gradually rather than explosively. Suited for users who want some of the speed and improved rescue of escalation without committing heavily to every position that goes against them.

**Doubling**: Each add multiplies by a configurable factor (default ×2), compounding exponentially. Positions rescue much faster and the average entry improves more aggressively, but margin usage grows rapidly with each stage. Suited for users comfortable with heavy per-position commitment in exchange for faster exits.

Neither escalation mode is recommended over the other. They are tools for users who want to trade margin for speed.

---

### TP Ingress

**Nearly as Important as DCA**

On every non-gainer close (ADV FT, FUN), the entry TP for that symbol is halved: `0.5^closeCount`, floored at a configurable minimum (default 3%). The reduction has a 3-hour TTL and applies only to stage 0 — DCA adds are unaffected. Gainers are excluded entirely.

**Why**: A non-gainer that re-enters quickly is showing **declining sell pressure**. The first entry hit TP because sellers had conviction. The second entry may not reach the same depth — the downside fuel is diminishing. Tightening TP captures what's actually available rather than waiting for a move that may not come.

TP ingress on non-gainers does the opposite: declining sell pressure means the move is getting shorter, so TP comes down to meet it.

**Example at default 6% entry TP**:
- First close → ingress count 1 → entry TP: 3% (floor reached immediately)
- Second close onward → entry TP: 3% (floor holds)

After 3 hours the counter resets and full TP is restored.

---

### Stop Loss (SL)

**A Contentious Addition**

We long argued against SL, believing that for a ticker to liquidate us, the price would need to pump **100-200% in a single day** depending on our cross-margin balance — functionally unheard of. Then **$SIREN** did exactly that.

**Hard Cap: -105%**

As a result, we set a hard cap at **-105% loss**. Regardless of what the ticker does afterwards, we must accept that loss and try to understand why it happened.

**When SL Is Set**: After **all configured DCA stages have filled** — the final add has triggered and nothing else can improve the average entry.

**Why Set Late?**
- Avoids revealing the SL to stop hunters during the DCA progression

**Why -105% Specifically?**
- For users on **isolated margin**, the position would be liquidated at -75%, so they'd never reach this path
- For cross-margin users, the SL prevents total account wipeout
- Can be missed if the bot goes offline
- On a 3-stage or 6-stage setup (both final at 15% above entry), triggering the final add already represents a meaningful pump — the SL at -105% PnL sits a further distance beyond that

**Philosophy**: If all DCA stages have filled and the position still needs a hard stop, something is fundamentally wrong with the thesis. The SL exists to prevent catastrophic loss, not as part of normal operation.

---

### TP Reduce & Laggard Mechanism

**The Problem**

Through experience (mostly with gainers), we observed positions that would **linger around doing nothing** and then later start picking up again. The 12-hour force close normally solved this, but some tickers required a more aggressive bouncer.

**Reduce Phase**

After a position has been open for **25 minutes** (configurable, used to be 12 hours, then 6 hours, then 45 minutes), it enters **reduce phase**.

**Rationale**: If a position has been open too long and hasn't hit TP, it will likely start pumping again and we might get stopped out. The 25-minute reduce phase is **very aggressive** and forces positions to close that would otherwise hit regular TP 2-3 hours later. But the stress of waiting and the chances of a spike aren't worth it.

During reduce phase, TP is lowered to encourage faster exits.

**Laggard Check**

Only enforced during reduce phase. The **laggard** is selected by one of two modes, configurable via the *DCA-Stage Mode* toggle (default: on):

- **Age Mode (default)**: the oldest open position by open time.
- **DCA-Stage Mode**: the position with the most DCA stages triggered, age breaks ties.

**The Calculation**: Expected Value (entry margin × TP%) is buffered by 50% (configurable), then reduced by cumulative realized PnL from other closes and the laggard's own unrealized PnL. When that remainder hits zero, the laggard is force-closed.

Every close — winning or losing — adjusts the tally for all remaining positions, so a strong winner can trigger a chain of laggard closes in sequence.

The laggard system closes most positions that would otherwise have hit their targets, but this forgone profit is acceptable — the alternative is exposure to reversals on a position that has already stalled.

**The laggard system can both hasten and prolong closures.** When accumulated closes are profitable, ED burns down quickly and the laggard is pushed out. When closes are in loss, they push ED in the opposite direction — the laggard's EDa TP moves further from the current mark price, effectively becoming a debt that must be paid off by future wins before the position can close. In a literal sense the system is not just an accelerant but a ledger. The most common cause outside Psycho Mode is a laggard closing in loss — its deficit rolls forward and hardens the next laggard after it, requiring a more decisive move to resolve.

---

### Balance, Max Positions, and Notional Sizing

At the default **$6 notional** with **6× leverage**, each position consumes **$1 margin** at stage 0. The DCA structure adds margin at each subsequent stage, so a position that fully DCA'd through all adds has consumed significantly more. This is the basis for sizing your starting balance.

The margin depth depends on stage count and add-sizing mode. The table below assumes 3-stage flat (the conservative baseline):

**Margin requirements for 10 open positions at $6 notional (3-stage flat):**

| Scenario | Stages Used | Margin per Position | Total Margin |
|---|---|---|---|
| Pessimistic | 0 → 2 (three stages) | $3 | $30 |
| Moderate | 0 → 1 (two stages) | $2 | $20 |
| Optimistic | 0 only (entry) | $1 | $10 |

In practice most positions close at stage 0 or 1. Reaching the final stage is an emergency — the pessimistic estimate is a true worst case.

With 6-stage flat DCA, pessimistic margin per position doubles to $6 (six $1 adds). With accumulation or doubling mode the adds scale further. If running higher stage counts or escalation modes, size your notional downward accordingly — the balance-to-notional ratios below assume flat adds.

**Sizing formula**: `notional = balance × inverse_ratio × leverage`

| Scenario | Inverse Ratio | Balance-to-Margin | Balance-to-Notional |
|---|---|---|---|
| Pessimistic | 0.033 (1/30) | 30× (3000%) | 5× (500%) |
| Moderate | 0.05 (1/20) | 20× (2000%) | 3.3× (333%) |
| Optimistic | 0.1 (1/10) | 10× (1000%) | 1.7× (167%) |

**Example — $200 balance, moderate settings:**
`200 × 0.05 × 6 = $60 notional`

At $60 notional / 6× leverage = $10 margin per entry. For 10 positions at moderate depth (stage 1): 10 × $20 = $200 committed at any one time — precisely within the $200 balance.

**Scaling up**: As your balance grows, increase notional proportionally to keep ROI consistent. 

---

## DCA Delay

### Overview

DCA Delay is a **position protection mechanic** that staggers the placement of DCA conditional orders rather than pre-creating all of them at position open. Only DCA stage 1 is placed on the exchange at entry. Each subsequent stage is created on demand, 5 minutes after the previous stage fills.

### Motivation

Pre-placing all DCA conditionals immediately has two failure modes:

1. **Market gap-through**: Price can spike past multiple DCA trigger levels in a single candle, filling several stages simultaneously. This compounds margin commitment against a still-moving market rather than spreading exposure over time.
2. **Premature capital commitment**: Conditionals on Bybit consume margin headroom. Placing 7 orders immediately locks reserved capital even if the position resolves at stage 1.

DCA Delay converts the DCA ladder from a static pre-set structure into a dynamic, event-driven sequence. Capital is committed only after the previous stage has confirmed the move is real and still evolving.

### How It Works

**At position open**: Only DCA1 conditional is placed on the exchange. Stages 2+ are stored in an internal queue (`_dcaDelayQueue`).

**When DCA1 fills**: A 5-minute timer starts (`_nextDcaPlaceAt`). The timer persists across bot restarts — if the bot goes down and comes back up, the clock picks up where it left off.

**When the timer expires**:
- The bot inspects the current mark price against the DCA2 trigger level.
- If mark is below the DCA2 trigger (not yet "blown through"): DCA2 is placed on the exchange. DCA3+ remain queued.
- If mark is already at or above DCA2 trigger ("underwater"): DCA2 is skipped. The bot checks DCA3, then DCA4, and so on.
- If the first valid non-underwater stage is found: it is placed. The remaining stages stay queued.
- If all remaining stages are already underwater: the bot sets the stop-loss immediately instead of waiting for the final DCA stage to fill.

**When DCA2 fills**: Another 5-minute timer starts. The same logic repeats for DCA3.

### The "Underwater" Skip

A stage is considered underwater if `mark ≥ trigger_price` at the moment of placement (for a short position — price has already risen past the level where we wanted to add). Setting a conditional at a price that has already been passed is either meaningless (the order would fill immediately at an even worse price) or confusing. Skipping to the next valid level ensures all placed conditionals are genuinely forward-looking.

### Why 5 Minutes

The 5-minute delay is a deliberate cooling-off window. After a DCA fill, the position has just absorbed a loss — the price has moved adversely. In many cases, the market will either:
- Continue moving the same direction (in which case the next trigger is still valid)
- Reverse briefly (in which case the delay avoids placing a conditional in a whipsaw)

The delay is not a prediction of reversal. It is a minimum observation window before committing additional margin to the same trade.

### SL Fallback

If all queued DCA stages become underwater simultaneously (a fast, sustained adverse move), the bot sets a stop-loss at the standard `-105% ROI` level from the current average entry. This prevents the position from becoming an unlimited-drawdown open trade with no remaining protection.

---

## Psycho Mode

Psycho Mode is like a bear with a toothache which can only be soothed by blood. It utilizes no filters save for 24hr change — any ticker moving more than 6% in either direction qualifies. It uses the following settings:

- **7 DCA stages** at **2× escalation** — each add doubles the last, staggered deeper into the pump
- **25% entry TP ROI**, decaying per stage (flooring at 3%)
- **Up to 50 concurrent positions**, 12 new shorts picked per round
- **Laggard check** active from the second open position onward
- **48-hour hard force-close** as the backstop; the laggard system handles most exits well before that

When a winner closes it raises the lost-value tally for every remaining position, which can push the next-weakest over its threshold and out — and so on. The real game is waiting for one ticker to move decisively and letting the cascade do the rest. Win rate is low; what keeps ROI healthy is that the winners are large enough to absorb the dust.

### Sacrifice

When the total allocated margin exceeds a preset threshold, one must sacrifice tickers — even those in loss — to make room for potentially deeper DCAs on existing positions. New entries pause and the most recoverable position is closed every 5 minutes until allocation drops back under the cap.

**Target priority:** Prefers positions with ≥1 DCA stage and PnL > −3%, sorted profit-first. Falls back to the most profitable position overall if no preferred candidate exists.

**Retraction (Addendum):** A subset of sacrifice that targets collective uPnL below −2.5× entry margin, irrespective of allocated margin. This is a more aggressive form of sacrifice and will usually drop position count to the minimum (5).

**Sacrifice as a Speed Limiter:** On broadly bullish days, DCA accumulation pushes the book towards the threshold — calculated as max positions multiplied by 4× base margin — sacrifice acts on tickers already showing difficulty, hyper-focusing on them till they correct. In practice this slows the strategy down, preventing more entries when the market is upwardly inclined.

**Effect on Laggards:** When multiple positions have closed in loss, they push the ED in the opposite direction — the laggard becomes harder to close. When used with sacrifice, a laggard can become super-hardened, requiring a strong internal or external slump which will either drag mark price to TP or drag TP closer to mark — whichever comes first.

### Loss Absorption

A counterweight to sacrifice. When a position has been sitting in loss greater than 2.5× its base margin, begin trimming it — 5% of its size every 5 minutes. The goal is slow, steady removal of the dead weight without touching anything else.

Cuts continue until remaining margin drops below $20, at which point the position is small enough that cascade, sacrifice, or a natural TP will finish it. The sequence usually ends well before that — either price recovers and the position clears the threshold on its own, or DCA fires first.

When DCA fires into a partially absorbed position the effect compounds favourably: because the pre-existing size has been reduced, the DCA add — which is a fixed notional — carries more weight in the new average. The weighted average entry price rises toward the current mark, pulling the TP up with it and shortening the distance price needs to travel to close. The worse the position was, the bigger the improvement.

Unlike sacrifice, which distributes the cost across the book, absorption takes it out of the offender's own hide.

Every cut realises a small loss. Those losses harden the laggard's EDa TP, so sustained absorption on a large position compounds quietly against the weakest ticker in the book.

### Cascade Triggers

The laggard check applies slow, continuous pressure. Cascade triggers are the aggressive complement.

**Collective Profit Cascade (CPC)** triggers when the book's total unrealized PnL crosses the threshold (2.5× entry margin). Close the two most profitable positions to crystallize gains and seed laggard pressure across the rest. 5-minute cooldown.

**Per-Position Cascade (PPC)** triggers when any single position's unrealized loss exceeds the same threshold. Close the most profitable positions immediately — escalating in count on each successive trigger — to force cascade pressure toward the laggard. Escalation resets when the trigger position recovers or closes; it does not carry over between sessions.

Both triggers share a minimum ROI% filter so dust positions aren't used as cascade targets when better candidates exist.

### Anti-Martingale (AMa)

Where DCA escalates into losing positions, AMa creeps into winning ones. When enabled, positions open with no take profit; as price falls in the profitable direction, flat adds are placed at −1.5%, −3%, −6%, −9%, −12%, −15%, and −18% from entry. At the seventh stage a TP is set at −22% from the original entry.

Adds are flat — the same base notional each time. DCA adds are multiplicative; if AMa adds were too, a position that ran through several AMa stages before reversing into full DCA would carry an extreme margin load. Flat AMa sizing keeps the worst-case draw manageable regardless of how far AMa progressed before the reversal.

If price reverses and a DCA level triggers, AMa is cancelled and a normal stage-based TP is set against the current weighted average entry. The AMa fills that ran before the reversal pull the average entry slightly lower than the original — marginally less favorable for recovery — but the effect is small since the flat AMa notional is dwarfed by the exponential DCA adds that follow.

A known nuisance: some positions will trigger one or two AMa stages, then retrace just enough to cancel into DCA without a decisive move in either direction. This is expected and not a flaw — the laggard system eventually resolves these.

AMa adds count against available margin exactly like DCA fills.

A perfect run — all seven adds filling and TP hitting at −22% — returns roughly **709% on the original entry margin** at 6× leverage. ROI% on total committed margin is lower (~88.6%) since each subsequent add enters at a less favourable price, but the absolute profit is 5.4× what holding the entry alone to the same TP would yield. AMa is a move-capture tool, not a ROI maximiser.

### Sizing

**Recommended balance**: minimum **$250** with default settings (50 max positions, $6 notional, 6× leverage). Maximum practical exposure at 2 DCA stages average: ~**$2,500** in margin — raising max positions to 150 pushes this to ~$6,666.

**"Short everything. Let DCA Escalation and Laggard check sort the rest."**

---

## Conclusion

These strategies are designed to be executed by automation, not humans. The mental overhead of manually tracking:
- RSI gates across three timeframes
- Volume momentum calculations and thresholds
- Historical over-extension checks and look-back counts
- Funding rate classification and creep state per symbol
- DCA stage management and TP recalculation
- Laggard expected deficit tracking
- SalF LSA ratios and median creep state per symbol
- Multiple concurrent positions across different strategies

...would be overwhelming and error-prone. The stress of watching positions in real-time, especially during volatile moves, makes manual execution impractical.

### ROI & Scale

At scale, this system yields **5-50% daily returns**. However, scale is intentionally limited:
- **Maximum balance**: $3,838
- **Maximum notional**: $666

These caps prevent us from being hunted due to order impact. Larger positions would move the market and attract attention from traders looking to stop-hunt or front-run our exits.

Within these constraints, the strategies yield consistent, automated returns that compound over time without requiring active management beyond initial configuration and monitoring.

The system is designed to run continuously, adapting to market conditions through its tiered conviction structure and dynamic filters, making money while you sleep.

**Thanks for reading, have fun!**

---
