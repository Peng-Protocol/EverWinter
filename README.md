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
| `plugins/strategies/BlindEntry-Winter.html` | Control-group entry plugin for PseudoWinter (no criteria, threshold only) |
| `plugins/strategies/BlindEntry-Chaser.html` | Control-group entry plugin for PseudoChaser (no criteria, threshold only) |
| `plugins/strategies/LiquidDiver-Winter.html` | Reactive liquidation-only entry plugin for PseudoWinter |
| `plugins/strategies/LiquidDiver-Chaser.html` | Reactive liquidation-only entry plugin for PseudoChaser |
| `plugins/analytics/Permafrost-Winter.html` | Market climate plugin for PseudoWinter |
| `plugins/analytics/Ashfall-Chaser.html` | Market climate plugin for PseudoChaser |

---

## Setup

Open any `.html` file directly in a browser. No build step, no server, no installation. Alpine.js and Bootstrap 5 are loaded from CDN — an internet connection is required on first load (cached after that).

**Running both bots**: open PseudoWinter and PseudoChaser in separate tabs from the same origin. When both are open simultaneously they automatically share bulk ticker fetches, kline caches, and liquidation results to halve API load. Either bot works normally on its own when the other tab isn't open.

In addition to the shared data pool, the Permafrost and Ashfall plugins maintain a separate cross-bot sample state (`__ew_sample_state_v1`) written after each structure cycle and read every 15 seconds. This state carries wave score, funding skew, OI skew, kline bar data, and liquidation cycle history. When one bot is in a drawdown halt or gains lock, its plugin reads the partner's sample to keep the Status Block bars, liq chart, and WAVE score line current — the halted bot's displays stay populated from the running partner's latest readings without opening any new entries.

---

## Plugins

To load a plugin, open the **Plugin Manager** panel, click **Load Plugin**, and select the `.html` file. **A page reload is required after loading or removing any plugin** — the plugin pipeline runs once at page boot, so changes don't take effect until the next load.

Load order matters: live trading plugins (EverWinter, SunChaser) must load before strategy plugins (MultiIndicator, Blind-Entry, Liquid-Diver, Permafrost/Ashfall). The Plugin Manager shows the current load order and warns about conflicts.

MultiIndicator and Blind-Entry are alternatives, not companions — load one or the other per bot unless intentionally running both to compare (see the Blind-Entry Plugin section). Liquid-Diver cannot load on the same bot as MultiIndicator at all — the Plugin Manager blocks it (see the Liquid-Diver Plugin section for why).

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
| **Drawdown Throttle** (`drawdownThrottleEnabled`) | Halts new entries for 12 hours when rolling 6h realized PnL drops below a loss threshold. |
| **Drawdown Factor** (`drawdownThrottleFactor`) | Loss threshold as a multiple of entry margin. At 0.5× with $1 margin, $0.50 of rolling losses triggers the halt. |
| **Gains Lock** (`gainsLockEnabled`) | Halts new entries for 12 hours once rolling 6h profit hits a target. Banks a winning streak before it reverses. |
| **Gains Factor** (`gainsLockFactor`) | Profit target as a multiple of entry margin. Same scale as Drawdown Factor. |
| **Manual Halt** | Button (Halt tab) that blocks all new position entry indefinitely until manually lifted. Independent of Drawdown Throttle and Gains Lock — overrides both and doesn't stack with either. |
| **EDa / Laggard Check** (`laggardCheckEnabled`) | Enables the Effective Debt Adjusted system. Realized losses are passed forward to surviving positions, which take higher TP targets to recover the debt. **Requires the EDa-Winter / EDa-Chaser plugin** (`plugins/modes/`). |
| **TP Buffer** (`laggardProfitOffset`) | Extra TP headroom reserved above the functional target (%). The debt-free close happens at `tpPct ÷ (1 + buffer/100)` — at 50% buffer with an 18% TP slider, trades close at 12% without debt. Requires the EDa plugin. |
| **Ticker Cooldown** (`bulkTickerCooldownHours`) | How long the bot reuses a cached bulk ticker fetch before hitting the API again. Higher = fewer API calls per day. |
| **Whiplash Audit** (`whiplashEnabled`) | When on, the position watcher fetches 1-minute klines near TP to confirm whether price spiked through TP between watcher cycles. |
| **Whiplash Proximity** (`whiplashProximityPct`) | How close (%) to TP price triggers the kline audit. |
| **Runtime Limit** (`runtimeHours`) | Maximum position age. Forces a close at the deadline if TP hasn't been hit. |
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
| **Persistence** | "Active" is the live in-memory position count; "Stored" is what's confirmed saved to localStorage. These should always match. A mismatch (shown in red with a warning banner) means a save failed or was overwritten — the bot retries automatically every 5s. If it doesn't clear, check the activity log for `[PST]`/`[PERSIST]` entries, and close any duplicate tabs of the same bot — a second tab can overwrite the first tab's saves with its own stale position count. The **Storage usage** dropdown below it breaks localStorage down to one row per data type — e.g. Permafrost's structure wave, volume history, OI/MC history, liquidation samples, and OC samples are each their own row rather than one lumped "Permafrost" figure, so a bloated data type is visible on its own. Any row over 200KB is shown in red. An **Export** link appears next to it once expanded, downloading the same breakdown as a plain-text file — useful for sharing the numbers outside the app. Below that, a **Power usage** dropdown shows a rolling average and peak of how many milliseconds the app spends reacting each second — a rising figure usually means a plugin panel left open somewhere is doing more work than it needs to; closing analytics panels you're not actively watching brings it back down. |

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

Common prefixes: `[MHL]` manual halt · `[DWN]` drawdown throttle · `[GLK]` gains lock · `[PST]` (PseudoWinter) / `[PERSIST]` (PseudoChaser) save failures or recovered positions · `[PFR]`/`[ASH]` climate plugin events · `[MIW]`/`[MIC]` multi-indicator events.

The log is capped at 300 entries in memory and in localStorage. Oldest entries are dropped when the cap is exceeded.

---

## Trades Menu

The trades panel shows a card for each closed trade, newest first. Each card carries a close-reason badge — **TP**, **SL**, **FORCE** (runtime limit), **BAIL** (drawdown throttle bail, Winter only), **EDa** (laggard debt-free close), or **Sub** (closed to free a slot for a higher-ranked candidate via MIW/MIC Substitution). Reasons introduced by other plugins show their own registered label, or the raw reason name if a plugin hasn't registered one.

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
| `0liq` | No liquidation at all on this ticker in the latest liq cycle — the mirror case to sliq/bliq/msliq/mbliq. No depth suffix (there's no magnitude to a zero). Requires Permafrost/Ashfall with liquidation surveillance on. |
| `ocs>N` / `ocs<N` | Buy/sell fill skew from Order Count Surveillance, tiered at N buy-share percent (0–100 scale, 1% step by default). Computed directly from the sampled order batch — no minimum runway required. Requires Permafrost/Ashfall OC Surveillance. |
| `ocx>N` / `ocx<N` | Average seconds between orders in the sampled batch, tiered at N (0.1s step by default, so N is in tenths of a second — e.g. N=30 ≈ 3s average gap). `ocx<N` requires a busier gap (lower tier); `ocx>N` requires a quieter one (higher tier). The slot builder shows the real-seconds equivalent alongside the tier value. Requires Permafrost/Ashfall OC Surveillance. |

**Tier gate**: all tiered criteria (`fund`, `vm`, `lsa`, `lba`, `rasl`, `rabl`, `iot`, `iom`, `ocs`, `ocx`) compute an integer tier as `floor(value / step)` and compare it against N. Current step sizes are shown as a read-only info line under **Tier Step Sizes** in the Entry Zone. The same tier is recorded on the position and used as the scorecard key — `lsa>25` and `lsa+37` are different tiers and scored separately.

**OCS/OCX recording**: on entry, `ocs` records signed deviation-from-parity tiers (e.g. `ocs+12` = 62% buy-dominant, `ocs-8` = 42% buy / 58% sell, at the default 1% step) and `ocx` records the average-interval tier directly (e.g. `ocx+18` ≈ 1.8s between fills at the default 0.1s step). Unlike every other criterion, Order Count Surveillance data exists for essentially every ticker at all times — there are always orders flowing — so `ocs`/`ocx` behave like `+24h`/`-24h` in that they are near-universally available rather than conditional on a data source being fresh or a pattern being present.

**Depth gate** (sliq/bliq/msliq/mbliq): `sliq>N` requires `sDepth ≥ N`; `sliq<N` requires `sDepth ≤ N`. `sDepth`/`bDepth` are computed once per closed liq cycle as `trunc(((sideTurnover / historicalAvg) − 1) × 100)` — the liquidated side's turnover this cycle compared to the average liquidation size recorded across *all* history (every ticker, every closed cycle, zero-turnover entries excluded so it isn't diluted by the majority of ticker/cycle combos with no liquidation that side). `+10` means this cycle's liquidation was 10% above the historical average; `-10` means 10% below. There's no upper ceiling; the practical floor is `-100` (zero liquidation that side). Without a suffix the depth gate is skipped. msliq and mbliq use the same depth value as sliq and bliq respectively. Liquid-Diver (below) uses the exact same formula and scale for its own live entry gate — a live reading and a closed-cycle reading mean the same thing. The historical average is recomputed once per closed cycle (not per liquidation message), and a cycle is always judged against the average *as it stood before that cycle* so it never gets compared against a baseline that already includes itself.

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
| **Tier Step Sizes** (`miwFundStep`/`miwVmStep`/`miwSpikeStep`/`miwIotStep`/`miwIomStep`/`miwOcsStep`/`miwOcxStep` and `mic` equivalents) | Read-only info line showing the current tier step size for `fund`, `vm`, `lsa`/`lba`/`rasl`/`rabl` (spike), `iot`, `iom`, `ocs`, and `ocx`. Defaults: Fund 0.25%, OCX 0.1 seconds (order intervals can run into the tens of milliseconds on a busy ticker, so a coarser 1s step would erase most of the useful signal), all others 1%. Not editable from the UI — change via config import if a different step is needed. |
| **Cascade** (`miwCascadeEnabled`/`micCascadeEnabled`) | Closes all MIW/MIC positions when their collective unrealized profit hits a threshold. Banks a group move before it reverses. Checked continuously by the position watcher (every 5s while the bot is running), not just once per scan, so a threshold crossed and reversed between scans is still caught. |
| **Cascade %** (`miwCascadePct`/`micCascadePct`) | Collective uPnL trigger as a % of base margin (minNotional ÷ leverage). |
| **Sacrifice** (`miwSacrificeEnabled`/`micSacrificeEnabled`) | Closes MIW/MIC positions when their collective unrealized loss hits a threshold. Caps group drawdown. Same continuous position-watcher check as Cascade. |
| **Sacrifice %** (`miwSacrificePct`/`micSacrificePct`) | Collective uLoss trigger as a % of base margin (minNotional ÷ leverage). |
| **Rolling Sacrifice** (`miwRollingSacrificeEnabled`/`micRollingSacrificeEnabled`) | When on, Sacrifice closes only the oldest MIW/MIC position at a time instead of all at once. |
| **Target Halving** (`miwHalvingEnabled`/`micHalvingEnabled`) | Shrinks the Cascade/Sacrifice trigger threshold the longer the oldest MIW/MIC position has been held, based on Halving Interval. This is continuous exponential decay, not a one-time halving — the multiplier keeps halving again every full interval that elapses (×0.5 after 1 interval, ×0.25 after 2, ×0.125 after 3, and so on with no floor), so a group left open for several intervals can trigger on a very small collective profit or loss. Off by default. |
| **Halving Interval** (`miwHalvingHours`/`micHalvingHours`) | Hours per halving step for Target Halving. Default 3. The live hint below this control shows the oldest position's age and the multiplier it would apply on trigger right now. |
| **Substitution** (`miwSubstitutionEnabled`/`micSubstitutionEnabled`) | When no entry slot is free (maxPos or Share Cap reached), closes the worst-ranked held position and opens the best fresh candidate instead — but only if the candidate's collapsed score exceeds the held position's entry-time score by the configured Margin. Off by default. Requires Co-Qualifying Penalty (Permafrost/Ashfall) — without it, every score is 0 and Substitution never fires. |
| **Substitution Margin** (`miwSubstitutionMarginPct`/`micSubstitutionMarginPct`) | How much better the new candidate must score than the worst held position, as a % of base margin (minNotional ÷ leverage), before a swap happens. Default 15%. Prevents swapping on marginal score differences. |
| **Substitution Min Age** (`miwSubstitutionMinAgeMins`/`micSubstitutionMinAgeMins`) | Minimum minutes a position must be held before it becomes eligible to be substituted out. Default 10. |
| **Protect Winners** (`miwSubstitutionProtectWinners`/`micSubstitutionProtectWinners`) | When on, a position currently in profit is never substituted out, regardless of how it ranks. On by default — turn off if temporary winners in your markets tend to reverse quickly and shouldn't be shielded just for being ahead right now. |
| **Liq-Only Entries** (`miwRequireLiqData`/`micRequireLiqData`) | Restricts the entire candidate pool — not just sliq/bliq/msliq/mbliq slots — to tickers with a fresh liquidation surveillance result. On by default. Requires Liquidation Surveillance in Permafrost/Ashfall. Adds ~1h startup delay while the first liq cycle populates. Because Order Count Surveillance samples from this same candidate pool, turning this on also narrows which tickers are eligible for OC sampling, even though OC Surveillance itself has no direct dependency on liq data. |
| **Liq Result Max Age** (`miwLiqResultMaxCycles`/`micLiqResultMaxCycles`) | How many scan cycles a liq result stays valid for sliq/bliq/msliq/mbliq slot criteria. Results older than this are treated as absent. Default 2. |
| **Fresh OC Only** (`miwRequireOcData`/`micRequireOcData`) | Blanket gate: excludes any ticker that did not return Order Count data from *this* scan cycle's sample, regardless of which slot it would match — turning this on can restrict entries to a random subset of the pool (or none at all some cycles) even for slots that don't use `ocs`/`ocx` at all. Off by default. Requires Permafrost/Ashfall OC Surveillance. The OC candidate pool itself is independent of Liq Surveillance unless Liq-Only Entries is also on (see above). |
| **OC Scan Cap** (`miwOcScanCap`/`micOcScanCap`) | Max candidate tickers sampled for Order Count Surveillance per scan cycle. When the candidate pool exceeds this cap, a random subset is drawn — combined with Fresh OC Only, only that subset is eligible to enter at all that cycle. Default 50. |
| **Auto Slots** (`miwAutoSlots`/`micAutoSlots`) | Replaces the manual slot list with every possible combination of the available criteria at the chosen size. |
| **Auto Slot Size** (`miwAutoSlotSize`/`micAutoSlotSize`) | How many criteria per auto-generated combination (1–4). |
| **Exclude from Auto** (`miwAutoSlotExclude`/`micAutoSlotExclude`) | Criteria omitted from auto-generated combinations and from scorecard scoring. |
| **Historical Scoring** (`miwHistScoringEnabled`/`micHistScoringEnabled`) | When on, tickers that match a slot during a scan are tracked past that cycle. The bot waits for the next full 1h candle to close, then simulates whether that entry would have hit TP or SL — and writes the result to the shared scorecard as a historical record tagged separately from live trades. Historical records supplement live closed-trade data, building slot history without requiring an actual open position. Data collection continues regardless of any block or halt mechanism active at the time. Duplicate prevention: the same symbol + slot + target candle combination can only be logged once, so repeated scans during the same candle window do not inflate records. When a batch resolves, the activity log emits a numbered begin message and completion message — e.g. `📊 Hist-score batch #3 begun — 12 entries across 8 symbols`. Batch numbers cycle 1–99. |
| **Hist Tolerance** (`miwHistToleranceMins`/`micHistToleranceMins`) | Minimum minutes before the next hour boundary for a slot match to target that candle. If the boundary is within this window the match targets the following hour instead, ensuring the candle has enough time to fully form before observation. Default 20. |
| **Hist Sequester %** (`miwHistSequestrPct`/`micHistSequestrPct`) | Share of the kline scan cap reserved each cycle for confirming pending hist targets. At 50% with Kline Scan Cap 50, up to 25 slots go to confirmation and 25 to discovery. Unused sequester slots roll over to discovery automatically. Default 50%. |

### Market Cap Fetch

`vm` (V/M ratio) and `iom` (OI/M ratio) criteria require per-ticker market cap data. The fetch uses a three-source fallback chain:

1. **CoinGecko** (primary) — coin ID list cached 24h in `__cgCoinList`; market caps fetched per scan batch up to the V/M Scan Cap.
2. **CoinPaprika** (fallback) — used for any tickers CoinGecko did not return. Fetches circulating supply; market cap is computed as supply × current Bybit price. Coin list cached 24h in `__cpCoinList`.
3. **DexScreener** (final fallback) — used for tickers both CoinGecko and CoinPaprika missed. Pulls mcap directly from DEX pair data.

CoinGecko and CoinPaprika's full coin lists cover the entire market (tens of thousands of coins); only the subset matching Bybit's own linear-perp ticker universe is ever persisted to `__cgCoinList`/`__cpCoinList` — the rest is discarded before caching since it's never looked up.

All three sources share their results cross-tab. A ticker with no data from any source cannot satisfy `vm` or `iom` criteria; enabling Fresh V/M Only forces stale-data tickers to be dropped rather than passed.

### Slots UI

**Manual mode**: click a slot to select it, then toggle criteria on/off in the picker row below. ✕ deletes the slot; `+` adds a new empty one.

**Auto mode**: the manual builder is replaced by a size picker and an exclusion chip row. The combo count shown reflects how many slots are active after exclusions. Note that many generated combinations are contradictory and will never match any ticker — a slot containing both `+24h` and `-24h` can never be satisfied simultaneously, nor can any two from the candle group (`lsa`, `lba`, `rasl`, `rabl`), since a candle can only close in one direction with one volume character at a time. At size 2 these pairs are common, so the effective slot count is lower than the number shown. Excluding one side of each pair removes the dead combinations. Additionally, `lsa`/`lba`/`rasl`/`rabl` almost never co-qualify with `vm` criteria in the same slot: `vm` criteria apply only to the top 30 tickers by turnover, while kline criteria apply to a random sample drawn from the full pool — the overlap between those two subsets is small in practice.

`ocs` and `ocx` are the only criteria backed by data that is essentially always present — there are always fills on a liquid ticker — so unlike liquidation, kline, or market-cap-derived criteria, they don't depend on a spike, gap, or fresh fetch lining up. In practice this makes them behave like `+24h`/`-24h`: nearly every OC-surveilled ticker satisfies some `ocs`/`ocx` tier at any given scan, so they show up in a large share of generated auto-slots and matched positions once Order Count Surveillance is enabled.

---

## Blind-Entry Plugin (BEW / BEC)

A control-group strategy: the only entry gate is 24h price change exceeding a threshold, in either direction — no funding rate, volume ratio, candle pattern, liquidation data, or order-flow data ever decides which ticker gets picked. Its purpose is to measure whether MultiIndicator's criteria-based entry gate actually adds expectancy over its exit machinery (Cascade, Sacrifice, Halving, Share Cap — all shared with MIW/MIC and behave identically) by running the same management tools with entry selection removed. Don't load alongside MultiIndicator on the same bot unless intentionally comparing both — they'll compete for the same position pool via their respective Share Caps.

| Setting | What it does |
|---|---|
| **Enabled** (`bewEnabled`/`becEnabled`) | Master on/off. Off by default. |
| **Change Threshold** (`bewChangePct`/`becChangePct`) | Minimum absolute 24h price change to qualify. Direction doesn't matter, only magnitude. Default 6%. |
| **Candidates per Cycle** (`bewPerCycle`/`becPerCycle`) | Max new entries per scan, randomly sampled from all qualifying tickers — no ranking. Default 12. |
| **Re-entry Cooldown** (`bewReentryCooldownHrs`/`becReentryCooldownHrs`) | Minimum hours after any close (by any strategy) before the same symbol can be re-entered. Default 1h. |
| **Cascade** (`bewCascadeEnabled`/`becCascadeEnabled`) | Closes all Blind-Entry positions when their collective unrealized profit hits a threshold. Checked continuously by the position watcher (every 5s while the bot is running), not just once per scan. |
| **Cascade %** (`bewCascadePct`/`becCascadePct`) | Collective uPnL trigger as a % of base margin (minNotional ÷ leverage). Default 25%. |
| **Sacrifice** (`bewSacrificeEnabled`/`becSacrificeEnabled`) | Closes Blind-Entry positions when their collective unrealized loss hits a threshold. Same continuous position-watcher check as Cascade. |
| **Sacrifice %** (`bewSacrificePct`/`becSacrificePct`) | Collective uLoss trigger as a % of base margin. Default 25%. |
| **Rolling Sacrifice** (`bewRollingSacrificeEnabled`/`becRollingSacrificeEnabled`) | When on, Sacrifice closes only the oldest Blind-Entry position at a time instead of all at once. On by default. |
| **Halving** (`bewHalvingEnabled`/`becHalvingEnabled`) | Shrinks the Cascade/Sacrifice trigger threshold the longer the oldest Blind-Entry position has been held — continuous exponential decay based on Halving Interval, same mechanism as MIW/MIC. |
| **Halving Interval** (`bewHalvingHours`/`becHalvingHours`) | Hours per halving step. Default 0.5. |
| **Share Cap** (`bewShareCapEnabled`/`becShareCapEnabled`) | Limits Blind-Entry to a percentage of `maxPos`, so it doesn't monopolize the book if another strategy plugin is also loaded. |
| **Share Cap %** (`bewShareCapPct`/`becShareCapPct`) | The cap percentage. Default 100%. |
| **OC Scan Cap** (`bewOcScanCap`/`becOcScanCap`) | Max symbols per cycle for the Order Count batch fetch used only for the `+ocs`/`-ocs` tag below — capped separately from Candidates per Cycle since the fetch runs before entries open. Default 20. |

**Position tagging**: every opened position is tagged with three sign-only pairs — `+24h`/`-24h` (ticker direction), `+fund`/`-fund` (funding rate sign, any magnitude), `+ocs`/`-ocs` (buy/sell order-flow majority, no depth threshold). These are recorded, never filtered on — every candidate that clears the Change Threshold gets one of each pair regardless of which side it lands on. They exist purely so Permafrost/Ashfall's Slot Scorecard has something to bucket Blind-Entry's trades by. If Order Count data isn't available for a candidate when it opens (thin liquidity, fetch miss), the position still opens — `+ocs`/`-ocs` is simply omitted from that trade's tags rather than blocking entry. `+24h`/`-24h` share the same Scorecard bucket as MultiIndicator's `+24h`/`-24h` criterion — a shared "was the ticker up or down" signal across whichever strategy produced the trade, not separated per plugin. Requires Permafrost/Ashfall with Order Count Surveillance on for the `+ocs`/`-ocs` tag; the other two tags need no plugin dependency.

Substitution does not apply to Blind-Entry — it has no score to rank a new candidate against a held position, so there's nothing to substitute on.

---

## Liquid-Diver Plugin (LDW / LDC)

A specialized, liquidation-only strategy. Unlike MultiIndicator's `sliq`/`bliq`/`msliq`/`mbliq` gates — which only ever read a finished, hour-old liquidation cycle at the next scan — Liquid-Diver reacts live: it watches Permafrost/Ashfall's liquidation feed directly and opens a position the instant a surveilled ticker's live liquidation depth crosses the threshold, mid-cycle, without waiting for the next scan or the batch's hour-end close. Scanning still matters here only because it's what creates new liquidation surveillance batches to watch — it is not what triggers entry.

**Cannot load on the same bot as MultiIndicator** — the Plugin Manager blocks it both ways. Both plugins would otherwise be interpreting the same liquidation cycles on two different timelines (one scan-gated and stale, one live), and Slot Blocking below needs sole ownership of the sliq/bliq/msliq/mbliq scorecard buckets to mean anything. Requires Permafrost/Ashfall's Liq Surveillance toggle on — without it there are no live batches to react to, and Liquid-Diver logs a warning on load if it's off.

**Depth — read this before setting the threshold.** Liquid-Diver's depth is a live reading of the same formula MultiIndicator's depth gate uses (see above): % this side's liquidated $ deviates from the average liquidation size recorded across all history. `+10` means this liquidation is running 10% above the historical average so far this cycle; negative values mean below average. No upper ceiling; practical floor is `-100` (zero liquidation). A live reading and a closed-cycle reading mean exactly the same thing here. There's no depth reading for 0-liq (see Liquidation Presence below) — a zero has no magnitude to measure.

Config is split into two tabs: **Entry** (Depth Threshold, Liquidation Presence, Slot Blocking, Share Cap, Substitution) and **Exit** (Cascade, Sacrifice, Halving).

| Setting | What it does |
|---|---|
| **Enabled** (`ldwEnabled`/`ldcEnabled`) | Master on/off. Off by default. |
| **Depth Threshold** (`ldwDepthThreshold`/`ldcDepthThreshold`) | Minimum live depth (% vs. historical average, see above) to trigger entry on a ticker *with* liquidation. Default 1 (at least 1% above the average liquidation size). No ceiling — the 70%/30% liquidation-share requirement already filters out noise. |
| **Liquidation Presence** (`ldwLiqPresenceMode`/`ldcLiqPresenceMode`) | Three-way toggle: **Only 1** reacts live to tickers *with* liquidation past the Depth Threshold (default, the original behavior). **Only 0** opens instead on tickers with *zero* liquidation once their surveillance cycle closes — there's no live signal for "nothing happened," so this path checks at cycle-close rather than reacting mid-cycle. **Both** runs each path independently. |
| **Re-entry Block** (`ldwReentryBlockEnabled`/`ldcReentryBlockEnabled`) | Blocks a symbol from re-triggering for one bulk-ticker cooldown window right after its own position closes — the same graylist MultiIndicator reads from, so a close by either plugin blocks the symbol for both. On by default. |
| **Re-entry Block Mode** (`ldwReentryBlockMode`/`ldcReentryBlockMode`) | **Losers Only** lets a symbol that just closed in profit re-trigger immediately, blocking only a symbol that closed at a loss. **Winners + Losers** (default) blocks either outcome until the cooldown clears — unlike MultiIndicator, which always blocks both with no mode choice. |
| **Slot Blocking** (`ldwSlotBlockEnabled`/`ldcSlotBlockEnabled`) | A per-criterion loss circuit breaker covering the triggering liquidation type (sliq/bliq/msliq/mbliq/0liq) *and* the sign-tagged 24h/funding criteria attached to every entry. If any one of those collapsed Scorecard scores is a loss beyond the threshold below, new entries carrying that criterion are blocked — other criteria keep working. Continuously re-checked; a block clears automatically once its score recovers, no manual action needed. OCS is not covered — it's fetched only after a candidate already clears blocking, so it can't gate entry. |
| **Slot Blocking %** (`ldwSlotBlockPct`/`ldcSlotBlockPct`) | Loss magnitude as a % of base margin (minNotional ÷ leverage) that trips the block. Default 25%. |
| **Cascade** (`ldwCascadeEnabled`/`ldcCascadeEnabled`) | Closes all Liquid-Diver positions when their collective unrealized profit hits a threshold. Checked continuously by the position watcher (every 5s while the bot is running) — matching the same live cadence as Liquid-Diver's own entries, rather than waiting on the scan clock. |
| **Cascade %** (`ldwCascadePct`/`ldcCascadePct`) | Collective uPnL trigger as a % of base margin. Default 25%. |
| **Sacrifice** (`ldwSacrificeEnabled`/`ldcSacrificeEnabled`) | Closes Liquid-Diver positions when their collective unrealized loss hits a threshold. Same continuous position-watcher check as Cascade. |
| **Sacrifice %** (`ldwSacrificePct`/`ldcSacrificePct`) | Collective uLoss trigger as a % of base margin. Default 25%. |
| **Rolling Sacrifice** (`ldwRollingSacrificeEnabled`/`ldcRollingSacrificeEnabled`) | When on, Sacrifice closes only the oldest Liquid-Diver position at a time instead of all at once. On by default. |
| **Halving** (`ldwHalvingEnabled`/`ldcHalvingEnabled`) | Shrinks the Cascade/Sacrifice trigger threshold the longer the oldest Liquid-Diver position has been held — same mechanism as MIW/MIC. |
| **Halving Interval** (`ldwHalvingHours`/`ldcHalvingHours`) | Hours per halving step. Default 0.5. |
| **Share Cap** (`ldwShareCapEnabled`/`ldcShareCapEnabled`) | Limits Liquid-Diver's own *direct* entries to a percentage of `maxPos`. Past the cap, a live signal falls through to Substitution instead of opening into a fresh slot. |
| **Share Cap %** (`ldwShareCapPct`/`ldcShareCapPct`) | The cap percentage. Default 100%. |
| **Substitution** (`ldwSubstitutionEnabled`/`ldcSubstitutionEnabled`) | When there's no room (Share Cap or Max Positions both full), closes the most-underwater *held* position — any strategy's, not only Liquid-Diver's own — and opens the live signal in its place. |
| **Substitution Min Age** (`ldwSubstitutionMinAgeMins`/`ldcSubstitutionMinAgeMins`) | A held position must be at least this old before Substitution can close it. Default 10m. |

Liquid-Diver's Substitution is deliberately wider and more aggressive than MultiIndicator's own version: it can close *any* held position regardless of which strategy opened it, ranked purely by most-underwater unrealized PnL — there's no "Protect Winners" exemption for a currently-profitable position, and no extra margin bar beyond clearing the depth threshold itself. This is intentional — genuine liquidation events are rare, so when one fires it's treated as worth acting on immediately rather than deferred behind a last-resort check.

**Position tagging**: every opened position is tagged with the real liquidation criterion that triggered entry — the type (sliq/bliq/msliq/mbliq) plus its depth, e.g. `sliq+15` (15% above the historical average liquidation size), or bare `0liq` for a zero-liquidation entry — followed by the same three cosmetic, sign-only pairs Blind-Entry uses: `+24h`/`-24h`, `+fund`/`-fund`, `+ocs`/`-ocs`. Of these, `+24h`/`-24h` and `+fund`/`-fund` also feed Slot Blocking (see above); `+ocs`/`-ocs` remains Scorecard-only. OC data is fetched for the single triggering symbol just before the position opens; if that fetch comes back empty the position still opens, just without the `+ocs`/`-ocs` tag.

**Order Interval chart note**: the ORDER INTERVAL SAMPLE chart in Permafrost/Ashfall, and the "+ OC interval" overlay line on the Volume History chart, both hide themselves when Liquid-Diver is the only strategy plugin loaded. Liquid-Diver's OC fetch is single-symbol per reactive entry, so its samples are almost always a single flat bar — showing either chart alongside a proper batch-sampled chart (from MultiIndicator or Blind-Entry) would just be noise. Load MultiIndicator or Blind-Entry alongside Liquid-Diver to see them again.

---

## Permafrost / Ashfall Plugin

Permafrost targets PseudoWinter; Ashfall targets PseudoChaser. These plugins replace the fixed 12h drawdown/gains-lock timers with an adaptive halt system that learns from historical market conditions and trade outcomes. They pair realized PnL from each close with a snapshot of market structure — breadth, momentum, and funding sentiment — building a recency-weighted profile over time. That profile drives a climate score that controls halt duration and signals downstream systems (the bots themselves) to adjust their entry and hold behavior accordingly. In practice, market regime (broadly bullish or bearish) is a significant driver of the learned profile, so the score reflects prevailing conditions rather than precise structural predictions.

**During the first days of operation the plugin behaves almost identically to the stock timers.** It withholds climate governance until enough evidence has accumulated near the current market reading.

### Config

| Setting | What it does |
|---|---|
| **Enabled** | Master toggle. When off, the bot uses the stock 12h halt timers. |
| **Thaw/Settle Score** | Climate score the market must reach for an early halt lift. Higher = harder to thaw; bot stays halted longer in ambiguous conditions. |
| **Hard Cap** (`permafrostCapHours`/`ashfallCapHours`) | Maximum halt duration in hours (12–48h). The bot always resumes by this deadline regardless of climate. |
| **FIO Sentiment** (`permafrostFioEnabled`/`ashfallFioEnabled`) | Includes funding rate sentiment (which side is paying) in the climate score. Labeled FIO — funding-derived — to avoid confusion with the unrelated `iot`/`iom` (Open Interest) criteria. |
| **Slot Scorecard** (`permafrostScorecardEnabled`/`ashfallScorecardEnabled`) | Records realized PnL per MIW/MIC criteria combination. Shows which slot types have been profitable or losing over time. |
| **Sponge Quota** (`pfSpongeQuota`/`afSpongeQuota`) | How many recent closes per criterion are used to compute scores. Older records beyond this count are ignored. Lower = faster adaptation to recent performance; higher = more stable scores that smooth out short streaks. Default 30. |
| **Include Historical Scores** (`pfHistScoringEnabled`/`afHistScoringEnabled`) | When on, historical scoring records (written by the MIW/MIC Historical Scoring feature, tagged `hist: true`) are included in slot score calculations. When off, only live closed-trade records count. On by default. Note: this toggle is independent of the MIW/MIC **Historical Scoring** toggle. Turning off Historical Scoring in MIW/MIC only stops new entries from being generated — existing historical records remain in the scorecard until this toggle is turned off or the sponge quota pushes them out. Turning this off while records exist immediately reduces slot scores to the real-trade-only baseline; slots with no real-trade records disappear from the scorecard entirely until live trades accumulate. |
| **Cross Broadcast** (`permafrostCrossEnabled`/`ashfallCrossEnabled`) | Writes cascade/sacrifice closes and drawdown halt/gains-lock transitions to a shared log that the partner bot can read. Required for Mutual DDH Lift. |
| **Mutual DDH Lift** (`permafrostMutualDdLiftEnabled`/`ashfallMutualDdLiftEnabled`) | When both bots are simultaneously in drawdown halt, lifts this bot's halt. Checked every 15 s. Requires Cross Broadcast to be on. |
| **Gains Continuation** (`permafrostGainsContinuationEnabled`/`ashfallGainsContinuationEnabled`) | When the partner bot reaches its gains threshold and broadcasts a Gains Continuation signal, resets this bot's drawdown throttle to its full configured duration. Checked every 15 s. Requires Cross Broadcast to be on. Default on. |
| **Stale Slot Purge** (`pfStaleSlotDays`/`afStaleSlotDays`) | Slots with no new close in this many days are fully removed from the scorecard on the next trim. Keeps the scorecard clean when criteria combinations fall out of use. Default 7, configurable 1–90 days. |
| **Co-Qualifying Penalty** (`pfCoQualPenaltyEnabled`/`afCoQualPenaltyEnabled`) | When on, the composite score for each ticker is adjusted downward for every additional slot (beyond the best match) that the ticker qualifies for and that carries a negative collapsed score. A ticker matching one good slot and two losing slots is ranked lower than one that only matches the good slot. Only negative co-qualifying scores penalise — positive co-qualifying slots do not boost. |
| **Depth Multiplier** (`pfCoQualDepthPct`/`afCoQualDepthPct`) | Scales every criterion's collapsed score by how far past that slot's own gate threshold the ticker qualifies, both for the best-match slot and any co-qualifying penalty slots — not by the raw tier value. A criterion scoring +$0.50 historically is applied as +$0.70 for a ticker qualifying 4 tiers past its slot's threshold at the default 10%/tier. Works the same in reverse — a losing criterion is penalised harder the deeper past threshold the ticker qualifies. Depth is direction-aware: for a `<` gate (`vm<N`, `iot<N`, `iom<N`, `ocx<N`) a *lower* measured value is the deeper match, since those criteria consider low readings the extreme case. Default 10%, range 0–50%. |
| **Liquidation Surveillance** (`pfLiqEnabled`/`ashLiqEnabled`) | Opens WebSocket connections to track live liquidation flow across a rolling sample of volatile tickers. Required for `sliq`/`bliq` criteria in MIW/MIC. |
| **Liq Batch Size** (`pfLiqBatchSize`/`ashLiqBatchSize`) | Tickers per liquidation batch (5–50). More tickers = broader market coverage per cycle. |
| **Liq Threshold %** (`pfLiqThresholdPct`/`ashLiqThresholdPct`) | Minimum share of a cycle's total liquidation turnover one side must hold to qualify (10–90%). At 50%, one side must account for at least half. |
| **Order Count Surveillance** (`pfOcEnabled`/`afOcEnabled`) | Fetches a fixed number of recent trades for whichever strategy plugin is driving the scan's candidate pool — MIW/MIC, or Blind-Entry (BEW/BEC) when MultiIndicator isn't loaded. Required for `ocs`/`ocx` criteria in MIW/MIC and for the `+ocs`/`-ocs` tag in Blind-Entry. Each fetch is a fresh, independent snapshot — no accumulation or deduplication across cycles. |
| **OC Order Limit** (`pfOcOrderLimit`/`afOcOrderLimit`) | Recent trades fetched per ticker per scan cycle (10–500). Buy/sell skew and average order interval are both computed from this single sample. Default 100. |

### WAVE Tab

The WAVE tab holds display and analysis config controls: which sampling bars and charts to show (Structure / Funding / Liq / Vol / OI toggles), Slope Window, Collective FIO toggle, and Liquidation Surveillance setup and config. The Danger Zone (Export / Import / Clear Profile / Clear Plugin State) is also accessed from this tab.

The **wave chart**, **sampling bar displays** (kline direction, funding skew, liq flow, volume), **OI/MC history chart**, **scorecard chip row**, and **liquidation results chart** all appear directly in the accordion body — no tab needs to be clicked to see them.

The wave chart has three overlay toggles: **Structure** (the market lean path), **FIO** (funding sentiment line — named for its funding-rate derivation, distinct from the `iot`/`iom` Open Interest criteria), and **Score** (a gray line derived from the slot scorecard). When Score is on, a percentage readout appears below the chart showing the net scorecard balance as a share of total recorded weight — green when positive, red when negative.

**Score line during halt**: a drawdown halt or gains lock only pauses new position entry — scans keep running in full, so structure sampling, liquidation/OC surveillance, and the scorecard all keep collecting data. If this bot's own wave score is still unavailable for some other reason, the score line falls back to the partner bot's most recently published wave score. When the scorecard is thin, the wave score falls back to raw kline momentum from the last completed hour candles across the sampled ticker set.

**Gaps in chart history**: the wave chart's Structure/FIO/Score lines, the OI/MC history chart, and the Volume History chart's volume and OC lines all break the line across a real data gap (the bot off, or unable to sample) instead of drawing a straight connector across the missing period. A resumed session starts a fresh line segment rather than dragging the old one forward to the latest point. Each chart's gap threshold is padded above that chart's own actual sampling cadence — Scan Interval for the wave lines, the OI/MC dedup window (2h) for that chart, and the bucket size (1h) for the volume/OC lines — so ordinary scan-timing jitter is never mistaken for a real gap, while a genuine multi-cycle miss still breaks the line.

### Status Block

Shows the current climate reading (magnitude, breadth, slope, FIO score, effective score, evidence mass), and active halt state (profile-governed or fallback timer). The **wave graph** plots recent market structure — direction label (rising/falling/steady) reflects the recent path of the market.

Three directional bar charts below the climate reading show relative dominance at a glance. Red extends left (adverse for this bot's direction), green extends right (favorable), with current values as a label. A drawdown halt or gains lock only pauses new position entry — this bot's own scans, and with them these bars, keep updating normally. The bars (kline direction, funding skew) and the liq chart also read from the partner bot's sample state every 15 seconds as a backup, so the display stays populated even if this bot's own sampling is thin or the bot is off.

| Bar | What it shows |
|---|---|
| **1h Kline** | Bear vs. bull aggregate from the last completed 1h candle sample. |
| **Funding Rate** | Neg vs. pos funding skew across the kline + liq ticker union. |
| **Liquidation Flow** | B-Liq vs. S-Liq share of the last completed liq cycle. Only appears when Liquidation Surveillance is on and at least one cycle has closed. |
| **Volume Sample** | Below-average vs. above-average volume share of the current kline sample, weighted by deviation magnitude. Gray extends left (below average) and thematic color extends right (above average). Only appears when the Volume fade signal is enabled. Below this bar, a **Volume History** line chart shows total market volume (USD billions) sampled at each bulk ticker fetch, scrollable through history. When Order Count Surveillance is on, an amber overlay line shows average seconds between orders per hour bucket, with its own vertical axis on the right edge of the chart (separate scale from the volume line, and inverted — a lower interval means busier order flow, so it plots higher rather than lower). Current values (latest volume, mean volume, latest OC interval) are shown as text below the chart rather than drawn on the lines themselves. |
| **OI/MC History** | A line chart showing aggregate OI as a % of market cap over time, sampled from the bulk ticker feed every ~3h. Current ratio shown next to the label. Only appears when the OI fade signal is enabled. |
| **Order Interval Sample** | Per-ticker bar chart of average seconds between orders (orderbook velocity) from each scan cycle's OC batch, scrollable through history — plain value scale, so a slower/quieter ticker draws a taller bar and a busier/faster one draws a shorter bar. Shown directly below Volume History since both draw on the same OC-interval data. Tickers averaging over 12s/order are left off this chart so a handful of illiquid outliers don't stretch the axis and shrink every other bar to a sliver — they're still fully eligible for `ocx`/`ocs` entry criteria and still appear in the chip list below. Each cycle group is stamped with its sample time (HH:MM) along the bottom axis. Only appears when Order Count Surveillance is on and at least one sample has been taken. Below the chart, a text line summarizes the latest cycle — total orders sampled, buy/sell skew %, and ticker count — followed by per-ticker chips showing each ticker's buy/sell fill counts and its average seconds/order, both scoped strictly to the single most recent OC fetch (picked by timestamp, not just "last saved") so no ticker outside that cycle's sample ever appears. Any records left over from the pre-redesign OC system (which counted a single raw order number instead of the current buy/sell split) are purged from stored history automatically on load and on profile import. |

> **Observational note:** The sampling bars and charts (kline direction, funding skew, volume skew, OI/MC history) are primarily **visual feedback**. They reflect broad market conditions but do not directly gate entries or trigger closes on their own — the only mechanism that acts on them is the combined entry/close signal system (which requires scorecard gating before most signals contribute). Do not read the bars as predictive signals; a heavily red kline bar can coincide with Chaser winning and Winter losing, or vice versa. Treat them as ambient context while the scorecard provides the actual decision weight.

**Requires MultiIndicator**: the Funding Rate Sample, Volume Sample, and OI/MC History bars are computed by MIW/MIC's own sampling pass and disappear entirely if MultiIndicator isn't loaded — they are not shown empty, they don't render at all. Order Count Surveillance and the Slot Scorecard have no such requirement — either MIW/MIC or Blind-Entry can drive them.

### Slot Scorecard

Two separate chip rows, split by which plugin's criteria they hold — a criterion like `+fund` (Blind-Entry/Liquid-Diver's bare sign tag) and a tiered `fund>5` (MIW/MIC's own criterion) collapse to the same display bucket, so keeping them apart keeps either chart meaningful:

- **Slot Scorecard (Chaser/Winter View)** — one chip per base MIW/MIC criterion (e.g. `fund>`, `vm>`, `+24h`) with PnL pooled across all slots that contained it. Only shown when MIW/MIC is both loaded and enabled.
- **Blind-Entry / Liquid-Diver Scorecard** — one chip per Blind-Entry/Liquid-Diver bare-sign or liquidation-type criterion (`+24h`/`-24h`, `+fund`/`-fund`, `+ocs`/`-ocs`, `sliq+`/`bliq+`/etc.). Only shown when Blind-Entry or Liquid-Diver is enabled.

Both charts read from the same underlying record store — **CLEAR** on either one wipes both. Each close writes one record; the Sponge Quota controls how many recent records per criterion are factored in, so scores always reflect the most recent N closes and adapt quickly to shifts in market behavior. MIW/MIC uses its own chart's per-criterion scores to order its entry queue — slots are ranked by the sum of their individual criteria scores. A slot with one losing criterion and one winning criterion ranks by their combined total.

A live position close isn't the only thing that updates the scorecard. Each completed Historical Scoring batch writes its own records and refreshes the scorecard the same way, so scores can shift between trades whenever Historical Scoring is enabled — see the Hist Scoring panel below.

**Win/loss counts can appear high** — this is normal. A criterion shared across many slots accumulates records from all of them. The Sponge Quota caps contributions per criterion, not per slot, which is what makes the scorecard responsive.

MIW/MIC builds a composite score for each candidate ticker before sorting the entry pool. The composite starts with the ticker's best-matching slot score. If **Co-Qualifying Penalty** is on, any additional slots the ticker qualifies for are inspected: those with negative criterion scores subtract from the composite. A ticker that satisfies one strong slot but also satisfies two consistently losing slots ranks lower than a ticker that only satisfies the strong slot. Slots with positive scores do not boost — only negative co-qualifying scores penalise.

The **Both / Hist / Traded** source filter (`pfScorecardSource`/`afScorecardSource`) cycles through which score records are included in the displayed chips, shared by both charts. **Both** (default) shows all records. **Hist** shows only records written by the MIW/MIC Historical Scoring feature. **Traded** shows only records from actual live closed trades. This is a display-only filter — it does not affect which records count toward collapsed scoring. Selection is persisted.

The **Combined / Own** toggle (`pfScorecardView`/`afScorecardView`) switches between: Combined (includes partner bot trades, PnL inverted) sorted by blended total; and Own (this bot's trades only). Selection is persisted, shared by both charts.

**Clicking a chip** in Combined mode shows the raw partner win total; in Own mode it shows the raw own loss total. Clicking again or switching sort mode returns to the normal view.

**CLEAR** wipes all records in the shared store — both charts go empty together.

**Hist Scoring panel**: when Historical Scoring is enabled, the **Stats menu** also shows a Hist Scoring section with the current count of pending simulation targets, a countdown to the next expected batch (shows "next scan" once the window has elapsed), and a list of completed scoring batches (newest first). Each batch entry shows the batch number, wrote/total counts, win count (W), loss count (L), net simulated PnL, and the clock time the batch completed (same-day batches show HH:MM; older ones show month, day, and time).

### Liquidation Feed

When surveillance is on: the **Feed Watcher** panel shows active batches (batch ID, ticker count, running S-Liq / B-Liq USDT totals, dominant side, countdown). The **Liq Sample chart** shows up to the last 25 closed cycles as stacked bars (S-Liq green / B-Liq red, qualifying segments at full opacity). Each cycle's bar group is clickable — clicking one pins the **Highlighted Cycle** chip grid below to that cycle's per-ticker qualification (🥵/🥶 badges), with a label showing that cycle's time when it isn't the actual latest one. Clicking anywhere outside the chart or the chip grid returns Highlighted Cycle to the actual latest cycle, which is also what it shows by default with nothing pinned.

### Danger Zone

**Export** downloads one combined `.json` file with everything the plugin tracks — structure wave (events/closes/wave trajectory), scorecard records, liquidation cycle history, and OC cycle history. **Import** restores all of it from a previously exported file in one step; any field missing from the file is left untouched. **Clear Plugin State** removes all profile data and halt state from localStorage and memory. Use before uninstalling the plugin to avoid orphaned data, or to guarantee a fully clean slate. Irreversible.

**Automatic storage pruning**: structure wave, volume history, OI/MC history, liquidation samples, OC samples, and the shared scorecard are each capped independently at 200KB. If one alone grows past that on a save, its own oldest records are dropped until it's back under budget — other data types aren't touched. This is deliberately per-data-type rather than one shared budget, so a spike in one (e.g. a burst of liquidation activity) can't force pruning of unrelated history (e.g. structure wave) that's still well within its own budget. The Stats menu's Storage usage dropdown shows each of these individually, so a bloated data type is easy to spot before it hits the cap.

The market cap cache (CoinGecko/CoinPaprika) and the cross-bot shared registry are also capped, at 200KB each — the market cap cache by trimming its entry count to fit, the shared registry by dropping its oldest per-symbol entries across all its internal caches (klines, market cap, watch tickers, liquidation results, ...) until back under budget, same as the history types above.

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
| `__ew_sample_state_v1` | Cross-bot sample state written by Permafrost/Ashfall after each structure cycle. Contains `state.winter` and `state.chaser` — each carrying waveScore, fundSkew, oiSkew, klineBar, and liqHistory. Read every 15 s by the partner bot to keep displays current during halts. |
| `__pf_liq_batches` | Permafrost active liq batch snapshots (for reconnect on reload) |
| `__ash_liq_batches` | Ashfall active liq batch snapshots |
| `__permafrost_winter_v1` | Permafrost profile: events, samples, wave history |
| `__ashfall_chaser_v1` | Ashfall profile |
| `__everwinter_scorecard_v1` | Shared slot scorecard written by both plugins. Each close is one record; each slot retains up to the Sponge Quota most recent records. |
| `__miw_hist_batches` | MIW Historical Scoring batch history. Object containing `batches` (up to 25 completed records — each with batch ID, timestamp, entries written, total candidates, win count, loss count, and net simulated PnL) and `fundSkew` (last funding sample bar state). |
| `__mic_hist_batches` | MIC Historical Scoring batch history. Same structure as `__miw_hist_batches`. |
| `__cgCoinList` | CoinGecko coin list cache (24-hour TTL) |
| `__cpCoinList` | CoinPaprika coin list cache (24-hour TTL) |
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
