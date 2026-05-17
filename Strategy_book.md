# PseudoWinter Strategy Book
**Version 1.1 — Trading Strategy Documentation**

---

## Table of Contents
1. [Gainers Strategy](#gainers-strategy)
2. [Advanced Follow-Through](#advanced-follow-through-strategy)
3. [Follow-Through](#follow-through-strategy)
4. [Fund Chasing (FUN)](#fun-fund-chasing-strategy)
5. [Sale Fishing (SalF)](#sale-fishing-salf-strategy)
6. [General Mechanics](#general-mechanics)
7. [Conclusion](#conclusion)

---

## Philosophy Overview

PseudoWinter employs a **tiered conviction system** where strategies cascade from low to high conviction based on price behavior and accumulated signals. Each strategy serves dual purposes:
1. **Direct profit generation** from positions opened
2. **Data collection** to inform downstream strategies

The strategies are organized around three distinct observation paths:

**Gainers path** — A ticker showing strong upward momentum is entered by Gainers, accumulates rodeo rides, and promotes to Follow-Through. If it was also extremely over-extended during that run, it may simultaneously qualify for Advanced Follow-Through via the extender counter.

**FUN path** — A parallel, independent scan evaluates tickers with positive funding rates across the top gainers and worst losers pools. FUN entries are funding-rate-driven rather than RSI-driven, and operate on their own conviction tier.

**SalF path** — A separate red-day scan targets tickers already in a consistent, sustained decline. Where all other strategies are designed around upward price action and mean reversion, SalF is the only strategy built to perform when the market is broadly falling.

In the most advantageous scenario, a single ticker flows through the Gainers path as it degrades:
1. Gainer enters → rodeo → win
2. Price/RSI drops → follow-through entry
3. **Result**: Multiple trades extracted from one ticker's lifecycle

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

The 70-70-75 configuration remains the **most balanced** for typical operation. The 70-70-80 setting offers far fewer positions but eliminates most problem trades. The third gate (RSI24) at 80 acts as the final **gatekeeper** to ensure the ticker is genuinely over-bought on the daily timeframe.

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

### Rodeo Mechanism (Instability Detection)

The **rodeo filter** responds to repeated successful entries.

#### How It Works:
1. **Entry**: We open a gainer position
2. **Rapid Close**: Position closes quickly (sometimes within seconds)
3. **Re-Prime**: Conditions re-appear, we attempt re-entry
4. **Gate Creep**: RSI gate increases by **6%**
5. **Repeat Detection**: Multiple rides indicate erratic, unstable behavior
6. **Handoff**: After sufficient rides, ticker is flagged for **Follow-Through roster**

#### Rationale:
A ticker providing multiple "rides" is **very erratic and unstable** — this pattern consistently predicts it will **crash very hard shortly**. The rodeo count serves as a behavioral fingerprint for impending collapse.

**Historical Max**: 4 rides (under 3% creep). With 6% creep, this is unlikely to recur.

#### Rodeo Creep Effects:
For each rodeo ride, we **increase both TP target and position size by 50%** (adjustable):

- **Why TP Creeps**: Unstable tickers produce deeper downward wicks and face greater upside resistance — more conviction is justified
- **Why Notional Creeps**: The eventual real move will be larger, justifying increased exposure
- **Timing**: Creep is applied before the next position opens — rodeos happen fast, so as soon as the gainer closes, we calculate the creep for immediate re-entry

---

## Advanced Follow-Through Strategy

### Overview
Advanced Follow-Through activates when a ticker demonstrates **prolonged over-extension** — repeated RSI6 spikes above the configured maximum within a 3-hour window. Rather than entering during the parabolic phase, ADV FT waits for the ticker to cool into a tradeable range, then enters as the reversal continues.

This strategy is "advanced" because **it doesn't need direct observation to proceed** the way regular Follow-Through does. We enter based on the ticker's accumulated historical behavior (repeated over-extension hits) rather than watching it fail repeated gainer entries.

### Core Philosophy
A ticker that over-extends four or more times within three hours is not just pumping — it is exhibiting structural instability. When that behavior finally collapses into the RSI cooldown band, the reversal tends to be sustained and reliable.

---

### Promotion to Advanced FT Roster

The **extender counter** tracks every time a ticker hits RSI6 ≥ the configured maximum during the scan cycle or per-tick polling window. Each hit within the 3-hour TTL increments the counter.

When a ticker's count reaches the **configurable promotion threshold** (default: 4 hits), it graduates to the **Advanced FT roster**. The gainer scan graylists the symbol while it remains on the ADV FT roster, suspending normal gainer entries.

If the roster is full, the ticker with the **lowest funding rate** (most over-shorted, least desirable) is evicted first, then the oldest entry.

---

### Entry Criteria

#### 1. **RSI Cooldown Band: 45-80**
We wait for the ticker to cool from over-extension into a specific RSI range:
- **RSI6, RSI12, RSI24**: All must be **between 45-80**

This is wider than Gainers' 70-80 band. We're catching the pullback **after** the parabolic move. The ticker was at RSI6 ≥ 90 repeatedly — now it's cooling, and we enter as the reversal continues.

#### 2. **Volume Momentum Filter** (Optional)
- **Base threshold**: Flat floor configurable as `advFtVolMomMin` (default 5%). This replaces the old per-tick escalation system — the floor no longer scales with how many over-extension hits exceed the promotion threshold.

- **Per-close VM creep**: Each time an ADV FT position closes, the VM floor is incremented for that symbol (3-hour TTL), raising the bar for repeated re-entries on the same ticker. The creep is additive to the flat base and capped at a configurable maximum (default 15%). Successive closes keep pushing the floor up until the cap is reached or the TTL expires.

#### 3. **LSA (Localized Sell Average) Filter**

While Volume Momentum (VM) measures the immediate ratio of sellers to buyers to detect a "impending" slump, **LSA** measures the intensity of current selling relative to the ticker's entire day.

* **The Logic**: LSA compares the selling volume of the most recent candle against the historical average for that ticker. It ensures there is enough "downward fuel" to justify an entry without entering a move that has already exhausted itself.
* **The "Up-ness" Variable**: LSA is highly sensitive to how "up" a token is. Because Advanced FT tickers are coming off massive buying streaks, their "normal" state involves high volume, allowing for a much higher LSA ceiling.
* **Ideal Ranges**:
* **For ADV FT (Over-extended)**: We look for a positive LSA with a high ceiling (often **250% or more**). Since these tickers have been dominated by buying all day, a massive spike in selling is often required to actually shift the trend.
* **For FUN Losers (LFL/HFL)**: These target a much lower ceiling (typically **50%**). Because these tickers are already "down" for the day, their candles naturally skew red; a high LSA here usually indicates the drop is already finished.


* **The Exhaustion Cap**: If LSA exceeds these limits, the ticker is skipped. Too much selling volume in a single bar suggests a **volume blowoff**—the "last gasp" of sellers before a potential relief bounce.

#### 4. **Funding Rate Filter**
Same as Gainers: funding rate must exceed the configured minimum (default −0.05%).

---

### Why Volume Momentum is Optional

The **optional nature of vol mom** highlights the reliability of this strategy. Often you can dive in if the over-extension has collapsed into range and the reversal will continue regardless. But occasionally it won't — vol mom provides confirmation when needed without being a prerequisite for every entry.

---

### Why 2× Margin

Advanced FT uses **2× margin**. The ticker has demonstrated extreme behavior through repeated over-extension. When it finally cools into tradeable range, the conviction is high that the downward movement will continue. This justifies higher margin than Gainers (1×).

---

## Follow-Through Strategy

### Overview
Follow-Through is the predecessor to Advanced Follow-Through. Where Advanced FT uses **prolonged over-extension** as an indicator of potential weakness, regular FT uses **verified re-entry** as a weakness indicator — we directly observe the ticker being defeated by repeated gainer entries.

### Promotion to FT Roster
When a ticker accumulates **2+ rodeo rides** (configurable), it promotes to the Follow-Through roster. We used to set this threshold at 4 rides, but when we raised the Gainers RSI gates and rodeo creep percentage, 2 rides became the more likely outcome.

### Entry Logic
Same as Advanced FT: wait for RSI to cool, except into the 20-60 band, then enter when volume momentum (optional) confirms. The only difference is the **promotion path** — rodeo rides vs. over-extension hits.

---

## Fund Chasing (FUN) Strategy

### Overview
Fund Chasing (FUN) is a **parallel, independent strategy** that targets positive funding rates rather than RSI over-extension. It operates on the thesis that a persistently positive funding rate — one significant enough to cost shorts meaningful capital per settlement cycle — is itself a structural signal worth trading against.

FUN runs its own scan pass each cycle, evaluating two distinct pools: the **top gainers** (by 24h change) and the **worst losers** (−3% to −99% by 24h change). These are treated as separate sub-populations with different entry criteria, position costs, and vol momentum thresholds.

---

### Core Philosophy

**"If the market is paying you to be short, that's not nothing."**

A high positive funding rate means longs are paying shorts. Entering when the rate is elevated locks in that carry income and improves the break-even on the position. Combined with vol momentum confirmation, FUN positions are entered when both price action and funding economics favor the short side.

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

#### 3. **Historical Over-Extension Look-back**
Before evaluating vol momentum, we count how many 15-minute candles in the past 3 hours had RSI6 ≥ the configured maximum. This count is the **single source of truth** for the over-extension multiplier applied to the VM threshold — it cannot be double-counted.

- **For losers**: any over-extension in the look-back is **contradictory** — a ticker falling hard on the day shouldn't be simultaneously parabolic. These are graylisted for 6 hours.
- **For gainers**: over-extension hits raise the VM floor multiplicatively (see below).

#### 4. **RSI Proximity Block**
If RSI6 is within the configured proximity band of the maximum (e.g., within 10% of 90), the ticker is skipped. This prevents entering a ticker that may be about to over-extend.

#### 5. **Volume Momentum Gate**
Vol momentum thresholds differ by sub-type and direction:

- **Gainer sub-types (HFG, LFG)**: Base threshold is configurable (default HFG = 10%, LFG = 20%). Per each re-entry close, the threshold creeps upward by a configurable percentage (default 10% per close). If the look-back found over-extension candles, the creeped threshold is further multiplied by `(1 + OEStepPct/100)^n` where n is the over-extension count.

- **Loser sub-types (HFL, LFL)**: The base threshold is expressed as a negative vol mom minimum (default HFL = −10%, LFL = −5%). Creep tightens the threshold toward zero. Over-extension converts the threshold to an absolute minimum (1% + 50% per OE hit), reflecting that a losing ticker with any parabolic history is structurally suspect.

#### 7. **LSA (Localized Sell Average) Check** — Losers Only
For loser candidates, the last completed 15-minute candle's volume must be **above the window average** but **below the spike cap** (default ±50% from average). This confirms continued selling activity without a volume blowoff that would suggest exhaustion rather than continuation.

Droughts (≤ avg), neutral (at avg), and spikes (> cap) are all blocked.
---

### Why FUN Addresses Over-Extended Tickers

Over-extended tickers (RSI6 ≥ max) are excluded from the Gainers path by design. But a gainer can be simultaneously over-extended **and** carrying a positive funding rate — two independent structural conditions. FUN's vol momentum gate, now scaled multiplicatively by the over-extension count, naturally raises the bar for these tickers: the more candles they spent over-extended, the more selling pressure must be confirmed before entry. This means FUN can legitimately capture some over-extended gainers that would be unsafe to enter via the Gainers path, but only when the evidence stack is proportionally stronger.

---

## Sale Fishing (SalF) Strategy

### Overview

Sale Fishing is the only **red day** strategy in EverWinter. Every other strategy — Gainers, FT, ADV FT, FUN — is designed around upward price action and mean reversion. SalF works in the opposite direction: it targets tickers that are already falling, looking for consistent and sustained selling pressure that is likely to continue rather than exhaust.

On red market days, SalF is often the dominant source of entries. During a market-wide meltdown, qualifying tickers proliferate across both the gainer and loser pools simultaneously. The bot's default position count was increased partly to accommodate this volume — on a bad day it could legitimately short nearly everything on the board.

On green days SalF is quieter by design. The filters naturally suppress entries when selling pressure is thin and tickers are moving upward. Calibration of those green-day boundaries is ongoing.

---

### Core Philosophy

**"We're not catching a falling knife. We're riding a knife that's already falling."**

SalF is not about picking a top or timing an exhaustion point. It's about identifying tickers that are already in a clean, continuous decline over the past hour and entering while that pressure still has room to run.

The strategy deliberately avoids two failure modes:

1. **Exhaustion entries** — the ticker has already dumped violently in one or two candles, sellers are spent, and a snap-back bounce is likely. The LSA cap gates this out: if the last hour's volume is too far above average, the move has probably already happened.

2. **Squeeze entries** — the ticker is visibly in distress, which attracts late shorts piling in after the fact. Heavy short crowding on a declining ticker increases the probability of a stop-hunt spike. The tighter funding rate gate and the standard over-shorted filter handle this together.

---

### Entry Criteria

#### 1. **Consistent Decline: 3/4 Red Candle Rule**

The last four completed 15-minute candles must contain at least three red closes.

This is a visual quality bar. A 2/4 pattern is crabbing — the ticker is going sideways, not declining. A 1/4 pattern is typically three green candles followed by one outsized red, which looks like a dump but is structurally a single event, not a trend. We want a ticker that has been continuously declining across the past hour, with each candle contributing to the move rather than one dramatic spike pulling the average down.

#### 2. **LSA Window: Floor and Cap**

LSA (Localized Sell Average) compares the last hour's sell volume against the ticker's 24-hour hourly average. This tells us whether current selling activity is elevated relative to the ticker's normal baseline.

- **Floor**: Last-hour volume must be meaningfully above average (default +25%). This confirms active selling pressure is present — the ticker is not just drifting.
- **Cap**: Last-hour volume must not be excessively above average (default +50%). A volume blowoff — extreme selling crammed into a single window — typically marks exhaustion rather than continuation. We do not want to enter after sellers have already given everything they had.

The window tightens after each SalF close on a symbol (**median creep**): the floor rises and the cap falls toward the midpoint. This prevents repeatedly re-entering the same ticker as its selling pressure weakens over time.

#### 3. **RSI Floor**

All three RSI timeframes (RSI6, RSI12, RSI24) must be above a configurable minimum (default 25). Below this level a ticker is stretched so far oversold that a snap-back becomes more probable than continuation. We gate out the deeply oversold range and look for tickers that still have room to fall.

#### 4. **Funding Rate Gate (Tighter Than Other Strategies)**

SalF applies a stricter funding rate floor than other strategies. Tickers in visible distress are attractive to late shorts — people entering after the move has already started. When short interest builds on a declining ticker, the conditions for a short squeeze improve. A tighter funding rate minimum reduces exposure to tickers that are already over-shorted and susceptible to a squeeze against us.

#### 5. **Gainer vs. Loser Band**

SalF scans both the top gainers pool and the worst losers pool:

- **Gainers selling off ("fresh")**: Tickers that were positive on the day but are now actively declining. The selling pressure is working against the day's positive backdrop — if it's strong enough to push through, the move may have more runway.
- **Losers selling off ("stale")**: Tickers already down on the day continuing lower. The decline is in the direction of the day's trend, but these tickers may be closer to finding support. Both use the same LSA logic with separately configurable minimums. The gainer/loser distinction is an area of ongoing refinement.

---

### Why SalF Thrives on Red Days

When the broader market is falling, SalF criteria are met simultaneously across many tickers. The over-shorted and LSA filters still constrain entry quality, but the raw supply of qualifying tickers is far greater than on green days. This makes SalF a natural complement to the rest of the system: when Gainers, FT, and FUN go quiet because there are few upward movers, SalF activates and fills the bot's position slots instead.

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

A less obvious reason to run high stage counts is survivability through extended pumps. Most of EverWinter's filters prevent entering tickers that have already pumped dramatically, but a position entered early can find itself riding a pump that runs far longer than expected — potentially 48 hours with the force-close window extended. At 18 stages the final add triggers at roughly 51% above entry, meaning the position can survive a sustained move of that magnitude while still holding open. By that point the average entry is spread across all 18 adds, significantly above the original entry price, and the TP is priced accordingly. Extended pumps of that scale tend to retrace substantially — most tickers do not sustain 50%+ gains indefinitely — which means the position is likely to resolve once the move exhausts. The cost is the total margin committed: at default $6 notional / 6× leverage, an 18-stage flat position would consume roughly $19 in margin. That is a meaningful commitment per position, but the average entry improvement at that depth means even a partial retracement is often enough to close profitably.

**TP ROI by Stage**: `entryTpRoi / (stage + 1)`, floored at 3%

The TP percentage decreases with each stage because our average entry gets better. The structure is designed so that at each DCA stage the TP yields approximately the same dollar amount as the original entry would have if it went perfectly. We are not trying to make more profit from the DCA — just exit cleanly from a better average.

**Example at default 13% entry TP**: Stage 0 = 13%, Stage 1 = 6.5%, Stage 2 = 4.3%, Stage 3 = 3.25% → 3% (floor).

**Why This Works**: Each pump makes it relatively easier for us to exit. As price moves against us and triggers adds, our average entry price rises and our TP price rises with it. Even questionable strategies can often be rescued by the DCA structure.

**Final Stage = Emergency Harness**: A trigger on the last DCA add is itself an invalidation of the strategy. It exists as an emergency harness, not a planned outcome.

---

### Add-Sizing Modes

Three modes control how much notional each DCA add contributes:

**Flat** (default): Every add equals the base notional. Simple, predictable, and the foundation the bot is designed to run on. Flat DCA should function well on its own — escalation modes exist to hasten recovery, not to fix a strategy that doesn't work.

**Accumulation**: Each add scales linearly — Add1 = base × 2, Add2 = base × 3, Add3 = base × 4, and so on. This is a middle ground: positions rescue faster than flat because later adds carry more weight, but margin commitment grows gradually rather than explosively. Suited for users who want some of the speed and improved rescue of escalation without committing heavily to every position that goes against them.

**Doubling**: Each add multiplies by a configurable factor (default ×2), compounding exponentially. Positions rescue much faster and the average entry improves more aggressively, but margin usage grows rapidly with each stage. Suited for users comfortable with heavy per-position commitment in exchange for faster exits.

Neither escalation mode is recommended over the other. They are tools for users who want to trade margin for speed.

---

### TP Ingress

**Nearly as Important as DCA**

On every non-gainer close (FT, ADV FT, FUN), the entry TP for that symbol is halved: `0.5^closeCount`, floored at a configurable minimum (default 3%). The reduction has a 3-hour TTL and applies only to stage 0 — DCA adds are unaffected. Gainers are excluded entirely.

**Why**: A non-gainer that re-enters quickly is showing **declining sell pressure**. The first entry hit TP because sellers had conviction. The second entry may not reach the same depth — the downside fuel is diminishing. Tightening TP captures what's actually available rather than waiting for a move that may not come.

This is the mirror of the gainers rodeo. The rodeo observes rapid re-entries on a gainer and responds by *raising* TP — that pattern signals **declining buy pressure**, i.e. buyers can't hold the pump, so a deeper eventual move is expected. TP ingress on non-gainers does the opposite: declining sell pressure means the move is getting shorter, so TP comes down to meet it.

**Example at default 13% entry TP**:
- First close → ingress count 1 → entry TP: 6.5%
- Second close → ingress count 2 → entry TP: 3.25% (approaching the 3% floor)
- Third close → entry TP: 3% (floor holds)

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

After a position has been open for **45 minutes** (configurable, used to be 12 hours, then 6 hours), it enters **reduce phase**.

**Rationale**: If a position has been open too long and hasn't hit TP, it will likely start pumping again and we might get stopped out. The 45-minute reduce phase is **very aggressive** and forces positions to close that would otherwise hit regular TP 2-3 hours later. But the stress of waiting and the chances of a spike aren't worth it.

During reduce phase, TP is lowered to encourage faster exits.

**Laggard Check**

Only enforced during reduce phase. The **laggard** is the oldest open position.

**The Calculation**:
1. **Effective Value (EV)**: Initial margin × TP% (what we expected to make when we entered)
2. **Lost Value**: Cumulative PnL from other positions that closed while this laggard is still open
3. **Unrealized PnL**: Current mark-to-market on the laggard
4. **Effective Debt**: `buffedEV - lostValue - unrealizedPnL`
   - Where `buffedEV = EV × 1.5` (50% buffer, configurable)

**Force Close Logic**: When `ED ≤ 0`, we force-close the laggard.

**What This Means**: "If everything else is moving and a ticker is stuck, calculate how much it would've yielded us and how much it would cost to close at the current level. If recent tickers have outperformed that (plus a certain buffer), then close the ticker for any profit or loss."

**Opportunity Cost Tracking**: Every time any position closes (profitable or not), that PnL gets added to the "lost value" tally for all remaining open positions. This tracks opportunity cost — "we could have closed this laggard and taken those gains instead."

**Cascade Effect**: This can cause a cascade of closes if many tickers are stuck and one suddenly shows motion.

**In Practice**

The laggard system closes **most positions that would otherwise have hit their targets**, but this forgone profit is acceptable. It also prevents us from lingering in tickers that would spike and either cause a more unfavorable force close or stop us out completely.

The aggressive 45-minute reduce phase means we sacrifice potential gains for risk management — positions close earlier than they "should," but the alternative is exposure to reversals.

---

### Rodeo Creep Effects on TP/Notional

As covered in the Gainers section, each rodeo ride increases both TP target and position size by **50%** (default, adjustable). This applies to the **entry TP** (Stage 0) only — the DCA TPs remain at their standard values.

**Example**:
- Normal entry TP: 13%
- After 1 rodeo: 13% × 1.5 = 19.5%
- After 2 rodeos: 13% × 1.5 × 1.5 = 29.25%

The rationale: unstable tickers produce deeper downward wicks and face greater upside resistance — more conviction is justified.

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

## Conclusion

These strategies are designed to be executed by automation, not humans. The mental overhead of manually tracking:
- RSI gates across three timeframes
- Volume momentum calculations and thresholds
- Historical over-extension checks and look-back counts
- Funding rate classification and creep state per symbol
- DCA stage management and TP recalculation
- Laggard expected deficit tracking
- Rodeo counts and creep multipliers
- SalF LSA ratios and median creep state per symbol
- Multiple concurrent positions across different strategies

...would be overwhelming and error-prone. The stress of watching positions in real-time, especially during volatile moves, makes manual execution impractical.

### ROI & Scale

At scale, this system yields **5-50% daily returns**. However, scale is intentionally limited:
- **Maximum balance**: $3,838
- **Maximum notional**: $666

These caps prevent us from being hunted due to order impact. Larger positions would move the market and attract attention from traders looking to stop-hunt or front-run our exits.

Within these constraints, the strategies can function as a form of **Universal Basic Income** (UBI) — consistent, automated returns that compound over time without requiring active management beyond initial configuration and monitoring.

The system is designed to run continuously, adapting to market conditions through its tiered conviction structure and dynamic filters, making money while you sleep.

**Thanks for reading, have fun!**

---
