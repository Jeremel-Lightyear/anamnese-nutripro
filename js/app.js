// Renderização das abas, eventos, drawer de pacientes e autosave
import * as C from './calculations.js';
import {
  KEYS, storage, get, set, isFilled, uid, newMeal,
  TAGS_MOTIVO, PATOLOGIAS, DM_TIPOS, FAMILIA, SINTOMAS_GI, FREQ_SINTOMA, BUCAL, SEMIO, EQUIP,
  FREQ_OPCOES, FREQ_ITEMS, LOCAIS, URINA,
  TEA_SUPORTE, TEA_SELETIVIDADE, TEA_GATILHOS, TEA_REPERTORIO, TEA_EQUIPE,
  loadSettings, saveSettings, loadPatients, savePatients, createPatient, duplicatePatient, samplePatient,
  exportBackup, importBackup,
} from './state.js';
import { renderBristolCards, openPatientMode, bristolText, BRISTOL } from './bristol.js';
import { LAB_EXAMS, REQUEST_EXAMS, COMBOS } from './exams-data.js';
import { esc, ageOf, anthroOf, buildSummary, buildAnamnesePrint, buildExamesPrint, selectedExams, draftDiagnosis } from './export.js';

// ---------- Estado da aplicação ----------
let settings = loadSettings();
let patients = loadPatients();
let P = null;
let tab = Number(storage.get(KEYS.tab)) || 0;
let sub = 'reg';
let search = '';
const $ = (s) => document.querySelector(s);
const view = $('#view');
const V = (path) => get(P, path);

// ---------- Helpers de campo ----------
const attrs = (path, o = {}) => `data-k="${path}"${o.rr ? ' data-rr="1"' : ''}`;
function inp(path, label, o = {}) {
  return `<label class="fld ${o.cls || ''}"><span>${label}</span><input ${attrs(path, o)} type="${o.type || 'text'}" value="${esc(V(path))}"${o.ph ? ` placeholder="${esc(o.ph)}"` : ''}${o.im ? ` inputmode="${o.im}"` : ''}${o.list ? ` list="${o.list}"` : ''}>${o.hint ? `<small>${o.hint}</small>` : ''}</label>`;
}
const num = (path, label, o = {}) => inp(path, label, { im: 'decimal', ...o });
function area(path, label, o = {}) {
  return `<label class="fld ${o.cls || 'full'}"><span>${label}</span><textarea ${attrs(path, o)} rows="${o.rows || 3}"${o.ph ? ` placeholder="${esc(o.ph)}"` : ''}>${esc(V(path))}</textarea></label>`;
}
function seg(path, label, opts, o = {}) {
  const cur = V(path);
  return `<div class="fld ${o.cls || ''}"><span>${label}</span><div class="seg" role="radiogroup">${opts
    .map((op) => `<label class="chip"><input type="radio" name="${path}" ${attrs(path, o)} value="${esc(op)}"${cur === op ? ' checked' : ''}><span>${esc(op)}</span></label>`)
    .join('')}</div></div>`;
}
function sel(path, label, opts, o = {}) {
  const cur = V(path);
  return `<label class="fld ${o.cls || ''}"><span>${label}</span><select ${attrs(path, o)}><option value="">—</option>${opts
    .map((op) => `<option value="${esc(op)}"${cur === op ? ' selected' : ''}>${esc(op)}</option>`)
    .join('')}</select></label>`;
}
const chk = (path, label, o = {}) =>
  `<label class="chip chk ${o.cls || ''}"><input type="checkbox" ${attrs(path, o)}${V(path) ? ' checked' : ''}><span>${label}</span></label>`;
const tog = (path, label, o = {}) =>
  `<label class="toggle"><input type="checkbox" ${attrs(path, o)}${V(path) ? ' checked' : ''}><span class="track"></span><b>${label}</b></label>`;
const SPRITES = {
  bulbasaur: './assets/sprites/bulbasaur.png',
  charmander: './assets/sprites/charmander.png',
  pikachu: './assets/sprites/pikachu.png',
  squirtle: './assets/sprites/squirtle.png',
  chansey: './assets/sprites/chansey.png',
  snorlax: './assets/sprites/snorlax.png',
  munchlax: './assets/sprites/munchlax.png',
};
const PARTNERS = {
  bulbasaur: { name: 'Bulbasaur', num: '#001', src: SPRITES.bulbasaur, bg: './assets/bg/bulbasaur.png' },
  charmander: { name: 'Charmander', num: '#004', src: SPRITES.charmander, bg: './assets/bg/charmander.png' },
  squirtle: { name: 'Squirtle', num: '#007', src: SPRITES.squirtle, bg: './assets/bg/squirtle.png' },
  pikachu: { name: 'Pikachu', num: '#025', src: SPRITES.pikachu, bg: './assets/bg/pikachu.png' },
};
let partner = PARTNERS[storage.get(KEYS.partner)] ? storage.get(KEYS.partner) : 'bulbasaur';
let skin = storage.get(KEYS.skin) === 'clean' ? 'clean' : 'nutridex';
let stamps = storage.get(KEYS.stamps) !== 'off';
let bgOn = storage.get(KEYS.bg) !== 'off';

const SVG_RM = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const SVG_PREV = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
const SVG_NEXT = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
const SVG_CHK = '<svg class="tab-check" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

const pokeBadge = (id, tip = '') =>
  `<span class="poke-badge" title="${esc(tip)}" aria-hidden="true"><img class="sprite" src="${SPRITES[id]}" alt="" width="44" height="44"></span>`;
const card = (title, body, cls = '', stamp = null) =>
  `<section class="card ${cls}"><div class="card-head"><h2>${title}</h2>${stamp ? pokeBadge(stamp.id, stamp.tip) : ''}</div>${body}</section>`;
const grid = (...items) => `<div class="grid">${items.join('')}</div>`;
const calc = (name, cls = '') => `<div class="computed ${cls}" data-calc="${name}"></div>`;
const addBtn = (list, label) => `<button type="button" class="btn ghost" data-act="add" data-list="${list}">+ ${label}</button>`;
const rmBtn = (list, i) => `<button type="button" class="btn icon danger" data-act="rm" data-list="${list}" data-i="${i}" aria-label="Remover" title="Remover">${SVG_RM}</button>`;
const hpBar = (pct, tone = 'info', segs = 10) => {
  const filled = Math.max(0, Math.min(segs, Math.round((pct / 100) * segs)));
  return `<div class="hp-bar ${tone}" aria-hidden="true">${Array.from({ length: segs }, (_, i) => `<i${i < filled ? ' class="on"' : ''}></i>`).join('')}</div>`;
};
const mcard = (t, v, sub2 = '', tone = '', hp = null) =>
  `<div class="mcard ${tone}"><small class="mono">${t}</small><b class="mono">${v}</b>${hp !== null ? hpBar(hp, tone || 'info') : ''}<span>${sub2}</span></div>`;

/** Lista dinâmica em linhas: cols = [{k,label,ph,type,opts,w}] */
function listRows(list, cols, addLabel, emptyMsg) {
  const arr = V(list) || [];
  const rows = arr
    .map((it, i) => `<div class="lrow">${cols
      .map((c) => {
        const path = `${list}.${i}.${c.k}`;
        return c.opts ? sel(path, c.label, c.opts, { cls: c.w || '' }) : inp(path, c.label, { ph: c.ph, type: c.type, im: c.im, cls: c.w || '' });
      })
      .join('')}${rmBtn(list, i)}</div>`)
    .join('');
  return `<div class="list">${rows || `<p class="muted">${emptyMsg}</p>`}</div>${addBtn(list, addLabel)}`;
}

const NEW = {
  'h.meds': () => ({ nome: '', dose: '', hor: '' }),
  'h.sups': () => ({ nome: '', dose: '', freq: '' }),
  'v.afList': () => ({ mod: '', freq: '', hor: '', dur: '', tempo: '', int: '' }),
  'ex.dates': () => ({ data: C.todayISO(), v: {} }),
  'ex.custom': () => ({ id: 'c' + uid(), nome: '', unit: '' }),
  'dx.evol': () => ({ data: C.todayISO(), texto: '' }),
  'r.meals': () => newMeal('Refeição extra (pré/pós-treino ou beliscos)', true),
};

// ---------- Abas ----------
function tabIdent() {
  const fem = P.p.sexo === 'Feminino';
  return `
  ${card('Identificação', grid(
    inp('p.data', 'Data do atendimento', { type: 'date' }),
    seg('p.tipo', 'Tipo de consulta', ['1ª Consulta', 'Retorno']),
    inp('p.nome', 'Nome completo', { cls: 'span2', ph: 'Nome do paciente' }),
    inp('p.nasc', 'Data de nascimento', { type: 'date', rr: true }),
    `<div class="fld"><span>Idade exata</span>${calc('age')}</div>`,
    seg('p.sexo', 'Sexo biológico', ['Masculino', 'Feminino'], { rr: true }),
    inp('p.cpf', 'CPF / Prontuário (opcional)'),
    inp('p.tel', 'Telefone', { type: 'tel', ph: '(00) 00000-0000' }),
    inp('p.cidade', 'Cidade'),
    inp('p.prof', 'Profissão / Ocupação')
  ), '', { id: 'pikachu', tip: '#025 Pikachu · Energia e Identificação' })}
  ${card('Situações especiais', `<div class="toggles">${tog('p.menor', 'Paciente menor de 18 anos', { rr: true })}${fem ? tog('p.gestante', 'Gestante', { rr: true }) : ''}</div>
    ${P.p.menor ? `<div class="sub">${grid(inp('p.mae', 'Nome da mãe'), inp('p.maeProf', 'Profissão da mãe'), inp('p.pai', 'Nome do pai ou responsável'), inp('p.paiProf', 'Profissão do pai ou responsável'))}</div>` : ''}
    ${fem && P.p.gestante ? `<div class="sub">${grid(num('p.ig', 'Semana gestacional (IG)', { ph: 'ex.: 20' }), num('p.ppg', 'Peso pré-gestacional (kg)', { ph: 'ex.: 62,5' }), `<div class="fld"><span>IMC pré-gestacional</span>${calc('gest')}</div>`)}</div>` : ''}`)}
  ${card('Motivo da procura / Queixa principal', `<div class="seg wrap">${TAGS_MOTIVO.map((t) => chk('p.tags.' + t, t)).join('')}</div>${area('p.motivo', 'Queixa principal', { rows: 3, ph: 'Descreva o motivo da consulta com as palavras do paciente' })}`)}
  ${card('Histórico de acompanhamentos e dietas anteriores', `${seg('p.dietasPrev', 'Já fez dieta ou acompanhamento antes?', ['Não', 'Sim'])}${area('p.dietasObs', 'O que funcionou e quais foram as maiores dificuldades de adesão?', { rows: 3 })}`)}`;
}

function tabHPP() {
  const fem = P.p.sexo === 'Feminino';
  const pats = PATOLOGIAS.map(([k, l]) => `<div class="pat">${chk('h.pat.' + k + '.on', l, k === 'tea' ? { rr: true } : {})}
    ${k === 'dm' ? `<select class="dmtipo" data-k="h.dmTipo" aria-label="Tipo de diabetes"><option value="">Tipo…</option>${DM_TIPOS.map((t) => `<option${V('h.dmTipo') === t ? ' selected' : ''}>${t}</option>`).join('')}</select>` : ''}
    <input class="obs" data-k="h.pat.${k}.obs" value="${esc(V('h.pat.' + k + '.obs'))}" placeholder="${k === 'cirurg' ? 'Qual cirurgia e quando' : 'Há quanto tempo / observações'}"></div>`).join('');
  const teaOn = !!(P.h.pat.tea && P.h.pat.tea.on);
  const teaBlock = teaOn
    ? card('Nutrição no TEA', `
      ${grid(
        seg('h.tea.suporte', 'Nível de suporte', TEA_SUPORTE),
        seg('h.tea.seletividade', 'Seletividade alimentar', TEA_SELETIVIDADE)
      )}
      <div class="fld full"><span>Gatilhos sensoriais e rigidez</span><div class="seg wrap">${TEA_GATILHOS.map(([k, l]) => chk('h.tea.gatilhos.' + k, l)).join('')}</div></div>
      ${grid(
        seg('h.tea.repertorio', 'Repertório aproximado de alimentos aceitos', TEA_REPERTORIO),
        area('h.tea.repertorioObs', 'Observações (alimentos-âncora e aceitação de frutas/vegetais/proteínas)', { cls: 'span2', rows: 2, ph: 'Ex.: aceita apenas arroz branco, batata frita e banana; recusa folhosos e carnes desfiadas' })
      )}
      <div class="fld full"><span>Acompanhamento multidisciplinar</span><div class="seg wrap">${TEA_EQUIPE.map(([k, l]) => chk('h.tea.equipe.' + k, l)).join('')}</div></div>
    `, 'tea-card')
    : '';
  return `
  ${card('Condições clínicas e diagnósticos', `<div class="pats">${pats}</div>`, '', { id: 'chansey', tip: '#113 Chansey · Saúde Clínica' })}
  ${teaBlock}
  ${card('Histórico familiar (pais e irmãos)', `<div class="seg wrap">${FAMILIA.map(([k, l]) => chk('h.fam.' + k, l)).join('')}</div>${inp('h.fam.outros', 'Outros', { ph: 'Outras doenças na família' })}`)}
  ${card('Medicamentos de uso contínuo', listRows('h.meds', [{ k: 'nome', label: 'Fármaco', w: 'grow' }, { k: 'dose', label: 'Dose' }, { k: 'hor', label: 'Horário de tomada' }], 'Adicionar medicamento', 'Nenhum medicamento registrado.'))}
  ${card('Suplementos', listRows('h.sups', [{ k: 'nome', label: 'Nome/Tipo', ph: 'Whey, Creatina, Vitamina D, Multivitamínico, Ômega 3…', w: 'grow' }, { k: 'dose', label: 'Dose' }, { k: 'freq', label: 'Frequência' }], 'Adicionar suplemento', 'Nenhum suplemento registrado.'))}
  ${card('Alergias × Intolerâncias', grid(
    `<div class="split">${seg('h.alergia', 'Alergias alimentares', ['Não', 'Sim'], { rr: true })}${V('h.alergia') === 'Sim' ? inp('h.alergiaQuais', 'Quais?', { ph: 'ex.: APLV, camarão, amendoim' }) : ''}</div>`,
    `<div class="split">${seg('h.intol', 'Intolerâncias / Sensibilidades alimentares', ['Não', 'Sim'], { rr: true })}${V('h.intol') === 'Sim' ? inp('h.intolQuais', 'Quais e grau de tolerância?', { ph: 'ex.: lactose (tolera 1/2 copo), glúten, FODMAPs' }) : ''}</div>`
  ))}
  ${fem ? card('Saúde da mulher', grid(
    seg('h.ciclo', 'Ciclo menstrual', ['Regular', 'Irregular', 'Amenorreia', 'Menopausa']),
    `<div class="split">${seg('h.anticoncepcional', 'Usa anticoncepcional?', ['Não', 'Sim'], { rr: true })}${V('h.anticoncepcional') === 'Sim' ? inp('h.anticQual', 'Qual?') : ''}</div>`,
    seg('h.tpm', 'Sintomas intensos de TPM?', ['Não', 'Sim'])
  )) : ''}`;
}

function tabGI() {
  const g = P.gi;
  const sint = `<div class="table-wrap"><table class="tbl"><thead><tr><th>Sintoma</th>${FREQ_SINTOMA.map((f) => `<th>${f}</th>`).join('')}</tr></thead><tbody>${SINTOMAS_GI.map(([k, l]) => `<tr><th>${l}</th>${FREQ_SINTOMA.map((f) => `<td><label class="chip mini"><input type="radio" name="gi.sint.${k}" data-k="gi.sint.${k}" value="${f}"${g.sint[k] === f ? ' checked' : ''}><span>${f}</span></label></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  return `
  ${card('Escala de Bristol', `<div class="toolbar"><button type="button" class="btn primary" data-act="bristol-patient">Mostrar ao Paciente (Tela Cheia)</button>${tog('gi.bristolAlt', 'Hábito alternado (até 2 tipos)', { rr: true })}</div>
    <div class="bristol-grid">${renderBristolCards(g.bristol)}</div>
    <div class="fld"><span>Classificação registrada</span>${calc('bristol')}</div>`, '', { id: 'bulbasaur', tip: '#001 Bulbasaur · Fibras e Intestino' })}
  ${card('Hábito intestinal detalhado', grid(
    seg('gi.freq', 'Frequência evacuatória', ['>2x/dia', '1 a 2x/dia', 'A cada 2 dias', 'A cada 3 dias', '>3 dias sem evacuar']),
    seg('gi.esforco', 'Esforço evacuatório', ['Não', 'Às vezes', 'Frequente/Sempre']),
    seg('gi.incompleta', 'Sensação de evacuação incompleta', ['Não', 'Às vezes', 'Frequente']),
    `<div class="split">${seg('gi.dor', 'Dor ao evacuar ou uso de laxantes', ['Não', 'Sim'], { rr: true })}${g.dor === 'Sim' ? inp('gi.laxQual', 'Qual laxante / frequência / tipo de dor') : ''}</div>`
  ))}
  ${card('Sintomas gastrointestinais', sint)}
  ${card('Mastigação, deglutição e saúde bucal', grid(
    seg('gi.mastig', 'Qualidade da mastigação', ['Adequada', 'Come muito rápido / mastiga pouco', 'Dificuldade para mastigar']),
    seg('gi.disfagia', 'Disfagia / Engasgos', ['Não', 'Para sólidos', 'Para líquidos', 'Ambos']),
    `<div class="fld full"><span>Saúde bucal / dentição</span><div class="seg wrap">${BUCAL.map(([k, l]) => chk('gi.bucal.' + k, l)).join('')}</div></div>`
  ))}
  ${card('Semiologia nutricional (rastreio de sinais clínicos)', `<div class="seg wrap">${SEMIO.map(([k, l]) => chk('gi.semio.' + k, l)).join('')}</div>${area('gi.semioObs', 'Observações', { rows: 2 })}`)}`;
}

function tabRotina() {
  const v = P.v;
  const af = v.af === 'Sim'
    ? `<div class="list">${v.afList.map((a, i) => `<div class="lrow af">${inp(`v.afList.${i}.mod`, 'Modalidade', { ph: 'Musculação, corrida…', cls: 'grow' })}${inp(`v.afList.${i}.freq`, 'Vezes/semana', { im: 'numeric' })}${inp(`v.afList.${i}.hor`, 'Horário habitual', { type: 'time' })}${inp(`v.afList.${i}.dur`, 'Duração (min)', { im: 'numeric' })}${inp(`v.afList.${i}.tempo`, 'Há quanto tempo', { ph: 'ex.: 6 meses' })}${sel(`v.afList.${i}.int`, 'Intensidade', ['Leve', 'Moderada', 'Intensa'])}${rmBtn('v.afList', i)}</div>`).join('') || '<p class="muted">Adicione a(s) modalidade(s).</p>'}</div>${addBtn('v.afList', 'Adicionar modalidade')}`
    : '';
  return `
  ${card('Sono', grid(
    inp('v.dorme', 'Horário que dorme', { type: 'time' }), inp('v.acorda', 'Horário que acorda', { type: 'time' }),
    `<div class="fld"><span>Total de horas de sono</span>${calc('sono')}</div>`,
    seg('v.qualSono', 'Qualidade do sono', ['Reparador', 'Acorda à noite', 'Insônia / Dificuldade para dormir'], { cls: 'full' })
  ), '', { id: 'snorlax', tip: '#143 Snorlax · Sono e Recuperação' })}
  ${card('Rotina diária', grid(
    `<div class="split">${seg('v.estuda', 'Estuda?', ['Não', 'Sim'], { rr: true })}${v.estuda === 'Sim' ? inp('v.estudaHor', 'Horário') : ''}</div>`,
    `<div class="split">${seg('v.trabalha', 'Trabalha?', ['Não', 'Sim'], { rr: true })}${v.trabalha === 'Sim' ? inp('v.trabHor', 'Horário') : ''}</div>`,
    v.trabalha === 'Sim' ? seg('v.esforco', 'Esforço físico no trabalho', ['Sedentário', 'Leve', 'Moderado', 'Intenso']) : '',
    num('v.tela', 'Tempo de tela diário (h/dia)'),
    `<div class="fld"><span>Nível de estresse percebido: <b data-calc="estresse" class="inl"></b></span><input type="range" min="1" max="10" step="1" data-k="v.estresse" value="${esc(v.estresse || 5)}"><div class="scale"><small>1 · calmo</small><small>10 · muito estressado</small></div></div>`
  ))}
  ${card('Contexto domiciliar e prático', grid(
    inp('v.mora', 'Com quem mora?'), inp('v.compras', 'Quem faz as compras?'), inp('v.prepara', 'Quem prepara as refeições?'),
    `<div class="fld full"><span>Equipamentos disponíveis</span><div class="seg wrap">${EQUIP.map(([k, l]) => chk('v.equip.' + k, l)).join('')}</div></div>`
  ))}
  ${card('Atividade física', `${seg('v.af', 'Pratica atividade física?', ['Não', 'Sim'], { rr: true })}${af}`, '', { id: 'charmander', tip: '#004 Charmander · Gasto Energético' })}
  ${card('Tabagismo e álcool', grid(
    `<div class="split">${seg('v.fuma', 'Fuma?', ['Não', 'Sim', 'Ex-fumante'], { rr: true })}${v.fuma === 'Sim' ? grid(inp('v.fumaTipo', 'Tipo', { ph: 'cigarro, palheiro, vape…' }), inp('v.fumaQtd', 'Quantidade/dia', { im: 'numeric' })) : ''}</div>`,
    `<div class="split">${seg('v.alcool', 'Bebida alcoólica?', ['Não', 'Sim'], { rr: true })}${v.alcool === 'Sim' ? grid(inp('v.alcTipo', 'Tipo de bebida'), inp('v.alcFreq', 'Frequência semanal'), inp('v.alcQtd', 'Quantidade por ocasião')) : ''}</div>`
  ))}`;
}

function tabAlimentar() {
  const a = P.a;
  const urina = `<div class="fld"><span>Cor predominante da urina</span><div class="seg wrap">${URINA.map(([n, c]) => `<label class="chip urina"><input type="radio" name="a.urina" data-k="a.urina" value="${esc(n)}"${a.urina === n ? ' checked' : ''}><span><i class="sw" style="background:${c}"></i>${n}</span></label>`).join('')}</div></div>`;
  const freq = FREQ_ITEMS.map(([k, l, ph, opts]) => `<div class="frow"><div class="fname">${l}</div><div class="seg wrap">${(opts || FREQ_OPCOES).map((o) => `<label class="chip mini"><input type="radio" name="a.freq.${k}.f" data-k="a.freq.${k}.f" value="${esc(o)}"${a.freq[k].f === o ? ' checked' : ''}><span>${o}</span></label>`).join('')}</div><input data-k="a.freq.${k}.obs" value="${esc(a.freq[k].obs)}" placeholder="${esc(ph)}" aria-label="Observação: ${esc(l)}"></div>`).join('');
  return `
  ${card('Comportamento alimentar', grid(
    seg('a.tvCel', 'Come assistindo TV ou mexendo no celular?', ['Sempre', 'Às vezes', 'Nunca']),
    inp('a.horaFome', 'Horário do dia em que sente mais fome'),
    seg('a.apetite', 'Apetite em ansiedade/estresse', ['Não altera', 'Aumenta / Compulsão', 'Perde a fome']),
    inp('a.apetiteRelato', 'Relato', { cls: 'span2' }),
    seg('a.fds', 'Alimentação nos finais de semana', ['Igual à semana', 'Piora muito', 'Melhora']),
    inp('a.fdsDesc', 'Descrição', { cls: 'span2' }),
    area('a.preferidos', 'Alimentos preferidos', { cls: 'span2', rows: 2 }),
    area('a.aversoes', 'Aversões / Alimentos que não gosta ou fazem mal', { cls: 'span2', rows: 2 })
  ))}
  ${card('Hidratação', grid(
    num('a.agua', 'Ingestão de água pura', { ph: 'ex.: 1,5' }),
    seg('a.aguaUnid', 'Unidade', ['L', 'copos'], { rr: true }),
    `<div class="fld full"><span>Meta hídrica sugerida (35 ml/kg)</span>${calc('hid')}</div>`,
    `<div class="full">${urina}</div>`
  ) + `<p class="muted small">"L" = litros por dia; "copos" = copos de 200 ml por dia.</p>`, '', { id: 'squirtle', tip: '#007 Squirtle · Meta Hídrica' })}
  ${card('Frequência alimentar semiquantitativa', `<div class="ftable">${freq}</div>`)}`;
}

function tabRecord() {
  const meals = P.r.meals.map((m, i) => `<div class="meal${m.nao ? ' off' : ''}">
    <div class="mhead">${m.extra ? `<input class="mname" data-k="r.meals.${i}.nome" value="${esc(m.nome)}" aria-label="Nome da refeição">` : `<h3>${esc(m.nome)}</h3>`}
      ${chk(`r.meals.${i}.nao`, 'Não realiza', { rr: true })}${m.extra ? rmBtn('r.meals', i) : ''}</div>
    ${m.nao ? '' : `<div class="grid">${inp(`r.meals.${i}.hor`, 'Horário', { type: 'time' })}${sel(`r.meals.${i}.local`, 'Local', LOCAIS)}${area(`r.meals.${i}.desc`, 'Alimentos e medidas caseiras', { cls: 'span2', rows: 2, ph: 'ex.: 1 pão francês com 1 col. sopa de requeijão; 1 xícara de café com leite' })}</div>`}</div>`).join('');
  return card('Recordatório alimentar habitual (rotina 24h)', `<div class="meals">${meals}</div>${addBtn('r.meals', 'Adicionar refeição extra')}`, '', { id: 'munchlax', tip: '#446 Munchlax · Rotina Alimentar' });
}

function tabAntro() {
  const an = P.an;
  const hist = an.hist.length
    ? `<div class="table-wrap"><table class="tbl"><thead><tr><th>Data</th><th>Peso</th><th>Altura</th><th>IMC</th><th>CC</th><th>CA</th><th>CQ</th><th>CB</th><th>CP</th><th>Σ Dobras</th><th></th></tr></thead><tbody>${an.hist.map((h, i) => `<tr><td>${esc(C.fmtDateBR(h.data))}</td><td>${esc(h.peso) || '—'}</td><td>${esc(h.altura) || '—'}</td><td>${esc(h.imc) || '—'}</td><td>${esc(h.cc) || '—'}</td><td>${esc(h.ca) || '—'}</td><td>${esc(h.cq) || '—'}</td><td>${esc(h.cb) || '—'}</td><td>${esc(h.cp) || '—'}</td><td>${esc(h.dobras) || '—'}</td><td>${rmBtn('an.hist', i)}</td></tr>`).join('')}</tbody></table></div>`
    : '<p class="muted">Nenhuma medição registrada.</p>';
  return `
  ${card('Dados base e metas', grid(
    num('an.peso', 'Peso atual (kg)', { ph: '65,5' }), num('an.pesoHab', 'Peso habitual (kg)'), num('an.pesoObj', 'Peso objetivo (kg)'),
    num('an.altura', 'Altura (m ou cm)', { ph: '1,76 ou 176', hint: 'Valores acima de 3 são convertidos de cm para m.' })
  ), '', { id: 'charmander', tip: '#004 Charmander · Composição Corporal' })}
  ${card('Cálculos automáticos', calc('antro'))}
  ${card('Circunferências (cm)', grid(num('an.cc', 'CC · Cintura'), num('an.ca', 'CA · Abdome'), num('an.cq', 'CQ · Quadril'), num('an.cb', 'CB · Braço'), num('an.cp', 'CP · Panturrilha'), num('an.pesc', 'Pescoço (opcional)')))}
  ${card('Dobras cutâneas (mm)', grid(num('an.db', 'DB · Bicipital'), num('an.dt', 'DT · Tricipital'), num('an.dsi', 'DSI · Supra-ilíaca'), num('an.dse', 'DSE · Subescapular'), `<div class="fld"><span>Σ4DC</span>${calc('sum4')}</div>`))}
  ${card('Histórico / Evolução antropométrica', `<button type="button" class="btn primary" data-act="regmed">Registrar medição no histórico</button>${hist}`)}`;
}

function labTable() {
  const dates = P.ex.dates;
  const th = dates.map((d, i) => `<th class="dcol"><input type="date" data-k="ex.dates.${i}.data" value="${esc(d.data)}" aria-label="Data da coleta ${i + 1}">${rmBtn('ex.dates', i)}</th>`).join('');
  const cell = (i, key, ph = '') => `<td><input data-k="ex.dates.${i}.v.${key}" inputmode="decimal" value="${esc(dates[i].v[key] || '')}"${ph ? ` placeholder="${esc(ph)}"` : ''}></td>`;
  const rows = LAB_EXAMS.map((e) => `<tr><th class="exn">${e.n}<small>${e.u}</small></th><td class="ref">${e.r}</td>${dates.map((d, i) => {
    let ph = '';
    if (e.k === 'homa') {
      const h = C.homaIR(C.parseBRNumber(d.v.glicemia), C.parseBRNumber(d.v.insulina));
      ph = h !== null ? `≈ ${C.fmt(h, 2)}` : '';
    }
    return cell(i, e.k, ph);
  }).join('')}</tr>`).join('');
  const custom = P.ex.custom.map((c, j) => `<tr class="cust"><th class="exn"><input data-k="ex.custom.${j}.nome" value="${esc(c.nome)}" placeholder="Nome do exame"><input class="u" data-k="ex.custom.${j}.unit" value="${esc(c.unit)}" placeholder="unid."></th><td class="ref">${rmBtn('ex.custom', j)}</td>${dates.map((d, i) => cell(i, c.id)).join('')}</tr>`).join('');
  return `<div class="toolbar"><button type="button" class="btn ghost" data-act="add" data-list="ex.dates">+ Adicionar Data</button><button type="button" class="btn ghost" data-act="add" data-list="ex.custom">+ Adicionar exame customizado</button></div>
    <div class="table-wrap labs"><table class="tbl lab"><thead><tr><th>Exame</th><th>Referência</th>${th}</tr></thead><tbody>${rows}${custom}</tbody></table></div>`;
}

function reqForm() {
  return `<div class="toolbar">${COMBOS.map((c) => `<button type="button" class="btn ghost" data-act="combo" data-id="${c.id}">${c.label}</button>`).join('')}<button type="button" class="btn ghost danger" data-act="combo" data-id="clear">Limpar Seleção</button></div>
    <div class="reqgrid">${REQUEST_EXAMS.map((e) => chk('ex.req.' + e.k, e.n, { cls: 'block' })).join('')}</div>
    ${grid(area('ex.extras', 'Exames extras (um por linha)', { cls: 'span2', rows: 3 }), inp('ex.reqData', 'Data da solicitação', { type: 'date' }), area('ex.just', 'Justificativa clínica', { cls: 'full', rows: 3 }))}
    <div class="toolbar"><button type="button" class="btn primary" data-act="print-ex">Imprimir / Salvar PDF da Solicitação</button><span class="muted" data-calc="reqcount"></span></div>`;
}

function tabExames() {
  return card('Exames laboratoriais', `<div class="subtabs"><button type="button" class="${sub === 'reg' ? 'on' : ''}" data-act="sub" data-v="reg">Registro Longitudinal</button><button type="button" class="${sub === 'req' ? 'on' : ''}" data-act="sub" data-v="req">Gerador de Solicitação</button></div>${sub === 'reg' ? labTable() : reqForm()}`, '', { id: 'chansey', tip: '#113 Chansey · Painel Laboratorial' });
}

function tabDx() {
  const ev = P.dx.evol.map((e, i) => `<div class="evol">${inp(`dx.evol.${i}.data`, 'Data', { type: 'date' })}${area(`dx.evol.${i}.texto`, 'Evolução', { cls: 'grow', rows: 3 })}${rmBtn('dx.evol', i)}</div>`).join('');
  return `
  ${card('Diagnóstico nutricional', `${area('dx.diag', 'Diagnóstico', { rows: 6 })}<button type="button" class="btn ghost" data-act="gen">Gerar rascunho automático</button>`, '', { id: partner, tip: `${PARTNERS[partner].num} ${PARTNERS[partner].name} · Diagnóstico e Conduta` })}
  ${card('Conduta dietoterápica', `${area('dx.conduta', 'Plano de ação', { rows: 4 })}${area('dx.metas', 'Metas de curto prazo', { rows: 3 })}${area('dx.orient', 'Orientações', { rows: 3 })}`)}
  ${card('Evolução clínica', `<button type="button" class="btn primary" data-act="add" data-list="dx.evol">+ Nova Evolução</button><div class="list">${ev || '<p class="muted">Nenhuma evolução registrada.</p>'}</div>`)}`;
}

const TABS = [
  { n: 'Identificação', s: 'e objetivo', render: tabIdent, paths: ['p.nome', 'p.nasc', 'p.sexo', 'p.tel', 'p.motivo', 'p.tags', 'p.dietasPrev'] },
  { n: 'História clínica', s: 'HPP e medicamentos', render: tabHPP, paths: ['h.pat', 'h.fam', 'h.meds', 'h.alergia', 'h.intol'] },
  { n: 'Gastrointestinal', s: 'Bristol e semiologia', render: tabGI, paths: ['gi.bristol', 'gi.freq', 'gi.esforco', 'gi.sint', 'gi.mastig', 'gi.disfagia', 'gi.semio'] },
  { n: 'Rotina', s: 'estilo de vida e AF', render: tabRotina, paths: ['v.dorme', 'v.acorda', 'v.qualSono', 'v.trabalha', 'v.estresse', 'v.mora', 'v.af', 'v.fuma', 'v.alcool'] },
  { n: 'Comportamento', s: 'hidratação e frequência', render: tabAlimentar, paths: ['a.tvCel', 'a.horaFome', 'a.apetite', 'a.fds', 'a.agua', 'a.urina', 'a.freq'] },
  { n: 'Recordatório', s: 'rotina 24h', render: tabRecord, paths: [] },
  { n: 'Antropometria', s: 'com evolução', render: tabAntro, paths: ['an.peso', 'an.pesoHab', 'an.altura', 'an.cc', 'an.cq', 'an.cb', 'an.dt'] },
  { n: 'Exames', s: 'registro e solicitação', render: tabExames, paths: ['ex.dates', 'ex.req', 'ex.just'] },
  { n: 'Diagnóstico', s: 'conduta e evolução', render: tabDx, paths: ['dx.diag', 'dx.conduta', 'dx.metas', 'dx.evol'] },
];

function tabProgress(i) {
  if (!P) return 0;
  if (i === 5) {
    const base = P.r.meals.filter((m) => !m.extra);
    return Math.round((base.filter((m) => m.nao || (m.desc || '').trim()).length / base.length) * 100);
  }
  const ps = TABS[i].paths;
  return Math.round((ps.filter((p) => isFilled(get(P, p))).length / ps.length) * 100);
}

// ---------- Cálculos ao vivo ----------
const CALCS = {
  age() {
    const a = ageOf(P);
    return a ? esc(a.text) : '—';
  },
  gest() {
    const imc = C.pregestationalIMC(C.parseBRNumber(P.p.ppg), anthroOf(P).altura);
    return imc !== null ? `${C.fmt(imc)} kg/m²` : '— <small>(informe peso pré-gestacional e altura)</small>';
  },
  sono() {
    const s = C.sleepHours(P.v.dorme, P.v.acorda);
    return s ? `<b>${s.text}</b>${s.hours < 7 ? ' <span class="badge warn">abaixo de 7h</span>' : ''}` : '—';
  },
  estresse() {
    return P.v.estresse ? `${esc(P.v.estresse)}/10` : 'não informado';
  },
  hid() {
    const an = anthroOf(P);
    const g = C.hydrationGoal(an.peso);
    if (!g) return '— <small>(informe o peso atual na aba Antropometria)</small>';
    let txt = `<div class="hid-calc"><div class="hid-top"><span class="mono">HP HÍDRICO</span><b class="mono">${C.fmt(g.litros, 2)} L/dia</b> <small>(${C.fmt(g.ml, 0)} ml ≈ ${C.fmt(g.copos, 0)} copos de 200 ml)</small></div>`;
    const ag = C.parseBRNumber(P.a.agua);
    if (ag !== null) {
      const l = P.a.aguaUnid === 'copos' ? ag * 0.2 : ag;
      const pct = Math.max(0, Math.min(100, (l / g.litros) * 100));
      const tone = pct >= 90 ? 'ok' : pct >= 60 ? 'warn' : 'bad';
      txt += `${hpBar(pct, tone, 12)}<small class="mono">INGESTÃO ATUAL: ${C.fmt(l, 2)} L (${C.fmt(pct, 0)}% DA META)</small>`;
    } else {
      txt += hpBar(0, 'info', 12);
    }
    return txt + '</div>';
  },
  bristol() {
    const t = bristolText(P.gi.bristol);
    return t ? `Escala de Bristol: <b>${esc(t)}</b>` : '—';
  },
  sum4() {
    const s = anthroOf(P).sum4;
    return s !== null ? `<b>${C.fmt(s)} mm</b>` : '— <small>(preencha as 4 dobras)</small>';
  },
  reqcount() {
    const n = selectedExams(P).length;
    return `${n} exame${n === 1 ? '' : 's'} selecionado${n === 1 ? '' : 's'}`;
  },
  antro() {
    const a = anthroOf(P);
    const out = [];
    if (a.imcClass && a.imcClass.pediatric) out.push(`<div class="alert info">${esc(a.imcClass.label)}</div>`);
    const imcHP = a.imc !== null ? Math.min(100, Math.max(12, Math.round((a.imc / 40) * 100))) : null;
    const rcqHP = a.rcq !== null ? Math.min(100, Math.max(15, Math.round((a.rcq / 1.2) * 100))) : null;
    const rceHP = a.rce !== null ? Math.min(100, Math.max(15, Math.round((a.rce / 0.8) * 100))) : null;
    out.push('<div class="mcards">');
    out.push(mcard('IMC (kg/m²)', C.fmt(a.imc), a.imcClass && !a.imcClass.pediatric ? esc(a.imcClass.label) : a.imcClass ? 'Escore-Z / Curvas OMS' : 'Informe peso e altura', a.imcClass ? a.imcClass.tone : '', imcHP));
    const v = a.variation;
    out.push(mcard('Variação ponderal', v ? `${v.pct > 0 ? '+' : ''}${C.fmt(v.pct)}%` : '—', v ? `${v.kg > 0 ? '+' : ''}${C.fmt(v.kg)} kg vs. habitual` : 'Informe peso atual e habitual', v ? (v.kg < 0 ? 'info' : v.kg > 0 ? 'warn' : 'ok') : ''));
    out.push(mcard('Meta de peso', a.toGoal !== null ? `${a.toGoal > 0 ? '' : '+'}${C.fmt(-a.toGoal)} kg` : '—', a.toGoal !== null ? (a.toGoal > 0 ? 'falta perder' : a.toGoal < 0 ? 'abaixo do objetivo' : 'objetivo atingido') : 'Informe o peso objetivo', 'info'));
    out.push(mcard('RCQ', C.fmt(a.rcq, 2), a.rcqClass ? a.rcqClass.label : 'Informe CC e CQ', a.rcqClass ? a.rcqClass.tone : '', rcqHP));
    out.push(mcard('RCE', C.fmt(a.rce, 2), a.rceClass ? a.rceClass.label : 'Informe CC e altura', a.rceClass ? a.rceClass.tone : '', rceHP));
    out.push(mcard('CC (cintura)', a.cc !== null ? `${C.fmt(a.cc)} cm` : '—', a.ccClass ? a.ccClass.label : 'Informe a cintura', a.ccClass ? a.ccClass.tone : ''));
    out.push(mcard('CMB', a.cmb !== null ? `${C.fmt(a.cmb)} cm` : '—', 'CB − 0,314 × DT', 'info'));
    out.push(mcard('CP (panturrilha)', a.cp !== null ? `${C.fmt(a.cp)} cm` : '—', a.cpAlert || (a.cp !== null ? 'Sem alerta' : 'Informe a CP'), a.cpAlert ? 'bad' : a.cp !== null ? 'ok' : ''));
    const bf = a.bodyFat;
    const bfHP = bf && bf.valid ? Math.min(100, Math.max(10, Math.round((bf.bodyFatPct / 50) * 100))) : null;
    out.push(mcard('% Gordura (Durnin & Womersley)', bf && bf.valid ? `${C.fmt(bf.bodyFatPct)}%` : '—', bf && bf.valid ? `Densidade: ${C.fmt(bf.density, 4)} g/cm³ · Siri (1961)` : (bf && bf.reason) || 'Informe as 4 dobras, sexo e idade', bf && bf.valid ? 'info' : '', bfHP));
    out.push(mcard('Massa Gorda / MLG', bf && bf.valid && bf.fatMassKg !== null ? `MG: ${C.fmt(bf.fatMassKg)} kg` : '—', bf && bf.valid && bf.leanMassKg !== null ? `MLG: ${C.fmt(bf.leanMassKg)} kg` : 'Informe o peso atual e as 4 dobras', bf && bf.valid && bf.fatMassKg !== null ? 'ok' : ''));
    out.push('</div>');
    out.push(`<p class="muted small mono">ALTURA: ${a.altura ? C.fmt(a.altura, 2) + ' m' : '—'} · IDADE: ${(ageOf(P) || { text: '—' }).text}</p>`);
    return out.join('');
  },
};
function refreshCalcs() {
  if (!P) return;
  document.querySelectorAll('[data-calc]').forEach((el) => {
    const f = CALCS[el.dataset.calc];
    if (f) el.innerHTML = f();
  });
  updateSidebarHUD();
}

// ---------- Persistência / UI de estado ----------
let savedTimer;
function touch() {
  P.updatedAt = new Date().toISOString();
  try {
    savePatients(patients);
  } catch (e) {
    toast('Erro ao salvar: armazenamento local cheio ou bloqueado.');
  }
  const b = $('#saved');
  const led = $('#saved-led');
  b.classList.add('busy');
  b.querySelector('span').textContent = 'Salvando';
  if (led) led.classList.add('pulse');
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => {
    b.classList.remove('busy');
    b.querySelector('span').textContent = 'Salvo';
    if (led) led.classList.remove('pulse');
    updateNav();
    if ($('#drawer').classList.contains('open')) renderDrawer();
  }, 350);
}

function setPartner(id) {
  if (!PARTNERS[id]) return;
  partner = id;
  storage.set(KEYS.partner, id);
  document.documentElement.dataset.partner = id;
  const sp = $('#sidebar-sprite');
  if (sp) {
    sp.src = PARTNERS[id].src;
    sp.alt = PARTNERS[id].name;
  }
  const bg = $('#dex-bg-art');
  if (bg) bg.src = PARTNERS[id].bg;
  document.querySelectorAll('.partner-btn').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.partner === id));
  });
  if (P && tab === 8) render();
}

function setSkin(id) {
  skin = id === 'clean' ? 'clean' : 'nutridex';
  storage.set(KEYS.skin, skin);
  document.documentElement.dataset.skin = skin;
  document.querySelectorAll('.skin-opt').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.skin === skin));
  });
  const pbox = $('#cfg-partner-box');
  const swrap = $('#cfg-stamps-wrap');
  const bgwrap = $('#cfg-bg-wrap');
  if (pbox) pbox.hidden = skin !== 'nutridex';
  if (swrap) swrap.hidden = skin !== 'nutridex';
  if (bgwrap) bgwrap.hidden = skin !== 'nutridex';
}

function setStamps(on) {
  stamps = !!on;
  storage.set(KEYS.stamps, stamps ? 'on' : 'off');
  document.documentElement.dataset.stamps = stamps ? 'on' : 'off';
  const chkEl = $('#cfg-stamps');
  if (chkEl) chkEl.checked = stamps;
}

function setBg(on) {
  bgOn = !!on;
  storage.set(KEYS.bg, bgOn ? 'on' : 'off');
  document.documentElement.dataset.bg = bgOn ? 'on' : 'off';
  const chkEl = $('#cfg-bg');
  if (chkEl) chkEl.checked = bgOn;
}

function setCfgTab(id) {
  const isUi = id === 'ui';
  document.querySelectorAll('.cfg-tabs button').forEach((b) => {
    b.setAttribute('aria-selected', String(b.dataset.cfg === (isUi ? 'ui' : 'prof')));
  });
  const prof = $('#cfg-prof');
  const ui = $('#cfg-ui');
  if (prof) prof.hidden = isUi;
  if (ui) ui.hidden = !isUi;
}

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '--';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function updateSidebarHUD(overallPct) {
  const av = $('#prof-avatar');
  const pn = $('#prof-name');
  const pt = $('#prof-tipo');
  const mobLbl = $('#mobile-step-label');
  if (mobLbl) {
    mobLbl.textContent = P ? `${String(tab + 1).padStart(2, '0')} · ${TABS[tab].n}` : 'Etapas & Resumo';
  }
  if (!P) {
    if (av) av.textContent = '--';
    if (pn) pn.textContent = 'Nenhum paciente aberto';
    if (pt) pt.textContent = 'Aguardando';
    const pp = $('#prof-progress');
    const pb = $('#prof-bar');
    if (pp) pp.textContent = '0%';
    if (pb) pb.style.width = '0%';
    $('#hud-age').textContent = '—';
    $('#hud-imc').textContent = '—';
    $('#hud-imc-cell').className = 'hud-cell';
    $('#hud-hid').textContent = '—';
    $('#hud-bristol').textContent = '—';
    const al = $('#hud-alerts');
    if (al) {
      al.innerHTML = '';
      al.hidden = true;
    }
    return;
  }

  const nome = P.p.nome || 'Paciente sem nome';
  if (av) av.textContent = initials(P.p.nome);
  if (pn) pn.textContent = nome;
  if (pt) pt.textContent = P.p.tipo || '1ª Consulta';

  if (typeof overallPct === 'number') {
    const pp = $('#prof-progress');
    const pb = $('#prof-bar');
    if (pp) pp.textContent = `${overallPct}%`;
    if (pb) pb.style.width = `${overallPct}%`;
  }

  const age = ageOf(P);
  $('#hud-age').textContent = age ? `${age.years} anos` : '—';

  const an = anthroOf(P);
  const imcCell = $('#hud-imc-cell');
  if (an.imc !== null) {
    $('#hud-imc').textContent = `${C.fmt(an.imc)} · ${an.imcClass ? an.imcClass.short : ''}`;
    imcCell.className = `hud-cell ${an.imcClass && an.imcClass.tone ? an.imcClass.tone : ''}`;
  } else {
    $('#hud-imc').textContent = '—';
    imcCell.className = 'hud-cell';
  }

  const hid = C.hydrationGoal(an.peso);
  $('#hud-hid').textContent = hid ? `${C.fmt(hid.litros, 2)} L/dia` : '—';

  const br = P.gi.bristol && P.gi.bristol.length ? P.gi.bristol.map((n) => `Tipo ${n}`).join('/') : '—';
  $('#hud-bristol').textContent = br;

  const alerts = [];
  if (P.h.alergia === 'Sim') alerts.push({ t: P.h.alergiaQuais ? `Alergia: ${P.h.alergiaQuais}` : 'Alergia', c: 'bad' });
  if (P.h.intol === 'Sim') alerts.push({ t: P.h.intolQuais ? `Intol.: ${P.h.intolQuais}` : 'Intolerância', c: 'warn' });
  if (P.h.pat.tea && P.h.pat.tea.on) alerts.push({ t: P.h.tea && P.h.tea.suporte ? `TEA (${P.h.tea.suporte})` : 'TEA', c: 'info' });
  if (P.h.pat.tdah && P.h.pat.tdah.on) alerts.push({ t: 'TDAH', c: 'info' });
  PATOLOGIAS.filter(([k]) => k !== 'tea' && k !== 'tdah' && P.h.pat[k] && P.h.pat[k].on)
    .slice(0, 3)
    .forEach(([, l]) => alerts.push({ t: l.replace(/\s*\(.*\)/, ''), c: '' }));

  const alEl = $('#hud-alerts');
  if (alEl) {
    if (alerts.length) {
      alEl.innerHTML = alerts.map((a) => `<span class="hud-pill ${a.c}">${esc(a.t)}</span>`).join('');
      alEl.hidden = false;
    } else {
      alEl.innerHTML = '';
      alEl.hidden = true;
    }
  }
}

function buildNav() {
  $('#tabs').innerHTML = TABS.map((t, i) => `<button type="button" class="tab" role="tab" data-act="tab" data-i="${i}"><span class="num mono">${String(i + 1).padStart(2, '0')}</span><span class="tl"><b>${t.n}</b><small>${t.s}</small></span>${SVG_CHK}</button>`).join('');
}
function updateNav() {
  const btns = document.querySelectorAll('#tabs .tab');
  let sum = 0;
  btns.forEach((b, i) => {
    const pct = tabProgress(i);
    sum += pct;
    b.setAttribute('aria-selected', String(i === tab && !!P));
    b.classList.toggle('has-data', pct > 0);
    b.classList.toggle('done', pct >= 100);
  });
  const overall = P ? Math.round(sum / TABS.length) : 0;
  const ob = $('#overall-bar');
  if (ob) ob.style.width = overall + '%';
  const mp = $('#mob-prog');
  if (mp) mp.textContent = overall + '%';
  updateSidebarHUD(overall);
}

function welcome() {
  return `<section class="card welcome"><div class="card-head"><h2>Bem-vindo ao Anamnese NutriPro</h2></div>
    <p>Ficha de anamnese nutricional clínica e solicitação de exames, 100% offline. Os dados ficam somente neste dispositivo.</p>
    <div class="toolbar"><button type="button" class="btn primary" data-act="new">Nova Anamnese</button><button type="button" class="btn ghost" data-act="sample">Carregar Paciente Exemplo</button><button type="button" class="btn ghost" data-act="drawer">Pacientes salvos (${patients.length})</button></div></section>`;
}

function stepFooter() {
  const prev = tab > 0 ? `<button type="button" class="btn key" data-act="step" data-dir="-1">${SVG_PREV}<span>Etapa anterior</span></button>` : '<span></span>';
  const next = tab < TABS.length - 1 ? `<button type="button" class="btn primary key" data-act="step" data-dir="1"><span>Próxima etapa</span>${SVG_NEXT}</button>` : '<span></span>';
  return `<nav class="step-nav" aria-label="Navegação entre etapas">${prev}<span class="mono step-ind">ETAPA ${String(tab + 1).padStart(2, '0')} / ${String(TABS.length).padStart(2, '0')}</span>${next}</nav>`;
}

function render() {
  const y = window.scrollY;
  if (!P) {
    view.innerHTML = welcome();
    updateNav();
    return;
  }
  if (tab < 0 || tab >= TABS.length) tab = 0;
  view.innerHTML = TABS[tab].render() + stepFooter();
  refreshCalcs();
  updateNav();
  window.scrollTo(0, y);
}

function openPatient(id) {
  P = patients.find((x) => x.id === id) || null;
  storage.set(KEYS.current, P ? P.id : '');
  render();
  renderDrawer();
}

// ---------- Toast / confirmação ----------
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
function ask(msg, ok = 'Confirmar') {
  return new Promise((res) => {
    const d = $('#dlg-confirm');
    $('#dlg-msg').textContent = msg;
    $('#dlg-ok').textContent = ok;
    d.returnValue = '';
    d.onclose = () => res(d.returnValue === 'ok');
    d.showModal();
  });
}

// ---------- Drawer de pacientes ----------
function renderDrawer() {
  const q = search.trim().toLowerCase();
  const list = patients
    .filter((p) => !q || (p.p.nome || '').toLowerCase().includes(q))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  $('#plist').innerHTML = list.length
    ? list.map((p) => {
        const a = ageOf(p);
        const meta = [a ? a.years + ' anos' : '', p.p.sexo, p.p.tipo, 'atual. ' + new Date(p.updatedAt).toLocaleDateString('pt-BR')].filter(Boolean).join(' · ');
        return `<li class="pitem${P && P.id === p.id ? ' active' : ''}"><button type="button" class="pmain" data-act="open" data-id="${p.id}"><b>${esc(p.p.nome) || 'Sem nome'}</b><small>${esc(meta)}</small></button>
          <div class="pact"><button type="button" class="btn mini" data-act="ret" data-id="${p.id}" title="Criar retorno a partir desta ficha">Retorno</button><button type="button" class="btn mini" data-act="dup" data-id="${p.id}">Duplicar</button><button type="button" class="btn mini danger" data-act="del" data-id="${p.id}">Excluir</button></div></li>`;
      }).join('')
    : `<li class="muted empty">${patients.length ? 'Nenhum paciente encontrado.' : 'Nenhum paciente salvo ainda.'}</li>`;
  $('#pcount').textContent = patients.length;
}
function toggleDrawer(open) {
  const d = $('#drawer');
  const o = open ?? !d.classList.contains('open');
  d.classList.toggle('open', o);
  $('#scrim').classList.toggle('show', o);
  if (o) renderDrawer();
}
function toggleSidebar(open) {
  const s = $('#sidebar');
  const o = open ?? !s.classList.contains('open');
  s.classList.toggle('open', o);
  $('#side-scrim').classList.toggle('show', o);
}

// ---------- Ações ----------
function pickBristol(n) {
  const g = P.gi;
  if (g.bristolAlt) {
    const i = g.bristol.indexOf(n);
    if (i >= 0) g.bristol.splice(i, 1);
    else {
      g.bristol.push(n);
      if (g.bristol.length > 2) g.bristol.shift();
    }
  } else g.bristol = [n];
  g.bristol.sort((a, b) => a - b);
  touch();
  render();
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  return new Promise((res, rej) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy') ? res() : rej(new Error('copy'));
    } catch (e) {
      rej(e);
    } finally {
      ta.remove();
    }
  });
}

function doPrint(mode) {
  if (mode === 'exames' && !selectedExams(P).length) return toast('Selecione ao menos um exame para a solicitação.');
  const area2 = $('#print-area-' + mode);
  area2.innerHTML = mode === 'anamnese' ? buildAnamnesePrint(P, settings) : buildExamesPrint(P, settings);
  document.body.classList.add('print-mode-' + mode);
  setTimeout(() => window.print(), 60);
}
function cleanupPrint() {
  document.body.classList.remove('print-mode-anamnese', 'print-mode-exames');
  $('#print-area-anamnese').innerHTML = '';
  $('#print-area-exames').innerHTML = '';
}
window.addEventListener('afterprint', cleanupPrint);

function registerHist() {
  const a = anthroOf(P);
  if (a.peso === null && a.cc === null && a.cb === null) return toast('Preencha ao menos peso ou uma circunferência.');
  const f = (n, d = 1) => (n !== null ? C.fmt(n, d) : '');
  P.an.hist.push({
    data: P.p.data || C.todayISO(), peso: f(a.peso), altura: a.altura ? C.fmt(a.altura, 2) : '', imc: f(a.imc),
    cc: f(a.cc), ca: f(a.ca), cq: f(a.cq), cb: f(a.cb), cp: f(a.cp), dobras: f(a.sum4),
  });
  P.an.hist.sort((x, y) => (x.data || '').localeCompare(y.data || ''));
  touch();
  render();
  toast('Medição registrada no histórico.');
}

const CONFIRM_RM = { 'ex.dates': 'Remover esta coluna de data e seus resultados?', 'an.hist': 'Remover esta medição do histórico?', 'dx.evol': 'Remover esta evolução?', 'ex.custom': 'Remover este exame customizado?' };

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  const need = () => {
    if (!P) toast('Abra ou crie um paciente primeiro.');
    return !!P;
  };
  switch (act) {
    case 'tab':
      if (!need()) return;
      tab = Number(el.dataset.i);
      storage.set(KEYS.tab, tab);
      render();
      toggleSidebar(false);
      window.scrollTo(0, 0);
      break;
    case 'step': {
      if (!need()) return;
      const next = tab + Number(el.dataset.dir);
      if (next < 0 || next >= TABS.length) return;
      tab = next;
      storage.set(KEYS.tab, tab);
      render();
      window.scrollTo(0, 0);
      break;
    }
    case 'sidebar':
      toggleSidebar();
      break;
    case 'skin':
      setSkin(el.dataset.skin);
      break;
    case 'partner':
      setPartner(el.dataset.partner);
      break;
    case 'cfg-tab':
      setCfgTab(el.dataset.cfg);
      break;
    case 'add': {
      const list = el.dataset.list;
      let arr = V(list);
      if (!Array.isArray(arr)) {
        set(P, list, []);
        arr = V(list);
      }
      if (list === 'dx.evol') arr.unshift(NEW[list]());
      else arr.push(NEW[list]());
      touch();
      render();
      break;
    }
    case 'rm': {
      const list = el.dataset.list;
      const i = Number(el.dataset.i);
      if (CONFIRM_RM[list] && !(await ask(CONFIRM_RM[list], 'Remover'))) return;
      const arr = V(list);
      if (list === 'ex.custom') P.ex.dates.forEach((d) => delete d.v[arr[i].id]);
      if (list === 'ex.dates' && arr.length === 1) arr[0] = { data: '', v: {} };
      else arr.splice(i, 1);
      touch();
      render();
      break;
    }
    case 'sub':
      sub = el.dataset.v;
      render();
      break;
    case 'bristol':
      pickBristol(Number(el.dataset.n));
      break;
    case 'bristol-patient':
      openPatientMode((n) => {
        pickBristol(n);
        toast(`Tipo ${n} registrado na ficha.`);
      });
      break;
    case 'combo': {
      if (el.dataset.id === 'clear') P.ex.req = {};
      else COMBOS.find((c) => c.id === el.dataset.id).keys.forEach((k) => (P.ex.req[k] = true));
      touch();
      render();
      break;
    }
    case 'regmed':
      registerHist();
      break;
    case 'gen':
      if (P.dx.diag.trim() && !(await ask('Substituir o diagnóstico atual pelo rascunho automático?', 'Substituir'))) return;
      P.dx.diag = draftDiagnosis(P);
      touch();
      render();
      toast('Rascunho gerado. Revise e ajuste antes de usar.');
      break;
    case 'copy':
      if (!need()) return;
      copyText(buildSummary(P, settings)).then(() => toast('Resumo copiado para a área de transferência.')).catch(() => toast('Não foi possível copiar automaticamente.'));
      break;
    case 'print-an':
      if (need()) doPrint('anamnese');
      break;
    case 'print-ex':
      if (need()) doPrint('exames');
      break;
    case 'drawer':
      toggleDrawer();
      break;
    case 'new':
      P = createPatient();
      patients.push(P);
      tab = 0;
      touch();
      openPatient(P.id);
      toggleDrawer(false);
      break;
    case 'sample': {
      const s = samplePatient();
      patients.push(s);
      savePatients(patients);
      tab = 0;
      openPatient(s.id);
      toggleDrawer(false);
      toast('Paciente exemplo carregado.');
      break;
    }
    case 'open':
      openPatient(el.dataset.id);
      toggleDrawer(false);
      break;
    case 'dup':
    case 'ret': {
      const src = patients.find((x) => x.id === el.dataset.id);
      const c = duplicatePatient(src, act === 'ret');
      patients.push(c);
      savePatients(patients);
      openPatient(c.id);
      toggleDrawer(false);
      toast(act === 'ret' ? 'Retorno criado a partir da ficha anterior.' : 'Ficha duplicada.');
      break;
    }
    case 'del': {
      const p = patients.find((x) => x.id === el.dataset.id);
      if (!(await ask(`Excluir "${p.p.nome || 'Sem nome'}" definitivamente? Esta ação não pode ser desfeita.`, 'Excluir'))) return;
      patients = patients.filter((x) => x.id !== p.id);
      savePatients(patients);
      if (P && P.id === p.id) {
        P = null;
        storage.set(KEYS.current, '');
      }
      render();
      renderDrawer();
      toast('Paciente excluído.');
      break;
    }
    case 'export':
      exportBackup(patients, settings);
      toast('Backup exportado.');
      break;
    case 'import':
      $('#file-import').click();
      break;
    case 'settings':
      ['nome', 'crn', 'clinica', 'end', 'tel'].forEach((k) => (document.querySelector(`[data-s="${k}"]`).value = settings[k] || ''));
      syncLogoUI();
      setCfgTab('prof');
      $('#dlg-settings').showModal();
      break;
    case 'logo-clear':
      settings.logo = '';
      saveSettings(settings);
      syncLogoUI();
      toast('Logo removida.');
      break;
    case 'theme': {
      const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = t;
      storage.set(KEYS.theme, t);
      break;
    }
    default:
  }
});

// ---------- Entrada de dados (autosave) ----------
function onField(e) {
  const t = e.target;
  const k = t.dataset && t.dataset.k;
  if (!k || !P) return;
  const discrete = t.type === 'checkbox' || t.type === 'radio' || t.tagName === 'SELECT';
  if (discrete ? e.type !== 'change' : e.type !== 'input') return;
  if (t.type === 'radio' && !t.checked) return;
  const val = t.type === 'checkbox' ? t.checked : t.value;
  if (get(P, k) === val) return;
  set(P, k, val);

  let rerender = t.dataset.rr === '1' && e.type === 'change';
  if (k === 'p.nasc') {
    const a = ageOf(P);
    if (a && a.years < 18 && !P.p.menor) {
      P.p.menor = true;
      rerender = true;
    }
  }
  if (k === 'p.sexo' && val !== 'Feminino') P.p.gestante = false;
  if (k === 'gi.bristolAlt' && !val && P.gi.bristol.length > 1) P.gi.bristol = [P.gi.bristol[0]];
  if (/^ex\.dates\.\d+\.v\.(glicemia|insulina)$/.test(k)) {
    const i = k.split('.')[2];
    const d = P.ex.dates[i];
    const h = C.homaIR(C.parseBRNumber(d.v.glicemia), C.parseBRNumber(d.v.insulina));
    const cell = document.querySelector(`[data-k="ex.dates.${i}.v.homa"]`);
    if (cell) cell.placeholder = h !== null ? `≈ ${C.fmt(h, 2)}` : '';
  }
  touch();
  if (rerender) render();
  else refreshCalcs();
}
view.addEventListener('input', onField);
view.addEventListener('change', onField);

// ---------- Configurações, backup, busca, logo ----------
function syncLogoUI() {
  const prev = $('#logo-preview');
  const clr = $('#logo-clear');
  if (!prev || !clr) return;
  if (settings.logo) {
    prev.src = settings.logo;
    prev.hidden = false;
    clr.hidden = false;
  } else {
    prev.removeAttribute('src');
    prev.hidden = true;
    clr.hidden = true;
  }
}

$('#logo-upload').addEventListener('change', (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 280;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      settings.logo = c.toDataURL('image/png');
      saveSettings(settings);
      syncLogoUI();
      toast('Logo salva para impressão.');
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(f);
});

['#dlg-settings', '#dlg-confirm'].forEach((id) => {
  const d = $(id);
  d.addEventListener('click', (e) => {
    if (e.target === d) d.close('cancel');
  });
});

$('#cfg-stamps').addEventListener('change', (e) => {
  setStamps(e.target.checked);
});
$('#cfg-bg').addEventListener('change', (e) => {
  setBg(e.target.checked);
});

$('#dlg-settings').addEventListener('input', (e) => {
  const k = e.target.dataset.s;
  if (!k) return;
  settings[k] = e.target.value;
  saveSettings(settings);
});
$('#psearch').addEventListener('input', (e) => {
  search = e.target.value;
  renderDrawer();
});
$('#scrim').addEventListener('click', () => toggleDrawer(false));
$('#side-scrim').addEventListener('click', () => toggleSidebar(false));
$('#file-import').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const res = importBackup(await f.text(), patients);
    patients = res.list;
    savePatients(patients);
    if (res.settings && !settings.nome && !settings.clinica) {
      settings = { ...settings, ...res.settings };
      saveSettings(settings);
    }
    renderDrawer();
    render();
    toast(`Backup importado: ${res.added} novo(s), ${res.updated} atualizado(s).`);
  } catch (err) {
    toast('Falha ao importar: ' + err.message);
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    toggleDrawer(false);
    toggleSidebar(false);
  }
});

// ---------- Inicialização ----------
(function init() {
  const saved = storage.get(KEYS.theme);
  document.documentElement.dataset.theme = saved || (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  setSkin(skin);
  setPartner(partner);
  setStamps(stamps);
  setBg(bgOn);
  buildNav();
  const cur = storage.get(KEYS.current);
  P = patients.find((p) => p.id === cur) || null;
  render();
  renderDrawer();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
})();

export { BRISTOL, uid };
