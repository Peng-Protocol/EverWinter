# PseudoWinter Strategy Book
**Version 1.1 — Trading Strategy Documentation**

---

## Table of Contents
1. [Gainers Strategy](#gainers-strategy)
2. [Advanced Follow-Through](#advanced-follow-through-strategy)
3. [Follow-Through](#follow-through-strategy)
4. [Fund Chasing (FUN)](#fun-fund-chasing-strategy)
5. [General Mechanics](#general-mechanics)
6. [Conclusion](#conclusion)

---

## Philosophy Overview

PseudoWinter employs a **tiered conviction system** where strategies cascade from low to high conviction based on price behavior and accumulated signals. Each strategy serves dual purposes:
1. **Direct profit generation** from positions opened
2. **Data collection** to inform downstream strategies

The strategies are organized around two distinct observation paths:

**Gainers path** — A ticker showing strong upward momentum is entered by Gainers, accumulates rodeo rides, and promotes to Follow-Through. If it was also extremely over-extended during that run, it may simultaneously qualify for Advanced Follow-Through via the extender counter.

**FUN path** — A parallel, independent scan evaluates tickers with positive funding rates across the top gainers and worst losers pools. FUN entries are funding-rate-driven rather than RSI-driven, and operate on their own conviction tier.

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

#### 1. **RSI Cooldown Band: 45-75**
We wait for the ticker to cool from over-extension into a specific RSI range:
- **RSI6, RSI12, RSI24**: All must be **between 45-75**

This is wider than Gainers' 70-80 band. We're catching the pullback **after** the parabolic move. The ticker was at RSI6 ≥ 90 repeatedly — now it's cooling, and we enter as the reversal continues.

#### 2. **Volume Momentum Filter** (Optional)
- **Base threshold**: Configurable (default 5%)
- **Tick scaling**: For each over-extension hit beyond the roster threshold, the VM requirement is multiplied by `(1 + scalePct/100)` per extra tick

  Example at 50% scale: a ticker promoted at 4 hits enters at the base threshold. At 5 hits the requirement is `base × 1.5`; at 6 hits `base × 2.25`.

- **Per-close VM creep**: Each time an ADV FT position closes, the VM gate is multiplied by ×1.5 for that symbol (3-hour TTL). Successive closes keep raising the bar, preventing repeated low-quality re-entries on the same ticker.

#### 3. **Funding Rate Filter**
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
Same as Advanced FT: wait for RSI to cool into the 45-75 band, then enter when volume momentum (optional) confirms. The only difference is the **promotion path** — rodeo rides vs. over-extension hits.

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

## General Mechanics

### DCA (Dollar Cost Averaging) Structure

**Our Strongest Weapon**

The DCA structure is our strongest weapon and allows us to be **a little wrong** — we increase margin and get a better average entry. The structure was devised through trial and error based on observed pump capacity:

- Most coins **cannot pump 3%** after already being recently pumped or over-extended
- Some can pump **9%**
- Very few can pump **15%**

**Four Stages**: Entry (Stage 0) → Add1 (Stage 1) → Add2 (Stage 2) → Add3 (Stage 3)

Each "add" order increases position size by an amount equivalent to the base notional, triggering at progressively higher prices (price moves against us). As a result, each subsequent stage has **less and less weight** on the average entry.

**Experimental Escalation System**: We're exploring a system where each stage adds margin equal to the value of all prior stages. For example, if base notional is $6:
- Stage 0: $6 (total: $6)
- Stage 1: add $6 (total: $12)
- Stage 2: add $12 (total: $24)
- Stage 3: add $24 (total: $48)

This contrasts with linear escalation which would yield $24 total at Stage 3. The advantage: positions rescue **faster and easier** because there's more weight in later entries, so tickers don't need to come down as far to trigger an exit. The disadvantage: we spend more margin trying to rescue one position. This is being implemented as an optional feature.

**TP ROI by Stage**: `[13%, 9%, 6%, 4%]`

The TP percentages **decrease** with each stage because our average entry gets worse. The structure is designed so that **at each DCA stage, the TP yields approximately the same dollar amount as the original entry would if it went perfectly**. We aren't looking to make more profit from the DCA — just get out after a better entry.

**Why This Works**: Each pump makes it relatively easier for us to exit. As price moves against us and triggers adds, our average entry price rises and our TP price rises with it. Even really bad strategies can often be validated by our DCA structure.

**DCA Stage 3 = Emergency Harness**: A DCA3 trigger is itself an **invalidation** of the strategy. It exists as an emergency harness, not a planned outcome.

---

### Stop Loss (SL)

**A Contentious Addition**

We long argued against SL, believing that for a ticker to liquidate us, the price would need to pump **100-200% in a single day** depending on our cross-margin balance — functionally unheard of. Then **$SIREN** did exactly that.

**Hard Cap: -105%**

As a result, we set a hard cap at **-105% loss**. Regardless of what the ticker does afterwards, we must accept that loss and try to understand why it happened.

**When SL Is Set**: Only at **Stage 3** (after all three DCA adds have triggered)

**Why Set Late?**
- Avoids revealing the SL to stop hunters

**Why -105% Specifically?**
- For users on **isolated margin**, the position would be liquidated at -75%, so they'd never enter this path
- For cross-margin users, the SL prevents total account wipeout
- Can be missed if the bot goes offline
- A full SL at Stage 3 requires a **~22% pump after entry** — a complete invalidation of the strategy requiring adjustment

**Philosophy**: If we've DCA'd three times and still need an SL, something is fundamentally wrong with the thesis. The SL exists to prevent catastrophic loss, not as part of normal operation.

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
1. **Expected Value (EV)**: Initial margin × TP% (what we expected to make when we entered)
2. **Lost Value**: Cumulative PnL from other positions that closed while this laggard is still open
3. **Unrealized PnL**: Current mark-to-market on the laggard
4. **Expected Deficit (ED)**: `buffedEV - lostValue - unrealizedPnL`
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

## Conclusion

These strategies are designed to be executed by automation, not humans. The mental overhead of manually tracking:
- RSI gates across three timeframes
- Volume momentum calculations and thresholds
- Historical over-extension checks and look-back counts
- Funding rate classification and creep state per symbol
- DCA stage management and TP recalculation
- Laggard expected deficit tracking
- Rodeo counts and creep multipliers
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
