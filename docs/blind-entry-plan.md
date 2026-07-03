# Blind-Entry — Design Plan (implemented — see plugins/strategies/BlindEntry-Chaser.html / BlindEntry-Winter.html)

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

Resolved sequence, per cycle:

1. Filter candidates: `|price24hPcnt| ≥ becChangePct` (default 6, matches Psycho Mode's
   `psychoChangePct` default), excluding already-open symbols, banlist, and re-entry cooldown
   (mirrors Psycho Mode's `reentryCooldownHrs`, default 1h).
2. Random shuffle (Fisher-Yates) and take a bounded sample, up to `becPerCycle` (default 12,
   matching Psycho Mode) or remaining slots, whichever is smaller. This is the entire selection
   step — no ranking, no scoring, because a score is exactly what this plugin must not have.
3. Batch-fetch OC data for *only that already-selected sample* (`_ocFetchBatch`), same pattern
   MultiIndicator uses. This step never filters — it's pure data collection on a set that's
   already locked in. If OC data comes back missing for a candidate (thin liquidity, fetch
   failure), that candidate still enters; `+ocs`/`-ocs` is simply omitted from its `_beCriteria`
   rather than blocking entry. Consequence: the `+ocs`/`-ocs` Scorecard chips may end up with a
   smaller sample size than `+24h`/`-24h` and `+fund`/`-fund`, which have no fetch dependency
   (both read straight off the ticker payload already in hand).
4. Open each position (`pseudoOpenLong` for Chaser, `pseudoOpenShort` for Winter), tagging
   `pos._blindEntry = true` and `pos._beCriteria = [...]` (see Scorecard section).

Direction of the position is fixed by the host bot, same as MultiIndicator — the 24h move can be
up or down in either case, there is no "only chase confirmed momentum" logic, since adding that
would itself be a proactive filter.

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

Checked against the live code rather than assumed — the Score line and the Scorecard panel are
*not* the same mechanism, and they don't need the same treatment.

**The Score line needs no changes at all.** `afCloses.push({ts, pnl, skew, breadth})` fires
unconditionally in `pseudoClosePosition`, for any closed position regardless of which strategy
closed it — it is not gated on `pos._mic`. The line itself is driven by `_afEffectiveScore`,
which blends that kernel-weighted PnL-vs-conditions regression with the wave's own lean/FIO
reading — no reference to `micCollapsedSlotRanks` anywhere in that chain. It already works for
Blind-Entry's closes today, automatically. (The earlier draft of this plan assumed the Score line
was built from MultiIndicator's scorecard — that was wrong; corrected here.)

**Genuinely independent** (triggered from Ashfall/Permafrost's own `runScan`/interval, no
MultiIndicator involvement): Structure/FIO wave, Volume History chart, Liquidation Surveillance,
and (per above) the Score line. These keep working unchanged with MultiIndicator removed — no
action needed.

**Currently coupled to MultiIndicator:**
- **OC Surveillance** — the fetch function lives in Ashfall/Permafrost, but MultiIndicator
  decides which symbols to sample and makes the call, using its own scan's candidate pool.
  **Correction**: Blind-Entry needs real OC data for its own `+ocs`/`-ocs` tagging (batch-fetched
  for its randomly-selected candidate pool each cycle, no gating — see Entry logic), so it drives
  `_ocFetchBatch()` itself rather than going without. Since it's already making that call, the OC
  Surveillance panel does *not* need hiding after all — it shows real data regardless of which
  strategy is driving it. This corrects the earlier version of this section.
- **Funding Rate Sample / Volume Sample / OI-MC History bars** — populated by MultiIndicator's
  own sampling pass (`_micFundSkew`/`_micVolSkew`/`_micOiSkew`), not computed independently by
  AF/PF. Blind-Entry has no equivalent need (funding sign is read inline per-candidate from the
  ticker payload, no aggregate bar needed), so these three still hide when MultiIndicator's
  absent.

**Resolved**: the three sampling bars don't get duplicated into Blind-Entry or refactored to run
standalone — simply hidden when MultiIndicator isn't loaded, rather than showing empty/broken
placeholders. A single presence flag is enough: MultiIndicator's own `init()` sets
`this._micLoaded = true` (mirrored `this._miwLoaded` for Winter), and the three sampling bars gate
their `x-show` on that flag. OC Surveillance is unaffected by this flag — it works off whoever is
actually calling `_ocFetchBatch()`.

**The Scorecard panel is a separate case, not a "hide" case — see below.**

## Scorecard — a minimal criteria set for Blind-Entry, not just a hide/show toggle

The Scorecard's write path is gated on `pos._mic && pos._micCriteria?.length` (Ashfall-Chaser.html
around line 1569) — unlike the Score line, this genuinely needs criteria data to populate at all,
and Blind-Entry has none by default.

**Resolved approach**: Blind-Entry tags each position with a small, fixed set of sign-only,
untiered pseudo-criteria at close time — not real filters, since entry stays purely the
`|24h change| ≥ threshold` gate. These exist only to give the Scorecard something to bucket:

- `+24h` / `-24h` — direction of the ticker's 24h change. Always exactly one applies.
- `+fund` / `-fund` — sign of the funding rate at entry, any magnitude. Always one applies.
- `+ocs` / `-ocs` — which side (buy/sell) had order-flow majority at entry, no depth threshold.
  Always one applies.

None of these gate entry — they're recorded, not filtered on. This is what makes them safe under
"zero proactive contamination": every candidate that clears the 24h threshold gets one of each
pair regardless of which side it lands on, so nothing about *which* candidates get picked changes.

**Bucket collisions, checked against `collapseCrit`:**
- `+fund`/`-fund` land in `fund>`/`fund<` — a bucket MIC's current tiered `fund+N`/`fund-N`
  criteria never write to (MIC migrated off the bare form). No collision.
- `+ocs`/`-ocs` (sign-prefixed) land in their own bucket, distinct from MIC's sign-*suffixed*
  `ocs+`/`ocs-`. No collision, as long as the prefix convention is kept.
- `+24h`/`-24h` **do** collide with MIC's live, currently-used `+24h`/`-24h` criterion — same
  bucket, PnL pools together. **Confirmed intentional** — a shared "was the ticker up or down"
  signal across whichever strategy produced the trade is the wanted behavior, not a bug to avoid.

**Implementation shape**: extend the Scorecard write-gate to
`(pos._mic && pos._micCriteria?.length) || (pos._blindEntry && pos._beCriteria?.length)`, feeding
the same `_afScoreBuild`/chip-render machinery MultiIndicator already uses. No new panel, no new
"gathering data" placeholder logic — the existing panel already handles the empty-history case
today (shows the toggle, no chips, until records exist), so it needs nothing extra for a smaller
criteria set. No presence flag needed here either: the panel just reflects whatever's actually in
the data, MIC's chips or Blind-Entry's, same as it always has.

**Position-type badges**: Blind-Entry gets its own emoji-per-criterion role badge, mirroring
MultiIndicator's `CRIT_EMOJI` convention — reuse the existing `+24h`/`-24h` emoji (⬆️/⬇️) and
funding emoji logic where the same criterion already has one, add a matching emoji for the OCS
pair.

## Data tagging for comparison

The entire point of this plugin is to be comparable against MultiIndicator's real numbers. Since
both would share the same `positions`/`closedTrades` arrays on the same bot instance:

- Every Blind-Entry position gets `pos._blindEntry = true` and `pos._beCriteria = [...]` (the
  three sign-tags at entry), mirroring `pos._mic`/`pos._micCriteria`.
- Register a role badge (`registerRoleBadge`) so positions/closed trades are visually
  distinguishable in the Trades menu, same mechanism MultiIndicator already uses for its 'Multi'
  badge — see Position-type badges above.
- Close reasons reuse the existing strings (`'cascade'`, `'sacrifice'`) rather than inventing
  new ones. Correction: neither currently has a registered label via `registerCloseReason()` —
  only `'substitution'` → `'Sub'` was registered this session — so both fall through to the raw
  fallback and display as literal "cascade"/"sacrifice" today. That's existing MultiIndicator
  behavior, unaffected either way by reusing the same strings; not a Blind-Entry-specific gap.
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
- Duplicating OC Surveillance / sampling-bar logic into Blind-Entry, or refactoring those three
  to run independent of any strategy plugin — resolved as "hide when MultiIndicator is absent"
  instead (see above). Worth revisiting as a separate cleanup later, not part of this plan.
- A configurable way to disable/customize the three Scorecard pseudo-criteria — fixed set for
  v1, not user-adjustable.

## Status: implemented

All open questions settled and built: re-entry cooldown mirrors Psycho Mode's
`reentryCooldownHrs` (default 1h), `becPerCycle`/`bewPerCycle` default to 12, config prefix is
`bec`/`bew`, OC data is batch-fetched for the already-selected random sample with no gating on
availability. Position tag properties ended up bot-scoped (`pos._bec`/`pos._becCriteria`,
`pos._bew`/`pos._bewCriteria`) rather than the generic `pos._blindEntry`/`pos._beCriteria` named
earlier in this doc, to match the existing `pos._mic`/`pos._miw` convention exactly. See
`plugins/strategies/BlindEntry-Chaser.html` and `BlindEntry-Winter.html` for the implementation,
and README.md's "Blind-Entry Plugin (BEW / BEC)" section for user-facing documentation.
