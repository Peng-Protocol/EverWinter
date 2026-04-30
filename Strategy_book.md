# PseudoWinter Strategy Book
**Version 1.0 — Trading Strategy Documentation**

---

## Table of Contents
1. [Gainers Strategy](#gainers-strategy)
2. [EXD (Extension Diving)](#exd-extension-diving)
3. [Advanced Follow-Through](#advanced-follow-through-strategy)
4. [Follow-Through](#follow-through-strategy)
5. [Faders & Carry-On](#faders--carry-on-strategy)
6. [General Mechanics](#general-mechanics)
7. [Conclusion](#conclusion)

---

## Philosophy Overview

PseudoWinter employs a **tiered conviction system** where strategies cascade from low to high conviction based on price behavior and accumulated signals. Each strategy serves dual purposes:
1. **Direct profit generation** from positions opened
2. **Data collection** to inform downstream strategies

The RSI gates progressively **lower** as strategies advance:
- **Gainers**: Highest RSI gates (most conservative)
- **Follow-Through**: Medium RSI gates
- **Faders**: Lowest RSI gates (highest conviction)

In the most advantageous scenario, a single ticker flows through multiple strategies as it degrades:
1. Gainer enters → rodeo → win
2. Price/RSI drops → follow-through
3. Further decline → it becomes a fader
4. **Result**: Minimum 6 trades extracted from one ticker's lifecycle

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
- These scenarios produce **acceptable false positives** — we simply skip those entries

#### 4. **RSI6 Maximum: 90 (Over-Extension Disqualifier)**
Rather than being a bullish signal, **RSI6 > 90 is a sign of doom**.

A coin with RSI6 at 90 is **out of control** — parabolic and non-mean-reverting. These tickers are:
- **Excluded from Gainer entries**
- **Passed to EXD** (Extension Diving) or Advanced FT for specialized handling

This is a **hard ceiling**, not a trading signal. Over-extended tickers require higher-conviction strategies with different risk parameters.

#### 5. **Over-Extension Memory (3-Hour Block)**
Before entering, we check if the ticker was **over-extended in the past 3 hours** using 1-hour candles (more sensitive timeframe).

**Rationale**:
If a coin was recently over-extended, there's high probability it will:
- **Re-spike** instead of stabilizing
- Exhibit continued parabolic behavior
- Generate false entries that quickly reverse

The 3-hour block prevents premature re-entry after a parabolic move settles.

---

### Rodeo Mechanism (Instability Detection)

The **rodeo filter** responds to repeated failed entries.

#### How It Works:
1. **Entry**: We open a gainer position
2. **Rapid Close**: Position closes quickly (sometimes within seconds)
3. **Re-Prime**: Conditions re-appear, we attempt re-entry
4. **Gate Creep**: RSI gate increases by **6%** (previously 3%)
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

**Note**: EXD also inherits rodeo creep logic, though the 3-hour over-extension block reduces rodeo frequency significantly.

---

## EXD Strategy (Extension Diving)

### Overview
EXD (Extension Diving) trades tickers deemed **too hot for Gainers** — coins with RSI6 ≥ 90 that are actively parabolic. While Gainers waits for over-bought conditions to settle into the 70-80 range, EXD dives directly into the extension zone, betting that volume momentum signals indicate an imminent snap-back.

### Core Philosophy
**"Missed opportunities can be recovered, liquidated capital cannot."**

EXD accepts missing many trades rather than risking capital on premature entries. Volume momentum thresholds are intentionally strict and escalate aggressively to filter out coins that haven't accumulated sufficient sell pressure.

---

### When EXD Activates

When a ticker hits **RSI6 ≥ 90** during our gainer scan, it's too over-extended for a normal gainer entry. Instead:
- We exclude it from Gainers
- We track how many times it hits over-extension within a 3-hour window (we call this the "tick count")
- On the **first tick**, we immediately check if it qualifies for EXD entry
- If it doesn't qualify yet, we watch it every minute for the next 30 minutes, waiting for volume momentum to spike
- At **4 ticks**, the ticker graduates to Advanced FT—a separate strategy with 2× margin positions

---

### Entry Criteria

#### 1. **Volume Momentum Gate** (Primary Filter)

**What is Volume Momentum?**
Volume momentum compares **buying vs selling volume** across a 24-hour period. When sell volume exceeds buy volume by our threshold percentage, this **precedes downward price action** — the coin is being heavily sold into, but the price hasn't reflected this selling pressure yet.

**Base Threshold**: **13%**

**Why Escalate?**
A phenomenon we've observed: **the longer a ticker over-extends, the more vol mom is required to signal downward action**. Higher pumps can sustain more selling pressure before reversing.

**Escalation Rules**:
- For each over-extension tick beyond 2, we multiply the threshold by 1.25 per tick
  - Example: 5 ticks = 13% × (1.25)^3 = 25.4%
- For each rodeo re-entry, we add 30% per rodeo
  - Example: 2 rodeos = additional +60% to threshold

**Combined Example**:
- Base: 13%
- Ticker at tick 4 (2 excess ticks): 13% × 1.56 = 20.3%
- After 1 rodeo: 20.3% × 1.30 = 26.4% vol mom required

**Why 13% Base?**
Determined through trial and error. Lower thresholds create false entries before sell pressure truly dominates. Higher thresholds miss valid reversals.

#### 2. **RSI24 Floor**
- **Minimum**: **70**
- **Purpose**: Confirm the 24-hour trend is still over-bought
- Without this gate, we could enter tickers that spiked RSI6 intraday but are declining on the daily timeframe

#### 3. **Pre-Extension Volume Adjustment**
Before checking volume divergence filters, we adjust the ticker's 24hr turnover:

**The Problem**: A parabolic pump inflates 24hr turnover. Comparing this inflated number to other tickers creates false high-volume-divergence signals.

**The Solution**: 
- Pull 15-minute candles since the first over-extension hit
- Calculate how much turnover was added **after over-extension began**
- Subtract this "pump volume" from the 24hr total
- Use this adjusted baseline for volume divergence comparisons
- Compare against top 3 and bottom 3 tickers (same logic as Gainers)

This lets us compare the ticker's **normal volume profile** against peers rather than the pump itself.

#### 4. **Funding Rate Filter**
Same as Gainers: funding rate must exceed **-0.05%**

---

### Why 2× Margin

Despite how adventurous EXD appears, it's still a **high conviction strategy** that justifies increased margin. Gainers are common but behave inconsistently—many qualify daily, but their outcomes vary widely. EXDs are uncommon but **very consistent in their behavior**. When a ticker hits over-extension and volume momentum confirms selling pressure, the reversal is reliable.

However, they aren't so consistent that we'd be comfortable putting 3× margin in them. The 2× allocation reflects this balance: more conviction than Gainers (1×), but not the certainty level of our highest-conviction positions (3×).

---

## Advanced Follow-Through Strategy

### Overview
Advanced Follow-Through is a **derivative of regular Follow-Through** (covered later), where regular FT uses verified re-entry as an indicator of weakness, Advanced FT uses **prolonged over-extension as an indicator of potential weakness**. The strategy waits for a parabolic ticker to cool down after extreme behavior, then enters when conditions confirm the reversal is continuing.

### Core Philosophy
This strategy is "advanced" because **it doesn't need direct observation to proceed** the way regular Follow-Through does. We can enter based on the ticker's historical behavior (4+ over-extension hits) rather than watching it fail repeated entries.

---

### Promotion to Advanced FT Roster

When a ticker accumulates **4+ over-extension hits** (RSI6 ≥ 90) within a 3-hour window, it graduates from extender tracking to the **Advanced FT roster**. This roster has limited slots (typically 10 max). When full, we evict the ticker with the **lowest funding rate** (most negative = most over-shorted = least desirable), then the oldest entry.

---

### Entry Criteria

#### 1. **RSI Cooldown Band: 45-75**
We wait for the ticker to cool from over-extension into a specific RSI range:
- **RSI6, RSI12, RSI24**: All must be **between 45-75**

This is wider than Gainers' 70-80 band. We're catching the pullback **after** the parabolic move (either caught by EXD or missed entirely). The ticker was at RSI6 ≥ 90 at least 4 times—now it's cooling, and we enter as the reversal continues.

#### 2. **Volume Momentum Filter** (Optional)
- **Minimum**: 2.5% or 5% (configurable)
- **2.5%**: More permissive, allows more entries, but can be inconsistent and underwhelming
- **5%**: Generally more safe and reliable

We check for:
1. **Prolonged period** of positive volume momentum (any level)
2. **Singular instance** of confirmed "sufficient" vol mom hitting the threshold

#### 3. **VSI (Volume Skew Incidence)** (Optional)
Requires a certain count threshold before entry. VSI catches incidents where volume is skewed towards sells. The exact requirement scales with the ticker's over-extension count (or pile-on count in the case of Pile-On Follow-Through).

**Rationale**: A ticker that over-extends for four 15-minute candles is structurally different from one that over-extended for 8 candles, so more confirmation is required. The longer the over-extension, the higher the VSI threshold needed before entry.

#### 4. **Funding Rate Filter**
Same as Gainers/EXD: funding rate must exceed -0.05%

---

### Why Volume Momentum is Optional

The **optional nature of vol mom** highlights the reliability of this strategy. Often you can just dive in if the over-extension (or rodeo, in the case of regular FT) has collapsed and it will keep going. But rarely it won't—so having extra indicators can be useful.

When a ticker hits over-extension 4+ times and finally cools into the 45-75 range, the reversal is usually underway. Vol mom provides additional confirmation, but isn't strictly necessary for many entries.

---

### Why 2× Margin

Advanced FT uses **2× margin** (same as EXD). The ticker has demonstrated extreme behavior through repeated over-extension. When it finally cools into tradeable range, the conviction is high that the downward movement will continue. This justifies higher margin than Gainers (1×).

---

### Pile-On Follow-Through (Over-Shorted Variant)

Pile-On Follow-Through is an **Advanced FT clone** that uses a different promotion path: instances of a ticker being **"over-shorted"** rather than over-extended. Understanding why this works requires understanding market incentives around funding rates.

#### The Over-Shorted Problem

When a ticker is unjustly over-shorted, the market is incentivized to pump the price. This happens partly via **funding fees**—shorts pay longs to maintain their positions. If bears are piling on without structural justification, bulls can spike the price and collect funding while forcing bears to close at a loss.

This makes over-shorted tickers **generally risky** to short further, even if the price is still falling. Avoiding over-shorted tickers is wise even if they eventually come down.

#### Two Paths to "Justly Over-Shorted"

However, there are scenarios where over-shorting is **justified**:

**A. Four 15-minute candles (weak signal)**  
If bears are willing to sit through four 15-minute candles being over-shorted, this is a weak signal that something serious is happening. They're accepting the funding rate risk, which suggests conviction.

**B. Eight 15-minute candles (strong signal)**  
This is a much stronger indicator because it often falls into the **4-hour funding fee deduction window**. If bears are willing to:
- Pay the funding premium to stay in
- Hold through a full funding cycle

And bulls are **not willing to spike them** despite the funding incentive, this reveals **structural problems with the ticker**. The ticker is justly shorted—bears have conviction, bulls have none.

#### The Bull/Bear Phenomenon

An interesting pattern emerges: when a cohort of bears get spiked or close after decent gains, the price rises temporarily and the funding rate improves. This creates an **ample opportunity to enter a ticker that is confirmed bearish** at a moment when:
- The immediate over-shorted pressure is relieved
- The funding rate is temporarily acceptable
- The underlying structural problems remain

Pile-On FT waits for these windows, applying Advanced FT methods (RSI 45-75 band, optional vol mom/VSI) to tickers that have proven justified over-shorting through sustained bear conviction.

#### Philosophy

**"Missed opportunities can be recovered, liquidated capital cannot."**

Pile-On FT often comes up sparse because the funding rate filter is conservative. The filter is optional—it provides more targets without it, but with more risk. We prefer false negatives (missed entries) over false positives (entering unjustly over-shorted tickers that spike).

---

## Follow-Through Strategy

### Overview
Follow-Through is the predecessor to Advanced Follow-Through. Where Advanced FT uses **prolonged over-extension** as an indicator of potential weakness, regular FT uses **verified re-entry** as a weakness indicator—we directly observe the ticker being defeated by repeated entries.

### Promotion to FT Roster
When a ticker accumulates **2+ rodeo rides**, it promotes to the Follow-Through roster. We used to set this threshold at 4 rides, but when we raised the Gainers RSI gates and rodeo creep percentage, 2 rides became the more likely outcome.

### Entry Logic
Same as Advanced FT: wait for RSI to cool into the 45-75 band, then enter when volume momentum (optional) and VSI (optional) confirm. The only difference is the **promotion path**—rodeo rides vs. over-extension hits.

---

## Faders & Carry-On Strategy

### Overview
Faders (originally "fade losers") targets tickers that have **already collapsed** and are in a **long period of downward activity**, typically lasting days. This is the bottom-feeding strategy—the highest conviction bracket in the system.

The strategy is **not very good at its job** but it's **"good enough"**. When a ticker is genuinely in freefall, Faders extracts maximum value. When it's not, the filters prevent catastrophic losses.

### Target Profile
Faders looks for tickers in the **RSI 10-50 range**—much lower than Follow-Through (45-75) or Gainers (70-80). These tickers have already experienced significant price collapse and are continuing to fade.

---

### Two Types of Faders

#### **Regular Faders**
Tickers that qualify based on RSI 10-50 and volume momentum. They compete for limited watchlist slots—the watchlist ranks candidates by volume momentum strength, and higher vol mom tickers bump out weaker ones.

#### **Carry-On Faders**
Promoted from the over-shorted tracking system after accumulating 8+ pile-on hits. The name references:
- **"Carrion"**: The ticker is functionally a dead animal at this point
- **"Carrying on"**: Continuing an existing assault on the ticker, likely after it's been traded by the FT paths and dropped from their range

Carry-Ons operate on a different timeline than regular faders. We watch each Carry-On ticker for up to 6 hours (configurable), looking for optimal entry windows during its extended collapse. This is actually shorter than the FT roster window, but the expectation is different—we're waiting for a ticker that's already confirmed bearish to present entry opportunities as it continues downward.

Trades are limited to **2 per confirmation** to avoid sudden reversion at market lows.

---

### Critical Filter: Historical RSI6 Check

The **historical RSI6 check** is the most significant filter. Before entering a fader, we look back 3 hours through 15-minute candles. If RSI6 ≥ 90 occurred at any point during that window, the ticker is **disqualified from Faders** and routed to Advanced FT instead.

**Rationale**: Once a ticker is over-extended, it's like an **omen of doom**—it's no longer a fader but an over-extender. The behavior profile changes fundamentally. Over-extended tickers require different risk parameters and entry timing (handled by EXD/Advanced FT).

Reducing the RSI range to below 50 max also helps prevent entries on tickers that haven't truly collapsed.

---

### Entry Filters

#### **Regular Faders**

1. **RSI Band: 10-50**  
   All three timeframes (RSI6, RSI12, RSI24) must be between 10-50. Tickers above 50 haven't collapsed enough. Tickers below 10 are at extreme lows where reversals become likely.

2. **Volume Momentum Band**  
   Must fall within a specific range (minimum to maximum). Too low means insufficient sell pressure; too high can indicate exhaustion.

3. **Positive Vol Mom Gate** (Optional)  
   Requires net sell pressure (vol mom > 0). Ensures we're not entering during brief buying surges.

4. **Velocity Gate** (Optional)  
   Current 15-minute candle must exceed average 24-hour candle volume/turnover by a specified percentage. This confirms the collapse is **accelerating**, not slowing.

5. **No Over-Extension in Past 3 Hours**  
   As described above—historical RSI6 ≥ 90 disqualifies the ticker entirely.

#### **Carry-On Faders**

Carry-Ons use a **different gate structure** focused on sustained collapse rather than immediate momentum:

1. **RSI Band: 10-50**  
   Same as regular faders.

2. **Velocity Gate** (Different threshold)  
   Higher velocity requirement than regular faders—the 15-minute candle must significantly exceed the 24-hour average. This confirms the collapse is genuinely accelerating despite the ticker being over-shorted.

3. **Funding Rate Check**  
   Unlike regular faders, Carry-Ons explicitly check funding rate. If the ticker is too over-shorted (funding rate too negative), it creates incentive for bulls to spike the price. We skip these entries even though the ticker qualified via pile-on tracking.

4. **No Over-Extension in Past 3 Hours**  
   Same as regular faders.

5. **No Positive Vol Mom Requirement**  
   Carry-Ons don't require positive vol mom. The 8+ pile-on hits already confirm sustained bearish pressure—we're looking for acceleration via velocity, not vol mom confirmation.

---

### Why 3× Margin

Faders use **3× margin**—the highest in the system. When a ticker has collapsed into the 10-50 RSI range, shows strong volume momentum or velocity, passes all filters, and has no over-extension history, it's in **controlled freefall**. The conviction is highest here because:
- The ticker has already fallen significantly (not catching a hot rocket)
- Volume confirms continued selling pressure
- No recent over-extension (not a bounce candidate)
- The collapse is sustained, not a single-day event

This is the top of the conviction hierarchy: Gainers (1×) → EXD/FT (2×) → Faders (3×).

---

## General Mechanics

### DCA (Dollar Cost Averaging) Structure

**Our Strongest Weapon**

The DCA structure is our strongest weapon and allows us to be **a little wrong**—we increase margin and get a better average entry. The structure was devised through trial and error based on observed pump capacity:

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

**TP ROI by Stage**: `[16%, 9%, 6%, 4%]`

The TP percentages **decrease** with each stage because our average entry gets worse. The structure is designed so that **at each DCA stage, the TP yields approximately the same dollar amount as the original entry would if it went perfectly**. We aren't looking to make more profit from the DCA—just get out after a better entry.

**Why This Works**: Each pump makes it relatively easier for us to exit. As price moves against us and triggers adds, our average entry price rises and our TP price rises with it. Even really bad strategies can often be validated by our DCA structure.

**DCA Stage 3 = Emergency Harness**: A DCA3 trigger is itself an **invalidation** of the strategy. It exists as an emergency harness, not a planned outcome.

---

### Stop Loss (SL)

**A Contentious Addition**

We long argued against SL, believing that for a ticker to liquidate us, the price would need to pump **100-200% in a single day** depending on our cross-margin balance—functionally unheard of. Then **$SIREN** did exactly that.

**Hard Cap: -105%**

As a result, we set a hard cap at **-105% loss**. Regardless of what the ticker does afterwards, we must accept that loss and try to understand why it happened.

- For users on **isolated margin**, the position would be liquidated at -75%, so they'd never enter this path
- For cross-margin users, the SL prevents total account wipeout

**When SL Is Set**: Only at **Stage 3** (after all three DCA adds have triggered)

**Why Set Late?**
- Avoids revealing the SL to stop hunters

**Why -105% Specifically?**
- For users on **isolated margin**, the position would be liquidated at -75%, so they'd never enter this path
- For cross-margin users, the SL prevents total account wipeout
- Can be missed if the bot goes offline
- A full SL at Stage 3 requires a **~22% pump after entry**—a complete invalidation of the strategy requiring adjustment

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

**Opportunity Cost Tracking**: Every time any position closes (profitable or not), that PnL gets added to the "lost value" tally for all remaining open positions. This tracks opportunity cost—"we could have closed this laggard and taken those gains instead."

**Cascade Effect**: This can cause a cascade of closes if many tickers are stuck and one suddenly shows motion.

**In Practice**

The laggard system closes **most positions that would otherwise have hit their targets**, but this forgone profit is acceptable. It also prevents us from lingering in tickers that would spike and either cause a more unfavorable force close or stop us out completely.

The aggressive 45-minute reduce phase means we sacrifice potential gains for risk management—positions close earlier than they "should," but the alternative is exposure to reversals.

---

### Rodeo Creep Effects on TP/Notional

As covered in the Gainers section, each rodeo ride increases both TP target and position size by **50%** (default, adjustable). This applies to the **entry TP** (Stage 0) only—the DCA TPs remain at their standard values.

**Example**:
- Normal entry TP: 16%
- After 1 rodeo: 16% × 1.5 = 24%
- After 2 rodeos: 16% × 1.5 × 1.5 = 36%

The rationale: unstable tickers produce deeper downward wicks and face greater upside resistance—more conviction is justified.

---

## Conclusion

These strategies are designed to be executed by automation, not humans. The mental overhead of manually tracking:
- RSI gates across three timeframes
- Volume momentum calculations and thresholds
- Historical over-extension checks
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

Within these constraints, the strategies can function as a form of **Universal Basic Income** (UBI)—consistent, automated returns that compound over time without requiring active management beyond initial configuration and monitoring.

The system is designed to run continuously, adapting to market conditions through its tiered conviction structure and dynamic filters, making money while you sleep.

**Thanks for reading, have fun!**

---

