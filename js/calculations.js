// Cálculos clínicos e utilitários numéricos (sem dependência de DOM)
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
  return { years: y, months: mo, days: d, text };
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
  return Number.isFinite(ml) ? { ml, litros: ml / 1000, copos: ml / 200 } : null;
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
export function anthro(an, sexo, years) {
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
  return {
    altura, peso, hab, obj, cc, ca, cq, cb, cp, db, dt, dsi, dse,
    imc,
    imcClass: classifyIMC(imc, years),
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
