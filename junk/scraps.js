// ============================================================
// SCRAPS — removed 2026-06-28
// Contains: Scorecard Auto-Block machinery + Preemptive Lock (PLK) gating
// Extracted from: PF, AF, MIW, MIC, PseudoWinter, PseudoChaser
// ============================================================

// ──────────────────────────────────────────────────────────────
// PERMAFROST-WINTER — Auto Block UI (inside SCORE zone, was lines ~200-266)
// ──────────────────────────────────────────────────────────────
/*
<label class="tog" style="margin-top:8px" @click.prevent="if(!cfgLocked){cfg.permafrostAutoBlock=!cfg.permafrostAutoBlock;_pfScoreBuild();persist()}">
  <div class="tog-t" :class="cfg.permafrostAutoBlock?'on':''"><div class="tog-k"></div></div>
  <div>
    <div class="tog-l">Auto Block</div>
    <div class="pfr-hint">Gates per-slot blocking by scorecard data. Enable conditions below.</div>
  </div>
</label>
<div x-show="cfg.permafrostAutoBlock" style="margin-top:6px;padding:6px 8px;background:rgba(255,80,80,.03);border:1px solid rgba(255,80,80,.1);border-radius:3px">
  ... [Threshold Block, Combined PnL Block, Block Threshold slider, Collapsed Blocking section, Graylist Cooldown] ...
  <div class="g" style="margin-top:6px">
    <div class="lbl">Graylist Cooldown <b x-text="(cfg.pfBlockedSlotCooldownHours??6)+'h'"></b></div>
    <input type="number" class="inp" min="0.5" max="48" step="0.5" x-model.number="cfg.pfBlockedSlotCooldownHours" @change="persist()" style="width:70px">
    <div class="pfr-hint">Tickers matching a blocked slot are graylisted for this duration.</div>
  </div>
</div>
*/

// PERMAFROST-WINTER — cfg init defaults (removed from init()):
/*
if (this.cfg.pfBlockedSlotCooldownHours        === undefined) this.cfg.pfBlockedSlotCooldownHours        = 6;
if (this.cfg.permafrostAutoBlock               === undefined) this.cfg.permafrostAutoBlock               = false;
if (this.cfg.pfThresholdBlock                  === undefined) this.cfg.pfThresholdBlock                  = true;
if (this.cfg.pfCombinedBlock                   === undefined) this.cfg.pfCombinedBlock                   = false;
if (this.cfg.permafrostSlotLossThreshold       === undefined) this.cfg.permafrostSlotLossThreshold       = 0.25;
if (this.cfg.pfCollapsedBlockEnabled           === undefined) this.cfg.pfCollapsedBlockEnabled           = false;
if (this.cfg.pfCollapsedBlockThreshold         === undefined) this.cfg.pfCollapsedBlockThreshold         = 0.25;
if (this.cfg.pfCollapsedBlockScaleFactor       === undefined) this.cfg.pfCollapsedBlockScaleFactor       = 0.01;
if (this.cfg.pfCollapsedBlockTierCap           === undefined) this.cfg.pfCollapsedBlockTierCap           = 50;
if (this.cfg.pfCollapsedBlockManual            === undefined) this.cfg.pfCollapsedBlockManual            = false;
if (this.cfg.pfLiveCollapsedBlock              === undefined) this.cfg.pfLiveCollapsedBlock              = false;
*/

// PERMAFROST-WINTER — _pfScoreBuild auto-block logic (after pfScoreboard assignment):
/*
if (this.cfg.permafrostAutoBlock) {
  const baseMargin = (this.cfg.minNotional || 6) / (this.cfg.leverage || 6);
  const lossThresh = baseMargin * (this.cfg.permafrostSlotLossThreshold ?? 0.25);
  const useThresh   = this.cfg.pfThresholdBlock ?? true;
  const useCombined = this.cfg.pfCombinedBlock  ?? false;
  const blocks = {};
  for (const s of this.pfScoreboard) {
    const key = [...s.criteria].sort().join(',');
    const threshHit   = useThresh   && (s.ownLossSum >= lossThresh || s.partnerWinSum >= lossThresh);
    const combinedHit = useCombined && (s.totalPnl <= -lossThresh);
    if (threshHit || combinedHit) blocks[key] = 'blocked';
  }
  this.miwBlockedSlots = blocks;
} else {
  this.miwBlockedSlots = {};
}
// ... ranks excluded blocked slots:
if (!this.miwBlockedSlots[key]) ranks[key] = s.totalPnl;
// ... collapsed block:
if (this.cfg.permafrostAutoBlock && this.cfg.pfCollapsedBlockEnabled) {
  const scaleFactor = this.cfg.pfCollapsedBlockScaleFactor ?? 0.01;
  const tierCap     = this.cfg.pfCollapsedBlockTierCap     ?? 50;
  // ... [full collapsed block computation omitted for brevity] ...
}
*/

// ──────────────────────────────────────────────────────────────
// ASHFALL-CHASER — Auto Block (AF equivalents, same structure as PF above)
// ──────────────────────────────────────────────────────────────
// Cfg keys: ashfallAutoBlock, afThresholdBlock, afCombinedBlock, ashfallSlotLossThreshold,
//           afBlockedSlotCooldownHours, afCollapsedBlockEnabled, afCollapsedBlockThreshold,
//           afCollapsedBlockScaleFactor, afCollapsedBlockTierCap, afCollapsedBlockManual, afLiveCollapsedBlock
// State: micBlockedSlots
// Logic: _afScoreBuild() auto-block section (same pattern as PF, source='chaser')

// ──────────────────────────────────────────────────────────────
// MULTIINDICATOR-WINTER — PLK gating
// ──────────────────────────────────────────────────────────────
/*
// State:
miwBlockedSlots: {},
_miwPlkActive: false,
_miwPlkLogged: false,

// init():
if (this.cfg.miwPlkEnabled           === undefined) this.cfg.miwPlkEnabled           = false;
if (this.cfg.miwPlkVolThreshold      === undefined) this.cfg.miwPlkVolThreshold      = 60;
if (this.cfg.miwPlkOiCap             === undefined) this.cfg.miwPlkOiCap             = 10;
this._miwPlkActive = false;
this._miwPlkLogged = false;

// _miwCheckPlk() — called at end of _miwComputeSamplingData():
_miwCheckPlk() {
  if (!this.cfg.miwPlkEnabled) {
    if (this._miwPlkActive) { this._miwPlkActive = false; this._miwPlkLogged = false; this.log('[MIW] PLK lifted', 'info'); }
    return;
  }
  if (!this._miwVolSkew || !this._miwOiSkew) return;
  const volPts  = Math.max(0, this._miwVolSkew.abovePct - (this.cfg.miwPlkVolThreshold ?? 60)) * 2.5;
  const oiPts   = Math.min(this._miwOiSkew.ratio, this.cfg.miwPlkOiCap ?? 10) * 6.25;
  const participation = volPts + oiPts;
  const shouldLock = participation < 50;
  if (shouldLock && !this._miwPlkActive) {
    this._miwPlkActive = true;
    this._miwPlkLogged = true;
    this.log(`[MIW] PLK — participation ${participation.toFixed(1)} below threshold — entries locked`, 'info');
  } else if (!shouldLock && this._miwPlkActive) {
    this._miwPlkActive = false;
    this._miwPlkLogged = false;
    this.log(`[MIW] PLK lifted — participation ${participation.toFixed(1)} (vol ${this._miwVolSkew.abovePct.toFixed(1)}% above / OI ${this._miwOiSkew.ratio.toFixed(2)}%)`, 'info');
  }
},

// _extraStatusPills() PLK pill:
if (this._miwPlkActive) {
  return [{
    pip: 'warn', pipStyle: 'background:rgba(255,150,80,.9)',
    label: 'PLK', labelStyle: 'color:rgba(255,150,80,.9)',
    border: 'border-color:rgba(255,150,80,.45);background:rgba(255,150,80,.10)',
    title: 'Preemptive Lock active — entries blocked (bearish participation below threshold)',
    action: null,
  }];
}

// Entry gate in _miwRunScan():
if (_miwHalted || this._miwPlkActive) return;

// PLK UI zone (inside tF tab):
<div class="miw-zone" x-show="tF">
  <label class="tog" @click.prevent="if(!cfgLocked){cfg.miwPlkEnabled=!cfg.miwPlkEnabled;persist()}">
    ... [Preemptive Lock toggle + Vol Threshold + OI Cap controls] ...
  </label>
</div>
*/

// MULTIINDICATOR-WINTER — Auto-Block pre-scan graylist (was _miwRunScan, lines ~907-1160):
/*
// Blocked annotated slot keys — exact tier combinations to proactively graylist
const blockedSlotKeys = new Set(
  Object.entries(this.miwBlockedSlots || {})
    .filter(([, v]) => v === 'blocked')
    .map(([k]) => k)
);
const blockedAnnotatedSets = blockedSlotKeys.size
  ? [...blockedSlotKeys].map(k => k.split(','))
  : [];

if (!slots.length && !blockedAnnotatedSets.length) { ... return; }

// needsKline/needsMcap also considered blockedAnnotatedSets:
const needsKline = slots.some(...) || blockedAnnotatedSets.some(crits => crits.some(ac => /^(lsa|lba|rasl|rabl)/.test(ac)));
const needsMcap  = slots.some(...) || blockedAnnotatedSets.some(crits => crits.some(ac => /^(vm|iom)/.test(ac)));

const _slTtl = (this.cfg.pfBlockedSlotCooldownHours ?? 6) * 3_600_000;

// basePool also filtered by _miwSlotGraylist:
&& !((this._miwSlotGraylist[t.symbol] ?? 0) > 0 && _glNow - this._miwSlotGraylist[t.symbol] < _slTtl)

// Full blocked slot pre-scan block (lines ~1099-1160):
if (blockedAnnotatedSets.length) {
  const checkAnnotCrit = (ac, fr, is24hUp, ratio, t, mcap, _liqRb, _kl) => { ... };
  let newlyGraylisted = 0;
  for (const t of basePool) { ... graylist matching tickers ... }
  if (newlyGraylisted) this.log(`[MIW] ⛔ ${newlyGraylisted} ticker(s) graylisted...`, 'info');
}

// In pool map — blocked slot + live collapsed block checks:
let _blocked = (this._miwSlotGraylist[t.symbol] ?? 0) > 0 && ...;
// ...
if ((this.miwBlockedSlots || {})[_annotKey] === 'blocked') {
  this._miwSlotGraylist[t.symbol] = _glNow;
  _blocked = true;
}
if (!_blocked && this.cfg.pfLiveCollapsedBlock && this.miwCollapsedSlotRanks) {
  // ... live collapsed scoring + graylist if below threshold ...
  if (_net < -_thresh) { this._miwSlotGraylist[t.symbol] = _glNow; _blocked = true; }
}
// ... return includes _blocked field ...
const entryPool = pool.filter(x => !x._blocked);

// Blocked slot check at open (was ~line 1310):
if (slotKey && (this.miwBlockedSlots || {})[slotKey] === 'blocked') {
  this._miwSlotGraylist[t.symbol] = Date.now();
  this.log(`[MIW] ⛔ Blocked slot at open — graylisting ${sym} 6h`, 'warn');
  return false;
}

// _miwEffectiveSlots() block filtering (was lines 1589-1590):
const blocks = this.miwBlockedSlots || {};
const filtered = Object.keys(blocks).length ? raw.filter(s => !blocks[[...s].sort().join(',')]) : raw;

// Slot Graylist UI section in stats-eda (conditionally shown on permafrostAutoBlock):
<div class="sec" x-show="cfg.permafrostAutoBlock">
  <div class="sec-ttl">Slot Graylist</div>
  ... [grouped display of _miwSlotGraylist with remaining time + clear buttons] ...
</div>

// UI hint about blocked slots (line 169):
<div x-show="Object.keys(miwBlockedSlots||{}).length" class="miw-hint" ...>N slot(s) blocked ...</div>

// Slot card blocked indicator (line 253 & 261):
:style="... bs==='blocked' ? 'border-color:rgba(255,80,80,.7);...' ..."
<div x-show="miwBlockedSlots[...slot...]==='blocked'">⛔ blocked</div>
*/

// ──────────────────────────────────────────────────────────────
// MULTIINDICATOR-CHASER — same as MIW above but MIC equivalents
// ──────────────────────────────────────────────────────────────
// State: micBlockedSlots, _micPlkActive, _micPlkLogged
// Cfg: micPlkEnabled, micPlkVolThreshold, micPlkOiCap, afLiveCollapsedBlock, afCollapsedBlock*
// Functions: _micCheckPlk(), _micEffectiveSlots() block filtering
// Entry gate: if (_micHalted || this._micPlkActive) return;

// ──────────────────────────────────────────────────────────────
// PSEUDOWINTER — PLK halt log branch (was in runScheduledCycle and runScan)
// ──────────────────────────────────────────────────────────────
/*
} else {
  _kind = 'plk';
  if (this._haltLoggedKind !== _kind) { this._haltLoggedKind = _kind; const remH = typeof this._plkRemainingMs === 'function' ? Math.max(0, this._plkRemainingMs() / 3600000) : 0; this.log(`[PLK] 🛑 Preemptive lock active — scan deferred (${remH.toFixed(1)}h remaining)`, 'warn'); }
}
*/

// ──────────────────────────────────────────────────────────────
// PSEUDOCHASER — PLK halt log branch (was in runScheduledCycle)
// ──────────────────────────────────────────────────────────────
/*
} else {
  _kind = 'plk';
  if (this._haltLoggedKind !== _kind) { this._haltLoggedKind = _kind; const remH = typeof this._plkRemainingMs === 'function' ? Math.max(0, this._plkRemainingMs() / 3600000) : 0; this.log(`[PLK] 🛑 Preemptive lock active — scan deferred (${remH.toFixed(1)}h remaining)`, 'warn'); }
}
*/
