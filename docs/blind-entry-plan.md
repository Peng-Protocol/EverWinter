# Blind-Entry — Design Plan (draft, not implemented)

## Purpose

A control group. MultiIndicator's entry gate (criteria slots, scorecard, auto-pruning) is the
thing under test — the open question is whether it actually adds expectancy over the exit
machinery alone, or whether the exit machinery (Cascade, Sacrifice, halving, share cap) is doing
all the real work and the entry filtering is just noise dressed up as signal.

Blind-Entry answers that by removing every proactive element and keeping everything else as
close to identical as possible: same host bot, same exit/management tools, same account, same
market conditions, running side by side with MultiIndicator. If Blind-Entry matches or beats
MultiIndicator's expectancy over enough trades, the criteria system isn't earning its keep. If
MultiIndicator meaningfully outperforms it, that's real evidence the entry gate has value.

This is the "ultimate control group" the user asked for — not a new trading strategy competing
to be profitable on its own merits, but an instrument for measuring whether the existing one is.

## Core principle: zero proactive contamination

The only thing gating entry is `|24h change| ≥ threshold` (default 6%, configurable, both
directions pooled — same shape as Psycho Mode's filter). No RSI, no funding rate, no volume
ratio, no candle pattern, no liquidation data, no order-flow data may influence *which ticker
gets picked*. The moment any of that leaks into entry selection, the control group is
compromised and the whole comparison becomes meaningless.

Risk/exit-side use of that data is fine — Cascade, Sacrifice, and the fade-style triggers are
reactions to a position's *own* behavior or the book's aggregate state, not a filter on which
candidates get in. That distinction is what keeps this an entry-gate experiment rather than a
worse version of MultiIndicator.

## Entry logic

- Filter: `|price24hPcnt| ≥ beChangePct` (default 6, matches Psycho Mode's `psychoChangePct`
  default).
- Direction of the position is fixed by the host bot (Chaser → long via `pseudoOpenLong`,
  Winter → short via `pseudoOpenShort`), same as MultiIndicator. The 24h move can be up or down
  in either case — there is no "only chase confirmed momentum" logic, because adding that would
  itself be a proactive filter.
- Pool selection within a scan cycle: random shuffle (Fisher-Yates), same as Psycho Mode — no
  ranking, because ranking requires a score, and a score is exactly what this plugin must not
  have.
- Respects `openSymbols`, symbol banlist, and re-entry cooldown the same way every other
  strategy here does — those are account-hygiene guards, not signal.

**Open question**: does the threshold apply once per scan cycle only (skip a candidate that's
already open elsewhere), or does it also need its own per-symbol cooldown after a close, the way
Psycho Mode's `reentryCooldownHrs` works? Recommend mirroring Psycho Mode's cooldown for
consistency, but this needs confirmation.

## Position management — what ports over

MultiIndicator's Cascade/Sacrifice/Substitution machinery operates on `p._mic`-tagged positions
specifically, using a private per-strategy accounting of total unrealized PnL, oldest-open-time,
and (for Substitution) a composite score. Blind-Entry would mirror this pattern exactly, scoped
to its own tag (`p._blindEntry` or similar) so it never touches or interferes with MultiIndicator's
book when both are loaded.

**Verified, ports over directly (mechanics confirmed in MultiIndicator-Chaser.html):**

| Tool | What it does | Config it needs |
|---|---|---|
| **Cascade** | When total unrealized PnL across this strategy's open positions crosses +X% of base margin, close all of them at once. | threshold %, on/off |
| **Sacrifice** | Mirror trigger: total unrealized PnL crosses −X% of base margin closes either the whole book or (rolling variant) just the oldest position. | threshold %, rolling on/off |
| **Halving multiplier** | Cascade/Sacrifice thresholds shrink exponentially based on how long the oldest open position (for this strategy) has been held — half-life is configurable, default 30 min. Forces a stale book toward a decision instead of sitting flat indefinitely. | half-life hours, on/off |
| **Share Cap** | Caps this strategy to at most X% of `maxPos`, so it doesn't monopolize the shared position pool when other strategies are also loaded. | cap %, on/off |

**Needs a redesigned rule, not a direct port:**

- **Substitution** — MultiIndicator's version compares a new candidate's composite score against
  the weakest held position's composite score. Blind-Entry has no score to compare with. A
  like-for-like version would need a different "who's weakest" rule — candidates: oldest
  position, or most-underwater position by unrealized PnL. This changes what's being tested
  (age/PnL-based book rotation instead of score-based), so it should be an explicit yes/no
  decision, not something ported by default. **Recommendation: leave it out of v1.** Its whole
  point in MultiIndicator is "is this new candidate's case demonstrably better," and Blind-Entry
  has no case to make — a candidate is a candidate. Adding an age/PnL swap rule would introduce a
  second, different management lever into the control group, muddying the comparison. Can be
  revisited later as a separate question ("does book rotation help, independent of entry
  quality") if the base comparison turns out interesting.

**Not verified — do not assume, check at implementation time:** a few other MIC config keys
referencing "fade" mechanisms (funding-based, liquidation-based) turned up in earlier config
exports but no longer resolve to any live code in MultiIndicator-Chaser.html as of this session —
either dead/legacy config or moved elsewhere. Don't port anything under those names without
re-verifying it actually exists and does what the name implies.

## Coexistence with MultiIndicator

- Blind-Entry must run whether or not MultiIndicator is installed. All cross-references to
  MultiIndicator/Ashfall/Permafrost state must use the existing optional-chaining defensive
  pattern (`this._micXxx?.()`) already used throughout this codebase — never a hard dependency.
- When both are loaded on the same bot: separate position tags (`p._mic` vs `p._blindEntry`),
  separate Share Cap accounting, separate Cascade/Sacrifice bookkeeping. Neither should be able
  to see or touch the other's positions. This should fall out naturally from copying the
  `p._mic`-filtered pattern MultiIndicator already uses everywhere, as long as every loop that
  currently filters on `p._mic` gets mirrored with `p._blindEntry` rather than reused.
- Plugin transform chaining (`_origScan`, `_origInit`, etc.) already supports multiple strategy
  plugins stacking on the same host — Blind-Entry should follow the same wrap-and-call-through
  pattern MultiIndicator uses, not a new mechanism.

## AF/PF integration — what's actually independent of MultiIndicator

Checked against the live code rather than assumed. The dividing line is not as clean as
"scorecard + score line vs. everything else":

**Genuinely independent** (triggered from Ashfall/Permafrost's own `runScan`/interval, no
MultiIndicator involvement): Structure/FIO wave, Volume History chart, Liquidation Surveillance.
These keep working unchanged regardless of which strategy plugin(s) are loaded.

**Currently coupled to MultiIndicator, contrary to how it might look at a glance:**
- **OC Surveillance** — the fetch function lives in Ashfall/Permafrost, but MultiIndicator
  decides which symbols to sample and makes the call, using its own scan's candidate pool. With
  only BEC/BEW loaded, OC data goes silent unless BEC/BEW also drives that call itself (using its
  own candidate pool from the same `|24h change| ≥ threshold` filter it already computes for
  entry — this is a reasonable ask since Blind-Entry already knows those symbols, just needs to
  make the same call MultiIndicator does).
- **Funding Rate Sample / Volume Sample / OI-MC History bars** — populated by MultiIndicator's
  own sampling pass (`_micFundSkew`/`_micVolSkew`/`_micOiSkew`), not computed independently by
  AF/PF. Same story: needs BEC/BEW to populate the same fields, or these three bars go blank
  under Blind-Entry-only.

This means "does BEC/BEW replace MultiIndicator cleanly" isn't just a scorecard/score-line
question — OC Surveillance and the three sampling bars need the same treatment, or they silently
stop working the moment MultiIndicator is removed from the stack. Worth deciding whether BEC/BEW
takes over driving these (duplicating a small amount of MIC's sampling logic) or whether this is
the moment to refactor those four things to compute directly off `_lastAllTickers` inside AF/PF
itself, independent of any strategy plugin — which would actually be the more correct fix, since
none of the four conceptually need a strategy plugin's involvement at all.

## Score line v2 — a Blind-Entry PnL line, and a two-database Score tab

The current Score line (`afShowScore`/`pfShowScore`) is built from MultiIndicator's
`micCollapsedSlotRanks` — many collapsed criterion slots, each with its own running score, summed
per candidate. Blind-Entry has no criteria to break down by, so its equivalent isn't a scorecard
in the same sense — it's a single running tally: net/cumulative realized PnL across its own
closed trades, one line, no per-slot breakdown. Structurally simpler, and it should be treated as
a **separate, second data store**, not squeezed into the existing scorecard shape.

- **Minimum sample size**: per the user, this line isn't meaningful below 3 closed trades — show
  a "gathering data" placeholder before that, the same pattern already used for the wave/volume
  charts before they have enough points to plot.
- **Two independent databases**: MultiIndicator's scorecard (`micCollapsedSlotRanks` /
  `__everwinter_scorecard_v1`) and a new, much smaller Blind-Entry PnL store persist side by
  side, completely independently. Neither reads or depends on the other.
- **Presence-driven UI**: when only one of MultiIndicator or Blind-Entry is loaded, the Score tab
  shows only that one's toggles/scorecard/score-line — no dead controls for a system that isn't
  installed.
- **Precedence toggle when both are loaded**: a single toggle in the Score tab picks which
  scorecard + score line is the one actually displayed/plotted, since showing both at once on the
  same wave chart would be visual noise, not a meaningful overlay. This does *not* mean one
  database stops recording — both keep tracking in the background regardless of which one is
  currently displayed; the toggle only controls what's rendered.
- **How presence gets detected**: rather than AF/PF special-casing "does `micCollapsedSlotRanks`
  exist" vs "does the Blind-Entry store exist," the cleaner fit with this codebase's existing
  conventions (`registerRoleBadge`, `registerCloseReason`) is a new registration hook — each
  strategy plugin calls something like `this.registerScoreSource?.({ id, label, getScorecard,
  getScoreAt })` in its own `init()`. AF/PF then just asks "what score sources are registered"
  instead of hardcoding which plugins might exist. This scales cleanly if a third strategy plugin
  shows up later needing the same treatment.

## Data tagging for comparison

The entire point of this plugin is to be comparable against MultiIndicator's real numbers. Since
both would share the same `positions`/`closedTrades` arrays on the same bot instance:

- Every Blind-Entry position gets `pos._blindEntry = true`, mirroring `pos._mic`.
- Register a role badge (`registerRoleBadge`) so positions/closed trades are visually
  distinguishable in the Trades menu, same mechanism MultiIndicator already uses for its 'Multi'
  badge.
- Close reasons reuse the existing strings (`'cascade'`, `'sacrifice'`) rather than inventing
  new ones — they already have registered labels via `registerCloseReason()`
  (Ashfall/Permafrost-Winter session work), and reusing them keeps the Trades menu badges
  consistent instead of doubling the label count.
- **Stretch goal, not required for v1**: a simple "MIC vs Blind-Entry" split somewhere in the
  Stats menu, similar in spirit to the existing Combined/Own scorecard toggle, so the comparison
  doesn't require manually filtering exported trade data by hand. Worth doing once there's
  enough trade volume to make the comparison meaningful — premature before that.

## Config namespace and files

Proposed prefixes: `bec` (Blind-Entry Chaser), `bew` (Blind-Entry Winter) — matches the existing
short-prefix convention (`mic`/`miw`, `af`/`pf`) without colliding with anything in use.

Proposed files, following the existing plugin-pair convention:
- `plugins/strategies/BlindEntry-Chaser.html`
- `plugins/strategies/BlindEntry-Winter.html`

Proposed config keys (illustrative, not final):

| Key | Default | Purpose |
|---|---|---|
| `becEnabled` | `false` | master toggle |
| `becChangePct` | `6` | entry threshold, matches Psycho Mode's default |
| `becPerCycle` | — | candidates opened per scan cycle, needs a sane default (Psycho Mode uses 12) |
| `becReentryCooldownHrs` | — | see open question above |
| `becCascadeEnabled` / `becCascadePct` | `true` / `25` | mirrors `micCascadeEnabled`/`micCascadePct` |
| `becSacrificeEnabled` / `becSacrificePct` / `becRollingSacrificeEnabled` | `true` / `25` / `true` | mirrors MIC |
| `becHalvingEnabled` / `becHalvingHours` | `true` / `0.5` | mirrors MIC |
| `becShareCapEnabled` / `becShareCapPct` | `true` / `100` | mirrors MIC |

(Winter mirrors with `bew` prefix.)

## Explicitly out of scope for v1

- Substitution (see above — needs a separate decision).
- Any DCA-escalation exit style — Blind-Entry inherits whatever Binary/DCA mode the host bot is
  already configured with, same as MultiIndicator does today. It is not a Psycho-Mode port; it's
  a MultiIndicator-shaped strategy with the entry gate removed.
- Position management (Cascade/Sacrifice/Share Cap) stays tag-scoped, not presence-detected —
  MultiIndicator and Blind-Entry each manage only their own tagged positions regardless of what
  else is loaded. Presence detection is only for the AF/PF Score tab UI (see above), not for how
  positions get managed.
- The `_micFundSkew`/`_micVolSkew`/`_micOiSkew`/OC Surveillance refactor (compute directly in
  AF/PF instead of depending on MultiIndicator) — flagged as the more correct fix above, but it's
  a separate piece of work from Blind-Entry itself and shouldn't block v1.

## Open questions for the user before implementation starts

1. Per-symbol re-entry cooldown after a close — mirror Psycho Mode's `reentryCooldownHrs`, or
   rely only on "already open" exclusion within a cycle?
2. Confirm Substitution stays out of v1 (recommended above), or should a simplified age/PnL-based
   version be designed instead?
3. Default `becPerCycle` (candidates opened per scan) and default `beShareCapPct` when
   MultiIndicator is also loaded, so the two don't fight over the same `maxPos` budget by
   accident on a shared install.
4. Confirm config prefix (`bec`/`bew`) and file names before anything gets built, since renaming
   after the fact means another migration shim.
5. Should BEC/BEW take over driving OC Surveillance and the three sampling bars when
   MultiIndicator isn't loaded (duplicating a bit of MIC's sampling logic), or is this the right
   moment to refactor those four to compute directly in AF/PF, independent of any strategy
   plugin? The latter is more correct long-term but is a bigger, separate change.
6. Confirm the `registerScoreSource`-style hook approach for presence detection in the Score tab,
   or if a simpler direct check (does the Blind-Entry PnL store have data) is preferred instead.
7. Precedence toggle UX: does switching it only change what's *displayed*, with both databases
   always recording in the background (as assumed above), or should it also pause/resume which
   one is actively tracked?
