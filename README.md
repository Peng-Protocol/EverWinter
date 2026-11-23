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
| `plugins/strategies/Breakout.html` | Proactive entry plugin for both Pseudo bots |

---

## Setup

Open any `.html` file directly in a browser. No build step, no server, no installation. Alpine.js and Bootstrap 5 are loaded from CDN — an internet connection is required on first load (cached after that).

In many countries, Bybit Global is IP-Banned, so check if you can access the Bybit website before running the bot, if not, get a VPN. 

To trade proactively, run `PseudoChaser` (longs only) or `PseudoWinter` (shorts only) with `Breakout` loaded; the same file works on both bots. See `StrategyBook.md` and `PsychoHandbook` for details on the proactive and reactive trading setups, run `PsychoWinter` (shorts only) or `PsychoChaser` (longs only) for the reactive experience. 

**Plugins:** The plugin manager is at the bottom of the Config menu. Each plugin declares `targetBot` (`pseudowinter`, `pseudochaser` or `both`). A plugin built for the other bot can be opened but its card will show a yellow ⚠ warning (also logged once on load). A plugin that declares `both` (any case), or declares nothing, never shows the warning. ([more](#general-details))

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
| **Max Positions** (`maxPos`) | Maximum simultaneously open positions. No new entries open once this is reached. Breakout also cancels its watches and stops placing them ([Max positions](#max-positions)). |
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
| **Price Poll Interval** (`restPollBaseSec`) | Base polling interval in seconds for REST mode. The interval doubles automatically when price moves less than 0.1% between ticks and resets to base on any meaningful move. Live cond. orders use the same backoff. |
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

- **Export** — Downloads current bot state (config, positions, closed trades, ban list) as a `.json` file. Breakout's state (`boBreaks`, `boWatch`, `boGray`, `boWhite`, plus its `boEnabled`, `boBoth`, `boWhip`, `boCont`, `boMaxWatch`, `boPollSec`, `boLifeMins` and `boWinH` settings; pending Whipsaw / Continuation conds are in `condOrders`) sits in the config and travels with it.
- **Import** — Restores state from a previously exported `.json` file: config fields merge field by field and positions are replaced wholesale. A 5s debounce prevents accidental double-imports, and config keys that no longer belong to a loaded feature are dropped. ([more](#general-details))
- **Clear Closed Trades** — Wipes the closed trades list, resets session stats, and clears the 6hr drawdown/gains-lock rolling PnL windows. Open positions are unaffected.
- **Clear All** — Full reset. All positions, trades, stats, and config are wiped (config reverts to defaults).
- **Bail All Positions & Cond. Orders** — Cancels every pending cond. order, then closes every open position at the mark price (the **BAIL** badge). Shown whenever a position or a cond. order exists, so pending cond. orders can be bailed with no position open.

### Activity Log

Timestamped entries for every significant bot event. Color coding:

- **White** — informational (scan results, entries, closes)
- **Yellow** — warnings (halts engaged, API retries)
- **Red** — errors (API failures, plugin conflicts)

Common prefixes: `[MHL]` manual halt · `[DWN]` drawdown throttle · `[GLK]` gains lock · `[PST]` (PseudoWinter) / `[PERSIST]` (PseudoChaser) save failures or recovered positions · `[BO]` Breakout events · `[CND]` cond. order events · `[SHR]` cross-bot corridor handovers and failed shares · `[AUD]` audio keepalive ([details](#audio-keepalive)).

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

A plugin can enter through a conditional limit order instead of opening at once: `placeCondEntry({ candidate, target, worst, tag, bundle, kind })`, where `candidate` is what it would hand to `pseudoOpenShort`/`pseudoOpenLong`. Breakout calls it only with Whipsaw or Continuation on ([Whipsaw and Continuation](#whipsaw-and-continuation)); it and bundles are there for plugins that need them. The order opens a position only when price reaches **target**; if price reaches **worst** (the worst case) first, it is cancelled. Target and worst sit on opposite sides of the **entry** price, the last price when the order was made.

**Bundles**: orders on one ticker that pass the same `bundle` string form a bundle. A bundle takes **one** cond. slot however many orders it holds, shows as one card, and acts as one-cancels-other: the first order to fill cancels the rest. Each order's `kind` (e.g. `top` / `bottom`) names its role in the bundle. Orders with no `bundle` behave as before, one slot and one card each, and only one per ticker.

Pending orders are listed under **Cond. Orders** in the market column, below Open Positions. A single order's card header shows the ticker, the side badge, a plugin role badge where the placing plugin stamps one and the order's tag; the body shows Entry, Target and Worst with a thin bar and the distance of the current price from each. A bundle's card follows the single ones: the header shows the ticker, the side badge, **BUNDLE · n**, the tag and the age, and the body shows the shared Entry, then one row per order labelled by its `kind` (**TOP**, **BOTTOM**) with its price, bar and distance. **Max Cond. Orders** (default 30) counts slots, so ten orders in five bundles use five. Orders are saved with the bot's state and are cancelled by **Bail All Positions & Cond. Orders**. On PseudoWinter/PseudoChaser the fill is simulated; on EverWinter/SunChaser the order is a real Bybit conditional limit order. ([more](#general-details))

---

## Breakout Plugin

Breakout watches a ticker's own 24 h hourly turnover and enters when it breaks its 24 h high (a **top** break) or low (a **bottom** break). By default it enters at market; with **Whipsaw** or **Continuation** on it places a cond. limit instead ([Whipsaw and Continuation](#whipsaw-and-continuation)). Each ticker gets one watch, on one edge picked by chance, or on both edges with **Both Edges** on. Every entry is stamped a **Double** or a **Revert** of the last break, the turnover extreme that printed most recently: a Double Top (the last break was the top, now the top again) is bullish, a Double Bottom bearish, and a Revert is the other edge. TP and SL come from the candles' average **top move** (green candles, how far above their open they ran) and **bottom move** (red candles, how far below their open). Nothing is predicted: no funding, long / short skew, open interest or other read of the crowd, no candle colour, and nothing lengthens or shortens the targets. The ticker's own turnover history is the only input, and the edge is chance (or both edges). There is no stand down or other regime stopgap. It is the only proactive plugin: one file for both bots (`plugins/strategies/Breakout.html`, settings `bo*`), no other plugin needed, and **Binary Mode must be on** (with it off, nothing is placed). ([more](#breakout-details))

### Entry

Each scan, Breakout fills every free cond. slot with a random ticker that passes the [filters](#filters); each ticker is one watch, on its **top** (24 h turnover high) or **bottom** (24 h turnover low) edge, or on both, and takes one of the **Max watches** (default 30; not the host's **Max Cond. Orders**). Every **Volume poll** (default 60 s) the watch reads the forming 1hr candle's turnover against the last 24 closed candles': a top break is the forming candle passing the highest of the 24 (it can fire mid-candle), a bottom break is a candle closing below the lowest of the 24 (only after the close). With Both Edges off, the watch's own edge breaking opens a position at market on the bot's side, and the opposite edge breaking first cancels the watch; with it on, either edge opens one. Every break counts. With Whipsaw or Continuation on, the break places a cond. limit instead of opening at once. It does nothing at [Max Positions](#max-positions). The bot's side only decides which way TP and SL point (PseudoChaser TP above, PseudoWinter TP below) and which move each one takes; the entry is the bot's own direction whichever edge breaks.

The **last break** is the turnover extreme (24 h high or low) that printed most recently. A break on the same edge is a **Double**, on the other edge a **Revert** (Revert Top: the last break was the bottom, now the top broke). The position-type badge records it, e.g. **Double Top-Vol**, **Revert Bottom-Vol**; the tooltip names the edge entered. It is a label only and picks nothing. Each watch shows as a card in the accordion: this hour's turnover so far against the 24 h high (top) or low (bottom), the opposite level as the worst, and the type; a both-edges card is tagged **BOTH EDGES** and shows the high and the low as its two targets. Each bar is how close that break is, so a bottom bar starts full and empties as turnover comes in.

### Both Edges

Optional (off by default). The watch covers **both** edges and whichever breaks first is the break, and the bot **enters on either edge**, whatever the last 15 min candles did: no candle is read and there is no candle preference. With it off, each ticker is watched on one edge picked by a coin flip, and the opposite edge breaking first cancels the watch. Each bot draws its own random tickers, so the partner only takes a break if it is watching that ticker too.

### Whipsaw and Continuation

Two optional modes (both off by default) that replace the market entry with a **cond. limit order**, placed through the host's `placeCondEntry` ([Conditional Orders](#conditional-orders)) once the volume break has happened. They are mirrors of each other and **exclusive**: turning one on turns the other off. The order is priced from the **price at the break** and the average moves (the same **top move** and **bottom move** that set TP and SL):

| | PseudoChaser (long) | PseudoWinter (short) |
|---|---|---|
| **Whipsaw** target (one average move *against* the bot) | **Below**, the bottom move down | **Above**, the top move up |
| Whipsaw worst | Above, the top move up | Below, the bottom move down |
| **Continuation** target (one average move *with* the bot) | **Above**, the top move up | **Below**, the bottom move down |
| Continuation worst | Below, the bottom move down | Above, the top move up |

- **Whipsaw** premise: price whipsaws. It dips (Chaser) or pumps (Winter) sharply after the break, fills the cond., then reverts.
- **Continuation** premise: the break keeps running, and the cond. enters the continuation.
- **Worst case**: if price reaches the worst level first the order is cancelled, because for Whipsaw no dip or pump came and for Continuation the break failed.
- **Fill**: the host fills it like any cond. order, opening a normal position at the target price. TP and SL are the average moves as ROI % (move × leverage), now measured from the **fill** price, and the position is stamped like any Breakout entry.
- **Slots**: each order takes one of the host's **Max Cond. Orders** slots, not one of Breakout's **Max watches**. The watch is spent at the break, and a ticker holding a cond. is not given a new watch.
- **Dropped** at the break, logged and still counted, with Binary Mode off, no free position slot, halted entries, a position already on the ticker, or a refusal by the host (for example **Max Cond. Orders** reached).
- **Badge**: positions opened from these fills show a **-Whip** or **-Cont** suffix on their type badge (e.g. **Double Top-Vol-Whip**).
- Orders are tagged `whipsaw` / `continuation` and show in **Cond. Orders** like any other.

The **Whiplash Audit** (a host feature that audits price spikes near TP, SL and cond. levels) is unrelated to **Whipsaw** despite the similar name; it audits Whipsaw and Continuation conds like any others.

### Expiry

A watch is cancelled after **Order life** (default 1440 min) if it has not broken, and a pending Whipsaw / Continuation cond. is cancelled after the same time counted from its placement. An expiry or a max-positions cancel is not a break.

### Filters

Two always-on filters skip dead tickers: **Stablecoin** (the 24 h range must be at least 1%) and **Illiquidity** (the last 3 trades must average under 12 s apart). A ticker that fails is graylisted for a week, and one that passes illiquidity is whitelisted for a week.

### Break counter

Every volume break is a **break**: ▲ top or ▼ bottom, the watch's own edge or the opposite one, kept for the **Break window** (default 24 h) and shown in the live readout. It is a readout only: it never cancels or blocks a watch.

### Max positions

At **Max Positions**, every volume watch is cancelled and no new ones are placed until a slot frees up. Pending Whipsaw / Continuation conds are left alone; a cond. that fills with no free slot is dropped by the host.

### Live readout

A small panel under the config fields; hover (PC) or tap (mobile) it for detail. **LIVE** shows the watches Breakout holds over **Max watches**, the ▲ top and ▼ bottom break counts, and a blinking yellow **⚠** while Binary Mode is off. With Whipsaw or Continuation on, a **WHIP** or **CONT** count shows how many of those cond. orders are pending right now (a live count of open orders, not a history: filled, cancelled and expired ones drop out).

### Config

Each setting's explanation sits behind a circled **!** button next to it (click to show). A setting with no saved value uses its default.

| Setting | What it does |
|---|---|
| **Breakout Mode** (`boEnabled`, default on) | Master on/off. Off = no new watches, and the existing ones are dropped. |
| **Both Edges** (`boBoth`, default off) | Off = each watch is on one edge, a coin flip. On = both edges are watched and the bot enters on whichever breaks first, whatever the last 15 min candles did ([Both Edges](#both-edges)). |
| **Whipsaw** (`boWhip`, default off) | On a break, place a cond. limit one average move *against* the bot instead of entering at market: Chaser below, Winter above. Cancelled at one average move the other way, or after **Order life**. Turning it off cancels the pending ones; exclusive with Continuation ([Whipsaw and Continuation](#whipsaw-and-continuation)). |
| **Continuation** (`boCont`, default off) | The mirror of Whipsaw: the cond. limit sits one average move *with* the bot, Chaser above, Winter below. Cancelled at one average move the other way, or after **Order life**. Turning it off cancels the pending ones; exclusive with Whipsaw. |
| **Max watches** (`boMaxWatch`, default **30**, 1 to 100) | How many tickers are watched at once, one watch each. Independent of **Max Cond. Orders** and **Max Positions**; a new value is used from the next batch. |
| **Volume poll (s)** (`boPollSec`, default **60**, least 5) | How often each watch reads its 1hr kline for a volume break. Applies from each watch's next poll. |
| **Order life** (`boLifeMins`, default **1440**) | Minutes before an unbroken watch, or a pending Whipsaw / Continuation cond., is cancelled. |
| **Break window** (`boWinH`, default **24**) | Hours a break counts toward the live readout. |

The stored state is listed under [Breakout Details](#breakout-details).

---

## Randomized Outcomes

Scan timing drifts independently per tab, and Breakout draws its tickers at random each batch (and flips a coin for each one's edge when Both Edges is off), so two identically configured instances won't share entry triggers, exit timing, or readings. This is intentional: instances in lockstep are easier to front-run and cluster losses at the same market event.

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

`placeCondEntry` refuses an order when target and worst aren't on opposite sides of the entry, the symbol already has a position or an order outside the new order's bundle, is banned or leader-held, entries are halted, or **Max Cond. Orders** (counted in slots, a bundle being one) is reached. In the simulation the order fills when the last price reaches target (including a move that crossed it between samples, the level nearer the previous sample winning if both were crossed), opening a normal position at the target or dropping the order if no slot is free; either way the rest of its bundle is cancelled first. The whiplash check and the gap audit replay recent 1-minute klines to catch a level touched between samples (a target fill is back-dated to the candle, a both-levels candle goes to the level nearer its open), while live orders only check worst case because the exchange owns the fill. Audits of a bundle's orders share one 6-minute kline read per ticker.

#### PnL chart

The X-axis spans from the first to the last individual closed trade at fixed spacing.

#### CLEAR button (Trades)

Yes confirms; No cancels with no change.

#### Plugin source storage

Plugin sources live in IndexedDB (`__ew_plugins_pseudowinter` / `__ew_plugins_pseudochaser`, object store `src`) and are held in memory after boot, while localStorage keeps only a manifest entry per plugin (css and slot markup aren't stored, since running the source rebuilds them). An entry stays whole until IndexedDB has returned its source on a later boot, and if IndexedDB is unavailable or silent for 4 s the app starts anyway with whole entries in localStorage. A manifest entry whose source is missing from IndexedDB is inactive and the log says to re-load its file, and removing a plugin deletes its source.

#### Plugin data storage

What plugins keep lives in the host's IndexedDB data store (`__ew_data_pseudowinter` / `__ew_data_pseudochaser`, object store `kv`), read into memory at boot so plugins still read and write synchronously, with writes reaching IndexedDB in batches. A key an older version left in localStorage moves on first read, and if IndexedDB is unavailable or silent for 6 s the store passes through to localStorage. It needs PseudoWinter 1.25.0 / PseudoChaser 1.21.0 (an older host keeps everything in localStorage), and Alpine loads only after the plugin sources are applied (`window.__pluginReady`).

#### Audio keepalive

While a bot runs, a near-silent oscillator through a Web Audio context keeps the browser from throttling a background tab. The topbar status pill shows **SYNC !** when the bot is running and the context is neither running nor off; its tooltip names the state, and tapping it runs a resume. The keepalive starts first thing in the Start tap, before any await, because browsers only let a context run when it is created inside the tap. A resume waits at most 1.5 s (`resume()` can stay pending on a context the browser will not start), then rebuilds the context; if it is still not running, a looping silent `<audio>` element plays instead and the pill reads that element's state. Each step logs under `[AUD]`. If every route is blocked (a browser or extension setting that blocks page audio) the pill stays up; the bot itself keeps running and only the background protection is lost.

#### Multiplex Plugins

The core data it reads directly is the arrays, batched API payloads and state structures, with no reassigning of parent methods. The shared database in question is the master surveillance/execution engine.

### Breakout Details

#### Top and bottom moves

The newest 25 candles are fetched (`interval=60`) and the forming one dropped; a ticker with fewer than 24 readable candles is skipped. A **green** candle (close above open) contributes `(high − open) ÷ open` to the **top move**, a **red** candle `(open − low) ÷ open` to the **bottom move**, each the mean over its candles, in %; a doji counts for neither. A ticker with no green or no red candle among the 24 is skipped.

#### Batch

Each scan, while a position slot is free, a batch fills every free watch slot (**Max watches** minus the watches held) with random tickers from the bulk list (USDT pairs, not banned, held, watched, in `megacapExclude` or graylisted). Per ticker: read the candles, run the filters, read a fresh price, the leverage and the forming candle's turnover, pick the edge and register the watch. Attempts are capped at 3× the free slots. The position opened on a break carries `_bo`, `_boVol`, `_boTopPct`, `_boBotPct`, `_boEdge`, `_boHist` (the last break), `_tpPct` and `_slPct`, plus `_boWhip` or `_boCont` when it came from a cond., copied onto its closed trade, which is what the badge reads.

#### TP / SL

PseudoChaser TP = entry × (1 + top), SL = entry × (1 − bottom); PseudoWinter TP = entry × (1 − bottom), SL = entry × (1 + top), so both edges carry the same TP and SL. With Whipsaw or Continuation the same percentages are measured from the cond.'s fill price rather than the price at the break. They are ROI %: `_tpPct` / `_slPct` = move × leverage, applied by the host at open in Binary Mode and not adjusted or clamped.

#### Watch details

Turnover is kline field 6 (USDT). Each watch is polled every **Volume poll** (`boPollSec`, default 60 s, least 5; each watch's first poll is staggered over one interval) with one `kline` read (`limit=26`). A newly closed candle (start after the watch's `chk`) above the highest of the 24 before it is a top break, below their lowest a bottom break; the forming candle is compared with the highest of the last 24 closed, a top break only. A ticker whose forming candle is already above the 24 h high, or with an hour of no turnover, is skipped at placement.

The watch's own edge breaking (either edge, with Both Edges) opens through `pseudoOpenLong` / `pseudoOpenShort` at the forming candle's price, with `_tpPct` / `_slPct` from fresh moves (the watch's own if unreadable); the entry is dropped, still counted, with no free position slot, halted entries, Binary Mode off or a position already on the ticker. With Both Edges off the opposite edge cancels the watch. With it on, whichever edge breaks first is taken and the entry carries the edge that broke as `_boEdge`; no candle is read. With Whipsaw or Continuation on, `_boVolFire` builds the same candidate (`_tpPct` / `_slPct`, `_boEdge`, `_boHist`, `_boTopPct`, `_boBotPct`) and hands it to `_boWhipPlace`, which prices the cond. from the price at the break and the fresh moves, flags the candidate `_boWhip` or `_boCont` and calls `placeCondEntry` with tag `whipsaw` / `continuation` and kind `dip` / `pump` (Whipsaw: Chaser / Winter) or `run` (Continuation).

The last break is the edge whose candle is newer (the high and the low are different candles, so they never tie). The type stamped on a position is read against that edge: the same edge as the last break is a Double, the other a Revert. A one-edge watch's edge is a coin flip; a both-edges watch has `edge: 'both'`. A watch lives in `boWatch`, not the host's cond. list, and is dropped on expiry, at Max Positions or with Breakout Mode off; leftover conds tagged `breakout` (the retired price conds) are cancelled. Conds tagged `whipsaw` / `continuation` are Breakout's own: `_boModeSync` cancels them when Breakout Mode or their toggle is off, and `_boWhipExpire` cancels them after **Order life**.

#### Filter details

Fewer than 3 trades counts as illiquid. A ticker that passes is whitelisted for a week and skips the trade fetch; the stablecoin check reads the candles already fetched and runs each time. A failed fetch neither graylists nor whitelists.

#### Stored state

These sit in the bot's config and travel with an export. Only the settings have controls.

| Key | Holds |
|---|---|
| **Breaks** (`boBreaks`) | `[ms, 'T' \| 'B']` for each volume break inside the Break window. |
| **Watches** (`boWatch`) | Symbol → `{ t, edge, chk, next, hist, top, bot, lev, chg, fund, fv, rh, rl }`: each ticker's volume watch. |
| **Graylist / Whitelist** (`boGray` / `boWhite`) | Symbol → epoch ms, held one week. |
| **Whipsaw / Continuation conds** (in `condOrders`) | The host's order record with `tag` `whipsaw` / `continuation` and a `candidate` carrying `_boWhip` / `_boCont` and the position's `_tpPct` / `_slPct`. |

Settings from earlier versions that this one no longer uses (`boDecide`, `boTypes`, `boFlip`, `boVol`, `boVolClose`, `boFar`, `boRevert`, `boPairs`, `boNullify`, `boNullHrs`, `boCandlePref` and the older scoring, flow and tally stores) are deleted from a saved config on load. The `nullify` close reason is no longer registered, so an older closed trade carrying it shows its raw name, and the `_boNull*` fields on a position opened under Nullify are ignored.

### Breakout Internals

- **Hooks**: `init` (config defaults and cleanup, and the `registerRoleBadge` provider), the scan stage `bo-batch` (a `runScan` wrapper on a host without stages) and `pseudoWatchCondOrders` (its wrapper also runs `_boModeSync`, `_boGuard`, `_boVolWatch` and `_boWhipExpire`). Declares `after: ['sunchaser', 'everwinter']`.
- **Watch**: `_boVolPlace` registers the watch, `_boVolWatch` polls it, `_boVolFire` opens the position or hands it to `_boWhipPlace` (the Whipsaw / Continuation cond.), `_boWhipExpire` ends old conds and `_boWhipN` counts the pending ones; `_boGuard` and `_boModeSync` drop watches (and `_boModeSync` the conds), `_boCount` / `_boTally` keep the break counter and `_boWatchRows` feeds the cards.
- **Badge**: `registerRoleBadge` reads `_boEdge` and `_boHist` off a position and returns the type (**Double Top**, **Revert Bottom**), with `-Vol` added when `_boVol` is set and `-Whip` / `-Cont` when `_boWhip` / `_boCont` is; with no `_boHist` it shows **TOP-VOL** / **BOTTOM-VOL**.
- **Leverage**: `_boLev` uses `resolveEffectiveLeverage` where the host has it (PseudoWinter), else `leverage`.

### localStorage Keys

Breakout keeps its state in the bot's config (`pw_v1` / `pc_v1`), so it has no keys of its own.

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

- **Order record** (`condOrders`, saved in `pw_v1`/`pc_v1`): `id`, `symbol`, `entryPrice`, `target`, `worst`, `dir` (1 when target is above entry, -1 below), `markPrice`, `createdAt`, `tag`, `bundle` and `kind` (null outside a bundle), `candidate` (JSON copy), `_pseudo` (false for live), `_lastPx`, `_lastSeen`; live orders add `orderId` and `qty`.
- **Host hooks**: `placeCondEntry` validates and calls `_condSubmit(order)`, a no-op in the simulation, and `pseudoWatchCondOrders` runs from `pseudoWatchPositions` (one run at a time) for `_pseudo !== false` orders. The cond. card header renders `_roleBadge(o)`, so a role-badge provider can read the order and its `candidate`. `_condPrices`, `_condHit`, `_condKlines`, `_condKlineHit`, `_condResolve`, `_condWhiplashCheck`/`_condWhiplashAudit` and `_condGapAudit` are shared with the live plugins. **Bundles**: `_condSlots()` counts orders without a bundle plus distinct `symbol|bundle` pairs and is what `placeCondEntry` and the card header compare with **Max Cond. Orders**; `_condBundles()` and `_condBundleRows(b)` feed the bundle card; `_condCancelSiblings(o)` cancels the rest of `o`'s bundle (reason `bundle sibling`) and is called by `_condTrigger` right after it removes the order and by the live plugins' fill handlers; `_condKlinesRecent(sym)` shares the whiplash audit's kline read. `bailAll` calls `cancelAllCondOrders` first.
- **Fill**: `_condTrigger(o, at)` removes the order first, cancels the rest of its bundle, then opens through `pseudoOpenShort`/`pseudoOpenLong` with `candidate._condFill` used in place of the last price (and left off the position's copied fields). `at` back-dates `openedAt` and `_lastSeenAt`.
- **Live order**: EverWinter/SunChaser replace `_condSubmit` and `pseudoWatchCondOrders` and wrap `cancelCondOrder`. `_condSubmit` runs the entry checks (the position check reads the symbol set from the last pre-scan position sync while it is fresh, and only falls back to a per-symbol `position/list`), sets leverage (skipped when the same value was set for that ticker within the hour) and posts `POST /v5/order/create` as a GTC Limit order, not reduce-only, with `triggerPrice` = `price` = target, `triggerBy` LastPrice and `triggerDirection` 1 or 2. Qty is `minNotional / target` snapped. Because the limit sits at the trigger, an entry on the continuation side (Chaser at the top, Winter at the bottom; where Breakout's Continuation conds sit) can trigger with price already past the limit and rest until a retrace, while the fade side (where its Whipsaw conds sit) fills as price moves into it. Live fills bypass `_condTrigger`, so `_ewCondFilled` / `_scCondFilled` call `_condCancelSiblings` themselves.
- **Live watcher**: one `GET /v5/order/realtime` (up to 5 pages) every `ewCondListSec` seconds (default 15, no UI; every tick while a cond. is within **Whiplash Proximity** of its trigger), with a missing order looked up in `realtime` then `order/history` and dropped after 3 polls if found in neither. `Filled` hands `avgPrice` to the open function as `_condFill` with `_condQty`, which skips the entry guards, then builds TP, SL and DCA orders as usual. Worst case cancels on the exchange, and if the cancel is refused because the order filled, the position is tracked instead. Live cond. prices come from the WS feed when it has a read, otherwise one REST ticker per symbol on the same adaptive interval as open positions (**Price Poll Interval** doubling while flat, 60 s cap, back to base near a trigger).

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

**Public**: `GET /v5/market/tickers` (bulk for the symbol universe, per symbol for Breakout's pre-entry price), `GET /v5/market/recent-trade` (Breakout's illiquidity filter), `GET /v5/market/kline` (hourly bars for Breakout's turnover range and TP / SL moves, 1-minute bars for the whiplash and gap audits), `GET /v5/market/instruments-info`. **WebSocket**: `wss://stream.bybit.com/v5/public/linear` (position price stream). **Signed (live mode)**: `GET /v5/account/wallet-balance`, `GET /v5/position/list`, `GET /v5/position/closed-pnl`, `GET /v5/order/realtime`, `GET /v5/order/history`, `POST /v5/order/create`, `POST /v5/position/trading-stop`, `POST /v5/order/cancel`, plus `GET /v5/execution/list` on the Psycho bots; signing is HMAC-SHA-256 via `crypto.subtle.sign` with a 250ms minimum gap between signed requests (plugins).

**Call cadence**: the full-book `position/list` runs only before and after each scan loop. Single-symbol `position/list` calls happen around an entry and while a close is repricing. On the Psycho bots, `execution/list` is called for a pending DCA/AMa stage once price reaches its trigger, plus one sweep of every pending stage after each scan loop to catch a wick.

---
