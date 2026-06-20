# ❄️ EVERWINTER

**EverWinter** is a browser-based trading suite for Bybit USDT Perpetuals executing the **Winter-Chaser** strategy. See the [Strategy Guide](Strategy_book.md) for trading logic and rationale.

---

## Files

| File | Purpose |
|---|---|
| `PseudoWinter.html` | Shorts-only simulation bot |
| `PseudoChaser.html` | Longs-only simulation bot |
| `PsychoWinter1.0.html` | Reactive approach standalone bot |
| `ChartWinter.html` | Chart and market scan tool |
| `plugins/modes/EverWinter.html` | Live trading plugin for PseudoWinter |
| `plugins/modes/SunChaser.html` | Live trading plugin for PseudoChaser |
| `plugins/modes/EDa-Winter.html` | EDa (Effective Debt Adjusted) plugin for PseudoWinter |
| `plugins/modes/EDa-Chaser.html` | EDa plugin for PseudoChaser |
| `plugins/strategies/MultiIndicator-Winter.html` | Entry filter plugin for PseudoWinter |
| `plugins/strategies/MultiIndicator-Chaser.html` | Entry filter plugin for PseudoChaser |
| `plugins/analytics/Permafrost-Winter.html` | Market climate plugin for PseudoWinter |
| `plugins/analytics/Ashfall-Chaser.html` | Market climate plugin for PseudoChaser |

---

## Setup

Open any `.html` file directly in a browser. No build step, no server, no installation. Alpine.js and Bootstrap 5 are loaded from CDN — an internet connection is required on first load (cached after that).

**Running both bots**: open PseudoWinter and PseudoChaser in separate tabs from the same origin. When both are open simultaneously they automatically share bulk ticker fetches, kline caches, and liquidation results to halve API load. Either bot works normally on its own when the other tab isn't open.

---

## Plugins

To load a plugin, open the **Plugin Manager** panel, click **Load Plugin**, and select the `.html` file. **A page reload is required after loading or removing any plugin** — the plugin pipeline runs once at page boot, so changes don't take effect until the next load.

Load order matters: live trading plugins (EverWinter, SunChaser) must load before strategy plugins (MultiIndicator, Permafrost/Ashfall). The Plugin Manager shows the current load order and warns about conflicts.

---

## Main Config

Changes take effect immediately and are persisted to localStorage automatically.

| Setting | What it does |
|---|---|
| **Scan Interval** (`scanMins`) | How often (minutes) the bot runs a full market scan. Controls both entry frequency and the scan bar in the UI. |
| **Max Positions** (`maxPos`) | Maximum simultaneously open positions. No new entries open once this is reached. |
| **Leverage** (`leverage`) | Position leverage. Affects order size, TP/SL prices, and EDa thresholds. |
| **Min Notional** (`minNotional`) | Base margin per position in USDT. Actual order size = minNotional × leverage. |
| **TP %** (`tpPct`) | Take-profit target. When EDa is active this is the buffered target — the debt-free close happens at a lower percentage. |
| **SL %** (`slPct`) | Stop-loss. Position closes immediately when mark price hits this level. |
| **RSI Filter** (`rsiEnabled`) | When on, a ticker must pass an RSI gate before entry. Blocks entries when momentum is already exhausted. |
| **RSI Threshold** (`rsiThreshold`) | RSI value required to qualify. PseudoWinter requires RSI above threshold (room to fall); PseudoChaser requires below (room to rise). |
| **Drawdown Throttle** (`drawdownThrottleEnabled`) | Halts new entries for 12 hours when rolling 6h realized PnL drops below a loss threshold. |
| **Drawdown Factor** (`drawdownThrottleFactor`) | Loss threshold as a multiple of entry margin. At 0.5× with $1 margin, $0.50 of rolling losses triggers the halt. |
| **Gains Lock** (`gainsLockEnabled`) | Halts new entries for 12 hours once rolling 6h profit hits a target. Banks a winning streak before it reverses. |
| **Gains Factor** (`gainsLockFactor`) | Profit target as a multiple of entry margin. Same scale as Drawdown Factor. |
| **EDa / Laggard Check** (`laggardCheckEnabled`) | Enables the Effective Debt Adjusted system. Realized losses are passed forward to surviving positions, which take higher TP targets to recover the debt. **Requires the EDa-Winter / EDa-Chaser plugin** (`plugins/modes/`). |
| **TP Buffer** (`laggardProfitOffset`) | Extra TP headroom reserved above the functional target (%). The debt-free close happens at `tpPct ÷ (1 + buffer/100)` — at 50% buffer with an 18% TP slider, trades close at 12% without debt. Requires the EDa plugin. |
| **Ticker Cooldown** (`bulkTickerCooldownHours`) | How long the bot reuses a cached bulk ticker fetch before hitting the API again. Higher = fewer API calls per day. |
| **Whiplash Audit** (`whiplashEnabled`) | When on, the position watcher fetches 1-minute klines near TP to confirm whether price spiked through TP between watcher cycles. |
| **Whiplash Proximity** (`whiplashProximityPct`) | How close (%) to TP price triggers the kline audit. |
| **Funding Drop Close** (`fundingDropEnabled`) | Closes a position when its funding rate flips adverse beyond a set amount. Cuts carry cost before it erodes PnL. |
| **Runtime Limit** (`runtimeHours`) | Maximum position age. Forces a close at the deadline if TP hasn't been hit. |
| **TP Reduce** (`tpReduceMins`) | Minutes before the runtime deadline when TP is tightened to improve close probability. |
| **Symbol Banlist** (`banlistEnabled`) | When on, symbols on the ban list are excluded from all scans. Entries expire after 7 days. |
| **Config Lock** (`cfgLocked`) | Locks all config controls to prevent accidental changes while the bot is running. |

---

## Stats Menu

The stats panel shows session-level metrics since the page was last loaded or state was cleared.

| Stat | Meaning |
|---|---|
| **Session PnL** | Cumulative realized PnL from all closed trades this session. |
| **Win / Loss** | Count of profitable vs. losing closed trades. |
| **Win Rate** | Wins ÷ total closed trades. |
| **Avg PnL** | Mean realized PnL per closed trade. |
| **Open uPnL** | Unrealized PnL across all currently open positions. |
| **Positions** | Count of open positions. |
| **Last Scan** | Timestamp of the most recent scan cycle. |
| **Laggard** | The oldest open position — the EDa debt holder. Shows its current debt load when EDa is active. |

### Actions Dropdown

- **Export** — Downloads current bot state (config, positions, closed trades, ban list, EDa state) as a `.json` file. Plugins with their own data (Permafrost/Ashfall profile, scorecard) have separate Export buttons inside their own accordions — the Stats menu Export covers the base bot state only.
- **Import** — Restores state from a previously exported `.json` file. Config fields merge field-by-field; positions replace wholesale. A 5s debounce prevents accidental double-imports.
- **Clear Closed Trades** — Wipes the closed trades list and resets session stats. Open positions are unaffected.
- **Clear All** — Full reset. All positions, trades, stats, and config are wiped (config reverts to defaults).

### Activity Log

Timestamped entries for every significant bot event. Color coding:

- **White** — informational (scan results, entries, closes)
- **Yellow** — warnings (halts engaged, API retries)
- **Red** — errors (API failures, plugin conflicts)

Common prefixes: `[MHL]` drawdown halt · `[GLK]` gains lock · `[PLK]` preemptive lock · `[PFR]`/`[ASH]` climate plugin events · `[MIW]`/`[MIC]` multi-indicator events.

The log is capped at 300 entries in memory and in localStorage. Oldest entries are dropped when the cap is exceeded.

---

## Trades Menu

The trades panel shows a card for each closed trade, newest first.

**Roll-up card**: when the closed trades list exceeds 50 entries, the oldest are compacted into a single roll-up card showing their net PnL, trade count, and the date range they cover. The roll-up is not a trade — it is a historical summary. In the PnL chart, the roll-up's net value acts as a baseline offset applied to every plotted point.

**PnL chart**: click the **PNL CHART** bar below the header to expand a cumulative PnL line chart. The X-axis spans from the first to the last individual closed trade at fixed spacing. The chart is green when the net result is positive, red when negative. The chart only appears once at least 2 individual trades are closed.

**CLEAR button**: removes all closed trades and resets session stats. Clicking CLEAR reveals an inline confirmation ("Sure? Yes / No") before anything is deleted. Yes confirms; No cancels with no change.

---

## MultiIndicator Plugin (MIW / MIC)

The Multi-Indicator plugin filters entries using configurable criteria combinations called **slots**. Each slot is an AND-gate: all criteria in the slot must be true for a ticker to qualify. Any single matching slot opens the ticker for entry.

### Criteria

| Criterion | Meaning |
|---|---|
| `+fund` | Funding rate favors the position direction — carry income for the bot. |
| `-fund` | Funding rate is adverse to the position direction. |
| `+24h` | Ticker is up on the day. |
| `-24h` | Ticker is down on the day. |
| `>10pct` | 24h turnover exceeds 10% of market cap — high relative volume participation. |
| `<10pct` | 24h turnover below 10% of market cap — low relative participation. |
| `lsa` | Last completed 1h candle had a volume spike AND closed down — sell-side pressure. |
| `lba` | Last completed 1h candle had a volume spike AND closed up — buy-side pressure. |
| `sliq` / `sliq>N` / `sliq<N` | Short liquidations dominated the latest liq cycle for this ticker (bullish flow). Optional depth suffix gates by intensity. Requires Permafrost/Ashfall with liquidation surveillance on. |
| `bliq` / `bliq>N` / `bliq<N` | Long liquidations dominated the latest liq cycle (bearish flow). Same depth gate mechanism as sliq. |

Depth gate: `sliq>N` requires `sDepth ≥ N`; `sliq<N` requires `sDepth ≤ N`. `sDepth` is an integer score where 0 = average hourly liq volume for that ticker, positive = above average, negative = below. Without a suffix the depth gate is skipped.

### Config

| Setting | What it does |
|---|---|
| **Enabled** (`miwEnabled`/`micEnabled`) | Master on/off. When off, the plugin opens no entries and runs no exits. |
| **Picks** (`miwPicks`/`micPicks`) | Max new entries per scan cycle (1–10). |
| **FR Threshold** (`miwFrThreshold`/`micFrThreshold`) | Minimum funding rate magnitude (%) for `+fund`/`-fund` to qualify. |
| **Share Cap** (`miwShareCapEnabled`/`micShareCapEnabled`) | Limits plugin entries to a percentage of `maxPos`. Prevents MIW/MIC from filling all position slots. |
| **Share Cap %** (`miwShareCapPct`/`micShareCapPct`) | The cap percentage. At 50% with maxPos=6, MIW/MIC can hold at most 3 positions. |
| **Vol Spike Min/Max** (`miwKlineVolMin`/`miwKlineVolMax`) | The spike band for LSA/LBA: the 1h candle volume must fall within this % range above the 24h hourly average. Too weak or too violent evaluates false. |
| **Kline Scan Cap** (`miwKlineScanCap`/`micKlineScanCap`) | Max tickers sampled per cycle for LSA/LBA kline fetches. Higher = broader coverage, more API calls. |
| **Cascade** (`miwCascadeEnabled`/`micCascadeEnabled`) | Closes all MIW/MIC positions when their collective unrealized profit hits a threshold. Banks a group move before it reverses. |
| **Cascade %** (`miwCascadePct`/`micCascadePct`) | Collective uPnL trigger as a % of average entry margin. |
| **Sacrifice** (`miwSacrificeEnabled`/`micSacrificeEnabled`) | Closes MIW/MIC positions when their collective unrealized loss hits a threshold. Caps group drawdown. |
| **Sacrifice %** (`miwSacrificePct`/`micSacrificePct`) | Collective uLoss trigger as a % of average entry margin. |
| **Rolling Sacrifice** (`miwRollingSacrificeEnabled`/`micRollingSacrificeEnabled`) | When on, Sacrifice closes only the oldest MIW/MIC position at a time instead of all at once. |
| **Fade Away** (`miwFadeAwayEnabled`/`micFadeAwayEnabled`) | Closes the oldest MIW/MIC position when the majority of scanned 1h candles are moving against the position direction. |
| **Fade Away %** (`miwFadeAwayPct`/`micFadeAwayPct`) | Directional majority threshold. At 50%, more than half the sampled candles must be adverse to trigger. |
| **Liq Fade Away** (`miwLiqFadeEnabled`/`micLiqFadeEnabled`) | Closes the oldest position when liquidation flow is adverse AND the scorecard confirms that signal has historically lost. Both conditions must hold. |
| **Liq Fade %** (`miwLiqFadePct`/`micLiqFadePct`) | Adverse liq dominance threshold for Liq Fade Away. |
| **Liq Block Entries** (`miwLiqFadeBlockEntries`/`micLiqFadeBlockEntries`) | When on, new entries are also blocked while the adverse liq signal is active. |
| **Liq Result Max Age** (`miwLiqResultMaxCycles`/`micLiqResultMaxCycles`) | How many scan cycles a liq result stays valid for sliq/bliq slot criteria. Results older than this are treated as if absent, and the criterion evaluates false. Default 2. |
| **Auto Slots** (`miwAutoSlots`/`micAutoSlots`) | Replaces the manual slot list with every possible combination of the available criteria at the chosen size. |
| **Auto Slot Size** (`miwAutoSlotSize`/`micAutoSlotSize`) | How many criteria per auto-generated combination (1–4). |
| **Exclude from Auto** (`miwAutoSlotExclude`/`micAutoSlotExclude`) | Criteria omitted from auto-generated combinations and from scorecard scoring. |

### Slots UI

**Manual mode**: click a slot to select it, then toggle criteria on/off in the picker row below. ✕ deletes the slot; `+` adds a new empty one.

**Auto mode**: the manual builder is replaced by a size picker and an exclusion chip row. The combo count shown reflects how many slots are active after exclusions and blocks. Note that many generated combinations are contradictory and will never match any ticker — a slot containing both `+fund` and `-fund`, or both `+24h` and `-24h`, can never be satisfied simultaneously. The same applies to `lsa`/`rasl` (direct opposites) and `lba`/`rabl`. At size 2 these pairs are common, so the effective slot count is lower than the number shown. Excluding one side of each pair removes the dead combinations. Additionally, `lsa`/`lba`/`rasl`/`rabl` almost never co-qualify with `>10pct`/`<10pct` in the same slot: vol/mcap criteria apply only to the top 30 tickers by turnover, while kline criteria apply to a random sample drawn from the full pool — the overlap between those two subsets is small in practice.

**Blocked slots** show a red border and ⛔ badge. A slot is blocked when the Permafrost/Ashfall scorecard has recorded enough losses for that criteria combination to cross the loss threshold.

---

## Permafrost / Ashfall Plugin

Permafrost targets PseudoWinter; Ashfall targets PseudoChaser. These plugins replace the fixed 12h drawdown/gains-lock timers with a learned market climate profile. They track market breadth, momentum, and funding sentiment, and learn which conditions precede losses vs. profits. Halts end when the climate improves rather than when a clock runs out.

**During the first weeks of operation the plugin behaves almost identically to the stock timers.** It withholds climate governance until enough evidence has accumulated near the current market reading.

### Config

| Setting | What it does |
|---|---|
| **Enabled** | Master toggle. When off, the bot uses the stock 12h halt timers. |
| **Thaw/Settle Score** | Climate score the market must reach for an early halt lift. Higher = harder to thaw; bot stays halted longer in ambiguous conditions. |
| **Hard Cap** (`permafrostCapHours`/`ashfallCapHours`) | Maximum halt duration in hours (12–48h). The bot always resumes by this deadline regardless of climate. |
| **PLK** (Preemptive Lock) | When on, the plugin can engage a lock before any PnL damage if climate is sufficiently hostile during a routine scan. |
| **PLK Trigger Score** (`permafrostPlkScore`/`ashfallPlkScore`) | How hostile the climate must be (−0.05 to −0.50) to engage a preemptive lock. More negative = harder to trigger. |
| **IO Sentiment** | Includes funding rate sentiment (which side is paying) in the climate score. |
| **Slot Scorecard** (`permafrostScorecardEnabled`/`ashfallScorecardEnabled`) | Records realized PnL per MIW/MIC criteria combination. Shows which slot types have been profitable or losing over time. |
| **Auto Block** (`permafrostAutoBlock`/`ashfallAutoBlock`) | Automatically blocks losing slot combinations in the MIW/MIC entry filter based on scorecard history. |
| **Block Threshold** (`permafrostSlotLossThreshold`/`ashfallSlotLossThreshold`) | Total loss (as a fraction of entry margin) a slot must accumulate before being blocked. |
| **Cross Broadcast** (`permafrostCrossEnabled`/`ashfallCrossEnabled`) | Writes cascade/sacrifice closes and drawdown halt/gains-lock transitions to a shared log that the partner bot can read. Required for Mutual DDH Lift. |
| **Mutual DDH Lift** (`permafrostMutualDdLiftEnabled`/`ashfallMutualDdLiftEnabled`) | When both bots are simultaneously in drawdown halt, lifts this bot's halt. Checked every 15 s. Requires Cross Broadcast to be on. |
| **Liquidation Surveillance** (`pfLiqEnabled`/`ashLiqEnabled`) | Opens WebSocket connections to track live liquidation flow across a rolling sample of volatile tickers. Required for `sliq`/`bliq` criteria in MIW/MIC. |
| **Liq Batch Size** (`pfLiqBatchSize`/`ashLiqBatchSize`) | Tickers per liquidation batch (5–50). More tickers = broader market coverage per cycle. |
| **Liq Threshold %** (`pfLiqThresholdPct`/`ashLiqThresholdPct`) | Minimum share of a cycle's total liquidation turnover one side must hold to qualify (10–90%). At 50%, one side must account for at least half. |

### Status Block

Shows the current climate reading (magnitude, breadth, slope, IO score, effective score, evidence mass), active halt state (profile-governed or fallback timer), and PLK countdown. The **wave graph** plots recent market structure — direction label (rising/falling/steady) reflects the recent path of the market.

### Slot Scorecard

Chip row sorted by total PnL. Each chip shows the criteria emoji string, net PnL in bold, and win/loss count. Partner bot data is included with PnL inverted — a Winter win implies a Chaser loss and counts against the Chaser scorecard. **CLEAR** wipes all records and resets all auto-blocks.

### Liquidation Feed

When surveillance is on: the **Feed Watcher** panel shows active batches (batch ID, ticker count, running S-Liq / B-Liq USDT totals, dominant side, countdown). The **Liq Sample chart** shows the last 10 closed cycles as stacked bars (S-Liq green / B-Liq red, qualifying segments at full opacity). The **Latest Cycle** chip grid shows per-ticker qualification with 🥵/🥶 badges.

### Danger Zone

**Clear Plugin State** removes all profile data and halt state from localStorage and memory. Use before uninstalling the plugin to avoid orphaned data, or to guarantee a fully clean slate. Irreversible.

---

## Trivia

Developer-level detail with no operational consequence. Included for reference.

### localStorage Keys

| Key | Contents |
|---|---|
| `pw_v1` | PseudoWinter: cfg, positions, sess, closedTrades, bot timestamps, symbolBanlist, lostValue, laggardId |
| `pw_v1_log` | PseudoWinter activity log (capped at 300 entries) |
| `__pw_plugins_v1` | PseudoWinter serialized plugin list |
| `pc_v1` | PseudoChaser: same structure as pw_v1 |
| `pc_v1_log` | PseudoChaser activity log |
| `__pc_plugins_v1` | PseudoChaser serialized plugin list |
| `__ew_shared_v1` | Cross-tab shared data registry (bulkTickers, watchTickers, klines_1h, klines_1h_last, mcap, liqResults) |
| `__pf_liq_batches` | Permafrost active liq batch snapshots (for reconnect on reload) |
| `__ash_liq_batches` | Ashfall active liq batch snapshots |
| `__permafrost_winter_v1` | Permafrost profile: events, samples, wave history |
| `__ashfall_chaser_v1` | Ashfall profile |
| `__everwinter_scorecard_v1` | Shared slot scorecard written by both plugins, 30-day TTL |
| `__cgCoinList` | CoinGecko coin list cache (24-hour TTL) |
| `__ew_creds` | EverWinter live plugin API credentials |
| `__sc_creds` | SunChaser live plugin API credentials |

### Cross-Tab Data Pool

Both bots share market data via `localStorage.__ew_shared_v1` and `BroadcastChannel('ew_shared')`. Writes are last-write-wins per data type. Either bot operates normally solo — the registry is simply absent and all ladder checks fall through to normal fetches.

### Plugin Transform Pipeline

```
pw()  →  plugin[0].transform(def)  →  plugin[1].transform(def)  →  ...  →  Alpine
```

Each plugin's `transform(def)` receives and returns the component definition. Load order matters for method wrapping — strategy plugins must declare `after: ['everwinter']` / `after: ['sunchaser']` so live-trading plugin wraps are innermost.

### Bybit API Endpoints Used

**Public**: `GET /v5/market/tickers`, `GET /v5/market/kline`, `GET /v5/market/instruments-info`. **WebSocket**: `wss://stream.bybit.com/v5/public/linear` (liquidation feed). **Signed (live plugins only)**: `GET /v5/account/wallet-balance`, `GET /v5/position/list`, `POST /v5/order/create`, `POST /v5/position/trading-stop`, `POST /v5/order/cancel`. Signing: HMAC-SHA-256 via `crypto.subtle.sign`; 250ms minimum gap between signed requests.
