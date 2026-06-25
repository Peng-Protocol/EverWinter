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
| **Position Price Feed** (`restPollEnabled`) | When on, replaces the WebSocket price stream for open positions with periodic REST API calls. Use if the WS feed returns stale or incorrect prices. Off by default. |
| **Price Poll Interval** (`restPollBaseSec`) | Base polling interval in seconds for REST mode. The interval doubles automatically when price moves less than 0.1% between ticks and resets to base on any meaningful move. |
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
| `fund>N` | Funding rate at or above tier N (longs paying shorts). `fund>1` at 0.25% step requires FR ≥ 0.25%. Carry income for the short side. |
| `fund<-N` | Funding rate at or below tier −N (shorts paying longs). `fund<-1` requires FR ≤ −0.25%. Carry income for the long side. |
| `+24h` | Ticker is up on the day. |
| `-24h` | Ticker is down on the day. |
| `vm>N` | 24h turnover/market cap ratio at or above tier N. `vm>10` at 1% step requires V/M ≥ 10% — a significant fraction of the coin's total value changed hands in a day. |
| `vm<N` | V/M ratio below tier N — the coin moved but volume didn't follow. Fade case: momentum without conviction. |
| `lsa>N` | Last completed 1h candle closed down with volume ≥ N% above the 24h hourly average. Sell-side pressure with participation. |
| `lba>N` | Last completed 1h candle closed up with volume ≥ N% above average. Buy-side pressure with participation. |
| `rasl>N` | Last completed 1h candle closed red with volume ≥ N% *below* average. Quiet, uncontested selling. |
| `rabl>N` | Last completed 1h candle closed green with volume ≥ N% below average. Quiet, uncontested buying. |
| `iot>N` / `iot<N` | OI vs Turnover ratio at tier N (1% step by default). High OI relative to turnover signals conviction or stickiness — the market is holding open positions rather than trading them away. |
| `iom>N` / `iom<N` | OI vs Market Cap ratio at tier N (1% step by default). High OI relative to mcap signals leverage concentration — a large share of the coin's float is leveraged open interest. |
| `sliq` / `sliq>N` / `sliq<N` | Short liquidations dominated the latest liq cycle with ≥70% of total liq turnover (bullish flow). Optional depth suffix gates by intensity. Requires Permafrost/Ashfall with liquidation surveillance on. |
| `bliq` / `bliq>N` / `bliq<N` | Long liquidations dominated the latest liq cycle with ≥70% of total liq turnover (bearish flow). Same depth gate mechanism as sliq. |
| `msliq` / `msliq>N` / `msliq<N` | Sell-liq majority but buy-liq ≥30% — a contested cycle with a sell lean. Passes when the cycle is mixed but not one-sided. Same depth gate as sliq. |
| `mbliq` / `mbliq>N` / `mbliq<N` | Buy-liq majority but sell-liq ≥30% — a contested cycle with a buy lean. Same depth gate as bliq. |

**Tier gate**: all tiered criteria (`fund`, `vm`, `lsa`, `lba`, `rasl`, `rabl`, `iot`, `iom`) compute an integer tier as `floor(value / step)` and compare it against N. Step sizes are configurable per criterion under **Tier Step Sizes** in the Entry Zone. The same tier is recorded on the position and used as the scorecard key — `lsa>25` and `lsa+37` are different tiers and scored separately.

**Depth gate** (sliq/bliq/msliq/mbliq): `sliq>N` requires `sDepth ≥ N`; `sliq<N` requires `sDepth ≤ N`. `sDepth` is an integer score where 0 = average hourly liq volume for that ticker, positive = above, negative = below. Without a suffix the depth gate is skipped. msliq and mbliq use the same depth value as sliq and bliq respectively.

### Config

| Setting | What it does |
|---|---|
| **Enabled** (`miwEnabled`/`micEnabled`) | Master on/off. When off, the plugin opens no entries and runs no exits. |
| **Picks** (`miwPicks`/`micPicks`) | Max new entries per scan cycle (1–10). |
| **Share Cap** (`miwShareCapEnabled`/`micShareCapEnabled`) | Limits plugin entries to a percentage of `maxPos`. Prevents MIW/MIC from filling all position slots. |
| **Share Cap %** (`miwShareCapPct`/`micShareCapPct`) | The cap percentage. At 50% with maxPos=6, MIW/MIC can hold at most 3 positions. |
| **Kline Scan Cap** (`miwKlineScanCap`/`micKlineScanCap`) | Max tickers sampled per cycle for kline-based criteria (lsa/lba/rasl/rabl) fetches. Higher = broader coverage, more API calls. |
| **V/M Scan Cap** (`miwMcapScanCap`/`micMcapScanCap`) | Max tickers for which CoinGecko market cap is fetched per scan cycle. Tickers are pre-screened by fund rate and 24h direction before the cap is applied, so only genuine candidates count against it. Bounding this keeps the CG request small and prevents failed fetches from leaving stale market cap data in the pool. Default 50. |
| **Fresh V/M Only** (`miwRequireMcapData`/`micRequireMcapData`) | When on, `vm` and `iom` criteria only pass for tickers whose market cap was retrieved from CoinGecko within the freshness window this cycle. Prevents stale or bad cached market cap data from producing unrealistically high V/M values. Off by default. |
| **V/M Freshness** (`miwMcapFreshCycles`/`micMcapFreshCycles`) | How many scan cycles old a CoinGecko mcap fetch can be before it is treated as stale for Fresh V/M Only. Default 6. Only visible when Fresh V/M Only is on. |
| **Fund Step** (`miwFundStep`/`micFundStep`) | Tier step size for `fund` criteria in % of funding rate. Default 0.25 — one tier per 0.25% FR. At this step, `fund>1` requires FR ≥ 0.25%. |
| **V/M Step** (`miwVmStep`/`micVmStep`) | Tier step size for `vm` criteria in % of volume/market cap ratio. Default 1. `vm>10` at step 1 requires V/M ≥ 10%. |
| **Spike Step** (`miwSpikeStep`/`micSpikeStep`) | Tier step size for `lsa`, `lba`, `rasl`, and `rabl` in % above or below the 24h hourly average. Default 1. `lsa>25` at step 1 requires volume ≥ 25% above average. |
| **IO/T Step** (`miwIotStep`/`micIotStep`) | Tier step size for `iot` criteria in % of OI/turnover ratio. Default 1. |
| **IO/M Step** (`miwIomStep`/`micIomStep`) | Tier step size for `iom` criteria in % of OI/market cap ratio. Default 1. |
| **Cascade** (`miwCascadeEnabled`/`micCascadeEnabled`) | Closes all MIW/MIC positions when their collective unrealized profit hits a threshold. Banks a group move before it reverses. |
| **Cascade %** (`miwCascadePct`/`micCascadePct`) | Collective uPnL trigger as a % of average entry margin. |
| **Sacrifice** (`miwSacrificeEnabled`/`micSacrificeEnabled`) | Closes MIW/MIC positions when their collective unrealized loss hits a threshold. Caps group drawdown. |
| **Sacrifice %** (`miwSacrificePct`/`micSacrificePct`) | Collective uLoss trigger as a % of average entry margin. |
| **Rolling Sacrifice** (`miwRollingSacrificeEnabled`/`micRollingSacrificeEnabled`) | When on, Sacrifice closes only the oldest MIW/MIC position at a time instead of all at once. |
| **Fade Away** (`miwFadeEnabled`/`micFadeEnabled`) | Master toggle. Runs every scan; if any MIW/MIC position is in loss ≥ Loss Trigger, also fires between scans. Evaluates enabled signals as a combined adverse score — when combined score ≥ Combined Threshold, closes the oldest position. |
| **Loss Trigger** (`miwFadeAwayLossPct`/`micFadeAwayLossPct`) | Loss threshold as a % of base margin (minNotional ÷ leverage). When any position crosses this, the combined fade check fires immediately outside the scan cycle. Default 25%. |
| **Structure Signal** (`miwFadeStructureEnabled`/`micFadeStructureEnabled`) | Includes 1h kline momentum in the combined score. Adverse contribution = % of sampled candles moving against the position direction. |
| **Liq Signal** (`miwFadeLiqEnabled`/`micFadeLiqEnabled`) | Includes liquidation flow in the combined score, gated by scorecard history. Adverse contribution = B-Liq% of the last cycle (for shorts). Only contributes when the Permafrost/Ashfall scorecard shows the signal has historically lost. |
| **Funding Signal** (`miwFadeFundEnabled`/`micFadeFundEnabled`) | Includes funding rate direction in the combined score, gated by scorecard history the same way as Liq Signal. Adverse contribution = % of tickers in the kline + liq sample with adverse funding. |
| **Combined Threshold** (`miwFadeThreshold`/`micFadeThreshold`) | % the combined adverse score must reach to trigger a close. Combined score = average of all enabled signal contributions. Default 50%. |
| **Block Entries on Adverse Score** (`miwFadeBlockEntries`/`micFadeBlockEntries`) | Also blocks new MIW/MIC entries while the combined adverse score is at or above the threshold. Lifts each scan cycle when conditions clear. |
| **Liq Result Max Age** (`miwLiqResultMaxCycles`/`micLiqResultMaxCycles`) | How many scan cycles a liq result stays valid for sliq/bliq/msliq/mbliq slot criteria. Results older than this are treated as absent. Default 2. |
| **Auto Slots** (`miwAutoSlots`/`micAutoSlots`) | Replaces the manual slot list with every possible combination of the available criteria at the chosen size. |
| **Auto Slot Size** (`miwAutoSlotSize`/`micAutoSlotSize`) | How many criteria per auto-generated combination (1–4). |
| **Exclude from Auto** (`miwAutoSlotExclude`/`micAutoSlotExclude`) | Criteria omitted from auto-generated combinations and from scorecard scoring. |
| **Historical Scoring** (`miwHistScoringEnabled`/`micHistScoringEnabled`) | When on, tickers that match a slot during a scan are tracked past that cycle. The bot waits for the next full 1h candle to close, then simulates whether that entry would have hit TP or SL — and writes the result to the shared scorecard as a historical record tagged separately from live trades. Historical records supplement live closed-trade data, building slot history without requiring an actual open position. This also means data collection continues even when actual entries are blocked by Fade Away, Fund Rate Fade, or any other close/block mechanism — the scorecard keeps learning from slot matches regardless of whether a real trade opened. When a batch of pending matches is ready to resolve, the activity log emits a numbered begin message (entry and symbol count) and a completion message (entries written) — e.g. `📊 Hist-score batch #3 begun — 12 entries across 8 symbols`. Multiple batches can run in sequence within a session and are identified by their batch number (1–99, then wraps). **Current limitation**: a match is only logged when the ticker's kline data happens to be fetched in the same scan where the slot match occurs. Because kline fetches are capped and randomly sampled, the overlap between a live slot match and an available kline is infrequent. Hit rate is low and will be improved in a future update. |
| **Hist Tolerance** (`miwHistToleranceMins`/`micHistToleranceMins`) | Minimum minutes before the next hour boundary for a slot match to target that candle. If the boundary is within this window the match targets the following hour instead, ensuring the candle has enough time to fully form before observation. Default 20. |
| **Hist Sequester %** (`miwHistSequestrPct`/`micHistSequestrPct`) | Share of the kline scan cap reserved each cycle for confirming pending hist targets. At 50% with Kline Scan Cap 50, up to 25 slots go to confirmation and 25 to discovery. Unused sequester slots roll over to discovery automatically. Default 50%. |

**Fade Away as a drawdown gate replacement**: The consolidated Fade Away system — structure, liq, and funding signals averaged into a single score — can collectively replace drawdown locking for many setups. The combined score reacts to live market conditions and closes the oldest position before losses compound; with Block Entries enabled, it also prevents new entries until the environment clears. Liq and Funding signals are gated by scorecard history and won't contribute unless the signal has a track record of bad outcomes in your specific slots, making them a partial substitute for scorecard auto-block. The Loss Trigger enables between-scan checks, so a losing position can be exited before the next scheduled scan without waiting.

### Slots UI

**Manual mode**: click a slot to select it, then toggle criteria on/off in the picker row below. ✕ deletes the slot; `+` adds a new empty one.

**Auto mode**: the manual builder is replaced by a size picker and an exclusion chip row. The combo count shown reflects how many slots are active after exclusions and blocks. Note that many generated combinations are contradictory and will never match any ticker — a slot containing both `+24h` and `-24h` can never be satisfied simultaneously, nor can any two from the candle group (`lsa`, `lba`, `rasl`, `rabl`), since a candle can only close in one direction with one volume character at a time. At size 2 these pairs are common, so the effective slot count is lower than the number shown. Excluding one side of each pair removes the dead combinations. Additionally, `lsa`/`lba`/`rasl`/`rabl` almost never co-qualify with `vm` criteria in the same slot: `vm` criteria apply only to the top 30 tickers by turnover, while kline criteria apply to a random sample drawn from the full pool — the overlap between those two subsets is small in practice.

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
| **Sponge Quota** (`pfSpongeQuota`/`afSpongeQuota`) | How many recent closes per slot are used to compute scores. Older records beyond this count are ignored. Lower = faster adaptation to recent performance; higher = more stable scores that smooth out short streaks. Default 30. |
| **Include Historical Scores** (`pfHistScoringEnabled`/`afHistScoringEnabled`) | When on, historical scoring records (written by the MIW/MIC Historical Scoring feature, tagged `hist: true`) are included in slot score calculations and block decisions. When off, only live closed-trade records count. On by default. Note: this toggle is independent of the MIW/MIC **Historical Scoring** toggle. Turning off Historical Scoring in MIW/MIC only stops new entries from being generated — existing historical records remain in the scorecard until this toggle is turned off or the sponge quota pushes them out. Turning this off while records exist immediately reduces slot scores to the real-trade-only baseline; slots with no real-trade records disappear from the scorecard entirely until live trades accumulate. |
| **Auto Block** (`permafrostAutoBlock`/`ashfallAutoBlock`) | Master gate for per-slot blocking based on scorecard data. When off, no blocking conditions run regardless of sub-toggle settings. Enable one or both conditions below to activate blocking. |
| **Threshold Block** (`pfThresholdBlock`/`afThresholdBlock`) | Blocks a slot when own gross losses OR partner gross wins independently exceed the Block Threshold. Wins never offset losses — a slot that loses $1 and wins $0.90 is still blocked by the loss side alone. On by default. |
| **Combined PnL Block** (`pfCombinedBlock`/`afCombinedBlock`) | Blocks a slot when its net PnL falls below negative Block Threshold. Unlike Threshold Block, wins offset losses here — only genuinely net-losing slots are blocked. Off by default. |
| **Block Threshold** (`permafrostSlotLossThreshold`/`ashfallSlotLossThreshold`) | Loss threshold (as a fraction of entry margin) used by the active blocking conditions. For Threshold Block, applied independently to own-side gross losses and partner-side gross wins. For Combined PnL Block, applied to the net total. Raising Min Notional raises the dollar threshold proportionally, which can naturally unblock slots without clearing the scorecard. |
| **Cross Broadcast** (`permafrostCrossEnabled`/`ashfallCrossEnabled`) | Writes cascade/sacrifice closes and drawdown halt/gains-lock transitions to a shared log that the partner bot can read. Required for Mutual DDH Lift. |
| **Mutual DDH Lift** (`permafrostMutualDdLiftEnabled`/`ashfallMutualDdLiftEnabled`) | When both bots are simultaneously in drawdown halt, lifts this bot's halt. Checked every 15 s. Requires Cross Broadcast to be on. |
| **Stale Slot Purge** (`pfStaleSlotDays`/`afStaleSlotDays`) | Slots with no new close in this many days are fully removed from the scorecard on the next trim. Keeps the scorecard clean when criteria combinations fall out of use. Default 7, configurable 1–90 days. |
| **Collapsed Ranks** (`pfCollapsedRanks`/`afCollapsedRanks`) | Switches the scorecard chip row from per-slot to per-criterion view — tiers are stripped and PnL pools across every slot that contained each criterion. Also controls slot ordering in MIW/MIC: in Collapsed mode, slots are ranked by the sum of their constituent criteria scores rather than per-slot history, so entries are attempted through the highest-scoring combination first. Useful when Auto Slots generates too many distinct combinations for per-slot records to carry statistical weight. |
| **Collapsed Scoring** (`pfCollapsedBlockEnabled`/`afCollapsedBlockEnabled`) | Enables pre-computed entry blocking using collapsed criterion PnL scaled by tier depth. After each scorecard rebuild, every possible annotated slot key (criteria combinations with tier suffixes) is scored; those whose aggregate falls below the threshold are marked blocked and tickers matching them are graylisted. Note: the Collapsed Ranks (Tiered/Collapsed) scorecard toggle governs slot ordering — Collapsed Scoring and Collapsed Ranks together form the full collapsed entry management system. |
| **Collapsed Threshold** (`pfCollapsedBlockThreshold`/`afCollapsedBlockThreshold`) | Loss floor for the collapsed scoring gate, expressed as a fraction of entry margin. Default 0.25 — at Min Notional 6 and Leverage 6, the effective floor is $0.25. Raising Min Notional or Leverage raises the dollar floor proportionally. |
| **Scale Factor** (`pfCollapsedBlockScaleFactor`/`afCollapsedBlockScaleFactor`) | Per-tier multiplier applied to each criterion's collapsed PnL. At the default 0.01, a criterion with tier 5 has its score scaled by 1.05. Higher values amplify the effect of deep-tier signals in both directions. |
| **Tier Cap** (`pfCollapsedBlockTierCap`/`afCollapsedBlockTierCap`) | Maximum tier depth used in the scale factor calculation. Prevents extreme tier values from dominating the score. Default 50. |
| **Apply to Manual Slots** (`pfCollapsedBlockManual`/`afCollapsedBlockManual`) | Extends collapsed scoring and block evaluation to manually-defined MIW/MIC slots in addition to auto-generated ones. |
| **Live Collapsed Gate** (`pfLiveCollapsedBlock`/`afLiveCollapsedBlock`) | At each scan, scores every qualifying ticker in real time using that ticker's actual live criterion depths against the collapsed PnL ranks. Unlike pre-computed Collapsed Scoring (which operates on pre-built slot keys), this gate is computed per ticker per scan — a ticker that hits a deeply losing criterion tier receives a larger penalty than one that only barely qualifies, and is graylisted if the aggregate score falls below the threshold. Uses the same threshold, scale factor, and tier cap as Collapsed Scoring. |
| **Liquidation Surveillance** (`pfLiqEnabled`/`ashLiqEnabled`) | Opens WebSocket connections to track live liquidation flow across a rolling sample of volatile tickers. Required for `sliq`/`bliq` criteria in MIW/MIC. |
| **Liq Batch Size** (`pfLiqBatchSize`/`ashLiqBatchSize`) | Tickers per liquidation batch (5–50). More tickers = broader market coverage per cycle. |
| **Liq Threshold %** (`pfLiqThresholdPct`/`ashLiqThresholdPct`) | Minimum share of a cycle's total liquidation turnover one side must hold to qualify (10–90%). At 50%, one side must account for at least half. |

### Status Block

Shows the current climate reading (magnitude, breadth, slope, IO score, effective score, evidence mass), active halt state (profile-governed or fallback timer), and PLK countdown. The **wave graph** plots recent market structure — direction label (rising/falling/steady) reflects the recent path of the market.

Three directional bar charts below the climate reading show relative dominance at a glance. Red extends left (adverse for this bot's direction), green extends right (favorable), with current values as a label:

| Bar | What it shows |
|---|---|
| **1h Kline** | Bear vs. bull aggregate from the last completed 1h candle sample. |
| **Funding Rate** | Neg vs. pos funding skew across the kline + liq ticker union. |
| **Liquidation Flow** | B-Liq vs. S-Liq share of the last completed liq cycle. Only appears when Liquidation Surveillance is on and at least one cycle has closed. |

### Slot Scorecard

Chip row showing each criteria combination with its net PnL in bold and win/loss count. Each close writes one record; the Sponge Quota controls how many recent records per slot are factored in, so scores always reflect the most recent N closes. Blocked slots render in purple. Three buttons at the bottom right control the view:

The **Tiered / Collapsed** toggle switches the chip row between per-slot and per-criterion views. In Collapsed mode, one chip appears per base criterion (e.g. `fund>`, `vm>`, `+24h`) with PnL pooled across all slots that contained it. This also changes how MIW/MIC orders its entry queue — slots are ranked by the sum of their individual criteria scores rather than the slot's own record. Scores are additive: a slot with one losing criterion and one winning criterion ranks by their combined total. **Win/loss counts in Collapsed mode can appear unexpectedly high** — this is normal. Because a criterion may appear in several different slots, every close from every slot containing it contributes to the count. A criterion shared by five slots will accumulate five times the records of a single-slot criterion. The counts are not capped per slot in this view.

Collapsed criterion scores feed into two additional blocking mechanisms when **Collapsed Scoring** is enabled. The first is pre-computed: after each scorecard rebuild, every annotated slot key (criteria with tier suffixes, e.g. `fund+3,vm+15`) is scored by multiplying each criterion's collapsed PnL by a tier-depth scale factor, then summing. Keys whose total falls below the threshold are marked blocked — tickers matching that exact key at scan time are graylisted. The second is the **Live Collapsed Gate**: at each scan, every qualifying ticker is scored individually using its actual live criterion depths. A ticker showing a deeper tier on a historically losing criterion receives a larger penalty than one that only barely qualifies, and is graylisted if the ticker-specific aggregate falls below the threshold. Both gates use the same threshold, scale factor, and tier cap configured in the Collapsed Scoring section.

The **Both / Hist / Traded** source filter cycles through which score records are included in the displayed chips. **Both** (default) shows all records. **Hist** shows only records written by the MIW/MIC Historical Scoring feature. **Traded** shows only records from actual live closed trades. This is a display-only filter — it does not affect which records count toward auto-block decisions or collapsed scoring.

The **Combined / Own** toggle switches between: Combined (includes partner bot trades, PnL inverted) sorted by blended total; and Own (this bot's trades only).

**Clicking a chip** reveals the gross figure that drives the block decision — in Combined mode this shows the raw partner win total; in Own mode it shows the raw own loss total. Clicking again or switching sort mode returns to the normal view. Auto-block decisions always use the full split data regardless of which view is active.

**CLEAR** wipes all records and resets all auto-blocks.

### Slot Blocking

Three independent paths can block a ticker from entering through a slot. They operate at different points in time and have different reset conditions.

| Path | When evaluated | What triggers it | Result | Resets |
|---|---|---|---|---|
| **Auto Block** | Each scorecard close | **Threshold Block**: own gross losses OR partner gross wins independently exceed the Block Threshold. **Combined PnL Block**: net slot PnL falls below negative Block Threshold. Either active condition can trigger; both can be enabled simultaneously. | Slot combination marked blocked (purple chip in scorecard); no ticker enters through it | Automatically when scores recover; or CLEAR |
| **Collapsed Scoring** | Each scorecard rebuild | Annotated slot key (criteria + tier suffixes) aggregate score — collapsed PnL × tier-depth scale factor — falls below Collapsed Threshold | Slot key graylisted for the blocked-slot cooldown; tickers matching that exact key at scan time are skipped | Next rebuild if the score recovers above threshold |
| **Live Collapsed Gate** | Per ticker, per scan | Same scoring formula as Collapsed Scoring but computed using the ticker's actual live criterion depths at the moment of the scan | Ticker graylisted for the blocked-slot cooldown | Cooldown expiry or page reload |

Auto Block is the coarsest gate — it operates on the base slot combination with no tier awareness. Collapsed Scoring is finer — the same base slot can be blocked at some tier depths and not others. The Live Collapsed Gate is the finest — a ticker's individual depth profile determines whether it passes, even if its slot key was not pre-blocked.

See the config table above for threshold, scale factor, tier cap, and cooldown parameters.

**Important**: many sub-toggles (Collapsed Scoring, Live Collapsed Gate, and their parameters) are nested inside higher-level toggles (Auto Block, Collapsed Scoring) in the UI and are hidden when the parent is off. A sub-toggle can remain on even while its parent panel is collapsed. Before assuming a blocking mechanism is inactive, expand all parent toggles and verify the sub-toggles directly.

**Graylist panel**: tickers graylisted by Collapsed Scoring or the Live Collapsed Gate appear in a list injected into the **Stats menu** by the MIW/MIC plugin. Entries are grouped by the scan timestamp when they were graylisted — each group shows the cohort time and all tickers blocked in that cycle. A single ✕ button on the group header clears all tickers in that cohort at once. The panel is only visible when **Auto Block** is on — if Auto Block is off but Live Collapsed Gate is on, graylisting still occurs silently with no panel shown and no way to clear entries short of reloading the page. The graylist is in-memory only: reloading the page clears all entries immediately. Disabling the Live Collapsed Gate toggle does not clear existing graylist entries — tickers already graylisted remain blocked until their cooldown expires or the page is reloaded.

**Hist Scoring panel**: when Historical Scoring is enabled, the **Stats menu** also shows a Hist Scoring section with the current count of pending simulation targets, a countdown to the next expected batch (shows "next scan" once the window has elapsed), and a list of completed scoring batches (newest first). Each batch entry shows the batch number, wrote/total counts, win count (W), loss count (L), net simulated PnL, and the clock time the batch completed (same-day batches show HH:MM; older ones show month, day, and time).

### Liquidation Feed

When surveillance is on: the **Feed Watcher** panel shows active batches (batch ID, ticker count, running S-Liq / B-Liq USDT totals, dominant side, countdown). The **Liq Sample chart** shows the last 10 closed cycles as stacked bars (S-Liq green / B-Liq red, qualifying segments at full opacity). The **Latest Cycle** chip grid shows per-ticker qualification with 🥵/🥶 badges.

### Danger Zone

**Clear Plugin State** removes all profile data and halt state from localStorage and memory. Use before uninstalling the plugin to avoid orphaned data, or to guarantee a fully clean slate. Irreversible.

---

## Randomized Outcomes

Multiple instances of the bot running simultaneously will naturally diverge in behavior. Scan timing drifts independently per tab, so two instances launched minutes apart will hit different market states even with identical config. On top of that, several data inputs are drawn randomly each cycle: the sample of tickers used to compute market breadth (red/green candle tally), the batch of tickers watched for live liquidation flow, and the kline lookups used for spike criteria all pull from different random subsets each time. Market cap data also varies by fetch timing as the CoinGecko → CoinPaprika → DexScreener waterfall resolves at different points.

The practical effect is that no two instances share the same entry triggers, exit timing, or structural reading at any given moment — even when configured identically. This is intentional. Instances that move in lockstep are easier to front-run and more likely to cluster losses at the same market event. Divergence distributes risk across slightly different entry points and market reads without requiring any coordination between instances.

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
| `__everwinter_scorecard_v1` | Shared slot scorecard written by both plugins. Each close is one record; each slot retains up to the Sponge Quota most recent records. |
| `__miw_hist_batches` | MIW Historical Scoring batch history. Object containing `batches` (up to 25 completed records — each with batch ID, timestamp, entries written, total candidates, win count, loss count, and net simulated PnL) and `fundSkew` (last funding sample bar state). |
| `__mic_hist_batches` | MIC Historical Scoring batch history. Same structure as `__miw_hist_batches`. |
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
