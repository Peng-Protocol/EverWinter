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
| `PseudoWinter.html` | v1.3.3 |
| `PseudoChaser.html` | v1.0.2 |
| `PsychoWinter1.0.html` | v1.0 |

> Always update the table above after bumping a version so this document stays accurate.
