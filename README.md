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
| `plugins/analytics/Still-Water.html` | Scoring, sampling, forecasting and cross-bot layer for both Pseudo bots. Shown as **Ashfall** on PseudoChaser and **Permafrost** on PseudoWinter |
| `plugins/strategies/MultiIndicator.html` | Entry filter plugin for both Pseudo bots (reads Still-Water) |

---

## Setup

Open any `.html` file directly in a browser. No build step, no server, no installation. Alpine.js and Bootstrap 5 are loaded from CDN — an internet connection is required on first load (cached after that).

To trade proactively, run `PseudoChaser` (longs only) or `PseudoWinter` (shorts only) with `Still-Water` and then `MultiIndicator` loaded; the same two files work on both bots. **Side check:** a plugin built for the other bot no longer refuses to load. Each plugin declares `targetBot` (`pseudowinter`, `pseudochaser` or `both`); if it names the other bot, it loads and runs anyway and its Plugin Manager card shows a yellow ⚠ warning (also logged once on load). A plugin that declares `both` (any case), or declares nothing, never shows the warning. ([more](#general-details))

**Load order**: EverWinter / SunChaser first (if live), then **Still-Water**, then **MultiIndicator**. MultiIndicator declares Still-Water as required and won't run without it. **Upgrading from the separate plugins**: remove Ashfall-Chaser, Permafrost-Winter, MultiIndicator-Chaser and MultiIndicator-Winter, then load the two merged files. Still-Water moves this side's saved `af*`/`pf*` settings to `sw*` and its stored data to the new keys once; MultiIndicator moves Winter's `miw*` settings and position tags to `mic*`.

---

## EverWinter / SunChaser (Live Trading Plugins)

EverWinter turns PseudoWinter into a live short-only Bybit bot; SunChaser does the same for PseudoChaser as long-only. Both sign requests with the stored `__ew_creds`/`__sc_creds` API key and place real orders — the topbar reads **Very Real Orders** once loaded, in place of the base simulation's **No Real Orders**.

### Order Handling (Open / Close tabs)

The plugin's accordion has three tabs: **API** (credentials), **Open** and **Close**. 

**Limit** here means a limit priced through the last price by the **Limit offset** (default 0.1%), so it normally fills like a taker; a negative offset makes it passive. **Market** sends a market order (IOC for entries, reduce-only IOC for closes). A **try** is one limit order, cancelled and repriced off a fresh last price if it doesn't fill. ([more](#general-details))

**Open and Close tabs** (the Close tab applies to every bot-initiated close: manual, runtime, cascade/sacrifice, bail sweeps and the post-bail re-check; exchange-native TP/SL closes are filled by the exchange and aren't affected)

| Setting | Open tab | Close tab |
|---|---|---|
| **Order type** (`ewOpenType`/`scOpenType`, `micCloseType`; default Limit) | Limit or Market entry. | Limit or Market (reduce-only) close. |
| **Limit offset** (`micOpenOffsetPct`/`micCloseOffsetPct`, default 0.1) | Distance through last price, in %. | Same. |
| **Limit tries** (`micOpenTries`/`micCloseTries`) | Default **1** (1–20): limit attempts before the fallback, or giving up. | Default **10** (1–100): reduce-only limit attempts before the fallback. |
| **Fall back to market** (`micOpenFallback`/`micCloseFallback`, default **on**) | After the limit tries go unfilled, send one market order. Off: give up and put the symbol on cooldown. | After the limit tries go unfilled, close with a reduce-only market order, repeated until flat. Off: keeps repricing the limit until the position is flat; a close never gives up. |
| **Fill timeout per try** (`micFillTimeoutMs`, default 10 s) | How long each limit try waits for a fill before it's cancelled. | n/a |
| **Cooldown after failed open** (`micFillCooldownMs`, default 15 min) | How long a symbol is skipped after an entry that placed an order but never filled. A rejected order doesn't trigger it. | n/a |
| **Reprice interval** (`micCloseRetryMs`, default 10 s) | n/a | Time between close tries. After the fallback, market closes repeat at most every 4 s. |

With the defaults, an entry that doesn't fill on its first limit goes to market, and a close that hasn't filled after ten limit tries (about 100 s) goes to market.

---

## Main Config

Changes take effect immediately and are persisted to localStorage automatically.

| Setting | What it does |
|---|---|
| **Scan Interval** (`scanMins`) | How often (minutes) the bot runs a full market scan. Controls both entry frequency and the scan bar in the UI. Can be changed while the bot is running (PseudoWinter/PseudoChaser): the interval is frozen when each cycle starts, so an edit applies from the next cycle and never fires or shifts the current one. |
| **Max Positions** (`maxPos`) | Maximum simultaneously open positions. No new entries open once this is reached. |
| **Max Cond. Orders** (`maxCond`, default 30) | Maximum pending conditional-limit entries ([Conditional Orders](#conditional-orders)). Counted separately from **Max Positions**; no new cond. order is accepted once it is reached. |
| **Leverage** (`leverage`) | Position leverage. Affects order size, TP/SL prices, and EDa thresholds. |
| **Min Notional** (`minNotional`) | Base margin per position in USDT. Actual order size = minNotional × leverage. |
| **Entry TP** (`entryTpRoi`, default 50%) | Take-profit ROI % target. When EDa is active this is the buffered target — the debt-free close happens at a lower percentage. In DCA Mode this is also the base the per-stage TP ladder scales down from (entry TP ÷ (stage+1), min 3%). |
| **Binary Mode** (`binaryModeEnabled`) | On: every position gets a take-profit and a stop-loss at entry and no DCA adds (`binaryTpPct`/`binarySlPct`, both default 50%). Off: multi-stage DCA. Add orders trigger below entry (PseudoChaser) or above it (PseudoWinter), each with a lower TP ROI target, and the stop-loss (`dcaSlPct`, default 16%) only arms once every first-wind DCA stage has filled. The DCA config controls need the `dca-long`/`dca-short` plugin (`plugins/modes/`); the binary and DCA logic itself is in the base bot either way. |
| **DCA Stages** (`dcaStages`, default 1) | Number of DCA add orders (1–6 in the plugin slider). Each stage has its own trigger slider (`dcaAddPct1`mic`dcaAddPct6`, defaults 3 / 6 / 12 / 18 / 24 / 30), set as % below entry for PseudoChaser or above entry for PseudoWinter, and only the sliders for selected stages appear. Triggers always increase by stage: lowering one stops at the previous stage's trigger, and raising one pushes the later stages up. Configs saved before per-stage triggers (a fixed 1.5%, then +3% per stage for non-3 stage counts) are migrated on load/import so they keep the same trigger prices. |
| **DCA Add Notional** (`addNotional`) | Margin (USDT) added per DCA stage — separate from **Min Notional**, which only sizes the initial entry. |
| **Drawdown Throttle** (`drawdownThrottleEnabled`) | Halts new entries for `drawdownHaltHours` (default 12h, free-entry field with no upper bound) when the rolling 6h realized PnL falls below a loss threshold. The Halt tab shows the live 6h rolling PnL. Its **Clear 6hr Record** button (with confirmation) zeroes that window manually, whether or not a halt is active. |
| **Drawdown Factor** (`drawdownThrottleFactor`) | Loss threshold as a multiple of entry margin. At 0.5× with $1 margin, $0.50 of rolling losses triggers the halt. |
| **Bail on Trigger** (`drawdownBailEnabled`, default on) | When on, triggering the Drawdown Throttle halt also immediately closes every open position at market (`bailAll()`) — the same sweep the Danger Zone's manual **Bail All Positions** button runs, and what the **BAIL** trade-card badge marks. |
| **Gains Lock** (`gainsLockEnabled`) | Halts new entries for 12 hours once rolling 6h profit hits a target. Banks a winning streak before it reverses. Same 6h rolling PnL readout and **Clear 6hr Record** button as Drawdown Throttle, shown in its own section of the Halt tab. |
| **Gains Factor** (`gainsLockFactor`) | Profit target as a multiple of entry margin. Same scale as Drawdown Factor. |
| **Manual Halt** | Button (Halt tab) that blocks all new position entry indefinitely until manually lifted. Independent of Drawdown Throttle and Gains Lock — overrides both and doesn't stack with either. |
| **EDa / Laggard Check** (`laggardCheckEnabled`) | Enables the Effective Debt Adjusted system. Realized losses are passed forward to surviving positions, which take higher TP targets to recover the debt. **Requires the EDa-Winter / EDa-Chaser plugin** (`plugins/modes/`). |
| **TP Buffer** (`laggardProfitOffset`) | Extra TP headroom reserved above the functional target (%). The debt-free close happens at `tpPct ÷ (1 + buffer/100)` — at 50% buffer with an 18% TP slider, trades close at 12% without debt. Requires the EDa plugin. |
| **Ticker Cooldown** (`bulkTickerCooldownHours`) | How long the bot reuses a cached bulk ticker fetch before hitting the API again (default 12h). The bulk list only says which symbols exist — criteria data never reads it — and the same window sets how long MI's re-entry block and the Ticker Graylist hold a closed symbol. |
| **Whiplash Audit** (`whiplashEnabled`) | When on, the position watcher fetches 1-minute klines near TP and near SL to confirm whether price spiked through either between watcher cycles. The SL audit (PseudoWinter 1.6.8 / PseudoChaser 1.6.9) uses the same proximity rule and 5-minute delay as the TP audit, with its own `_whiplashSlScheduled` flag, and closes at the SL price if a candle high (Winter) or low (Chaser) reached it. It aborts if the SL moved or cleared before the check ran. |
| **Whiplash Proximity** (`whiplashProximityPct`) | How close (%) to the TP or SL price triggers the kline audit. One setting drives both, and it also drives the cond. order audit against target and worst case. |
| **Runtime Limit** (`runtimeHours`) | Maximum position age. Forces a close at the deadline if TP hasn't been hit. |
| **Symbol Banlist** (`banlistEnabled`) | When on, symbols on the ban list are excluded from all scans. Entries expire after 7 days. |
| **Position Price Feed** (`restPollEnabled`) | When on, replaces the WebSocket price stream for open positions with periodic REST calls; use it if the WS feed returns stale prices. Exactly one source runs at a time. Pseudo bots default to on and Psycho bots to off. ([more](#general-details)) |
| **Price Poll Interval** (`restPollBaseSec`) | Base polling interval in seconds for REST mode. The interval doubles automatically when price moves less than 0.1% between ticks and resets to base on any meaningful move. |
| **Dispatch Every** (`schedIntervalMs`) | Minimum gap (ms, default 150) between successive background fetches dispatched from the scheduling queue. Lower = faster background data turnover, at the cost of more simultaneous requests. |
| **Max Concurrent** (`schedMaxConcurrent`) | Hard cap (default 4) on background fetches in flight at once, regardless of how many subsystems have work queued. |
| **Slice Budget** (`schedSliceMs`) | How long (ms, default 8, 2–30) a scan stage runs before handing the browser back; a hidden tab uses 40 ms. Lower = smoother page, slightly slower scans. |
| **Follow Partner Bot** (`lfFollowPartner`) | When on, this bot stops fetching bulk tickers itself and uses the bulk list the partner hands over. The partner needs no toggle: it acts as leader while its heartbeat is fresh (newer than 2× **Scan Interval**), and this bot resumes scanning on its own if it goes stale. It also won't open a position on a ticker the leader already holds; Still-Water honours it too: a follower runs no sample batch of its own and adopts the leader's batch and scored store. ([more](#general-details)) |
| **Config Lock** (`cfgLocked`) | Locks all config controls to prevent accidental changes. On PseudoWinter/PseudoChaser it starts locked when the bot starts (and on page load) but can be unlocked at any time, including while the bot is running; this covers every config control, including Scan Interval, Leverage, Notional, Max Positions, Force Close Runtime and Binary TP/SL, and the plugin tabs follow the same lock. On EverWinter/SunChaser it still engages automatically while the bot is running, and it also locks the Open and Close tab controls (the tabs themselves stay navigable). |

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

**Storage usage** (dropdown below Persistence, PseudoWinter/PseudoChaser only): breaks this bot's localStorage footprint down to one row per data type, including genuinely shared cross-bot keys but never the partner's private state. Oversized rows show in red with a **✕** to clear that bucket (with confirmation), and **Export** downloads the breakdown as a text file. The cross-bot corridor shows as one row of in-flight packets (normally empty), and plugin sources and plugin data (see Plugin data storage) show as IndexedDB rows that sit outside the localStorage quota and aren't part of the total.

**Power usage** (dropdown below Storage usage): a rolling average and peak of how many milliseconds the app spends reacting each second. A rising figure usually means a plugin panel left open somewhere is doing more work than it needs to — closing analytics panels you're not actively watching brings it back down.

**Ticker Graylist**: when MultiIndicator is enabled, the Stats menu shows a Ticker Graylist section listing symbols currently blocked from re-entry. It's empty when nothing is blocked. Each listed symbol clears itself automatically once the bulk ticker cooldown window elapses — no manual action needed.

### Actions Dropdown

- **Export** — Downloads current bot state (config, positions, closed trades, ban list, EDa state) as a `.json` file. Plugins with their own data (Still-Water scorer data) have their own Export in the Danger Zone of their accordions (see **Export & Import** under Still-Water Plugin) — the Stats menu Export covers the base bot state only.
- **Import** — Restores state from a previously exported `.json` file: config fields merge field by field and positions are replaced wholesale. A 5s debounce prevents accidental double-imports, and config keys that no longer belong to a loaded feature are dropped. ([more](#general-details))
- **Clear Closed Trades** — Wipes the closed trades list, resets session stats, and clears the 6hr drawdown/gains-lock rolling PnL windows. Open positions are unaffected.
- **Clear All** — Full reset. All positions, trades, stats, and config are wiped (config reverts to defaults).

### Activity Log

Timestamped entries for every significant bot event. Color coding:

- **White** — informational (scan results, entries, closes)
- **Yellow** — warnings (halts engaged, API retries)
- **Red** — errors (API failures, plugin conflicts)

Common prefixes: `[MHL]` manual halt · `[DWN]` drawdown throttle · `[GLK]` gains lock · `[PST]` (PseudoWinter) / `[PERSIST]` (PseudoChaser) save failures or recovered positions · `[ASH]` Still-Water events (both bots) · `[MI]` MultiIndicator events · `[SHR]` cross-bot corridor handovers and failed shares.

Bulk operations (Cascade, Sacrifice, Bail, scan entry bursts) are rolled up: `_logBatchBegin()` / `_logBatchEnd(label)` buffer per-event messages into one entry. Errors always log immediately. `log(m, type, live)` takes an optional third argument; `live = true` bypasses the buffer, so live close/entry retry lines (repricing, market fallback, per-try failures, fill timeout) show as they happen instead of after the whole roll-up finishes.

The log keeps the latest 300 entries in memory and in localStorage, dropping the oldest first. Each entry has a local `HH:MM:SS` string (`t`), which is what the UI shows, and an epoch-millisecond timestamp (`ts`). `ts` lets you match a log export to position and config exports, which are timestamped in UTC epoch; `t` alone can't be tied to a date or time zone.

---

## Trades Menu

The trades panel shows a card for each closed trade, newest first, with a close-reason badge: **TP**, **SL**, **FORCE** (runtime limit), **BAIL** (drawdown throttle bail), **Sub** (Substitution), **Defer** or **Time** (MI Deferment) or **Eject** (Ejection). Reasons added by other plugins show their own label. The simulation bots also show estimated fees on each card, and Net PnL, win/loss and the drawdown and gains windows are net of them. ([more](#general-details))

**Roll-up card**: when the closed trades list exceeds 50 entries, the oldest are compacted into a single roll-up card showing their net PnL, trade count, and the date range they cover. The roll-up is not a trade — it is a historical summary. In the PnL chart, the roll-up's net value acts as a baseline offset applied to every plotted point.

**PnL chart**: click the **PNL CHART** bar below the header to expand a cumulative PnL line chart, green when the net result is positive and red when negative. It only appears once at least 2 individual trades are closed. ([more](#general-details))

**CLEAR button**: removes all closed trades, resets session stats, and clears the 6hr drawdown/gains-lock rolling PnL windows. It asks for an inline confirmation ("Sure? Yes / No") before anything is deleted. ([more](#general-details))

---

## Conditional Orders

A plugin can enter through a conditional limit order instead of opening at once: `placeCondEntry({ candidate, target, worst, tag })`, where `candidate` is what it would hand to `pseudoOpenShort`/`pseudoOpenLong`. Nothing calls it by default; it is an API for plugins. The order opens a position only when price reaches **target**; if price reaches **worst** (the worst case) first, it is cancelled. Target and worst sit on opposite sides of the **entry** price, the last price when the order was made.

Pending orders are listed under **Cond. Orders** in the market column, below Open Positions. Each card shows Entry, Target and Worst with a thin bar and the distance of the current price from each. They have their own count (**Max Cond. Orders**, default 30), are saved with the bot's state and are cancelled by **Bail All** and, with MI Deferment on, when the headline is under 50% or an order outlives the time Deferment allows. On PseudoWinter/PseudoChaser the fill is simulated; on EverWinter/SunChaser the order is a real Bybit conditional limit order. ([more](#general-details))

---

## MultiIndicator Plugin (MI)

MultiIndicator is one file for both bots: it reads which bot it is loaded into and uses that side's conventions (Chaser longs, Winter shorts). All settings are `mic*`. The plugin filters entries with combinations of criteria called **slots**: a slot is an AND-gate, and a ticker only needs to match one slot to be eligible. No criterion is mandatory, and a slot (Auto or manual) can use any combination of `fund`, `va`, `iol`, `ios`, `lta` and `lpa`. Entry is scan-driven only: one pass per fresh sample batch. MI decides what it will enter and Still-Water suggests: with Still-Water loaded, only tickers in the latest batch's sample score are entered, ranked by it (or by its inverse while the **Inverse Forecast** rule is in force). ([more](#multiindicator-details))

### Criteria

See StrategyBook's **Market Reading** section for what each criterion means and when to use it. This section covers tiering, recording, and fetch mechanics only.

**Slot builder badge key**: the manual slot builder uses the same emoji set as position/trade badges.

| Badge | Criterion |
|---|---|
| 🤑/💸 | Funding tier (direction-aware, see [Trivia](#trivia)). |
| 🔊 | V/A, volume versus the population sample-window average. |
| 🐂 | IO/L, the long share of the ticker's open interest versus the population sample-window average of that share. |
| 🐻 | IO/S, the same for the short share. |
| 🕐 | LTA, last completed hour's turnover versus the ticker's own average hour. |
| 💹 | LPA, last completed hour's price change versus every other ticker in the sample window. |

**IO/L and IO/S**: a ticker's long share of open interest is its open interest × the long share of accounts from Bybit's long/short ratio, and its short share is the remainder. The tier is `floor(100 × ln(share ÷ window average) ÷ step)`, so `iol+12` is 12 tiers more long open interest than the sampled population averages. Each needs the ticker's long share and a window average, so it has no tier until the sample window holds readings. ([more](#multiindicator-details))

**Recording**: every criterion is recorded as a signed tier on the position at entry.

### Config

| Setting | What it does |
|---|---|
| **Enabled** (`micEnabled`) | Master on/off. When off, the plugin opens no entries and runs no exits. |
| **Picks** (`micPicks`) | Max new entries per scan cycle (1–10). |
| **Share Cap** (`micShareCapEnabled`) | Limits plugin entries to a percentage of `maxPos`. Prevents MI from filling all position slots. |
| **Share Cap %** (`micShareCapPct`) | The cap percentage. At 50% with maxPos=6, MI can hold at most 3 positions. |
| **Tier Step Sizes** (`micFundStep`/`micVaStep`/`micIolStep`/`micIosStep`/`micLtaStep`/`micLpaStep`) | Read-only chips on the **Fetch** tab showing the tier step for each criterion. Defaults: `va` 1% deviation from the population average; `iol` and `ios` 1% (log) deviation of the long / short open-interest share from its window average; `lta` 10% deviation from the ticker's own hourly average; `lpa` 0.25 absolute points of 1h price change (shown as `pp`); `fund` 0.0025% of funding rate per tier, so 0.25% is tier 100. They can't be edited from the UI; change them via config import. Older installs saved the fund step as 0.25; it's migrated once, and saved `fund>N`/`fund<N` slot gates are rescaled ×100 so each keeps its threshold. |
| **Cascade** (`micCascadeEnabled`) | Closes every open position, whichever strategy opened it, when their collective unrealized profit reaches a threshold, banking a group move before it reverses. The position watcher checks this every 5s while the bot runs, not just once per scan, so a threshold crossed and reversed between scans is still caught. The closes are sent concurrently, not one after another. |
| **Cascade %** (`micCascadePct`) | Collective uPnL trigger as a % of base margin (minNotional ÷ leverage). While **Relative Target** is resolving, this is the value at a full headline factor and Cascade fires at it × the factor. |
| **Sacrifice** (`micSacrificeEnabled`) | Closes every open position, whichever strategy opened it, when their collective unrealized loss reaches a threshold, capping group drawdown. It uses the same continuous position-watcher check as Cascade, and closes concurrently the same way. |
| **Sacrifice %** (`micSacrificePct`) | Collective uLoss trigger as a % of base margin (minNotional ÷ leverage). While **Relative Target** is resolving, this is the value at a full headline factor and Sacrifice fires at it × the factor. |
| **Relative Target** (`micRelativeTargetEnabled`, default on) | Sub-toggle on the **Exit** tab, shown only while Cascade or Sacrifice is on and Still-Water is loaded. It shrinks each new position's entry TP and SL, and Cascade and Sacrifice, by the Still-Water headline factor: the favored side's share against the best share recorded, 0 at 50% and 1 at the peak. The **Targets Gauge** shows the live headline, factor and resolved targets. It stands down while the inverse forecast is in use: new positions get the full targets. ([more](#multiindicator-details)) |
| **Invert** (Relative Target) (`micRelInvertEnabled`, default off) | Sub-toggle shown only while Relative Target is on. Swaps the headline factor for its mirror: the depth under 50% over the same recorded peak, so targets are full when the headline sits deep under 50% and at the floor from 50% up. For reading a poor headline as a market near its peak or bottom. The gauge marks the factor `(inverted)`. ([more](#multiindicator-details)) |
| **Min Entry TP** (`micMinEntryTp`, default **6**) | Shown only while Relative Target is on: the ROI % below which a position can't cover its entry and exit fees. The shrunk entry TP, Cascade and Sacrifice never go below it, and the SL is floored at 1%. ([more](#multiindicator-details)) |
| **Targets Gauge** (no toggle) | Two-sided readout below the Entry/Exit/Fetch tab zones, visible whenever the plugin is enabled: SL and Sacrifice on the left, TP and Cascade on the right, with bars for TP and SL and text for the other two. Every value is green at or above Min Entry TP and red below it. The caption shows the headline and factor, a second line shows the time Deferment currently allows, and the gauge greys out with a note while there is no headline. While the inverse forecast is in use (and Relative Target is on), every value shows its full target in purple. ([more](#multiindicator-details)) |
| **Substitution** (`micSubstitutionEnabled`) | When no entry slot is free (maxPos or Share Cap reached), closes the worst-scoring held position (any strategy's, not only MI's) and opens the best fresh candidate in its place, but only if the candidate's score beats the held position's *current* score by the **Substitution Margin**. Scores are sample scores in the bot's favor (see **Forecast Ranking**; sign-flipped while the inverse forecast is in use, so both sides of the comparison share one scale): a held MI position's current score (`_micLiveCompositeScore`) is the newest sample score or forecast on its ticker, else the score it opened on, so it's judged on where it stands now, not where it stood at entry. That latest score is recorded on the position. Each candidate is pre-flighted through the Force-Evaluate top-up before anything is closed. With Fade on, an against-side ticker can win too: it gets a Fade order (placed before the worst position closes) that holds the freed slot. |
| **Substitution Margin** (`micSubstitutionMarginPct`) | How much better the new candidate must score than the worst held position, as a % of base margin (minNotional ÷ leverage), before a swap happens. Prevents swapping on marginal score differences. |
| **Substitution Min Age** (`micSubstitutionMinAgeMins`, default 60) | Minimum minutes a position must be held before it becomes eligible to be substituted out. |
| **Loss Swap** (`micLossSubEnabled`, default on) | Sub-toggle in the Substitution block on the **Exit** tab. A second Substitution clause: when no slot is free, the deepest-losing eligible position whose uPnL is at or below the **Loss Threshold** is the one swapped out, with no score margin required. Same Min Age, candidate checks and Fade handling as Substitution; at most one swap per scan. |
| **Loss Threshold** (`micLossSubPct`, default **6**, 1–50) | Shown only while Loss Swap is on. The loss, as a % of base margin (minNotional ÷ leverage, the Cascade and Sacrifice basis), at which a position becomes swappable. A DCA'd position reads deeper than its ROI on its actual margin. |
| **Deferment** (`micDefermentEnabled`, default on) | Toggle on the **Exit** tab, shown only while Still-Water is loaded. The headline factor also scales how long a position or cond. order may live, up to the host's **Force Close Runtime**; one under 50% closes every position (reason `defer`) and blocks entries behind a **No Entry** pill. Never while the inverse forecast is in use. ([more](#multiindicator-details)) |
| **Min Time** (`micDeferMinMins`, default **10**, 1–60) | Shown only while Deferment is on. The least time a position or cond. order gets, at a headline of 50%. |
| **Invert** (Deferment) (`micDeferInvertEnabled`, default off) | Shown only while Deferment is on. Reads the headline the other way: over 50% defers (every position closes with reason `defer` and entries are blocked) and under 50% enters, with the time allowance scaled by the depth under 50% instead of the height over it. Every headline over 50% closes everything. |
| **Window net profit** (`micDeferWinNetEnabled`, default **off**) | Shown only while Deferment is on. Also defers while the Forecast Grader's window net profit is negative, over at least 3 graded batches. |
| **Inverse forecast** (`micInverseEnabled`, default **on**) | Shown while Still-Water is loaded, whether or not Deferment is on. Switches the **Inverse Forecast** rule on or off. |
| **Tight swings** (`micSwTightEnabled`, default on; `micSwMinMins`, default **60**, 5-360) | The one Swing Phase rule, shown only while Still-Water is loaded. Defers every entry while the window's average swing (the full cycle, minutes) is shorter than the minimum. Entries only, held positions are never closed by it. ([more](#multiindicator-details)) |
| **Window** (`micSwWinMins`, default **60**, 10-360) | Shown while Tight swings is on. How recent the batches are that feed the average swing (and the Swing view's red band). |
| **Fade** (`micFadeEnabled`, default off) | Toggle on the **Entry** tab, shown only while Still-Water is loaded. A qualified ticker whose forecast score is negative (pointing against this side) isn't entered; it waits as a cond. order at the end of its expected move and clears after 1h. Off while the inverse forecast is in use. ([more](#multiindicator-details)) |
| **Reach** (`micFadeReachPct`, default **50**, 10–90) | Shown only while Fade is on. The share of the last graded batch, by score size, that moved at least as far per pp of score as the target scale. |
| **Fade slots** (`micFadeSlots`, default **3**) | Shown only while Fade is on. Most Fade orders pending at once; each holds a position slot that normal entries leave free. When the slots are full, a ticker scoring further against this side replaces the weakest order each scan. With no position slot free, pending orders are cancelled and none are placed. |
| **Fade only** (`micFadeOnly`, default off) | Shown only while Fade is on. Blocks every normal entry, so only Fade orders open positions. Substitution still runs, but only into Fade orders. |
| **Regime fade** (`micRegimeFadeEnabled`, default off) | Shown only while Fade is on. With the headline under 50%, Fade places its orders at the end of favourable moves instead of adverse ones. Deferment and Relative Target should be off; a warning shows while either is on. |
| **Re-entry Block Mode** (`micReentryBlockMode`) | Defaults to **Losers Only**, which lets a symbol that just closed in profit re-trigger immediately and blocks only a symbol that closed at a loss. **Winners + Losers** blocks a symbol from re-triggering for one bulk-ticker cooldown window (12h by default) after any close, win or loss. |
| **Auto Slots** (`micAutoSlots`) | Replaces the manual slot list with a minimum-gate qualifier: a ticker qualifies once it satisfies at least **Minimum Criteria per Slot** non-excluded criteria — not a fixed-size combination. Every criterion the ticker actually satisfies is captured and scored, not just enough to clear the floor. See `_micAutoQualify`. |
| **Minimum Criteria per Slot** (`micAutoSlotSize`) | The floor (1–6). At 1, a single true criterion qualifies the ticker — any others it happens to satisfy are still captured and scored. |
| **Exclude from Auto** (`micAutoSlotExclude`) | Criteria omitted from Auto's qualifying set entirely — never checked, never counted toward the minimum, never scored. Excluding more than `6 − Minimum Criteria per Slot` leaves Auto unable to ever reach its floor, and the plugin reports no active entry gate (`_micAutoActive`). |
| **Force-Evaluate General Criteria** (`micForceGeneralCriteria`, on by default) | Auto mode only. When on, just before a ticker opens, the plugin re-checks `fund`, `iol`/`ios` and `lta`/`lpa` with a forced per-symbol fetch, since the cycle's capped sample may not have reached it yet, and adds any that are newly true. It never drops a criterion already found, and costs a few extra requests per entry. ([more](#multiindicator-details)) |
| **Forecast Ranking** (no toggle, always on) | With Still-Water loaded, only tickers in the latest batch's sample score are entered, ranked by it as pp in the bot's favor (the scorecard's score for the ticker, the same number the Forecast Grader freezes as a forecast). A negative score doesn't block an entry, unless Fade takes it. A ticker the batch has no score for isn't a candidate. A following bot ranks on the leader's published scores for the batch (it waits up to 20 s for them). Without Still-Water, entries come from MI's criteria alone, unranked. ([more](#multiindicator-details)) |
| **Inverse Forecast** (`micInverseEnabled`, default on) | A general rule, not tied to Deferment, switched by the **Inverse forecast** toggle under Deferment (with it off the rule never holds and none of the below applies). With Still-Water loaded, when the Forecast Grader's window net profit is negative while its window inverse net profit (the same forecasts taken in reverse order) is positive and averages more than **Min Entry TP** per trade, MI enters on the inverse forecast only: the most against-side scores first, and only tickers scoring against this side. Meanwhile Fade is off, Deferment doesn't defer and Relative Target stands down (the gauge shows the full targets in purple). ([more](#multiindicator-details)) |

### Slots UI

**Manual mode**: click a slot to select it, then toggle criteria on/off in the picker row below. ✕ deletes the slot; `+` adds a new empty one. All six criteria are tiered — clicking one opens its gate picker (direction plus tier) rather than toggling a bare tag. A slot with no criteria in it never matches.

**Auto mode**: replaces the manual builder with a minimum-slider and an exclusion chip row. A ticker qualifies on at least the chosen minimum of non-excluded criteria — every criterion actually true is scored, not just enough to clear the floor. The hint under the slider states the current floor as "qualifies on any N of M secondary criteria."

The six criteria are independent signed tiers, so any subset can be true for the same ticker at once and each contributes to the qualifying count on its own.

---

## Still-Water Plugin

Still-Water is one file for both bots. On PseudoChaser its panel is titled **Ashfall** (♨, orange) and on PseudoWinter **Permafrost** (❄, ice-blue); the code, settings (`sw*`) and storage layout are the same, and the side is read from the host at load. It provides the **Sample Scorer**, the **Forecast Grader** chart, whose sample score ranks each batch's tickers for MI's entries, and the **cross-bot bus** that shares cascade/sacrifice triggers with the partner. The panel has two tabs, **CROSS** and **SCORE**, with the Danger Zone (Export / Import / Clear Profile) below. ([more](#still-water-details))

### Config

| Setting | What it does |
|---|---|
| **Still-Water Mode** (`ashfallEnabled`, both sides) | Master toggle. |
| **Cross Broadcast** (`ashfallCrossEnabled`) | Always on, no toggle. It writes cascade/sacrifice triggers to a shared log (`__everwinter_cross_v1`, retained 30d) that the partner bot reads and lists in the **Partner Feed**. Cascade/sacrifice is logged once per collective-exit trigger, not once per position closed, tagged with the position count and collective PnL when it fired; plain individual TP/SL closes aren't broadcast. |
| **Sample Scorer** (`swExtremityEnabled`) | The scoring engine. It sorts each criterion's sampled readings into extreme-high / lukewarm / extreme-low and scores which end paid, from how the sampled tickers actually moved (LPA, in the bot's favor), so it learns before any entry. The Score tab shows the favored side's chart and headline, and the scorecard is the base score each forecast starts from. It vetoes nothing. The criteria are `fund`, `va`, `iol`, `ios`, `lta` and `lpa`; see **Sample Scoring** below. |
| **Sample Scoring** (always on, no toggle) | Scores each criterion by how the sampled tickers moved (LPA, in the bot's favor), in Extreme/Lukewarm buckets, and names the scorecard panel **Sample Scorer**. With **Liquidation Surveillance** on, liquidated turnover counts as a second outcome equal to price (50/50). ([more](#still-water-details)) |
| **Score Horizon** (`swObsHorizonHrs`, default **3**, hours) | Setting under Sample Scoring, beside Batch Size (default 3 hours). Every sample observation older than this, price and liquidation alike, drops out of every score, so they all adapt at the same pace. The Forecast Grader keeps its own graded store and is separate from this horizon. ([more](#still-water-details)) |
| **Extreme Split** (`swExtremitySplitPct`) | What share of a dial pole's sample, sorted by magnitude, counts as "extreme" (default 30%, range 5–45%). Lower = a stricter, more exclusive extreme band; higher = more readings qualify as extreme. The cutoff is recomputed per pole from its own sample. |
| **Min Samples** (`swExtremityMinSamples`) | The minimum sampled readings a dial pole needs before its extreme cutoff is trusted (default 3, range 3–30). Below it the pole has no proven cutoff, so every reading on it counts as lukewarm. Because the pool samples live annotations rather than closes, a pole usually clears this within the first scan or two. |
| **Batch Size** (`swOcBatchSize`) | Sets both the random sample fetched fresh each scan and the cap on ranked candidates refetched before entry (default 50, 1–2500, number field). Each ticker costs a request, plus a candle once an hour, which is about 1 MB uncompressed per 50 tickers. Bandwidth therefore scales with batch size × scans per day, up to double when every entry refetch is used. |
| **Sample Batch** (always on, no toggle) | Always on, no toggle. Each cycle, **Batch Size** tickers are drawn from MI's scan candidate pool and fetched fresh (the Forecast Grader's revisits take their share of the slots first): a ticker request, 5-minute candles merged into the last completed 1h candle, and Bybit's long/short account ratio. The batch is handed to the partner through the cross-bot corridor each cycle, so a **Follow Partner Bot** instance seeds its sample results from the leader's latest sample. ([more](#still-water-details)) |
| **Liquidation Surveillance** (`swLiqEnabled`, **on by default**) | Sub-toggle under Sample Scoring: liquidation becomes a second outcome, counted equally with price, at no extra fetch cost beyond Bybit's public liquidation WebSocket. The sample batch is watched each scan; tickers that had liquidations stay in the next batch and quiet ones are replaced. Each ticker with liquidations gets one observation pairing its criteria with the event's size in pp (the watch's net liquidated dollars set against every other liquidation event in the **Event Size History**, so a big event reads big and a small one small), blended 50/50 with the price edge, and a **Liq** view is added to the Sample Chart. ([more](#still-water-details)) |
| **Event Size History** (`swLiqHistHrs`, default **24**, hours, 1–168) | Setting under Liquidation Surveillance. How far back liquidation events are remembered to judge how big a new one is: a ticker's net liquidated dollars are compared with the median event in this history, so liquidation outcomes differ from one another instead of all reading the same. Never shorter than the Score Horizon. ([more](#still-water-details)) |
| **Instability Graylist** (`swInstabEnabled`, **on by default**; `swInstabPct`, default **30**; `swMixedPct`, default **30**) | Sub-toggle of Liquidation Surveillance, shown only while it's on. A ticker whose liquidations flip between short-heavy and long-heavy watches scores as unstable (`1 − \|short − long\| / (short + long)`) and is skipped for entry once it is **Instability %** (default 30) or more above the average of the counted tickers. It needs liquidations in at least 2 watches and counts as `excluded.gray` in the scan skip summary; **Mixed %** only sets how the Liq pills are drawn. ([more](#still-water-details)) |
| **Illiquidity Filter** (`swIlqEnabled`, **off by default**; `swIlqSlowSecs`, default **12**; `swIlqRefreshDays`, default **7**) | Option in the Score tab's Scorer Settings dropdown that leaves the slowest-trading tickers out, since their hour candles flatten the samples and their fills slip. Each batch measures tickers whose last reading is older than **Measure again after** (default 7 days) from the gap between 3 recent trades, and a gap slower than **Illiquid when slower than** (default 12 s) marks the ticker illiquid and keeps it out of sampling and entry. A follower adopts the leader's readings. ([more](#still-water-details)) |
| **Stablecoin Filter** (`swStbEnabled`, **on by default**; `swStbMinPct`, default **0.01**, % of price; `swStbHours`, default **12**) | Option beside the Illiquidity Filter that keeps pegged tickers out, because a stablecoin's hour barely moves and flattens the samples. It adds no request: when a ticker's hour candle is fetched, a range `(highest − lowest) ÷ open` under **Stablecoin when hour range is under** (default 0.01%) graylists it for **Graylist for (hours)** (default 12). The ticker is left out of sampling and entry for that time, and a follower adopts the leader's verdicts. ([more](#still-water-details)) |
| **Forecast Grader** (always on, no toggle; `swFcShare`, default **50**, %; `swFcLead`, default **6**, batches; `swFcKeep`, default **3000**, 60–6000) | The Sample Scorer's forecast chart. Every ticker a batch carries is scored by the scorecard (the **sample score**: the mean score of the poles its readings land in, in the bot's favor) and that score ranks MI's entries. A share of each batch's tickers also has its score frozen as a price forecast with its price, and is sampled again **Lead** batches later (using **Revisits %** of each batch's slots); the move, less the start batch's mean, is graded as an accuracy of 0–100. It changes no score or entry itself. The graded forecasts are kept in the plugin data store; the **Fcst** chart view and the Export show the results, with each batch's and the window's **net profit** and **inverse net profit**, the latter being what MI's **Inverse Forecast** rule reads. ([more](#still-water-details)) |
| **Swing Phase** (`swSwingEnabled`, **on by default**; `swSwingHours`, default **100**, 6-100; `swSwingK`, default **5**, 1-20) | Reads where the market and each ticker sit in their swing (bottom, upslope, peak, downslope) from the 5m candles each sample batch fetches per ticker (the last 6 hours, 72 candles; one request, the same one that feeds the hour reading). Candles are cached up to **hours** per ticker (memory only, so a reload starts over), merged into 10m, 15m, 30m, 1h, 2h, 4h and 6h, and a zigzag finds swings at each scale, a reversal counting once price retraces **K** times that series' mean 5m step. Each series settles on the scale whose swings stand furthest above a random walk. One reading per batch is stored and shared with a following bot; MI decides what to defer from it. Shown as the **Swing** view and as a phase dot on every ticker pill. ([more](#still-water-details)) |
| **Megacap Exclusion** (`megacapExclude`) | Array of symbols excluded, alongside BTC, from every population average this plugin builds and from MI's own scan pool. Default `BTCUSDT`/`ETHUSDT`/`SOLUSDT`/`BNBUSDT`/`XRPUSDT`/`DOGEUSDT`/`ADAUSDT`/`TRXUSDT`/`LINKUSDT`. Seeded on first load by whichever of the two plugins loads first — shared by key name so both stay consistent. Not editable from the UI — change via config import if the list needs to change. |

### Export & Import

The Danger Zone in the plugin's accordion has **Export** and **Import**. Export opens a menu (styled like the base bot's Export Data); each button downloads one `.json` file named `ashfall-<type>-<timestamp>.json` (on both sides), carrying `exportType`, `exportedAt` and the plugin version. The Forecast Grader has three buttons of its own (Summary, Grades, Pending); Grades and Pending are written compact (no indentation).

| Button | Contents | Import restores it |
|---|---|---|
| **Everything** | The Profile file plus Scorer Readout and Liquidation Watch in one file | the importable parts |
| **Profile (for Import)** | Every importable store below in one file; the Forecast Grader goes in as its raw store, and this is the only export that restores it (a store from before the Forecast Grader was cut back to the sample score is skipped) | yes |
| **Scorer Readout** | The numbers the Score tab shows: headline for both buckets and the favored side, bucket means, every pole's score, wins, losses and n, the cutoffs and sample counts behind them, the window averages (LPA, LTA, volume, OI, funding and liquidation: event tickers, average lean in pp, how many led by shorts or longs, how many latest readings were quiet) and the plugin's settings | no |
| **Sample Observations** | The scored price and liquidation observations with the headline peak/bottom, graylists and the liquidation event-size history | yes |
| **Forecast Grader · Summary** | The settings, window and per-batch grades, the net profit and inverse net profit (the window's and each batch's), void counts and the batch counter. No per-forecast rows | no |
| **Forecast Grader · Grades** | One row per graded forecast: ticker, start and grading batch, times, elapsed minutes, projected pp, actual pp, accuracy, raw move, start batch's mean move, move relative to the start batch, highest and lowest point since the forecast, and criteria tags. Compact | no |
| **Forecast Grader · Pending** | The forecasts still waiting for their revisit, with their frozen price, projected pp and criteria tags. Compact | no |
| **All Sample Charts** | Every cycle in the chart history, every ticker, every field | yes |
| **Vol / IO / L/S / Fund / LTA / LPA / Liq** | One chart view: per cycle and ticker just that view's fields plus the plotted value, the cycle average and the window average. Liq lists every watched ticker, flagged event or quiet | no |
| **Liquidation Watch** | The watch in progress, the live per-ticker tally (liquidated short and long turnover) and any closed watch not yet scored | no |
| **Cross Events** | The shared cross-bot event log in full | yes (merged) |

**Import** reads whatever record types a file carries and replaces only those stores, leaving the rest alone, so a single-type file, Profile and Everything all work. Cross events are merged instead of replaced, and sample observations older than the **Score Horizon** are dropped. A file with nothing importable logs that instead of changing anything. ([more](#still-water-details))

### Partner Feed

The Cross tab shows a scrollable **Partner Feed** listing the last 20 events the partner bot has broadcast: cascade/sacrifice triggers. Each row shows a kind-specific detail — position count and collective PnL for cascade/sacrifice, symbol for a rolling sacrifice — and a UTC timestamp, date-prefixed for anything not from today. Empty until the partner has broadcast at least one matching event.

### Last Share

Above the Partner Feed, the Cross tab has a **Last Share** readout of what has moved between the two bots. A header line gives this bot's role (leading, following, or follow on with the partner silent) and the partner's heartbeat age. Then there's one row per shared dataset: **Bulk tickers**, **OC batch**, **Sample scoring**, **Liq lean**, **Illiquidity**, **Stablecoin**, **Forecast grading**, **Swing readings**, **Klines 1h** and **Watch tickers**.

Each row reads `sent <AF|PF> <age> · <size> · ✓ <packets> pkts <ms>` (`n/m pkts` in amber while in flight, `⚠ <reason>` after a failed share, `skipped: partner not running` when nothing was sent) and `taken by <AF|PF> <age>`, which turns amber if a sent snapshot hasn't been taken for more than two scan intervals. Klines 1h and Watch tickers are registry caches with no receipts, so they only ever show sends. Below the rows, **Cross-bot store** gives the total bytes with a breakdown (corridor, registry against its 200 KB cap, event log, sample state, ledger); the corridor should read empty between handovers. The readout only renders while the tab is open. ([more](#cross-tab-data-pool))

### Sample Chart

Below the Score tab's scoreboard is a per-ticker bar chart of the sample cycle history, scrollable through past cycles. Header buttons step through the views **Vol → IO → L/S → Fund → LTA → LPA**, plus **Liq** while Liquidation Surveillance is on, **Fcst** while the Forecast Grader is on and **Swing** while Swing Phase is on. Click a cycle group to pin the summary and chips to that cycle. ([more](#chart-and-scorer-display-details))

- **Vol** / **IO**: the 24h-turnover and open-interest samples, with a **Total avg** (on Vol, the number `va` measures against; plus ticker count) above a **Batch avg**. No outlier cap.
- **L/S**: each sampled ticker's long/short skew, the net long minus short share of accounts from Bybit's long/short account ratio (−100 to +100%, positive = long-heavy), drawn up in green when long-heavy and down in red when short-heavy. It has a **Total avg** and **Batch avg** like the other views, and its **Tickers** pills are coloured by side. It is the same long share IO/L and IO/S split open interest by. ([more](#chart-and-scorer-display-details))
- **Fund**: each sampled ticker's funding rate (%), signed, with a **Total avg** and **Batch avg** like Vol/IO. Funding rides in the sample records, read from each ticker's fresh fetch.
- **LTA** / **LPA**: signed views (turnover deviation %, 1h price change %) drawn up or down from a zero line, on a symmetric axis sized to 1.3× the 95th percentile of |value|. Only tickers with a candle reading in a cycle appear. The **Tickers** pills are coloured when that ticker's own 1h move went the bot's way (up on Chaser, down on Winter) and gray when it went against it, was exactly flat or has no reading, so on both views colour means favorable; the hover says favorable or unfavorable, and on LTA adds the 1h move. (The Vol, IO and Fund pills are coloured when at or above the batch average.)
- **Fcst** (while the Forecast Grader is on): forecast accuracy, batch by batch, one column per graded start batch (the last ten) with one bar per ticker growing from the **70%** line, colored green at 70% or above, yellow from 50% to under 70% and pink under 50% (a dashed line marks 50). A dashed line separates the batches still to come, with the number of forecasts falling due in each. Click a column to select it; under the grayed header the summary shows two short lines, `Window: ##% accurate · $ net · $ inverse · ##/## in profit · ##/## inverse` and the same for the selected batch as `Batch hh:mm: ...` (see Forecast Grader below); a dashed line with the date marks where a new day starts, as on the other views, and the **Tickers** pill opens a table of that batch's tickers. ([more](#chart-and-scorer-display-details))
- **Swing** (while Swing Phase is on): one point per sample batch on a connected line, on the same grid as the other views. Height is the swing's length in hours (gridlines in hours): above the midline while the market is rising or at a peak, below it while falling or at a bottom, with color separating the four phases (red bottom, pink downslope, deep green peak, pale green upslope). A faint red band around the midline is the minimum swing MI defers under. Click a batch to pin it: the summary gives that batch's market phase, swing length and scale and its ticker phase counts, the **Tickers** pills list every ticker with its phase dot and swing length, and a **Window** line gives the batches, average swing and the share of tickers in unfavourable swing points over MI's window (MI acts only on the average swing). ([more](#chart-and-scorer-display-details))
- **Liq**: each watched ticker's liquidation lean in pp (its side times its size against the event-size history) over the watch that started on that cycle, shown as a signed view from a zero line (up = liquidated shorts dominated, down = liquidated longs, zero = watched but quiet). **Window avg liquidation lean** and **Batch avg** count only tickers that had events, and the **Tickers** pills list only those tickers, styled by how one-sided the watch was and which side led. Hover shows the short/long split and the ticker's instability, and a `!` marks tickers currently skipped for entry. ([more](#chart-and-scorer-display-details))

### Extremity Scorer

Each criterion is a **dial family** (`fund`, `va`, `iol`, `ios`, `lta`, `lpa`) with a `+` and a `-` pole; each scan's readings build per-pole cutoffs that sort every reading as extreme or lukewarm. The side that has earned more becomes the favored side (ties default to extreme), and the chart and headline show it. Scorecards are per bot; see **Extremity Scorer Internals** in Trivia. ([more](#chart-and-scorer-display-details))

**Scorecard chart**: only the favored side's chart is shown (Extreme or Lukewarm) and it flips automatically when the favored side changes. Each criterion is a duo of bars, the `+` pole on the left and the `-` pole on the right, with profit above a zero line and loss below it. Only shown when MultiIndicator is loaded and enabled. ([more](#chart-and-scorer-display-details))

**CLEAR** wipes this bot's Sample Scoring store and Forecast Grader store together (`__ew_sw_<side>_sampleobs_v1`/`…_fc_v2`), cutoffs included, never the partner's.

The chart is titled **Sample Scorer** and its bars are mean edge in pp, with liquidation outcomes blended in when Liquidation Surveillance is on. A status line above it shows the scored-sample count, plus the liquidation-sample count, tickers on watch and quiet graylist when Liquidation Surveillance is on, and the illiquid count when the Illiquidity Filter is on. With Liquidation Surveillance on, a further line shows the Event Size History's median, peak, bottom and event count. The LPA dial isn't drawn unless Liquidation Surveillance is on, since LPA is the price outcome. ([more](#chart-and-scorer-display-details))

**Headline & gauge**: the header number is relative: the favored side's favorable share of raw 1h move, so 50% is even. A gauge under it is scaled to the best share recorded, with **bottom** and **peak** marking the lowest and highest share (they update once the favored side has at least 10 raw samples). With Liquidation Surveillance on, the share is the 50/50 mix of the price and liquidation values. ([more](#chart-and-scorer-display-details))

The dollar mean and the share are always blended from the same figures, so they can never disagree in sign: each source (price, liquidation) is reduced to its mean favorable pp (P) and mean unfavorable pp (Q) per observation, the sources are mixed on P and Q, and the mean is P − Q while the share is (P − Q) / (P + Q). A share above 50% therefore always goes with a positive mean, and the colour follows both.

## Randomized Outcomes

Scan timing drifts independently per tab, and the sample is a fresh random draw of **Batch Size** candidates each cycle, so two identically configured instances won't share entry triggers, exit timing, or readings. This is intentional: instances in lockstep are easier to front-run and cluster losses at the same market event.

---

## Multiplex Plugins

To save resources in single-file browser execution, the system supports **Multiplex Plugins**. A standard plugin keeps its own telemetry isolated, while a multiplex plugin hooks into the combined component built when all plugins are loaded and reads the core data directly, without wrapping parent methods. This treats the master engine as a shared database, cutting resource use and avoiding race conditions between plugins. ([more](#general-details))

### The Speeder Module (Tentative Multiplex)

Located in `/plugins/multiplex/`, **Speeder** reuses functions in `MultiIndicator` and the data produced by `Still-Water`. That lets it read the rolling sample-cycle histories and the entry criteria builder directly.

* **What it does**: instead of judging order flow by fixed millisecond limits, Speeder splits the whole deduplicated pool of recent per-ticker trade intervals at the median on each scan.

* **How it does it**: to filter noise, landing in the fast or slow half isn't enough. A ticker's trade interval must also pass that half's own *mean*, which confirms a clear gap from baseline market speed.

* **When it acts**: like `MultiIndicator`, Speeder chooses its entry criteria (fast or slow) automatically, using a `base` setting tied to the liquidation regime. It can enter fast or slow tickers in hot or cold regimes.

* **When it doesn't**: if the plugins it depends on aren't in the combined component, Speeder logs a warning and stays inactive.

> **Note**: The Speeder strategy is tentative and lacks long-term historical validation; it remains isolated within the multiplex directory for demonstration purposes and architectural testing.

---

## Trivia

Developer-level detail with no operational consequence. Included for reference.

### General Details

The details left out of the shortened Main Config, Order Handling, Trades and Multiplex Plugins entries.

#### Limit orders and tries (Open / Close tabs)

Entries sell below / buy above the last price and closes buy above / sell below it.

#### Position Price Feed

Turning it on closes the WebSocket stream, and turning it off stops the REST calls. A saved Psycho config is switched off once on first load of PsychoChaser v1.9.1 / PsychoWinter v1.12.1.

#### Follow Partner Bot

With no bulk ticker list handed over (the corridor is empty between handovers and after a reload), a follower reuses its own list while it is within **Ticker Cooldown** plus 1.5 scan intervals, else fetches one bulk list itself. Everything else stays on the leader, and the heartbeat is written once per completed scan cycle. The follower steps back down as soon as the partner returns, and the leader-held check runs at entry before any lookups.

#### Import (Actions dropdown)

The dropped keys cover both the bot and any installed plugin, and the cleanup also runs on every save.

#### Trade cards

**BAIL** closes every open position immediately; **Sub**, **Defer**, **Time** and **Eject** mark a Substitution close, a Deferment close-all, a position that outlived Deferment's time allowance and the retired Ejection (a reason with no registered label shows its raw name). Fees are 0.02% maker on entry and DCA fills and 0.055% taker on the close (`FEE_MAKER_PCT`, `FEE_TAKER_PCT`), with live positions skipped. One close in three is then multiplied by a random 2–3×, skewed higher as the session win rate rises (about 2.25× on average at 0%, 2.75× at 100%), and the other two pay the flat fee.

#### Conditional orders

`placeCondEntry` refuses an order when target and worst aren't on opposite sides of the entry, the symbol already has a position or order, is banned or leader-held, entries are halted, or **Max Cond. Orders** is reached. In the simulation the order fills when the last price reaches target (including a move that crossed it between samples, the level nearer the previous sample winning if both were crossed), opening a normal position at the target or dropping the order if no slot is free. The whiplash check and the gap audit replay recent 1-minute klines to catch a level touched between samples (a target fill is back-dated to the candle, a both-levels candle goes to the level nearer its open), while live orders only check worst case because the exchange owns the fill.

#### PnL chart

The X-axis spans from the first to the last individual closed trade at fixed spacing.

#### CLEAR button (Trades)

Yes confirms; No cancels with no change.

#### Plugin source storage

Plugin sources live in IndexedDB (`__ew_plugins_pseudowinter` / `__ew_plugins_pseudochaser`, object store `src`) and are held in memory after boot, while localStorage keeps only a manifest entry per plugin (css and slot markup aren't stored, since running the source rebuilds them). An entry stays whole until IndexedDB has returned its source on a later boot, and if IndexedDB is unavailable or silent for 4 s the app starts anyway with whole entries in localStorage. A manifest entry whose source is missing from IndexedDB is inactive and the log says to re-load its file, and removing a plugin deletes its source.

#### Plugin data storage

What Ashfall and Permafrost keep lives in the host's IndexedDB data store (`__ew_data_pseudowinter` / `__ew_data_pseudochaser`, object store `kv`), read into memory at boot so plugins still read and write synchronously, with writes reaching IndexedDB in batches. A key an older version left in localStorage moves on first read, and if IndexedDB is unavailable or silent for 6 s the store passes through to localStorage. It needs PseudoWinter 1.25.0 / PseudoChaser 1.21.0 (an older host keeps everything in localStorage), and Alpine loads only after the plugin sources are applied (`window.__pluginReady`).

#### Multiplex Plugins

The core data it reads directly is the arrays, batched API payloads and state structures, with no reassigning of parent methods. The shared database in question is the master surveillance/execution engine.

### MultiIndicator Details

The details left out of the shortened MultiIndicator entries.

#### Slots

Every criterion in a slot must be true for a ticker to qualify.

#### IO/L and IO/S

`ios-3` is 3 tiers less short than the sampled population averages. The long share is read by the sample batch, with one fresh read before entry when a candidate has none.

#### Relative Target

It replaced Target Halving (a saved on/off choice carries over once). The factor is the favored side's signed favorable share `s` over its recorded peak `sHi`, capped at 1 (0 at a 50% headline, 1 at the peak or with no peak recorded), and entry TP, SL, Cascade and Sacrifice are their configured values × the factor, the first two starting from the host's TP and SL. With no headline the configured values apply, and while the inverse forecast is in use it stands down to the full targets (the readout shows them in purple). With **Invert** on the factor is its mirror `g`: the depth under 50% (`-s`) over the same `sHi`, capped at 1 (0 at 50% or above, 1 at the peak depth or with no peak recorded), so targets are full when the headline is deep under 50% and at the floor from 50% up.

#### Min Entry TP

Entry TP and Cascade never shrink below it, Sacrifice never fires below it, and the SL is floored at 1%. It no longer defers entries.

#### Deferment

Each scan, ahead of slot logic, the allowed time is **Force Close Runtime** × the headline factor, never under **Min Time** nor over the runtime: positions past it close with reason `timing` and cond. orders past it are cancelled. Under 50% the allowance is zero, so every held position closes with reason `defer`, every cond. order is cancelled and no entry opens until the headline is back over 50%. With **Window net profit** on it also defers while the Forecast Grader's window net profit is negative (over at least 3 graded batches). With **Invert** on the direction flips: a headline over 50% defers, and the allowance scales by the mirrored factor `g` (depth under 50% over the recorded peak). The Inverse Forecast rule, while its toggle is on, overrides all of it, and with no headline the time allowance does nothing.

#### Swing Phase

Entries only: **Tight swings** is the one Swing Phase rule. It defers every entry while the window's average swing (the full cycle) is shorter than **Min swing**; it never closes a held position, and a missing reading (none in the window, or the newest older than 90 minutes) never blocks. When it trips it shows a **Swing Hold** pill and one log line naming its reason. Still-Water still records and plots the market and ticker phases, but MI no longer acts on them.

#### Fade

A negative Forecast Ranking score points against this side, so instead of entering that ticker Fade places a cond. order at the end of the move, its length the ticker's score × a scale read from the last completed forecast batch (the price each forecast reached in its score's direction, per pp of score, at **Reach** % of the batch's score size, adding older batches up to 20 forecasts; with fewer, tickers enter as usual). Worst case mirrors the target on the other side of the entry, TP and SL are the Relative Target percents at placement, and up to **Picks** orders per scan (one per ticker, at most **Fade slots**) each hold a position slot and clear after 1h or sooner under Deferment, a ticker further against this side replacing the weakest when the slots are full. A due Substitution is exempt from the slots, **Regime fade** puts the target on the favourable side while the headline is under 50%, and Fade is off while the inverse forecast is in use.

#### Targets Gauge

TP and SL each get a bar from the centre axis with a tick at Min Entry TP, while Cascade and Sacrifice are text only since they never fire below the floor. TP and SL are judged on the resolved value and Cascade and Sacrifice on the value before the floor lifts it, so those read red while the floor holds them up (a disabled one reads `off`). The caption shows the headline, its recorded peak and the factor, the gauge shows the configured values with Relative Target off, and full targets in purple while the inverse forecast is in use.

#### Force-Evaluate General Criteria

The function is `_micTopUpGeneralCriteria`. On a following bot this is the one exception to the no-own-fetch rule: it uses the leader's shared OC cache first and fetches the single symbol only if that has nothing.

#### Forecast Ranking

The score is Still-Water's sample score for the ticker in the bot's favor (`_swFcRankMap`), higher first, and every ticker in the latest batch that the scorecard could score is a candidate (a negative score isn't skipped; Fade, when on, takes it). The leader publishes the batch's scores once, in the store the Forecast Grader uses, and a follower waits up to 20 s for them before ranking (with none, the scan finds no candidates). Without Still-Water, MI enters any ticker matching its criteria, with no ranking.

#### Inverse Forecast

`_micInverseOn` runs the Forecast Grader's window through the trade simulation in forecast order and in reverse order. It is in force when the window net profit is negative and the window inverse net profit is positive with an average ROI per simulated trade over **Min Entry TP**, at least 3 graded batches behind each (`INV_MIN_BATCHES`). While it holds, entries rank on sign-flipped scores (only against-side tickers, most against first), Fade is off, Deferment never defers and Relative Target stands down. `micInverseEnabled` (default on, shown under Deferment) gates it, so with it off `_micInverseOn` returns null and none of this applies; it logs once when it starts.

### Still-Water Details

The details left out of the shortened Still-Water entries.

#### Still-Water overview

Still-Water's panel has two tabs: **CROSS** (the partner feed and last share) and **SCORE** (the scorer, forecasts and settings).

#### Sample Scoring

Criteria are read at sample time and paired with the last completed hour's price move, less the rolling LPA average, which makes it a same-moment correlation. LPA is never scored as a criterion on price observations and its dial stays hidden from the **Sample Scorer** unless Liquidation Surveillance is on. It forces the hour-candle fetch on, since LPA is its outcome.

#### Score Horizon

It lives in the Score tab's settings dropdown and is applied when the scorecard is built and when the store is saved. A short horizon leaves liquidation-fed poles thin (LPA especially). The Forecast Grader's graded store has its own size setting.

#### Sample Batch

The ticker request carries the 24h turnover, open interest and funding that `va`/`iol`/`ios`/`fund` compare against, the merged candle is what `lta`/`lpa` read (kept for the batch so the Forecast Grader can read the last ~10 minutes), and the long/short ratio is one more request per ticker. Each fetch is an independent snapshot, and the only recent-trade fetch is the opt-in Illiquidity Filter's. A follower seeds its cycle history from the leader's sample.

#### Liquidation Surveillance

The watch covers the sample batch less the Forecast Grader's revisit slots: each scan, tickers with liquidations stay (most turnover first), quiet ones are graylisted for sampling only and replaced, and the batch is always filled to **Batch Size**. At the end of each watch the batch is re-fetched and each event is scored as pp (its side × the window's typical move × its size against the median event in the **Event Size History**, capped at the history's peak), counted 1:1 with a price observation and blended 50/50 into pole scores, the favored-side comparison and the headline. Events are irregular, so scores built on them move slowly; the watch survives a reload (dropped after 12 h), only the leader watches, and a follower adopts the leader's observations, lean and event-size summary.

#### Instability Graylist

Each ticker's liquidated-short and liquidated-long turnover are kept per watch and summed over the retained window (0% is one-sided, 100% evenly mixed), and flipping between short-heavy and long-heavy watches compounds into instability. The threshold is relative to the average, so a market where everything is mixed doesn't graylist everything. The ticker stays in the watch so its record keeps updating, and the list works on a follower too.

#### Illiquidity Filter

Each batch measures only the tickers it carries with one recent-trade fetch each, a ticker's speed being the average gap between 3 trades, and an illiquid ticker is dropped from the batch before its hour candle and left out of the scan pool while its reading is live. When the reading expires the ticker is measured again, so slow tickers can recover, and coverage builds gradually. The leader measures and publishes, a follower makes no fetch, and the status line shows `N illiquid (>12s) · M measured · slowest Xs`.

#### Stablecoin Filter

The range is of the completed candle's open, high, low, close and the current price. Under the limit the ticker is dropped from that batch (counted in `excluded.gray`) and measured again after the verdict expires. The leader judges and publishes the verdicts.

#### Forecast Grader

Every ticker a batch carries gets a **sample score** (the mean score of the poles its fund, V/A, IO/L, IO/S and LTA readings land in, in the bot's favor) that ranks MI's entries, and a share is also frozen with its ~10-minute typical price as a forecast (never from a revisit or a ticker already waiting). **Lead** batches later the ticker returns as a revisit (up to **Revisits %** of the slots, before Liquidation Surveillance fills the rest) and is graded against its move less the start batch's mean (direction right = 50 + 50 × size match, wrong = 50 × (1 − size match)), voided if late, gone or in a cohort under 3; every pp number is in the bot's favor, so on Ashfall + is price up and on Permafrost + is price down. **Net profit** and **inverse net profit** run each batch's picks through a miniature trade simulation (host leverage, TP and SL, the recorded path deciding the exit, no fees), taking the best forecasts in the bot's favor for the first and the worst, trading the bot's own side, for the second, and the window's average ROI per trade is what MI's Inverse Forecast rule compares with Min Entry TP (the chart no longer prints it). The chart shows only a `Window:` and a `Batch hh:mm:` line, each with accuracy, net, inverse, the batches (window) or positions (batch) in profit and the same for the inverse.

#### Swing Phase

The leader merges the 5m candles every batch fetches (72 per ticker, 6 hours) into a per-ticker history (up to **hours**) and, for each batch, finds swings in the market and each ticker at 5m, 10m, 15m, 30m, 1h, 2h, 4h and 6h. The market line is the mean 5m return of every ticker with data, chained into an index. A series settles on the scale whose mean leg is furthest above what the 5m step volatility alone would move in a leg that long (needs 5 pivots; coarser scales within 10% of the best win ties, and the scale with the most pivots stands in when none qualifies). Its phase comes from the last confirmed pivot and how far the leg has run against the average leg (bottom or peak within the first fifth, slope in between), and a leg that has run most of an average swing and turned back a little already reads as bottom or peak. The swing length is the full cycle, twice the average leg. With fewer than 3 pivots the reading is unknown. Each batch's reading is one row, `{u: batch time, m: [phase letter, swing minutes, scale minutes], t: {symbol: same}}`, kept in `__ew_sw_<side>_swing_v1` (400 rows) and published as `swSwing` (the newest 60); a follower files the leader's new rows and plots, shows dots and defers from them, running no candles of its own.

#### Import (Export & Import)

Cross events are merged because that log is shared with the partner bot. The import log says how many sample observations were kept. A Scorer Readout or a single chart view is an example of a file with nothing importable.

### Chart and Scorer Display Details

The details left out of the shortened Sample Chart and Scorer entries.

#### Sample Chart

Each button is labelled with the view it goes to, the order wraps at either end, and the view resets to Vol on reload. The chart only shows when at least one sample exists. Each cycle group is stamped with its sample time, and clicking elsewhere returns to the latest.

#### L/S view

It is drawn from a zero line on a symmetric axis sized to 1.3× the 95th percentile of |value|. Only tickers whose batch carried the ratio appear.

#### Fcst view

Bars are sorted best first on a 0–100 axis (up at or above the 70% line, down below), each column is stamped with its grading time and the latest is selected by default, and after the dashed line each batch still to come shows a faint tick (`+1` = the next batch). The grayed summary shows counts, lead, revisit share and voids, followed by the two short `Window:` and `Batch hh:mm:` lines. The Tickers table lists that batch's tickers best accuracy first, with accuracy %, projected pp, actual pp and the raw move.

#### Swing view

Points sit at the market's swing length in hours on a signed axis sized to 1.3x the 95th percentile of the length (never under 2h), above the midline for upslope and peak and below it for downslope and bottom. Batches with no market reading leave a gap the line skips over. Rows are matched to batches by sample time or published time, so a follower plots the leader's rows too. Each column is stamped with its sample time, and the latest is selected by default.

#### Liq view

The window average uses each ticker's latest liquidation-event reading, and watched-but-quiet tickers aren't counted, so they can't pull it toward 0. Pill styles are **favorable** (fill and outline), **mixed favorable** (fill only), **mixed unfavorable** (outline only) and **unfavorable** (neither), where mixed means the minority side holds more than **Mixed %** of the turnover. Only tickers watched in a cycle appear, and the newest cycle fills in once its watch is scored on the next scan.

#### Dial families and the scorecard

`lpa` is the outcome and has no dial. Observations are tallied per side and per pole, and each scorecard reflects only its own bot's samples.

#### Scorecard chart

It is a single non-wrapping row of criterion duos that scales to its container, with the criterion emoji underneath each. The header shows the side's name and total; hover a bar for its PnL and W/L.

#### Sample Scorer

Hover shows the average edge, ↑/↓ counts and n. When Liquidation Surveillance is on, LPA is scored on liquidation outcomes and drawn. The Illiquidity Filter's line shows how many tickers are illiquid, how many have been measured and the slowest.

#### Headline & gauge

The share is the move in the bot's favor as a share of all raw move on that side, and hovering the gauge shows the sample count, the mean in dollars on one base position and the relative edge. **Bottom** and **peak** also need Min Samples and clear with the samples, and the headline reads `—` until enough samples carry a raw move. With Liquidation Surveillance on, the dollar mean and the peak and bottom are mixed too.

### localStorage Keys

Still-Water keys carry the side in their name (`<side>` = `chaser` on PseudoChaser, `winter` on PseudoWinter), and each side only touches its own. Everything Still-Water keeps except the profile, the Score-tab key and the cross-bot log lives in the plugin data store, not localStorage; the rows stay below.

| Key | Contents |
|---|---|
| `pw_v1` | PseudoWinter: cfg, positions, sess, closedTrades, bot timestamps, symbolBanlist, lostValue, laggardId, condOrders |
| `pw_v1_log` | PseudoWinter activity log (capped at 300 entries) |
| `__pw_plugins_v1` | PseudoWinter plugin manifest: per plugin its id, name, version, load-order and conflict metadata, `idb: true` and the source size. An entry stays whole until IndexedDB has returned its source on a later boot (see **Plugin source storage**) |
| `pc_v1` | PseudoChaser: same structure as pw_v1 |
| `pc_v1_log` | PseudoChaser activity log |
| `__pc_plugins_v1` | PseudoChaser plugin manifest, same structure as `__pw_plugins_v1` |
| IndexedDB `__ew_plugins_pseudowinter` / `__ew_plugins_pseudochaser` | Plugin sources (object store `src`, keyed by plugin id), one database per bot. Not localStorage, so outside its quota |
| `__ew_shared_v1` | Cross-tab shared registry for small caches: `watchTickers`, `klines_1h`, heartbeats (`hb_chaser`/`hb_winter`) and open symbols (`pos_chaser`/`pos_winter`). Capped at 200 KB, trimming oldest first; the large datasets move through the corridor |
| `__ew_xm_<type>_<bot>` | Corridor manifest for one in-flight handover (id, timestamp, packet count, size, checksum). Deleted when the last packet is confirmed; normally absent |
| `__ew_xp_<type>_<bot>_<n>` | One corridor packet (up to 40,000 characters), deleted once the receiver confirms it. At most 4 exist at once; normally absent |
| `__ew_xa_<type>_<bot>` | The receiver's confirmation for a handover (cumulative packets received, or a restart request), deleted by the publisher on completion. Normally absent |
| `__ew_share_meta_v1` | Share ledger behind the Last Share readout: per dataset the last send, the last receipt per bot, the last skip and the last error |
| `__everwinter_cross_v1` | Cross-bot event log written by **Cross Broadcast**: cascade/sacrifice triggers tagged with their source bot, read every 15 s by the partner for the **Partner Feed**. Retained 30 days, with a 200KB cap evicting the oldest first |
| `__still_water_<side>_v1` | Still-Water profile for this side. Nothing is written to it now (it held the GC window and drawdown state); `__ashfall_chaser_v1` / `__permafrost_winter_v1` were moved into it once on first load |
| `__ew_sw_<side>_extremity_v1`, `__ew_sw_<side>_dialpool_v1`, `__everwinter_extremity_v1` | The old closed-record store, sample pool and shared record store. No longer read or written; safe to clear |
| `__sw_<side>_oc_history` | The sample cycle history behind the Sample Chart (the last 25 cycles) |
| `__sw_<side>_score_ui` | Score-tab panel state (open dropdowns) |
| `__ew_sw_<side>_sampleobs_v1` | This side's Sample Scoring store: `obs` (scored observations, price ones with raw move `r`, liquidation ones with `y`, `r`, `w`, `z`), `wx` (headline peak/bottom), `lgray` (quiet graylist), `lqh` (Event Size History, up to 5000 entries) and `lqs` (the leader's summary a follower shows). Observations older than the **Score Horizon** are dropped at save and ignored at build, with a size cap (3 MB at most) as a safety net. The scorecard CLEAR wipes it |
| `__ew_sw_<side>_ilq_v1` | This side's Illiquidity Filter readings: symbol → `{t, g}` (time measured, average gap in ms between its last 3 trades), live for **Measure again after** days and dropped when unseen for 3× that. Kept apart from the sample store so clearing samples doesn't discard a week of fetches. The leader hands it over as `ilq` and a follower merges it in |
| `__ew_sw_<side>_stb_v1` | This side's Stablecoin Filter verdicts: symbol → time judged, live for **Graylist for (hours)** and dropped when expired. The leader hands it over as `stb` and a follower merges it in. Loaded on first use |
| `__ew_sw_<side>_fc_v2` | This side's Forecast Grader store (version 2): `seq`, `ts`, `pend` (`{s, a: start batch, d: due batch, t, p: frozen price, p0, e: sample score, c: tags}`), `done` (`{s, a, d, t, u: time graded, e, y: actual less batch mean, m: raw move %, k: batch mean %, mu / md: highest / lowest point, c}`, kept to Graded forecasts kept), `rk` (`{a, m: {symbol: sample score}}`, the scores that rank MI's entries), `voids` and `nof`. `e`, `y` and `rk` are in price direction. A follower adopts the leader's copy as `fcGrade` (newest 200 graded plus `rk`) |
| `__ew_sw_<side>_swing_v1` | This side's Swing Phase readings: `{v: 1, rows: [{u, p, m, t}]}`, one row per sample batch (`p` is the ts the leader published the batch under, which a follower files it by), newest 400 kept. A follower files the leader's published rows here. |
| `__ew_sw_<side>_fc_v1`, `…_bg1h_v1`, `…_pm_v1`, `…_div_v1`, `…_crab_v1`, `…_seq_v1`, `…_mkt_v1`, `…_period_v1`, `…_period_pat_v1`, IndexedDB `…_fcdb_v1` | The retired Forecast Grader layers' stores. Deleted on load; no longer read or written |
| `__sw_<side>_liq_pending` | This side's liquidation watch in progress: watched tickers, running turnover tally, blind time and any closed watch not yet scored. Saved as events arrive (4 s throttle), on each pick and ingest and on page hide, restored by the first scan after a reload, and cleared when Liquidation Surveillance is turned off. Dropped if older than 12 h |
| `__ew_creds` | EverWinter live plugin API credentials |
| `__sc_creds` | SunChaser live plugin API credentials |

### Criteria Sampling Internals

- **Ticker Ranking**: each scan draws **Batch Size** tickers at random and fetches them fresh, and that batch feeds scoring. Entry candidates are every ticker the sample has reached, ordered by the sample score and refetched right before opening, capped at one batch size of refetches per scan. The batch isn't purely random: Liquidation Surveillance, the Forecast Grader's revisits and the Illiquidity Filter all shape it.
- **Tier gate**: every criterion computes an integer tier as `floor(value / step)` and compares it against N, except `fund`, which truncates toward zero so a tiny negative rate lands on `fund-0`. Steps show as read-only chips under **Tier Step Sizes** on the Fetch tab. The same tier is recorded on the position and used as the scorecard key, so `fund>40` and `fund+70` score separately.
- **Bare-form `fund`**: in Auto mode a bare criterion normally still requires a nonzero tier, but `fund`'s bare form matches any finite rate, 0% included, since real funding rates mostly sit under one **Fund Step**. A near-zero rate is a real lukewarm reading (`fund+0`/`fund-0`) and feeds the lukewarm chart.
- **Funding emoji**: position and trade badges show 🤑 or 💸 for a `fund` tier according to whether the sign favors the bot's own direction, so Winter and Chaser show opposite emoji for the same sign. The Extremity Scorer's pills use one fixed set on both bots (💸 positive, 🤑 negative).
- **`va`**: `va+12` = 12 tiers hotter than the sampled population. `_swVolIoWindowAvg` delegates to `_swWindowStats`, a deduplicated latest-reading-per-symbol read memoized per history state, which the Sample Chart's Total avg also draws from.
- **`iol` / `ios`**: a ticker's long share of open interest is `oi × long share` and its short share the remainder. The long share is Bybit's long/short account ratio (`_swLsRatio`: `GET /v5/market/account-ratio`, 5-minute period, `buyRatio ÷ (buyRatio + sellRatio)`), fetched per sampled ticker and stored as `bl`. The tier is `floor(100 × ln(share ÷ window average) ÷ step)`, so there is none without both `oi` and `bl` or without a window average.
- **`fund`**: tier is `trunc(rate% / Fund Step)` with an explicit sign, and sample records carry the rate as `fr` (%) for the Fund chart and scoring.
- **`lta`**: `_swLtaDev`; `lta+12` = 12 × **LTA Step** (default 10%) above the ticker's own average hour (`turnover24h / 24`), with no population baseline.
- **`lpa`**: `_pfLpaWindowAvg(sym)`/`_afLpaWindowAvg(sym)`, in tiers of **LPA Step** (default 0.25pp) as absolute points, since a relative deviation is unstable near a zero mean. No tier until at least one other ticker has an `hc` reading in the window.
- **Candle fetch**: `_swHourCandle` calls `GET /v5/market/kline` at `interval=5&limit=72` and merges the candles inside the last completed hour (`_swHourStart`) into its hour reading, so `ht`, `hc` and `htp` keep their meaning and the forming candle is never part of it. The candles also sit in memory for the batch (`CAND5`), where the Forecast Grader reads the typical price of the last ~10 minutes (`_swTyp10`) and the path since a forecast. The hour reading goes in a memory-only cache (`HOUR_CACHE`) and rides the ticker's OC cycle entry so a follower gets it from the leader (`_swHourReading`), and the fetch happens whenever `lta` or `lpa` is in use.
- **Fresh batch fetch**: `_swFetchFreshTicker` calls `GET /v5/market/tickers?category=linear&symbol=` per batch symbol and stores a compact `{ vol, oi, fr, px, ch }` reading, and a failed fetch drops the ticker with no fallback to the bulk list. A follower rebuilds tickers from the leader's readings (`_swSynthTicker`). Entry candidates are refetched the same way by `_swFetchCandidate`.
- **Entry-pool freshness**: MI acts once per new batch (`_swOcResultsAt`), and `_micOpen` skips the pre-open price refetch for a ticker from the current batch. Candidates come from each ticker's latest stored reading (`_swLatestReadings`, rebuilt by `_swSynthStored`), and a non-batch candidate is refetched by `_micVerify` before it opens, up to **Batch Size** per scan. The refetched ticker only has to still qualify, not keep its ranked tier or score.
- `_micHourTier` returns `null` for missing data: the criterion check reads it as false and the annotator as "no sample", never a fake `+0`.
- Emoji for retired criteria stay resolvable in `critEmoji`/`swCritEmoji` so old records and exports render; they are display-only.

### Deferment Internals

- **Signal**: `_micDefermentState` first asks `_micInverseOn()` (null while `micInverseEnabled` is off), and when it holds nothing defers. Otherwise, with `micDefermentEnabled` on, it defers when `_micHeadline()` has `s < 0` (`s > 0` with `micDeferInvertEnabled`) or, with `micDeferWinNetEnabled` on, the Forecast Grader's window net profit (`_micFcWin().reg`) is negative over at least 3 batches, and the state's `why` feeds the log and pill. `_micHeadline` returns null unless `_micSwLoaded()` and the favored side's weather has `s` and `share`; its `f` is `s / sHi` capped at 1 (1 with no peak, 0 at `s ≤ 0`) and its mirror `g` is `-s / sHi` capped at 1 (1 with no peak, 0 at `s ≥ 0`).
- **Timing**: `_micAllowedMs` is `min(base, max(minMs, base × f))` (`g` in place of `f` with `micDeferInvertEnabled`) (`base` = `runtimeHours`, `minMs` = `micDeferMinMins`), null with Deferment off or no headline, and the full `base` under the Inverse Forecast rule. `_micEnforceTiming` runs every scan in `_micScanPrep` before slot logic, closing non-pending positions of any strategy older than it with `timing` and cancelling older cond. orders. While deferring the allowance is 0 and the reason is `defer`, with closes and cancels run concurrently, each in its own try/catch.
- **Entry effect**: the scan returns before every open path, with guards inside `_micTrySubstitute` and `_micOpen`, though historical scoring still runs. One `⛔ Deferment` log line per streak, and `_extraStatusPills` shows the **No Entry** pill.
- **Ejection**: retired. `_micEject` and the `ejection` label remain, but nothing calls it.

### Loss Swap Internals

- **Selection**: inside `_micTrySubstitute`, after the Min Age filter, `lossLimit` is `-(baseMargin × micLossSubPct / 100)` and `lossWorst` is the non-pending eligible position with the lowest `upnl` at or below it (null with `micLossSubEnabled` off). When it exists it replaces the lowest-scored position as `worst`, and the score margin is dropped (`needMargin` is `-Infinity` in place of the Substitution Margin).
- **Reuse**: candidates still pass the same verify, Force-Evaluate pre-flight, feasibility check and Fade handling, and the close goes through the same path as Substitution, so its trade card reads **Sub**; the log line reads `Substitution (loss)` with the uPnL against the limit. It runs only where Substitution does (no free slot, no deferment), at most one swap per scan.

### Fade Internals

- **Entry**: `_micFadeEntry` runs in `_micScanEntry` right after the Deferment return. For each pool candidate with `fcRanked` and `compositeScore < 0`, most negative first, it runs `_micVerify` and `_micFadePlace`, which calls `placeCondEntry` with `tag: 'fade'`, `target` and `worst` at `price × (1 ± dist/100)` and a candidate carrying `_micFade`, `_tpPct` and `_slPct`. The pool it returns leaves out the tickers it took.
- **Slots**: `_micFadeRoom` is `micFadeSlots` capped by the free position slots, and `_micFadeHeld` counts pending `fade` orders, which `_micScanEntry` adds to the in-flight count so normal entries and Substitution leave those slots. `_micFadeCap` runs in `_micScanPrep` after `_micFadeExpire` and cancels the weakest orders (by `_micFadeNow`) beyond the room. When the slots are full, `_micFadeEntry` swaps a better-scoring ticker in for the weakest.
- **Distance**: `_micFadeScale` takes the newest `_swFcStore().done` batch, adding older ones up to 5 until it has 20 rows. Each row is the excursion (`mu` for a score above 0, else `-md`) ÷ `|score|` (`e`), weighted by `|score|`. `k` is the ratio that Reach % of the weight reached, and the distance is `|compositeScore| × k` %.
- **Only and substitution**: with `micFadeOnly` the scan returns after Fade runs, running only `_micTrySubstitute` when the book is full. An against-side winner goes through `_micFadePlace` with `_micSub` (exempt from the slots) and the worst position closes after it.
- **Expiry**: `_micFadeExpire` runs in `_micScanPrep` after `_micEnforceTiming` and cancels `tag === 'fade'` orders 1h past `createdAt` through `cancelCondOrder`.
- **Regime**: `_micRegimeOn` is true when `micRegimeFadeEnabled`, Fade is on and `_micHeadline().s < 0`, and then `_micFadeEntry` and the substitution pre-check take `compositeScore > 0` (highest first) with `_micFadePlace` flipping the sides of `target` and `worst` and setting `_micRegime`. `_micFadeRegimeSync` runs after `_micFadeExpire` and cancels `fade` orders whose `_micRegime` differs from the current state (`fade regime changed`), and all of them while the inverse forecast is in use.

### Relative Target Internals

- **Targets**: `_micTargets` returns `{active, entryTp, slPct, cascadePct, sacrificePct, minTp, h, fac}`, each the configured value × `fac` (`_micHeadline().f`, or `.g` with `micRelInvertEnabled`) with `entryTp` floored at `minTp` and `slPct` at 1%. It returns the configured values untouched (`active:false`) when Relative Target is off, neither Cascade nor Sacrifice is on, there is no headline, or the Inverse Forecast rule is in force. `_micEffCascadePct` and `_micEffSacrificePct` return the resolved % floored at Min Entry TP and 1%.
- **Per-position overrides**: `_micOpen` passes `_tpPct` and `_slPct` on the candidate: the host uses `_tpPct` for the entry TP and `_slPct` for the binary-mode SL at open, also stored as `pos._slPctOverride`, which the DCA-mode SL arm, the SL drift check and the position card honor. Both fields are left off the copy of candidate fields onto the position.
- **Targets gauge**: `_micTargetsView` turns `_micTargets()` into `{left, right, note, time}` (left SL and Sacrifice, right TP and Cascade), each row with its text, a bar width (none for Cascade/Sacrifice) and a class: `ok` at or above `minTp`, `bad` below it, `off` when disabled or waiting, and `inv` (purple) while the inverse forecast is in use. Cascade/Sacrifice classes read the raw percentages while their text reads the effective ones, and `time` is the `Time allowed` line from `_micAllowedMs`. The note and the Now line show `fac`, marked `(inverted)` with Invert on.
- **Entry ranking**: `_micScanPool` asks `_swFcRankMap`() for the batch's sample scores (a follower adopts the leader's store with `_swFcAdopt`, waiting up to 20 s for a newer one) and, with Still-Water loaded, cuts the pool to those tickers (`noScore` in the skip summary). Each is scored by `_micRankScore`, sign-flipped under the inverse rule, which also drops tickers not scoring against this side (`notAgainst`). Candidates sort by score then funding magnitude, and `compositeScore` is what Substitution compares with `_micLiveCompositeScore` (`_swFcScoreOf`, flipped the same way) and writes to `pos._micCompositeScore`.
- **Headline source**: `_swSampleBuild` accumulates raw edge per bucket into `swSampleBucketMeans` and the signed favorable share `(P−Q)/(P+Q)` into `sE`/`sL`, and `_swSampleWeather` returns the dollar `value`, the share (`s`, `share` as 0–1) and the peak/bottom of each (`sHi`/`sLo`). `_swSampleTrackWx` keeps the peaks in the sample store as `wx`, the leader shares them, and `sHi` also drives MI's headline factor. Each source is reduced to per-observation pp mass `{P, Q}` and the sources mixed on `P` and `Q` (50/50 for liquidation, once its bucket holds Min Samples), so `a = P − Q` and `s = (P − Q)/(P + Q)` can never differ in sign.

### Extremity Scorer Internals

- **Cutoffs**: they come from the scored sample observations in `_swSampleBuild`: a pole with at least **Min Samples** readings cuts off at its **Extreme Split** percentile, and anything below it or on an unproven pole is lukewarm. Bare sign-only tags (`+fund`/`-fund`) carry no magnitude and always classify extreme.
- **Two tallies**: the dial tally counts extreme occurrences only and is the flat `micCollapsedSlotRanks`/`micCollapsedCritStats` lookup MI's manual-slot ordering reads. The Lukewarm Scoring tally counts every occurrence by class then pole (`fund+`/`fund-`, not merged by family, since a family's poles are opposite signals).
- **Favored side**: `_swLukewarmFavoredSide`, re-decided each time the scorer rebuilds (once per scan cycle).
- **Sample Scoring**: `_swExtremityBuild` runs `_swSampleBuild`, which publishes the cutoffs, `micCollapsedSlotRanks`, the two-bucket scoreboard and the per-bucket mean edge (`swSampleBucketMeans`) from `__ew_*_sampleobs_v1`. `_swSampleIngest` stores one observation per ticker per cycle (criteria tags, `y` = the last completed hour's price change minus the rolling LPA average, `r` = the raw change), and the build keeps each ticker's latest per clock hour and skips `lpa` tags on price observations. The leader hands `sampleScore` through the corridor and a follower adopts it each scan (`_swSampleAdopt`).
- **Forecast Grader**: `_swFcPlan`(pool, cap)` runs from `_micScanFetch` before the batch is built (leader only), taking pending forecasts with `d <= seq + 1` oldest first, skipping illiquid and stablecoin tickers, capped at `floor(cap × share)` and stored in `_swFcPlanned`; the builder removes them from the pool and fetches `[...revisits, ...pool]` cut to `cap`. `_swFcIngest` runs after each batch's `_swSampleIngest`, idempotent on the batch timestamp: it grades due forecasts (`late` past 1.5 × lead × `_swFcStepMs`, `gone` after two missed batches, `thin` under 3 per cohort, with `m = (typical / price − 1) × 100`, `mu`/`md` from the 5-minute candles and `y = m − k`), scores every batch ticker with `_swFcParts` against the scoreboard built before this batch (filed as `rk`), then starts shuffled forecasts on scored non-revisit, non-pending tickers up to `min(share slots, share slots × (lead + 3) − pending)`. `_swFcStats`, `_swFcChartSvg`, `_swFcBreakdownHtml` and the text helpers draw the Fcst view, and `_swFcExport`/`_swFcSanitize` (version 2 only) handle export and import.
- **Liquidation event size**: `_swLiqIngest` builds the yardstick from `_swLiqHistLive` (the stored `lqh`, aged by `_swLiqHistMs`) plus the batch's own sizes (`_swLiqSizeStats`: `{n, med, peak, bottom}`), then writes `pp = sign(net) × _swLiqScale() × min(z, peak) ÷ med` as `r` and appends the batch to `lqh` (capped at 5000). The leader publishes `_swLiqHistStats()` as `lqs` and a follower adopts it, and the profile import accepts `lqh`.
- **Forecast net profit**: `_swFcNet`(recs, inv)` takes the batch's forecasts with a raw move `m`, converted to the bot's favor, keeps those with `e > 0` (`e < 0` with `inv`, lowest first) and takes the top `cfg.maxPos` (3 if unset). Each pick uses `tp`/`sl` (ROI ÷ leverage from the host's binary or entry/DCA settings), `liq = 100 ÷ leverage − 0.5` and `mu`/`md` for the path, exiting at the stop (`−minNotional × sl ÷ 100`, or the margin on liquidation), else the TP, else held at `m`, with a both-touched path counting as the stop. `_swFcWindowNet`(inv)` runs it per start batch and returns `{usd, nb, nw, n, roiPct}`, read by the Fcst text helpers and MI's `_micFcWin`.
- **Forecast storage**: `_swFcLoad` reads `FC_KEY` (`__ew_sw_<side>_fc_v2`), deletes the retired keys and databases, and starts empty when the copy isn't version 2. `_swFcSave` trims to the keep and, as leader, shares it as `fcGrade` (newest 200 graded plus the batch's scores). `_swFcExport(part)` builds `summary`, `graded`, `pending` and `store` (Profile export only), with the `forecast:` parts written without indentation.
- **Graylists**: the quiet graylist `lgray` sits in the sample store, is written and read only by `_swLiqPick`, and leaves a quiet ticker a normal entry candidate. The Instability graylist blocks entries and isn't stored: `_swInstabStats` sums `lu`/`ld` per symbol over the retained cycles (needing `swInstabMinWatches`, 2, watches with liquidations), scores `1 − |U − D|/(U + D)` and flags symbols at or above `avg × (1 + Instability %/100)`.
- **`_swGrayHas`**: checked in `_micScanFetch` and counted as `excluded.gray`, it is true for the Instability set and for any ticker `_swIlqIs` or `_swStbIs` flags. The Instability check works while following, the liquidation lists do nothing with Liquidation Surveillance off, and `_swLiqPillClass` classifies a watch for the pills from `lu`/`ld` (falling back to the sign of `lq`).
- **Thin poles**: a pole under **Min Samples** scores 0 and counts as lukewarm. At Min Samples its score becomes the plain mean of those readings with no shrinkage, so a rare pole jumps from neutral to full weight on a handful of readings.
- **Score Horizon**: `_swObsHorizonMs` (minimum 0.5 h), `_swObsLive` and `_swObsTrim` (age trim, then a byte cap from `_swObsCap`) are the only retention rules for the sample store, and the build and status line read `_swObsLive`. The copy published for a follower is capped at 60 KB, so it can hold less than the leader.
- **Export / Import**: `_swExportPart` builds each export from the in-memory stores (cross events through `_swCrossRead`) and `micExportData` adds `exportType`, `exportedAt` and `version`. `_swImportApply` recognizes record types by their keys rather than `exportType`, so single-type files, Profile and Everything all import and only the stores present are replaced. Sample observations go through `_swSampleSave` (older than the horizon are dropped) and cross events merge on `ts|kind|source|symbol`.
- **Liquidation Surveillance**: the feed is `allLiquidation.<symbol>` on the public linear WebSocket, held at module level in `LIQ` (the socket, subscriptions, the per-symbol tally `{up, dn, n}` with up = liquidated shorts and down = liquidated longs, the watched set and the closed watch awaiting scoring).
  - **Feed**: subscriptions are diffed and sent 10 per request, with a 20 s ping and 5 s reconnect, and only while `_swLiqOn()` holds (toggle on, not following).
  - **Picking**: `_micScanFetch` calls `_swLiqPick(pool, cap)`, which closes the watch that just ran (keeping watched tickers with events, most turnover first, and sending those without to `lgray`). It fills the batch with the kept, fresh non-graylisted and, only if still short, the oldest-graylisted tickers, then subscribes the new set. It returns null when off or following, and the random batch stands.
  - **Ingest**: `_swLiqIngest` writes one `k:'l'` observation per ticker with events: criteria from the fresh reading (LPA included), `y = (up − dn)/(up + dn)`, `r = y × S` and `w = up + dn`, with `S` (`_swLiqScale`) the median |latest 1h change − window average| (floor 0.05pp). A ticker with events that wasn't re-fetched gets none.
  - **Cycle stamps and sharing**: it also stamps `lq` (the event's pp, 0 for quiet) and `lu`/`ld` (liquidated turnover in $) on the cycle the watch began on, read by the Liq view, the pills and the Instability graylist. The leader hands the lean over as `liqLean` (`{cts, lq, ls}`) and a follower's `_swLiqAdopt` files it on the matching cycle, retrying next scan if it isn't there yet.
  - **Build**: `_swSampleBuild` ignores `k:'l'` observations while the toggle is off. Otherwise each is parsed like a price observation (`edge = dir × r`), weighted `min(3, w / median w)` and added to the same pole pool and cutoffs, with the 50/50 mixes described in **Headline source**.
  - **Caveat**: the LPA window average, V/A, IO/L and IO/S baselines read each ticker's latest reading, so a batch weighted toward tickers that keep liquidating tilts those baselines toward active names.
  - **Persistence**: the watch persists to `__sw_<side>_liq_pending` (4 s throttle, plus each pick, ingest and page hide) with its blind time. The first pick after a reload restores it (dropping anything over 12 h), reconnects the feed and scores it with the next ingest, and price and liquidation observations are trimmed to the byte cap separately.
- **Illiquidity Filter**: readings live in `ILQ.rec` (`{ SYM: { t, g } }`), loaded by `_swIlqLoad` in `init()` and saved by `_swIlqSave` to `__ew_sw_<side>_ilq_v1`.
  - **Measure**: `_swIlqMeasure`(sym)` makes one `GET /v5/market/recent-trade?category=linear&symbol=…&limit=3` through `_qFetch` and returns `(newest − oldest) / 2` in ms, or null on a failed fetch or fewer than 3 trades. `_swIlqIs` is true when the toggle is on, the reading is fresh (`swIlqRefreshDays`) and its gap exceeds `swIlqSlowSecs` × 1000.
  - **In the batch**: in `_ocFetchBatch` a flagged ticker is skipped before any fetch, and one with no fresh reading is measured right after its ticker fetch and removed from the batch if illiquid. The batch log line adds `N t measured (M illiquid, left out)`, and the save drops readings unseen for 3× the refresh window.
  - **In the pool**: `_swGrayHas` includes `_swIlqIs`, so MI leaves flagged tickers out of the pool before the batch is drawn (counted as `excluded.gray`).
  - **Following**: a follower makes no fetch, and `_swIlqAdopt` in `_ocSeedFromShared` merges the leader's shared `ilq` (newer reading wins) and never publishes it back.
- **Stablecoin Filter**: verdicts live in `STB.rec` (`{ SYM: ms }`), loaded by `_swStbLoad` and saved by `_swStbSave` to `__ew_sw_<side>_stb_v1`. It adds no request: `_swHourCandle` calls `_swStbJudge` with each fresh hour candle, stamping the ticker when `(max − min) ÷ open` is under `swStbMinPct`, and `_swStbIs` holds while a stamp is younger than `swStbHours`. A just-judged ticker is dropped from the batch and left out of the pool via `_swGrayHas`, and a follower merges the leader's shared `stb` via `_swStbAdopt`.

### Cross-Tab Data Pool

Both bots share data through a small registry in `localStorage.__ew_shared_v1` (with `BroadcastChannel('ew_shared')` notices) for caches, heartbeats and open-symbol lists, and through the **corridor** for the large datasets. Registry writes are last-write-wins per data type, and either bot operates normally solo.

Each bot publishes its open-symbol list on every position open/close and once per heartbeat. A following bot checks the leader's list before opening and skips any ticker the leader holds, and the check switches itself off when the leader's heartbeat goes stale.

Most `BroadcastChannel('ew_shared')` messages follow a `_sharedWrite`/`_sharedMerge` write, though not all. `registerSharedMessageHook` is the general subscription point on the receiving end.

### The Corridor

The corridor is a handover lane, not storage, carrying `bulkTickers`, `ocResults`, `sampleScore`, `fcGrade`, `swSwing`, `liqLean`, `ilq` and `stb`. The publisher cuts a dataset's JSON into packets of up to 40,000 characters, with at most 4 in localStorage at once across all datasets. The partner copies each into memory and confirms it in `__ew_xa_<type>_<bot>`, and the publisher deletes confirmed packets and then the manifest, leaving the lane empty between handovers.

The receiver reassembles in memory, checks length and checksum, and exposes the result through `_sharedRead` (only what the partner handed over; `_sharedPubTs(type)` gives the timestamp it files it under). Consumers then overwrite their own stored data from it. The delivered copy is memory-only, so a bot that reloads has nothing until the partner's next publish.

- **Pacing**: packets are confirmed in order. Pumping is triggered by the browser's `storage` events, a 1 s timer and each heartbeat.
- **Resend**: a receiver that reloads mid-handover, or whose reassembly fails its checksum, asks for a restart and the publisher resends from packet 0 (at most 3 restarts).
- **Abandon**: no confirmation for 120 s, or no room in localStorage for a packet, abandons that handover and logs `[SHR] ⚠` once per 30 minutes per dataset. A newer publish of the same dataset supersedes an unfinished one.
- **Partner offline**: nothing is sent while the partner's heartbeat is stale, and the ledger records it as skipped.
- **Cleanup**: at init each bot removes its own leftover lane keys, the dedicated keys from an earlier build (`__ew_sh_*`) and any legacy copy of a corridor dataset still in the registry.

### Scan Scheduler Internals

- **Stages**: `runScan` calls `_scanPipeline(ctx)`, which runs the host's `tickers` stage then each plugin stage in load order (`sw-post`, `mic-prep`, `mic-fetch`, `mic-pool`, `mic-entry`). Stages share `ctx`, a plugin appends `{ id, group, run }` to `_scanStageDefs` in `transform`, and a stage returning `false` skips the rest of its group. A host without `_scanStageDefs` gets `runScan` wrapped instead.
- **Checkpoints**: loops call `if (this._scanDue()) await this._scanCp()`, which yields once `schedSliceMs` has elapsed (40 ms while hidden). The yield is a `MessageChannel` task rather than `setTimeout`, since a hidden tab clamps timers to 1 s or more.
- **Idle lane**: `_schIdle(key, fn)` queues one coalesced job per key (extremity rebuild, sample-store saves), flushed when the pipeline ends; `_schIdleCancel(key)` drops it.
- **Config edits while running**: the lock no longer forces itself on while the bot runs, and config is read live, so a toggle flipped mid-scan can apply to the rest of that scan. Only the scan interval is frozen per cycle (`_scanTotalMs`), so editing Scan Interval never triggers an immediate scan.
- **Timing**: each scan logs one `[SCH]` line with total ms, yields, long-task count and per-stage ms. `ui.scanning` stays on through the plugin stages, so a batch that outlasts the scan interval makes the next scan skip. The extremity rebuild is still one synchronous call.
- **Queue**: every background or bulk fetch runs through a single per-bot scheduling queue (**Scan Scheduling** in Main Config), while execution-critical single-symbol calls bypass it. The scan hands control back to the browser after each time slice (**Slice Budget**), so position watching, clicks and timers run mid-scan.
- **Running both bots**: when both are open they share bulk ticker fetches, kline caches and sample batches to halve API load. Either bot works normally on its own.

### Cond. Order Internals

- **Order record** (`condOrders`, saved in `pw_v1`/`pc_v1`): `id`, `symbol`, `entryPrice`, `target`, `worst`, `dir` (1 when target is above entry, -1 below), `markPrice`, `createdAt`, `tag`, `candidate` (JSON copy), `_pseudo` (false for live), `_lastPx`, `_lastSeen`; live orders add `orderId` and `qty`.
- **Host hooks**: `placeCondEntry` validates and calls `_condSubmit(order)`, a no-op in the simulation, and `pseudoWatchCondOrders` runs from `pseudoWatchPositions` (one run at a time) for `_pseudo !== false` orders. `_condPrices`, `_condHit`, `_condKlines`, `_condKlineHit`, `_condResolve`, `_condWhiplashCheck`/`_condWhiplashAudit` and `_condGapAudit` are shared with the live plugins. `bailAll` calls `cancelAllCondOrders` first.
- **Fill**: `_condTrigger(o, at)` removes the order first, then opens through `pseudoOpenShort`/`pseudoOpenLong` with `candidate._condFill` used in place of the last price (and left off the position's copied fields). `at` back-dates `openedAt` and `_lastSeenAt`.
- **Live order**: EverWinter/SunChaser replace `_condSubmit` and `pseudoWatchCondOrders` and wrap `cancelCondOrder`. `_condSubmit` runs the entry checks, sets leverage and posts `POST /v5/order/create` as a GTC Limit order, not reduce-only, with `triggerPrice` = `price` = target, `triggerBy` LastPrice and `triggerDirection` 1 or 2. Qty is `minNotional / target` snapped.
- **Live watcher**: one `GET /v5/order/realtime` per tick (up to 5 pages), with a missing order looked up in `realtime` then `order/history` and dropped after 3 polls if found in neither. `Filled` hands `avgPrice` to the open function as `_condFill` with `_condQty`, which skips the entry guards, then builds TP, SL and DCA orders as usual. Worst case cancels on the exchange, and if the cancel is refused because the order filled, the position is tracked instead.

### Live-Mode Internals

- **The tab buttons always work**: every control from **Order type** down is locked while Config Lock is on (automatically while the bot runs), and settings persist in the bot's config and travel with Export / Import. Keys use the `ew` prefix on EverWinter and `sc` on SunChaser.
- **Balance**: fetched automatically the moment a valid key/secret pair is saved in the credentials panel, not only at page load.
- **Symbol banning**: a symbol is banned for a week when Bybit reports it can't be traded or it's blocked until a trading agreement is signed. Both need a manual fix on Bybit's side, so the ban is long-term rather than retried every cycle.
- **Post-bail re-check**: after a bail sweep the plugin queries the exchange for any position still open in its own direction and force-flattens it with a reduce-only close following the **Close** tab settings. This catches positions that failed to fully fill.
- **Exchange sync cadence**: the full-book `GET /v5/position/list` sync runs once before and once after each scan loop, and nowhere else, so exchange-native TP/SL and DCA fills are picked up at the next scan boundary. Entries and closes confirm their own fills with single-symbol `position/list` calls while in flight.
- **Concurrent group closes**: a live close doesn't return until the position is flat, so every multi-position close path (`bailAll`, Cascade, Sacrifice, Ejection) runs its closes under `Promise.all`, each in its own try/catch so one failure doesn't abort the group. Signed requests still queue through `_scDelay`/`_ewDelay` (250 ms apart), and the `_scClosing`/`_ewClosing` guard and the host's `_closingIds` make a second close of the same position a no-op.
- **Close-record lookup**: the `pseudoClosePosition` wrapper finds the trade it just closed by position id rather than `closedTrades[0]`, since concurrent closes can insert another record while this one awaits. The record feeds the MI direction-awareness feedback.
- **Cycle re-entry guard**: each close schedules a `runScheduledCycle` about 500 ms later, and the plugin's wrapper returns immediately while a cycle or earlier wrapper call (`_cycleWrapBusy`) is in progress. That stops N concurrent closes from running N pre- and post-scan syncs.
- **Pre-entry check**: before each entry the plugin asks the exchange for that one symbol and skips the entry if any position is already open on it, so a new order is never stacked on a position the bot isn't tracking.
- **DCA repair**: re-places missing DCA conditional orders, and runs only in the post-scan sync. It is skipped in binary mode, for positions with no DCA orders, and for positions opened in the last 2 minutes, since order status can lag a fresh placement.
- **Live retry log lines**: the `[EW]`/`[SC]` retry messages are logged with `live = true`. Cascade, Sacrifice and Bail wrap their closes in a log batch, which would otherwise hold every non-error line until the last close succeeded.
- **Mark price ownership**: the pseudo watcher is the only writer of a live position's `markPrice`, and the sync sets it only when the position has none yet. This stops displayed prices jumping toward entry at each sync.
- **Live position prices**: the base watcher skips live positions, so the plugin reads the host's WebSocket ticker when it has one, else one REST ticker call per symbol on a throttle. The **Price Poll Interval** base is 5 s, doubling while price moves under 0.1% and capped at 60 s.

### Plugin Transform Pipeline

``
pw()  →  plugin[0].transform(def)  →  plugin[1].transform(def)  →  ...  →  Alpine
``

Each plugin's `transform(def)` receives and returns the component definition, so load order matters for method wrapping. Strategy plugins must declare `after: ['everwinter']` / `after: ['sunchaser']`, so live-trading plugins load before strategy plugins (Still-Water, then MultiIndicator). The Plugin Manager shows the load order and warns about conflicts.

### Bybit API Endpoints Used

**Public**: `GET /v5/market/tickers` (bulk for the symbol universe, per symbol for criteria data), `GET /v5/market/recent-trade`, `GET /v5/market/kline` (hourly bars on the bots, 5-minute bars on Still-Water, 1-minute bars for the whiplash and gap audits), `GET /v5/market/account-ratio` (Still-Water only), `GET /v5/market/instruments-info`. **WebSocket**: `wss://stream.bybit.com/v5/public/linear` (position price stream). **Signed (live mode)**: `GET /v5/account/wallet-balance`, `GET /v5/position/list`, `GET /v5/position/closed-pnl`, `GET /v5/order/realtime`, `GET /v5/order/history`, `POST /v5/order/create`, `POST /v5/position/trading-stop`, `POST /v5/order/cancel`, plus `GET /v5/execution/list` on the Psycho bots; signing is HMAC-SHA-256 via `crypto.subtle.sign` with a 250ms minimum gap between signed requests (plugins).

**Call cadence**: the full-book `position/list` runs only before and after each scan loop. Single-symbol `position/list` calls happen around an entry and while a close is repricing. On the Psycho bots, `execution/list` is called for a pending DCA/AMa stage once price reaches its trigger, plus one sweep of every pending stage after each scan loop to catch a wick.

---
