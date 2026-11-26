// Cálculos clínicos e utilitários numéricos (sem dependência de DOM)
import { WHO_LMS, DAYS_PER_MONTH } from './who-lms-data.js';
export const dash = '—';

/** Aceita "65,5", "65.5", "1.234,5". Retorna número ou null. */
export function parseBRNumber(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  let s = String(val).trim().replace(/\s/g, '');
  if (!s) return null;
  s = s.replace(/[^0-9,.\-]/g, '');
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/** Altura em metros. Se valor > 3 (ex.: 176) divide por 100. */
export function parseHeightM(val) {
  let n = parseBRNumber(val);
  if (n === null || n <= 0) return null;
  if (n > 3) n = n / 100;
  if (n < 0.3 || n > 3) return null;
  return n;
}

export function fmt(n, d = 1) {
  return typeof n === 'number' && Number.isFinite(n) ? n.toFixed(d).replace('.', ',') : dash;
}

export function parseISO(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

export function todayISO(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function fmtDateBR(iso) {
  const d = parseISO(iso);
  if (!d) return iso ? String(iso) : '';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Idade exata (anos, meses, dias) na data de referência. */
export function calcAge(nasc, ref = new Date()) {
  const b = parseISO(nasc);
  if (!b || b.getFullYear() < 1900) return null;
  let y = ref.getFullYear() - b.getFullYear();
  let mo = ref.getMonth() - b.getMonth();
  let d = ref.getDate() - b.getDate();
  if (d < 0) {
    mo--;
    d += new Date(ref.getFullYear(), ref.getMonth(), 0).getDate();
  }
  if (mo < 0) {
    y--;
    mo += 12;
  }
  if (y < 0) return null;
  const pl = (n, s, p) => `${n} ${n === 1 ? s : p}`;
  const parts = [pl(y, 'ano', 'anos')];
  if (mo) parts.push(pl(mo, 'mês', 'meses'));
  if (d) parts.push(pl(d, 'dia', 'dias'));
  const text = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' e ' + parts[parts.length - 1] : parts[0];
  const refMid = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const bMid = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  const totalDays = Math.max(0, Math.round((refMid - bMid) / 86400000));
  const totalMonths = totalDays / DAYS_PER_MONTH;
  return { years: y, months: mo, days: d, totalDays, totalMonths, text };
}

export function calcIMC(peso, altura) {
  if (!peso || !altura || peso <= 0 || altura <= 0) return null;
  const v = peso / (altura * altura);
  return Number.isFinite(v) ? v : null;
}

/** Classificação: adulto (OMS), idoso (Lipschitz), <20 anos alerta pediátrico. */
export function classifyIMC(imc, years) {
  if (imc === null) return null;
  if (years !== null && years !== undefined && years < 20) {
    return {
      label: 'Paciente pediátrico/adolescente: classificar por Escore-Z / Curvas OMS (IMC/I e E/I)',
      short: 'Escore-Z / Curvas OMS',
      tone: 'info',
      pediatric: true,
    };
  }
  if (years !== null && years !== undefined && years >= 60) {
    if (imc < 22) return { label: 'Baixo peso (Lipschitz)', short: 'Baixo peso', tone: 'warn' };
    if (imc <= 27) return { label: 'Eutrofia (Lipschitz)', short: 'Eutrofia', tone: 'ok' };
    return { label: 'Sobrepeso (Lipschitz)', short: 'Sobrepeso', tone: 'warn' };
  }
  const note = years === null || years === undefined ? ' (idade não informada; critério adulto)' : ' (OMS)';
  let r;
  if (imc < 18.5) r = ['Baixo peso', 'warn'];
  else if (imc < 25) r = ['Eutrofia', 'ok'];
  else if (imc < 30) r = ['Sobrepeso', 'warn'];
  else if (imc < 35) r = ['Obesidade grau I', 'bad'];
  else if (imc < 40) r = ['Obesidade grau II', 'bad'];
  else r = ['Obesidade grau III', 'bad'];
  return { label: r[0] + note, short: r[0], tone: r[1] };
}

export function weightVariation(atual, habitual) {
  if (!atual || !habitual || habitual <= 0) return null;
  const kg = atual - habitual;
  const pct = (kg / habitual) * 100;
  return Number.isFinite(pct) ? { kg, pct } : null;
}

export function ratio(a, b) {
  if (!a || !b || a <= 0 || b <= 0) return null;
  const v = a / b;
  return Number.isFinite(v) ? v : null;
}

export function classifyRCQ(v, sexo) {
  if (v === null) return null;
  if (sexo !== 'Masculino' && sexo !== 'Feminino') return { label: 'Informe o sexo para classificar', tone: '' };
  const lim = sexo === 'Masculino' ? 0.9 : 0.85;
  return v >= lim
    ? { label: `Risco cardiovascular/metabólico elevado (≥ ${fmt(lim, 2)})`, tone: 'bad' }
    : { label: 'Sem risco elevado', tone: 'ok' };
}

export function classifyRCE(v) {
  if (v === null) return null;
  return v >= 0.5
    ? { label: 'Risco metabólico aumentado (RCE ≥ 0,50)', tone: 'bad' }
    : { label: 'Sem risco aumentado', tone: 'ok' };
}

export function classifyCC(cc, sexo) {
  if (cc === null) return null;
  if (sexo !== 'Masculino' && sexo !== 'Feminino') return { label: 'Informe o sexo para classificar', tone: '' };
  const [a, b] = sexo === 'Masculino' ? [94, 102] : [80, 88];
  if (cc >= b) return { label: `Risco muito aumentado (≥ ${b} cm)`, tone: 'bad' };
  if (cc >= a) return { label: `Risco aumentado (≥ ${a} cm)`, tone: 'warn' };
  return { label: 'Sem risco aumentado', tone: 'ok' };
}

/** CMB = CB(cm) − 0,314 × DT(mm) */
export function calcCMB(cb, dt) {
  if (cb === null || dt === null || cb === undefined || dt === undefined) return null;
  if (cb <= 0 || dt < 0) return null;
  const v = cb - 0.314 * dt;
  return Number.isFinite(v) ? v : null;
}

export function sumFolds(db, dt, dsi, dse) {
  const a = [db, dt, dsi, dse];
  if (a.some((x) => x === null || x === undefined)) return null;
  return a.reduce((s, x) => s + x, 0);
}

export function hydrationGoal(peso) {
  if (!peso || peso <= 0) return null;
  const ml = peso * 35;
  return Number.isFinite(ml) ? { ml, litros: ml / 1000, copos: ml / 200, method: '35 mL/kg', pediatric: false, dri: '' } : null;
}

/** Hidratação pediátrica (< 18 anos): Regra de Holliday-Segar (1957) + DRIs/IOM (2005). */
export function hydrationGoalPediatric(peso, ageYears, sexo) {
  if (!peso || peso <= 0) return null;
  let ml;
  if (peso <= 10) ml = peso * 100;
  else if (peso <= 20) ml = 1000 + 50 * (peso - 10);
  else ml = 1500 + 20 * (peso - 20);
  if (!Number.isFinite(ml)) return null;
  let dri = '';
  if (ageYears !== null && ageYears !== undefined) {
    if (ageYears < 1) dri = 'DRIs/IOM (2005) · 0–12m: leite materno / fórmula (AI 0,7–0,8 L/dia total)';
    else if (ageYears <= 3) dri = 'DRIs/IOM (2005) · 1–3a: ~0,9 L líquidos / 1,3 L água total';
    else if (ageYears <= 8) dri = 'DRIs/IOM (2005) · 4–8a: ~1,2 L líquidos / 1,7 L água total';
    else if (ageYears <= 13) dri = sexo === 'Masculino' ? 'DRIs/IOM (2005) · 9–13a (M): ~1,8 L líquidos / 2,4 L total' : sexo === 'Feminino' ? 'DRIs/IOM (2005) · 9–13a (F): ~1,6 L líquidos / 2,1 L total' : 'DRIs/IOM (2005) · 9–13a: M ~1,8 L · F ~1,6 L líquidos';
    else dri = sexo === 'Masculino' ? 'DRIs/IOM (2005) · 14–18a (M): ~2,6 L líquidos / 3,3 L total' : sexo === 'Feminino' ? 'DRIs/IOM (2005) · 14–18a (F): ~1,8 L líquidos / 2,3 L total' : 'DRIs/IOM (2005) · 14–18a: M ~2,6 L · F ~1,8 L líquidos';
  }
  return { ml, litros: ml / 1000, copos: ml / 200, method: 'Holliday-Segar (1957)', pediatric: true, dri };
}

export function hydrationGoalForPatient(peso, ageYears, sexo) {
  if (ageYears !== null && ageYears !== undefined && ageYears < 18) return hydrationGoalPediatric(peso, ageYears, sexo);
  return hydrationGoal(peso);
}

// ---------- Motor Pediátrico OMS 2006 / 2007 (LMS + ajuste |Z| > 3) & SISVAN ----------
export function normalCDF(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

export function fmtZ(z) {
  if (typeof z !== 'number' || !Number.isFinite(z)) return dash;
  return `${z >= 0 ? '+' : ''}${z.toFixed(2).replace('.', ',')}`;
}

export function fmtPct(p) {
  if (typeof p !== 'number' || !Number.isFinite(p)) return dash;
  if (p < 0.1) return 'P<0,1';
  if (p > 99.9) return 'P>99,9';
  return `P${p < 1 || p > 99 ? p.toFixed(1).replace('.', ',') : Math.round(p)}`;
}

function interpolateLMS(tbl, x) {
  if (!tbl || !Number.isFinite(x)) return null;
  const ks = tbl.k;
  const n = ks.length;
  if (x < ks[0] || x > ks[n - 1]) return null;
  let lo = 0, hi = n - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (ks[mid] === x) return { L: tbl.l[mid], M: tbl.m[mid], S: tbl.s[mid] };
    if (ks[mid] < x) lo = mid + 1;
    else hi = mid - 1;
  }
  const i0 = hi, i1 = lo;
  const frac = (x - ks[i0]) / (ks[i1] - ks[i0]);
  return {
    L: tbl.l[i0] + frac * (tbl.l[i1] - tbl.l[i0]),
    M: tbl.m[i0] + frac * (tbl.m[i1] - tbl.m[i0]),
    S: tbl.s[i0] + frac * (tbl.s[i1] - tbl.s[i0]),
  };
}

export function calcWHOZScore(X, L, M, S, restricted = false) {
  if (!Number.isFinite(X) || X <= 0 || !Number.isFinite(M) || M <= 0 || !Number.isFinite(S) || S <= 0) return null;
  let z = L === 0 ? Math.log(X / M) / S : (Math.pow(X / M, L) - 1) / (L * S);
  if (restricted && L !== 0) {
    if (z > 3) {
      const sd3pos = M * Math.pow(1 + L * S * 3, 1 / L);
      const sd23pos = sd3pos - M * Math.pow(1 + L * S * 2, 1 / L);
      z = 3 + (X - sd3pos) / sd23pos;
    } else if (z < -3) {
      const sd3neg = M * Math.pow(1 + L * S * -3, 1 / L);
      const sd23neg = M * Math.pow(1 + L * S * -2, 1 / L) - sd3neg;
      z = -3 + (X - sd3neg) / sd23neg;
    }
  }
  if (!Number.isFinite(z)) return null;
  return { z, percentile: normalCDF(z) * 100 };
}

function classifySISVAN_PI(z) {
  if (z < -3) return { label: 'Muito baixo peso para a idade', short: 'Muito baixo peso', tone: 'bad' };
  if (z < -2) return { label: 'Baixo peso para a idade', short: 'Baixo peso', tone: 'warn' };
  if (z <= 2) return { label: 'Peso adequado para a idade', short: 'Peso adequado', tone: 'ok' };
  return { label: 'Peso elevado para a idade', short: 'Peso elevado', tone: 'warn' };
}
function classifySISVAN_EI(z) {
  if (z < -3) return { label: 'Muito baixa estatura para a idade', short: 'Muito baixa estatura', tone: 'bad' };
  if (z < -2) return { label: 'Baixa estatura para a idade', short: 'Baixa estatura', tone: 'warn' };
  return { label: 'Estatura adequada para a idade', short: 'Estatura adequada', tone: 'ok' };
}
function classifySISVAN_Under5(z) {
  if (z < -3) return { label: 'Magreza acentuada', short: 'Magreza acentuada', tone: 'bad' };
  if (z < -2) return { label: 'Magreza', short: 'Magreza', tone: 'bad' };
  if (z <= 1) return { label: 'Eutrofia', short: 'Eutrofia', tone: 'ok' };
  if (z <= 2) return { label: 'Risco de sobrepeso', short: 'Risco de sobrepeso', tone: 'warn' };
  if (z <= 3) return { label: 'Sobrepeso', short: 'Sobrepeso', tone: 'warn' };
  return { label: 'Obesidade', short: 'Obesidade', tone: 'bad' };
}
function classifySISVAN_5to19(z) {
  if (z < -3) return { label: 'Magreza acentuada', short: 'Magreza acentuada', tone: 'bad' };
  if (z < -2) return { label: 'Magreza', short: 'Magreza', tone: 'bad' };
  if (z <= 1) return { label: 'Eutrofia', short: 'Eutrofia', tone: 'ok' };
  if (z <= 2) return { label: 'Sobrepeso', short: 'Sobrepeso', tone: 'warn' };
  if (z <= 3) return { label: 'Obesidade', short: 'Obesidade', tone: 'bad' };
  return { label: 'Obesidade grave', short: 'Obesidade grave', tone: 'bad' };
}

export function isPediatricAnthro(age) {
  if (!age) return false;
  if (typeof age.totalMonths === 'number') return age.totalMonths <= 228;
  return age.years < 19;
}

export function calcPediatricWHO({ weightKg, heightM, sex, ageDays }) {
  if (ageDays === null || ageDays === undefined || !Number.isFinite(ageDays) || ageDays < 0) return null;
  const ageMonths = ageDays / DAYS_PER_MONTH;
  if (ageMonths > 228) return null;
  const isUnder5 = ageMonths < 60;
  const imc = calcIMC(weightKg, heightM);
  const heightCm = heightM ? heightM * 100 : null;
  if (sex !== 'Masculino' && sex !== 'Feminino') {
    return { pediatric: true, needsSex: true, ageDays, ageMonths, isUnder5, imc, indicators: [], byKey: {} };
  }
  const s = sex === 'Masculino' ? 'boys' : 'girls';
  const indicators = [];
  const byKey = {};
  const pushInd = (key, code, name, valueText, tblName, xKey, X, restricted, classify) => {
    const lms = interpolateLMS(WHO_LMS[tblName], xKey);
    if (!lms) return;
    const res = calcWHOZScore(X, lms.L, lms.M, lms.S, restricted);
    if (!res) return;
    const cls = classify(res.z);
    const item = { key, code, name, valueText, z: res.z, zText: fmtZ(res.z), percentile: res.percentile, pText: fmtPct(res.percentile), ...cls };
    indicators.push(item);
    byKey[key] = item;
  };

  if (ageMonths <= 120 && weightKg > 0) {
    if (isUnder5) pushInd('pi', 'P/I', 'Peso / Idade', `${fmt(weightKg)} kg`, `wfa_${s}_0_5`, ageDays, weightKg, true, classifySISVAN_PI);
    else pushInd('pi', 'P/I', 'Peso / Idade', `${fmt(weightKg)} kg`, `wfa_${s}_5_10`, ageMonths, weightKg, true, classifySISVAN_PI);
  }
  if (heightCm > 0) {
    if (isUnder5) pushInd('ei', 'E/I', 'Estatura / Idade', `${fmt(heightCm)} cm`, `lhfa_${s}_0_5`, ageDays, heightCm, false, classifySISVAN_EI);
    else pushInd('ei', 'E/I', 'Estatura / Idade', `${fmt(heightCm)} cm`, `hfa_${s}_5_19`, ageMonths, heightCm, false, classifySISVAN_EI);
  }
  if (isUnder5 && weightKg > 0 && heightCm > 0) {
    const tbl = ageMonths < 24 ? `wfl_${s}_0_2` : `wfh_${s}_2_5`;
    pushInd('pe', 'P/E', ageMonths < 24 ? 'Peso / Comprimento' : 'Peso / Estatura', `${fmt(weightKg)} kg · ${fmt(heightCm)} cm`, tbl, heightCm, weightKg, true, classifySISVAN_Under5);
  }
  if (imc !== null) {
    if (isUnder5) pushInd('imci', 'IMC/I', 'IMC / Idade', `${fmt(imc)} kg/m²`, `bfa_${s}_0_5`, ageDays, imc, true, classifySISVAN_Under5);
    else pushInd('imci', 'IMC/I', 'IMC / Idade', `${fmt(imc)} kg/m²`, `bfa_${s}_5_19`, ageMonths, imc, true, classifySISVAN_5to19);
  }
  return { pediatric: true, needsSex: false, ageDays, ageMonths, isUnder5, imc, indicators, byKey };
}

export function homaIR(glicemia, insulina) {
  if (!glicemia || !insulina) return null;
  const v = (glicemia * insulina) / 405;
  return Number.isFinite(v) ? v : null;
}

function toMin(t) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t || '');
  if (!m) return null;
  const h = +m[1], mi = +m[2];
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}

/** Horas de sono com virada de meia-noite (23:30 → 06:30 = 7h). */
export function sleepHours(dorme, acorda) {
  const a = toMin(dorme), b = toMin(acorda);
  if (a === null || b === null || a === b) return null;
  const min = (b - a + 1440) % 1440;
  const h = Math.floor(min / 60), m = min % 60;
  return { minutes: min, hours: min / 60, text: m ? `${h}h${String(m).padStart(2, '0')}min` : `${h}h` };
}

/** TFGe — CKD-EPI 2021 (sem fator raça), mL/min/1,73m². Retorna null se faltar dado. */
export function ckdEpi2021(scr, ageYears, sex) {
  if (scr === null || scr === undefined || !Number.isFinite(scr) || scr <= 0) return null;
  if (ageYears === null || ageYears === undefined || !Number.isFinite(ageYears) || ageYears < 18) return null;
  if (sex !== 'Masculino' && sex !== 'Feminino') return null;
  const f = sex === 'Feminino';
  const kappa = f ? 0.7 : 0.9;
  const alpha = f ? -0.241 : -0.302;
  const r = scr / kappa;
  const v = 142 * Math.pow(Math.min(r, 1), alpha) * Math.pow(Math.max(r, 1), -1.2) * Math.pow(0.9938, ageYears) * (f ? 1.012 : 1);
  return Number.isFinite(v) ? v : null;
}

/** TFGe pediátrica (1–17 anos) — Equação de Schwartz Modificada (Bedside Schwartz, 2009). */
export function bedsideSchwartz(scr, heightCm, ageYears) {
  if (scr === null || scr === undefined || !Number.isFinite(scr) || scr <= 0) return null;
  if (heightCm === null || heightCm === undefined || !Number.isFinite(heightCm) || heightCm <= 0) return null;
  if (ageYears === null || ageYears === undefined || !Number.isFinite(ageYears) || ageYears < 1 || ageYears >= 18) return null;
  const v = (0.413 * heightCm) / scr;
  return Number.isFinite(v) ? v : null;
}

export function pregestationalIMC(ppg, altura) {
  return calcIMC(ppg, altura);
}

/** % Gordura Corporal: Durnin & Womersley (1974) + Siri (1961). */
export function calcBodyFatDurninWomersley({ db, dt, dsi, dse, sex, ageYears, weightKg }) {
  const folds = [db, dt, dsi, dse];
  if (folds.some((v) => v === null || v === undefined || !Number.isFinite(v) || v <= 0)) {
    return { valid: false, reason: 'Informe as 4 dobras, sexo e idade' };
  }
  if ((sex !== 'Masculino' && sex !== 'Feminino') || ageYears === null || ageYears === undefined || !Number.isFinite(ageYears)) {
    return { valid: false, reason: 'Informe as 4 dobras, sexo e idade' };
  }
  if (ageYears < 17) {
    return { valid: false, reason: 'Protocolo Durnin & Womersley indicado a partir de 17 anos' };
  }
  const sum4 = db + dt + dsi + dse;
  const L = Math.log10(sum4);
  if (!Number.isFinite(L)) {
    return { valid: false, reason: 'Informe as 4 dobras, sexo e idade' };
  }
  const isM = sex === 'Masculino';
  let c, m;
  if (ageYears <= 19) [c, m] = isM ? [1.162, 0.063] : [1.1549, 0.0678];
  else if (ageYears <= 29) [c, m] = isM ? [1.1631, 0.0632] : [1.1599, 0.0717];
  else if (ageYears <= 39) [c, m] = isM ? [1.1422, 0.0544] : [1.1423, 0.0632];
  else if (ageYears <= 49) [c, m] = isM ? [1.162, 0.07] : [1.1333, 0.0612];
  else [c, m] = isM ? [1.1715, 0.0779] : [1.1339, 0.0645];

  const density = c - m * L;
  if (!Number.isFinite(density) || density <= 0) {
    return { valid: false, reason: 'Valores fora da faixa fisiológica' };
  }
  const bodyFatPct = (4.95 / density - 4.5) * 100;
  if (!Number.isFinite(bodyFatPct) || bodyFatPct < 2 || bodyFatPct > 65) {
    return { valid: false, reason: 'Valores fora da faixa fisiológica (2%–65%)' };
  }
  const hasW = weightKg !== null && weightKg !== undefined && Number.isFinite(weightKg) && weightKg > 0;
  const fatMassKg = hasW ? weightKg * (bodyFatPct / 100) : null;
  const leanMassKg = hasW ? weightKg - fatMassKg : null;
  return { valid: true, sum4, density, bodyFatPct, fatMassKg, leanMassKg };
}

/** Pacote completo de cálculos antropométricos a partir dos campos brutos. */
export function anthro(an, sexo, years, ageDays = null) {
  const P = parseBRNumber;
  const altura = parseHeightM(an.altura);
  const peso = P(an.peso), hab = P(an.pesoHab), obj = P(an.pesoObj);
  const cc = P(an.cc), ca = P(an.ca), cq = P(an.cq), cb = P(an.cb), cp = P(an.cp);
  const db = P(an.db), dt = P(an.dt), dsi = P(an.dsi), dse = P(an.dse);
  const imc = calcIMC(peso, altura);
  const rcq = ratio(cc, cq);
  const rce = altura ? ratio(cc, altura * 100) : null;
  const elderly = years !== null && years !== undefined && years >= 60;
  const cpLimit = sexo === 'Masculino' ? 34 : 33;
  const effDays = ageDays !== null && ageDays !== undefined ? ageDays : (years !== null && years !== undefined && years < 19 ? years * 365.25 : null);
  const pediatric = effDays !== null && effDays / DAYS_PER_MONTH <= 228 ? calcPediatricWHO({ weightKg: peso, heightM: altura, sex: sexo, ageDays: effDays }) : null;
  return {
    altura, peso, hab, obj, cc, ca, cq, cb, cp, db, dt, dsi, dse,
    imc,
    imcClass: classifyIMC(imc, years),
    pediatric,
    variation: weightVariation(peso, hab),
    toGoal: peso && obj ? peso - obj : null,
    rcq, rcqClass: classifyRCQ(rcq, sexo),
    rce, rceClass: classifyRCE(rce),
    ccClass: classifyCC(cc, sexo),
    cmb: calcCMB(cb, dt),
    sum4: sumFolds(db, dt, dsi, dse),
    bodyFat: calcBodyFatDurninWomersley({ db, dt, dsi, dse, sex: sexo, ageYears: years, weightKg: peso }),
    cpAlert: elderly && cp !== null && cp <= cpLimit ? `CP ≤ ${cpLimit} cm: risco de sarcopenia` : null,
    cpLimit,
  };
}
