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

**Resolved**: depth uses the raw full-hour `avgHourlyTurnover`, not prorated by elapsed time in
the batch. Deliberately a higher bar early in a cycle — an early trigger has to earn it against
the same denominator a full hour would use, rather than against a scaled-down expectation. Type
classification (the 70%/30% shares) still naturally reflects whatever's accumulated so far, since
those are ratios of the two sides against each other, not against the hourly baseline — no
proration question applies there.

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

**Resolved**: loss circuit breaker. Block a type only when its score is an active loss beyond the
threshold magnitude — `score ≤ −(25% × baseMargin)`. A type that's flat, new (no trades yet), or
mildly profitable stays open; only one that's demonstrably losing gets shut off. Matches how
Cascade/Sacrifice already work (crossing into loss territory from neutral, not requiring
proof-of-profitability up front).

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
Halving multiplier, Share Cap — all scoped to Liquid-Diver's own position tag.

**Substitution — reintroduced, but wider than MultiIndicator's version.** Per the user:
Liquid-Diver's Substitution isn't scoped to its own positions — it can replace *any* held
position, including ones opened by a different strategy plugin entirely, not just other
Liquid-Diver positions. This is a meaningfully bigger scope than MultiIndicator's Substitution
(which only ever compares against its own `_mic`-tagged positions) and needs its own design, not
a straight port:

- **Ranking basis across heterogeneous positions.** MultiIndicator's Substitution compares
  composite scores — both sides of the swap use the same scoring system, because both are its
  own positions. Liquid-Diver reaching into another strategy's position has no shared score to
  compare against (a MultiIndicator position has a composite score; a manual position has none at
  all). The two universally-computable metrics on *any* position regardless of origin are
  unrealized PnL (bump the most underwater position) and age (bump the oldest). Which should
  decide "worst held position" here — most-underwater, oldest, or some combination?
- **Blast radius.** This can close a position the user is actively watching under a completely
  different strategy, triggered by a Liquid-Diver signal that strategy's owner never asked to be
  measured against. Worth a real safeguard: does "Protect Winners" (never substitute out a
  currently-profitable position, matching MultiIndicator's existing protection) apply here too,
  or is that specifically what should be overridable given how time-sensitive a reactive
  liquidation entry is?
- **Trigger scope.** Does Liquid-Diver reach into other strategies' positions only once its own
  Share Cap is exhausted *and* `maxPos` overall is full (genuinely no room anywhere), or does it
  compete more aggressively — willing to bump another strategy's position even while Liquid-Diver
  still has headroom left in its own Share Cap, if the live signal is strong enough? The former is
  a last-resort behavior; the latter is closer to Liquid-Diver treating the whole book, not just
  its own allocation, as its potential inventory.
- **Margin bar.** MultiIndicator's Substitution requires the new candidate to beat the held
  position's score by a configured margin before swapping, to avoid churn on marginal
  differences. With no shared score to compare against here, what stands in for that margin gate
  — is crossing the depth threshold itself sufficient justification, or does cross-strategy
  substitution need a stricter bar than same-strategy substitution did?

## Config namespace and files (proposed, not final)

Prefixes: `ldc` (Liquid-Diver Chaser), `ldw` (Liquid-Diver Winter) — no collision with existing
`mic`/`miw`/`af`/`pf`/`bec`/`bew`.

Files: `plugins/strategies/LiquidDiver-Chaser.html`, `plugins/strategies/LiquidDiver-Winter.html`.

Illustrative config (not final — depends on resolving the open questions above):

| Key | Default | Purpose |
|---|---|---|
| `ldcEnabled` | `false` | master toggle |
| `ldcDepthThreshold` | ? | minimum live depth to trigger entry — needs a default, unresolved |
| `ldcSlotBlockEnabled` / `ldcSlotBlockPct` | `true` / `25` | Slot Blocking on/off and loss threshold |
| `ldcCascadeEnabled` / `ldcCascadePct` | `true` / `25` | mirrors MIC |
| `ldcSacrificeEnabled` / `ldcSacrificePct` / `ldcRollingSacrificeEnabled` | `true` / `25` / `true` | mirrors MIC |
| `ldcHalvingEnabled` / `ldcHalvingHours` | `true` / `0.5` | mirrors MIC |
| `ldcShareCapEnabled` / `ldcShareCapPct` | `true` / `100` | mirrors MIC |
| `ldcSubstitutionEnabled` | `true`? | cross-strategy Substitution on/off — shape unresolved, see above |

(Winter mirrors with `ldw` prefix.)

## Open questions, summarized

**Resolved:**
- Mid-cycle depth uses the raw full-hour average, not prorated — higher bar early in a cycle.
- Slot Blocking is a loss circuit breaker: blocks only when a type's score is an active loss
  beyond the threshold, not a profitability bar.
- Substitution is back in scope, but cross-strategy (can replace any held position, not just
  Liquid-Diver's own) — see the four sub-questions below.

**Still open:**
1. Cross-strategy Substitution ranking basis: most-underwater unrealized PnL, oldest by age, or a
   combination — what decides "worst held position" when it might belong to a different strategy
   with no comparable score?
2. Does Protect Winners (never substitute out a currently-profitable position) apply to
   cross-strategy substitution, or is that specifically meant to be overridable?
3. Trigger scope: only reach into other strategies' positions as a last resort (own Share Cap *and*
   `maxPos` both full), or more aggressively, even with headroom left in Liquid-Diver's own cap?
4. What stands in for MultiIndicator's Substitution margin gate, with no shared score to compare
   against — is clearing the depth threshold itself sufficient justification?
5. Does a blocked type auto-unblock when its score recovers, or require manual clear?
6. Manifest conflict: one-directional or does MultiIndicator also need updating to list
   Liquid-Diver?
7. `ldcDepthThreshold` default — no natural anchor from an existing config value the way
   Blind-Entry's threshold had Psycho Mode's `psychoChangePct` to borrow from. Needs a number.
