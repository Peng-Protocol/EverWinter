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

Every background/bulk fetch — bulk tickers, market watch, and any loaded plugin's kline/OC/liq/PEC batches — runs through a single per-bot scheduling queue (**Scan Scheduling** in Main Config) instead of firing all at once, which is what keeps the browser responsive with one bot open and workable with two. Execution-critical single-symbol calls (opening/closing/watching a position) bypass the queue entirely so order execution is never delayed behind background scanning.

For a tighter coupling than passive data-sharing, **Leader / Follower** (Main Config) lets one bot fully defer to the other: flip **Follow Partner Bot** on and that instance stops fetching bulk tickers, OC, liquidation surveillance, and kline/PEC data on its own, relying entirely on the partner's shared cache. The partner needs no toggle of its own — it's leader by default as long as it keeps completing scan cycles. If the partner goes quiet for two full scan intervals, the follower automatically resumes scanning independently, then steps back down the moment the partner's heartbeat returns — no manual re-arming either direction. The shared PEC/VSG cache (`pec_{granularity}_last`) is considered usable as long as it's from the current candle bar, regardless of which bot fetched it or how long ago within that bar — so a follower isn't limited to only the last few minutes of whatever the leader last published.

**Compatible with Permafrost/Ashfall.** Bulk tickers and OC defer through the same per-cycle shared read a following bot already uses with neither plugin loaded — nothing extra needed there.

In addition to the shared data pool, the Permafrost and Ashfall plugins maintain a separate cross-bot sample state (`__ew_sample_state_v1`) written after each structure cycle and read every 15 seconds. This state carries wave score, funding skew, OI skew, kline bar data, and liquidation cycle history. When one bot is in a drawdown halt or gains lock, its plugin reads the partner's sample to keep the Status Block bars, liq chart, and WAVE score line current — the halted bot's displays stay populated from the running partner's latest readings without opening any new entries.

---

## Menus

The UI has four views: **Market** (positions, scan controls, watchlist) plus three configuration/telemetry panels — **Config**, **Stats**, and **Trades**.

**Mobile** (≤768px): a bottom tab bar (⚙ Config · 📊 Market · 📈 Stats · 📌 Trades) switches between the four views full-screen, one at a time. Unchanged from earlier builds.

**Desktop**: Market is always the base view at full width. Config/Stats/Trades open as floating overlay panels on top of it via matching icon buttons (⚙ 📈 📌) in the topbar — no dedicated Market button, since it's never hidden. Config opens by default on launch; click its icon again (or any open overlay's icon) to dismiss it. The rest of Market dims behind whichever overlay(s) are open.

Each open overlay takes a third of the screen, docked left or right. Slot assignment follows opening order, not menu identity:
- First overlay opened → left slot. Second → right slot.
- Once both slots are full, opening a third (currently-closed) overlay replaces the **left** slot's occupant.
- Opening a fourth replaces the **right** slot's occupant — and it keeps alternating left/right on every subsequent replacement from there.

Two overlays can be open at once; a third click always bumps whichever slot is due next rather than stacking a third panel.

---

## Plugins

To load a plugin, open the **Plugin Manager** panel, click **Load Plugin**, and select the `.html` file. **A page reload is required after loading or removing any plugin** — the plugin pipeline runs once at page boot, so changes don't take effect until the next load.

Load order matters: live trading plugins (EverWinter, SunChaser) must load before strategy plugins (MultiIndicator, Permafrost/Ashfall). The Plugin Manager shows the current load order and warns about conflicts.

---

## EverWinter / SunChaser (Live Trading Plugins)

EverWinter turns PseudoWinter into a live short-only Bybit bot; SunChaser does the same for PseudoChaser as long-only. Both sign requests with the stored `__ew_creds`/`__sc_creds` API key and place real orders — the topbar reads **Very Real Orders** once loaded, in place of the base simulation's **No Real Orders**.

- **Balance**: fetched automatically the moment a valid key/secret pair is saved in the credentials panel, not only at page load.
- **Symbol banning**: a symbol is banned for a week if Bybit reports it as unsupported for trading, or blocked pending a required trading agreement (e.g. certain leveraged/inverse instruments) — either case needs the same manual action on Bybit's side before the symbol can trade again, so both are treated as a permanent block rather than retried every cycle.
- **Post-bail re-check**: after a bail sweep (manual Danger Zone bail or an automatic Drawdown Throttle bail), the plugin queries the exchange directly for any position still open in its own direction (Sell for EverWinter, Buy for SunChaser) and force-flattens it with a direct reduceOnly market order. This catches positions a bail's own close order failed to fully fill. It confirms the position is flat — it does not retroactively correct the PnL already recorded for that trade from the first close attempt.

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
| **Drawdown Throttle** (`drawdownThrottleEnabled`) | Halts new entries for a configurable duration (`drawdownHaltHours`, default 12h; free-entry field, no upper bound) when rolling 6h realized PnL drops below a loss threshold. The Halt tab shows a live readout of the current 6h rolling PnL and a **Clear 6hr Record** button (with confirmation) to zero the window manually — independent of any active halt. |
| **Drawdown Factor** (`drawdownThrottleFactor`) | Loss threshold as a multiple of entry margin. At 0.5× with $1 margin, $0.50 of rolling losses triggers the halt. |
| **Bail on Trigger** (`drawdownBailEnabled`, default on) | When on, triggering the Drawdown Throttle halt also immediately closes every open position at market (`bailAll()`) — the same sweep the Danger Zone's manual **Bail All Positions** button runs, and what the **BAIL** trade-card badge marks. MIW/MIC's Dead Switch (below) reuses this same toggle when it triggers the halt on its own idle-time condition. |
| **Gains Lock** (`gainsLockEnabled`) | Halts new entries for 12 hours once rolling 6h profit hits a target. Banks a winning streak before it reverses. Same 6h rolling PnL readout and **Clear 6hr Record** button as Drawdown Throttle, shown in its own section of the Halt tab. |
| **Gains Factor** (`gainsLockFactor`) | Profit target as a multiple of entry margin. Same scale as Drawdown Factor. |
| **Manual Halt** | Button (Halt tab) that blocks all new position entry indefinitely until manually lifted. Independent of Drawdown Throttle and Gains Lock — overrides both and doesn't stack with either. |
| **EDa / Laggard Check** (`laggardCheckEnabled`) | Enables the Effective Debt Adjusted system. Realized losses are passed forward to surviving positions, which take higher TP targets to recover the debt. **Requires the EDa-Winter / EDa-Chaser plugin** (`plugins/modes/`). |
| **TP Buffer** (`laggardProfitOffset`) | Extra TP headroom reserved above the functional target (%). The debt-free close happens at `tpPct ÷ (1 + buffer/100)` — at 50% buffer with an 18% TP slider, trades close at 12% without debt. Requires the EDa plugin. |
| **Ticker Cooldown** (`bulkTickerCooldownHours`) | How long the bot reuses a cached bulk ticker fetch before hitting the API again. Higher = fewer API calls per day. |
| **Whiplash Audit** (`whiplashEnabled`) | When on, the position watcher fetches 1-minute klines near TP to confirm whether price spiked through TP between watcher cycles. |
| **Whiplash Proximity** (`whiplashProximityPct`) | How close (%) to TP price triggers the kline audit. |
| **Runtime Limit** (`runtimeHours`) | Maximum position age. Forces a close at the deadline if TP hasn't been hit. |
| **Symbol Banlist** (`banlistEnabled`) | When on, symbols on the ban list are excluded from all scans. Entries expire after 7 days. |
| **Position Price Feed** (`restPollEnabled`) | When on, replaces the WebSocket price stream for open positions with periodic REST API calls. Use if the WS feed returns stale or incorrect prices. |
| **Price Poll Interval** (`restPollBaseSec`) | Base polling interval in seconds for REST mode. The interval doubles automatically when price moves less than 0.1% between ticks and resets to base on any meaningful move. |
| **Dispatch Every** (`schedIntervalMs`) | Minimum gap (ms, default 150) between successive background fetches dispatched from the scheduling queue. Lower = faster background data turnover, at the cost of more simultaneous requests. |
| **Max Concurrent** (`schedMaxConcurrent`) | Hard cap (default 4) on background fetches in flight at once, regardless of how many subsystems have work queued. |
| **Follow Partner Bot** (`lfFollowPartner`) | When on, this bot stops fetching bulk tickers, OC, liquidation surveillance, and kline/PEC data on its own and relies entirely on the partner's shared cache. The partner needs no toggle — it's leader as long as its heartbeat (written once per completed scan cycle) stays fresh, judged against 2× **Scan Interval**. Auto-resumes independent scanning if the partner goes stale, and steps back down the moment it returns. Also blocks this bot from opening a position on any ticker the leader already holds — checked at entry, before any instrument/price lookups. Compatible with Permafrost/Ashfall; see the Leader/Follower note under Setup. |
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

**Storage usage** (dropdown below Persistence, PseudoWinter/PseudoChaser only): breaks this bot's own localStorage footprint down to one row per data type — e.g. its own climate plugin's structure wave, liquidation samples, and OC samples each get their own row instead of one lumped figure, so a bloated data type is visible on its own. Only this bot's own keys and the genuinely shared/cross-bot ones are counted; the partner bot's private state, log, and plugin config are excluded entirely, not just relabeled — the browser gives every script on the same origin one shared quota, but this panel is scoped to "what this bot is responsible for," not the whole origin. Oversized rows are shown in red, each with a **✕** to clear that bucket on its own (single-key rows delete the whole key; the two bundled climate-plugin keys delete just that one field and leave the rest of the blob intact) — a confirmation prompt guards against accidental clicks. An **Export** link appears once expanded, downloading the same breakdown as a plain-text file. *(Fixed in v1.15.1/v1.19.1: the row map hadn't kept pace with the plugins — `__ew_af_dialpool_v1`/`__ew_pf_dialpool_v1`, `__ash_liq_sequester`/`__pf_liq_sequester`, and `__everwinter_kline_log_v1` had no row at all and were silently falling into an unlabeled, unclearable "Other" bucket, and the extremity scorecard row still pointed at the dead pre-rename key `__everwinter_scorecard_v1` instead of `__everwinter_extremity_v1`. This is why total usage could look far larger than the config export alone — the export was always correctly scoped to just cfg + positions, the usage screen just wasn't accounting for everything else it should have.)*

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

The trades panel shows a card for each closed trade, newest first. Each card carries a close-reason badge — **TP**, **SL**, **FORCE** (runtime limit), **BAIL** (drawdown throttle bail — closes every open position immediately, both bots), **EDa** (laggard debt-free close), or **Sub** (closed to free a slot for a higher-ranked candidate via MIW/MIC Substitution). Reasons introduced by other plugins show their own registered label, or the raw reason name if a plugin hasn't registered one. On EverWinter/SunChaser, a bail sweep is followed by a direct exchange re-check — see **EverWinter / SunChaser** below.

**Roll-up card**: when the closed trades list exceeds 50 entries, the oldest are compacted into a single roll-up card showing their net PnL, trade count, and the date range they cover. The roll-up is not a trade — it is a historical summary. In the PnL chart, the roll-up's net value acts as a baseline offset applied to every plotted point.

**PnL chart**: click the **PNL CHART** bar below the header to expand a cumulative PnL line chart. The X-axis spans from the first to the last individual closed trade at fixed spacing. The chart is green when the net result is positive, red when negative. The chart only appears once at least 2 individual trades are closed.

**CLEAR button**: removes all closed trades, resets session stats, and clears the 6hr drawdown/gains-lock rolling PnL windows. Clicking CLEAR reveals an inline confirmation ("Sure? Yes / No") before anything is deleted. Yes confirms; No cancels with no change.

---

## MultiIndicator Plugin (MIW / MIC)

The Multi-Indicator plugin filters entries using configurable criteria combinations called **slots**. Each slot is an AND-gate: all criteria in the slot must be true for a ticker to qualify. Any single matching slot opens the ticker for entry.

**No criterion is mandatory.** As of v1.80.0 liquidation is no longer a per-slot anchor — the liquidation family (`sliq`/`bliq`/`msliq`/`mbliq`/`0liq`/Past-1), PEC, VSG, Regime, `liqturnover` and `liqquiet` are all retired, along with the live liq-message entry path and the kline-shape fetch pipeline behind PEC/VSG. A slot (Auto or manual) qualifies on any combination of the criteria: `fund`, `va`, `ioa`, `ocs`, `ocx`, plus `lta` and `lpa` (added in MIW/MIC v1.82.0 with Permafrost/Ashfall v1.84.0 — seven in all). Entry is scan-driven only — one pass per bulk ticker fetch, no mid-cycle WebSocket trigger.

### Criteria

See Strategy_book.md's **Market Reading** section for what each criterion (`fund`, `va`, `ioa`, `ocs`, `ocx`, `lta`, `lpa`) means and when to use it. This section covers only tiering, recording, and fetch/caching mechanics — operational detail Strategy_book intentionally leaves out.

**Tier gate**: every criterion computes an integer tier as `floor(value / step)` and compares it against N. Current step sizes are shown as read-only chips under **Tier Step Sizes** on the Fetch tab. The same tier is recorded on the position and used as the scorecard key — `fund>1` and `fund+7` are different tiers and scored separately.

**Bare-form exception — `fund`**: in Auto mode, the un-thresholded bare form of each criterion (used when a slot names the criterion without a `>`/`<` comparison) normally still requires the tier to be nonzero. `fund`'s bare form is the one exception: it matches on any nonzero raw funding rate directly, not on the tiered value — real Bybit funding rates mostly sit well under a single **Fund Step**, so a tier gate on the bare form meant `fund` essentially never registered. The tiered forms (`fund>N`/`fund<N`) and the tier recorded on the position are unaffected.

**Funding emoji direction**: the position/trade badge shows 🤑 or 💸 for a `fund` tier, and the two bots deliberately show opposite emoji for the same raw funding sign. It's not encoding the raw sign — it's encoding whether that funding condition favors the bot's own direction: longs paying shorts shows 🤑 for Winter's shorts and 💸 for Chaser's longs; shorts paying longs is the reverse.

**Slot builder badge key**: the manual slot builder uses the same emoji set as position/trade badges:

| Badge | Criterion |
|---|---|
| 🤑/💸 | Funding tier; Winter/Chaser invert the emoji by whether the funding condition favors that bot's direction. |
| 🔊 | V/A, volume versus the population sample-window average. |
| 🎲 | IO/A, open interest versus the population sample-window average. |
| 🔭 / 📡 | OCS / OCX. |
| 🕐 | LTA, last completed hour's turnover versus the ticker's own average hour. |
| 💹 | LPA, last completed hour's price change versus every other ticker in the sample window. |

Emoji for retired criteria are still resolvable in `critEmoji`/`afCritEmoji` so old scorecard records, history and exports keep rendering — they are display-only and no longer match anything.

**OCS/OCX recording**: on entry —
- `ocs` records signed deviation-from-parity tiers, e.g. `ocs+12` = 62% buy-dominant, `ocs-8` = 42% buy / 58% sell. Unlike every other criterion here, this is an *accumulated* read, not a snapshot of the latest fetch: buy/sell fill counts are summed for that ticker across every retained OC cycle it appears in (up to 25 — the same rolling window OCX's population average draws from), not just the most recent one. A fresh live single-ticker sample (`_ocFetchSingle`, which never writes into cycle history on its own) folds into the accumulated total exactly once, without double-counting once a later batch fetch pushes that ticker into history for real.
- `ocx` records signed tiered percentage deviation from a full-window population average — `ocx+12` = this ticker's average inter-fill gap is running faster than the population average by 12 tiers (12 × step%; default 1%), `ocx-8` = slower by 8 tiers. OCX itself still reads only the latest batch's average interval against the population average — the accumulation above is specific to `ocs`.
- **The population average**: `_pfOcWindowAvgMs`/`_afOcWindowAvgMs` (Permafrost/Ashfall) flattens every retained OC cycle (up to 25), keeps only the latest reading per symbol across all of them, and averages the result — a stateless read over already-retained data, no new fetch or persistence.
- The recent-trade fetch only runs when a slot uses `ocs`/`ocx` (the 1h candle behind `lta`/`lpa` is a separate fetch, below); the sample covers up to 25 tickers drawn at random from this scan's own candidate pool (the fixed `ocCap` in `_micOpen`'s pool build — it is no longer sized by Permafrost/Ashfall's old Liq Batch Size, which no longer exists). A ticker missing from the sample simply fails the `ocs`/`ocx`/`lta`/`lpa` check; it doesn't block the rest of the pool.

**V/A / IO/A recording**: both are population-relative, following the same design as OCX:
- `va` records signed tiered percentage deviation of this ticker's 24h turnover from the population average — `va+12` = 12 tiers hotter than the sampled population (12 × step%; default 1%), `va-8` = 8 tiers colder.
- `ioa` records the same deviation for open interest value. Both read the ticker's own live `turnover24h`/`openInterestValue` directly off the ticker payload — no fetch needed for the per-ticker side.
- **The population average**: `_pfVolIoWindowAvg`/`_afVolIoWindowAvg` (Permafrost/Ashfall) — a sibling to `_pfOcWindowAvgMs`/`_afOcWindowAvgMs` above, sampled into the same tethered 25-cycle history alongside OC. When no slot needs `ocs`/`ocx`, the recent-trade fetch is skipped entirely and only vol/oi (free ticker data) is sampled into that same cycle entry, so `va`/`ioa` cost no requests of their own. As of v1.84.0 `_pfVolIoWindowAvg`/`_afVolIoWindowAvg` delegates to `_pfWindowStats`/`_afWindowStats` — one deduplicated latest-reading-per-symbol read of the retained window (`vol`, `oi`, `lta` or `lpa`), memoized per history state so scoring doesn't re-walk 25 cycles per candidate. `lpa` and the Sample Chart's Total average draw from the same read, so the number on screen is the number the criteria measure against.
- Megacap exclusion (which symbols are left out of this and every other population average) is covered under **Megacap Exclusion** in the Permafrost/Ashfall Config table below.

**LTA / LPA recording** (v1.82.0+): both read one last-completed 1h candle per ticker instead of the ticker payload, and both record signed tiers like the rest.
- `lta` records the signed percentage deviation of the last completed hour's turnover from the ticker's own hourly average (`turnover24h / 24`, `_pfLtaDev`/`_afLtaDev`) — `lta+12` = the last hour ran 12 tiers (12 × **LTA Step**; default 10%) above its own average hour, `lta-5` = 5 tiers below. A ticker is compared against itself, so there is no population baseline.
- `lpa` records the signed gap, in percentage points of 1h price change, between this ticker and the mean of every *other* ticker in the sample window (`_pfLpaWindowAvg(sym)`/`_afLpaWindowAvg(sym)` — latest reading per symbol, the scored ticker excluded), in tiers of **LPA Step** (default 0.25pp). Unlike the percentage-deviation steps above this one is absolute points: with a mean 1h move near zero a relative deviation is unstable. No tier is produced until at least one other ticker has an `hc` reading in the window.
- **Candle fetch**: `_pfHourCandle`/`_afHourCandle` calls `GET /v5/market/kline` at `interval=60&limit=3` and takes the row whose start equals the last completed hour (`_pfHourStart`); the still-forming candle is never used, since its partial-hour turnover would skew `lta` negative early in every hour. Results live in a memory-only per-symbol cache (`HOUR_CACHE`, pruned past 500 entries), so a ticker costs one request per hour however often it is resampled. Each batch attaches `ht` (hour turnover) and `hc` (hour change %) to that ticker's OC cycle entry, so the readings ride the same retained 25-cycle history and shared `ocResults` payload as everything else — a **Follow Partner Bot** instance gets them from the leader with no fetch of its own (`_pfHourReading`/`_afHourReading` prefers this hour's own cache, else the latest batch's record).
- The fetch runs on the same up-to-25-ticker sample as OC (`wantHr` on `_ocFetchBatch`) whenever `lta` or `lpa` is not excluded from Auto or is used by a manual slot — one kline request per uncached sampled ticker per scan, independent of `ocs`/`ocx`. Class-level `_miwHourTier`/`_micHourTier` turns a reading into a tier and returns `null` when data is missing, which the criterion check treats as false and the annotator as "no sample" rather than a fake `+0`.

**Entry veto**: every candidate's annotated criteria are passed through Permafrost/Ashfall's Lukewarm Scoring veto (`_pfExtremityVeto`/`_afExtremityVeto`) before the open goes through, independent of Slot Blocking — see **Extremity Scorer** below.

### Config

| Setting | What it does |
|---|---|
| **Enabled** (`miwEnabled`/`micEnabled`) | Master on/off. When off, the plugin opens no entries and runs no exits. |
| **Picks** (`miwPicks`/`micPicks`) | Max new entries per scan cycle (1–10). |
| **Share Cap** (`miwShareCapEnabled`/`micShareCapEnabled`) | Limits plugin entries to a percentage of `maxPos`. Prevents MIW/MIC from filling all position slots. |
| **Share Cap %** (`miwShareCapPct`/`micShareCapPct`) | The cap percentage. At 50% with maxPos=6, MIW/MIC can hold at most 3 positions. |
| **Tier Step Sizes** (`miwFundStep`/`miwVaStep`/`miwIoaStep`/`miwOcsStep`/`miwOcxStep`/`miwLtaStep`/`miwLpaStep` and `mic` equivalents) | Read-only chip group on the **Fetch** tab showing the current tier step size for `fund`, `va`, `ioa`, `ocs`, `ocx`, `lta`, and `lpa`. `va`/`ioa`/`ocx` steps are percentage-deviation-from-population-average steps (default 1% each), not raw units — see **V/A / IO/A recording** and **OCS/OCX recording** above. `lta` is a percentage deviation from the ticker's own hourly average (default 10%); `lpa` is absolute percentage points of 1h price change (default 0.25, shown as `pp`) — see **LTA / LPA recording** above. Not editable from the UI — change via config import if a different step is needed. |
| **Cascade** (`miwCascadeEnabled`/`micCascadeEnabled`) | Closes every open position — any strategy's, not only MIW/MIC's own — when their collective unrealized profit hits a threshold. Banks a group move before it reverses. Checked continuously by the position watcher (every 5s while the bot is running), not just once per scan, so a threshold crossed and reversed between scans is still caught. |
| **Cascade %** (`miwCascadePct`/`micCascadePct`) | Collective uPnL trigger as a % of base margin (minNotional ÷ leverage). |
| **Sacrifice** (`miwSacrificeEnabled`/`micSacrificeEnabled`) | Closes every open position — any strategy's, not only MIW/MIC's own — when their collective unrealized loss hits a threshold. Caps group drawdown. Same continuous position-watcher check as Cascade. |
| **Sacrifice %** (`miwSacrificePct`/`micSacrificePct`) | Collective uLoss trigger as a % of base margin (minNotional ÷ leverage). |
| **Dead Switch** (`miwDeadSwitchEnabled`/`micDeadSwitchEnabled`) | Idle-time trip, independent of PnL: if the plugin hasn't made a single new entry in **Idle Hours**, it triggers the host's Drawdown Throttle halt (same `drawdownHaltHours` duration) and, if the host's **Bail on Trigger** is on, bails the entire open book the same way an automatic Drawdown Throttle bail does. Checked once per scan, from plugin load time or the last entry, whichever is later. A no-op while a halt (manual or drawdown) is already active — it only starts a halt, never stacks or extends one. Requires a full **Idle Hours** of quiet from its *own* last trigger before it can fire again, not just from the last real entry — otherwise, whenever the halt duration is shorter than Idle Hours, it would immediately re-trigger the instant the halt cleared, since no entries could have happened during the halt to reset the clock. |
| **Idle Hours** (`miwDeadSwitchHours`/`micDeadSwitchHours`, default 1h) | How long Dead Switch waits for a new entry before tripping. |
| **Slot Blocking** (`miwSlotBlockEnabled`/`micSlotBlockEnabled`, `miwSlotBlockPct`/`micSlotBlockPct`) | A per-criterion loss circuit breaker. If a criterion's collapsed scorecard score — this bot's own trades only, see **Extremity Scorer** below — drops beyond the configured % of base margin (minNotional ÷ leverage) in loss, new entries carrying that criterion stop opening. No manual clear needed: the block lifts the moment a later own win recovers the score. With no liquidation anchor left to block on, this now works purely through **Include Sign Tags** below. |
| **Include Sign Tags** (`miwSlotBlockTags`/`micSlotBlockTags`) | Sub-toggle under Slot Blocking. When on, a losing score from any criterion selected in the **Blockable Criteria** picker directly below it blocks entries carrying that tag. |
| **Blockable Criteria** (`miwSlotBlockCriteria`/`micSlotBlockCriteria`) | Chip picker, same interaction as **Exclude from Auto**, listing all seven criteria as toggleable. Only shown when Include Sign Tags is on. Defaults on (fresh installs only — a saved selection is left as it is): `va`, `ioa`, `ocs`, `ocx`, `lta`, `lpa`. Default off: `fund` — it tends to sit in a similar band across most entries in a given environment, so blocking on it risks reacting to the environment rather than to the criterion's own performance. |
| **Substitution** (`miwSubstitutionEnabled`/`micSubstitutionEnabled`) | When no entry slot is free (maxPos or Share Cap reached), closes the worst-scoring held position — any strategy's, not only MIW/MIC's own — and opens the best fresh candidate instead, but only if the candidate's collapsed score exceeds the held position's *current* score by the configured Margin. A held MIW/MIC position's own score (`_miwLiveCompositeScore`/`_micLiveCompositeScore`) is recomputed live from its rolling-average criteria (see **Open-Position Rolling-Average Criteria** below) rather than the score frozen at entry — a position is judged on where it's actually drifted to, not where it stood when it opened. Requires Co-Qualifying Penalty (Permafrost/Ashfall) — without it, every score is 0 and Substitution never fires. |
| **Substitution Margin** (`miwSubstitutionMarginPct`/`micSubstitutionMarginPct`) | How much better the new candidate must score than the worst held position, as a % of base margin (minNotional ÷ leverage), before a swap happens. Prevents swapping on marginal score differences. |
| **Substitution Min Age** (`miwSubstitutionMinAgeMins`/`micSubstitutionMinAgeMins`) | Minimum minutes a position must be held before it becomes eligible to be substituted out. |
| **Re-entry Block Mode** (`miwReentryBlockMode`/`micReentryBlockMode`) | Defaults to **Winners + Losers**, which blocks a symbol from re-triggering for one bulk-ticker cooldown window after any close, win or loss. **Losers Only** lets a symbol that just closed in profit re-trigger immediately, blocking only a symbol that closed at a loss. |
| **Auto Slots** (`miwAutoSlots`/`micAutoSlots`) | Replaces the manual slot list with a minimum-gate qualifier: a ticker qualifies once it satisfies at least **Minimum Criteria per Slot** non-excluded criteria — not a fixed-size combination. Every criterion the ticker actually satisfies is captured and scored, not just enough to clear the floor. See `_miwAutoQualify`/`_micAutoQualify`. |
| **Minimum Criteria per Slot** (`miwAutoSlotSize`/`micAutoSlotSize`) | The floor (1–7), counted in criteria alone now that there's no anchor to reserve room for. At 1, a single true criterion qualifies the ticker — any others it happens to satisfy are still captured and scored. |
| **Exclude from Auto** (`miwAutoSlotExclude`/`micAutoSlotExclude`) | Criteria omitted from Auto's qualifying set entirely — never checked, never counted toward the minimum, never scored. Excluding more than `7 − Minimum Criteria per Slot` leaves Auto unable to ever reach its floor, and the plugin reports no active entry gate (`_miwAutoActive`/`_micAutoActive`). |
| **Force-Evaluate General Criteria** (`miwForceGeneralCriteria`/`micForceGeneralCriteria`, on by default) | Auto mode only. `fund`, `ocs`/`ocx`, `lta`/`lpa`, and `ioa` are expected to resolve for virtually any ticker once real data exists, but a match can end up missing one purely because that cycle's capped OC sample hadn't covered the ticker yet — not because it's actually false. When on, the scan-time open path (`_miwOpen`/`_micOpen`, via `_miwTopUpGeneralCriteria`/`_micTopUpGeneralCriteria`) re-checks them with a forced per-symbol fetch — only for the handful of tickers actually about to open, never the whole pool — and appends any newly-true criteria, then recomputes compositeScore over the expanded set. Never drops a criterion the original match already found. `ioa` needs no fetch at all and is unaffected either way — it's derived from the ticker snapshot plus the population window. `lta`/`lpa` fetch that symbol's 1h candle (`_pfHourCandle`/`_afHourCandle`) only when neither this hour's cache nor the leader's shared batch already has a reading for it. Costs a few extra requests per entry. Slot Blocking is re-checked against the topped-up criteria before the open goes through — a newly-appended criterion carrying a currently-blocked sign stops the open instead of opening anyway; entryPool's own check earlier in the cycle stays as the first, cheaper pass, this recheck is the one that has to hold once the final criteria list is set. On a following bot, this top-up is the one exception to Leader/Follower's no-own-fetch rule: it first checks the leader's shared OC cache as normal, and only if that cache genuinely has nothing for the entering symbol does it fetch that single symbol directly rather than opening with those criteria unscored. Scan-time pool building still defers entirely to the leader's shared data, as before. |

### Slots UI

**Manual mode**: click a slot to select it, then toggle criteria on/off in the picker row below. ✕ deletes the slot; `+` adds a new empty one. All seven criteria are tiered — clicking one opens its gate picker (direction plus tier) rather than toggling a bare tag. A slot with no criteria in it never matches.

**Auto mode**: replaces the manual builder with a minimum-slider and an exclusion chip row. A ticker qualifies on at least the chosen minimum of non-excluded criteria — every criterion actually true is scored, not just enough to clear the floor. The hint under the slider states the current floor as "qualifies on any N of M secondary criteria."

There are no mutually-exclusive pairs left in the criteria set: each of the seven is an independent signed tier, so any subset can be true for the same ticker at once and each contributes to the qualifying count on its own.

---

## Permafrost / Ashfall Plugin

Permafrost targets PseudoWinter; Ashfall targets PseudoChaser. Since v1.80.0 they are two things and nothing else: the **Extremity Scorer / Lukewarm Scoring** engine that decides which readings MIW/MIC is allowed to trade on, and the **cross-bot bus** that lets the two sides coordinate halts. Everything else has been cut.

**Removed in v1.80.0** — the whole WAVE tab (sampling bars, wave/structure chart, liquidation results chart, Collective FIO, Slope Window), the structure/wave halt-bias engine behind it (`_pfFetchStructure`/`_afFetchStructure`, `pfStatus`/`afStatus`, `pfWave`/`afWave`, `pfKlineBar`/`afKlineBar` and the gaussian kernel model), the climate-governed halt timing that fed off it, the Status Block, Liquidation Surveillance and everything built on it (Live Liq Relay, 0-Liq Sequester, Prospect Pre-Screening, PEC/VSG Universe Weighing), and Switchover. The bots' own stock halt timers govern halts again; the plugins only lift them (Mutual DDH Lift) or trigger them (Gains Continuation, and MIW/MIC's Dead Switch). Cross Broadcast is now always on and has no toggle. Order Count Surveillance moved into the Score tab. The panel is two tabs: **CROSS** and **SCORE**, with the Danger Zone (Export / Import / Clear Profile / Clear Plugin State) below them.

### Config

| Setting | What it does |
|---|---|
| **Permafrost / Ashfall Mode** (`permafrostEnabled`/`ashfallEnabled`) | Master toggle. |
| **Cross Broadcast** (`permafrostCrossEnabled`/`ashfallCrossEnabled`) | No longer a toggle — forced on. Writes cascade/sacrifice triggers, drawdown halt/gains-lock transitions and GC steps to a shared log (`__everwinter_cross_v1`, retained 30d) that the partner bot can read. Required for Mutual DDH Lift and Gains Continuation coordination. Cascade/sacrifice fires once per MIW/MIC collective-exit trigger — not once per position closed — tagged with the position count and collective PnL at the moment the trigger fired; a plain individual TP/SL close is not broadcast. A halt/gains-lock transition marker is normally only written the instant this bot's own state actually flips — but resuming into an already-active halt on page load (a mobile tab backgrounded/killed and restored mid-halt, a manual refresh) is deliberately *not* treated as a fresh transition, so on init the plugin instead checks whether the bus already shows this bot as halted; if not, it backfills the marker there and then, timestamped to the halt's real start (back-calculated from the restored halt-until time, not the moment of the reload) so Mutual DDH Lift's age comparison below still sees the halt's true age. |
| **Mutual DDH Lift** (`permafrostMutualDdLiftEnabled`/`ashfallMutualDdLiftEnabled`) | When both bots are simultaneously in drawdown halt or gains lock, lifts whichever side's halt started *earlier* — the newer halt is left standing, on the reasoning that it hasn't had any cool-down time yet while the older one already has. Checked every 15 s. Depends on each bot's own halt-start marker actually being on the shared bus — see the reload backfill note above. |
| **Gains Continuation (GC)** (`pfGcEnabled`/`afGcEnabled`) | Independent of the host's own Gains Lock: tracks this bot's rolling 6h closed-trade PnL and broadcasts a one-shot `gc` event each time it crosses a new step (**Step Size**, default 50% of base margin — high-water-mark, a step only re-fires after the window resets to ≤0 and climbs again). If the partner also has GC on and reads a step within the freshness window, it triggers a *full drawdown halt on itself* — a winning streak on one side is read as a signal for the other to step back rather than chase the same conditions. On by default; still requires GC on both bots, so an install running an older partner file is a no-op until both are updated. |
| **Step Size** (`pfGcThresholdPct`/`afGcThresholdPct`) | Size of one GC step as a % of base margin (minNotional ÷ leverage). The live hint shows the current dollar value per step. |
| **Freshness Window** (`pfGcFreshnessMult`/`afGcFreshnessMult`) | How many Scan Intervals a broadcast GC step stays actionable on the partner side (default 2×). |
| **Extremity Scorer** (`pfExtremityEnabled`/`afExtremityEnabled`) | The scoring engine, replacing the old flat Slot Scorecard entirely. Sorts each criterion's own sampled readings into extreme-high / lukewarm / extreme-low, scores which end closed profitably, and vetoes a candidate once too much of what it exhibits sits on the losing end. Criteria universe is `fund`, `va`, `ioa`, `ocs`, `ocx`, `lta`, `lpa` — see **Extremity Scorer** below. |
| **Extreme Split** (`pfExtremitySplitPct`/`afExtremitySplitPct`) | What share of a dial pole's sample, sorted by magnitude, counts as "extreme" (default 25%, range 5–45%). Lower = a stricter, more exclusive extreme band; higher = more readings qualify as extreme. The cutoff is recomputed per pole from its own sample. |
| **Min Samples** (`pfExtremityMinSamples`/`afExtremityMinSamples`) | Minimum sampled readings a dial pole needs before its extreme cutoff is trusted (default 3, range 3–30). Below this the pole has no proven cutoff and every reading on it counts as lukewarm. Because the pool samples live annotations rather than closes, a pole usually clears this within the first scan or two. Also the minimum per-family reading count Open-Position Rolling-Average Criteria (below) requires before trusting a position's rolling average over its frozen entry-time snapshot. |
| **Sample Cap** (`pfExtremitySampleCap`/`afExtremitySampleCap`) | Max retained magnitude readings per dial pole for cutoff computation (default 300). Oldest trimmed first. Config-only — no UI control. |
| **Lukewarm Veto** (`pfLukewarmRatioPct`/`afLukewarmRatioPct`) | Share of a candidate's dial-eligible criteria that must land on the *non-favored* side before the candidate is vetoed outright (default 70%, range 30–100%). Which side is favored is decided by Lukewarm Scoring itself, not by a toggle — the hint under the slider names the side currently being targeted. An unproven dial (below Min Samples) always counts against the candidate. |
| **Extremity Re-Evaluation** (`pfExtremityReEvalEnabled`/`afExtremityReEvalEnabled`) | At the end of every scan, checks each open position's rolling-average criteria (see **Open-Position Rolling-Average Criteria** below) against the *current* cutoffs and closes it, tagged **`Ext-Rvl`**, if it now crosses the same Lukewarm Veto bar it had to clear to open — held to the same standard for its whole life, not just at entry. Because it routes through the same veto, it follows the favored side automatically: when Lukewarm is the target it closes positions drifting into extreme territory, and vice versa. *(Fixed in v1.83.1/v1.81.1 — this was previously calling a function that was never defined anywhere in the codebase, so it silently fell back to comparing each position's frozen entry-time snapshot against itself and could never actually detect drift. It now reads a genuinely live rolling average instead — though the sampler feeding that average only actually recorded anything from v1.84.0/v1.82.0; see the annotator fix under **Open-Position Rolling-Average Criteria**.)* |
| **Sponge Quota** (`pfSpongeQuota`/`afSpongeQuota`) | How many recent closes per criterion feed the score build. Older records beyond this count are ignored. Lower = faster adaptation to recent performance; higher = more stable scores that smooth out short streaks. Caps contributions per criterion, not per slot. |
| **Stale Purge** (`pfStaleSlotDays`/`afStaleSlotDays`) | Slots with no new close in this many days are fully removed from the scorecard on the next trim. Plain number field, no upper bound. Freshness is per exact criteria combination. |
| **Co-Qualifying Penalty** (`pfCoQualPenaltyEnabled`/`afCoQualPenaltyEnabled`) | Scores each candidate by summing its matched criteria's collapsed scores, so historically-losing criteria drag a ticker down the entry queue. In manual-slot mode it additionally deducts for every further slot the ticker qualifies for that carries a negative collapsed score (positive co-qualifying slots do not boost). In Auto mode there is only one canonical match set per ticker, so the sum over that set *is* the composite. Also required by MIW/MIC Substitution — without it every score is 0 and no swap ever fires. |
| **Depth Multiplier** (`pfCoQualDepthPct`/`afCoQualDepthPct`) | Scales every criterion's collapsed score by how far past that slot's own gate threshold the ticker qualifies, not by the raw tier value. E.g. a criterion scoring +$0.50 historically is applied as +$0.70 for a ticker qualifying 4 tiers past its slot's threshold at 10%/tier. Works the same in reverse — a losing criterion is penalised harder the deeper past threshold the ticker qualifies. Depth is direction-aware: for a `<` gate (`va<N`, `ioa<N`, `ocx<N`) a *lower* measured value is the deeper match. Range 0–50%. |
| **Order Count Surveillance** (`pfOcEnabled`/`afOcEnabled`) | Samples up to 25 tickers from MIW/MIC's scan candidate pool each cycle. Recent trades are fetched when a slot needs `ocs`/`ocx`, and each ticker's last-completed 1h candle when a slot needs `lta`/`lpa`; the same cycle history carries the 24h-turnover and open-interest samples `va`/`ioa` compare against — with none of those needed, no network fetch runs and only that free ticker data is sampled. Each OC fetch is a fresh, independent snapshot. Published to the shared cross-bot registry each cycle, so a **Follow Partner Bot** instance (which runs no OC fetch of its own) seeds its own OC results and cycle history from the leader's latest sample instead of going without. |
| **OC Order Limit** (`pfOcOrderLimit`/`afOcOrderLimit`) | Recent trades fetched per ticker per scan cycle (10–500). Buy/sell skew and average order interval are both computed from this single sample. |
| **Megacap Exclusion** (`megacapExclude`) | Array of symbols excluded, alongside BTC, from every population average this plugin builds and from MIW/MIC's own scan pool. Default `BTCUSDT`/`ETHUSDT`/`SOLUSDT`/`BNBUSDT`/`XRPUSDT`/`DOGEUSDT`/`ADAUSDT`/`TRXUSDT`/`LINKUSDT`. Seeded on first load by whichever of the four plugins loads first — shared by key name so all stay consistent. Not editable from the UI — change via config import if the list needs to change. |

### Partner Feed

The Cross tab shows a scrollable **Partner Feed** listing the last 20 events the partner bot has broadcast: cascade/sacrifice triggers, DDH start/lift, gains-lock start/lift, and GC steps. Each row shows a kind-specific detail — position count and collective PnL for cascade/sacrifice, PnL and step number for GC, symbol for a rolling sacrifice — and a UTC timestamp, date-prefixed for anything not from today. Empty until the partner has broadcast at least one matching event.

Useful for diagnosing Mutual DDH Lift and GC when a lift isn't firing as expected: both depend on their prerequisite broadcast actually reaching the bus and being read fresh. If the feed shows a `ddh-start` (or a `gc` step) from the partner but the corresponding lift never follows on this bot, the broadcast side is working and the problem is on the receive side — freshness window, own-side toggle, or the read loop — rather than the trigger itself never having fired.

### Sample Chart

Below the Score tab's scoreboard, a per-ticker bar chart of the OC cycle history, scrollable through past cycles, with two header buttons that step through the views **OC → Vol → IO → LTA → LPA** (v1.84.0). Each button is labelled with the name of the view it goes to — previous on the left, next on the right — and wraps around at either end; the chart title names the current view (`_pfOcViewName`/`_pfOcCycleView`). Every view reads the same underlying cycle history — see **V/A / IO/A recording** and **LTA / LPA recording** in the MultiIndicator section — just a different field each. Selection isn't persisted across reloads; it resets to OC. Only appears when Order Count Surveillance is on and at least one sample has been taken.

- **OC** (default): average seconds between orders (orderbook velocity) — a slower/quieter ticker draws a taller bar, busier/faster draws shorter. Two lines below the chart: **Total** (buy/sell skew summed over every retained cycle — the same accumulation `ocs` reads — plus the population average interval `ocx` measures against, `_pfOcWindowAvgMs`/`_afOcWindowAvgMs`) and **Batch** (the displayed cycle's own skew and mean interval, stamped with the cycle time when one is pinned). Order and ticker counts are deliberately not shown — the batch is a fixed-size sample. Each ticker chip shows only its dominant side and a bare interval (`PROVE B77 4.4s`, the other side is implicit); the full fill counts and `s/order` stay in the hover title, and a tap/click expands that chip in place for touch screens (`_pfOcExpandedSym`). Chip styling reads the chart's two measures separately: the **outline** lights up when the ticker's interval is faster than the batch mean (the same test the bar shading uses; intervals past the 12s cap never qualify), and the **body** fills when its skew leans to the bot's own side — buy on Chaser, sell on Winter — so a chip can show either, both, or neither. Order count is not compared, since every ticker samples the same number of trades (`_pfOcInfoHtml`/`_afOcInfoHtml`). Tickers averaging over 12s/order are left off the chart so a handful of illiquid outliers don't stretch the axis — they're still fully eligible for `ocx`/`ocs` and still appear in the chip list below.
- **Vol** / **IO**: the tethered 24h-turnover and open-interest samples, with a **Total avg** line (mean of every ticker's latest reading across the retained window — `_pfWindowStats`, the number `va`/`ioa` measure against — plus the ticker count behind it) above a **Batch avg** line for the displayed cycle, both formatted compactly (e.g. `$1.2M`). No outlier cap — these are the same population-relative values `va`/`ioa` compare against, so nothing is hidden from the chart that the criteria themselves can see.
- **LTA** / **LPA**: signed views — the last completed hour's turnover deviation from the ticker's own hourly average (%), and its 1h price change (%). Bars grow up or down from a zero line, and the axis is symmetric, sized to 1.3× the 95th percentile of |value| so one runaway ticker pins to the edge instead of flattening everyone else. Same Total/Batch avg lines as Vol/IO (LPA's Total includes every ticker; the criterion itself leaves the scored ticker out). Only tickers with a candle reading in a cycle appear.
- Each cycle group is stamped with its sample time (HH:MM) and clickable — clicking one pins the summary and chip list to that cycle's per-ticker data. Clicking anywhere outside returns to the latest cycle.
- Records left over from the pre-redesign OC system (a single raw order number instead of the buy/sell split) are purged from stored history automatically on load and on profile import.

### Extremity Scorer

*(Still referred to informally as "the scorecard" elsewhere in this doc and in the UI's own pill labels.)*

**Core idea**: each criterion is a **dial family** — `fund`, `va`, `ioa`, `ocs`, `ocx`, `lta`, `lpa` — with two poles, `+` and `-`, scored independently. Cutoffs are computed first, from the sample pool (`pfDialSamplePool`/`afDialSamplePool`) and independent of closed trades entirely: for each pole with at least **Min Samples** readings, the cutoff is the magnitude sitting at the **Extreme Split** percentile of that pole's own observed spread. A reading at or above its pole's cutoff classifies **extreme**; anything below it, and everything on an unproven pole, classifies **lukewarm**. The pool is fed by `_pfDialSample`/`_afDialSample` on *every* criterion annotation the scan produces — not just the ones that become trades — which is what lets a dial prove a cutoff long before its first close, and it persists to its own key (`__ew_pf_dialpool_v1`/`__ew_af_dialpool_v1`) so a reload doesn't force every dial back to unproven. Bare Blind-Entry/Liquid-Diver sign-only tags (`+fund`/`-fund`/`+ocs`/`-ocs`) carry no magnitude and always classify extreme — there's nothing to be lukewarm about.

Closed records are then walked once, and feed two parallel tallies:

- **The dial tally** — extreme occurrences only, scored into that pole's win/loss/PnL. This is the flat `micCollapsedSlotRanks`/`micCollapsedCritStats` lookup MIW/MIC's Slot Blocking, Co-Qualifying Penalty and entry ordering read; its shape is unchanged, and those call sites have no idea dials or poles exist beneath it.
- **The Lukewarm Scoring tally** — *every* occurrence, extreme or lukewarm, bucketed by classification and then by dial pole (`fund+`/`fund-`, `va+`/`va-`, etc. — not merged by family; a family's two poles are opposite signals, v1.80.1+). This is what decides which side the veto targets.

**Open-Position Rolling-Average Criteria** (v1.83.0+, fetch fix v1.83.1, annotator fix v1.84.0/v1.82.0): a closed trade's record no longer scores the criteria tag frozen at entry (`_miwCriteria`/`_micCriteria`, or Blind-Entry/Liquid-Diver's `_bewCriteria`/`_becCriteria`/`_ldwCriteria`/`_ldcCriteria` — still kept on the position as the fallback below). Instead, `_pfPositionCriteriaSample`/`_afPositionCriteriaSample` re-reads each open position's locked criteria families every scan cycle and keeps a rolling 24h average per family — locked families never change after entry (that's what defines the slot it opened under), only the observed magnitude is re-sampled. This is its own fresh per-symbol ticker fetch each scan, not a read off the (potentially hours-stale, per **Ticker Cooldown**) bulk snapshot, so it actually tracks drift instead of resampling the same cached number; `ocs`/`ocx` families likewise force their own fresh OC sample rather than waiting for the next scheduled batch. Neither fetch is gated behind Leader/Follower's no-own-fetch rule — same handful-of-open-symbols exemption Force-Evaluate General Criteria's own fetch loophole already uses. `_pfPositionAvgCriteria`/`_afPositionAvgCriteria` reconstructs the tag from the average at read time, falling back to the frozen entry-time tag for any family with fewer than **Min Samples** readings (a position that closes fast simply hasn't had enough scans to average). This average — not the entry snapshot — is what gets scored on close, what Extremity Re-Evaluation checks above, and what MIW/MIC Substitution reads for a held position's live score (see **Substitution** above). Runs every scan regardless of whether MIW/MIC has an active entry slot, since a position can outlive its own slot config. Does not touch `pfDialSamplePool`/`afDialSamplePool`'s cutoff-derivation sample pool, which still samples instantaneous per-scan readings exactly as before. `lta`/`lpa` families make sure the ticker's 1h candle is cached (`_pfHourCandle`/`_afHourCandle`) before reading it.

*(Fixed in v1.84.0/v1.82.0 — through v1.83.1/v1.81.1 the sampler read each family off `this._miwAnnotateCritRaw`/`this._micAnnotateCritRaw`, which only existed as a local const inside `runScan`; the optional call returned `undefined`, no sample was ever recorded, and every position fell back to its frozen entry snapshot. The annotator is now a class method shared by scan-time pool building, `_miwOpen`/`_micOpen` and this sampler, so closes, Extremity Re-Evaluation and Substitution now really run on the rolling average.)*

**Lukewarm Scoring** (replaces the old manual Lukewarm Targeting toggle): the two buckets are totalled in dollars, and whichever is ahead becomes the favored side (`_pfLukewarmFavoredSide`/`_afLukewarmFavoredSide`). Ties — including 0 vs 0 before either bucket has data — default to **extreme**, the original always-avoid-lukewarm behavior, until the data says otherwise. The decision is re-made every time the scorer rebuilds, off the same scoreboard the panel shows, so a regime change that flips which end of the spectrum pays flips the target with it and nothing needs toggling by hand.

**Lukewarm Veto**: `_pfExtremityVeto`/`_afExtremityVeto` walks every dial-eligible criterion a candidate actually exhibits, counts what share lands on the non-favored side, and vetoes the candidate once that share reaches **Lukewarm Veto**%. An unproven dial counts against the candidate, same as a genuinely non-favored reading. This is a qualification veto, not a per-criterion block: MIW/MIC checks it on every entry regardless of whether Include Sign Tags is on.

**Pill display**: two bucket cards, **EXTREME** and **LUKEWARM**, each headlined by its aggregate dollar record — the direct read on which side has actually been paying — with a small pill nested inside for each dial pole that contributed, showing that pole's emoji (sign-suffixed — `💸+`/`🤑-` for fund, `+`/`-` suffix on the rest), PnL and W/L within that bucket. **Purple PnL text** on a small pill marks a criterion currently contributing to a Slot Blocking pause. Only shown when MIW/MIC (or Blind-Entry / Liquid-Diver) is both loaded and enabled.

**Own-trades-only** (v1.82.0) — Permafrost's and Ashfall's scorecards are fully independent of each other. Earlier builds (v1.81.x) tried folding the partner bot's inverted PnL into a combined figure with a Combined/Own toggle; this was removed after repeated attempts (sign convention, then a shared cutoff pool) still couldn't keep the two sides' totals reliably mirrored in practice, so cross-bot reading was dropped entirely rather than continuing to patch it. Every figure on the panel now reflects this bot's own trades only, unconditionally.

**CLEAR** wipes this bot's own closed-record store (`__ew_pf_extremity_v1`/`__ew_af_extremity_v1`) *and* its own sample pool (`__ew_pf_dialpool_v1`/`__ew_af_dialpool_v1`) together — a full reset, cutoffs included, unlike the pre-v1.82.0 behavior where the pool survived a CLEAR. Only ever touches this bot's own two keys; never the partner's. Cutoffs and every score built on them are otherwise rebuilt once per scan cycle rather than only on a close, config change or import, so the panel stays current as new samples land between closes.

**Win/loss counts can appear high** — this is normal. A criterion shared across many slots accumulates records from all of them, and the Sponge Quota caps contributions per criterion rather than per slot, which is what makes the scorecard responsive.

## Randomized Outcomes

Multiple instances of the bot running simultaneously will naturally diverge in behavior:

- Scan timing drifts independently per tab, so two instances launched minutes apart will hit different market states even with identical config.
- Several data inputs are drawn randomly each cycle: the sample of tickers used to compute market breadth (red/green candle tally) and the batch of tickers watched for live liquidation flow both pull from different random subsets each time. (VSG no longer contributes to this list — it rides PEC's deterministic liq-fresh pool rather than a randomized broad scan.) The liquidation-flow batch stops being random once Permafrost/Ashfall's **Prospect Pre-Screening** is on — its non-sequestered fill is then ranked deterministically by that bot's own scorecard, so two instances with Pre-Screening on and identical scorecards will tend to converge on the same candidates rather than diverge, up to whatever timing drift (below) still separates them.

The practical effect is that no two instances share the same entry triggers, exit timing, or structural reading at any given moment — even when configured identically. This is intentional. Instances that move in lockstep are easier to front-run and more likely to cluster losses at the same market event. Divergence distributes risk across slightly different entry points and market reads without requiring any coordination between instances.

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
| `__ew_shared_v1` | Cross-tab shared data registry (bulkTickers, watchTickers, klines_1h, klines_1h_last, pec_{granularity}_last, liqResults, ocResults, hb_chaser/hb_winter — Leader/Follower heartbeats, pos_chaser/pos_winter — each bot's currently open symbol list, resynced each heartbeat) |
| `__everwinter_cross_v1` | Cross-bot event log written by Permafrost/Ashfall's **Cross Broadcast** — cascade/sacrifice triggers (one per MIW/MIC collective-exit event, with position count and collective PnL), drawdown halt/gains-lock start/end transitions, GC steps, live liquidation events, and 0-Liq wins, each tagged with its source bot. Read every 15 s by the partner for Mutual DDH Lift's age comparison, GC's freshness check, and the Cross tab's **Partner Feed** display. Halt markers are retained 30 days (drawdown/gains-lock hours are user-configurable and have been seen well past 24h in practice), but that alone doesn't bound the bucket's size — most event kinds (0liq-win, gc) only need minutes to hours, not 30 days. Backstopped by a 200KB byte cap, oldest event evicted first regardless of kind, same pattern and size as `__ew_shared_v1` below. |
| `__ew_sample_state_v1` | Cross-bot sample state written by Permafrost/Ashfall after each structure cycle. Contains `state.winter` and `state.chaser` — each carrying waveScore, fundSkew, oiSkew, klineBar, and liqHistory. Read every 15 s by the partner bot to keep displays current during halts. `liqHistory` is a transit copy capped to the most recent 48 entries (~48h, since batches close hourly) — it only needs to cover the gap left by however long the partner was actually halted, not that bot's full own liquidation-sample history (which is independently, separately persisted under its own key — see `__pf_liq_history`/`__ash_liq_history` below). |
| `__pf_liq_batches` | Permafrost active liq batch snapshots (for reconnect on reload) |
| `__ash_liq_batches` | Ashfall active liq batch snapshots |
| `__pf_liq_sequester` | Permafrost 0-Liq sequester membership (symbol → last-qualified timestamp) |
| `__ash_liq_sequester` | Ashfall 0-Liq sequester membership |
| `__permafrost_winter_v1` | Permafrost profile: events, samples, wave history |
| `__ashfall_chaser_v1` | Ashfall profile |
| `__everwinter_extremity_v1` | Legacy Extremity Scorer store — cross-bot-shared through v1.81.x, since replaced by two private per-bot keys (see below). Kept around only as a one-time migration source: each bot's `_pfScoreRead`/`_afScoreRead` checks its own new private key on first read after upgrading, and if that key has never been initialized, pulls its own records (matching `source: 'winter'`/`'chaser'`) out of this key so existing history survives the split instead of resetting to empty. Neither bot ever writes to or deletes this key going forward; safe to leave in place indefinitely or clear manually once both bots have confirmed migration. |
| `__ew_pf_extremity_v1` | Permafrost-Winter's own Extremity Scorer closed-record store (v1.82.0+, own-scores-only). Each close is one record; each slot retains up to the Sponge Quota most recent records. Not read or written by Ashfall. |
| `__ew_af_extremity_v1` | Ashfall-Chaser's equivalent of `__ew_pf_extremity_v1`. Not read or written by Permafrost. |
| `__ew_af_dialpool_v1` | Ashfall-Chaser's Extremity Scorer sample pool (`afDialSamplePool`) — raw per-dial-family magnitude readings that cutoffs are derived from, fed by every criterion annotation the scan produces regardless of whether it becomes a trade. Deliberately separate from `__ew_af_extremity_v1` (which only holds closed-trade records) and NOT shared with Permafrost — each bot's own live read of the market builds its own pool (v1.82.0 reaffirmed this after a brief v1.81.2 experiment shared it across both bots, which broke down in practice). Capped per family (see the cap comment near its declaration); loaded explicitly in `init()`, not lazily. |
| `__ew_pf_dialpool_v1` | Permafrost-Winter's equivalent of `__ew_af_dialpool_v1` (`pfDialSamplePool`). |
| `__everwinter_kline_log_v1` | Persistent, byte-capped (1.5MB) candle log for Permafrost/Ashfall's PEC/VSG Universe Weighing, keyed by granularity bucket (`15m`/`1h`/`3h`) so the two bots stay correct even if configured with different PEC Granularity. Deliberately separate from `__ew_shared_v1` — that registry's cap (200KB) is sized for small recent-snapshot caches, not a full-universe candle history. Evicts whole symbols, oldest-last-seen-first, once near cap. |
| `__miw_hist_batches` | Legacy MIW key now used only to retain `fundSkew` (last funding sample bar state); historical-scoring batches/locks are no longer written. |
| `__mic_hist_batches` | Legacy MIC key now used only to retain `fundSkew`; historical-scoring batches/locks are no longer written. |
| `__ew_creds` | EverWinter live plugin API credentials |
| `__sc_creds` | SunChaser live plugin API credentials |

### Cross-Tab Data Pool

Both bots share market data via `localStorage.__ew_shared_v1` and `BroadcastChannel('ew_shared')`. Writes are last-write-wins per data type. Either bot operates normally solo — the registry is simply absent and all ladder checks fall through to normal fetches.

Each bot publishes its own open-symbol list to this registry on every position open/close, and resynced once more per heartbeat as a safety net for close paths that bypass `pseudoClosePosition` (e.g. the gap-fill audit). A following bot (`lfFollowPartner` on, partner heartbeat fresh) checks the leader's published list before opening and skips any ticker the leader already holds; the leader itself never checks its own publish. Because the check is gated on `_lfIsFollowing()`, it disables itself automatically the instant the leader's heartbeat goes stale — no separate expiry logic on the position data itself.

Not every `BroadcastChannel('ew_shared')` message carries a `localStorage.__ew_shared_v1` write behind it, though most do (`_sharedWrite`/`_sharedMerge` post a change notification after writing). `registerSharedMessageHook` is the general subscription point either kind of push is dispatched through on the receiving end.

### Plugin Transform Pipeline

```
pw()  →  plugin[0].transform(def)  →  plugin[1].transform(def)  →  ...  →  Alpine
```

Each plugin's `transform(def)` receives and returns the component definition. Load order matters for method wrapping — strategy plugins must declare `after: ['everwinter']` / `after: ['sunchaser']` so live-trading plugin wraps are innermost.

### Bybit API Endpoints Used

**Public**: `GET /v5/market/tickers`, `GET /v5/market/kline`, `GET /v5/market/instruments-info`. **WebSocket**: `wss://stream.bybit.com/v5/public/linear` (liquidation feed). **Signed (live plugins only)**: `GET /v5/account/wallet-balance`, `GET /v5/position/list`, `POST /v5/order/create`, `POST /v5/position/trading-stop`, `POST /v5/order/cancel`. Signing: HMAC-SHA-256 via `crypto.subtle.sign`; 250ms minimum gap between signed requests.


---
