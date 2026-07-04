# EverWinter — Developer Notes for Claude

## File Versioning (REQUIRED)

Every time you modify an `.html` file in this repo, you **must** increment its version before finishing.

### Where versions live

Each file carries its version in two or three places — update **all** that apply:

1. `<title>` tag — e.g. `<title>❄ ChartWinter v1.0 — …</title>`
2. Subtitle/logo span — e.g. `<div class="logo-sub">… · v1.0 · …</div>` or `<span …>v1.0</span>`
3. **Plugin `const VERSION`** (plugins only) — a single `const VERSION = 'x.y.z'` declared near the top of each plugin's `<script>` block. Both the manifest `version: VERSION` field and the load-log string use it via template literal (`v${VERSION}`), so there is only **one line to change** per plugin file when bumping.

### Increment rules

- **Patch** (`x.y.Z`): adjustments to existing functionality or UI (tweaks, fixes, tooltip changes, restyling)
- **Minor** (`x.Y.0`): added or removed functionality (new controls, new logic, new UI sections, removed features)
- **Major** (`X.0.0`): only when explicitly requested by the user

### Per-file current versions (update this table when you bump)

| File | Version |
|---|---|
| `ChartWinter.html` | v1.5 |
| `PseudoWinter.html` | v1.13.5 |
| `PseudoChaser.html` | v1.9.6 |
| `PsychoWinter1.0.html` | v1.0 |
| `plugins/strategies/MultiIndicator-Winter.html` | v1.44.0 |
| `plugins/strategies/MultiIndicator-Chaser.html` | v1.43.0 |
| `plugins/strategies/BlindEntry-Winter.html` | v1.0.3 |
| `plugins/strategies/BlindEntry-Chaser.html` | v1.0.3 |
| `plugins/strategies/LiquidDiver-Winter.html` | v1.1.0 |
| `plugins/strategies/LiquidDiver-Chaser.html` | v1.1.0 |
| `plugins/analytics/Permafrost-Winter.html` | v1.47.1 |
| `plugins/analytics/Ashfall-Chaser.html` | v1.47.1 |

> Always update the table above after bumping a version so this document stays accurate.

## Documentation Writing Style (REQUIRED)

- **README.md**: A user manual for setup and operation. Use precise config key names, UI panel names, and localStorage keys where relevant to help the user identify what they're looking at. Refer to bots by technical name (PseudoWinter, PseudoChaser). **Every section must serve setup, operation, or troubleshooting — cut anything that is purely implementation detail with no operational consequence.** Specifically:
  - Config toggles: explain every toggle in "what does this button do?" terms — one sentence on what it does when on, and the practical consequence.
  - Stats menu: explain session stats, the Actions dropdown, and the activity log (what it shows, color codes, what entries mean).
  - Trades menu: explain only what the user may observe but not fully understand — the roll-up card, the PnL chart drawer, and the CLEAR button confirmation flow.
  - Do NOT include: internal architecture (Alpine component pattern, timer vars, module-level state), RSI or EDa maths, transform pipeline details, plugin manifest fields, API endpoint tables, cross-tab registry format, Bybit signing algorithm. These are developer internals with no operational value.
  - Cross-tab cooperation: 2 sentences max — what it does and the user-visible benefit.
  - Plugin loading: how to load a file, the reload requirement. No manifest table, no transform pipeline.
- **Strategy_book.md**: Prescriptive human tone. No code references, no config key names, no function names, no bot or file names. Write for a trader, not a developer — describe what to do and why, not how it is implemented. Avoid meandering language — be direct and use as few phrases as possible.

## Scope (REQUIRED)

Unless stated otherwise, all work is on **PseudoWinter.html** and **PseudoChaser.html** and their associated plugins (`plugins/analytics/`, `plugins/strategies/`). Do not touch other files unless explicitly directed.

## Working Style (REQUIRED)

- **When uncertain, ask.** Never guess at intent or silently pick an interpretation. A one-line question costs nothing; a wrong implementation costs context and time.
- **When something seems strange or confusing, ask.** The user usually knows why — they're often the one who introduced it.
- **When a task hits more than one dead end, stop and ask.** Don't burn compute cycling through approaches. Surface the blocker and let the user redirect.
- **Never remove or change something whose purpose is unclear without asking first.** Investigate, then confirm before acting.
- **Prefer the minimal correct change.** Don't clean up, refactor, or extend beyond what was explicitly asked.
- **Log behavioral corrections.** Whenever the user gives a behavioral correction or long-term instruction — signalled by phrases like "why didn't you…", "why are you…", "you should always…", "you should never…", or any direct criticism of approach — add the lesson to this file before finishing the response.
- **Tooltip length.** In-app tooltips (hint text, x-text descriptions, title attributes) must be at most 3 phrases. Aim for 1.
- **Fade Away loss trigger = between-scan enabler, not a scan gate.** The loss threshold causes the combined fade check to also fire via the exit timer (between scans) when any position crosses it. The check always runs every scan cycle unconditionally. "Scan bypass" means it bypasses waiting for the next scan — it does NOT skip or gate the scan-time check.
- **PF/AF tooltip and README framing**: These plugins do not reliably identify which specific market structures precede halt events. Market regime (bull/bear) is the dominant driver of the learned profile and is not fully captured in the tracked signals. Tooltips should be generalized ("learns from historical conditions and outcomes") and avoid implying structural causation. The README may elaborate on observed reactions to data.
- **Never use `window.confirm()`, `window.alert()`, or `window.prompt()` in plugin or bot UI.** These are blocked when the app runs in an iframe, silently returning `false`/`undefined` and making buttons appear unresponsive with no feedback. Use inline Alpine confirmation UI instead: wrap the button in `<span x-data="{c:false}">`, show the action button when `!c`, and when clicked set `c=true` to reveal inline "Sure? Yes / No" buttons that execute the action or reset `c`.
- **When fixing a performance issue, don't change functional/behavioral parameters as part of the fix without confirming they're not intentional.** Capping the liq surveillance's concurrent-batch count looked like an obvious perf win but was actually a deliberate design choice (broader simultaneous ticker coverage) — the real cost was the per-message localStorage write, not the batch count itself. When a "wasteful-looking" number (concurrency, retry count, batch size) could plausibly be intentional, ask before changing it rather than folding it into a performance fix.
- **Don't present speculative trading-signal/strategy designs with confident language.** Recombining known TA concepts (candle patterns, liquidation exhaustion, OI crowding, etc.) into a proposed entry filter is not validated insight — it's pattern-matching against textbook material, with zero basis for claiming it would work. If a signal combination reliably predicted price reversal vs. continuation, it would already be arbitraged by better-resourced players; the fact that it isn't commoditized is itself evidence against casual recombination working. State plainly "I have no data or way to validate this" rather than describing a proposal as "the most direct lever" or "a genuine tell." Reasoning about *mechanics already in the code* (does this DCA math compound risk the way it looks, does this filter select the population it claims to) is grounded and fine; predicting what markets will do next is not something to answer with confidence.
- **When you hit a hard barrier (blocked network, missing capability, missing data), stop and report — don't pick a path and start executing it.** State the barrier plainly, then describe the plan you're considering, and wait for the user to confirm or redirect before doing any of the follow-up work (e.g. reading more code, building tooling) that plan implies. Reporting the blocker and then immediately continuing on your own chosen path is still not stopping — the user needs a chance to redirect before work starts, not just a heads-up while it's already underway.
- **Alpine.js `x-html`/`x-text` reactivity: prefer removing artificial `tick`-style polling dependencies over throttling them.** A method that reads `void this.tick` recomputes every time that counter changes, regardless of whether the data it actually uses changed — even a throttled/slower counter is still polling. Alpine already tracks which reactive properties a method reads and re-runs it automatically when *those* properties mutate (array `.push()`, reassignment, etc.), so a chart/panel builder should have no tick dependency at all unless it has a genuine live/time-based element (e.g. a countdown) with no underlying data change to key off. Default to letting Alpine's own dependency tracking drive recomputation; only add a tick read when there's a concrete reason sub-second or sub-few-second freshness matters independent of data.
- **Prefer asking clarifying questions directly in the response text over the AskUserQuestion tool.** The tool appears to cost more credits than a plain-text question. Pose the question, then stop and wait for the user's reply in the next turn — don't use the structured tool unless the user asks for options/a picker.

## Pending Tasks

None.

