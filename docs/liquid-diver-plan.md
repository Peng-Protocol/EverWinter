# Liquid-Diver — Design Plan (draft, not implemented)

## Purpose

A specialized, liquidation-only strategy plugin. Structurally similar to MultiIndicator (entry
gate + Cascade/Sacrifice/Halving/Share Cap management, position tagging feeding the scorecard),
but narrower and reactive rather than scan-gated: the only thing that opens a position is a
liquidation depth threshold being crossed, checked live as messages stream in — not at the next
scan cycle.

**Cannot run alongside MultiIndicator-Chaser/Winter.** Reasoning below (Architecture section) —
this isn't a policy preference, it's a structural consequence of hooking into the liquidation
WebSocket handler directly instead of reading `_liqResults` after a cycle closes.

## Depth, precisely (corrected understanding — see chat for the full derivation)

```
calcDepth(raw, avg) = clamp(trunc((raw/avg − 1) × 10), −25, +25)
```
`raw` = one side's (sell-liq or buy-liq, tracked separately) liquidation turnover accumulated
during a cycle. `avg = turnover24h ÷ 24` — the ticker's typical **hourly trading** turnover, not
a liquidation-specific baseline. Depth is "how many multiples of 10% of a normal hour's trading
volume got liquidated on this side," clamped to +25, practically floored at −10 (turnover can't
go negative, so zero liquidations already reads −10). depth=0 already means a full hour's worth
of normal trading volume was liquidated on that side — not a neutral reading.

Today this is only ever computed once, at `_liqCloseBatch`, an hour after a batch starts. Nothing
currently computes it mid-cycle off the live-accumulating `batch.sLiqTurnover`/`bLiqTurnover` —
that's the new piece this plugin needs.

**Type classification** (ported as-is from MultiIndicator, hardcoded thresholds, not config):
- `sliq`: sell-liq share of cycle turnover ≥ 70%
- `bliq`: buy-liq share ≥ 70%
- `msliq`: sell-liq leads, but buy-liq ≥ 30% (contested, sell lean)
- `mbliq`: buy-liq leads, but sell-liq ≥ 30% (contested, buy lean)

## Architecture: why this can't coexist with MultiIndicator

MultiIndicator's `sliq`/`bliq`/`msliq`/`mbliq` criteria read `_liqResults[symbol]`, a value only
written once per finished hour-long batch (`_liqCloseBatch`, fired by a `setTimeout` an hour
after the batch's WebSocket subscription opens). Scan-time matching against a value that's
always at least momentarily stale by design.

Liquid-Diver's whole premise is the opposite: react the moment a threshold crosses *during* the
still-open batch. That requires computing a live depth reading off `batch.sLiqTurnover[sym]` /
`batch.bLiqTurnover[sym]` as they accumulate in the WebSocket message handler inside
`_liqLaunchBatch`, before the batch ever closes. That handler currently only tallies turnover and
writes it back to the batch object — it has no hook point for "check every incoming message
against a threshold and fire an entry." Adding one is a real change to Ashfall/Permafrost's
liquidation surveillance code, not just a new consumer reading existing data.

Running MultiIndicator and Liquid-Diver against the *same* liquidation batches at the same time
would mean two different consumers reacting to the same signal on two different timelines (one
scan-gated and stale, one live) — confusing at best, and Slot Blocking (below) specifically wants
sole ownership of interpreting sliq/bliq/msliq/mbliq performance, which gets murky if
MultiIndicator's own hardcoded 70%/30% slot criteria are also independently opening positions off
the same cycles. Enforce via the plugin manifest's `conflicts` field (already used by other
plugins) — the Plugin Manager blocks loading both on the same bot.

**Open question**: should the manifest conflict be one-directional (Liquid-Diver declares a
conflict with MultiIndicator) or should MultiIndicator's own manifest also list Liquid-Diver as a
conflict, so it's caught regardless of load order? Recommend both list each other, matching how
`conflicts` arrays read elsewhere in the codebase.

## Entry mechanism: reactive, not scan-gated

Per the user: scanning exists only to *create new liquidation surveillance batches* (the same
`_liqLaunchBatch` mechanism Ashfall/Permafrost already runs on `runScan`) — it is not the trigger
for opening a position. The trigger is a live threshold crossing inside an already-running batch.

Proposed shape:
1. On every incoming liquidation WebSocket message (inside the batch's message handler), after
   updating `batch.sLiqTurnover[sym]`/`batch.bLiqTurnover[sym]`, compute a live depth reading for
   that symbol using the same `calcDepth` formula against the batch's `avgHourlyTurnover[sym]`.
2. Classify the cycle-so-far as sliq/bliq/msliq/mbliq using the same 70%/30% share rules, computed
   against turnover accumulated *so far* in this still-open batch (not the eventual hour-end
   total).
3. If depth crosses the configured threshold for that type and Slot Blocking doesn't veto it (see
   below), open a position immediately — don't wait for the current scan cycle or the batch's
   hour-end close.
4. Once opened, that symbol should not re-trigger a duplicate entry from the same batch (already
   covered by the existing "already open" exclusion every strategy here uses, but worth stating
   explicitly since this checks on every message, not once per scan).

**Real open question, methodological, not just a detail**: depth computed against turnover
*accumulated so far* in an active cycle is not the same measurement as depth computed against a
*completed* hour. Early in a batch's life, hitting a given depth requires the same absolute
turnover in far less time — arguably a *stronger* signal (more intense, not just eventually
large) — but it also means the type classification (sliq vs. msliq, e.g.) can look different at
minute 5 than it would at the full hour, since the 70%/30% shares are computed on whatever's
accumulated so far too. Does an early, fast, single-sided spike that hasn't had time to accumulate
a "typical hour's" worth of activity read correctly under this formula, or does the reactive
version need its own scaled/prorated baseline (e.g. `avg × elapsedFraction` instead of the full
`avg`) so a threshold crossing 5 minutes into a batch is judged against a 5-minute expectation
rather than a full-hour one? This changes how easy/hard it is to trigger early vs. late in a
cycle and needs a real decision, not an assumption.

## Slot Blocking

Per-type (sliq/bliq/msliq/mbliq) circuit breaker: if a type's historical score is a loss beyond a
threshold, block new entries of *that type* specifically, while the other three types keep
working normally.

- Default threshold: 25% of base margin (`minNotional ÷ leverage`), same percentage-of-margin
  pattern used throughout Cascade/Sacrifice/Substitution.
- Reads from the **same shared scorecard** MultiIndicator writes to when it's the one loaded —
  `sliq+`/`sliq-` etc. collapsed buckets already exist there (see `collapseCrit`). This continues
  the pattern established for Blind-Entry: sequential use of the same bot doesn't need separate,
  isolated scoring — a type that was losing under MultiIndicator's own sliq/bliq slots is a
  legitimate signal to block under Liquid-Diver too, since it's the same underlying flow being
  measured. Score for a *type* (as opposed to a single collapsed key) sums both sign buckets —
  `sliq` score = `ranks['sliq+'] + ranks['sliq-']` — mirroring the existing pattern already used
  for auto-slot ranking in `_micEffectiveSlots`'s `getRank`.

**Real open question**: "blocked if the score is below a threshold" — below in which direction?
Two readings are both plausible and need a decision, not an assumption:
1. **Loss circuit breaker** (most consistent with Sacrifice's framing): block when score is a
   *loss* exceeding the threshold magnitude — `score ≤ −(25% × baseMargin)`. A type that's been
   flat or mildly profitable stays open; only a type that's actively losing gets shut off.
2. **Profitability bar**: block unless score clears a positive bar — `score < +(25% × baseMargin)`
   blocks, meaning a brand-new type with a $0 score (no trades yet) would start out *blocked*
   until it proves itself, which would make Historical Scoring-style pre-seeding relevant here
   too.

Recommend #1 (loss circuit breaker) since it matches every other threshold-as-%-of-margin
mechanism in this codebase (Cascade/Sacrifice both trigger on crossing into loss/profit territory
from a neutral starting point, not requiring proof-of-profitability before participating), but
this needs explicit confirmation since the two produce very different early behavior.

**Unblocking**: does a blocked type ever re-open automatically (e.g. once its score recovers
above the threshold, checked continuously), or does it require a manual clear, similar to the
Scorecard's own CLEAR button? Recommend automatic — continuous, matching how Cascade/Sacrifice
aren't one-shot triggers — but should be confirmed.

## OC data and position tagging — mirrors Blind-Entry exactly

Before a position opens (once depth + type-not-blocked clears), fetch OC data for that single
symbol (not a batch of many — Liquid-Diver reacts one ticker at a time, not a per-cycle sample),
then tag the position with:

- **The liquidation depth and type that triggered entry** — e.g. `sliq+14` — this is the entry
  *cause*, distinct from the cosmetic tags below, and should remain visible in the position type
  the same way MultiIndicator already shows it.
- `+24h`/`-24h`, `+fund`/`-fund`, `+ocs`/`-ocs` — the same three sign-only, untiered pseudo-tags
  Blind-Entry uses. Per the user, these are cosmetic/scoreline-feeding only and must **not**
  affect Slot Blocking, which reads only the sliq/bliq/msliq/mbliq type score.

This means Liquid-Diver positions carry *two* kinds of tags with different roles: the real
liquidation criterion (which Slot Blocking reads and which determines entry) and the three cosmetic
sign tags (which only feed the Scorecard/Score line the way Blind-Entry's do, same collapseCrit
bucket-sharing considerations apply — `+24h`/`-24h` already collide intentionally with
MultiIndicator's own bucket, same reasoning as before).

**Open question**: same shape as Blind-Entry's — if the single-symbol OC fetch fails or comes
back empty, does the position still open (recommended: yes, `+ocs`/`-ocs` simply omitted, since
OC availability must not gate a genuinely time-sensitive reactive entry any more than it gates
Blind-Entry's)?

## Position management — what ports over

Same as Blind-Entry inherited from MultiIndicator: Cascade, Sacrifice (+ rolling variant),
Halving multiplier, Share Cap — all scoped to Liquid-Diver's own position tag. Substitution is a
genuine open question here (unlike Blind-Entry, where it clearly didn't apply): Liquid-Diver
positions *do* have a real classification (their triggering type) even if not a MultiIndicator-
style composite score — is there any version of Substitution worth considering (e.g. swap out a
position from a currently-blocked type for a fresh entry from an active one), or is it out of
scope for the same reason as Blind-Entry (no comparable score to justify a swap)? Leaning out of
scope by default, but flagging since it's less clear-cut here than for Blind-Entry.

## Config namespace and files (proposed, not final)

Prefixes: `ldc` (Liquid-Diver Chaser), `ldw` (Liquid-Diver Winter) — no collision with existing
`mic`/`miw`/`af`/`pf`/`bec`/`bew`.

Files: `plugins/strategies/LiquidDiver-Chaser.html`, `plugins/strategies/LiquidDiver-Winter.html`.

Illustrative config (not final — depends on resolving the open questions above):

| Key | Default | Purpose |
|---|---|---|
| `ldcEnabled` | `false` | master toggle |
| `ldcDepthThreshold` | ? | minimum live depth to trigger entry — needs a default, unresolved |
| `ldcSlotBlockEnabled` / `ldcSlotBlockPct` | `true` / `25` | Slot Blocking on/off and threshold |
| `ldcCascadeEnabled` / `ldcCascadePct` | `true` / `25` | mirrors MIC |
| `ldcSacrificeEnabled` / `ldcSacrificePct` / `ldcRollingSacrificeEnabled` | `true` / `25` / `true` | mirrors MIC |
| `ldcHalvingEnabled` / `ldcHalvingHours` | `true` / `0.5` | mirrors MIC |
| `ldcShareCapEnabled` / `ldcShareCapPct` | `true` / `100` | mirrors MIC |

(Winter mirrors with `ldw` prefix.)

## Open questions, summarized

1. Mid-cycle depth methodology: raw formula against the full-hour average, or prorated against
   elapsed time in the batch so far?
2. Slot Blocking direction: loss circuit breaker (score ≤ −threshold) or profitability bar
   (score < +threshold, blocking brand-new types by default)?
3. Does a blocked type auto-unblock when its score recovers, or require manual clear?
4. Does Substitution have any place here, or is it out of scope like Blind-Entry?
5. Manifest conflict: one-directional or does MultiIndicator also need updating to list
   Liquid-Diver?
6. `ldcDepthThreshold` default — no natural anchor from an existing config value the way
   Blind-Entry's threshold had Psycho Mode's `psychoChangePct` to borrow from. Needs a number.
