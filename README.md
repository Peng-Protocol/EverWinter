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

In addition to the shared data pool, the Permafrost and Ashfall plugins maintain a separate cross-bot sample state (`__ew_sample_state_v1`) written after each structure cycle and read every 15 seconds. This state carries wave score, funding skew, OI skew, kline bar data, and liquidation cycle history. When one bot is in a drawdown halt or gains lock, its plugin reads the partner's sample to keep the Status Block bars, liq chart, and WAVE score line current — the halted bot's displays stay populated from the running partner's latest readings without opening any new entries.

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
| **Position Price Feed** (`restPollEnabled`) | When on, replaces the WebSocket price stream for open positions with periodic REST API calls. Use if the WS feed returns stale or incorrect prices. |
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
| **Persistence** | "Active" (live in-memory position count) vs. "Stored" (confirmed saved to localStorage). These should always match. |

**Persistence mismatch**: shown in red with a warning banner. It means a save failed or was overwritten, and usually clears on its own within a few seconds as the bot retries automatically. If it doesn't:
- Check the activity log for `[PST]`/`[PERSIST]` entries.
- Close any duplicate tabs of the same bot — a second tab can overwrite the first tab's saves with its own stale position count.

**Storage usage** (dropdown below Persistence): breaks localStorage down to one row per data type — e.g. Permafrost's structure wave, liquidation samples, and OC samples each get their own row instead of one lumped "Permafrost" figure, so a bloated data type is visible on its own. Oversized rows are shown in red. An **Export** link appears once expanded, downloading the same breakdown as a plain-text file.

**Power usage** (dropdown below Storage usage): a rolling average and peak of how many milliseconds the app spends reacting each second. A rising figure usually means a plugin panel left open somewhere is doing more work than it needs to — closing analytics panels you're not actively watching brings it back down.

**Ticker Graylist**: when MultiIndicator is enabled, the Stats menu shows a Ticker Graylist section listing symbols currently blocked from re-entry. It's empty when nothing is blocked. Each listed symbol clears itself automatically once the bulk ticker cooldown window elapses — no manual action needed.

### Actions Dropdown

- **Export** — Downloads current bot state (config, positions, closed trades, ban list, EDa state) as a `.json` file. Plugins with their own data (Permafrost/Ashfall profile, scorecard) have separate Export buttons inside their own accordions — the Stats menu Export covers the base bot state only.
- **Import** — Restores state from a previously exported `.json` file. Config fields merge field-by-field; positions replace wholesale. A 5s debounce prevents accidental double-imports. Any config key that no longer belongs to a currently-loaded feature (the bot itself or an installed plugin) is dropped automatically on import and on every save — retired settings from an old config file don't linger indefinitely.
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

**Liquidation is mandatory** — every slot, manual or auto-generated, must anchor on exactly one liquidation criterion (`sliq`/`bliq`/`msliq`/`mbliq`/`0liq`); everything else in the slot is secondary confirmation on top of it.

- `sliq`/`bliq`/`msliq`/`mbliq` are **live-only**: they fire the instant a liquidation message crosses the depth threshold, mid-cycle, rather than waiting for the next scan.
- `0liq` is the opposite — a ticker can only be confirmed liquidation-free once its surveillance cycle closes, so it stays on the regular scan cadence.
- The **Liquidation Presence** toggle (Config, below) controls which of the two are active.
- A manual slot built without a liquidation criterion (including any slot saved before this behavior existed) simply never matches — the plugin logs a one-time warning on load listing how many.

### Criteria

See Strategy_book.md's **Market Reading** section for what each criterion (`fund`, `vm`, `lsa`/`lba`/`rasl`/`rabl`, `iot`/`iom`, `sliq`/`bliq`/`msliq`/`mbliq`, `0liq`, Buy/Sell Skew, Order Count Deviation) means and when to use it. The mechanical notes below cover tiering, recording, and the depth gate — operational detail Strategy_book intentionally leaves out.

**Tier gate**: all tiered criteria (`fund`, `vm`, `lsa`, `lba`, `rasl`, `rabl`, `iot`, `iom`, `ocs`, `ocx`) compute an integer tier as `floor(value / step)` and compare it against N. Current step sizes are shown as a read-only info line under **Tier Step Sizes** in the Entry Zone. The same tier is recorded on the position and used as the scorecard key — `lsa>25` and `lsa+37` are different tiers and scored separately.

**Funding emoji direction**: the position/trade badge shows 🤑 or 💸 for a `fund` tier, and the two bots deliberately show opposite emoji for the same raw funding sign. It's not encoding the raw sign — it's encoding whether that funding condition favors the bot's own direction: longs paying shorts favors Winter's shorts (🤑) and costs Chaser's longs (💸); shorts paying longs is the reverse. Since Winter and Chaser trade opposite directions, the same funding reading is good news for one and bad news for the other.

**OCS/OCX recording**: on entry —
- `ocs` records signed deviation-from-parity tiers, e.g. `ocs+12` = 62% buy-dominant, `ocs-8` = 42% buy / 58% sell.
- `ocx` records the average-interval tier directly, e.g. `ocx+18` ≈ 1.8s between fills.
- Unlike every other criterion, Order Count Surveillance data exists for essentially every ticker at all times — there are always orders flowing — so `ocs`/`ocx` behave like `+24h`/`-24h`: near-universally available rather than conditional on a data source being fresh or a pattern being present.
- The OC sample (only fetched when a slot uses `ocs`/`ocx`) always includes whatever tickers this same scan just picked for liquidation surveillance, filling any remaining headroom with a random draw from the rest of the candidate pool — so OC data exists for exactly the tickers a liquidation event might be about to hit. The sample is sized to Permafrost/Ashfall's **Liq Batch Size**, not a separate cap.

**Depth gate** (sliq/bliq/msliq/mbliq): a *live* reading, checked the instant a liquidation message arrives.

- `sliq>N` requires live `sDepth ≥ N`; `sliq<N` requires live `sDepth ≤ N`.
- `sDepth`/`bDepth` are `trunc(((sideTurnover / historicalAvg) − 1) × 100)` — the liquidated side's turnover so far this message, compared to the average liquidation size recorded across *all* history (every ticker, every closed cycle; zero-turnover entries excluded so it isn't diluted by the majority of ticker/cycle combos with no liquidation that side).
- `+10` means this liquidation is running 10% above the historical average; `-10` means 10% below. There's no upper ceiling; the practical floor is `-100` (zero liquidation that side).
- `msliq`/`mbliq` use the same depth value as `sliq`/`bliq` respectively.
- On a **manual** slot, a depth suffix in the criteria picker overrides the general **Live Depth Threshold** (Config, below) for that slot only; leaving it bare falls back to the general threshold. Auto Slots always uses the general threshold, since there's no per-combo picker to set one.
- The historical average is recomputed once per closed cycle (not per liquidation message), so a live reading mid-cycle is always judged against the average as it stood *before* the current cycle — same as the closed-cycle 0-Liq reading.

### Config

| Setting | What it does |
|---|---|
| **Enabled** (`miwEnabled`/`micEnabled`) | Master on/off. When off, the plugin opens no entries and runs no exits. |
| **Picks** (`miwPicks`/`micPicks`) | Max new entries per scan cycle (1–10). |
| **Share Cap** (`miwShareCapEnabled`/`micShareCapEnabled`) | Limits plugin entries to a percentage of `maxPos`. Prevents MIW/MIC from filling all position slots. |
| **Share Cap %** (`miwShareCapPct`/`micShareCapPct`) | The cap percentage. At 50% with maxPos=6, MIW/MIC can hold at most 3 positions. |
| **Kline Scan Cap** (`miwKlineScanCap`/`micKlineScanCap`) | Max tickers sampled per cycle for kline-based criteria (lsa/lba/rasl/rabl) fetches. Higher = broader coverage, more API calls. |
| **V/M Scan Cap** (`miwMcapScanCap`/`micMcapScanCap`) | Max tickers for which CoinGecko market cap is fetched per scan cycle. Tickers are pre-screened by fund rate and 24h direction before the cap is applied, so only genuine candidates count against it. Bounding this keeps the CG request small and prevents failed fetches from leaving stale market cap data in the pool. |
| **Fresh V/M Only** (`miwRequireMcapData`/`micRequireMcapData`) | When on, `vm` and `iom` criteria only pass for tickers whose market cap was retrieved from CoinGecko within the freshness window this cycle. Prevents stale or bad cached market cap data from producing unrealistically high V/M values. |
| **V/M Freshness** (`miwMcapFreshCycles`/`micMcapFreshCycles`) | How many scan cycles old a CoinGecko mcap fetch can be before it is treated as stale for Fresh V/M Only. Only visible when Fresh V/M Only is on. |
| **Tier Step Sizes** (`miwFundStep`/`miwVmStep`/`miwSpikeStep`/`miwIotStep`/`miwIomStep`/`miwOcsStep`/`miwOcxStep` and `mic` equivalents) | Read-only info line showing the current tier step size for `fund`, `vm`, `lsa`/`lba`/`rasl`/`rabl` (spike), `iot`, `iom`, `ocs`, and `ocx`. OCX's step is deliberately much finer than the others — order intervals can run into the tens of milliseconds on a busy ticker, so a coarse step would erase most of the useful signal. Not editable from the UI — change via config import if a different step is needed. |
| **Cascade** (`miwCascadeEnabled`/`micCascadeEnabled`) | Closes every open position — any strategy's, not only MIW/MIC's own — when their collective unrealized profit hits a threshold. Banks a group move before it reverses. Checked continuously by the position watcher (every 5s while the bot is running), not just once per scan, so a threshold crossed and reversed between scans is still caught. |
| **Cascade %** (`miwCascadePct`/`micCascadePct`) | Collective uPnL trigger as a % of base margin (minNotional ÷ leverage). |
| **Sacrifice** (`miwSacrificeEnabled`/`micSacrificeEnabled`) | Closes every open position — any strategy's, not only MIW/MIC's own — when their collective unrealized loss hits a threshold. Caps group drawdown. Same continuous position-watcher check as Cascade. |
| **Sacrifice %** (`miwSacrificePct`/`micSacrificePct`) | Collective uLoss trigger as a % of base margin (minNotional ÷ leverage). |
| **Rolling Sacrifice** (`miwRollingSacrificeEnabled`/`micRollingSacrificeEnabled`) | When on, Sacrifice closes only the oldest open position at a time instead of all at once. |
| **Target Halving** (`miwHalvingEnabled`/`micHalvingEnabled`) | Shrinks the Cascade/Sacrifice trigger threshold the longer the oldest open position (any strategy's) has been held, based on Halving Interval. This is continuous exponential decay, not a one-time halving — the multiplier keeps halving again every full interval that elapses (×0.5 after 1 interval, ×0.25 after 2, ×0.125 after 3, and so on with no floor), so a group left open for several intervals can trigger on a very small collective profit or loss. |
| **Halving Interval** (`miwHalvingHours`/`micHalvingHours`) | Hours per halving step for Target Halving. The live hint below this control shows the oldest position's age and the multiplier it would apply on trigger right now. |
| **Liquidation Presence** (`miwLiqPresenceMode`/`micLiqPresenceMode`) | Four-way toggle: **Only 1** runs only the live sliq/bliq/msliq/mbliq path. **Only 0** runs only the closed-cycle 0-Liq path. **Both** runs each independently, producing their own slots. **Auto** switches between Only 1 and Only 0 by market regime — see below. Requires Liquidation Surveillance in Permafrost/Ashfall — without it there's no liq data at all and no slot can ever match. |
| **Auto Presence — Base** (`miwPresenceBase`/`micPresenceBase`) | Only shown when Liquidation Presence is Auto. Four options: **Only-1 🥵^**, **Only-1 🥶^**, **Only-0 🥶^**, **Only-0 🥵^** (🥵 = S-Liq, 🥶 = B-Liq, `^` marks the anchor). This is the user-selected initial base. Auto mode also keeps a persisted current base (`miwPresenceCurrentBase`/`micPresenceCurrentBase`) that starts from this value, can be moved by drawdown handling, and survives reloads until another drawdown broadcast or manual Base change updates it. Each base names which mode runs when that regime is dominant — the opposite regime always gets the opposite mode. E.g. **Only-1 🥵^** means Only 1 while S-Liq is dominant, Only 0 while B-Liq is dominant. |
| **Auto Presence — Trigger** (`miwPresenceAutoTrigger`/`micPresenceAutoTrigger`) | Only shown when Liquidation Presence is Auto. **Only-Skew** flips per the current base's anchor whenever Permafrost/Ashfall's aggregate B-Liq/S-Liq turnover crosses their Presence Regime Threshold. **Only-Drawdown** follows partner drawdown broadcasts from Cross Broadcast: the sender announces the current base it was using at drawdown, the receiver adopts that base, and the sender flips its own current base to the opposite. **Both** resolves from either signal. When neither regime is dominant (mixed) and no drawdown update applies, Permafrost/Ashfall's "When Regime Is Mixed" setting decides whether this stays on the current base's own mode or halts new entries until the regime turns directional again — existing positions are unaffected either way, and Historical Scoring keeps logging through the halt the same as a drawdown halt. |
| **Live Depth Threshold** (`miwLiveDepthThreshold`/`micLiveDepthThreshold`) | General live depth threshold (% vs. historical average liquidation size) applied to every Auto-Slot live liq anchor. Only shown when Auto Slots is on and Liquidation Presence isn't Only-0 — manual slots set depth per-slot instead, via the criteria picker's depth suffix. |
| **Substitution** (`miwSubstitutionEnabled`/`micSubstitutionEnabled`) | When no entry slot is free (maxPos or Share Cap reached), closes the worst-scoring held position — any strategy's, not only MIW/MIC's own — and opens the best fresh candidate instead, but only if the candidate's collapsed score exceeds the held position's entry-time score by the configured Margin. Requires Co-Qualifying Penalty (Permafrost/Ashfall) — without it, every score is 0 and Substitution never fires. |
| **Substitution Margin** (`miwSubstitutionMarginPct`/`micSubstitutionMarginPct`) | How much better the new candidate must score than the worst held position, as a % of base margin (minNotional ÷ leverage), before a swap happens. Prevents swapping on marginal score differences. |
| **Substitution Min Age** (`miwSubstitutionMinAgeMins`/`micSubstitutionMinAgeMins`) | Minimum minutes a position must be held before it becomes eligible to be substituted out. |
| **Protect Winners** (`miwSubstitutionProtectWinners`/`micSubstitutionProtectWinners`) | When on, a position currently in profit is never substituted out, regardless of how it ranks. Turn on if temporary winners in your markets tend to hold rather than reverse quickly, and should be shielded just for being ahead right now. |
| **Protect Path-A** (`miwSubstitutionProtectPathA`/`micSubstitutionProtectPathA`) | When on, a live liq candidate (sliq/bliq/msliq/mbliq) can never substitute out a 0-Liq position — 0-Liq is the closed-cycle, higher-conviction read. A 0-Liq candidate can still substitute anything, live or closed-cycle. Turn off to rank purely by score regardless of which path opened a position. |
| **Re-entry Block Mode** (`miwReentryBlockMode`/`micReentryBlockMode`) | **Winners + Losers** blocks a symbol from re-triggering for one bulk-ticker cooldown window after any close, win or loss. **Losers Only** lets a symbol that just closed in profit re-trigger immediately, blocking only a symbol that closed at a loss. |
| **Self-Liq Graylist** (`miwSelfLiqGraylistEnabled`/`micSelfLiqGraylistEnabled`) | When on, any liquidation this bot's own surveillance records for a ticker — even one that never crossed the qualifying % threshold — graylists that ticker from the 0-Liq path for 6 hours. Guards against a ticker that liquidated a couple hours ago looking freshly "calm" just because its most recent surveillance cycle happened to close clean. Only has an effect while Liquidation Presence isn't Only-1 — a bot running Only-1 has no 0-Liq path to guard. |
| **Direction Lock** (`miwDirLockEnabled`/`micDirLockEnabled`) | When on, closing a live liq trade (sliq/bliq/msliq/mbliq) locks that exact type to that exact ticker for 6 hours: a win allows only that type to re-fire there, a loss excludes it. The **Invert** sub-toggle (`miwDirLockInvert`/`micDirLockInvert`) flips both — a win excludes the type instead, a loss locks it instead. Watch it working in the **Ticker Locks** stats section below the Hist Scoring panel. Only has an effect while Liquidation Presence isn't Only-0 — a bot running Only-0 never takes a live liq entry to lock. |
| **Liq Result Max Age** (`miwLiqResultMaxCycles`/`micLiqResultMaxCycles`) | How many scan cycles a closed liq cycle result stays valid for the 0-Liq slot criterion. Results older than this are treated as absent. Live sliq/bliq/msliq/mbliq entries aren't affected — there's nothing to go stale on a message that just arrived. |
| **V/M & IO/M Sanity Cap** (`miwSanityCheck`/`micSanityCheck`, `miwSanityCap`/`micSanityCap`) | Excludes a ticker from `vm`/`iom` criteria for the cycle if its 24h turnover or open interest exceeds the cap as a share of market cap — a guard against a wrong-coin or stale market cap fetch producing an absurd ratio. One shared toggle and cap for both criteria, since they've never needed different values in practice. |
| **Auto Slots** (`miwAutoSlots`/`micAutoSlots`) | Replaces the manual slot list with every possible combination of the available criteria at the chosen size. Every combination anchors on a liquidation criterion (filtered by Liquidation Presence) — there's no way to auto-generate a slot without one. |
| **Auto Slot Size** (`miwAutoSlotSize`/`micAutoSlotSize`) | How many criteria per auto-generated combination (1–4), counting the mandatory liq anchor. At size 1 every generated slot is bare liquidation with no secondary confirmation at all. |
| **Exclude from Auto** (`miwAutoSlotExclude`/`micAutoSlotExclude`) | Criteria omitted from auto-generated combinations and from scorecard scoring. Excluding all liq types allowed under the current Liquidation Presence mode leaves nothing to anchor on, so Auto Slots generates zero slots. |
| **Historical Scoring** (`miwHistScoringEnabled`/`micHistScoringEnabled`) | When on, tickers that match a slot during a scan are tracked past that cycle. The bot waits for the next full 1h candle to close, then simulates whether that entry would have hit TP or SL — and writes the result to the shared scorecard as a historical record tagged separately from live trades. Builds slot history without requiring an actual open position. See **Historical Scoring detail** below. |
| **Hist Tolerance** (`miwHistToleranceMins`/`micHistToleranceMins`) | Minimum minutes before the next hour boundary for a slot match to target that candle. If the boundary is within this window the match targets the following hour instead, ensuring the candle has enough time to fully form before observation. |
| **Hist Sequester %** (`miwHistSequestrPct`/`micHistSequestrPct`) | Share of the kline scan cap reserved each cycle for confirming pending hist targets — e.g. a 50% share with a scan cap of 50 sends 25 slots to confirmation and 25 to discovery. Unused sequester slots roll over to discovery automatically. |

**Historical Scoring detail**:
- Data collection continues regardless of any block or halt mechanism active at the time — with one exception: on **Only 1**, new logging only runs during Drawdown Halt or Gains Lock, since real trades already cover the scorecard for every live match outside those windows. **Only 0**/**Both** are unaffected.
- Live-anchored slots (`sliq`/`bliq`/`msliq`/`mbliq`) can't be resolved by the scan-time checker at all, so they're logged from the same live liq-message feed that would otherwise open a real entry — during a halt, a message that matches a live-anchored slot is logged as a hist target instead of opening a position, using the exact same checks (banlist, Direction Lock, React to Partner 0-Liq Win, criteria match) a real entry would have used. This is what makes **Only 1** hist scoring possible at all, since every one of its slots is live-anchored.
- Duplicate prevention: the same symbol + slot + target candle combination can only be logged once, so repeated scans during the same candle window do not inflate records.
- When a batch resolves, the activity log emits a numbered begin message and completion message — e.g. `📊 Hist-score batch #3 begun — 12 entries across 8 symbols`. Batch numbers cycle 1–99.

### Market Cap Fetch

`vm` (V/M ratio) and `iom` (OI/M ratio) criteria require per-ticker market cap data. The fetch uses a three-source fallback chain:

1. **CoinGecko** (primary) — coin ID list cached 24h in `__cgCoinList`; market caps fetched per scan batch up to the V/M Scan Cap.
2. **CoinPaprika** (fallback) — used for any tickers CoinGecko did not return. Fetches circulating supply; market cap is computed as supply × current Bybit price. Coin list cached 24h in `__cpCoinList`.
3. **DexScreener** (final fallback) — used for tickers both CoinGecko and CoinPaprika missed. Pulls mcap directly from DEX pair data.

CoinGecko and CoinPaprika's full coin lists cover the entire market (tens of thousands of coins); only the subset matching Bybit's own linear-perp ticker universe is ever persisted to `__cgCoinList`/`__cpCoinList` — the rest is discarded before caching since it's never looked up.

- **Price sanity check**: each cached market-cap entry also carries the price the source reported it against. A cached mcap is only trusted if that reported price is within 10% of Bybit's current price for the same ticker — otherwise it's treated as stale and the next source in the fallback chain is tried instead. This guards against a source having matched the wrong coin (e.g. a ticker symbol that collides between two different projects), which would otherwise silently pass through as a wildly wrong market cap.

All three sources share their results cross-tab. A ticker with no data from any source cannot satisfy `vm` or `iom` criteria; enabling Fresh V/M Only forces stale-data tickers to be dropped rather than passed.

### Slots UI

**Manual mode**: click a slot to select it, then toggle criteria on/off in the picker row below. ✕ deletes the slot; `+` adds a new empty one. A slot needs a liquidation criterion to ever match — clicking sliq/bliq/msliq/mbliq opens the same depth picker described above, now setting that slot's live trigger threshold (or 0-Liq for the closed-cycle path, no depth to set).

**Auto mode**: replaces the manual builder with a size picker and an exclusion chip row. Every generated combination anchors on one liquidation criterion (the types allowed depend on the Liquidation Presence setting) plus secondary criteria filling the remaining slots — the combo count shown reflects one liq anchor × the secondary combinations after exclusions.

- Many generated combinations are contradictory and can never match any ticker: a slot containing both `+24h` and `-24h` can never be satisfied simultaneously, nor can any two from the candle group (`lsa`, `lba`, `rasl`, `rabl`), since a candle only closes in one direction with one volume character at a time. At secondary-size 2 these pairs are common, so the effective slot count is lower than the number shown. Excluding one side of each pair removes the dead combinations.
- `lsa`/`lba`/`rasl`/`rabl` almost never co-qualify with `vm` criteria in the same slot: `vm` criteria apply only to a capped subset of top tickers by turnover (V/M Scan Cap), while kline criteria sample randomly from the full pool — the overlap between those two subsets is small in practice.

---

## Permafrost / Ashfall Plugin

Permafrost targets PseudoWinter; Ashfall targets PseudoChaser. These plugins replace the fixed 12h drawdown/gains-lock timers with an adaptive halt system that learns from historical market conditions and trade outcomes.

They pair realized PnL from each close with a snapshot of market structure — breadth, momentum, and funding sentiment — building a recency-weighted profile over time. That profile drives a climate score that controls halt duration and signals downstream systems (the bots themselves) to adjust their entry and hold behavior accordingly. In practice, market regime (broadly bullish or bearish) is a significant driver of the learned profile, so the score reflects prevailing conditions rather than precise structural predictions.

**During the first days of operation the plugin behaves almost identically to the stock timers.** It withholds climate governance until enough evidence has accumulated near the current market reading.

### Config

| Setting | What it does |
|---|---|
| **Enabled** | Master toggle. When off, the bot uses the stock 12h halt timers. |
| **Thaw/Settle Score** | Climate score the market must reach for an early halt lift. Higher = harder to thaw; bot stays halted longer in ambiguous conditions. |
| **FIO Sentiment** (`permafrostFioEnabled`/`ashfallFioEnabled`) | Includes funding rate sentiment (which side is paying) in the climate score. Labeled FIO — funding-derived — to avoid confusion with the unrelated `iot`/`iom` (Open Interest) criteria. |
| **Slot Scorecard** (`permafrostScorecardEnabled`/`ashfallScorecardEnabled`) | Records realized PnL per MIW/MIC criteria combination. Shows which slot types have been profitable or losing over time. |
| **Sponge Quota** (`pfSpongeQuota`/`afSpongeQuota`) | How many recent closes per criterion are used to compute scores. Older records beyond this count are ignored. Lower = faster adaptation to recent performance; higher = more stable scores that smooth out short streaks. |
| **Include Historical Scores** (`pfHistScoringEnabled`/`afHistScoringEnabled`) | When on, historical scoring records (written by the MIW/MIC Historical Scoring feature, tagged `hist: true`) are included in slot score calculations. When off, only live closed-trade records count. Independent of the MIW/MIC **Historical Scoring** toggle — turning that off in MIW/MIC only stops new historical entries from being generated; existing ones remain in the scorecard until this toggle is turned off or the sponge quota pushes them out. Turning this off while records exist immediately reduces slot scores to the real-trade-only baseline; slots with no real-trade records disappear from the scorecard entirely until live trades accumulate. |
| **Cross Broadcast** (`permafrostCrossEnabled`/`ashfallCrossEnabled`) | Writes cascade/sacrifice closes, drawdown halt/gains-lock transitions, live liquidation events, and 0-Liq wins to a shared log that the partner bot can read. Required for Mutual DDH Lift and both React toggles below. |
| **Mutual DDH Lift** (`permafrostMutualDdLiftEnabled`/`ashfallMutualDdLiftEnabled`) | When both bots are simultaneously in drawdown halt, lifts this bot's halt. Checked every 15 s. Requires Cross Broadcast to be on. |
| **Gains Continuation** (`permafrostGainsContinuationEnabled`/`ashfallGainsContinuationEnabled`) | When the partner bot reaches its gains threshold and broadcasts a Gains Continuation signal, arms this bot's own drawdown halt for a full configured duration — same as if this bot's own drawdown throttle had just triggered, including bailing open positions if Drawdown Bail is on. Checked every 15 s. Requires Cross Broadcast to be on. Independent of this bot's own Gains Lock setting — only Drawdown Throttle needs to be on for this to apply. |
| **React to Partner Live-Liq** (`pfCrossLiqGraylistEnabled`/`afCrossLiqGraylistEnabled`) | When the partner bot logs a live liquidation on a ticker, graylists that ticker from this bot's own 0-Liq path for 6 hours. Only has an effect while this bot's Liquidation Presence isn't Only-1 — a bot running Only-1 has no 0-Liq path to protect. |
| **React to Partner 0-Liq Win** (`pfCrossWinGraylistEnabled`/`afCrossWinGraylistEnabled`) | When the partner bot wins a 0-Liq trade on a ticker, graylists that ticker from this bot's own live liq entries for 6 hours. Only has an effect while this bot's Liquidation Presence isn't Only-0 — a bot running Only-0 has no live path to protect. |
| **Stale Slot Purge** (`pfStaleSlotDays`/`afStaleSlotDays`) | Slots with no new close in this many days are fully removed from the scorecard on the next trim. Keeps the scorecard clean when criteria combinations fall out of use. Configurable 1–90 days. |
| **Co-Qualifying Penalty** (`pfCoQualPenaltyEnabled`/`afCoQualPenaltyEnabled`) | When on, the composite score for each ticker is adjusted downward for every additional slot (beyond the best match) that the ticker qualifies for and that carries a negative collapsed score. A ticker matching one good slot and two losing slots is ranked lower than one that only matches the good slot. Only negative co-qualifying scores penalise — positive co-qualifying slots do not boost. |
| **Depth Multiplier** (`pfCoQualDepthPct`/`afCoQualDepthPct`) | Scales every criterion's collapsed score by how far past that slot's own gate threshold the ticker qualifies, both for the best-match slot and any co-qualifying penalty slots — not by the raw tier value. E.g. a criterion scoring +$0.50 historically is applied as +$0.70 for a ticker qualifying 4 tiers past its slot's threshold at 10%/tier. Works the same in reverse — a losing criterion is penalised harder the deeper past threshold the ticker qualifies. Depth is direction-aware: for a `<` gate (`vm<N`, `iot<N`, `iom<N`, `ocx<N`) a *lower* measured value is the deeper match, since those criteria consider low readings the extreme case. Range 0–50%. |
| **Liquidation Surveillance** (`pfLiqEnabled`/`ashLiqEnabled`) | Opens WebSocket connections to track live liquidation flow across a rolling sample of volatile tickers. Required for `sliq`/`bliq` criteria in MIW/MIC. |
| **Liq Batch Size** (`pfLiqBatchSize`/`ashLiqBatchSize`) | Tickers per liquidation batch (5–50). More tickers = broader market coverage per cycle. Also sizes MIW/MIC's OC ticker sample — see **OCS/OCX recording** in the MultiIndicator section. |
| **Liq Threshold %** (`pfLiqThresholdPct`/`ashLiqThresholdPct`) | Minimum share of a cycle's total liquidation turnover one side must hold to qualify (10–90%). At 50%, one side must account for at least half. |
| **Presence Regime Threshold** (`pfPresenceSkewThreshold`/`ashPresenceSkewThreshold`) | Aggregate B-Liq or S-Liq turnover share (50–95%) needed to call the market "dominant" one way or the other. Feeds MIW/MIC's Auto Liquidation Presence and Speeder's Auto Speed Mode — not scored or traded here directly. |
| **Presence Regime Window** (`pfPresenceSkewWindow`/`ashPresenceSkewWindow`) | How many of the most recently closed liq cycles to aggregate for the regime read (0–25). 0 uses the entire retained history. |
| **When Regime Is Mixed** (`pfPresenceMixedMode`/`ashPresenceMixedMode`) | What Auto-mode consumers (MIW/MIC, Speeder) do when neither side crosses the Presence Regime Threshold. **Continue** keeps them on their own Base setting. **Halt** pauses their new entries until the regime turns directional again — existing positions are unaffected. |
| **Order Count Surveillance** (`pfOcEnabled`/`afOcEnabled`) | Fetches a fixed number of recent trades for the tickers in MIW/MIC's scan candidate pool. Required for `ocs`/`ocx` criteria in MIW/MIC. Each fetch is a fresh, independent snapshot — no accumulation or deduplication across cycles. |
| **OC Order Limit** (`pfOcOrderLimit`/`afOcOrderLimit`) | Recent trades fetched per ticker per scan cycle (10–500). Buy/sell skew and average order interval are both computed from this single sample. |


### Speeder Multiplex

Speeder is an optional multiplex strategy (`plugins/multiplex/Speeder-Winter.html` / `plugins/multiplex/Speeder-Chaser.html`) that borrows the bot's Order Count Surveillance sample and opens one ticker per scan from the selected speed half.

| Setting | What it does |
|---|---|
| **Speeder Mode** (`sdwMode`/`sdcMode`) | **Fast** targets the busy/low-interval half of the order-count sample. **Slow** targets the quiet/high-interval half. **Auto** switches between Fast and Slow using the same liquidation-regime and partner-drawdown sources as Auto Liquidation Presence. |
| **Auto Speed — Base** (`sdwAutoBase`/`sdcAutoBase`) | Only shown when Speeder Mode is Auto. Four options: **Fast 🥵^**, **Fast 🥶^**, **Slow 🥶^**, **Slow 🥵^**. This is the initial speed base. Speeder also keeps a persisted current speed base (`sdwAutoCurrentBase`/`sdcAutoCurrentBase`) that starts from the initial base, can be moved by drawdown handling, and survives reloads until another drawdown broadcast or manual Base change updates it. |
| **Auto Speed — Trigger** (`sdwAutoTrigger`/`sdcAutoTrigger`) | **Only-Skew** flips per the current speed base's anchor when the liquidation regime changes. **Only-Drawdown** follows partner drawdown broadcasts (requires Cross Broadcast): the partner announces the speed base it lost on, this bot adopts that base, and the partner flips to the opposite speed base locally. **Both** resolves from either signal. Mixed-regime handling follows Permafrost/Ashfall's **When Regime Is Mixed** setting, same as MIW/MIC Auto Presence. |

### WAVE Tab

The WAVE tab holds display and analysis config controls: which sampling bars and charts to show (Structure / Funding / Liq / Vol toggles), Slope Window, Collective FIO toggle, and Liquidation Surveillance setup and config. The Danger Zone (Export / Import / Clear Profile / Clear Plugin State) is also accessed from this tab.

The **wave chart**, **sampling bar displays** (kline direction, funding skew, liq flow, volume), **scorecard chip row**, and **liquidation results chart** all appear directly in the accordion body — no tab needs to be clicked to see them.

The wave chart has three overlay toggles: **Structure** (the market lean path), **FIO** (funding sentiment line — named for its funding-rate derivation, distinct from the `iot`/`iom` Open Interest criteria), and **Score** (a gray line derived from the slot scorecard). When Score is on, a percentage readout appears below the chart showing the net scorecard balance as a share of total recorded weight — green when positive, red when negative.

**Score line during halt**: a drawdown halt or gains lock only pauses new position entry — scans keep running in full, so structure sampling, liquidation/OC surveillance, and the scorecard all keep collecting data. If this bot's own wave score is still unavailable for some other reason, the score line falls back to the partner bot's most recently published wave score. When the scorecard is thin, the wave score falls back to raw kline momentum from the last completed hour candles across the sampled ticker set.

**Gaps in chart history**: the wave chart's Structure/FIO/Score lines break the line across a real data gap (the bot off, or unable to sample) instead of drawing a straight connector across the missing period. A resumed session starts a fresh line segment rather than dragging the old one forward to the latest point. The gap threshold is padded above Scan Interval so ordinary scan-timing jitter is never mistaken for a real gap, while a genuine multi-cycle miss still breaks the line.

### Status Block

Shows the current climate reading (magnitude, breadth, slope, FIO score, effective score, evidence mass), and active halt state (profile-governed or fallback timer). The **wave graph** plots recent market structure — direction label (rising/falling/steady) reflects the recent path of the market.

Three directional bar charts below the climate reading show relative dominance at a glance. Red extends left (adverse for this bot's direction), green extends right (favorable), with current values as a label. A drawdown halt or gains lock only pauses new position entry — this bot's own scans, and with them these bars, keep updating normally. The bars (kline direction, funding skew) and the liq chart also read from the partner bot's sample state every 15 seconds as a backup, so the display stays populated even if this bot's own sampling is thin or the bot is off.

| Bar | What it shows |
|---|---|
| **1h Kline** | Bear vs. bull aggregate from the last completed 1h candle sample. |
| **Funding Rate** | Neg vs. pos funding skew across the kline + liq ticker union. |
| **Liquidation Flow** | B-Liq vs. S-Liq share of the last completed liq cycle. Only appears when Liquidation Surveillance is on and at least one cycle has closed. |
| **Volume Sample** | Below-average vs. above-average volume share of the current kline sample, weighted by deviation magnitude. Gray extends left (below average) and thematic color extends right (above average). Only appears when the Volume fade signal is enabled. |
| **Order Interval Sample** | Per-ticker bar chart of average seconds between orders (orderbook velocity), scrollable through history — a slower/quieter ticker draws a taller bar, busier/faster draws shorter. Only appears when Order Count Surveillance is on and at least one sample has been taken. See **Order Interval Sample detail** below. |

> **Observational note:** The sampling bars and charts (kline direction, funding skew, volume skew) are primarily **visual feedback**. They reflect broad market conditions but do not directly gate entries or trigger closes on their own — the only mechanism that acts on them is the combined entry/close signal system (which requires scorecard gating before most signals contribute). Do not read the bars as predictive signals; a heavily red kline bar can coincide with Chaser winning and Winter losing, or vice versa. Treat them as ambient context while the scorecard provides the actual decision weight.

**Order Interval Sample detail**:
- An **Avg order interval** line below the chart shows the mean seconds/order across every ticker in the displayed cycle.
- Tickers averaging over 12s/order are left off the chart so a handful of illiquid outliers don't stretch the axis and shrink every other bar to a sliver — they're still fully eligible for `ocx`/`ocs` entry criteria and still appear in the chip list below.
- Each cycle group is stamped with its sample time (HH:MM) and clickable, same as the Liq Sample chart — clicking one pins the summary and chip list to that cycle's per-ticker data (buy/sell fill counts, average seconds/order). Clicking anywhere outside returns to the latest cycle, which is also what shows with nothing pinned.
- Records left over from the pre-redesign OC system (a single raw order number instead of the buy/sell split) are purged from stored history automatically on load and on profile import.

**Requires MultiIndicator**: the Funding Rate Sample, Volume Sample, Order Count Surveillance, and the Slot Scorecard are all computed by MIW/MIC's own sampling pass and disappear entirely if MultiIndicator isn't loaded — they are not shown empty, they don't render at all.

### Slot Scorecard

**Slot Scorecard (Chaser/Winter View)** — one chip per base MIW/MIC criterion (e.g. `fund>`, `vm>`, `+24h`) with PnL pooled across all slots that contained it. Only shown when MIW/MIC is both loaded and enabled.

**CLEAR** wipes the record store. Each close writes one record; the Sponge Quota controls how many recent records per criterion are factored in, so scores always reflect the most recent N closes and adapt quickly to shifts in market behavior. MIW/MIC uses its own chart's per-criterion scores to order its entry queue — slots are ranked by the sum of their individual criteria scores. A slot with one losing criterion and one winning criterion ranks by their combined total.

A live position close isn't the only thing that updates the scorecard. Each completed Historical Scoring batch writes its own records and refreshes the scorecard the same way, so scores can shift between trades whenever Historical Scoring is enabled — see the Hist Scoring panel below.

**Win/loss counts can appear high** — this is normal. A criterion shared across many slots accumulates records from all of them. The Sponge Quota caps contributions per criterion, not per slot, which is what makes the scorecard responsive.

MIW/MIC builds a composite score for each candidate ticker before sorting the entry pool. The composite starts with the ticker's best-matching slot score. If **Co-Qualifying Penalty** is on, any additional slots the ticker qualifies for are inspected: those with negative criterion scores subtract from the composite. A ticker that satisfies one strong slot but also satisfies two consistently losing slots ranks lower than a ticker that only satisfies the strong slot. Slots with positive scores do not boost — only negative co-qualifying scores penalise.

The **Both / Hist / Traded** source filter (`pfScorecardSource`/`afScorecardSource`) cycles through which score records are included in the displayed chips. **Both** shows all records. **Hist** shows only records written by the MIW/MIC Historical Scoring feature. **Traded** shows only records from actual live closed trades. This is a display-only filter — it does not affect which records count toward collapsed scoring. Selection is persisted.

The **Combined / Own** toggle (`pfScorecardView`/`afScorecardView`) switches between: Combined (includes partner bot trades, PnL inverted) sorted by blended total; and Own (this bot's trades only). Selection is persisted.

**Clicking a chip** in Combined mode shows the raw partner win total; in Own mode it shows the raw own loss total. Clicking again or switching sort mode returns to the normal view.

**CLEAR** wipes all records in the shared store.

**Hist Scoring panel**: when Historical Scoring is enabled, the **Stats menu** also shows a Hist Scoring section with the current count of pending simulation targets, a countdown to the next expected batch (shows "next scan" once the window has elapsed), and a list of completed scoring batches (newest first). Each batch entry shows the batch number, wrote/total counts, win count (W), loss count (L), net simulated PnL, and the clock time the batch completed (same-day batches show HH:MM; older ones show month, day, and time). On **Only 1**, this section only appears during Drawdown Halt or Gains Lock — see the Historical Scoring row above.

**Ticker Locks panel**: when any of Self-Liq Graylist, React to Partner Live-Liq, React to Partner 0-Liq Win, or Direction Lock is enabled, the **Stats menu** shows a Ticker Locks section — one line per currently-affected ticker, listing every reason that currently applies to it (Self-Liq / Partner Live-Liq / Partner 0-Liq Win / the liq type for Direction Lock), each tagged LOCK (green) or EXCLUDE (red), plus the clock time the last of those reasons expires. Empty when nothing is currently locked.

### Liquidation Feed

When surveillance is on: the **Feed Watcher** panel shows active batches (batch ID, ticker count, running S-Liq / B-Liq USDT totals, dominant side, countdown). The **Liq Sample chart** shows up to the last 25 closed cycles as stacked bars (S-Liq green / B-Liq red, qualifying segments at full opacity). Each cycle's bar group is clickable — clicking one pins the **Highlighted Cycle** chip grid below to that cycle's per-ticker qualification, with a label showing that cycle's time when it isn't the actual latest one. Clicking anywhere outside the chart or the chip grid returns Highlighted Cycle to the actual latest cycle, which is also what it shows by default with nothing pinned. Below the chart, a summary line ("Highlighted B-Liq % / S-Liq %") totals turnover for whichever cycle is currently pinned (or the latest one, if none is), alongside a second line totalling every ticker's latest known reading regardless of cycle ("All").

Each ticker's chip badge reflects the same 70%/30% classification MI's live criteria checker uses, not a flat pass/fail: 🥵 S-Liq or 🥶 B-Liq at ≥70% dominance, dimmer 💦/🌨️ (mixed) badges for a 30–70% majority. A near-even split (e.g. 55%/44%) shows as a dim mixed badge rather than looking identical to a decisively one-sided cycle.

### Danger Zone

**Export** downloads one combined `.json` file with everything the plugin tracks — structure wave (events/closes/wave trajectory), scorecard records, liquidation cycle history, and OC cycle history. **Import** restores all of it from a previously exported file in one step; any field missing from the file is left untouched. **Clear Plugin State** removes all profile data and halt state from localStorage and memory. Use before uninstalling the plugin to avoid orphaned data, or to guarantee a fully clean slate. Irreversible.

**Automatic storage pruning**: structure wave, liquidation samples, OC samples, and the shared scorecard are each capped independently at 200KB. If one alone grows past that on a save, its own oldest records are dropped until it's back under budget — other data types aren't touched. This is deliberately per-data-type rather than one shared budget, so a spike in one (e.g. a burst of liquidation activity) can't force pruning of unrelated history (e.g. structure wave) that's still well within its own budget. The Stats menu's Storage usage dropdown shows each of these individually, so a bloated data type is easy to spot before it hits the cap.

The market cap cache (CoinGecko/CoinPaprika) and the cross-bot shared registry are also capped, at 200KB each — the market cap cache by trimming its entry count to fit, the shared registry by dropping its oldest per-symbol entries across all its internal caches (klines, market cap, watch tickers, liquidation results, ...) until back under budget, same as the history types above.

---

## Randomized Outcomes

Multiple instances of the bot running simultaneously will naturally diverge in behavior:

- Scan timing drifts independently per tab, so two instances launched minutes apart will hit different market states even with identical config.
- Several data inputs are drawn randomly each cycle: the sample of tickers used to compute market breadth (red/green candle tally), the batch of tickers watched for live liquidation flow, and the kline lookups used for spike criteria all pull from different random subsets each time.
- Market cap data varies by fetch timing as the CoinGecko → CoinPaprika → DexScreener waterfall resolves at different points.

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
