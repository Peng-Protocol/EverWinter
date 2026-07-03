# Blind-Entry — Design Plan (draft, not implemented)

## Purpose

A control group. MultiIndicator's entry gate (criteria slots, scorecard, auto-pruning) is the
thing under test — the open question is whether it actually adds expectancy over the exit
machinery alone, or whether the exit machinery (Cascade, Sacrifice, halving, share cap) is doing
all the real work and the entry filtering is just noise dressed up as signal.

Blind-Entry answers that by removing every proactive element and keeping everything else as
close to identical as possible: same host bot, same exit/management tools, same market
conditions. If Blind-Entry matches or beats MultiIndicator's historical expectancy, the criteria
system isn't earning its keep. If MultiIndicator meaningfully outperforms it, that's real
evidence the entry gate has value.

This is the "ultimate control group" the user asked for — not a new trading strategy competing
to be profitable on its own merits, but an instrument for measuring whether the existing one is.

**Actual usage plan (confirmed)**: this is a swap, not a concurrent A/B on the same account —
MultiIndicator gets removed and Blind-Entry runs in its place. The comparison is against
MultiIndicator's past performance, not a live side-by-side book. This simplifies a lot of what
follows: AF/PF needs to work cleanly with MultiIndicator *absent*, not juggle both loaded at
once.

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

MultiIndicator's Cascade/Sacrifice machinery operates on `p._mic`-tagged positions specifically,
using a private per-strategy accounting of total unrealized PnL and oldest-open-time. Blind-Entry
mirrors this pattern exactly, scoped to its own tag (`p._blindEntry` or similar).

**Verified, ports over directly (mechanics confirmed in MultiIndicator-Chaser.html):**

| Tool | What it does | Config it needs |
|---|---|---|
| **Cascade** | When total unrealized PnL across this strategy's open positions crosses +X% of base margin, close all of them at once. | threshold %, on/off |
| **Sacrifice** | Mirror trigger: total unrealized PnL crosses −X% of base margin closes either the whole book or (rolling variant) just the oldest position. | threshold %, rolling on/off |
| **Halving multiplier** | Cascade/Sacrifice thresholds shrink exponentially based on how long the oldest open position (for this strategy) has been held — half-life is configurable, default 30 min. Forces a stale book toward a decision instead of sitting flat indefinitely. | half-life hours, on/off |
| **Share Cap** | Caps this strategy to at most X% of `maxPos` — kept even though Blind-Entry won't be sharing a book with MultiIndicator in practice, since it's cheap insurance if any other strategy plugin is ever loaded alongside it. | cap %, on/off |

**Substitution — confirmed out of scope, resolved.** Doesn't apply to Blind-Entry (no score to
rank candidates against) and isn't being adapted for it. Not revisited.

**Not verified — do not assume, check at implementation time:** a few other MIC config keys
referencing "fade" mechanisms (funding-based, liquidation-based) turned up in earlier config
exports but no longer resolve to any live code in MultiIndicator-Chaser.html as of this session —
either dead/legacy config or moved elsewhere. Don't port anything under those names without
re-verifying it actually exists and does what the name implies.

## Running without MultiIndicator

Blind-Entry must run whether or not MultiIndicator is installed, and the confirmed real usage is
specifically *without* it — MultiIndicator gets removed, Blind-Entry takes its place. All
cross-references to MultiIndicator/Ashfall/Permafrost state use the existing optional-chaining
defensive pattern (`this._micXxx?.()`) already used throughout this codebase — never a hard
dependency. Position tagging (`p._blindEntry`) and Share Cap accounting stay scoped the same way
MultiIndicator's are, mostly as cheap insurance in case a third strategy plugin is ever loaded
alongside it, not because concurrent MIC+BEC use is the actual plan.

## AF/PF restructuring around MultiIndicator's absence

Checked against the live code rather than assumed. The dividing line is not as clean as
"scorecard + score line vs. everything else":

**Genuinely independent** (triggered from Ashfall/Permafrost's own `runScan`/interval, no
MultiIndicator involvement): Structure/FIO wave, Volume History chart, Liquidation Surveillance.
These keep working unchanged with MultiIndicator removed — no action needed.

**Currently coupled to MultiIndicator, contrary to how it might look at a glance:**
- **OC Surveillance** — the fetch function lives in Ashfall/Permafrost, but MultiIndicator
  decides which symbols to sample and makes the call, using its own scan's candidate pool.
- **Funding Rate Sample / Volume Sample / OI-MC History bars** — populated by MultiIndicator's
  own sampling pass (`_micFundSkew`/`_micVolSkew`/`_micOiSkew`), not computed independently by
  AF/PF.
- **Scorecard panel and Score line** — built entirely from `micCollapsedSlotRanks`.

**Resolved**: none of these get duplicated into Blind-Entry or refactored to run standalone. When
MultiIndicator isn't loaded, all four are simply hidden — the OC Surveillance panel, the three
sampling bars, and the Scorecard panel disappear from the accordion entirely rather than showing
empty/broken placeholders. This is a UI visibility question, not a data-collection one: nothing
in Blind-Entry needs to reproduce what those panels do.

**Presence detection**: a single boolean flag is enough — no need for the more general
multi-source registry considered earlier, since the real scenario is exactly one of
"MultiIndicator present" or "absent," not several strategy plugins simultaneously feeding the
same panel. MultiIndicator's own `init()` sets `this._micLoaded = true` (mirrored `this._miwLoaded`
for Winter); every AF/PF panel in the coupled list above gates its `x-show` on that flag instead
of on `cfg.ashfallScorecardEnabled` alone. Simple, direct, no abstraction beyond what's needed.

## Score line v2 — a Blind-Entry PnL line takes the Score line's place

The current Score line (`afShowScore`/`pfShowScore`) is built from MultiIndicator's
`micCollapsedSlotRanks` — many collapsed criterion slots, each with its own running score, summed
per candidate. Blind-Entry has no criteria to break down by, so its equivalent isn't a scorecard
in the same sense — it's a single running tally: net/cumulative realized PnL across its own
closed trades, one line, no per-slot breakdown.

- When MultiIndicator is present (`_micLoaded`/`_miwLoaded`), the Score line and Scorecard panel
  behave exactly as they do today — unchanged.
- When it's absent and Blind-Entry is loaded instead, the Score line is driven by Blind-Entry's
  own PnL tally rather than staying hidden along with the Scorecard panel — this is the one
  MIC-coupled element that gets a real replacement instead of just disappearing, because the user
  specifically wants this comparison visible on the wave chart.
- **Minimum sample size**: per the user, this line isn't meaningful below 3 closed trades — show
  a "gathering data" placeholder before that, the same pattern already used for the wave/volume
  charts before they have enough points to plot.
- The two are separate, independent stores (MultiIndicator's existing scorecard vs. a new, much
  smaller Blind-Entry PnL history) — Blind-Entry's store doesn't need the collapsed-rank/tier
  machinery at all, just a rolling list of closed-trade PnL values with timestamps.

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

- Substitution — resolved, does not apply, not being built.
- Any DCA-escalation exit style — Blind-Entry inherits whatever Binary/DCA mode the host bot is
  already configured with, same as MultiIndicator does today. It is not a Psycho-Mode port; it's
  a MultiIndicator-shaped strategy with the entry gate removed.
- Duplicating OC Surveillance / sampling-bar logic into Blind-Entry, or refactoring those four to
  run independent of any strategy plugin — resolved as "hide when MultiIndicator is absent"
  instead (see above). Worth revisiting as a separate cleanup later, not part of this plan.

## Open questions for the user before implementation starts

1. Per-symbol re-entry cooldown after a close — mirror Psycho Mode's `reentryCooldownHrs`, or
   rely only on "already open" exclusion within a cycle?
2. Default `becPerCycle` (candidates opened per scan cycle) — Psycho Mode uses 12; confirm or
   adjust.
3. Confirm config prefix (`bec`/`bew`) and file names before anything gets built, since renaming
   after the fact means another migration shim.
