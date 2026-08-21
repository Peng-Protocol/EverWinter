# Psycho Handbook

A plain-language guide to every menu, button, and setting in PsychoWinter — what it does, and why you'd reach for it.

---

## 1. The Layout

On a phone or narrow window, you get four tabs at the top: **⚙ CONFIG**, **📍 POS**, **📊 TRADES**, **📋 LOG**. Tap one to switch. Only one is visible at a time.

On a desktop-sized window, the tabs disappear and three buttons show up in the top-right corner instead: **⚙ CONFIG**, **📊 TRADES**, **📋 LOG**. These control two side panels that flank a permanent center column — **📍 Open Positions** always sits in the middle and never moves.

Here's how the side panels work: the first panel you open takes the left slot, the second takes the right slot. Open a third, and it bumps whichever panel is in the left slot; open a fourth, and it bumps the right one. The pattern repeats — left, right, left, right — forever. Click an already-open panel's button again and it closes, handing its space back to the center column.

By default, Config sits on the left and Log sits on the right, with Trades tucked away until you ask for it.

---

## 2. Top Bar

- **PSYCHO / LIVE pill** — shows which mode you're in. Grey "PSYCHO" means pseudo (paper) trading; red "LIVE" means real orders are going out.
- **Balance** — live mode only. Your Bybit wallet balance (realized, no floating uPnL folded in). Not polled continuously — refreshed at the start of each scan cycle and after every position close, so it stays reasonably current without adding an extra call to the fast position-watch loop.
- **ON / INACTIVE pill** — whether the scan loop is currently running.
- **SYNC** — only appears if your browser has muted the background audio keepalive. Tap it to resume.

---

## 3. Config Menu

The config menu is where every dial and switch lives, organized into collapsible sections. Tap a section header to expand it.

### Config Lock

Every setting is **locked by default** when you open the app — this is intentional, so a stray tap doesn't change something mid-session. Look for the lock button at the bottom of the config list: **🔒 CONFIG LOCKED** / **🔓 CONFIG UNLOCKED**. Tap it to toggle. Once the scan is running, the lock is forced on automatically and can't be opened until you stop the scan.

### Mode

| Setting | What it does |
|---|---|
| Live Trading | Off = pseudo mode, phantom capital, no API key needed. On = real orders placed on Bybit — requires an API key and secret. |
| API Key / Secret | Your Bybit credentials. Only needed for live mode. |
| Testnet | Routes live orders to Bybit's testnet instead of the real exchange. |

### Sizing

| Setting | What it does |
|---|---|
| Leverage | Leverage applied to every position. |
| Base Notional | The size of the very first entry on a new position. Every DCA add scales up from this. |
| Max Positions | The ceiling on how many positions can be open at once. Scanning pauses automatically when you hit it. |

The **DCA Ladder** table underneath shows exactly what each stage will cost at your current settings — trigger price, notional, margin, and running total — before you commit to anything.

### Psycho Scan

This is the entry logic: what the bot looks for and how often it looks.

| Setting | What it does |
|---|---|
| Change Threshold | How big a 24h price swing (up or down) a ticker needs before it qualifies as a candidate. |
| Per Cycle | How many qualifying tickers get randomly picked each scan. |
| Scan Interval | How often a new scan cycle runs. |
| Re-entry Cooldown | How long a symbol stays off-limits after one of its positions closes. |
| Ticker Cache | Reuses the last full market fetch instead of re-pulling everything every cycle — safe to leave on since the change threshold doesn't need fresh-to-the-second data. |
| REST Polling | Fetches position prices over REST instead of the live price feed. Useful as a fallback if prices look wrong. |

### DCA

Governs what happens when a position moves against you.

| Setting | What it does |
|---|---|
| Stages | How many DCA adds are queued beyond the initial entry. |
| Multiplier | How much bigger each successive add is than the one before it. |
| Anti-Martingale (AMa) | An alternate laddering mode — flat-sized adds as price falls, no take-profit until the final AMa stage. If the price reverses and a normal DCA add fires instead, AMa cancels and the position falls back to a regular take-profit. In live mode, every AMa stage is placed as a resting order on the exchange the moment the position opens, rather than one at a time — the whole ladder is meant to keep working even if the app is closed, since any stage can be the one that fires next. |
| AMa Orders | How many AMa stages to build. A plain numeric field (default 7) — with DAMa off, this is just the fixed order count for every new position. With DAMa on, it becomes the cap DAMa's score scales up toward, so a hot streak can't pile up an unreasonable number of resting exchange orders. |
| Dynamic Anti-Martingale (DAMa) | A sub-toggle under AMa. Instead of always building the full ladder, the order count for a new position tracks a running streak score: +1 per profitable close, −1 per loss, floored at 1. The score is global across the whole bot instance (not per-symbol), and only ever decides the count at the moment a position opens — positions already running are never resized. If nothing closes for a configurable idle window (default 6h), the score resets to 1. |

In live mode, DCA and AMa adds rest on Bybit as real conditional (trigger)
orders rather than being watched for locally — the exchange enforces the
add and fires it even if this tab is closed or your connection drops. The
CONDITIONALS panel (see the Log Menu section) still shows the same
information either way.

**Operational Balance Cap** — an optional ceiling on DCA escalation, **on by
default** ($500). The DCA ladder normally grows exponentially (each stage some
multiple of the last), which can run unbounded if price keeps moving
against you. With this on, every DCA stage is checked against your total
allocated margin minus collective floating uPnL before it's placed — if
the full-size stage would push that figure above your set balance, the
add is shrunk down to land just under it instead (1% under, by default).
If even a shrunk add would fall below the exchange's minimum order size,
that stage is skipped entirely and retried periodically — it doesn't
place a dust order. This only mediates DCA adds; AMa and Second Wind
ladders aren't affected by this cap.
- *Operational Balance* — the ceiling, in dollars. Toggle off to disable
  and let DCA escalate unbounded instead.
- *Buffer* — how far under the ceiling a shrunk add targets, as a percent.

Tooltip wording throughout this section is bot-specific: Chaser's copy describes long-side mechanics (adds trigger below entry, AMa scales into price rises), Winter's describes the short-side mirror — cleaned up after some leftover short-biased phrasing survived Chaser's initial port.

### Take Profit

| Setting | What it does |
|---|---|
| Entry TP ROI | The return-on-margin target for the take-profit order, before any DCA adds happen. |
| Whiplash Proximity | Pseudo-mode only. When price gets this close to target, a delayed check runs to make sure a fast move didn't tag the target without the app noticing. |

The **TP Schedule** table shows the target ROI and price-move percentage for every stage.

### Risk

This is the largest section — it holds the safety nets that manage a book once positions start losing.

**Force Close** — a hard time limit. Any position still open past this many hours gets closed regardless of anything else. Usually the Laggard mechanism fires first.

**Laggard Check** — designates one open position at a time as "the laggard": the one responsible for absorbing the book's collective drawdown. It closes once its own numbers clear.
- *Age Mode* — picks the laggard by which position is oldest, instead of which has DCA'd the most.
- *Profit Offset* — how patient the laggard's exit target is. Positive numbers widen it, negative numbers make it trigger-happy.
- *Laggard Absorption* — if the laggard's numbers hit zero but it's still net negative, this bleeds the position down gradually instead of force-closing it outright, buying time for a reversal. The laggard is picked and checked every 5s alongside the rest of the position watch loop, but a cut only fires once every 5 minutes, each one trimming 5% of the laggard's remaining size until it's fully drained. 

**Cascade Trigger** — when the whole book's floating profit crosses a threshold, this locks some of it in by closing a couple of winning positions, seeding a payback chain toward the laggard.
- *Cascade Trigger Threshold* — how large that collective profit needs to be, expressed as a multiple of entry margin. This same number also governs Position Cascade Trigger below — one dial, two triggers.

**Position Cascade Trigger** — the individual-position version: any single position that's lost more than the threshold amount forces a profit-take from winners to help offset it. Each time it fires without fully catching up, it escalates — closing more positions than the last time — via the *PPC Escalation Multiplier*.

**Cascade Close Min ROI** — the profit floor a position must clear before either cascade mechanism is allowed to use it as a target.

**Loss Absorption** — trims the worst-losing position at market at a regular interval, which shortens every time it fires (and resets if the position recovers). Paused while a DCA add is in flight, since that add might fix the problem on its own.
- *Absorption Trigger Threshold* — how deep a loss needs to be (as a multiple of base margin) to count as "deep enough" to trim. Numeric input field (0.05× steps, max 10×).
- *Outlier Acceleration* — if a position's margin or loss stands out from the rest of the book, absorption locks to its fastest interval and defers any cut too large to digest cleanly in one go.
- *Outlier Threshold* — how far a position has to stand out from the average of everything else to count as an outlier.
- *Outlier Deceleration* — nudges an outlier's margin up gradually each cycle, sizing it toward the book average. In live mode, this places a real market order and updates average entry from the exchange-confirmed fill (price and quantity), the same way DCA and AMa adds do — not from a pre-order price estimate. Each add still gets a short settling window afterward before another one is considered on the same position, since the exchange needs a moment to catch up before the next margin check.
- *Exhumation* — a position that's had losses absorbed off it gets a personalized recovery target instead of its original take-profit, so it isn't forced to reach the original ROI to close in the green.
- *Second Wind* — if the final DCA stage fills but absorption has already shrunk the position below where it "should" be at that stage, the stop-loss is delayed and the stage count is recalibrated so new adds can still queue from the current price.
- *Accelerated Absorption* — speeds up the absorption interval progressively through the first few DCA stages, then resets and re-accelerates after a Second Wind event.

**Sacrifice** — when too much of your total capital is tied up, this closes the single best eligible position each cycle until margin usage cools back down.
- *Sacrifice Trigger Threshold* — the allocation ceiling, expressed as a multiple of one slot's margin times your max positions. Numeric input field (0.25× steps, max 100×).
- *Position Floor* — Sacrifice won't close positions if doing so would drop you below this many open at once.
- *Retraction* — a second, independent tripwire: if the book's combined floating loss crosses a threshold, Sacrifice fires regardless of how much margin is actually in use.
- *Retraction Threshold* — how deep that combined loss needs to be, as a multiple of base margin.

### Bot Controls

- **START SCAN / STOP SCAN** — starts or stops the scanning loop. Disabled for live mode until an API key and secret are entered.
- **SCAN NOW** — forces an immediate scan cycle without waiting for the interval. Only available while the bot is running.

---

## 4. Positions Menu (center, always visible)

Each open position gets a card. The header row shows the ticker and any status badges: **SHORT** (direction), **DCAx** (current stage), **FORCE** (past its deadline, closing), **EXHUMED** (recovering from absorbed losses), **2ND WIND** (recalibrated final stage), **LAGGARD** (currently the book's designated absorber).

Inside the card:
- **Entry / Mark** — current mark price, and the entry price — which, once a position has DCA'd at least once, alternates every 5 seconds between **Avg Entry** (the current averaged entry across all filled stages) and **Orig Entry** (the very first fill, before any adds). Before any DCA fires it's just a plain **Entry**, no cycling.
- **uPnL / ROI** — unrealized profit or loss, in dollars and as a percentage of margin.
- **TP / SL row** — shows whichever exit target currently governs the position: normal TP, an exhumed recovery target (**EH TP**), a laggard-adjusted target (**EDa TP** — only appears when Laggard Absorption is disabled; see the Laggard Absorption entry above), or a live stop-loss (**SL**, which blinks once every stage has filled).
- **Margin** — capital committed to this position.
- **Funding row** — cycles through three states every five seconds: the funding fee paid or received so far, a live countdown to the position's next funding round (pulled straight from the exchange for that specific ticker, so it's accurate to whatever interval that symbol actually runs on), and the current funding rate itself — colored green when it's presently working in your favor (positive, since shorts collect on positive funding) and red when it's costing you.
- **Age** — how long the position has been open.
- **Stage boxes** — a small grid showing every DCA (or AMa) stage and whether it's triggered, currently active, queued, or missed. The AMa row stretches or shrinks its column count to fit however many orders that particular position has — a single-order DAMa position shows one pill filling each row, while a long streak compresses into more, narrower pills instead of overflowing. This count is fixed at the moment the position opened and won't change even if DAMa's score moves afterward (see the DAMa entry above).
- **Progress bar** — visual read on how close price is to the next stage boundary.
- Below the card: a DCA-retry countdown (if one is pending) and a running countdown to this position's forced close deadline.

The header above the cards gives you:
- A **PnL / DCA / Mgn** sort toggle to reorder the list.
- The current open count against your max.
- Collective **uPnL**, total **allocated** margin, and — while running — a countdown to the next scan.
- A ticker search box with an **ISOLATE** button to filter the list down to one symbol.

---

## 5. Trades Menu

A running history of closed trades, most recent first — with one exception: a loss-absorption card stays pinned to the top for as long as its underlying position is still open, since that card keeps updating as new cuts land and shouldn't get buried under unrelated closes on other positions. Once that position actually closes, its card drops back into normal chronological order with everything else. Trades from the same batch event get grouped into rollup cards (Period Rollup, Force Rollup, Cascade, Swap, Funding, etc.) showing net PnL, win count, average duration, and best/worst performers for that batch, rather than flooding the list with dozens of individual lines. A **CLEAR** button wipes the closed-trade history for the session.

In live mode, the headline PnL on a closed-trade card is Bybit's own reported
figure for that close, not a locally calculated estimate. The Funding line
underneath is still the app's own running estimate of funding paid/received
over the position's life — shown separately, not added into the headline
number, since the two are tracked independently and aren't meant to be
reconciled against each other.

---

## 6. Log Menu

This is the analytical sidebar — a stack of live-updating panels, followed by the activity log itself.

- **CONDITIONALS** — every position with a pending DCA order: what it's set at, what's queued behind it, and when the next one places.
- **EXHUMED** — positions currently running on a recovery target instead of their original take-profit, with how much they've absorbed and how far they are from clearing it.
- **SESSION** — trade count, wins, losses, net PnL, win rate, force closes, and cascade count for the current session — plus peak and current allocation: your utilized margin adjusted for floating uPnL (a loss deepens it, a profit trims it). Peak tracks the all-time high; current shows where you sit right now. Watch peak allocation for new highs as a read on whether the bot is ever concurrently over-committing.
- **LAGGARD** — the position currently designated to absorb the book's debt, its target, and how close it is to clearing.
- **OPEN NOW** — your best and worst position by uPnL, and whichever position has DCA'd the furthest.
- **DCA SPREAD** — the expanded view lists every open position with its current stage and next trigger price (plus how many more are queued behind it), not just a stage-count summary. It can only ever show the next trigger, since later stages aren't fixed numbers — they're computed on the fly as each prior stage fills. That's also why this looks similar to CONDITIONALS above at a glance but tracks distinct data: CONDITIONALS only lists positions with something pending right now (live or queued) and includes placement timing, while DCA SPREAD covers every open position for a full stage-distribution view.
- **ACTIVITY LOG** — the full scrolling event log: every open, close, DCA fire, absorption cut, funding settlement, and warning, timestamped.

### Danger Zone

Sits above the Activity Log so it's never scrolled out of view when opened.

- **Export ▾** — three separate downloads:
  - *Config* — just your settings, for backing up or transferring a setup.
  - *Positions* — open positions, closed-trade history, session stats, and the peak-allocation record.
  - *Activity Log* — the full event log as a plain-text file.
- **Import State** — loads a previously exported Config or Positions file back in.
- **Clear Stats** — wipes session stats and trade history. Peak Allocation is left untouched, since it's meant to be a durable record.
- **CLEAR ALL** — a full wipe: positions, trades, stats, logs, and the peak-allocation record. Cannot be undone.
- **BAIL ALL POSITIONS** — closes every open position immediately at current mark price, for profit or loss. Only appears when you have positions open.

---

## 7. A Note on Modes

Pseudo and Live are tracked completely separately — separate positions, trade history, session stats, and peak-allocation record. Flipping the Live Trading toggle saves whichever mode you're leaving and loads the other's saved state.

---

## 8. Known Quirks & Safeguards

A few behaviours worth understanding, since they're easy to mistake for bugs.

### Opening into an about-to-trip Sacrifice threshold

**The quirk:** Sacrifice only re-evaluates on its own schedule. A single scan cycle can open several new positions back-to-back before that next evaluation happens. If your allocation was sitting just under the Sacrifice threshold when the cycle started, those new opens can push it over — and moments later, Sacrifice closes one of the very positions that just opened (or another eligible one), for no return, plus fees both ways.

**The safeguard:** before opening a new position, the app now estimates what total allocation would look like *after* that position lands, and compares it to the Sacrifice threshold. If opening would tip the book over, that open is skipped and logged instead of happening — and the rest of that scan cycle's queued opens are skipped too, since every position uses the same base margin, so if one open would trip it, every remaining one would as well.

This only covers Sacrifice, deliberately. Cascade and Retraction both key off floating profit or loss, not margin — a freshly opened position starts at roughly zero uPnL, so it doesn't meaningfully move either of those needles the way it does allocation.

### The digestibility cap isn't user-configurable

Loss Absorption won't crystallize a loss bigger than roughly 2.5× base notional in a single cut — it defers oversized cuts rather than take them all at once. Unlike the trigger thresholds, this ceiling is a fixed internal safety clamp, not exposed as a setting.

### Sacrifice and Position Floor can disagree with a hot book

If your allocation is over threshold but you're also sitting at or below your configured Position Floor, Sacrifice won't close anything — it'll stay "active" (blocking new scans) without actually trimming. This is intentional: the floor exists to stop Sacrifice from closing you down to nothing, but it does mean a book can sit allocation-capped and stuck until a position closes on its own (take-profit, stop-loss, or a manual bail).

### Funding countdown accuracy depends on the exchange, not the app

The funding countdown shown on each position card is only as fresh as the last time that symbol's funding time was fetched from the exchange. It's seeded once when a position opens and only re-synced after that round actually settles — so if a symbol's funding schedule changed mid-position (rare, but exchanges do this occasionally), the countdown won't reflect that until the next settlement.

### A "margin mismatch" warning in the log isn't necessarily a bug

Live mode periodically compares what Bybit actually holds for each open
position against what the app's own bookkeeping expects, and logs a
warning if they drift apart by more than a few percent. This is a
detection mechanism, not an auto-corrector — nothing gets changed
automatically when it fires. Most of the time this means a fill landed at
a slightly different size or price than assumed and is worth a look; it's
not itself an indication that anything urgent went wrong. It deliberately
skips checking a position for a few seconds right after Outlier
Deceleration adds to it, since the exchange needs a moment to catch up
and would otherwise be flagged as "drifted" when it's actually just lagging.

### Absorbed Loss' impact on net PnL

An open loss-absorption card pins to the top of the trades menu and keeps updating as it absorbs, rather than sinking down among unrelated closes — but it still isn't done until the underlying position actually closes. Absorbed loss is added to net PnL as soon as it's absorbed, so read a card's full history rather than judging performance off a single cut.

### Nuances of Laggard Absorption

**Important divergence from Exhumation:** with Laggard Absorption on (the default), the laggard's exit target stays the normal TP — its ED number only decides whether a cut or a force-close fires, it never retargets the exit. The EDa TP (a widened, laggard-specific exit target, shown as **EDa TP** in the TP/SL row) only comes into play if Laggard Absorption is turned off, letting the laggard force-close against a more patient target instead of cutting into it. Exhumation's recovery target (EH TP), by contrast, always applies once losses have been absorbed off a position, with no such toggle.
  - *Why it's merged rather than a separate toggle:* this reflects a bulk-churn, cascade-oriented style of running the book — often the goal is a handful of wins across a sea of open positions to seed a cascade, and in that mode a laggard holding the book back on a widened target works against the strategy. Rather than add a second dial, EDa TP retargeting was folded into the same toggle as absorption: absorption on favors bulk churn (cut the laggard down, keep cascading), absorption off favors patience (park the laggard on a wider target and let it ride).
  - *In live mode*, when Laggard Absorption is off and EDa TP is active, it isn't a local-only number — `liveReconcileTp` mirrors it to the exchange every tick via Bybit's native take-profit (`/v5/position/trading-stop`), the same path used for normal TP, Exhumation's EH TP, and AMa's final-stage TP. So the laggard's real resting TP order on the exchange moves with it, matching what you'd see in simulation.

### DAMa's score isn't the same thing as a position's order count

Once DAMa is on, the score shown in Config is a *live, constantly moving* number — it changes on every close, anywhere in the book. A specific open position's actual AMa order count, on the other hand, was locked in the instant that position opened and never changes again, even if the score moves wildly afterward. So it's normal (and not a bug) to see the Config panel's "next open uses N orders" figure disagree with the pill count on a position that's been open a while — the position is showing what the score *was* when it opened, not what it is now.

This also means a position opened right at a high streak keeps its larger order count even if the streak immediately resets to 1 afterward (idle timeout, a loss, etc.) — and conversely, a position opened at the score's floor of 1 stays a single-order AMa position for its whole life, even if the book goes on a long winning streak right after.

### An AMa position's TP shows a projected price with no percent

While an AMa position is mid-ladder (any stage before the last one fills), there's genuinely no active TP yet — that's intentional, not a bug. It shows the final AMa stage's precomputed target price with **(n/a)** in place of a percent. The price is a real number (computed from the entry price the moment the position opened), but the percent depends on the ladder actually completing — if a DCA add fires first, AMa cancels and a normal TP takes over instead, so the projection shown at stage 0 is a target, not a settled figure.

### DAMa's idle-reset check is lazy, not a timer

The 6-hour (configurable) reset isn't a background countdown — it's checked once per tick and once whenever a position opens. In practice this means the reset fires within a few seconds of the window elapsing during normal operation, but if the scan loop itself is stopped (not just idle — actually stopped), the check doesn't run at all until you start it again, so the score can sit stale past the configured window while the bot isn't running.