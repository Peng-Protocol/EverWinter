# ❄️ EVERWINTER

**EverWinter** is a browser-based trading suite for Bybit USDT Perpetuals executing the **Winter-Chaser** strategy. See the [Strategy Guide](StrategyBook.md) for trading logic and rationale.

---

## Files

| File | Purpose |
|---|---|
| `PseudoWinter.html` | Shorts-only simulation bot |
| `PseudoChaser.html` | Longs-only simulation bot |
| `PsychoWinter.html` | Shorts-only reactive approach standalone bot |
| `PsychoChaser.html` | Longs-only reactive approach standalone bot |
| `ChartWinter.html` | Chart and market scan tool |
| `plugins/modes/EverWinter.html` | Live trading plugin for PseudoWinter |
| `plugins/modes/SunChaser.html` | Live trading plugin for PseudoChaser |
| `plugins/strategies/MultiIndicator-Winter.html` | Entry filter plugin for PseudoWinter |
| `plugins/strategies/MultiIndicator-Chaser.html` | Entry filter plugin for PseudoChaser |
| `plugins/analytics/Permafrost-Winter.html` | Market climate plugin for PseudoWinter |
| `plugins/analytics/Ashfall-Chaser.html` | Market climate plugin for PseudoChaser |

---

## Setup

Open any `.html` file directly in a browser. No build step, no server, no installation. Alpine.js and Bootstrap 5 are loaded from CDN — an internet connection is required on first load (cached after that).

**Running both bots**: open PseudoWinter and PseudoChaser in separate tabs from the same origin. When both are open simultaneously they automatically share bulk ticker fetches, kline caches, and Order Count samples to halve API load. Either bot works normally on its own when the other tab isn't open.

Every background/bulk fetch — bulk tickers, market watch, and any loaded plugin's kline/OC batches — runs through a single per-bot scheduling queue (**Scan Scheduling** in Main Config) instead of firing all at once, which is what keeps the browser responsive with one bot open and workable with two. Execution-critical single-symbol calls (opening/closing/watching a position) bypass the queue entirely so order execution is never delayed behind background scanning. The scan itself is a pipeline of named stages that hands control back to the browser after each time slice (**Slice Budget**), so position watching, clicks and timers run mid-scan instead of waiting for it to finish.

For a tighter coupling than passive data-sharing, **Leader / Follower** (Main Config) lets one bot fully defer to the other: flip **Follow Partner Bot** on and that instance stops fetching bulk tickers, OC, and kline data on its own, relying entirely on the partner's shared cache. The partner needs no toggle of its own — it's leader by default as long as it keeps completing scan cycles. If the partner goes quiet for two full scan intervals, the follower automatically resumes scanning independently, then steps back down the moment the partner's heartbeat returns — no manual re-arming either direction.

**Compatible with Permafrost/Ashfall.** Bulk tickers and OC defer through the same per-cycle shared read a following bot already uses with neither plugin loaded — nothing extra needed there.

---

## Menus

The UI has four views: **Market** (positions, scan controls, watchlist) plus three configuration/telemetry panels — **Config**, **Stats**, and **Trades**.

**Mobile** (≤768px): a bottom tab bar (⚙ Config · 📊 Market · 📈 Stats · 📌 Trades) switches between the four views full-screen, one at a time. Unchanged from earlier builds.

**Desktop**: Market, Config, Stats and Trades all sit side by side in normal document flow at the same level — no overlay, no dimming, no shadow. Config/Stats/Trades open via matching icon buttons (⚙ 📈 📌) in the topbar — no dedicated Market button, since it's never hidden. Config opens by default on launch; click its icon again (or any open panel's icon) to dismiss it.

Market always gets twice the flex-grow of any open side panel, so with both sides open the split is exactly Market 2/4, left panel 1/4, right panel 1/4 (with only one side open, Market and that panel split roughly 2:1; with neither open, Market fills the row). Slot assignment follows opening order, not menu identity:
- First panel opened → left slot. Second → right slot.
- Once both slots are full, opening a third (currently-closed) panel replaces the **left** slot's occupant.
- Opening a fourth replaces the **right** slot's occupant — and it keeps alternating left/right on every subsequent replacement from there.

Two panels can be open at once; a third click always bumps whichever slot is due next rather than stacking a third panel.

---

## Plugins

To load a plugin, open the **Plugin Manager** panel at the bottom of the config menu, click **Load Plugin**, and select the `.html` file. **A page reload is required after loading or removing any plugin** — the plugin pipeline runs once at page boot, so changes don't take effect until the next load.

---

## EverWinter / SunChaser (Live Trading Plugins)

EverWinter turns PseudoWinter into a live short-only Bybit bot; SunChaser does the same for PseudoChaser as long-only. Both sign requests with the stored `__ew_creds`/`__sc_creds` API key and place real orders — the topbar reads **Very Real Orders** once loaded, in place of the base simulation's **No Real Orders**.

- **Balance**: fetched automatically the moment a valid key/secret pair is saved in the credentials panel, not only at page load.
- **Symbol banning**: a symbol is banned for a week if Bybit reports it as unsupported for trading, or blocked pending a required trading agreement (e.g. certain leveraged/inverse instruments) — either case needs the same manual action on Bybit's side before the symbol can trade again, so both are treated as a permanent block rather than retried every cycle.
- **Post-bail re-check**: after a bail sweep (manual Danger Zone bail or an automatic Drawdown Throttle bail), the plugin queries the exchange directly for any position still open in its own direction (Sell for EverWinter, Buy for SunChaser) and force-flattens it with a direct reduceOnly market order. This catches positions that failed to fully fill. 

---

## Main Config

Changes take effect immediately and are persisted to localStorage automatically.

| Setting | What it does |
|---|---|
| **Scan Interval** (`scanMins`) | How often (minutes) the bot runs a full market scan. Controls both entry frequency and the scan bar in the UI. |
| **Max Positions** (`maxPos`) | Maximum simultaneously open positions. No new entries open once this is reached. |
| **Leverage** (`leverage`) | Position leverage. Affects order size, TP/SL prices, and EDa thresholds. |
| **Min Notional** (`minNotional`) | Base margin per position in USDT. Actual order size = minNotional × leverage. |
| **Entry TP** (`entryTpRoi`) | Take-profit ROI % target. When EDa is active this is the buffered target — the debt-free close happens at a lower percentage. In DCA Mode this is also the base the per-stage TP ladder scales down from (entry TP ÷ (stage+1), min 3%). |
| **Binary Mode** (`binaryModeEnabled`) | On: TP + SL are both set at entry, no DCA adds (`binaryTpPct`/`binarySlPct`, default 50%/50%). Off: multi-stage DCA — add orders trigger below entry (PseudoChaser) or above entry (PseudoWinter), each at a lower TP ROI target; SL (`dcaSlPct`, default 16%) only arms once every first-wind DCA stage has filled. **Requires the `dca-long`/`dca-short` plugin** (`plugins/modes/`) to expose the DCA config controls — the underlying binary/DCA logic ships in the base bot either way. |
| **DCA Stages** (`dcaStages`) | Number of DCA add orders (1–6 in the plugin slider). Each stage gets its own trigger slider (`dcaAddPct1`…`dcaAddPct6`, % below entry for PseudoChaser / above entry for PseudoWinter, defaults 3 / 6 / 12 / 18 / 24 / 30) — one slider appears per selected stage. Triggers are kept strictly increasing: lowering a slider stops at the previous stage's trigger, and raising one pushes later stages up. Configs saved before per-stage triggers (non-3 stage counts used a fixed 1.5%, then +3% per stage ladder) are migrated on load/import so existing setups keep the same trigger prices. |
| **DCA Add Notional** (`addNotional`) | Margin (USDT) added per DCA stage — separate from **Min Notional**, which only sizes the initial entry. |
| **Drawdown Throttle** (`drawdownThrottleEnabled`) | Halts new entries for a configurable duration (`drawdownHaltHours`, default 12h; free-entry field, no upper bound) when rolling 6h realized PnL drops below a loss threshold. The Halt tab shows a live readout of the current 6h rolling PnL and a **Clear 6hr Record** button (with confirmation) to zero the window manually — independent of any active halt. |
| **Drawdown Factor** (`drawdownThrottleFactor`) | Loss threshold as a multiple of entry margin. At 0.5× with $1 margin, $0.50 of rolling losses triggers the halt. |
| **Bail on Trigger** (`drawdownBailEnabled`, default on) | When on, triggering the Drawdown Throttle halt also immediately closes every open position at market (`bailAll()`) — the same sweep the Danger Zone's manual **Bail All Positions** button runs, and what the **BAIL** trade-card badge marks. |
| **Gains Lock** (`gainsLockEnabled`) | Halts new entries for 12 hours once rolling 6h profit hits a target. Banks a winning streak before it reverses. Same 6h rolling PnL readout and **Clear 6hr Record** button as Drawdown Throttle, shown in its own section of the Halt tab. |
| **Gains Factor** (`gainsLockFactor`) | Profit target as a multiple of entry margin. Same scale as Drawdown Factor. |
| **Manual Halt** | Button (Halt tab) that blocks all new position entry indefinitely until manually lifted. Independent of Drawdown Throttle and Gains Lock — overrides both and doesn't stack with either. |
| **EDa / Laggard Check** (`laggardCheckEnabled`) | Enables the Effective Debt Adjusted system. Realized losses are passed forward to surviving positions, which take higher TP targets to recover the debt. **Requires the EDa-Winter / EDa-Chaser plugin** (`plugins/modes/`). |
| **TP Buffer** (`laggardProfitOffset`) | Extra TP headroom reserved above the functional target (%). The debt-free close happens at `tpPct ÷ (1 + buffer/100)` — at 50% buffer with an 18% TP slider, trades close at 12% without debt. Requires the EDa plugin. |
| **Ticker Cooldown** (`bulkTickerCooldownHours`) | How long the bot reuses a cached bulk ticker fetch before hitting the API again (default 12h). The bulk list only says which symbols exist — criteria data never reads it — and the same window sets how long MIW/MIC's re-entry block and the Ticker Graylist hold a closed symbol. |
| **Whiplash Audit** (`whiplashEnabled`) | When on, the position watcher fetches 1-minute klines near TP to confirm whether price spiked through TP between watcher cycles. |
| **Whiplash Proximity** (`whiplashProximityPct`) | How close (%) to TP price triggers the kline audit. |
| **Runtime Limit** (`runtimeHours`) | Maximum position age. Forces a close at the deadline if TP hasn't been hit. |
| **Symbol Banlist** (`banlistEnabled`) | When on, symbols on the ban list are excluded from all scans. Entries expire after 7 days. |
| **Position Price Feed** (`restPollEnabled`) | When on, replaces the WebSocket price stream for open positions with periodic REST API calls. Use if the WS feed returns stale or incorrect prices. |
| **Price Poll Interval** (`restPollBaseSec`) | Base polling interval in seconds for REST mode. The interval doubles automatically when price moves less than 0.1% between ticks and resets to base on any meaningful move. |
| **Dispatch Every** (`schedIntervalMs`) | Minimum gap (ms, default 150) between successive background fetches dispatched from the scheduling queue. Lower = faster background data turnover, at the cost of more simultaneous requests. |
| **Max Concurrent** (`schedMaxConcurrent`) | Hard cap (default 4) on background fetches in flight at once, regardless of how many subsystems have work queued. |
| **Slice Budget** (`schedSliceMs`) | How long (ms, default 8, 2–30) a scan stage runs before handing the browser back; a hidden tab uses 40 ms. Lower = smoother page, slightly slower scans. |
| **Follow Partner Bot** (`lfFollowPartner`) | When on, this bot stops fetching bulk tickers, OC, and kline data on its own and relies entirely on the partner's shared cache. The partner needs no toggle — it's leader as long as its heartbeat (written once per completed scan cycle) stays fresh, judged against 2× **Scan Interval**. Auto-resumes independent scanning if the partner goes stale, and steps back down the moment it returns. Also blocks this bot from opening a position on any ticker the leader already holds — checked at entry, before any instrument/price lookups. Compatible with Permafrost/Ashfall; see the Leader/Follower note under Setup. |
| **Config Lock** (`cfgLocked`) | Locks all config controls to prevent accidental changes while the bot is running. |

---

## Stats Menu

The stats panel shows session-level metrics since the page was last loaded or state was cleared.

| Stat | Meaning |
|---|---|
| **Session PnL** | Cumulative realized PnL from all closed trades this session. |
| **Win / Loss** | Count of profitable vs. losing closed trades. |
| **Win Skew** | Share of total PnL magnitude (all closed trades, cumulative) that came from wins — sum of winning PnL ÷ (sum of winning PnL + sum of losing PnL). Weighted by trade size, not just a count of wins vs. losses. |
| **Avg PnL** | Mean realized PnL per closed trade. |
| **Open uPnL** | Unrealized PnL across all currently open positions. |
| **Positions** | Count of open positions. |
| **Last Scan** | Timestamp of the most recent scan cycle. |
| **Laggard** | The oldest open position — the EDa debt holder. Shows its current debt load when EDa is active. |
| **Persistence** | "Active" (live in-memory position count) vs. "Stored" (confirmed saved to localStorage). These should always match. |

**Persistence mismatch**: shown in red with a warning banner. It means a save failed or was overwritten, and usually clears on its own within a few seconds as the bot retries automatically. If it doesn't:
- Check the activity log for `[PST]`/`[PERSIST]` entries.
- Close any duplicate tabs of the same bot — a second tab can overwrite the first tab's saves with its own stale position count.

**Storage usage** (dropdown below Persistence, PseudoWinter/PseudoChaser only): breaks this bot's own localStorage footprint (plus the genuinely shared cross-bot keys, never the partner's private state) down to one row per data type. Oversized rows show in red with a **✕** to clear that bucket (confirmation-guarded), and **Export** downloads the breakdown as a text file.

**Power usage** (dropdown below Storage usage): a rolling average and peak of how many milliseconds the app spends reacting each second. A rising figure usually means a plugin panel left open somewhere is doing more work than it needs to — closing analytics panels you're not actively watching brings it back down.

**Ticker Graylist**: when MultiIndicator is enabled, the Stats menu shows a Ticker Graylist section listing symbols currently blocked from re-entry. It's empty when nothing is blocked. Each listed symbol clears itself automatically once the bulk ticker cooldown window elapses — no manual action needed.

### Actions Dropdown

- **Export** — Downloads current bot state (config, positions, closed trades, ban list, EDa state) as a `.json` file. Plugins with their own data (Permafrost/Ashfall profile, scorecard) have separate Export buttons inside their own accordions — the Stats menu Export covers the base bot state only.
- **Import** — Restores state from a previously exported `.json` file. Config fields merge field-by-field; positions replace wholesale. A 5s debounce prevents accidental double-imports. Any config key that no longer belongs to a currently-loaded feature (the bot itself or an installed plugin) is dropped automatically on import and on every save — retired settings from an old config file don't linger indefinitely.
- **Clear Closed Trades** — Wipes the closed trades list, resets session stats, and clears the 6hr drawdown/gains-lock rolling PnL windows. Open positions are unaffected.
- **Clear All** — Full reset. All positions, trades, stats, and config are wiped (config reverts to defaults).

### Activity Log

Timestamped entries for every significant bot event. Color coding:

- **White** — informational (scan results, entries, closes)
- **Yellow** — warnings (halts engaged, API retries)
- **Red** — errors (API failures, plugin conflicts)

Common prefixes: `[MHL]` manual halt · `[DWN]` drawdown throttle · `[GLK]` gains lock · `[PST]` (PseudoWinter) / `[PERSIST]` (PseudoChaser) save failures or recovered positions · `[PFR]`/`[ASH]` climate plugin events · `[MIW]`/`[MIC]` multi-indicator events.

The log is capped at 300 entries in memory and in localStorage. Oldest entries are dropped when the cap is exceeded. Each entry carries a local `HH:MM:SS` display string (`t`) plus an absolute epoch-ms timestamp (`ts`) — `t` is what's rendered in the UI, `ts` is there so a log export can be correlated precisely against position/config exports (which timestamp in UTC epoch); `t` alone can't be tied to a specific date or timezone.

---

## Trades Menu

The trades panel shows a card for each closed trade, newest first. Each card carries a close-reason badge — **TP**, **SL**, **FORCE** (runtime limit), **BAIL** (drawdown throttle bail — closes every open position immediately, both bots), **Sub** (closed to free a slot for a higher-ranked candidate via MIW/MIC Substitution), or **Eject** (closed by MIW/MIC Ejection when two or more Deferment paths are active at once). Reasons introduced by other plugins show their own registered label, or the raw reason name if a plugin hasn't registered one. On EverWinter/SunChaser, a bail sweep is followed by a direct exchange re-check.

**Roll-up card**: when the closed trades list exceeds 50 entries, the oldest are compacted into a single roll-up card showing their net PnL, trade count, and the date range they cover. The roll-up is not a trade — it is a historical summary. In the PnL chart, the roll-up's net value acts as a baseline offset applied to every plotted point.

**PnL chart**: click the **PNL CHART** bar below the header to expand a cumulative PnL line chart. The X-axis spans from the first to the last individual closed trade at fixed spacing. The chart is green when the net result is positive, red when negative. The chart only appears once at least 2 individual trades are closed.

**CLEAR button**: removes all closed trades, resets session stats, and clears the 6hr drawdown/gains-lock rolling PnL windows. Clicking CLEAR reveals an inline confirmation ("Sure? Yes / No") before anything is deleted. Yes confirms; No cancels with no change.

---

## MultiIndicator Plugin (MIW / MIC)

The Multi-Indicator plugin filters entries using configurable criteria combinations called **slots**. Each slot is an AND-gate: all criteria in the slot must be true for a ticker to qualify, and any single matching slot opens the ticker for entry. No criterion is mandatory; a slot (Auto or manual) qualifies on any combination of `fund`, `va`, `ioa`, `ocs`, `ocx`, `lta` and `lpa`. Entry is scan-driven only — one pass per fresh sample batch.

### Criteria

See StrategyBook's **Market Reading** section for what each criterion means and when to use it. This section covers tiering, recording, and fetch mechanics only.

**Slot builder badge key**: the manual slot builder uses the same emoji set as position/trade badges.

| Badge | Criterion |
|---|---|
| 🤑/💸 | Funding tier (direction-aware, see [Trivia](#trivia). |
| 🔊 | V/A, volume versus the population sample-window average. |
| 🎲 | IO/A, open interest versus the population sample-window average. |
| 🔭 / 📡 | OCS / OCX. |
| 🕐 | LTA, last completed hour's turnover versus the ticker's own average hour. |
| 💹 | LPA, last completed hour's price change versus every other ticker in the sample window. |

**Recording**: every criterion is recorded as a signed tier on the position at entry.

Each scan draws **Batch Size** tickers (default 50) at random from the candidate pool and fetches their data fresh; that batch is the entry pool, so a ticker outside it isn't a candidate that scan. See **Criteria Sampling Internals** in Trivia. This bottleneck greatly limits the bot's ability to find prospective tickers, but this is intentional, as fetching data for all seven criteria across 600+ tickers every Scan cycle (10 minutes) would be both computationally and bandwidth intensive. Nonetheless, increasing the batch size is an option (if you have the resources). 

### Config

| Setting | What it does |
|---|---|
| **Enabled** (`miwEnabled`/`micEnabled`) | Master on/off. When off, the plugin opens no entries and runs no exits. |
| **Picks** (`miwPicks`/`micPicks`) | Max new entries per scan cycle (1–10). |
| **Share Cap** (`miwShareCapEnabled`/`micShareCapEnabled`) | Limits plugin entries to a percentage of `maxPos`. Prevents MIW/MIC from filling all position slots. |
| **Share Cap %** (`miwShareCapPct`/`micShareCapPct`) | The cap percentage. At 50% with maxPos=6, MIW/MIC can hold at most 3 positions. |
| **Tier Step Sizes** (`miwFundStep`/`miwVaStep`/`miwIoaStep`/`miwOcsStep`/`miwOcxStep`/`miwLtaStep`/`miwLpaStep` and `mic` equivalents) | Read-only chip group on the **Fetch** tab showing the current tier step for each criterion. `va`/`ioa`/`ocx` are percentage deviations from the population average (default 1%), `lta` a percentage deviation from the ticker's own hourly average (default 10%), `lpa` absolute points of 1h price change (default 0.25, shown as `pp`), `fund` points of funding rate (default **0.0025%** per tier, so 0.25% is tier 100; older installs saved 0.25 and are migrated once, with saved `fund>N`/`fund<N` slot gates rescaled ×100 so each keeps its threshold). Not editable from the UI — change via config import. |
| **Cascade** (`miwCascadeEnabled`/`micCascadeEnabled`) | Closes every open position — any strategy's, not only MIW/MIC's own — when their collective unrealized profit hits a threshold. Banks a group move before it reverses. Checked continuously by the position watcher (every 5s while the bot is running), not just once per scan, so a threshold crossed and reversed between scans is still caught. |
| **Cascade %** (`miwCascadePct`/`micCascadePct`) | Collective uPnL trigger as a % of base margin (minNotional ÷ leverage). While **Target Halving** is on the slider is hidden and this value is the ceiling. |
| **Sacrifice** (`miwSacrificeEnabled`/`micSacrificeEnabled`) | Closes every open position — any strategy's, not only MIW/MIC's own — when their collective unrealized loss hits a threshold. Caps group drawdown. Same continuous position-watcher check as Cascade. |
| **Sacrifice %** (`miwSacrificePct`/`micSacrificePct`) | Collective uLoss trigger as a % of base margin (minNotional ÷ leverage). While **Target Halving** is on the slider is hidden and this value is the ceiling. |
| **Target Halving** (`miwTargetHalvingEnabled`/`micTargetHalvingEnabled`, default off) | Sub-toggle on the **Exit** tab, only shown while Cascade or Sacrifice is on. Scales every new position's entry TP and SL, and the Cascade and Sacrifice %, by the Sample Scorer's headline relative to its recorded peak (see **Sample Scorer** below): full configured values at the peak, zero at an even share or below. The Cascade/Sacrifice sliders are hidden while it's on and act as ceilings. Also drives Deferment. Needs Sample Scoring; with it off or no scorecard value or recorded peak yet it does nothing and the configured values apply. A read-only line under the toggle shows the live resolved targets. |
| **Min Entry TP** (`miwMinEntryTp`/`micMinEntryTp`, default **6**) | Only shown while Target Halving is on. ROI % floor below which a position can't clear its entry and exit fees. If the resolved entry TP, or the resolved Cascade target while Cascade is on, falls under it, the market isn't worth trading and new entries are deferred. Cascade and Sacrifice also never fire below it (or below 1%). |
| **Substitution** (`miwSubstitutionEnabled`/`micSubstitutionEnabled`) | When no entry slot is free (maxPos or Share Cap reached), closes the worst-scoring held position — any strategy's, not only MIW/MIC's own — and opens the best fresh candidate instead, but only if the candidate's collapsed score exceeds the held position's *current* score by the configured Margin. A held MIW/MIC position's own score (`_miwLiveCompositeScore`/`_micLiveCompositeScore`) is recomputed live from its rolling-average criteria (see **Position Rolling Average**) rather than the score frozen at entry — a position is judged on where it's actually drifted to, not where it stood when it opened. Requires Co-Qualifying Penalty (Permafrost/Ashfall) — without it, every score is 0 and Substitution never fires. Each candidate is pre-flighted through the Force-Evaluate top-up and entry vetoes before anything is closed; a blocked one falls through to the next. |
| **Substitution Margin** (`miwSubstitutionMarginPct`/`micSubstitutionMarginPct`) | How much better the new candidate must score than the worst held position, as a % of base margin (minNotional ÷ leverage), before a swap happens. Prevents swapping on marginal score differences. |
| **Substitution Min Age** (`miwSubstitutionMinAgeMins`/`micSubstitutionMinAgeMins`) | Minimum minutes a position must be held before it becomes eligible to be substituted out. |
| **Deferment** (`miwDefermentEnabled`/`micDefermentEnabled`, default off) | Regime-proxy entry stop, set on the **Exit** tab (below Substitution, with its Both Poles Red sub-toggle). Blocks every new entry while the Sample Scorer headline is below zero (the favored side's mean raw 1h move in the bot's favor), or when a clause is in effect — **Both Poles Red** or the **Target Halving** floor. Needs Sample Scoring for the headline. Two or more paths active at once trigger Ejection. See **Deferment & Ejection** below. |
| **Both Poles Red** (`miwDeferBothRedEnabled`/`micDeferBothRedEnabled`, default off) | Sub-toggle, only shown while Deferment is on. Defers while any criterion has both its `+` and `-` pole in the red on the scorecard side the chart shows — no good pole left to enter on. A pole under Min Samples doesn't count. Counts as one path toward Ejection. |
| **Re-entry Block Mode** (`miwReentryBlockMode`/`micReentryBlockMode`) | Defaults to **Winners + Losers**, which blocks a symbol from re-triggering for one bulk-ticker cooldown window (12h by default) after any close, win or loss. **Losers Only** lets a symbol that just closed in profit re-trigger immediately, blocking only a symbol that closed at a loss. |
| **Auto Slots** (`miwAutoSlots`/`micAutoSlots`) | Replaces the manual slot list with a minimum-gate qualifier: a ticker qualifies once it satisfies at least **Minimum Criteria per Slot** non-excluded criteria — not a fixed-size combination. Every criterion the ticker actually satisfies is captured and scored, not just enough to clear the floor. See `_miwAutoQualify`/`_micAutoQualify`. |
| **Minimum Criteria per Slot** (`miwAutoSlotSize`/`micAutoSlotSize`) | The floor (1–7). At 1, a single true criterion qualifies the ticker — any others it happens to satisfy are still captured and scored. |
| **Exclude from Auto** (`miwAutoSlotExclude`/`micAutoSlotExclude`) | Criteria omitted from Auto's qualifying set entirely — never checked, never counted toward the minimum, never scored. Excluding more than `7 − Minimum Criteria per Slot` leaves Auto unable to ever reach its floor, and the plugin reports no active entry gate (`_miwAutoActive`/`_micAutoActive`). |
| **Force-Evaluate General Criteria** (`miwForceGeneralCriteria`/`micForceGeneralCriteria`, on by default) | Auto mode only. A match can miss `fund`, `ocs`/`ocx`, `lta`/`lpa` or `ioa` purely because that cycle's capped sample hadn't covered the ticker yet. When on, the open path (`_miwTopUpGeneralCriteria`/`_micTopUpGeneralCriteria`) re-checks them with a forced per-symbol fetch — only for tickers actually about to open — appends any newly-true criteria, and recomputes the composite score. Never drops a criterion already found. The Lukewarm Veto is re-checked against the topped-up criteria before the open goes through. On a following bot this is the one exception to the no-own-fetch rule: it uses the leader's shared OC cache first and fetches the single symbol directly only if that has nothing. Costs a few extra requests per entry. |
| **Pole Blocking** (`miwPoleBlockEnabled`/`micPoleBlockEnabled`, default off; `miwPoleBlockPct`/`micPoleBlockPct`, default **200**) | Entry-tab toggle with a Threshold % field, only shown while Sample Scoring is on. Blocks a candidate carrying a dial pole whose scorecard edge is zero or negative and trails its positive partner pole by the threshold or more, measured as `(partner − pole) / min(\|pole\|, partner)` — LTA- at −0.20pp against LTA+ at +0.05pp (500%) never opens. No magnitude floor; both poles need Min Samples, and a non-positive partner is left to Both Poles Red. Reads the favored side. Blocks count in the scan skip summary and log a `🚧 Pole Blocking` line. |

### Slots UI

**Manual mode**: click a slot to select it, then toggle criteria on/off in the picker row below. ✕ deletes the slot; `+` adds a new empty one. All seven criteria are tiered — clicking one opens its gate picker (direction plus tier) rather than toggling a bare tag. A slot with no criteria in it never matches.

**Auto mode**: replaces the manual builder with a minimum-slider and an exclusion chip row. A ticker qualifies on at least the chosen minimum of non-excluded criteria — every criterion actually true is scored, not just enough to clear the floor. The hint under the slider states the current floor as "qualifies on any N of M secondary criteria."

The seven criteria are independent signed tiers, so any subset can be true for the same ticker at once and each contributes to the qualifying count on its own.

---

## Permafrost / Ashfall Plugin

Permafrost targets PseudoWinter; Ashfall targets PseudoChaser. They provide two things: the **Extremity Scorer / Lukewarm Scoring** engine that decides which readings MIW/MIC may trade on, and the **cross-bot bus** that lets the two sides coordinate halts. The bots' own halt timers govern halts; the plugins only lift them (Mutual DDH Lift) or trigger them (Gains Continuation). The panel has two tabs, **CROSS** and **SCORE**, with the Danger Zone (Export / Import / Clear Profile / Clear Plugin State) below.

### Config

| Setting | What it does |
|---|---|
| **Permafrost / Ashfall Mode** (`permafrostEnabled`/`ashfallEnabled`) | Master toggle. |
| **Cross Broadcast** (`permafrostCrossEnabled`/`ashfallCrossEnabled`) | Always on, no toggle. Writes cascade/sacrifice triggers, drawdown halt/gains-lock transitions and GC steps to a shared log (`__everwinter_cross_v1`, retained 30d) that the partner bot can read. Required for Mutual DDH Lift and Gains Continuation coordination. Cascade/sacrifice fires once per MIW/MIC collective-exit trigger — not once per position closed — tagged with the position count and collective PnL at the moment the trigger fired; a plain individual TP/SL close is not broadcast. On page load into an already-active halt, the plugin backfills the halt-start marker (timestamped to the halt's real start) if the bus doesn't already show it, so Mutual DDH Lift still sees the halt's true age. |
| **Mutual DDH Lift** (`permafrostMutualDdLiftEnabled`/`ashfallMutualDdLiftEnabled`) | When both bots are simultaneously in drawdown halt or gains lock, lifts whichever side's halt started *earlier* — the newer halt is left standing, on the reasoning that it hasn't had any cool-down time yet while the older one already has. Checked every 15 s. Depends on each bot's own halt-start marker actually being on the shared bus — see the reload backfill note above. |
| **Gains Continuation (GC)** (`pfGcEnabled`/`afGcEnabled`) | Independent of the host's own Gains Lock: tracks this bot's rolling 6h closed-trade PnL and broadcasts a one-shot `gc` event each time it crosses a new step (**Step Size**, default 50% of base margin — high-water-mark, a step only re-fires after the window resets to ≤0 and climbs again). If the partner also has GC on and reads a step within the freshness window, it triggers a *full drawdown halt on itself* — a winning streak on one side is read as a signal for the other to step back rather than chase the same conditions. On by default; requires GC on both bots. |
| **Step Size** (`pfGcThresholdPct`/`afGcThresholdPct`) | Size of one GC step as a % of base margin (minNotional ÷ leverage). The live hint shows the current dollar value per step. |
| **Freshness Window** (`pfGcFreshnessMult`/`afGcFreshnessMult`) | How many Scan Intervals a broadcast GC step stays actionable on the partner side (default 2×). |
| **Extremity Scorer** (`pfExtremityEnabled`/`afExtremityEnabled`) | The scoring engine. Sorts each criterion's own sampled readings into extreme-high / lukewarm / extreme-low, scores which end paid — by closed trades, or by how sampled tickers moved under **Sample Scoring** — and vetoes a candidate once too much of what it exhibits sits on the losing end. Criteria universe is `fund`, `va`, `ioa`, `ocs`, `ocx`, `lta`, `lpa` — see **Extremity Scorer** and **Sample Scoring** below. |
| **Sample Scoring** (`pfSampleScoringEnabled`/`afSampleScoringEnabled`, **off by default**) | Proactive mode of the Extremity Scorer: scores each criterion by how the sampled tickers actually moved (LPA, in the bot's favor) instead of by closed-trade PnL, so it can learn before any entry. Same Extreme/Lukewarm buckets and veto. Hides the closed-trade settings (Position Rolling Average, Drift Credit, Sponge Quota, Stale Purge); Extreme Split and Min Samples still apply. The scorecard panel is renamed **Sample Scorer** and shows the scored-sample count. Forces the hour-candle fetch on, since LPA is its outcome. |
| **Delayed Pairing** (`pfSampleDelayed`/`afSampleDelayed`, off by default) | Sub-toggle, only shown while Sample Scoring is on. Off: criteria and outcome come from the same sample moment (faster, less accurate). On: criteria are snapshotted at sample time and scored against the ticker's real forward 1h move, fetched an hour later, so scores lag about an hour. The panel lists each pending snapshot with its estimated fetch time. A snapshot not resolved within an hour plus twice max(10 min, scan interval) is dropped. |
| **Extreme Split** (`pfExtremitySplitPct`/`afExtremitySplitPct`) | What share of a dial pole's sample, sorted by magnitude, counts as "extreme" (default 30%, range 5–45%). Lower = a stricter, more exclusive extreme band; higher = more readings qualify as extreme. The cutoff is recomputed per pole from its own sample. |
| **Min Samples** (`pfExtremityMinSamples`/`afExtremityMinSamples`) | Minimum sampled readings a dial pole needs before its extreme cutoff is trusted (default 3, range 3–30). Below this the pole has no proven cutoff and every reading on it counts as lukewarm. Because the pool samples live annotations rather than closes, a pole usually clears this within the first scan or two. When **Position Rolling Average** is on, also the minimum per-family reading count the open-position rolling average requires before trusting a position's rolling average over its frozen entry-time snapshot. |
| **Sample Cap** (`pfExtremitySampleCap`/`afExtremitySampleCap`) | Max retained magnitude readings per dial pole for cutoff computation (default 300). Oldest trimmed first. Config-only — no UI control. |
| **Lukewarm Veto** (`pfLukewarmRatioPct`/`afLukewarmRatioPct`) | Share of a candidate's dial-eligible criteria that must land on the *non-favored* side before the candidate is vetoed outright (default 70%, range 30–100%). Which side is favored is decided by Lukewarm Scoring itself, not by a toggle — the hint under the slider names the side currently being targeted. An unproven dial (below Min Samples) always counts against the candidate. |
| **Extremity Re-Evaluation** (`pfExtremityReEvalEnabled`/`afExtremityReEvalEnabled`) | At the end of every scan, checks each open position's criteria against the *current* cutoffs — its rolling average if **Position Rolling Average** is on (see **Position Rolling Average**), otherwise its frozen entry-time snapshot, which still drifts relative to the cutoffs as they rebuild — and closes it, tagged **`Ext-Rvl`**, if it now crosses the same Lukewarm Veto bar it had to clear to open — held to the same standard for its whole life, not just at entry. Because it routes through the same veto, it follows the favored side automatically: when Lukewarm is the target it closes positions drifting into extreme territory, and vice versa. |
| **Position Rolling Average** (`pfPosRollingAvgEnabled`/`afPosRollingAvgEnabled`, **off by default**) | Score-tab toggle: scores each open position on a rolling 24h average of its criteria instead of the snapshot frozen at entry. Off: no per-scan fetch is made for open positions, and close-time scoring, Extremity Re-Evaluation and MIW/MIC Substitution all read each position's frozen entry-time criteria. On: every scan makes a fresh single-ticker fetch per open position (plus a fresh OC sample for `ocs`/`ocx`, and the cached 1h candle for `lta`/`lpa`) and scores on the resulting 24h rolling average, falling back to the entry snapshot per family until **Min Samples** readings exist. Does not affect Order Count Surveillance's population sample window or the pre-entry top-up fetch. |
| **Sponge Quota** (`pfSpongeQuota`/`afSpongeQuota`) | How many recent closes per criterion feed the score build. Older records beyond this count are ignored. Lower = faster adaptation to recent performance; higher = more stable scores that smooth out short streaks. Caps contributions per criterion, not per slot. |
| **Stale Purge** (`pfStaleSlotDays`/`afStaleSlotDays`) | Slots with no new close in this many days are fully removed from the scorecard on the next trim. Plain number field, no upper bound. Freshness is per exact criteria combination. |
| **Co-Qualifying Penalty** (`pfCoQualPenaltyEnabled`/`afCoQualPenaltyEnabled`) | Scores each candidate by summing its matched criteria's collapsed scores, so historically-losing criteria drag a ticker down the entry queue. In manual-slot mode it additionally deducts for every further slot the ticker qualifies for that carries a negative collapsed score (positive co-qualifying slots do not boost). In Auto mode there is only one canonical match set per ticker, so the sum over that set *is* the composite. Also required by MIW/MIC Substitution — without it every score is 0 and no swap ever fires. |
| **Depth Multiplier** (`pfCoQualDepthPct`/`afCoQualDepthPct`) | Scales every criterion's collapsed score by how far past that slot's own gate threshold the ticker qualifies, not by the raw tier value. E.g. a criterion scoring +$0.50 historically is applied as +$0.70 for a ticker qualifying 4 tiers past its slot's threshold at 10%/tier. Works the same in reverse — a losing criterion is penalised harder the deeper past threshold the ticker qualifies. Depth is direction-aware: for a `<` gate (`va<N`, `ioa<N`, `ocx<N`) a *lower* measured value is the deeper match. Range 0–50%. |
| **Batch Size** (`pfOcBatchSize`/`afOcBatchSize`) | Tickers fetched fresh per scan and used as the entry pool (default 50, 1–2500, number field). Each costs a ticker and a recent-trades request, plus a candle once an hour — about 1 MB uncompressed per 50 tickers — so bandwidth scales with batch size × scans per day. |
| **Order Count Surveillance** (`pfOcEnabled`/`afOcEnabled`) | Samples **Batch Size** tickers from MIW/MIC's scan candidate pool each cycle. Recent trades are fetched when a slot needs `ocs`/`ocx`, and each ticker's last-completed 1h candle when a slot needs `lta`/`lpa`; the same cycle history carries the 24h-turnover and open-interest samples `va`/`ioa` compare against — with none of those needed, only the per-ticker ticker fetch runs. Each OC fetch is a fresh, independent snapshot. Published to the shared cross-bot registry each cycle, so a **Follow Partner Bot** instance (which runs no OC fetch of its own) seeds its own OC results and cycle history from the leader's latest sample instead of going without. With Order Count Surveillance off, tickers are still fetched fresh each scan; trades and candles are not. |
| **OC Order Limit** (`pfOcOrderLimit`/`afOcOrderLimit`) | Recent trades fetched per ticker per scan cycle (10–500). Buy/sell skew and average order interval are both computed from this single sample. |
| **Megacap Exclusion** (`megacapExclude`) | Array of symbols excluded, alongside BTC, from every population average this plugin builds and from MIW/MIC's own scan pool. Default `BTCUSDT`/`ETHUSDT`/`SOLUSDT`/`BNBUSDT`/`XRPUSDT`/`DOGEUSDT`/`ADAUSDT`/`TRXUSDT`/`LINKUSDT`. Seeded on first load by whichever of the four plugins loads first — shared by key name so all stay consistent. Not editable from the UI — change via config import if the list needs to change. |

### Partner Feed

The Cross tab shows a scrollable **Partner Feed** listing the last 20 events the partner bot has broadcast: cascade/sacrifice triggers, DDH start/lift, gains-lock start/lift, and GC steps. Each row shows a kind-specific detail — position count and collective PnL for cascade/sacrifice, PnL and step number for GC, symbol for a rolling sacrifice — and a UTC timestamp, date-prefixed for anything not from today. Empty until the partner has broadcast at least one matching event.

Useful for diagnosing Mutual DDH Lift and GC: if the feed shows a partner `ddh-start` or `gc` step but no lift follows on this bot, the problem is on the receive side (freshness window, own-side toggle, read loop), not the trigger.

### Sample Chart

Below the Score tab's scoreboard, a per-ticker bar chart of the OC cycle history, scrollable through past cycles. Two header buttons step through the views **OC → Vol → IO → Fund → LTA → LPA** (each labelled with the view it goes to, wrapping at either end); the view resets to OC on reload. Only shown when Order Count Surveillance is on and at least one sample exists. Each cycle group is stamped with its sample time — click one to pin the summary and chips to that cycle, click elsewhere to return to the latest.

- **OC**: bar height is average seconds between orders (quieter = taller). **Total** shows buy/sell skew over every retained cycle plus the population average interval `ocx` measures against; **Batch** shows the displayed cycle. Chips show dominant side and interval — outline when faster than the batch mean, filled when skew leans to the bot's own side (buy on Chaser, sell on Winter). Tickers averaging over 12s/order are rare and completely flatten the chart, as such they are left off the chart but stay eligible for criteria and the chip list.
- **Vol** / **IO**: the 24h-turnover and open-interest samples, with a **Total avg** (the number `va`/`ioa` measure against, plus ticker count) above a **Batch avg**. No outlier cap.
- **Fund**: each sampled ticker's funding rate (%), signed, with a **Total avg** and **Batch avg** like Vol/IO. Funding rides in the sample records, read from each ticker's fresh fetch.
- **LTA** / **LPA**: signed views (turnover deviation %, 1h price change %) drawn up or down from a zero line on a symmetric axis sized to 1.3× the 95th percentile of |value|. Only tickers with a candle reading in a cycle appear.

### Extremity Scorer

Each criterion is a **dial family** (`fund`, `va`, `ioa`, `ocs`, `ocx`, `lta`, `lpa`) with a `+` and a `-` pole. Every scan's readings build per-pole cutoffs that sort each reading as extreme or lukewarm, and closed trades are tallied per side and per pole. Whichever side has earned more dollars becomes the favored side (ties default to extreme), and the Lukewarm Veto rejects candidates whose criteria mostly sit on the other side. Scorecards are per bot — each reflects only its own trades. See **Extremity Scorer Internals** in Trivia.

**Scorecard chart**: only the favored side's chart is shown — Extreme or Lukewarm — and it flips automatically when the favored side changes. It is a single non-wrapping row of criterion duos that scales to its container: the left bar is the `+` pole, the right bar the `-` pole, profit rises above a zero line and loss hangs below it, and the criterion emoji sits underneath. The header shows the side's name and total; hover a bar for its PnL and W/L. Only shown when MIW/MIC (or Blind-Entry / Liquid-Diver) is loaded and enabled.

**CLEAR** wipes this bot's closed-record store, sample pool and Sample Scoring store together (`__ew_pf_extremity_v1`/`__ew_pf_dialpool_v1`/`__ew_pf_sampleobs_v1`, or the `af` set) — cutoffs included, never the partner's.

Under **Sample Scoring** the same chart is titled **Sample Scorer**, its bars are mean edge in pp (hover shows the average edge, ↑/↓ counts and n), and a status line above it shows the scored-sample count plus, with Delayed Pairing on, each snapshot awaiting its outcome with its estimated fetch time.

**Headline & gauge**: the header number is relative. It is the favored side's favorable share of raw 1h move — move in the bot's favor as a share of all raw move on that side, so 50% is even — and a gauge under it is scaled to the best share recorded. Hover for the sample count, the mean in dollars on one base position and the relative edge. The per-criterion bars stay relative (mean edge vs the sampled population). Beneath the gauge, **bottom** and **peak** show the lowest and highest share recorded; they only update once the favored side has at least 10 raw samples (and at least Min Samples) and are cleared with the samples. The headline reads `—` until enough samples carry a raw move.

## Randomized Outcomes

Scan timing drifts independently per tab, and the Order Count sample is a fresh random draw of **Batch Size** candidates each cycle, so two identically configured instances won't share entry triggers, exit timing, or readings. This is intentional: instances in lockstep are easier to front-run and cluster losses at the same market event.

---

## Multiplex Plugins

To maximize efficiency within single-file browser execution, the system architecture supports **Multiplex Plugins**. Unlike standard plugins that independently isolate their telemetry, a multiplex variant hooks directly into the flattened component created when all plugins are loaded, using the structural pipelines—core data arrays—API batched payloads, and state tracking structures without wrapping or reassigning parent methods. This cross-dependencies model dramatically reduces resource consumption and mitigates multi-plugin race conditions by treating the master surveillance/execution engine as a shared database/resource.

### The Speeder Module (Tentative Multiplex)

Located in `/plugins/multiplex/`, **Speeder** leverages existing functions in `MultiIndicator` and data provenience in `Ashfall/Permafrost`. This direct-read capability allows it to tap directly into the rolling Order Count (OC) Surveillance histories and entry criteria builder. 

* **What it does**: Rather than assessing order flow via arbitrary millisecond barriers, Speeder dynamically splits the entire deduplicated pool of recent per-ticker trade intervals at the median during each scan.

* **How it does what it does**: To filter out noise, Speeder does not qualify a ticker simply for landing in the fast or slow half; the ticker's specific trade interval must exceed that collective half’s independent *mean*—ensuring an extreme, mathematical divergence from the baseline market velocity.

* **When it does what it does**: Adhering strictly to `MultiIndicator`'s precedent, Speeder uses an automatic selection method for determining entry criteria (fast or slow), employing a `base` configuration dependent on the liquidation regime. Speeder can enter fast/slow tickers in hot or cold regimes. 

* **When it doesn't**: If the foundational surveillance plugins are completely absent from the flattened component, Speeder logs a clean failure warning and remains safely inactive.

> **Note**: The Speeder strategy is tentative and lacks long-term historical validation; it remains isolated within the multiplex directory for demonstration purposes and architectural testing.

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
| `__ew_shared_v1` | Cross-tab shared data registry (bulkTickers, watchTickers, klines_1h, ocResults, hb_chaser/hb_winter — Leader/Follower heartbeats, pos_chaser/pos_winter — each bot's currently open symbol list, resynced each heartbeat) |
| `__everwinter_cross_v1` | Cross-bot event log written by **Cross Broadcast**: cascade/sacrifice triggers, drawdown halt/gains-lock start/end transitions, and GC steps, each tagged with its source bot. Read every 15 s by the partner for Mutual DDH Lift, GC freshness, and the **Partner Feed**. Halt markers are retained 30 days; a 200KB byte cap evicts the oldest event first regardless of kind. |
| `__permafrost_winter_v1` | Permafrost profile |
| `__ashfall_chaser_v1` | Ashfall profile |
| `__everwinter_extremity_v1` | Old shared Extremity Scorer store, kept only as a one-time migration source: each bot pulls its own records out of it on first read if its private key was never initialized. Never written or deleted; safe to clear once both bots have migrated. |
| `__ew_pf_extremity_v1` | Permafrost-Winter's own Extremity Scorer closed-record store. Each close is one record; each slot keeps up to the Sponge Quota most recent. Not read or written by Ashfall. |
| `__ew_af_extremity_v1` | Ashfall-Chaser's equivalent of `__ew_pf_extremity_v1`. Not read or written by Permafrost. |
| `__ew_af_dialpool_v1` | Ashfall-Chaser's Extremity Scorer sample pool (`afDialSamplePool`): raw per-dial-family magnitude readings that cutoffs derive from, fed by every criterion annotation the scan produces. Separate from the closed-record store, not shared with Permafrost, capped per family, loaded explicitly in `init()`. |
| `__ew_pf_dialpool_v1` | Permafrost-Winter's equivalent of `__ew_af_dialpool_v1` (`pfDialSamplePool`). |
| `__ew_af_sampleobs_v1` | Ashfall-Chaser's Sample Scoring store: `obs` (scored observations — tier tags plus outcome edge, tagged now/forward) and `pending` (delayed snapshots awaiting their forward outcome), plus `wx` (peak/bottom of the headline, in pp, and of the favorable share). Each observation also carries the raw move `r`. Size-capped; wiped by the scorecard CLEAR. A following bot stores the leader's adopted copy here. |
| `__ew_pf_sampleobs_v1` | Permafrost-Winter's equivalent of `__ew_af_sampleobs_v1`. |
| `__ew_creds` | EverWinter live plugin API credentials |
| `__sc_creds` | SunChaser live plugin API credentials |

### Criteria Sampling Internals

- **Tier gate**: every criterion computes an integer tier as `floor(value / step)` and compares it against N (`fund` truncates toward zero instead, so a tiny negative rate lands on `fund-0`, mirroring `fund+0`, rather than flooring to `fund-1`). Current step sizes are shown as read-only chips under **Tier Step Sizes** on the Fetch tab. The same tier is recorded on the position and used as the scorecard key — `fund>40` and `fund+70` are different tiers and scored separately.

- **Bare-form exception — `fund`**: in Auto mode, a criterion named without a `>`/`<` comparison normally still requires a nonzero tier. `fund`'s bare form matches on any finite funding rate instead, exactly 0% included, since real Bybit funding rates mostly sit well under a single **Fund Step**. A near-zero rate is a real lukewarm reading (`fund+0`/`fund-0`), so it attaches and feeds the lukewarm chart. The tiered forms are unaffected.

- **Funding emoji**: position/trade badges show 🤑 or 💸 for a `fund` tier, and the emoji encodes whether that funding sign favors the bot's own direction — so Winter and Chaser show opposite emoji for the same raw sign. The Extremity Scorer's own pills use one fixed set on both bots (💸 positive, 🤑 negative).
- **`ocs`**: signed deviation-from-parity tiers (`ocs+12` = 62% buy-dominant). It is an accumulated read: fill counts are summed per ticker across every retained OC cycle (up to 25, fewer once the 200KB history cap bites — about 5 at 250 per batch), and a live single-ticker sample (`_ocFetchSingle`) folds in exactly once.
- **`ocx`**: `ocx+12` = average inter-fill gap faster than the population average by 12 tiers (12 × step%, default 1%). Reads only the latest batch's interval.
- **OC population average**: `_pfOcWindowAvgMs`/`_afOcWindowAvgMs` flattens the retained cycles, keeps the latest reading per symbol, and averages.
- **`va` / `ioa`**: `va+12` = 12 tiers hotter than the sampled population. `_pfVolIoWindowAvg`/`_afVolIoWindowAvg` delegates to `_pfWindowStats`/`_afWindowStats`, a deduplicated latest-reading-per-symbol read (`vol`, `oi`, `lta` or `lpa`) memoized per history state; the Sample Chart's Total avg draws from the same read. With no slot needing `ocs`/`ocx`, the trade fetch is skipped and only the per-ticker ticker fetch (vol/oi/fund) runs.
- **`fund`**: tier is `trunc(rate% / Fund Step)` with an explicit sign, so tiny negatives tag `fund-0` and exact zero tags `fund+0`. Sample records carry the funding rate as `fr` (%) so the Fund chart and Sample Scoring can use it.
- **`lta`**: `_pfLtaDev`/`_afLtaDev`; `lta+12` = 12 × **LTA Step** (default 10%) above the ticker's own average hour (`turnover24h / 24`). No population baseline.
- **`lpa`**: `_pfLpaWindowAvg(sym)`/`_afLpaWindowAvg(sym)`, in tiers of **LPA Step** (default 0.25pp). Absolute points, since a relative deviation is unstable near a zero mean. No tier until at least one other ticker has an `hc` reading in the window.
- **Candle fetch**: `_pfHourCandle`/`_afHourCandle` calls `GET /v5/market/kline` at `interval=60&limit=3` and takes the row whose start is the last completed hour (`_pfHourStart`); the forming candle is never used. Results sit in a memory-only per-symbol cache (`HOUR_CACHE`, pruned past 500). Each batch attaches `ht` and `hc` to the ticker's OC cycle entry, so a **Follow Partner Bot** instance gets them from the leader (`_pfHourReading`/`_afHourReading`). The fetch rides the same batch (`wantHr` on `_ocFetchBatch`) whenever `lta` or `lpa` is in use.
- **Fresh batch fetch**: `_pfFetchFreshTicker`/`_afFetchFreshTicker` calls `GET /v5/market/tickers?category=linear&symbol=` per batch symbol, keeps the raw payload for the scan (`_pfFreshTicker`/`_afFreshTicker`) and stores a compact `{ vol, oi, fr, px, ch }` reading. A failed fetch drops the ticker; there is no fallback to the bulk list. A **Follow Partner Bot** instance rebuilds tickers from the leader's readings (`_pfSynthTicker`/`_afSynthTicker`).
- **Entry-pool freshness**: MIW/MIC act once per new batch (`_pfOcResultsAt`/`_afOcResultsAt`), not once per bulk fetch. `_miwOpen`/`_micOpen` skip the pre-open price refetch for a ticker from the current batch (`_pfTickerIsCurrent`/`_afTickerIsCurrent`).
- `_miwHourTier`/`_micHourTier` returns `null` for missing data: the criterion check reads it as false and the annotator as "no sample", never a fake `+0`.
- Emoji for retired criteria stay resolvable in `critEmoji`/`afCritEmoji` so old records and exports render; they are display-only.

### Deferment & Ejection Internals

- **Deferment signal**: `_miwWeatherNeg`/`_micWeatherNeg` reads `_pfSampleWeather`/`_afSampleWeather(side)` on the favored side and defers while its dollar `value` is below zero, with no deadband, trim, or cooldown. It needs Sample Scoring and returns nothing until the scorecard has a headline.
- **Deferment effect**: the scan returns before every open path, with guards inside `_miwTrySubstitute`/`_micTrySubstitute` and `_miwOpen`/`_micOpen`. Historical scoring still runs. One `⛔ Deferment` log line per streak.
- **Ejection**: runs every scan ahead of slot logic (so it acts with no active slots) when the deferment state's `eject` is set, which needs two or more paths in `why`. `_miwEject`/`_micEject` closes every non-pending position of any strategy, each in its own try/catch, with one `⏏️ Ejection` log line naming the paths and close reason `ejection`. Each trade is scored against its opening criteria.

### Target Halving & Scorecard Deferment Internals

- **Targets**: `_miwTargets`/`_micTargets` resolves the factor from `_pfSampleWeather`/`_afSampleWeather(side)` on the favored side. It returns the configured values untouched (`active:false`) when Target Halving is off, neither Cascade nor Sacrifice is on, Sample Scoring is off, or there's no headline share (`wx.s`) or recorded share peak (`wx.sHi`). The factor is `clamp(wx.s / wx.sHi, 0, 1)`, zero when the peak is at or below zero. `_miwEffCascadePct`/`_micEffCascadePct` and `_miwEffSacrificePct`/`_micEffSacrificePct` return the resolved % floored at Min Entry TP and 1%; `_miwTargetsText`/`_micTargetsText` feed the Exit-tab readout.
- **Per-position overrides**: `_miwOpen`/`_micOpen` pass `_tpPct` and `_slPct` on the candidate. PseudoWinter/PseudoChaser use `_tpPct` for the entry TP, and `_slPct` for the binary-mode SL at open. It is also stored as `pos._slPctOverride`, which the DCA-mode SL arm, the SL drift check and the position card honor. Both candidate fields are excluded from the copy of candidate fields onto the position.
- **Deferment layering**: `_miwDefermentState`/`_micDefermentState` wraps `…DefermentStateBase`. The wrapper evaluates the negative-headline test (on with Deferment), Both Poles Red and the base on their own and merges them, with `why` listing those that hold and `eject` set when there are two or more. The base holds only the Target Halving floor test. `_miwWeatherNeg`/`_micWeatherNeg` and `_miwBothPolesRed`/`_micBothPolesRed` are the two clause tests; the latter reads the favored side of `pfLukewarmScoreboard`/`afLukewarmScoreboard`.
- **Headline source**: `_pfSampleBuild`/`_afSampleBuild` accumulates the raw edge per bucket into `pfSampleBucketMeans`/`afSampleBucketMeans` (`aE`/`aL`, counts `nAE`/`nAL`) and the signed favorable share `(P−Q)/(P+Q)` of those raw moves (`sE`/`sL`). `_pfSampleWeather`/`_afSampleWeather` returns the dollar `value`, the share (`s`, and `share` as 0–1) and the peak/bottom of each (`hi`/`lo`, `sHi`/`sLo`), which `_pfSampleTrackWx`/`_afSampleTrackWx` keeps in the sample store as `wx` and the leader shares with followers.

### Extremity Scorer Internals

- **Cutoffs**: come from the sample pool (`pfDialSamplePool`/`afDialSamplePool`), fed by `_pfDialSample`/`_afDialSample` on every criterion annotation, not only trades, and persisted across reloads. A pole with at least **Min Samples** readings cuts off at its **Extreme Split** percentile; a reading at or above it is extreme, anything below it and everything on an unproven pole is lukewarm. Bare sign-only tags from Blind-Entry/Liquid-Diver (`+fund`/`-fund`/`+ocs`/`-ocs`) carry no magnitude and always classify extreme.
- **Two tallies**: the dial tally counts extreme occurrences only and is the flat `micCollapsedSlotRanks`/`micCollapsedCritStats` lookup that Co-Qualifying Penalty and entry ordering read. The Lukewarm Scoring tally counts every occurrence, bucketed by class then by pole (`fund+`/`fund-`, not merged by family, since a family's poles are opposite signals).
- **Favored side**: `_pfLukewarmFavoredSide`/`_afLukewarmFavoredSide`, re-decided each time the scorer rebuilds (once per scan cycle).
- **Veto**: `_pfExtremityVeto`/`_afExtremityVeto` counts the share of a candidate's dial-eligible criteria on the non-favored side and vetoes at **Lukewarm Veto**%. An unproven dial counts against the candidate. It checks every entry.
- **Pole Blocking**: `_miwPoleBlocked`/`_micPoleBlocked`, called from `_miwIsEntryBlocked`/`_micIsEntryBlocked` after the Lukewarm Veto, so it covers both the entry-pool filter and the post-top-up re-check. Reads the favored side of `pfLukewarmScoreboard`/`afLukewarmScoreboard`; inert without Sample Scoring.
- **Position Rolling Average**: when on, `_pfPositionCriteriaSample`/`_afPositionCriteriaSample` re-reads each open position's locked criteria families every scan and keeps a rolling 24h average per family, using a fresh single-ticker fetch, a fresh OC sample for `ocs`/`ocx`, and the cached 1h candle for `lta`/`lpa`. These fetches are exempt from Leader/Follower's no-own-fetch rule, like Force-Evaluate's. `_pfPositionAvgCriteria`/`_afPositionAvgCriteria` rebuilds the tag from the average, falling back to the frozen entry tag (`_miwCriteria`/`_micCriteria`, or the Blind-Entry/Liquid-Diver equivalents) for any family under **Min Samples** readings. That average is what close-time scoring, Extremity Re-Evaluation and Substitution's live score read. Off: no fetch, frozen tags only. The cutoff sample pool is unaffected.
- **Sample Scoring**: when on, `_pfExtremityBuild`/`_afExtremityBuild` returns `_pfSampleBuild`/`_afSampleBuild` instead of walking closed records. It publishes the same outputs (cutoffs, `micCollapsedSlotRanks`/`miwCollapsedSlotRanks`, the two-bucket scoreboard) from `__ew_*_sampleobs_v1`, plus per-bucket mean edge (`pfSampleBucketMeans`/`afSampleBucketMeans`) for the favored side. Delayed snapshots resolve from `runScan` via `_pfSampleResolvePending`/`_afSampleResolvePending`, one 1m-kline request per ticker, skipped while following. Its 60 candles give each record's close, high and low move (`f`/`fh`/`fl`); a pending record saved before the split refetches if still inside its window, and an expired one keeps close only. The leader publishes `sampleScore` on the shared registry and a follower adopts it each scan (`_pfSampleAdopt`/`_afSampleAdopt`).
- **Thin poles**: a pole under **Min Samples** scores 0 and counts as lukewarm; at Min Samples its score becomes the plain mean of those readings with no shrinkage, so a rare pole (e.g. `fund-`) jumps from neutral to full weight on a handful of readings.
- **Win/loss counts can appear high**: a criterion shared across many slots accumulates records from all of them, and the Sponge Quota caps per criterion, not per slot.

### Cross-Tab Data Pool

Both bots share market data via `localStorage.__ew_shared_v1` and `BroadcastChannel('ew_shared')`. Writes are last-write-wins per data type. Either bot operates normally solo — the registry is simply absent and all ladder checks fall through to normal fetches.

Each bot publishes its own open-symbol list to this registry on every position open/close, and resynced once more per heartbeat as a safety net for close paths that bypass `pseudoClosePosition` (e.g. the gap-fill audit). A following bot (`lfFollowPartner` on, partner heartbeat fresh) checks the leader's published list before opening and skips any ticker the leader already holds; the leader itself never checks its own publish. Because the check is gated on `_lfIsFollowing()`, it disables itself automatically the instant the leader's heartbeat goes stale — no separate expiry logic on the position data itself.

Not every `BroadcastChannel('ew_shared')` message carries a `localStorage.__ew_shared_v1` write behind it, though most do (`_sharedWrite`/`_sharedMerge` post a change notification after writing). `registerSharedMessageHook` is the general subscription point either kind of push is dispatched through on the receiving end.

### Scan Scheduler Internals

- **Stages**: `runScan` calls `_scanPipeline(ctx)`, which runs the host's `tickers` stage, then each plugin stage in load order (`pf-post`/`af-post`, then `miw-`/`mic-` `prep`, `fetch`, `pool`, `entry`). Stages share `ctx`; a plugin appends `{ id, group, run }` to `_scanStageDefs` in `transform`, and a stage returning `false` skips the rest of its group. On a host without `_scanStageDefs` the plugin falls back to wrapping `runScan`.
- **Checkpoints**: loops call `if (this._scanDue()) await this._scanCp()`, which yields once `schedSliceMs` has elapsed (40 ms while the tab is hidden). The yield is a `MessageChannel` task rather than `setTimeout`, because a hidden tab clamps timers to 1 s or more.
- **Idle lane**: `_schIdle(key, fn)` queues one coalesced job per key (extremity rebuild, re-eval, sample-store saves), flushed when the pipeline ends; `_schIdleCancel(key)` drops it, which MIW/MIC's own rebuild uses to supersede Permafrost/Ashfall's.
- **Timing**: each scan logs one `[SCH]` line with total ms, yields, long-task count and per-stage ms. `ui.scanning` stays on through the plugin stages, so a batch that outlasts the scan interval makes the next scan skip. The extremity rebuild itself is still one synchronous call.

### Plugin Transform Pipeline

```
pw()  →  plugin[0].transform(def)  →  plugin[1].transform(def)  →  ...  →  Alpine
```

Each plugin's `transform(def)` receives and returns the component definition. Load order matters for method wrapping — strategy plugins must declare `after: ['everwinter']` / `after: ['sunchaser']` so live-trading plugin wraps are innermost.

Load order matters: live trading plugins (EverWinter, SunChaser) must load before strategy plugins (MultiIndicator, Permafrost/Ashfall). The Plugin Manager shows the current load order and warns about conflicts.

### Bybit API Endpoints Used

**Public**: `GET /v5/market/tickers` (bulk for the symbol universe, per symbol for criteria data), `GET /v5/market/recent-trade`, `GET /v5/market/kline`, `GET /v5/market/instruments-info`. **WebSocket**: `wss://stream.bybit.com/v5/public/linear` (position price stream). **Signed (live plugins only)**: `GET /v5/account/wallet-balance`, `GET /v5/position/list`, `POST /v5/order/create`, `POST /v5/position/trading-stop`, `POST /v5/order/cancel`. Signing: HMAC-SHA-256 via `crypto.subtle.sign`; 250ms minimum gap between signed requests.


---
