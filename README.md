# ❄️ EVERWINTER

**EverWinter** is a high-frequency volatility-fading bot designed for Bybit USDT Perpetuals. It specializes in identifying and shorting "blow-off gainers"—targeting overextended assets by utilizing a multi-timeframe RSI strategy and a tiered DCA (Dollar Cost Averaging) approach.

Built as a lightweight, single-file web application, EverWinter provides a "terminal-style" dashboard for real-time monitoring and automated execution directly from your browser.

## Key Features

* **Top Gainer Scanning:** Automatically monitors the "Top N" gainers on Bybit to find assets with the highest probability of a mean-reversion.
* **Multi-Timeframe RSI Filter:** Executes entries only when RSI6, RSI12, and RSI24 on the 15-minute timeframe align to signal an overbought state.
* **Tiered DCA Strategy:** Manages risk through a three-tier "Add" system (at +3%, +9%, and +15% price increases) to improve entry averages during volatile spikes.
* **Dynamic Take-Profit (TP):**
    * **Base TP and Stages:** For each DCA stage the TP ROI gradually reduces; Stage-0 = 16%, Stage-1 = 9%, Stage-2 = 6%, Stage-3 = 4%. This aims for a similar overall profit as the price moves against the position. 
    * **TP Drift:** Often due to latency and volatility; the TP price drifts from its intended ROI percent, the bot actively monitors TP ROIs for each position and adjusts them to match expected values for all DCA stages or the original entry.
    * **Time-Decay TP:** Automatically reduces TP targets to 3% after 12 hours to prioritize capital rotation.
* **Hard-Stop Recovery:** Includes a "Force Market Close" safety mechanism that triggers if a position remains open for more than 24 hours.
* **Client-Side Security:** API keys are stored only in volatile memory (RAM) or local browser storage; credentials are never sent to any third-party server except Bybit’s official API.
* **Stop-Loss (SL):** 
   * **Trend Continuation:** In the rare event where an upward trend continues, it is safer to absorb losses than hold, on isolated margin the position will be automatically liquidated at -75% ROI.
   * **Loss Absorption:** For cross margin an SL is required to prevent total erasure of the account, as such; the bot will automatically set a stop loss after the third DCA conditional is triggered, this amounts to **-105%** of the position's value. 
* **Funding Rates:**
   * **Overcrowded Slots:** When an asset's funding rate is deeply negative this implies that it is being heavily shorted, which can incentivize bullish traders to hold and reap funding fees or even push the asset higher and squeeze shorts to force a liquidation cascade. 
    * **Filter:** The bot features an optional and adjustable funding rate filter that starts with a default value of -0.05%. 
* **Rodeo Filter:** 
   * **Repeat Entry:** When coins are volatile they tend to wick into our TP very quickly then wick back up and become eligible again. This is a trap which can often yield many "rides" but always ends in a position that threatens SL. 
   * **The Filter:** Whenever an asset hits our TP it is recorded as a "creep" and its "implied RSI gate" is increased by 3% across all timeframes. This "creep mode" lasts (6) hours for the asset. E.g if the starting requirement is 70-70-75, after the first ride it will creep to 72-72-77, and after the second it will creep to 74-74-79, etc. 
   * **Configuration:** The creep percent can be adjusted in the config menu, active creeps are displayed under the creep slider. 
* **Max RSI6:** Prevents entries when RSI6 exceeds a configurable value, (default 90). While typically overbought, extreme RSI6 levels signal excessive short-term momentum that could potentially extend further. This acts as a safety to avoid shorting vertical "blow-offs" before they peak.
* **Volume Divergence Filter:** A configurable dual-sided filter to manage capital risk amid manipulation.
    * **Positive:** Blocks entries if volume is above the configurable threshold (default >35%) higher than the top 3 or 4 gainers (or losers) excluding the subject coin. Such divergence indicates heavy capital injection that could cause parabolic moves.
    * **Negative:** Flags coins moving on low volume, lower than the lowest 3 or 4 gainers (or losers) excluding the subject coin. Such divergence suggests whale accumulation ahead of late retail volatility.

## Technical Stack

* **Frontend:** Alpine.js (Reactive UI logic)
* **Styling:** Bootstrap 5 + Custom "Glacier-Void" CSS theme
* **Communication:** Bybit V5 API (REST)
* **Architecture:** Single-file HTML/JavaScript application.

## Background Sync
* **Audio Loop:** The bot plays a silent looped audio when started, this allows it to be persistent on Android even when the screen is off or the browser is in the background. 
* **Edge Cases:** If the loop is ever interrupted it will automatically try to restart once the page is reopened, if this fails the "sync" indicator at the top of the page will blink orange, you can click on it to try and resync.

### Follow-Through Strategy

An extension of the **Rodeo Filter** that targets assets after a specific number of successful "rides". If the asset's RSI across all timeframes settles into a configurable range (default 20-50), the bot will re-enter the coin for a set number of cycles. 
The rationale being; repeated entries at/around the 24hr top of a coin indicate extreme volatility and weakness. Follow-Through allows the bot to stay aggressive on a weakening asset even after the standard RSI gates have "blown-off" and come down.

## Getting Started

1.  **Download the HTML:** Very self-explanatory. 
2.  **Open the App:** Simply open `EverWinter1.0.html` in any modern web browser.
3.  **Connect API:**
    * Generate an API Key on Bybit with **Contract/Derivatives** permissions.
4.  **Configure & Start:** Adjust your leverage and margin settings, then click **"Start Bot"**.

## ⚠️ Risk Warning

Trading perpetual futures involves significant risk. EverWinter is a tool for automation and does not guarantee profits. 
* **Loss Risk:** High leverage can lead to heavy losses during parabolic "short squeezes." It is advised to only use this bot during a prolonged bear market with the default settings applied.

## 🧪 PseudoWinter (Simulation Mode)

**PseudoWinter** is the built-in sandbox environment designed for strategy calibration and risk-free observation. It allows you to run the full EverWinter logic—including RSI scanning and tiered DCA execution—using real-time market data but with "phantom" capital.

### Features
* **Closed Trades:** Includes a "PnL" scorecard section showing past trades, their duration and performance.
* **Key Requirement:** Only requires a "Read-Only" API key. While it is possible to run the bot using Bybit's public API, the current version accounts for operation via file explorer (which the public API will reject).

> **Note:** PseudoWinter calculations use the same latency-compensation logic as the live bot, providing a highly accurate representation of "TP Drift", slippage and execution timing. It also accounts for funding fees paid through the duration of the short.
