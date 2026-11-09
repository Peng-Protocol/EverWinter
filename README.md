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
| `plugins/strategies/Breakout.html` | Proactive entry plugin for both Pseudo bots: average-move conditional entries drawn by per-cell $ scores (lean cohorts, 1× to 3× distance), a quiet watch list of simulated hypotheticals, stand-down when every cell is under water |

---

## Setup

Open any `.html` file directly in a browser. No build step, no server, no installation. Alpine.js and Bootstrap 5 are loaded from CDN — an internet connection is required on first load (cached after that).

To trade proactively, run `PseudoChaser` (longs only) or `PseudoWinter` (shorts only) with `Breakout` loaded; the same file works on both bots. **Side check:** a plugin built for the other bot no longer refuses to load. Each plugin declares `targetBot` (`pseudowinter`, `pseudochaser` or `both`); if it names the other bot, it loads and runs anyway and its Plugin Manager card shows a yellow ⚠ warning (also logged once on load). A plugin that declares `both` (any case), or declares nothing, never shows the warning. ([more](#general-details))

**Load order**: EverWinter / SunChaser first (if live), then **Breakout**. Breakout needs no other plugin.

---

## EverWinter / SunChaser (Live Trading Plugins)

EverWinter turns PseudoWinter into a live short-only Bybit bot; SunChaser does the same for PseudoChaser as long-only. Both sign requests with the stored `__ew_creds`/`__sc_creds` API key and place real orders — the topbar reads **Very Real Orders** once loaded, in place of the base simulation's **No Real Orders**.

### Order Handling (Open / Close tabs)

The plugin's accordion has three tabs: **API** (credentials), **Open** and **Close**. 

**Limit** here means a limit priced through the last price by the **Limit offset** (default 0.1%), so it normally fills like a taker; a negative offset makes it passive. **Market** sends a market order (IOC for entries, reduce-only IOC for closes). A **try** is one limit order, cancelled and repriced off a fresh last price if it doesn't fill. ([more](#general-details))

**Open and Close tabs** (the Close tab applies to every bot-initiated close: manual, runtime, bail sweeps and the post-bail re-check; exchange-native TP/SL closes are filled by the exchange and aren't affected)

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
| **Max Positions** (`maxPos`) | Maximum simultaneously open positions. No new entries open once this is reached. Breakout also cancels its cond. orders and stops placing them ([Max positions](#max-positions)). |
| **Max Cond. Orders** (`maxCond`, default 30) | Maximum pending conditional-limit entries ([Conditional Orders](#conditional-orders)). Counted separately from **Max Positions**; no new cond. order is accepted once it is reached. |
| **Leverage** (`leverage`) | Position leverage. Affects order size and TP/SL prices. |
| **Min Notional** (`minNotional`) | Base margin per position in USDT. Actual order size = minNotional × leverage. |
| **Entry TP** (`entryTpRoi`, default 50%) | Take-profit ROI % target. In DCA Mode this is also the base the per-stage TP ladder scales down from (entry TP ÷ (stage+1), min 3%). |
| **Binary Mode** (`binaryModeEnabled`) | On: every position gets a take-profit and a stop-loss at entry and no DCA adds (`binaryTpPct`/`binarySlPct`, both default 50%). Off: multi-stage DCA. Add orders trigger below entry (PseudoChaser) or above it (PseudoWinter), each with a lower TP ROI target, and the stop-loss (`dcaSlPct`, default 16%) only arms once every first-wind DCA stage has filled. The DCA config controls need the `dca-long`/`dca-short` plugin (`plugins/modes/`); the binary and DCA logic itself is in the base bot either way. |
| **DCA Stages** (`dcaStages`, default 1) | Number of DCA add orders (1–6 in the plugin slider). Each stage has its own trigger slider (`dcaAddPct1`mic`dcaAddPct6`, defaults 3 / 6 / 12 / 18 / 24 / 30), set as % below entry for PseudoChaser or above entry for PseudoWinter, and only the sliders for selected stages appear. Triggers always increase by stage: lowering one stops at the previous stage's trigger, and raising one pushes the later stages up. Configs saved before per-stage triggers (a fixed 1.5%, then +3% per stage for non-3 stage counts) are migrated on load/import so they keep the same trigger prices. |
| **DCA Add Notional** (`addNotional`) | Margin (USDT) added per DCA stage — separate from **Min Notional**, which only sizes the initial entry. |
| **Drawdown Throttle** (`drawdownThrottleEnabled`) | Halts new entries for `drawdownHaltHours` (default 12h, free-entry field with no upper bound) when the rolling 6h realized PnL falls below a loss threshold. The Halt tab shows the live 6h rolling PnL. Its **Clear 6hr Record** button (with confirmation) zeroes that window manually, whether or not a halt is active. |
| **Drawdown Factor** (`drawdownThrottleFactor`) | Loss threshold as a multiple of entry margin. At 0.5× with $1 margin, $0.50 of rolling losses triggers the halt. |
| **Bail on Trigger** (`drawdownBailEnabled`, default on) | When on, triggering the Drawdown Throttle halt also immediately cancels every pending cond. order and closes every open position at market (`bailAll()`) — the same sweep the manual **Bail All Positions & Cond. Orders** button runs, and what the **BAIL** trade-card badge marks. |
| **Gains Lock** (`gainsLockEnabled`) | Halts new entries for 12 hours once rolling 6h profit hits a target. Banks a winning streak before it reverses. Same 6h rolling PnL readout and **Clear 6hr Record** button as Drawdown Throttle, shown in its own section of the Halt tab. |
| **Gains Factor** (`gainsLockFactor`) | Profit target as a multiple of entry margin. Same scale as Drawdown Factor. |
| **Manual Halt** | Button (Halt tab) that blocks all new position entry indefinitely until manually lifted. Independent of Drawdown Throttle and Gains Lock — overrides both and doesn't stack with either. |
| **Ticker Cooldown** (`bulkTickerCooldownHours`) | How long the bot reuses a cached bulk ticker fetch before hitting the API again (default 12h). The bulk list only says which symbols exist. |
| **Whiplash Audit** (`whiplashEnabled`) | When on, the position watcher fetches 1-minute klines near TP and near SL to confirm whether price spiked through either between watcher cycles. The SL audit (PseudoWinter 1.6.8 / PseudoChaser 1.6.9) uses the same proximity rule and 5-minute delay as the TP audit, with its own `_whiplashSlScheduled` flag, and closes at the SL price if a candle high (Winter) or low (Chaser) reached it. It aborts if the SL moved or cleared before the check ran. |
| **Whiplash Proximity** (`whiplashProximityPct`) | How close (%) to the TP or SL price triggers the kline audit. One setting drives both, and it also drives the cond. order audit against target and worst case. |
| **Runtime Limit** (`runtimeHours`) | Maximum position age. Forces a close at the deadline if TP hasn't been hit. |
| **Symbol Banlist** (`banlistEnabled`) | When on, symbols on the ban list are excluded from all scans. Entries expire after 7 days. |
| **Position Price Feed** (`restPollEnabled`) | When on, replaces the WebSocket price stream for open positions with periodic REST calls; use it if the WS feed returns stale prices. Exactly one source runs at a time. Pseudo bots default to on and Psycho bots to off. ([more](#general-details)) |
| **Price Poll Interval** (`restPollBaseSec`) | Base polling interval in seconds for REST mode. The interval doubles automatically when price moves less than 0.1% between ticks and resets to base on any meaningful move. |
| **Dispatch Every** (`schedIntervalMs`) | Minimum gap (ms, default 150) between successive background fetches dispatched from the scheduling queue. Lower = faster background data turnover, at the cost of more simultaneous requests. |
| **Max Concurrent** (`schedMaxConcurrent`) | Hard cap (default 4) on background fetches in flight at once, regardless of how many subsystems have work queued. |
| **Slice Budget** (`schedSliceMs`) | How long (ms, default 8, 2–30) a scan stage runs before handing the browser back; a hidden tab uses 40 ms. Lower = smoother page, slightly slower scans. |
| **Follow Partner Bot** (`lfFollowPartner`) | When on, this bot stops fetching bulk tickers itself and uses the bulk list the partner hands over. The partner needs no toggle: it acts as leader while its heartbeat is fresh (newer than 2× **Scan Interval**), and this bot resumes scanning on its own if it goes stale. It also won't open a position on a ticker the leader already holds. ([more](#general-details)) |
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
| **Persistence** | "Active" (live in-memory position count) vs. "Stored" (confirmed saved to localStorage). These should always match. |

**Persistence mismatch**: shown in red with a warning banner. It means a save failed or was overwritten, and usually clears on its own within a few seconds as the bot retries automatically. If it doesn't:
- Check the activity log for `[PST]`/`[PERSIST]` entries.
- Close any duplicate tabs of the same bot — a second tab can overwrite the first tab's saves with its own stale position count.

**Storage usage** (dropdown below Persistence, requires `plugins/analytics/Meters`): breaks this bot's localStorage footprint down to one row per data type, including genuinely shared cross-bot keys but never the partner's private state. Oversized rows show in red with a **✕** to clear that bucket (with confirmation), and **Export** downloads the breakdown as a text file. The cross-bot corridor shows as one row of in-flight packets (normally empty), and plugin sources and plugin data (see Plugin data storage) show as IndexedDB rows that sit outside the localStorage quota and aren't part of the total.

**Power usage** (dropdown below Storage usage): a rolling average and peak of how many milliseconds the app spends reacting each second. A rising figure usually means a plugin panel left open somewhere is doing more work than it needs to — closing analytics panels you're not actively watching brings it back down.

### Actions Dropdown

- **Export** — Downloads current bot state (config, positions, closed trades, ban list) as a `.json` file. Breakout's queues and state (`boRetry`, `boGray`, `boWhite`, `boEdges`, `boLog`, `boInval`, `boCells`, `boCellOf`, `boW1`, `boW2`, `boHypo`, plus its `boFlowOn`, `boGate`, `boSamples`, `boWatchMax` and `boStepX` settings) sit in the config and travel with it.
- **Import** — Restores state from a previously exported `.json` file: config fields merge field by field and positions are replaced wholesale. A 5s debounce prevents accidental double-imports, and config keys that no longer belong to a loaded feature are dropped. ([more](#general-details))
- **Clear Closed Trades** — Wipes the closed trades list, resets session stats, and clears the 6hr drawdown/gains-lock rolling PnL windows. Open positions are unaffected.
- **Clear All** — Full reset. All positions, trades, stats, and config are wiped (config reverts to defaults).
- **Bail All Positions & Cond. Orders** — Cancels every pending cond. order, then closes every open position at the mark price (the **BAIL** badge). Shown whenever a position or a cond. order exists, so pending cond. orders can be bailed with no position open.

### Activity Log

Timestamped entries for every significant bot event. Color coding:

- **White** — informational (scan results, entries, closes)
- **Yellow** — warnings (halts engaged, API retries)
- **Red** — errors (API failures, plugin conflicts)

Common prefixes: `[MHL]` manual halt · `[DWN]` drawdown throttle · `[GLK]` gains lock · `[PST]` (PseudoWinter) / `[PERSIST]` (PseudoChaser) save failures or recovered positions · `[BO]` Breakout events · `[CND]` cond. order events · `[SHR]` cross-bot corridor handovers and failed shares.

Bulk operations (Bail, scan entry bursts) are rolled up: `_logBatchBegin()` / `_logBatchEnd(label)` buffer per-event messages into one entry. Errors always log immediately. `log(m, type, live)` takes an optional third argument; `live = true` bypasses the buffer, so live close/entry retry lines (repricing, market fallback, per-try failures, fill timeout) show as they happen instead of after the whole roll-up finishes.

The log keeps the latest 300 entries in memory and in localStorage, dropping the oldest first. Each entry has a local `HH:MM:SS` string (`t`), which is what the UI shows, and an epoch-millisecond timestamp (`ts`). `ts` lets you match a log export to position and config exports, which are timestamped in UTC epoch; `t` alone can't be tied to a date or time zone.

---

## Trades Menu

The trades panel shows a card for each closed trade, newest first, with a close-reason badge: **TP**, **SL**, **FORCE** (runtime limit), **BAIL** (drawdown throttle bail). Reasons added by other plugins show their own label. The simulation bots also show estimated fees on each card, and Net PnL, win/loss and the drawdown and gains windows are net of them. ([more](#general-details))

**Roll-up card**: when the closed trades list exceeds 50 entries, the oldest are compacted into a single roll-up card showing their net PnL, trade count, and the date range they cover. The roll-up is not a trade — it is a historical summary. In the PnL chart, the roll-up's net value acts as a baseline offset applied to every plotted point.

**PnL chart**: click the **PNL CHART** bar below the header to expand a cumulative PnL line chart, green when the net result is positive and red when negative. It only appears once at least 2 individual trades are closed. ([more](#general-details))

**CLEAR button**: removes all closed trades, resets session stats, and clears the 6hr drawdown/gains-lock rolling PnL windows. It asks for an inline confirmation ("Sure? Yes / No") before anything is deleted. ([more](#general-details))

---

## Conditional Orders

A plugin can enter through a conditional limit order instead of opening at once: `placeCondEntry({ candidate, target, worst, tag })`, where `candidate` is what it would hand to `pseudoOpenShort`/`pseudoOpenLong`. Breakout is the only caller by default. The order opens a position only when price reaches **target**; if price reaches **worst** (the worst case) first, it is cancelled. Target and worst sit on opposite sides of the **entry** price, the last price when the order was made.

Pending orders are listed under **Cond. Orders** in the market column, below Open Positions. Each card's header shows the ticker, the side badge, a plugin role badge where the placing plugin stamps one (Breakout's **TOP** / **BOTTOM**, prefixed **W-**, **A-** or **D-** when the ticker has a lean) and the order's tag; the body shows Entry, Target and Worst with a thin bar and the distance of the current price from each. They have their own count (**Max Cond. Orders**, default 30), are saved with the bot's state and are cancelled by **Bail All Positions & Cond. Orders**. On PseudoWinter/PseudoChaser the fill is simulated; on EverWinter/SunChaser the order is a real Bybit conditional limit order. ([more](#general-details))

---

## Breakout Plugin

Breakout is one file for both bots (`plugins/strategies/Breakout.html`, all settings `bo*`). It reads which bot it is loaded into and uses that side's conventions (PseudoChaser longs, PseudoWinter shorts), and needs no other plugin. Its accordion is marked with the plugin symbol, a text glyph rather than an emoji: ❄︎ on PseudoWinter, ♨︎ on PseudoChaser. It is the only proactive plugin: it enters through [Conditional Orders](#conditional-orders) placed 1×, 2× or 3× the average move from the last price, at an edge and multiplier drawn from per-cell $ scores ([Cells and scores](#cells-and-scores), [Entry choice](#entry-choice-and-stand-down)). Alongside the real orders it runs a quiet **watch list** of up to 50 tickers whose every cell is simulated without placing anything ([Watch lists](#watch-lists)); those hypotheticals, the real orders and the real closes all feed the scores. Once open positions reach **Max Positions** it cancels its pending orders and places none ([Max positions](#max-positions)). **Binary Mode must be on**, since TP and SL are only set at entry there; with it off the plugin logs one warning and places no orders (the watch lists keep running). ([more](#breakout-details))

### Entry

Each scan, a batch fills every free cond. slot (**Max Cond. Orders** minus the pending orders) while a position slot is free; at **Max Positions** the batch does nothing ([Max positions](#max-positions)). The host drops a cond. order that triggers once no position slot is free, and a live order fails if the balance is short, which the cap check prevents. The system queues tickers for retry if their \"worst\" price was breached, these queued retries go first in each entry loop, after which are random tickers from the bulk list (USDT pairs only, not banned, not held, not in `megacapExclude`, not graylisted). For each ticker:

1. Read the last 24 closed 1h candles. The **average move** `m` is the mean candle range `(high − low) ÷ open`, in %.
2. Run the stablecoin and illiquidity filters.
3. Read a fresh last price, work out the ticker's lean ([Ticker flow](#ticker-flow)), draw a cell and place the cond. order at it.

For the drawn edge and multiplier `k` (1, 2 or 3):

| Level | Edge bottom | Edge top |
|---|---|---|
| Entry (target) | price × (1 − k·m) | price × (1 + k·m) |
| Worse price | price × (1 + m) | price × (1 − m) |

TP and SL are always one `m` from the entry, on the bot's own side: PseudoChaser TP = entry × (1 + m) and SL = entry × (1 − m); PseudoWinter the reverse. The default edge is PseudoChaser bottom and PseudoWinter top. The trigger distance `k·m` is capped at 90% so the price stays positive. TP and SL are ROI %, so each order carries `_tpPct` = `_slPct` = m × leverage, and the host applies them at fill in Binary Mode.

### Expiry and worse price

An order is cancelled once it is older than **Order life**. If price reaches the worse price first, the ticker joins the retry queue and goes to the front of the next batch, where its candles and price are read again. The hit is also counted as an invalidation of the order's direction assumption ([Invalidations](#invalidations)). An expired order is not queued.

### Filters

Both are always on, with no toggle, and run before every order and every watch.

| Filter | Rule |
|---|---|
| **Stablecoin** | The 24 candles' full span, lowest low to highest high, must be at least **1%**, else the ticker is skipped. Reads the candles already fetched, so no extra request. |
| **Illiquidity** | The last 3 trades are fetched (`recent-trade`, limit 3) before entry. They must average no more than **12 s** apart, else the ticker is skipped. Fewer than 3 trades counts as illiquid. |

A ticker that fails either during random selection is **graylisted for a week**; a queued retry that fails is only skipped. A ticker that passes the illiquidity check is **whitelisted for a week** and skips the trade fetch. The stablecoin check still runs each time. A failed fetch neither graylists nor whitelists.

### Cells and scores

Every ticker belongs to a **lean cohort** and every order to an edge and a multiplier, so the unit of account is a **cell**: lean (`U` upside, `D` downside, `N` none) × edge (`T` top, `B` bottom) × `k` (1, 2, 3), written e.g. `UT1` or `DB2`. Each cell keeps the last **Samples per type** (default 50) of three data types, with no decay, so that number alone sets how fast the scores react (fewer = faster and noisier, more = slower and steadier). A cell's **score** is the sum of the three types' windows.

| Type | Key | Sample |
|---|---|---|
| **First-passage** | `a` | One per resolved cond. order (real orders and round-1 hypotheticals): trigger reached first = **+k·m**, worse price first = **−m**. An expired order is not stored. |
| **Round-2 sim** | `b` | One per hypothetical position closed at TP, SL or Force Close, net of estimated fees and funding. |
| **Real** | `c` | One per real position closed at TP, SL or Force Close, net P&L (`totalPnl`). Bails and manual closes are not counted. |

All samples are in dollars at the configured notional: price move × notional, which equals the move × leverage × base margin (a 5% move at base settings is $0.30). A bigger mover therefore weighs more. Open-position uPnL never feeds a score. Because the first-passage sample pays +k·m against −m, a random walk has zero expected value at any `k`, so drift in that score is signal. Real closes are fed once each from `closedTrades` (stamped `_boCell`), so gap-audit closes count too.

### Ticker flow

**Ticker flow** (`boFlowOn`, default on) groups tickers into lean cohorts from the skew of their 24 candles. A candle breaks upward if its high is more than `m` above its open, and downward if its low is more than `m` below its open; one candle can do both. The ticker has **upside skew** (`U`) with more upward than downward breaks, **downside skew** (`D`) with more downward than upward, and **no skew** (`N`) on a tie. Each cohort has its own cell scores, so the data decides whether the lean predicts anything. With Ticker flow off every ticker is `N`.

The flow labels mean: **with top**, expecting the ticker to keep going up; **with bottom**, keep going down; **against top**, expecting it to top and reverse; **against bottom**, expecting it to bottom and reverse. PseudoChaser (long) can only win with top or against bottom, PseudoWinter (short) only with bottom or against top; the other two mean expecting to lose.

| | PseudoChaser | PseudoWinter |
|---|---|---|
| Favored lean | Upside | Downside |
| Unfavored lean | Downside | Upside |

Each order is stamped with its cell (`_boCell`) and, when the ticker has a lean, its flow (`_boFlow`, `with` / `against`) and, when `k` is above 1, `_boMult`. The badge gains a prefix: **W-TOP**, **W-BOTTOM** (with), **A-TOP**, **A-BOTTOM** (against) and **D-TOP** / **D-BOTTOM** for any order with `k` above 1; a ticker with no lean carries no prefix. The placement log line shows the cell, its score and the skew counts, e.g. `upside skew 5T/2B`.

### Entry choice and stand down

For each ticker the batch draws one of the lean's **eligible cells** with weight `exp((score − best) ÷ step) × prior(k)`, where the prior is 1, 0.5, 0.25 for k = 1, 2, 3 (the starting preference before the scores say otherwise) and **step** is **Score step** × one base margin (`minNotional ÷ leverage`, $1 at base settings). A cell one step behind the best is drawn about 37% as often.

| Lean | Eligible cells |
|---|---|
| Favored, or none | All six (top and bottom at 1×, 2×, 3×) |
| Unfavored | The default edge at 2× or 3× only (Chaser bottom, Winter top), so the contradictory combinations (Chaser with bottom / against top, Winter with top / against bottom) are never placed |

**Stand down** (`boGate`, default on): when the best eligible cell of a lean is at or below −step, no real order is placed for that lean. The ticker is watched instead, and the hypotheticals keep scoring, so entries resume once a cell recovers. Six stood-down picks in a row end the batch, to save fetches.

### Watch lists

The watch lists run on the cond. order watcher tick, throttled to one pass every 30 s, and place no orders. They keep up to **Watch tickers** (default 50; 0 turns them off) random tickers in round 1, through the same filters as real orders, skipping held, pending and already-watched tickers. At scan time a ticker's price, `m`, lean, funding rate and funding interval are stored, and every cell (2 edges × 3 `k`) is simulated at once from that one set of data. A pass refills at most 6 watches and walks at most 8 tickers' due items.

**Round 1** runs one **Order life** after the scan (default 60 min). The twelve 5-minute candles since the scan (from the next 5-minute boundary, so up to 5 minutes of the window go unobserved) are walked per cell for the trigger or the worse price first, which feeds the first-passage scores. If both are touched inside one candle, one finer 1-minute fetch for that ticker decides it; if still both, the worse price counts first. A cell whose trigger was reached becomes a round-2 sim, opened at the trigger price at the end of the candle it triggered in and walked through the rest of the window.

**Round 2** walks the position to its TP or SL for as long as a real one would live: the host's **Force Close Runtime** (`runtimeHours`). A sim is checked at each 4-hour boundary:

- 4-hour candles bound every hour inside them: price staying between TP and SL means nothing happened, and touching only one side resolves it.
- If a 4-hour candle touches both, one finer 15-minute fetch for that ticker decides it, and SL counts first if still both.
- The stretch from the end of round 1 to the next 4-hour boundary, and the last stretch before the horizon, use 5-minute candles.
- **Funding** is added at each funding time crossed (rate and interval from the host's funding cache, else the scan-time values; longs pay a positive rate, shorts receive it).
- **Fees** come from the host's `_estTradeFee` at close, so sim fees follow the base bot's estimate, random multiplier included. There is no separate slippage model.
- Reaching the horizon books a Force Close at the last close seen.

Sims are capped at 240 live; ones that still cannot be fetched a day past their horizon are dropped. The **HYPO** row of the [live readout](#live-readout) shows the realized hypothetical P&L, and its popover compares the average sim result with the average real result per cell, which exposes a cost the sim is missing.

**Data use**: each new watch costs about three requests (24 hourly candles through the host queue, `recent-trade` unless whitelisted, one price read); round 1 adds one 5-minute kline read per watch, and round 2 one kline read per ticker per due 4-hour boundary (several sims on one ticker share it), plus the occasional finer fetch. Lowering **Watch tickers** scales this down directly.

### Invalidations

Reaching the worse price first means price moved the wrong way before the trigger, so the order's direction assumption was wrong. Each hit is counted in `boInval` (last 50) under the order's badge: W-TOP, W-BOTTOM, A-TOP, A-BOTTOM, D-TOP or D-BOTTOM. Orders with no flow stamp (tickers with no lean) aren't counted. The counts show in the LIVE popover and don't change entries by themselves.

### Max positions

Once open positions reach **Max Positions**, every pending Breakout cond. order is cancelled (reason `breakout max positions`) and no new ones are placed. Nothing is tracked internally: the watch lists keep the data flowing, and a cancelled order simply drops out (it adds nothing to the tally or the scores). The check runs after every cond. order fill, on each watcher tick and at the start of each batch, so no other cond. can push past the cap. When a slot frees up, real orders resume.

### Live readout

A panel in the accordion, below the config fields, with no labels and only the app's own colours (gray, theme, green, yellow, red). **Hover** a row on PC, or **tap** it on mobile, for a popover with the detail.

| Row | Shows |
|---|---|
| **LIVE** | Pending cond. orders over **Max Cond. Orders**, then the break counts ▲ top · ▼ bottom · – neither for the last 50 resolved orders, the larger of ▲ / ▼ in the theme colour. **↻** (retry queue) appears only when non-zero. A pulsing red dot and red border show while any lean is standing down, and a blinking yellow **⚠** shows while Binary Mode is off. The popover adds the break counts in words, the invalidation tally, the retry queue size and the round-1 watch count. |
| **UP** / **DOWN** (Ticker flow on), **ALL** (off) | One row per lean: a **WITH** (theme), **AGAINST** or **DOUBLE** (yellow) chip, or **STAND DOWN**; the best eligible cell's entry edge (▲ TOP / ▼ BOTTOM), its multiplier when above 1, and its score in $ (green, or red when negative). The popover lists every eligible cell by score with its three sums and sample counts (`R1` first-passage, `R2` sim, `real`). |
| **HYPO** | Hypotheticals closed (`n`), win % (✓), live round-1 (R1) and round-2 (R2) counts, and the realized hypothetical P&L. The popover adds the average hold, and the sim-vs-real average per cell for the six cells with most data. |

The break counts record which edge of its range price reached first: the target counts for the order's own edge, the worse price for the opposite edge, and an expiry as no break. A fill the host drops for want of a position slot still counts; an order cancelled by hand, by a bail, by a halt or by the max-positions cap doesn't.

**Round 1** and **Round 2** lists sit below the readout, each shown only while it has entries and collapsed until tapped. Round 1 rows show the ticker, its lean (UP / DOWN / —), `m` and the minutes left (or `due`). Round 2 rows show the ticker, the sim's cell label, its age and the hours left to its horizon.

### Config

Each setting's explanation sits behind a circled **!** button next to it (click to show). Defaults apply to a setting with no saved value, so a bot whose saved config already holds an on / off state keeps it.

| Setting | What it does |
|---|---|
| **Breakout Mode** (`boEnabled`, default on) | Master on/off. When off, no new orders are placed and the watch lists pause; pending orders still expire. |
| **Order life** (`boLifeMins`, default **60**, min 1) | Minutes an order waits before it is cancelled, and the length of the round-1 window. |
| **Ticker flow** (`boFlowOn`, default on) | Groups tickers into lean cohorts from their candle skew. Off = every ticker is `N`. |
| **Stand down** (`boGate`, default on) | No real orders for a lean while its best eligible cell is at or below −step. |
| **Samples per type** (`boSamples`, default **50**, min 5) | Samples kept per data type per cell; how fast the scores move. |
| **Watch tickers** (`boWatchMax`, default **50**) | Tickers watched at once in round 1; 0 turns the hypotheticals off. |
| **Score step** (`boStepX`, default **1**, min 0.1) | Step in base margins: the draw's temperature and the stand-down floor. |
| **Cells** (`boCells`) | Cell key → `{ a, b, c }`, the last `boSamples` $ samples of each type. No control. |
| **Cell link** (`boCellOf`) | Symbol → `{ c, m, k }` for each pending order, so its resolution feeds its cell. No control. |
| **Watch lists** (`boW1`, `boW2`, `boHypo`) | Round-1 watches, live round-2 sims and the realized hypothetical totals (`n`, `w`, `pnl`, `dur`). No control. |
| **Invalidations** (`boInval`) | The last 50 worse-price hits by badge (`WT`, `WB`, `AT`, `AB`, `DT`, `DB`). Feeds the LIVE popover, no control. |
| **Tally** (`boLog`, `boEdges`) | The last 50 resolved orders (`T`, `B` or `N`) and the edge each pending order was placed at, keyed by symbol. Feeds the live readout, no control. |
| **Retry queue** (`boRetry`) | Symbols that reached the worse price, first in line for the next batch. The count shows in the live readout, no control. |
| **Graylist / Whitelist** (`boGray` / `boWhite`) | Symbol → epoch ms, held one week. No control. |

Settings retired in 2.0 (`boEntry`, `boAuto`, `boAutoPct`, `boAutoTicker`, `boTickLatch`, `boFlowUp`, `boFlowDown`, `boMult`, `boFlow`) and in 2.1 (`boTrack`) are deleted from a saved config on load.

---

## Randomized Outcomes

Scan timing drifts independently per tab, and Breakout draws its tickers at random each batch, so two identically configured instances won't share entry triggers, exit timing, or readings. This is intentional: instances in lockstep are easier to front-run and cluster losses at the same market event.

---

## Multiplex Plugins

To save resources in single-file browser execution, the system supports **Multiplex Plugins**. A standard plugin keeps its own telemetry isolated, while a multiplex plugin hooks into the combined component built when all plugins are loaded and reads the core data directly, without wrapping parent methods. This treats the master engine as a shared database, cutting resource use and avoiding race conditions between plugins. ([more](#general-details))

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

**BAIL** cancels every pending cond. order and closes every open position immediately (a reason with no registered label shows its raw name). Fees are 0.02% maker on entry and DCA fills and 0.055% taker on the close (`FEE_MAKER_PCT`, `FEE_TAKER_PCT`), with live positions skipped. One close in three is then multiplied by a random 2–3×, skewed higher as the session win rate rises (about 2.25× on average at 0%, 2.75× at 100%), and the other two pay the flat fee.

#### Conditional orders

`placeCondEntry` refuses an order when target and worst aren't on opposite sides of the entry, the symbol already has a position or order, is banned or leader-held, entries are halted, or **Max Cond. Orders** is reached. In the simulation the order fills when the last price reaches target (including a move that crossed it between samples, the level nearer the previous sample winning if both were crossed), opening a normal position at the target or dropping the order if no slot is free. The whiplash check and the gap audit replay recent 1-minute klines to catch a level touched between samples (a target fill is back-dated to the candle, a both-levels candle goes to the level nearer its open), while live orders only check worst case because the exchange owns the fill.

#### PnL chart

The X-axis spans from the first to the last individual closed trade at fixed spacing.

#### CLEAR button (Trades)

Yes confirms; No cancels with no change.

#### Plugin source storage

Plugin sources live in IndexedDB (`__ew_plugins_pseudowinter` / `__ew_plugins_pseudochaser`, object store `src`) and are held in memory after boot, while localStorage keeps only a manifest entry per plugin (css and slot markup aren't stored, since running the source rebuilds them). An entry stays whole until IndexedDB has returned its source on a later boot, and if IndexedDB is unavailable or silent for 4 s the app starts anyway with whole entries in localStorage. A manifest entry whose source is missing from IndexedDB is inactive and the log says to re-load its file, and removing a plugin deletes its source.

#### Plugin data storage

What plugins keep lives in the host's IndexedDB data store (`__ew_data_pseudowinter` / `__ew_data_pseudochaser`, object store `kv`), read into memory at boot so plugins still read and write synchronously, with writes reaching IndexedDB in batches. A key an older version left in localStorage moves on first read, and if IndexedDB is unavailable or silent for 6 s the store passes through to localStorage. It needs PseudoWinter 1.25.0 / PseudoChaser 1.21.0 (an older host keeps everything in localStorage), and Alpine loads only after the plugin sources are applied (`window.__pluginReady`).

#### Multiplex Plugins

The core data it reads directly is the arrays, batched API payloads and state structures, with no reassigning of parent methods. The shared database in question is the master surveillance/execution engine.

### Breakout Details

The details left out of the shortened Breakout entries.

#### Average move

The newest 25 candles are fetched (`interval=60`) and the forming one dropped, so all 24 are closed; a ticker with fewer than 24 is skipped. Candles go through the scheduling queue, while the last-price and `recent-trade` reads are direct fetches. The price read also returns the funding rate and interval, which a watch stores.

#### Batch

Attempts per batch are capped at 3× the free slots, so a ticker that fails (new listing, refused order, a filter) is replaced by the next pick. A retry leaves the queue when a batch takes it, one attempt each, and retries beyond the free slots wait for the next batch. Candidates carry `_bo`, `_boMovePct`, `_boEdge`, `_boCell`, `_tpPct` and `_slPct`, plus `_boFlow` (`with` / `against`) when the ticker has a lean and `_boMult` when `k` is above 1; the underscore keys are copied onto the position and its closed trade, which is what the badge and the real-close feed read.

#### Filters

The graylist and whitelist are pruned at the start of each batch. A queued retry is exempt from graylisting but not from the filters.

#### Hypotheticals

The sim books price P&L as `side × (exit − entry) ÷ entry × notional`, with `notional` = `minNotional`, so leverage affects only the TP / SL ROI % the host applies, not the dollar result. Walks use closed candles only. The Bybit `kline` reads pass both `start` and `end`, and results are memoised per pass, so sims on one ticker share a fetch.

### Breakout Internals

- **Hooks**: `init` (config defaults and migration, and the `registerRoleBadge` provider), a scan stage `bo-batch` (a `runScan` wrapper on a host without stages), `cancelCondOrder`, `pseudoWatchCondOrders` and `_condTrigger`. Declares `after: ['sunchaser', 'everwinter']` so it wraps the live plugins' versions.
- **Worse price**: the `cancelCondOrder` wrapper queues the symbol when the order's tag is `breakout` and the reason starts `worst case reached`, which covers the host watcher, the kline audits and the live plugins. It also calls `_boInvalidate(o)`.
- **Expiry**: `_boExpire` runs after each cond. order watcher tick, cancelling `tag === 'breakout'` orders past `boLifeMins` with reason `breakout expired`.
- **Slots**: `_boBatch` free slots are `maxCond − condOrders`. It runs `_boCapCheck` first and returns when `positions.length >= maxPos`. It skips while drawdown-halted or gains-locked. `_boPlace` returns the order, `'gated'` (the lean stood down; the ticker is added to the round-1 list instead) or null.
- **Tally**: `_boResolve(sym, hit)` logs one order (`entry`, `worse` or `none`) against the edge in `boEdges`, and for `entry` / `worse` also pushes the first-passage sample to the cell recorded in `boCellOf`. The `cancelCondOrder` wrapper logs worse-price and `breakout expired` cancels, the `_condTrigger` wrapper logs a target hit before the host's first await (so a fill dropped for no free slot still counts), and `_boReconcile` is a fallback for fills that bypass `_condTrigger`: a pending order gone from the list with a position on its symbol.
- **Cells**: `_boCellKey` builds the key, `_boSample(key, type, $)` pushes and trims to `boSamples`, `_boCellScore` sums the three windows, `_boEligible(lean)` lists the allowed cells and `_boPick(lean)` does the weighted draw and the stand-down test. `_boU` is one base margin, `_boTau` the step.
- **Ticker flow**: `_boLean(candles, m)` returns the upward / downward break counts and the skew (`upside`, `downside` or null); `_boPrep` turns it into the lean code (`U` / `D` / `N`, always `N` with `boFlowOn` off). `_boFlowOf(lean, edge)` gives `with` / `against`.
- **Badge**: the `registerRoleBadge` provider reads `_boEdge` and `_boFlow` off a position or off an order's `candidate` and returns the **TOP** / **BOTTOM** badge, with a **W-** or **A-** prefix when `_boFlow` is set, or **D-** when `_boMult` is above 1. The base bots render `_roleBadge(o)` in the cond. card header and in the position card.
- **Live readout**: `_boRows` (best eligible cell per lean), `_boPend`, `_boHot` and `_boHypo` feed the rows in the `strategy-accordions` slot, below the config fields; `_boTipHead`, `_boTipRow` and `_boTipHypo` write the popover text. The popover opens on `pointerenter` for a mouse and on tap for touch, and every colour is one of the host's own variables.
- **Invalidations**: `_boInvalidate(o)` pushes `W`/`A`/`D` + `T`/`B` into `boInval` (cap 50) from the order's `_boFlow`, `_boEdge` and `_boMult`, read through `_boMeta`.
- **Max positions**: `_boCapCheck` (from the `_condTrigger` wrapper after every fill, the watcher wrapper and `_boBatch`) cancels each pending `breakout` order with reason `breakout max positions`; the `cancelCondOrder` wrapper then drops its `boEdges` and `boCellOf` entries like any other cancel.
- **Watch lists**: `_boSimTick` runs from the `pseudoWatchCondOrders` wrapper, throttled to 30 s, and does four things in order: `_boFeedReal` (real closes into `c` samples, once each, marked `_boFed` on the closed trade), due round-1 watches through `_boRound1`, due round-2 sims through `_boRound2`, then `_boWatchFill`. `_boPrep` is shared with real orders (candles, filters, lean, price, funding). `_boKl` fetches closed candles, `_boScan` finds the first barrier touched and does the one finer fetch (`REFINE`: 240→15, 15→1, 5→1), `_boFund` adds funding, `_boSimClose` books the net result and the `boHypo` totals, and `_boSimDue` sets the next 4-hour check.
- **Leverage**: `_boLev` uses `resolveEffectiveLeverage` where the host has it (PseudoWinter), else `leverage`.

### localStorage Keys

Breakout keeps its queues in the bot's config (`pw_v1` / `pc_v1`), so it has no keys of its own.

| Key | Contents |
|---|---|
| `pw_v1` | PseudoWinter: cfg, positions, sess, closedTrades, bot timestamps, symbolBanlist, condOrders |
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
| `__ew_creds` | EverWinter live plugin API credentials |
| `__sc_creds` | SunChaser live plugin API credentials |

### Cross-Tab Data Pool

Both bots share data through a small registry in `localStorage.__ew_shared_v1` (with `BroadcastChannel('ew_shared')` notices) for caches, heartbeats and open-symbol lists, and through the **corridor** for the large datasets. Registry writes are last-write-wins per data type, and either bot operates normally solo.

Each bot publishes its open-symbol list on every position open/close and once per heartbeat. A following bot checks the leader's list before opening and skips any ticker the leader holds, and the check switches itself off when the leader's heartbeat goes stale.

Most `BroadcastChannel('ew_shared')` messages follow a `_sharedWrite`/`_sharedMerge` write, though not all. `registerSharedMessageHook` is the general subscription point on the receiving end.

### The Corridor

The corridor is a handover lane, not storage, carrying `bulkTickers`. The publisher cuts a dataset's JSON into packets of up to 40,000 characters, with at most 4 in localStorage at once across all datasets. The partner copies each into memory and confirms it in `__ew_xa_<type>_<bot>`, and the publisher deletes confirmed packets and then the manifest, leaving the lane empty between handovers.

The receiver reassembles in memory, checks length and checksum, and exposes the result through `_sharedRead` (only what the partner handed over; `_sharedPubTs(type)` gives the timestamp it files it under). Consumers then overwrite their own stored data from it. The delivered copy is memory-only, so a bot that reloads has nothing until the partner's next publish.

- **Pacing**: packets are confirmed in order. Pumping is triggered by the browser's `storage` events, a 1 s timer and each heartbeat.
- **Resend**: a receiver that reloads mid-handover, or whose reassembly fails its checksum, asks for a restart and the publisher resends from packet 0 (at most 3 restarts).
- **Abandon**: no confirmation for 120 s, or no room in localStorage for a packet, abandons that handover and logs `[SHR] ⚠` once per 30 minutes per dataset. A newer publish of the same dataset supersedes an unfinished one.
- **Partner offline**: nothing is sent while the partner's heartbeat is stale, and the ledger records it as skipped.
- **Cleanup**: at init each bot removes its own leftover lane keys, the dedicated keys from an earlier build (`__ew_sh_*`) and any legacy copy of a corridor dataset still in the registry.

### Scan Scheduler Internals

- **Stages**: `runScan` calls `_scanPipeline(ctx)`, which runs the host's `tickers` stage then each plugin stage in load order (`bo-batch`). Stages share `ctx`, a plugin appends `{ id, group, run }` to `_scanStageDefs` in `transform`, and a stage returning `false` skips the rest of its group. A host without `_scanStageDefs` gets `runScan` wrapped instead.
- **Checkpoints**: loops call `if (this._scanDue()) await this._scanCp()`, which yields once `schedSliceMs` has elapsed (40 ms while hidden). The yield is a `MessageChannel` task rather than `setTimeout`, since a hidden tab clamps timers to 1 s or more.
- **Idle lane**: `_schIdle(key, fn)` queues one coalesced job per key, flushed when the pipeline ends; `_schIdleCancel(key)` drops it.
- **Config edits while running**: the lock no longer forces itself on while the bot runs, and config is read live, so a toggle flipped mid-scan can apply to the rest of that scan. Only the scan interval is frozen per cycle (`_scanTotalMs`), so editing Scan Interval never triggers an immediate scan.
- **Timing**: each scan logs one `[SCH]` line with total ms, yields, long-task count and per-stage ms. `ui.scanning` stays on through the plugin stages, so a batch that outlasts the scan interval makes the next scan skip. The extremity rebuild is still one synchronous call.
- **Queue**: every background or bulk fetch runs through a single per-bot scheduling queue (**Scan Scheduling** in Main Config), while execution-critical single-symbol calls bypass it. The scan hands control back to the browser after each time slice (**Slice Budget**), so position watching, clicks and timers run mid-scan.
- **Running both bots**: when both are open they share bulk ticker fetches and kline caches to halve API load. Either bot works normally on its own.

### Cond. Order Internals

- **Order record** (`condOrders`, saved in `pw_v1`/`pc_v1`): `id`, `symbol`, `entryPrice`, `target`, `worst`, `dir` (1 when target is above entry, -1 below), `markPrice`, `createdAt`, `tag`, `candidate` (JSON copy), `_pseudo` (false for live), `_lastPx`, `_lastSeen`; live orders add `orderId` and `qty`.
- **Host hooks**: `placeCondEntry` validates and calls `_condSubmit(order)`, a no-op in the simulation, and `pseudoWatchCondOrders` runs from `pseudoWatchPositions` (one run at a time) for `_pseudo !== false` orders. The cond. card header renders `_roleBadge(o)`, so a role-badge provider can read the order and its `candidate`. `_condPrices`, `_condHit`, `_condKlines`, `_condKlineHit`, `_condResolve`, `_condWhiplashCheck`/`_condWhiplashAudit` and `_condGapAudit` are shared with the live plugins. `bailAll` calls `cancelAllCondOrders` first.
- **Fill**: `_condTrigger(o, at)` removes the order first, then opens through `pseudoOpenShort`/`pseudoOpenLong` with `candidate._condFill` used in place of the last price (and left off the position's copied fields). `at` back-dates `openedAt` and `_lastSeenAt`.
- **Live order**: EverWinter/SunChaser replace `_condSubmit` and `pseudoWatchCondOrders` and wrap `cancelCondOrder`. `_condSubmit` runs the entry checks, sets leverage and posts `POST /v5/order/create` as a GTC Limit order, not reduce-only, with `triggerPrice` = `price` = target, `triggerBy` LastPrice and `triggerDirection` 1 or 2. Qty is `minNotional / target` snapped.
- **Live watcher**: one `GET /v5/order/realtime` per tick (up to 5 pages), with a missing order looked up in `realtime` then `order/history` and dropped after 3 polls if found in neither. `Filled` hands `avgPrice` to the open function as `_condFill` with `_condQty`, which skips the entry guards, then builds TP, SL and DCA orders as usual. Worst case cancels on the exchange, and if the cancel is refused because the order filled, the position is tracked instead.

### Live-Mode Internals

- **The tab buttons always work**: every control from **Order type** down is locked while Config Lock is on (automatically while the bot runs), and settings persist in the bot's config and travel with Export / Import. Keys use the `ew` prefix on EverWinter and `sc` on SunChaser.
- **Balance**: fetched automatically the moment a valid key/secret pair is saved in the credentials panel, not only at page load.
- **Symbol banning**: a symbol is banned for a week when Bybit reports it can't be traded or it's blocked until a trading agreement is signed. Both need a manual fix on Bybit's side, so the ban is long-term rather than retried every cycle.
- **Post-bail re-check**: after a bail sweep the plugin queries the exchange for any position still open in its own direction and force-flattens it with a reduce-only close following the **Close** tab settings. This catches positions that failed to fully fill.
- **Exchange sync cadence**: the full-book `GET /v5/position/list` sync runs once before and once after each scan loop, and nowhere else, so exchange-native TP/SL and DCA fills are picked up at the next scan boundary. Entries and closes confirm their own fills with single-symbol `position/list` calls while in flight.
- **Concurrent group closes**: a live close doesn't return until the position is flat, so every multi-position close path (`bailAll` and any other multi-position close) runs its closes under `Promise.all`, each in its own try/catch so one failure doesn't abort the group. Signed requests still queue through `_scDelay`/`_ewDelay` (250 ms apart), and the `_scClosing`/`_ewClosing` guard and the host's `_closingIds` make a second close of the same position a no-op.
- **Close-record lookup**: the `pseudoClosePosition` wrapper finds the trade it just closed by position id rather than `closedTrades[0]`, since concurrent closes can insert another record while this one awaits.
- **Cycle re-entry guard**: each close schedules a `runScheduledCycle` about 500 ms later, and the plugin's wrapper returns immediately while a cycle or earlier wrapper call (`_cycleWrapBusy`) is in progress. That stops N concurrent closes from running N pre- and post-scan syncs.
- **Pre-entry check**: before each entry the plugin asks the exchange for that one symbol and skips the entry if any position is already open on it, so a new order is never stacked on a position the bot isn't tracking.
- **DCA repair**: re-places missing DCA conditional orders, and runs only in the post-scan sync. It is skipped in binary mode, for positions with no DCA orders, and for positions opened in the last 2 minutes, since order status can lag a fresh placement.
- **Live retry log lines**: the `[EW]`/`[SC]` retry messages are logged with `live = true`. Bail wraps its closes in a log batch, which would otherwise hold every non-error line until the last close succeeded.
- **Mark price ownership**: the pseudo watcher is the only writer of a live position's `markPrice`, and the sync sets it only when the position has none yet. This stops displayed prices jumping toward entry at each sync.
- **Live position prices**: the base watcher skips live positions, so the plugin reads the host's WebSocket ticker when it has one, else one REST ticker call per symbol on a throttle. The **Price Poll Interval** base is 5 s, doubling while price moves under 0.1% and capped at 60 s.

### Plugin Transform Pipeline

``
pw()  →  plugin[0].transform(def)  →  plugin[1].transform(def)  →  ...  →  Alpine
``

Each plugin's `transform(def)` receives and returns the component definition, so load order matters for method wrapping. Strategy plugins must declare `after: ['everwinter']` / `after: ['sunchaser']`, so live-trading plugins load before strategy plugins such as Breakout. The Plugin Manager shows the load order and warns about conflicts.

### Bybit API Endpoints Used

**Public**: `GET /v5/market/tickers` (bulk for the symbol universe, per symbol for Breakout's pre-entry price and funding), `GET /v5/market/recent-trade` (Breakout's illiquidity filter), `GET /v5/market/kline` (hourly bars for Breakout's average move; 5-minute, 4-hour and finer bars for its watch lists; 1-minute bars for the whiplash and gap audits), `GET /v5/market/instruments-info`. **WebSocket**: `wss://stream.bybit.com/v5/public/linear` (position price stream). **Signed (live mode)**: `GET /v5/account/wallet-balance`, `GET /v5/position/list`, `GET /v5/position/closed-pnl`, `GET /v5/order/realtime`, `GET /v5/order/history`, `POST /v5/order/create`, `POST /v5/position/trading-stop`, `POST /v5/order/cancel`, plus `GET /v5/execution/list` on the Psycho bots; signing is HMAC-SHA-256 via `crypto.subtle.sign` with a 250ms minimum gap between signed requests (plugins).

**Call cadence**: the full-book `position/list` runs only before and after each scan loop. Single-symbol `position/list` calls happen around an entry and while a close is repricing. On the Psycho bots, `execution/list` is called for a pending DCA/AMa stage once price reaches its trigger, plus one sweep of every pending stage after each scan loop to catch a wick.

---
