# ❄️ EVERWINTER

**EverWinter** is a high-frequency volatility-fading bot designed for Bybit USDT Perpetuals. It specializes in identifying and shorting "blow-off gainers"—targeting overextended assets by utilizing a multi-timeframe RSI strategy and a tiered DCA (Dollar Cost Averaging) approach.

Built as a lightweight, single-file web application, EverWinter provides a "terminal-style" dashboard for real-time monitoring and automated execution directly from your browser.

## Key Features

* **Top Gainer Scanning:** Automatically monitors the "Top N" gainers on Bybit to find assets with the highest probability of a mean-reversion.
* **Multi-Timeframe RSI Filter:** Executes entries only when RSI6, RSI12, and RSI24 on the 15-minute timeframe align to signal an overbought state.
* **Tiered DCA Strategy:** Manages risk through a three-tier "Add" system (at +3%, +9%, and +15% price increases) to improve entry averages during volatile spikes.
* **Dynamic Take-Profit (TP):**
    * **Base TP:** Standard profit targets for the initial entry and each DCA tier.
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

## Technical Stack

* **Frontend:** Alpine.js (Reactive UI logic)
* **Styling:** Bootstrap 5 + Custom "Glacier-Void" CSS theme
* **Communication:** Bybit V5 API (REST)
* **Architecture:** Single-file HTML/JavaScript application.

## Configuration Parameters

| Parameter | Description | Default/Range |
| :--- | :--- | :--- |
| **Leverage** | Account leverage for all positions. | 1x - 20x |
| **Entry Notional** | Initial position size in USDT. | $6 - $200 |
| **RSI Thresholds** | Minimum RSI levels required to trigger a short. | 50 - 90 |
| **Max Positions** | Total concurrent active shorts allowed. | 1 - 6 |
| **Scan Frequency** | Interval between market scans for new gainers. | 5 - 60 mins |

## Background Sync
* **Audio Loop:** The bot plays a silent looped audio when started, this allows it to be persistent on Android even when the screen is off or the browser is in the background. 
* **Edge Cases:** If the loop is ever interrupted it will automatically try to restart once the page is reopened, if this fails the "sync" indicator at the top of the page will blink orange, you can click on it to try and resync.

## Bitcoin Strategy 
* **Structure:** The bot can optionally execute a Bitcoin based strategy with hardcoded values, it targets RSI6-12-24 equal to or greater than 75-75-65, using a similar DCA structure as the gainers strategy.
* **Leverage and Take-Profit:** The bot uses 25x leverage hardcoded for its Bitcoin strategy, with TP ROI at 25% (-1%) price change.
* **Selection:** The bot can be setup to execute either the gainers strategy, Bitcoin strategy or both. 
* **Capital Utilization:** The Bitcoin strategy has fewer entries but allows greater capital utilization, up to $10,000 notional ($400 cost) per "add", compared to the gainers' max $200 notional per "add". 

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
