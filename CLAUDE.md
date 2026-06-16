# EverWinter — Developer Notes for Claude

## File Versioning (REQUIRED)

Every time you modify an `.html` file in this repo, you **must** increment its version before finishing.

### Where versions live

Each file carries its version in two places — update **both**:

1. `<title>` tag — e.g. `<title>❄ ChartWinter v1.0 — …</title>`
2. Subtitle/logo span — e.g. `<div class="logo-sub">… · v1.0 · …</div>` or `<span …>v1.0</span>`

### Increment rules

- **Patch** (`x.y.Z`): bug fixes, cosmetic tweaks, minor behaviour changes
- **Minor** (`x.Y.0`): new features, new UI sections, new strategy logic
- **Major** (`X.0.0`): breaking redesigns, protocol changes, complete rewrites of a module

When in doubt, increment the patch number.

### Per-file current versions (update this table when you bump)

| File | Version |
|---|---|
| `ChartWinter.html` | v1.0 |
| `PseudoWinter.html` | v1.4.0 |
| `PseudoChaser.html` | v1.0.9 |
| `PsychoWinter1.0.html` | v1.0 |
| `plugins/strategies/MultiIndicator-Winter.html` | v1.1.0 |
| `plugins/strategies/MultiIndicator-Chaser.html` | v1.1.0 |
| `plugins/analytics/Permafrost-Winter.html` | v1.6.1 |
| `plugins/analytics/Ashfall-Chaser.html` | v1.6.1 |

> Always update the table above after bumping a version so this document stays accurate.

## Working Style (REQUIRED)

- **When uncertain, ask.** Never guess at intent or silently pick an interpretation. A one-line question costs nothing; a wrong implementation costs context and time.
- **When something seems strange or confusing, ask.** The user usually knows why — they're often the one who introduced it.
- **When a task hits more than one dead end, stop and ask.** Don't burn compute cycling through approaches. Surface the blocker and let the user redirect.
- **Never remove or change something whose purpose is unclear without asking first.** Investigate, then confirm before acting.
- **Prefer the minimal correct change.** Don't clean up, refactor, or extend beyond what was explicitly asked.
- **Log behavioral corrections.** Whenever the user gives a behavioral correction or long-term instruction — signalled by phrases like "why didn't you…", "why are you…", "you should always…", "you should never…", or any direct criticism of approach — add the lesson to this file before finishing the response.
