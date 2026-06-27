// RSI code extracted from PseudoWinter.html and PseudoChaser.html
// fetchRSI was defined but never called — gating replaced by 24h change direction.
// calcRSI was only called from fetchRSI.

// ── calcRSI (identical in both bots) ──────────────────────────────────────────
function calcRSI(closes, period=14) {
  if (closes.length < period+1) return null;
  const ch = closes.slice(1).map((v,i)=>v-closes[i]);
  let ag = ch.slice(0,period).filter(c=>c>0).reduce((a,b)=>a+b,0)/period;
  let al = ch.slice(0,period).filter(c=>c<0).reduce((a,b)=>a+Math.abs(b),0)/period;
  for (let i=period;i<ch.length;i++) {
    ag=(ag*(period-1)+(ch[i]>0?ch[i]:0))/period;
    al=(al*(period-1)+(ch[i]<0?Math.abs(ch[i]):0))/period;
  }
  return al===0?100:100-(100/(1+ag/al));
}

// ── fetchRSI — PseudoWinter version (15m klines, incremental top-up) ─────────
async fetchRSI_Winter(symbol, period) {
  try {
    const cacheKey   = `${symbol}_15`;
    const cached     = this._klineCache[cacheKey];
    const BAR_15MS   = 15 * 60 * 1000;
    const expectedLastTs = Math.floor(Date.now() / BAR_15MS) * BAR_15MS - BAR_15MS;
    if (cached && cached.lastCompletedTs != null && cached.lastCompletedTs >= expectedLastTs) {
      const val = calcRSI(cached.closes, period);
      if (val != null) this.symDataWrite(symbol, { [`rsi${period}`]: val });
      return val;
    }
    const KLINE_DEPTH = Math.max(period, 24) + 6;
    const gapBars = (cached && cached.lastCompletedTs != null && cached.timestamps?.length >= 2)
      ? Math.round((expectedLastTs - cached.lastCompletedTs) / BAR_15MS) : Infinity;
    const limit = (gapBars >= 1 && gapBars + 1 < KLINE_DEPTH) ? gapBars + 1 : KLINE_DEPTH;
    const r = await fetch(`${this.base}/v5/market/kline?category=linear&symbol=${symbol}&interval=15&limit=${limit}`);
    const d = await r.json();
    if (d.retCode !== 0) return null;
    const candles = (d.result?.list || []).reverse();
    let entry;
    if (limit < KLINE_DEPTH && candles.length) {
      entry = cached;
      if (entry.timestamps.length && entry.timestamps[entry.timestamps.length - 1] > entry.lastCompletedTs) {
        entry.opens.pop(); entry.closes.pop(); entry.volumes.pop(); entry.baseVolumes.pop(); entry.timestamps.pop();
      }
      for (const c of candles) {
        const cts = parseInt(c[0]);
        if (entry.timestamps.length && cts <= entry.timestamps[entry.timestamps.length - 1]) continue;
        entry.opens.push(parseFloat(c[1]));
        entry.closes.push(parseFloat(c[4]));
        entry.volumes.push(parseFloat(c[6]));
        entry.baseVolumes.push(parseFloat(c[5]));
        entry.timestamps.push(cts);
      }
      const excess = entry.closes.length - KLINE_DEPTH;
      if (excess > 0) for (const k of ['opens', 'closes', 'volumes', 'baseVolumes', 'timestamps']) entry[k].splice(0, excess);
      entry.lastCompletedTs = entry.timestamps.length >= 2 ? entry.timestamps[entry.timestamps.length - 2] : null;
      entry.ts = Date.now();
    } else {
      const opens          = candles.map(c => parseFloat(c[1]));
      const closes         = candles.map(c => parseFloat(c[4]));
      const volumes        = candles.map(c => parseFloat(c[6]));
      const baseVolumes    = candles.map(c => parseFloat(c[5]));
      const timestamps     = candles.map(c => parseInt(c[0]));
      const lastCompletedTs = timestamps.length >= 2 ? timestamps[timestamps.length - 2] : null;
      entry = { opens, closes, volumes, baseVolumes, timestamps, lastCompletedTs, ts: Date.now() };
    }
    this._klineCache[cacheKey] = entry;
    const val = calcRSI(entry.closes, period);
    if (val != null) this.symDataWrite(symbol, { [`rsi${period}`]: val });
    return val;
  } catch { return null; }
},

// ── fetchRSI — PseudoChaser version (15m klines, closes+timestamps only) ─────
async fetchRSI_Chaser(symbol, period = 14) {
  const INTERVAL  = '15';
  const cacheKey  = `${symbol}_${INTERVAL}`;
  const cached    = this._klineCache[cacheKey];
  const BAR_15MS  = 15 * 60 * 1000;
  const expectedLastTs = Math.floor(Date.now() / BAR_15MS) * BAR_15MS - BAR_15MS;
  if (cached && cached.lastCompletedTs != null && cached.lastCompletedTs >= expectedLastTs) {
    return calcRSI(cached.closes, period);
  }
  const KLINE_DEPTH = Math.max(period, 24) + 6;
  const gapBars = (cached && cached.lastCompletedTs != null && cached.timestamps?.length >= 2)
    ? Math.round((expectedLastTs - cached.lastCompletedTs) / BAR_15MS) : Infinity;
  const limit = (gapBars >= 1 && gapBars + 1 < KLINE_DEPTH) ? gapBars + 1 : KLINE_DEPTH;
  try {
    const url = `${this.base}/v5/market/kline?category=linear&symbol=${symbol}&interval=${INTERVAL}&limit=${limit}`;
    const res = await fetch(url);
    const js  = await res.json();
    if (js.retCode !== 0) throw new Error(js.retMsg);
    const candles = (js.result?.list || []).slice().reverse();
    let entry;
    if (limit < KLINE_DEPTH && candles.length) {
      entry = cached;
      if (entry.timestamps.length && entry.timestamps[entry.timestamps.length - 1] > entry.lastCompletedTs) {
        entry.closes.pop(); entry.timestamps.pop();
      }
      for (const c of candles) {
        const cts = parseInt(c[0]);
        if (entry.timestamps.length && cts <= entry.timestamps[entry.timestamps.length - 1]) continue;
        entry.closes.push(parseFloat(c[4]));
        entry.timestamps.push(cts);
      }
      const excess = entry.closes.length - KLINE_DEPTH;
      if (excess > 0) for (const k of ['closes', 'timestamps']) entry[k].splice(0, excess);
      entry.lastCompletedTs = entry.timestamps.length >= 2 ? entry.timestamps[entry.timestamps.length - 2] : null;
      entry.ts = Date.now();
    } else {
      const closes          = candles.map(c => parseFloat(c[4]));
      const timestamps      = candles.map(c => parseInt(c[0]));
      const lastCompletedTs = timestamps.length >= 2 ? timestamps[timestamps.length - 2] : null;
      entry = { closes, timestamps, lastCompletedTs, ts: Date.now() };
    }
    this._klineCache[cacheKey] = entry;
    return calcRSI(entry.closes, period);
  } catch (e) {
    this.log(`[RSI-01] ${symbol}: kline fetch failed — ${e.message}`, 'warn');
    return null;
  }
},

// ── Config defaults removed ───────────────────────────────────────────────────
// PseudoWinter: rsi6Min:70, rsi6Max:90, rsi12Min:70, rsi24Min:70
// PseudoChaser: rsi6Min:30, rsi12Min:30, rsi24Min:30, rsi6Max:10
