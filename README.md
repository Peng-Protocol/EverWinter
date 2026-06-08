# ❄️ EVERWINTER

**EverWinter** is a dual-direction, browser-based trading suite for Bybit USDT Perpetuals executing the **Winter-Chaser** strategy. It ships as two independent simulation bots — **PseudoWinter** (shorts) and **PseudoChaser** (longs) — each upgradeable to live trading via a plugin. Both target mean-reversion and trend-continuation opportunities using multi-timeframe RSI gating, binary mode risk management, and drawdown throttling. See the [Strategy Guide](https://github.com/Peng-Protocol/EverWinter/blob/main/Strategy_book.md) for entry logic and rationale.

---

## Technical Stack

- **Frontend:** Alpine.js, Bootstrap 5, custom CSS themes (Glacier-Void for PseudoWinter, Ember-Void for PseudoChaser)
- **API:** Bybit V5 REST (`category: linear`)
- **Architecture:** Single-file HTML/JS — no build step, no backend. Market data fetched directly from Bybit public endpoints.
- **Persistence:** `localStorage` — config, session stats, trade history, and positions survive page reloads.
- **Plugins:** Live trading capability loaded via Plugin Manager; credentials stored in `localStorage`, transmitted only to `api.bybit.com`.

---

## Getting Started

### Simulation (no API key required)
1. Download `PseudoWinter.html` and/or `PseudoChaser.html` and open in any modern desktop browser.
2. Configure leverage, margin, and RSI thresholds in the config panel.
3. Click **Start Bot** — the bot scans live Bybit market data with phantom capital.

### Live Trading
1. Run the simulation bot as above.
2. Open **Plugin Manager** at the bottom of the config panel.
3. Load `plugins/modes/EverWinter.html` (for PseudoWinter) or `plugins/modes/SunChaser.html` (for PseudoChaser).
4. Reload the page — an API credentials section appears at the bottom of config.
5. Generate a Bybit API key with **Contract/Derivatives** read + trade permissions, enter it, and click **Save Credentials**.
6. Click **Start Bot**.

---

## Bots

### PseudoWinter

**Shorts-only** simulation bot. Targets over-bought gainers via multi-timeframe RSI gating and trend-following short entries on the biggest losers. Binary mode is default: each position gets a native TP and SL on the exchange at entry — no DCA ladder, clean bounded risk.

Upgraded to live trading by loading `plugins/modes/EverWinter.html` via Plugin Manager.

### PseudoChaser

**Longs-only** simulation bot. Mirror of PseudoWinter with inverted criteria — enters oversold candidates and trend-following longs. Same binary mode default, same RSI gating structure, amber/orange UI theme.

Upgraded to live trading by loading `plugins/modes/SunChaser.html` via Plugin Manager.

---

## Watchlists

### Temporary Symbol Banlist
Banlist entries store `{ reason, setAt }`, expire after one week, and are pruned as they are checked.

### Potential Entries (PseudoChaser)
Symbols within a configurable RSI shortfall of the full entry gate. Re-checked every scan cycle and opened immediately on qualification.

### Potential Gainers / Potential Losers (PseudoChaser)
Two separate watchlists for gainer-strategy and loser-strategy candidates. Both collapse and hide automatically when empty.

---

## Scan Behaviour

### Gainers Scan
1. **Ticker fetch** — all USDT perpetuals in one bulk call.
2. **Gainer filter** — positive-change, non-BTC, price ≥ $0.001, sorted by 24h change descending. Top `topN` evaluated.
3. **Per-symbol gates** — symbol banlist → lock-in check → RSI6 max (over-extension disqualifier) → RSI gate triplet (RSI6/RSI12/RSI24 floor).
4. **Open** — qualifying candidates open immediately up to `maxPos`.

### Losers Scan
1. Same bulk ticker fetch reused.
2. **Loser filter** — most negative 24h change, non-BTC.
3. **Per-symbol gates** — symbol banlist → lock-in check → RSI ceiling gates (RSI6/RSI12/RSI24 must be ≤ configured ceiling, confirming continued downward momentum).
4. **Open** — qualifying candidates open up to available slots.

---

## Order Execution

### Binary Mode (Default)
Each position is opened with a native **Take Profit** and **Stop Loss** set on the exchange at entry. No DCA orders. TP and SL percentages are configurable (default 18% both). The position either hits TP or SL — exposure is fully bounded from the moment of entry.

### Drawdown Throttling
When session drawdown exceeds the configured threshold, new entries are paused. The throttle lifts automatically once PnL recovers above the threshold. Prevents compounding losses on a bad meta-read day.

---

## Lock-in System

After a position closes, the symbol enters a **lock-in** window (6h TTL). The lock-in records the RSI levels at close and acts as a ratcheting gate:
- **Gainer lock-in**: RSI roof lowers on each close — re-entry requires the ticker to have cooled further.
- **Loser lock-in**: RSI floor rises on each close — re-entry requires the ticker to be more extended.

Lock-in prevents immediate re-entry into the same ticker at the same RSI conditions, forcing the next entry to be at genuinely better odds.

---

## EDa (Effective Debt Adjusted) Laggard System

When multiple positions are open and some close at a loss, the collective deficit is tracked. The oldest open position becomes the **laggard** and receives an adjusted TP (EDa TP) that ensures its close recovers enough to offset the shared debt. The EDa TP is the singular source of truth for the laggard's take profit — drift correction and manual adjustments respect it.

---

## Stats

Session trade count, wins, losses, win rate, net PnL, force closes. Gainer lock-in and loser lock-in tables showing active RSI ratchets per symbol with trade counts and TTL. Activity log capped at 300 entries.

---

## Plugin System

Both bots include a **Plugin Manager** accessible at the bottom of the config panel. Plugins are `.js` or `.html` files that extend or transform the bot at runtime.

### Plugin Format
A plugin file exports `window.__BotPlugin` with:
- **Manifest fields**: `id`, `name`, `version`, `targetBot`, `after`, `before`, `conflicts`, `requires`, `touches`
- **`transform(def)`**: receives the current component definition, returns a modified one — methods can be replaced, wrapped, or extended; data properties added; CSS injected; HTML slots populated
- **`css`**: injected into `<head>` on load
- **`slots`**: HTML keyed by slot name, inserted into named anchor points in the template

Multiple plugins load simultaneously. The manifest's `after`/`before`/`conflicts`/`requires` fields are used to topologically sort the load order and warn on incompatibilities. The `touches` field declares which methods a plugin modifies, surfacing potential conflicts between plugins that overlap.

### Available Plugins
| File | Target | Purpose |
|---|---|---|
| `plugins/modes/EverWinter.html` | PseudoWinter | Live trading via Bybit API (shorts) |
| `plugins/modes/SunChaser.html` | PseudoChaser | Live trading via Bybit API (longs) |

---

## PsychoWinter

**PsychoWinter** (`PsychoWinter1.0.html`) is a standalone reactive-approach bot running Psycho Mode — no RSI gates, no lock-in, no binary mode. A single change-percent threshold is the only entry filter; all edge lives in the exit system: multi-stage DCA, aggressive absorption, exhumation, laggard debt repository, cascade triggers, and sacrifice. `localStorage` namespaced separately (`psychowinter_v1`). Runs pseudo by default; live mode requires Bybit credentials.

See the [Strategy Guide](https://github.com/Peng-Protocol/EverWinter/blob/main/Strategy_book.md) for full Psycho Mode documentation.

---

## ChartWinter

**ChartWinter** (`ChartWinter.html`) is a standalone chart and scan research tool. Runs its own scan with RSI and configurable parameters; computes RSI6/RSI12/RSI24 client-side via Wilder's method. Gainers/Losers toggle, configurable change range, pinnable tickers, persistent price/candle lines saved per symbol in `localStorage`.

---
