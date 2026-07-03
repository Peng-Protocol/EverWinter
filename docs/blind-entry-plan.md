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

## AF/PF integration and the Score line

The user wants Ashfall/Permafrost's data collection and charts (structure wave, volume history,
liquidation surveillance, OC surveillance) to keep working normally — those are observational,
not entry filters, so they're fine regardless of which strategy plugin is driving entries.

The **Score line** (`afShowScore`/`pfShowScore`, the wave chart overlay derived from
`micCollapsedSlotRanks`) is a different matter — it's built entirely from MultiIndicator's slot
scorecard, which Blind-Entry positions can't and shouldn't feed (see "zero proactive
contamination" above). When only Blind-Entry is running:

- The Score line will show nothing/flat, because there's no scorecard data behind it — this
  already degrades gracefully today (score toggle checks `cfg.afShowScore` and reads
  `micCollapsedSlotRanks`, which would simply be empty). No new guard needed for this to not look
  broken; it will just show an empty line, matching the existing "gathering data" placeholder
  states already used elsewhere in these charts.
- Recommend leaving `afShowScore`/`pfShowScore` as a manual toggle the user turns off themselves
  when running Blind-Entry-only, rather than adding auto-detection logic to flip it off — a new
  "is MultiIndicator installed" check is one more thing to keep in sync and isn't worth it for a
  cosmetic toggle the user already knows to flip.

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
- Auto-detecting whether MultiIndicator is installed to change behavior. Coexistence should come
  from tag-scoping, not mode-switching.
- The AF/PF Score-line auto-disable — manual toggle is enough (see above).

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
