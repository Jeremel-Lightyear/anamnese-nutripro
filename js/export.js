// Resumo para prontuário + geradores de HTML de impressão (Anamnese e Solicitação de Exames)
import * as C from './calculations.js';
import {
  PATOLOGIAS, FAMILIA, SINTOMAS_GI, BUCAL, SEMIO, EQUIP, FREQ_ITEMS, TEA_GATILHOS, TEA_EQUIPE,
} from './state.js';
import { LAB_EXAMS, REQUEST_EXAMS, labValue, evalExam } from './exams-data.js';
import { bristolText } from './bristol.js';

const filled = (v) => v !== undefined && v !== null && String(v).trim() !== '';
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dt = (iso) => C.fmtDateBR(iso);
const join = (arr, sep = '; ') => arr.filter((x) => x && filled(x)).join(sep);

export function ageOf(p) {
  return C.calcAge(p.p.nasc, C.parseISO(p.p.data) || new Date());
}
export function anthroOf(p) {
  const a = ageOf(p);
  return C.anthro(p.an, p.p.sexo, a ? a.years : null, a ? a.totalDays : null);
}

const withUnit = (v, u) => (filled(v) ? `${String(v).trim()}${u ? ' ' + u : ''}` : '');

/** Fonte única de dados: seções com linhas e tabelas, omitindo tudo que estiver vazio. */
export function buildSections(p) {
  const age = ageOf(p);
  const an = anthroOf(p);
  const secs = [];
  const add = (title, rows = [], tables = []) => {
    const r = rows.filter((x) => x && filled(x[1]));
    const t = tables.filter((x) => x && x.body.length);
    if (r.length || t.length) secs.push({ title, rows: r, tables: t });
  };
  const R = (l, v) => [l, v];

  // 1. Identificação
  const tags = Object.entries(p.p.tags || {}).filter(([, v]) => v).map(([k]) => k);
  const gestIMC = p.p.gestante ? C.pregestationalIMC(C.parseBRNumber(p.p.ppg), an.altura) : null;
  add('1. Identificação e Objetivo', [
    R('Data do atendimento', dt(p.p.data)), R('Tipo de consulta', p.p.tipo), R('Nome', p.p.nome),
    R('Nascimento', filled(p.p.nasc) ? `${dt(p.p.nasc)}${age ? ' (' + age.text + ')' : ''}` : ''),
    R('Sexo biológico', p.p.sexo), R('CPF/Prontuário', p.p.cpf), R('Telefone', p.p.tel), R('Cidade', p.p.cidade), R('Profissão/Ocupação', p.p.prof),
    p.p.menor ? R('Mãe', join([p.p.mae, p.p.maeProf && `(${p.p.maeProf})`], ' ')) : null,
    p.p.menor ? R('Pai/Responsável', join([p.p.pai, p.p.paiProf && `(${p.p.paiProf})`], ' ')) : null,
    p.p.gestante && p.p.sexo === 'Feminino'
      ? R('Gestante', join([`IG ${withUnit(p.p.ig, 'semanas') || 'não informada'}`, filled(p.p.ppg) && `PPG ${p.p.ppg} kg`, gestIMC !== null && `IMC pré-gestacional ${C.fmt(gestIMC)} kg/m²`], ' · '))
      : null,
    R('Queixa/Motivo da procura', join([tags.join(', '), p.p.motivo], ' — ')),
    R('Dietas/acompanhamentos anteriores', join([p.p.dietasPrev, p.p.dietasObs], ' — ')),
  ]);

  // 2. HPP
  const pats = PATOLOGIAS.filter(([k]) => p.h.pat[k] && p.h.pat[k].on).map(([k, l]) => {
    const o = p.h.pat[k];
    const name = k === 'dm' && filled(p.h.dmTipo) ? `Diabetes (${p.h.dmTipo})` : l;
    return filled(o.obs) ? `${name} [${o.obs}]` : name;
  });
  const fam = FAMILIA.filter(([k]) => p.h.fam[k]).map(([, l]) => l);
  if (filled(p.h.fam.outros)) fam.push(p.h.fam.outros);
  const fem = p.p.sexo === 'Feminino';
  const teaOn = p.h.pat.tea && p.h.pat.tea.on;
  const tea = p.h.tea || {};
  const teaGatilhos = teaOn ? TEA_GATILHOS.filter(([k]) => tea.gatilhos && tea.gatilhos[k]).map(([, l]) => l) : [];
  const teaEquipe = teaOn ? TEA_EQUIPE.filter(([k]) => tea.equipe && tea.equipe[k]).map(([, l]) => l) : [];
  add('2. História Clínica, Medicamentos e Saúde Geral', [
    R('Condições clínicas e diagnósticos', pats.join('; ')),
    teaOn ? R('Nutrição no TEA — Nível de suporte', tea.suporte) : null,
    teaOn ? R('Nutrição no TEA — Seletividade alimentar', tea.seletividade) : null,
    teaOn ? R('Nutrição no TEA — Gatilhos sensoriais e rigidez', teaGatilhos.join(', ')) : null,
    teaOn ? R('Nutrição no TEA — Repertório alimentar', join([tea.repertorio, tea.repertorioObs], ' — ')) : null,
    teaOn ? R('Nutrição no TEA — Acompanhamento multidisciplinar', teaEquipe.join(', ')) : null,
    R('Histórico familiar', fam.join(', ')),
    R('Alergias alimentares', p.h.alergia === 'Sim' ? 'Sim' + (filled(p.h.alergiaQuais) ? ': ' + p.h.alergiaQuais : '') : p.h.alergia),
    R('Intolerâncias/Sensibilidades', p.h.intol === 'Sim' ? 'Sim' + (filled(p.h.intolQuais) ? ': ' + p.h.intolQuais : '') : p.h.intol),
    fem ? R('Ciclo menstrual', p.h.ciclo) : null,
    fem ? R('Anticoncepcional', p.h.anticoncepcional === 'Sim' ? 'Sim' + (filled(p.h.anticQual) ? ': ' + p.h.anticQual : '') : p.h.anticoncepcional) : null,
    fem ? R('Sintomas intensos de TPM', p.h.tpm) : null,
  ], [
    { title: 'Medicamentos de uso contínuo', head: ['Fármaco', 'Dose', 'Horário'], body: p.h.meds.filter((m) => filled(m.nome)).map((m) => [m.nome, m.dose, m.hor]) },
    { title: 'Suplementos', head: ['Suplemento', 'Dose', 'Frequência'], body: p.h.sups.filter((m) => filled(m.nome)).map((m) => [m.nome, m.dose, m.freq]) },
  ]);

  // 3. GI
  const sint = SINTOMAS_GI.filter(([k]) => filled(p.gi.sint[k])).map(([k, l]) => `${l}: ${p.gi.sint[k]}`);
  const bucal = BUCAL.filter(([k]) => p.gi.bucal[k]).map(([, l]) => l);
  const semio = SEMIO.filter(([k]) => p.gi.semio[k]).map(([, l]) => l);
  add('3. Saúde Gastrointestinal e Semiologia', [
    R('Escala de Bristol', bristolText(p.gi.bristol)),
    R('Frequência evacuatória', p.gi.freq), R('Esforço evacuatório', p.gi.esforco), R('Evacuação incompleta', p.gi.incompleta),
    R('Dor ao evacuar / laxantes', p.gi.dor === 'Sim' ? 'Sim' + (filled(p.gi.laxQual) ? ': ' + p.gi.laxQual : '') : p.gi.dor),
    R('Sintomas gastrointestinais', sint.join('; ')),
    R('Mastigação', p.gi.mastig), R('Disfagia/Engasgos', p.gi.disfagia), R('Saúde bucal', bucal.join(', ')),
    R('Sinais clínicos (semiologia)', join([semio.join(', '), p.gi.semioObs], ' — ')),
  ]);

  // 4. Rotina
  const sono = C.sleepHours(p.v.dorme, p.v.acorda);
  const equip = EQUIP.filter(([k]) => p.v.equip[k]).map(([, l]) => l);
  const afs = p.v.af === 'Sim'
    ? p.v.afList.filter((a) => filled(a.mod)).map((a) =>
        join([a.mod, withUnit(a.freq, 'x/sem'), a.hor && `às ${a.hor}`, withUnit(a.dur, 'min'), a.tempo && `há ${a.tempo}`, a.int && `intensidade ${a.int.toLowerCase()}`], ', '))
    : [];
  add('4. Rotina, Estilo de Vida e Atividade Física', [
    R('Sono', join([p.v.dorme && `dorme ${p.v.dorme}`, p.v.acorda && `acorda ${p.v.acorda}`, sono && `total ${sono.text}`, p.v.qualSono], ' · ')),
    R('Estuda', p.v.estuda === 'Sim' ? 'Sim' + (filled(p.v.estudaHor) ? ` (${p.v.estudaHor})` : '') : p.v.estuda),
    R('Trabalha', p.v.trabalha === 'Sim' ? join(['Sim', p.v.trabHor && `(${p.v.trabHor})`, p.v.esforco && `esforço ${p.v.esforco.toLowerCase()}`], ' ') : p.v.trabalha),
    R('Tempo de tela', withUnit(p.v.tela, 'h/dia')),
    R('Estresse percebido', filled(p.v.estresse) ? `${p.v.estresse}/10` : ''),
    R('Mora com', p.v.mora), R('Compras', p.v.compras), R('Preparo das refeições', p.v.prepara), R('Equipamentos', equip.join(', ')),
    R('Atividade física', p.v.af === 'Sim' ? (afs.length ? afs.join(' | ') : 'Sim') : p.v.af),
    R('Tabagismo', p.v.fuma === 'Não' || !filled(p.v.fuma) ? p.v.fuma : join([p.v.fuma, p.v.fumaTipo, withUnit(p.v.fumaQtd, '/dia')], ' · ')),
    R('Álcool', p.v.alcool === 'Sim' ? join(['Sim', p.v.alcTipo, p.v.alcFreq, p.v.alcQtd], ' · ') : p.v.alcool),
  ]);

  // 5. Comportamento + Hidratação + Frequência
  const goal = C.hydrationGoalForPatient(an.peso, age ? age.years : null, p.p.sexo);
  const aguaL = C.parseBRNumber(p.a.agua);
  const hid = filled(p.a.agua) ? `${p.a.agua} ${p.a.aguaUnid === 'copos' ? 'copos de 200 ml' : 'L/dia'}` : '';
  const hidLabel = goal && goal.pediatric ? 'Meta hídrica sugerida (Holliday-Segar)' : 'Meta hídrica sugerida (35 ml/kg)';
  const hidText = goal
    ? `${C.fmt(goal.litros, 2)} L/dia (${C.fmt(goal.ml, 0)} ml ≈ ${C.fmt(goal.copos, 0)} copos de 200 ml)${goal.dri ? ' · ' + goal.dri : ''}`
    : '';
  add('5. Comportamento Alimentar, Hidratação e Frequência', [
    R('Come com TV/celular', p.a.tvCel), R('Horário de maior fome', p.a.horaFome),
    R('Apetite em ansiedade/estresse', join([p.a.apetite, p.a.apetiteRelato], ' — ')),
    R('Fins de semana', join([p.a.fds, p.a.fdsDesc], ' — ')),
    R('Alimentos preferidos', p.a.preferidos), R('Aversões', p.a.aversoes),
    R('Ingestão de água', hid), R(hidLabel, hidText),
    R('Cor da urina', p.a.urina),
  ], [
    {
      title: 'Frequência alimentar', head: ['Alimento', 'Frequência', 'Obs/Qtd'],
      body: FREQ_ITEMS.filter(([k]) => filled(p.a.freq[k].f) || filled(p.a.freq[k].obs)).map(([k, l]) => [l, p.a.freq[k].f, p.a.freq[k].obs]),
    },
  ]);
  void aguaL;

  // 6. Recordatório
  add('6. Recordatório Alimentar Habitual', [], [
    {
      title: '', head: ['Refeição', 'Horário', 'Local', 'Alimentos e medidas'],
      body: p.r.meals.filter((m) => m.nao || filled(m.desc) || filled(m.hor) || filled(m.local))
        .map((m) => [m.nome, m.nao ? '' : m.hor, m.nao ? '' : m.local, m.nao ? 'Não realiza' : m.desc]),
    },
  ]);

  // 7. Antropometria
  const v = an.variation;
  const ped = an.pediatric;
  if (ped) {
    const pedRows = ped.indicators.map((ind) => [ind.code + ' · ' + ind.name, ind.valueText, ind.zText, ind.pText, ind.label]);
    const hasZ = p.an.hist.some((h) => filled(h.zimci));
    add('7. Avaliação Antropométrica Pediátrica (OMS 2006/2007 · SISVAN)', [
      R('Peso atual / habitual / objetivo', join([withUnit(p.an.peso, 'kg'), withUnit(p.an.pesoHab, 'kg'), withUnit(p.an.pesoObj, 'kg')], ' / ').replace(/^$/, '')),
      R('Estatura / Altura', an.altura ? `${C.fmt(an.altura, 2)} m (${C.fmt(an.altura * 100)} cm)` : ''),
      R('IMC calculado', an.imc !== null ? `${C.fmt(an.imc)} kg/m² (classificado por Escore-Z IMC/I)` : ''),
      R('Variação ponderal', v ? `${v.kg > 0 ? '+' : ''}${C.fmt(v.kg)} kg (${v.pct > 0 ? '+' : ''}${C.fmt(v.pct)}%) em relação ao habitual` : ''),
      ped.needsSex ? R('Avaliação OMS/SISVAN', 'Sexo biológico não informado para cálculo de Escore-Z') : null,
    ], [
      { title: 'Indicadores OMS 2006/2007 · Classificação SISVAN', head: ['Indicador', 'Medida', 'Escore-Z', 'Percentil', 'Classificação SISVAN'], body: pedRows },
      {
        title: 'Evolução antropométrica',
        head: hasZ ? ['Data', 'Peso', 'Estatura', 'IMC', 'Z IMC/I'] : ['Data', 'Peso', 'Estatura', 'IMC'],
        body: p.an.hist.map((h) => (hasZ ? [dt(h.data), h.peso, h.altura, h.imc, h.zimci || ''] : [dt(h.data), h.peso, h.altura, h.imc])),
      },
    ]);
  } else {
    add('7. Avaliação Antropométrica', [
      R('Peso atual / habitual / objetivo', join([withUnit(p.an.peso, 'kg'), withUnit(p.an.pesoHab, 'kg'), withUnit(p.an.pesoObj, 'kg')], ' / ').replace(/^$/, '')),
      R('Altura', an.altura ? `${C.fmt(an.altura, 2)} m` : ''),
      R('IMC', an.imc !== null ? `${C.fmt(an.imc)} kg/m² — ${an.imcClass.label}` : ''),
      R('Variação ponderal', v ? `${v.kg > 0 ? '+' : ''}${C.fmt(v.kg)} kg (${v.pct > 0 ? '+' : ''}${C.fmt(v.pct)}%) em relação ao habitual` : ''),
      R('Circunferências (cm)', join([
        filled(p.an.cc) && `CC ${p.an.cc}`, filled(p.an.ca) && `CA ${p.an.ca}`, filled(p.an.cq) && `CQ ${p.an.cq}`,
        filled(p.an.cb) && `CB ${p.an.cb}`, filled(p.an.cp) && `CP ${p.an.cp}`, filled(p.an.pesc) && `Pescoço ${p.an.pesc}`,
      ], ' · ')),
      R('RCQ', an.rcq !== null ? `${C.fmt(an.rcq, 2)} — ${an.rcqClass.label}` : ''),
      R('RCE', an.rce !== null ? `${C.fmt(an.rce, 2)} — ${an.rceClass.label}` : ''),
      R('CC (risco)', an.cc !== null && an.ccClass ? an.ccClass.label : ''),
      R('Dobras cutâneas (mm)', join([
        filled(p.an.db) && `DB ${p.an.db}`, filled(p.an.dt) && `DT ${p.an.dt}`, filled(p.an.dsi) && `DSI ${p.an.dsi}`,
        filled(p.an.dse) && `DSE ${p.an.dse}`, an.sum4 !== null && `Σ4DC ${C.fmt(an.sum4)}`,
      ], ' · ')),
      R('CMB', an.cmb !== null ? `${C.fmt(an.cmb)} cm` : ''),
      an.bodyFat && an.bodyFat.valid ? R('% Gordura corporal (Durnin & Womersley)', `${C.fmt(an.bodyFat.bodyFatPct)}% · Densidade ${C.fmt(an.bodyFat.density, 4)} g/cm³ · Siri (1961)`) : null,
      an.bodyFat && an.bodyFat.valid && an.bodyFat.fatMassKg !== null ? R('Massa gorda / MLG', `MG ${C.fmt(an.bodyFat.fatMassKg)} kg · MLG ${C.fmt(an.bodyFat.leanMassKg)} kg`) : null,
      R('Alerta', an.cpAlert),
    ], [
      {
        title: 'Evolução antropométrica', head: ['Data', 'Peso', 'Altura', 'IMC', 'CC', 'CA', 'CQ', 'CB', 'CP', 'Σ Dobras'],
        body: p.an.hist.map((h) => [dt(h.data), h.peso, h.altura, h.imc, h.cc, h.ca, h.cq, h.cb, h.cp, h.dobras]),
      },
    ]);
  }

  // 8. Exames
  const dates = p.ex.dates;
  const labRows = [];
  LAB_EXAMS.forEach((e) => labRows.push({ id: e.k, label: `${e.n}${e.u ? ' (' + e.u + ')' : ''}` }));
  p.ex.custom.filter((c) => filled(c.nome)).forEach((c) => labRows.push({ id: c.id, label: `${c.nome}${c.unit ? ' (' + c.unit + ')' : ''}` }));
  const labBody = labRows
    .filter((r) => dates.some((d) => filled(labValue(d, r.id, labCtx(p)))))
    .map((r) => [r.label, ...dates.map((d) => labCellText(p, d, r.id))]);
  const sel = selectedExams(p);
  const altered = alteredExams(p);
  add('8. Exames Laboratoriais', [R('Exames solicitados', sel.join('; ')), R('Exames alterados (última coleta)', altered.join('; '))], [
    { title: 'Resultados', head: ['Exame', ...dates.map((d, i) => (filled(d.data) ? dt(d.data) : `Coleta ${i + 1}`))], body: labBody, wide: true },
  ]);

  // 9. Dx
  add('9. Diagnóstico Nutricional, Conduta e Evolução', [
    R('Diagnóstico nutricional', p.dx.diag), R('Conduta dietoterápica', p.dx.conduta),
    R('Metas de curto prazo', p.dx.metas), R('Orientações', p.dx.orient),
  ], [
    { title: 'Evolução clínica', head: ['Data', 'Evolução'], body: [...p.dx.evol].filter((e) => filled(e.texto) || filled(e.data)).sort((a, b) => (a.data || '').localeCompare(b.data || '')).map((e) => [dt(e.data), e.texto]) },
  ]);
  return secs;
}

export function selectedExams(p) {
  const list = REQUEST_EXAMS.filter((e) => p.ex.req[e.k]).map((e) => e.n);
  String(p.ex.extras || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean).forEach((s) => list.push(s));
  return list;
}

// ---------- Exames: valores efetivos, semáforo e alterados ----------
function labCtx(p) {
  const a = ageOf(p);
  return { sex: p.p.sexo, age: a ? a.years : null };
}
function labCellText(p, d, key) {
  const v = labValue(d, key, labCtx(p));
  if (!v) return '';
  const s = evalExam(key, v, p.p.sexo);
  return s && (s.tone === 'warn' || s.tone === 'bad') ? `${v} (${s.label})` : v;
}
/** Exames fora do ideal na coleta mais recente em que cada exame aparece. */
export function alteredExams(p) {
  const ctx = labCtx(p);
  const dates = p.ex.dates
    .map((d, i) => ({ d, i }))
    .sort((a, b) => (a.d.data || '').localeCompare(b.d.data || '') || a.i - b.i)
    .map((x) => x.d);
  const out = [];
  LAB_EXAMS.forEach((e) => {
    for (let j = dates.length - 1; j >= 0; j--) {
      const v = labValue(dates[j], e.k, ctx);
      if (!v) continue;
      const s = evalExam(e.k, v, p.p.sexo);
      if (s && (s.tone === 'warn' || s.tone === 'bad')) out.push(`${e.n} ${v}${e.u ? ' ' + e.u : ''} (${s.label})`);
      break;
    }
  });
  return out;
}

// ---------- Resumo textual ----------
export function buildSummary(p, S = {}) {
  const lines = [];
  lines.push(`ANAMNESE NUTRICIONAL${filled(p.p.nome) ? ' — ' + p.p.nome : ''}`);
  if (filled(S.nome) || filled(S.clinica)) lines.push(`Profissional: ${join([S.nome, S.crn && `CRN ${S.crn}`, S.clinica], ' · ')}`);
  buildSections(p).forEach((s) => {
    lines.push('', `## ${s.title.toUpperCase()}`);
    s.rows.forEach(([l, v]) => lines.push(`${l}: ${String(v).replace(/\r?\n/g, ' / ')}`));
    s.tables.forEach((t) => {
      if (t.title) lines.push(`${t.title}:`);
      t.body.forEach((r) => lines.push('- ' + r.filter(filled).map((c) => String(c).replace(/\r?\n/g, ' / ')).join(' | ')));
    });
  });
  return lines.join('\n');
}

// ---------- Impressão ----------
function header(S, title) {
  const logo = filled(S.logo) ? `<img class="plogo" src="${esc(S.logo)}" alt="Logo da clínica">` : '';
  const leftText = [filled(S.clinica) ? `<strong>${esc(S.clinica)}</strong>` : '<strong>Nutrição Clínica</strong>', esc(join([S.end, S.tel], ' · '))].filter(filled).join('<br>');
  const left = logo ? `<div class="phead-brand">${logo}<div>${leftText}</div></div>` : leftText;
  const right = [filled(S.nome) ? `<strong>${esc(S.nome)}</strong>` : '', filled(S.crn) ? `CRN ${esc(S.crn)}` : ''].filter(filled).join('<br>');
  return `<header class="phead"><div>${left}</div><div class="r">${right}</div></header><h1 class="ptitle">${esc(title)}</h1>`;
}
function footer(S) {
  return `<footer class="pfoot">${esc(join([S.nome, S.crn && 'CRN ' + S.crn, S.clinica, S.end, S.tel], ' · '))}</footer>`;
}
const patientBar = (p) => {
  const age = ageOf(p);
  return `<div class="pbar"><span><b>Paciente:</b> ${esc(p.p.nome) || '—'}</span>${filled(p.p.nasc) ? `<span><b>Nasc.:</b> ${esc(dt(p.p.nasc))}${age ? ' (' + age.years + ' anos)' : ''}</span>` : ''}${filled(p.p.sexo) ? `<span><b>Sexo:</b> ${esc(p.p.sexo)}</span>` : ''}<span><b>Data:</b> ${esc(dt(p.p.data)) || '—'}</span></div>`;
};

export function buildAnamnesePrint(p, S = {}) {
  const body = buildSections(p)
    .map((s) => {
      const rows = s.rows.length
        ? `<table class="kv">${s.rows.map(([l, v]) => `<tr><th>${esc(l)}</th><td>${esc(v)}</td></tr>`).join('')}</table>`
        : '';
      const tabs = s.tables
        .map((t) => `${t.title ? `<h3>${esc(t.title)}</h3>` : ''}<table class="dt${t.wide ? ' wide' : ''}"><thead><tr>${t.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.body.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`)
        .join('');
      return `<section class="pblock"><h2>${esc(s.title)}</h2>${rows}${tabs}</section>`;
    })
    .join('');
  return `<div class="pdoc">${header(S, 'Ficha de Anamnese Nutricional')}${patientBar(p)}${body}
    <div class="psign"><div class="line"></div><div>${esc(S.nome) || 'Assinatura do profissional'}${filled(S.crn) ? ' — CRN ' + esc(S.crn) : ''}</div></div>${footer(S)}</div>`;
}

export function buildExamesPrint(p, S = {}) {
  const list = selectedExams(p);
  const items = list.map((e) => `<li><span class="box"></span>${esc(e)}</li>`).join('');
  return `<div class="pdoc">${header(S, 'Solicitação de Exames Laboratoriais')}${patientBar(p)}
    <section class="pblock"><h2>Exames solicitados</h2><ul class="exlist">${items}</ul></section>
    ${filled(p.ex.just) ? `<section class="pblock"><h2>Justificativa clínica</h2><p class="ptext">${esc(p.ex.just)}</p></section>` : ''}
    <div class="psign sign2"><div class="when">Data: ${esc(dt(p.ex.reqData || p.p.data))}</div>
    <div class="signbox"><div class="stamp">Carimbo</div><div><div class="line"></div><div>${esc(S.nome) || 'Assinatura do profissional'}${filled(S.crn) ? ' — CRN ' + esc(S.crn) : ''}</div></div></div></div>${footer(S)}</div>`;
}

// ---------- Rascunho de diagnóstico ----------
export function draftDiagnosis(p) {
  const age = ageOf(p);
  const an = anthroOf(p);
  const parts = [];
  const sexo = p.p.sexo === 'Feminino' ? 'do sexo feminino' : p.p.sexo === 'Masculino' ? 'do sexo masculino' : '';
  parts.push(`Paciente ${sexo}${sexo && age ? ', ' : ''}${age ? age.years + ' anos' : ''}${p.p.tipo === 'Retorno' ? ', em retorno' : ', em primeira consulta'}.`.replace('Paciente ,', 'Paciente'));
  const motivo = Object.entries(p.p.tags || {}).filter(([, v]) => v).map(([k]) => k.toLowerCase());
  if (motivo.length || filled(p.p.motivo)) parts.push(`Procura atendimento por ${join([motivo.join(', '), p.p.motivo && p.p.motivo.replace(/\.$/, '')], '; ')}.`);
  const ant = [];
  if (an.pediatric) {
    if (an.pediatric.indicators.length) {
      an.pediatric.indicators.forEach((ind) => {
        ant.push(`${ind.code} ${ind.valueText} (Z ${ind.zText} · ${ind.pText} · ${ind.label})`);
      });
    } else if (an.imc !== null) {
      ant.push(`IMC de ${C.fmt(an.imc)} kg/m² (classificar por Escore-Z OMS)`);
    }
    if (an.variation) ant.push(`variação ponderal de ${an.variation.kg > 0 ? '+' : ''}${C.fmt(an.variation.kg)} kg (${C.fmt(an.variation.pct)}%) em relação ao peso habitual`);
    if (ant.length) parts.push('Avaliação antropométrica pediátrica (OMS/SISVAN): ' + ant.join('; ') + '.');
  } else {
    if (an.imc !== null) ant.push(`IMC de ${C.fmt(an.imc)} kg/m² (${an.imcClass.short})`);
    if (an.rce !== null) ant.push(`RCE de ${C.fmt(an.rce, 2)} (${an.rce >= 0.5 ? 'risco metabólico aumentado' : 'sem risco aumentado'})`);
    if (an.rcq !== null) ant.push(`RCQ de ${C.fmt(an.rcq, 2)}${an.rcqClass && an.rcqClass.tone ? ' (' + (an.rcqClass.tone === 'bad' ? 'risco cardiovascular elevado' : 'sem risco elevado') + ')' : ''}`);
    if (an.variation) ant.push(`variação ponderal de ${an.variation.kg > 0 ? '+' : ''}${C.fmt(an.variation.kg)} kg (${C.fmt(an.variation.pct)}%) em relação ao peso habitual`);
    if (an.cmb !== null) ant.push(`CMB de ${C.fmt(an.cmb)} cm`);
    if (an.bodyFat && an.bodyFat.valid) {
      let bfTxt = `%GC de ${C.fmt(an.bodyFat.bodyFatPct)}% (Durnin & Womersley)`;
      if (an.bodyFat.fatMassKg !== null) bfTxt += ` — MG ${C.fmt(an.bodyFat.fatMassKg)} kg e MLG ${C.fmt(an.bodyFat.leanMassKg)} kg`;
      ant.push(bfTxt);
    }
    if (ant.length) parts.push('Avaliação antropométrica: ' + ant.join('; ') + '.');
  }
  if (p.gi.bristol.length) parts.push(`Escala de Bristol: ${bristolText(p.gi.bristol)}.`);
  const pats = PATOLOGIAS.filter(([k]) => p.h.pat[k] && p.h.pat[k].on).map(([k, l]) => {
    if (k === 'dm' && filled(p.h.dmTipo)) return `diabetes (${p.h.dmTipo})`;
    const s = l.replace(/\s*\(.*\)/, '');
    return /^[A-Z]{2,}/.test(s) ? s : s.toLowerCase();
  });
  if (pats.length) parts.push(`Condições clínicas: ${pats.join(', ')}.`);
  if (p.h.pat.tea && p.h.pat.tea.on && p.h.tea) {
    const t = p.h.tea;
    const det = [
      filled(t.seletividade) && `seletividade alimentar ${t.seletividade.toLowerCase()}`,
      filled(t.repertorio) && `repertório de ${t.repertorio}`,
    ].filter(Boolean);
    if (filled(t.suporte) || det.length) {
      parts.push(`No contexto de TEA${filled(t.suporte) ? ` (${t.suporte})` : ''}${det.length ? `, apresenta ${det.join(' e ')}` : ''}.`);
    }
  }
  const sono = C.sleepHours(p.v.dorme, p.v.acorda);
  if (sono && sono.hours < 7) parts.push(`Sono reduzido (${sono.text}).`);
  const alt = alteredExams(p);
  if (alt.length) parts.push(`Exames laboratoriais alterados (última coleta): ${alt.join('; ')}.`);
  const goal = C.hydrationGoalForPatient(an.peso, age ? age.years : null, p.p.sexo);
  const agua = C.parseBRNumber(p.a.agua);
  if (goal && agua) {
    const l = p.a.aguaUnid === 'copos' ? agua * 0.2 : agua;
    if (l < goal.litros) parts.push(`Ingestão hídrica (${C.fmt(l, 1)} L) abaixo da meta estimada (${C.fmt(goal.litros, 1)} L/dia).`);
  }
  parts.push('Diagnóstico nutricional a ser complementado com avaliação do consumo alimentar e exames laboratoriais.');
  return parts.join(' ');
}
