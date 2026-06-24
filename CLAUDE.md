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
| `PseudoWinter.html` | v1.7.7 |
| `PseudoChaser.html` | v1.3.8 |
| `PsychoWinter1.0.html` | v1.0 |
| `plugins/strategies/MultiIndicator-Winter.html` | v1.24.4 |
| `plugins/strategies/MultiIndicator-Chaser.html` | v1.24.4 |
| `plugins/analytics/Permafrost-Winter.html` | v1.25.8 |
| `plugins/analytics/Ashfall-Chaser.html` | v1.25.8 |

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
- **Never use `window.confirm()`, `window.alert()`, or `window.prompt()` in plugin or bot UI.** These are blocked when the app runs in an iframe, silently returning `false`/`undefined` and making buttons appear unresponsive with no feedback. Use inline Alpine confirmation UI instead: wrap the button in `<span x-data="{c:false}">`, show the action button when `!c`, and when clicked set `c=true` to reveal inline "Sure? Yes / No" buttons that execute the action or reset `c`.

## Pending Tasks

### Issue #2 — Segmented export options (pending)
Replace the single plugin Export button with a popup modal (matching base app stats Export style) offering three separate exports: structure wave, scorecard, and liq samples. Each downloads its own dated JSON file.

### Issue #3 — Ticker blocking discrepancy (pending)
Many tickers show as blocked but only 3 slots are highlighted as blocked on the scoreboard (combined PnL block active). Find the discrepancy.

### Issue #4 — Structure bar ratio / emoji cleanup (done, PF v1.25.6 + AF v1.25.6)
Structure bar now shows ratios; funding and liq labels have emoji removed.

### Issue #5 — Consolidate Fade Away toggles (done, MIW + MIC v1.22.0)
Merged into single master toggle with Structure/Liq/Funding sub-toggles. Combined adverse score = average of enabled signal contributions. Runs every scan; also fires between scans via exit timer when any position is in loss ≥ loss trigger.

### Issue #6 — Mixed liq condition + new mS-Liq / mB-Liq criteria (done, MIW + MIC v1.23.0)
`sliq`/`bliq` now require ≥70% raw dominance (sLiqRaw/total). New criteria `msliq` (💦) and `mbliq` (🌨️) match the majority side when minority ≥30%. Both have depth parameters. Applied to `checkCrit`, `checkAnnotCrit`, `_annotCrits`, UI slot builder, auto-slot list, `critEmoji`, `critLabel`, `CRIT_DESC`/`CRIT_EMOJI`, header comment, badge key, and `_col` collapse function.

### Issue #7 — Historical scoring visibility (done, MIW + MIC v1.24.0)
Pending counter moved out of config accordion. New "Hist Scoring" section in stats-eda slot shows: live pending target count, SVG bar sparkline of last 25 batches, and a full list of completed batches (newest first) with batch ID, wrote/total counts, and relative timestamp. Batch history persisted to `__miw_hist_batches` / `__mic_hist_batches`.

### Issue #8 — README and Strategy Book update (done)
README and Strategy_book.md updated for Issues #4–#7: criteria table, Fade Away config rows consolidated, msliq/mbliq added, Hist Scoring panel documented, localStorage keys table updated.

### Issue #9 — mbliq/msliq emoji rendering + scorecard score filter (pending)
mbliq and msliq emojis aren't rendering properly in the scorecard. Also add a purely visual filter toggle to the scorecard: show only historical scoring outcomes, only traded outcomes, or both.

