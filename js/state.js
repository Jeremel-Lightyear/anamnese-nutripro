// Schema do paciente, CRUD em localStorage, backup JSON e paciente exemplo
import { todayISO } from './calculations.js';

const ls = (() => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
})();
const memory = {};
const store = {
  get: (k) => (ls ? ls.getItem(k) : memory[k] ?? null),
  set: (k, v) => {
    if (ls) ls.setItem(k, v);
    else memory[k] = v;
  },
};

export const KEYS = {
  patients: 'nutripro.patients.v1',
  current: 'nutripro.current',
  settings: 'nutripro.settings',
  theme: 'nutripro.theme',
  tab: 'nutripro.tab',
  partner: 'nutripro.partner',
  skin: 'nutripro.skin',
  stamps: 'nutripro.stamps',
  bg: 'nutripro.bg',
  onboarding: 'nutripro_onboarding_v2_done',
};
export const storage = store;

// ---------- Constantes de formulário (compartilhadas com app.js e export.js) ----------
export const TAGS_MOTIVO = ['Emagrecimento', 'Hipertrofia/Ganho de peso', 'Reeducação alimentar', 'Controle de patologia', 'Encaminhamento médico', 'Saúde intestinal'];

export const PATOLOGIAS = [
  ['nenhuma', 'Nenhuma patologia'],
  ['has', 'Hipertensão Arterial'],
  ['dm1', 'Diabetes Mellitus Tipo 1'],
  ['dm2', 'Diabetes Mellitus Tipo 2'],
  ['predm', 'Pré-diabetes'],
  ['dislip', 'Dislipidemia'],
  ['esteat', 'Esteatose Hepática'],
  ['dcv', 'Doença Cardiovascular'],
  ['hipotireo', 'Hipotireoidismo'],
  ['hipertireo', 'Hipertireoidismo'],
  ['renal', 'Doença Renal'],
  ['gastrite', 'Gastrite'],
  ['drge', 'DRGE (Doença do Refluxo)'],
  ['refluxo', 'Refluxo (sem diagnóstico de DRGE)'],
  ['sii', 'Síndrome do Intestino Irritável'],
  ['celiaca', 'Doença Celíaca'],
  ['asma', 'Asma'],
  ['bronquite', 'Bronquite'],
  ['ansiedade', 'Ansiedade'],
  ['depressao', 'Depressão'],
  ['sop', 'SOP (Síndrome dos Ovários Policísticos)'],
  ['osteoporose', 'Osteoporose'],
  ['fratura', 'Fratura óssea prévia'],
  ['tea', 'TEA (Transtorno do Espectro Autista)'],
  ['tdah', 'TDAH (Transtorno de Déficit de Atenção e Hiperatividade)'],
  ['cirurg', 'Cirurgias prévias'],
  ['outras', 'Outras'],
];
export const DM_TIPOS = ['Tipo 1', 'Tipo 2', 'Pré-diabetes'];

export function togglePathology(patObj, key, checked) {
  if (!patObj || !patObj[key]) return;
  patObj[key].on = !!checked;
  if (key === 'nenhuma' && checked) {
    Object.keys(patObj).forEach((k) => {
      if (k !== 'nenhuma' && patObj[k]) {
        patObj[k].on = false;
        patObj[k].obs = '';
      }
    });
  } else if (key !== 'nenhuma' && checked && patObj.nenhuma) {
    patObj.nenhuma.on = false;
  }
}

export const TEA_SUPORTE = ['Nível 1', 'Nível 2', 'Nível 3', 'Em investigação'];
export const TEA_SELETIVIDADE = ['Ausente', 'Leve', 'Moderada', 'Severa / TARE'];
export const TEA_GATILHOS = [
  ['textura', 'Textura / consistência'],
  ['cor', 'Cor'],
  ['cheiro', 'Cheiro'],
  ['temperatura', 'Temperatura'],
  ['marca', 'Marca ou embalagem específica'],
  ['misturados', 'Alimentos misturados no prato'],
  ['ambiente', 'Ambiente / barulho à mesa'],
];
export const TEA_REPERTORIO = ['< 10 alimentos', '10 a 20', '> 20'];
export const TEA_EQUIPE = [
  ['fono', 'Fonoaudiologia'],
  ['to', 'Terapia Ocupacional'],
  ['psico', 'Psicologia / ABA'],
  ['neuro', 'Neuropediatria / Psiquiatria'],
];

export const FAMILIA = [
  ['dm', 'Diabetes'], ['has', 'Hipertensão'], ['dislip', 'Dislipidemia'], ['dcv', 'Doenças Cardiovasculares'],
  ['cancer', 'Câncer'], ['tireoide', 'Doenças da Tireoide'], ['obes', 'Obesidade'],
];

export const SINTOMAS_GI = [
  ['gases', 'Gases/Flatulência excessiva'], ['distensao', 'Distensão abdominal (estufamento)'],
  ['dor', 'Dor ou cólica abdominal'], ['azia', 'Azia/Pirose'], ['refluxo', 'Refluxo/Regurgitação'],
  ['empach', 'Empachamento pós-prandial'], ['nausea', 'Náuseas/Vômitos'],
];
export const FREQ_SINTOMA = ['Nunca', 'Às vezes', 'Frequente'];

export const BUCAL = [
  ['integra', 'Dentição íntegra'], ['protese', 'Usa prótese dentária'], ['ausencia', 'Ausência de dentes'], ['dor', 'Dor/sensibilidade ao mastigar'],
];

export const SEMIO = [
  ['cabelo', 'Queda de cabelo acentuada'], ['unhas', 'Unhas fracas/quebradiças'], ['pele', 'Pele muito ressecada'],
  ['fadiga', 'Fadiga/cansaço crônico'], ['tontura', 'Tonturas'], ['cefaleia', 'Cefaleia frequente'], ['caimbra', 'Câimbras'],
  ['formig', 'Formigamento/parestesia'], ['aftas', 'Aftas/lesões orais frequentes'], ['edema', 'Edema (inchaço em pernas/face)'],
];

export const EQUIP = [
  ['fogao', 'Fogão'], ['geladeira', 'Geladeira'], ['micro', 'Micro-ondas'], ['airfryer', 'Airfryer'], ['liquid', 'Liquidificador'], ['balanca', 'Balança de cozinha'],
];

export const FREQ_OPCOES = ['Diário', '3-5x sem', '1-2x sem', 'Raramente', 'Nunca'];
export const FREQ_ITEMS = [
  ['frutas', 'Frutas', 'porções/dia'],
  ['vegetais', 'Vegetais / Hortaliças', 'porções/dia'],
  ['leguminosas', 'Leguminosas (feijão, lentilha, grão-de-bico)', 'tipo e porções'],
  ['carnes', 'Carnes e Ovos', 'tipos e preparo: cozido, grelhado, assado, frito'],
  ['laticinios', 'Laticínios (leite, queijo, iogurte)', 'tipo e quantidade'],
  ['integrais', 'Grãos / Produtos integrais', 'quais e quantidade'],
  ['cafe', 'Café / Cafeína', 'vezes/dia e volume (ml)'],
  ['acucar', 'Açúcar de adição (café, sucos, receitas)', 'colheres/dia'],
  ['adocante', 'Adoçantes', 'qual tipo', ['Sim', 'Não']],
  ['doces', 'Doces e guloseimas (chocolates, bolos, biscoitos, balas)', 'quais e quanto'],
  ['refri', 'Refrigerantes / Sucos industrializados', 'volume'],
  ['ultra', 'Ultraprocessados / Embutidos / Delivery / Fast food', 'quais e frequência'],
  ['oleo', 'Óleo/Gordura no preparo', 'tipo utilizado e gasto mensal na casa'],
];

export const LOCAIS = ['Casa', 'Trabalho', 'Faculdade/Escola', 'Restaurante/Rua'];
export const REFEICOES = ['Café da Manhã', 'Lanche da Manhã', 'Almoço', 'Lanche da Tarde', 'Jantar', 'Ceia'];
export const URINA = [
  ['Clara/Transparente', '#f6f9ec'], ['Amarelo-claro', '#f3e47c'], ['Amarelo-escuro', '#dfb21b'], ['Âmbar/Muito escura', '#b06f14'],
];

// ---------- Utilitários de caminho ----------
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function get(obj, path) {
  return String(path).split('.').reduce((o, k) => (o === undefined || o === null ? undefined : o[k]), obj);
}
export function set(obj, path, val) {
  const keys = String(path).split('.');
  let o = obj;
  keys.forEach((k, i) => {
    if (i === keys.length - 1) {
      o[k] = val;
    } else {
      if (o[k] === undefined || o[k] === null || typeof o[k] !== 'object') o[k] = /^\d+$/.test(keys[i + 1]) ? [] : {};
      o = o[k];
    }
  });
}
export function isFilled(v) {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return true;
  if (Array.isArray(v)) return v.some(isFilled);
  if (typeof v === 'object') return Object.values(v).some(isFilled);
  return false;
}
const clone = (o) => JSON.parse(JSON.stringify(o));
export function deepMerge(target, src) {
  if (!src || typeof src !== 'object') return target;
  Object.keys(src).forEach((k) => {
    const sv = src[k];
    if (Array.isArray(sv)) target[k] = clone(sv);
    else if (sv && typeof sv === 'object' && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) deepMerge(target[k], sv);
    else target[k] = sv;
  });
  return target;
}

// ---------- Elenco neutro NutriDex (25 Pokémon clássicos, sem vínculo clínico) ----------
export const DEX_ROSTER = [
  { slug: 'bulbasaur', name: 'Bulbasaur' },
  { slug: 'charmander', name: 'Charmander' },
  { slug: 'squirtle', name: 'Squirtle' },
  { slug: 'pikachu', name: 'Pikachu' },
  { slug: 'eevee', name: 'Eevee' },
  { slug: 'vulpix', name: 'Vulpix' },
  { slug: 'jigglypuff', name: 'Jigglypuff' },
  { slug: 'oddish', name: 'Oddish' },
  { slug: 'psyduck', name: 'Psyduck' },
  { slug: 'growlithe', name: 'Growlithe' },
  { slug: 'poliwag', name: 'Poliwag' },
  { slug: 'abra', name: 'Abra' },
  { slug: 'ponyta', name: 'Ponyta' },
  { slug: 'slowpoke', name: 'Slowpoke' },
  { slug: 'dratini', name: 'Dratini' },
  { slug: 'chikorita', name: 'Chikorita' },
  { slug: 'cyndaquil', name: 'Cyndaquil' },
  { slug: 'totodile', name: 'Totodile' },
  { slug: 'togepi', name: 'Togepi' },
  { slug: 'marill', name: 'Marill' },
  { slug: 'pichu', name: 'Pichu' },
  { slug: 'heracross', name: 'Heracross' },
  { slug: 'treecko', name: 'Treecko' },
  { slug: 'torchic', name: 'Torchic' },
  { slug: 'mudkip', name: 'Mudkip' },
];
export const DEX_BY_SLUG = Object.fromEntries(DEX_ROSTER.map((d) => [d.slug, d]));
export const POKE_TYPES = {
  bulbasaur: 'grass', charmander: 'fire', squirtle: 'water', pikachu: 'electric',
  eevee: 'normal', vulpix: 'fire', jigglypuff: 'psychic', oddish: 'grass',
  psyduck: 'water', growlithe: 'fire', poliwag: 'water', abra: 'psychic',
  ponyta: 'fire', slowpoke: 'water', dratini: 'psychic', chikorita: 'grass',
  cyndaquil: 'fire', totodile: 'water', togepi: 'psychic', marill: 'water',
  pichu: 'electric', heracross: 'bug', treecko: 'grass', torchic: 'fire', mudkip: 'water',
  chansey: 'normal', snorlax: 'sleep', 'snorlax-sleep': 'sleep', munchlax: 'normal',
  chimchar: 'fire', mimikyu: 'psychic',
};
export const dexSpriteSrc = (slug) => `./assets/sprites/dex/${DEX_BY_SLUG[slug] ? slug : 'bulbasaur'}.png`;
export const dexAnimSrc = (slug) => `./assets/sprites/dex/anim/${DEX_BY_SLUG[slug] ? slug : 'bulbasaur'}.gif`;
export const formatDexNumber = (n) => String(Math.max(1, Number(n) || 1)).padStart(3, '0');
export const shouldOpenLauncher = (onboardingDone, skin) => onboardingDone === true && skin === 'nutridex';

export function assignDexEntries(list) {
  if (!Array.isArray(list) || !list.length) return false;
  let maxNum = 0;
  list.forEach((p) => {
    if (p && /^\d{3,}$/.test(String(p.dexNumber || ''))) {
      const n = Number(p.dexNumber);
      if (n > maxNum) maxNum = n;
    }
  });
  let changed = false;
  list.forEach((p) => {
    if (!p) return;
    if (!/^\d{3,}$/.test(String(p.dexNumber || ''))) {
      maxNum += 1;
      p.dexNumber = formatDexNumber(maxNum);
      changed = true;
    }
    if (!DEX_BY_SLUG[p.dexPokemon]) {
      p.dexPokemon = DEX_ROSTER[(Number(p.dexNumber) - 1) % DEX_ROSTER.length].slug;
      changed = true;
    }
  });
  return changed;
}

export function assignNextDex(patient, existingList = []) {
  if (!patient) return patient;
  let maxNum = 0;
  (existingList || []).forEach((p) => {
    if (p && /^\d{3,}$/.test(String(p.dexNumber || ''))) {
      const n = Number(p.dexNumber);
      if (n > maxNum) maxNum = n;
    }
  });
  if (!/^\d{3,}$/.test(String(patient.dexNumber || ''))) {
    patient.dexNumber = formatDexNumber(maxNum + 1);
  }
  if (!DEX_BY_SLUG[patient.dexPokemon]) {
    patient.dexPokemon = DEX_ROSTER[(Number(patient.dexNumber) - 1) % DEX_ROSTER.length].slug;
  }
  return patient;
}

// ---------- Schema ----------
export function newMeal(nome, extra = false) {
  return { id: uid(), nome, extra, nao: false, hor: '', local: '', desc: '' };
}

export function defaultPatient() {
  const pat = {};
  PATOLOGIAS.forEach(([k]) => (pat[k] = { on: false, obs: '' }));
  const fam = { outros: '' };
  FAMILIA.forEach(([k]) => (fam[k] = false));
  const sint = {};
  SINTOMAS_GI.forEach(([k]) => (sint[k] = ''));
  const bucal = {};
  BUCAL.forEach(([k]) => (bucal[k] = false));
  const semio = {};
  SEMIO.forEach(([k]) => (semio[k] = false));
  const equip = {};
  EQUIP.forEach(([k]) => (equip[k] = false));
  const freq = {};
  FREQ_ITEMS.forEach(([k]) => (freq[k] = { f: '', obs: '' }));
  const tags = {};
  TAGS_MOTIVO.forEach((t) => (tags[t] = false));
  const now = new Date().toISOString();
  return {
    id: uid(), createdAt: now, updatedAt: now,
    dexNumber: '', dexPokemon: '',
    p: {
      data: todayISO(), tipo: '1ª Consulta', nome: '', nasc: '', sexo: '', cpf: '', tel: '', cidade: '', prof: '',
      menor: false, mae: '', maeProf: '', pai: '', paiProf: '', gestante: false, ig: '', ppg: '',
      motivo: '', tags, dietasPrev: '', dietasObs: '',
    },
    h: {
      pat, dmTipo: '', fam, meds: [], sups: [],
      alergia: '', alergiaQuais: '', intol: '', intolQuais: '',
      ciclo: '', anticoncepcional: '', anticQual: '', tpm: '',
      tea: {
        suporte: '',
        seletividade: '',
        gatilhos: { textura: false, cor: false, cheiro: false, temperatura: false, marca: false, misturados: false, ambiente: false },
        repertorio: '',
        repertorioObs: '',
        equipe: { fono: false, to: false, psico: false, neuro: false },
      },
    },
    gi: {
      bristol: [], bristolAlt: false, freq: '', esforco: '', incompleta: '', dor: '', laxQual: '',
      sint, mastig: '', disfagia: '', bucal, semio, semioObs: '',
    },
    v: {
      dorme: '', acorda: '', qualSono: '', estuda: '', estudaHor: '', trabalha: '', trabHor: '', esforco: '', tela: '', estresse: '',
      mora: '', compras: '', prepara: '', equip, af: '', afList: [],
      fuma: '', fumaTipo: '', fumaQtd: '', alcool: '', alcTipo: '', alcFreq: '', alcQtd: '',
    },
    a: {
      tvCel: '', horaFome: '', apetite: '', apetiteRelato: '', fds: '', fdsDesc: '', preferidos: '', aversoes: '',
      agua: '', aguaUnid: 'L', urina: '', freq,
    },
    r: { meals: REFEICOES.map((n) => newMeal(n)) },
    an: {
      peso: '', pesoHab: '', pesoObj: '', altura: '', cc: '', ca: '', cq: '', cb: '', cp: '', pesc: '',
      db: '', dt: '', dsi: '', dse: '', hist: [],
    },
    ex: { dates: [{ data: '', v: {} }], custom: [], req: {}, extras: '', just: '', reqData: todayISO() },
    dx: { diag: '', conduta: '', metas: '', orient: '', evol: [] },
  };
}

/** Completa dados antigos/importados com o schema atual. */
export function normalizePatient(raw) {
  const p = deepMerge(defaultPatient(), raw || {});
  if (!p.id) p.id = uid();
  if (!Array.isArray(p.r.meals) || !p.r.meals.length) p.r.meals = REFEICOES.map((n) => newMeal(n));
  p.r.meals.forEach((m) => {
    if (!m.id) m.id = uid();
  });
  if (!Array.isArray(p.ex.dates) || !p.ex.dates.length) p.ex.dates = [{ data: '', v: {} }];
  // Migração silenciosa de patologias antigas agrupadas para as 27 individuais
  const pat = p.h && p.h.pat;
  if (pat) {
    if (pat.dm && pat.dm.on) {
      const t = (p.h.dmTipo || '').toLowerCase();
      const k = t.includes('1') ? 'dm1' : t.includes('pré') || t.includes('pre') ? 'predm' : 'dm2';
      pat[k] = { on: true, obs: pat.dm.obs || '' };
      delete pat.dm;
    }
    if (pat.tireo) {
      if (pat.tireo.on) {
        const obs = (pat.tireo.obs || '').toLowerCase();
        const k = obs.includes('hiper') ? 'hipertireo' : 'hipotireo';
        pat[k] = { on: true, obs: pat.tireo.obs || '' };
      }
      delete pat.tireo;
    }
    if (pat.ansdep) {
      if (pat.ansdep.on) {
        const obs = (pat.ansdep.obs || '').toLowerCase();
        if (obs.includes('depress')) pat.depressao = { on: true, obs: pat.ansdep.obs || '' };
        if (obs.includes('ansied') || !obs.includes('depress')) pat.ansiedade = { on: true, obs: pat.ansdep.obs || '' };
      }
      delete pat.ansdep;
    }
    if (pat.osteo) {
      if (pat.osteo.on) {
        const obs = (pat.osteo.obs || '').toLowerCase();
        const k = obs.includes('frat') && !obs.includes('osteo') ? 'fratura' : 'osteoporose';
        pat[k] = { on: true, obs: pat.osteo.obs || '' };
      }
      delete pat.osteo;
    }
    if (pat.gastrite && pat.gastrite.on) {
      const obs = (pat.gastrite.obs || '').toLowerCase();
      if (obs.includes('drge') && !obs.includes('gastr')) {
        pat.drge = { on: true, obs: pat.gastrite.obs || '' };
        pat.gastrite = { on: false, obs: '' };
      } else if (obs.includes('reflux') && !obs.includes('gastr')) {
        pat.refluxo = { on: true, obs: pat.gastrite.obs || '' };
        pat.gastrite = { on: false, obs: '' };
      }
    }
    if (pat.sii && pat.sii.on) {
      const obs = (pat.sii.obs || '').toLowerCase();
      if ((obs.includes('celíac') || obs.includes('celiac')) && !obs.includes('irrit')) {
        pat.celiaca = { on: true, obs: pat.sii.obs || '' };
        pat.sii = { on: false, obs: '' };
      }
    }
    if (pat.asma && pat.asma.on) {
      const obs = (pat.asma.obs || '').toLowerCase();
      if (obs.includes('bronqu') && !obs.includes('asma')) {
        pat.bronquite = { on: true, obs: pat.asma.obs || '' };
        pat.asma = { on: false, obs: '' };
      }
    }
  }
  return p;
}

export function createPatient() {
  return defaultPatient();
}

export function duplicatePatient(src, asReturn) {
  const c = clone(src);
  const now = new Date().toISOString();
  c.id = uid();
  c.createdAt = now;
  c.updatedAt = now;
  c.dexNumber = '';
  if (!asReturn) c.dexPokemon = '';
  c.p.data = todayISO();
  if (asReturn) {
    c.p.tipo = 'Retorno';
    c.ex.req = {};
    c.ex.reqData = todayISO();
    c.ex.just = '';
  } else {
    c.p.nome = (c.p.nome || 'Sem nome') + ' (cópia)';
  }
  c.r.meals.forEach((m) => (m.id = uid()));
  return normalizePatient(c);
}

// ---------- Persistência ----------
export function loadSettings() {
  try {
    return { nome: '', crn: '', clinica: '', end: '', tel: '', logo: '', ...JSON.parse(store.get(KEYS.settings) || '{}') };
  } catch {
    return { nome: '', crn: '', clinica: '', end: '', tel: '', logo: '' };
  }
}
export function saveSettings(s) {
  store.set(KEYS.settings, JSON.stringify(s));
}
export function loadPatients() {
  try {
    const arr = JSON.parse(store.get(KEYS.patients) || '[]');
    if (!Array.isArray(arr)) return [];
    const list = arr.map(normalizePatient);
    if (assignDexEntries(list) && list.length) savePatients(list);
    return list;
  } catch {
    return [];
  }
}
export function savePatients(list) {
  store.set(KEYS.patients, JSON.stringify(list));
}

// ---------- Backup ----------
export function buildBackup(list, settings) {
  return { app: 'Anamnese NutriPro', version: 1, exportedAt: new Date().toISOString(), settings, patients: list };
}
export function exportBackup(list, settings) {
  const blob = new Blob([JSON.stringify(buildBackup(list, settings), null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `nutripro-backup-${todayISO()}.json`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 500);
}
/** Mescla backup na lista (por id; mantém o mais recente). */
export function importBackup(text, list) {
  const data = JSON.parse(text);
  let incoming = [];
  let settings = null;
  if (Array.isArray(data)) incoming = data;
  else if (data && Array.isArray(data.patients)) {
    incoming = data.patients;
    settings = data.settings || null;
  } else if (data && data.p && data.h) incoming = [data];
  else throw new Error('Arquivo de backup inválido.');
  let added = 0, updated = 0;
  const out = list.slice();
  incoming.forEach((raw) => {
    const p = normalizePatient(raw);
    const i = out.findIndex((x) => x.id === p.id);
    if (i === -1) {
      out.push(p);
      added++;
    } else if ((p.updatedAt || '') > (out[i].updatedAt || '')) {
      out[i] = p;
      updated++;
    }
  });
  assignDexEntries(out);
  return { list: out, added, updated, settings };
}

// ---------- Paciente exemplo ----------
export function samplePatient() {
  const p = defaultPatient();
  p.id = 'exemplo-' + uid();
  const hojeISO = todayISO();
  const L = (nome, dose, hor) => ({ nome, dose, hor });
  deepMerge(p, {
    p: {
      data: hojeISO, tipo: '1ª Consulta', nome: 'Mariana Souza Almeida', nasc: '1990-05-14', sexo: 'Feminino',
      cpf: 'PRONT-000123', tel: '(11) 98765-4321', cidade: 'São Paulo - SP', prof: 'Analista de sistemas',
      motivo: 'Deseja emagrecer cerca de 10 kg, melhorar a disposição e o funcionamento intestinal. Encaminhada pela endocrinologista.',
      tags: { Emagrecimento: true, 'Saúde intestinal': true, 'Encaminhamento médico': true },
      dietasPrev: 'Sim',
      dietasObs: 'Dieta low carb em 2024 (perdeu 6 kg e recuperou em 5 meses) e acompanhamento nutricional em 2022. Funcionou: cardápio com horários fixos. Dificuldades: compulsão por doces à noite, rotina de trabalho e fins de semana.',
    },
    h: {
      pat: {
        predm: { on: true, obs: 'Diagnóstico há 1 ano' },
        dislip: { on: true, obs: 'LDL elevado há 2 anos' },
        hipotireo: { on: true, obs: 'Hashimoto há 5 anos' },
        sop: { on: true, obs: 'Diagnóstico aos 24 anos' },
        ansiedade: { on: true, obs: 'Ansiedade leve, sem medicação' },
        cirurg: { on: true, obs: 'Cesárea (2018)' },
      },
      dmTipo: 'Pré-diabetes',
      fam: { dm: true, has: true, obes: true, outros: 'Mãe com hipotireoidismo' },
      meds: [L('Levotiroxina', '75 mcg', '07:00 (jejum)'), L('Metformina', '850 mg', '20:00 (com jantar)')],
      sups: [
        { nome: 'Vitamina D3', dose: '2.000 UI', freq: 'Diário' },
        { nome: 'Ômega 3', dose: '1 g', freq: 'Diário' },
        { nome: 'Whey Protein', dose: '30 g', freq: '3x/semana (pós-treino)' },
      ],
      alergia: 'Não', intol: 'Sim',
      intolQuais: 'Lactose: tolera até 1/2 copo de leite; queijos maturados bem tolerados.',
      ciclo: 'Irregular', anticoncepcional: 'Não', tpm: 'Sim',
    },
    gi: {
      bristol: [2], freq: 'A cada 2 dias', esforco: 'Frequente/Sempre', incompleta: 'Às vezes', dor: 'Sim',
      laxQual: 'Chá de sene, 1-2x por semana',
      sint: { gases: 'Frequente', distensao: 'Frequente', dor: 'Às vezes', azia: 'Às vezes', refluxo: 'Nunca', empach: 'Às vezes', nausea: 'Nunca' },
      mastig: 'Come muito rápido / mastiga pouco', disfagia: 'Não', bucal: { integra: true },
      semio: { cabelo: true, unhas: true, pele: true, fadiga: true, caimbra: true },
      semioObs: 'Queda de cabelo há ~4 meses; cansaço no meio da tarde.',
    },
    v: {
      dorme: '23:30', acorda: '06:30', qualSono: 'Acorda à noite', estuda: 'Não', trabalha: 'Sim',
      trabHor: '08:00 às 17:00', esforco: 'Sedentário', tela: '8', estresse: '7',
      mora: 'Marido e filho de 7 anos', compras: 'Ela e o marido (supermercado semanal)',
      prepara: 'Ela, à noite; almoço em restaurante por quilo',
      equip: { fogao: true, geladeira: true, micro: true, airfryer: true, liquid: true, balanca: false },
      af: 'Sim',
      afList: [
        { mod: 'Musculação', freq: '3', hor: '18:30', dur: '60', tempo: '4 meses', int: 'Moderada' },
        { mod: 'Caminhada', freq: '2', hor: '07:00', dur: '30', tempo: '1 ano', int: 'Leve' },
      ],
      fuma: 'Não', alcool: 'Sim', alcTipo: 'Vinho', alcFreq: '1-2x/semana (fins de semana)', alcQtd: '2 taças (150 ml cada)',
    },
    a: {
      tvCel: 'Sempre', horaFome: 'Final da tarde (16h–18h) e à noite', apetite: 'Aumenta / Compulsão',
      apetiteRelato: 'Em dias estressantes busca doces e chocolate à noite.', fds: 'Piora muito',
      fdsDesc: 'Pizza, hambúrguer e vinho; refeições fora de horário.',
      preferidos: 'Massas, chocolate, queijos, frutas (manga, uva)', aversoes: 'Fígado, quiabo, beterraba',
      agua: '1,2', aguaUnid: 'L', urina: 'Amarelo-escuro',
      freq: {
        frutas: { f: '3-5x sem', obs: '1 porção/dia' }, vegetais: { f: 'Diário', obs: '2 porções/dia (almoço)' },
        leguminosas: { f: 'Diário', obs: 'Feijão carioca, 1 concha' },
        carnes: { f: 'Diário', obs: 'Frango grelhado, carne moída; ovo mexido 2x/sem; frito 1x/sem' },
        laticinios: { f: 'Diário', obs: 'Leite sem lactose, queijo mussarela, iogurte' },
        integrais: { f: 'Raramente', obs: 'Pão integral ocasional' },
        cafe: { f: 'Diário', obs: '3x/dia, ~450 ml' }, acucar: { f: 'Diário', obs: '3 colheres de sopa/dia' },
        adocante: { f: 'Não', obs: '' }, doces: { f: 'Diário', obs: 'Chocolate, biscoito recheado, bolo (2-3x/dia)' },
        refri: { f: '1-2x sem', obs: '350 ml, nos fins de semana' },
        ultra: { f: '3-5x sem', obs: 'Embutidos (presunto/salsicha), delivery 2x/semana' },
        oleo: { f: 'Diário', obs: 'Óleo de soja, ~2 latas/mês (3 pessoas)' },
      },
    },
    an: {
      peso: '78,5', pesoHab: '82', pesoObj: '68', altura: '1,65', cc: '92', ca: '98', cq: '104', cb: '31', cp: '36', pesc: '35',
      db: '12', dt: '22', dsi: '28', dse: '26',
      hist: [
        { data: '2026-08-25', peso: '82,0', altura: '1,65', imc: '30,1', cc: '96', ca: '102', cq: '106', cb: '32', cp: '36', dobras: '96' },
        { data: '2026-10-20', peso: '80,2', altura: '1,65', imc: '29,5', cc: '94', ca: '100', cq: '105', cb: '31,5', cp: '36', dobras: '92' },
      ],
    },
    ex: {
      dates: [
        { data: '2026-08-20', v: { hemoglobina: '12,8', hematocrito: '38', glicemia: '104', hba1c: '5,9', insulina: '16', homa: '4,1', colt: '224', hdl: '46', ldl: '142', vldl: '36', tg: '180', ureia: '28', creatinina: '0,8', acurico: '5,1', tgo: '24', tgp: '31', ggt: '28', fa: '78', tsh: '4,6', t4l: '1,0', ferritina: '18', ferro: '62', ist: '17', vitd: '22', b12: '310', folico: '7,2', zinco: '78', calcio: '9,4', potassio: '4,2', pcr: '3,2', cx1: '95' } },
        { data: '2026-11-10', v: { hemoglobina: '13,1', hematocrito: '39', glicemia: '99', hba1c: '5,7', insulina: '13', homa: '3,2', colt: '205', hdl: '50', ldl: '124', vldl: '31', tg: '155', ureia: '30', creatinina: '0,8', acurico: '4,8', tgo: '22', tgp: '26', ggt: '25', fa: '80', tsh: '3,1', t4l: '1,1', t3l: '3,0', ferritina: '24', ferro: '70', ist: '20', vitd: '31', b12: '368', folico: '8,0', zinco: '82', magnesio: '2,0', calcio: '9,5', fosforo: '3,6', potassio: '4,1', ptn: '7,1', albumina: '4,4', pcr: '2,1', homocisteina: '11,5', cortisol: '14' } },
      ],
      custom: [{ id: 'cx1', nome: 'Selênio', unit: 'µg/L' }],
      req: { hemograma: true, lipidograma: true, glicemia: true, hba1c: true, insulina: true, tsh: true, vitd: true, b12: true, ferritina: true, pcr: true },
      extras: 'Selênio sérico\nCálcio e magnésio séricos',
      just: 'Acompanhamento nutricional: rastreio metabólico, carências nutricionais e função tireoidiana (pré-diabetes, dislipidemia e hipotireoidismo).',
      reqData: hojeISO,
    },
    dx: {
      diag: '',
      conduta: 'Plano alimentar hipocalórico (~1.600 kcal/dia), fracionado em 5-6 refeições, com aumento de fibras (30 g/dia) e hidratação adequada. Substituição gradual de ultraprocessados e açúcar de adição.',
      metas: '1) Atingir 2,0 L de água/dia em 2 semanas.\n2) Incluir 3 porções de frutas e 2 de hortaliças/dia.\n3) Reduzir doces para 1x/dia.\n4) Meta de perda: 0,5 kg/semana.',
      orient: 'Mastigar devagar, evitar telas nas refeições, manter horários regulares, usar suplemento conforme prescrição médica.',
      evol: [{ data: '2026-10-20', texto: 'Retorno: perda de 1,8 kg desde a 1ª consulta. Boa adesão ao café da manhã e almoço; ainda com compulsão noturna 2x/semana. Mantida conduta.' }],
    },
  });
  p.r.meals[0] = { ...p.r.meals[0], hor: '06:45', local: 'Casa', desc: 'Café com leite sem lactose (200 ml) com 1 col. sopa de açúcar; 1 pão francês com margarina e 2 fatias de queijo mussarela.' };
  p.r.meals[1] = { ...p.r.meals[1], hor: '10:00', local: 'Trabalho', desc: '1 banana prata média + 1 barra de cereal.' };
  p.r.meals[2] = { ...p.r.meals[2], hor: '12:30', local: 'Restaurante/Rua', desc: 'Arroz branco (4 col. sopa), feijão (1 concha), frango grelhado (1 filé médio), salada de alface e tomate (à vontade), 1 copo de suco de caixinha (200 ml).' };
  p.r.meals[3] = { ...p.r.meals[3], hor: '16:00', local: 'Trabalho', desc: 'Café com 2 col. sopa de açúcar (100 ml) + 4 biscoitos recheados.' };
  p.r.meals[4] = { ...p.r.meals[4], hor: '20:00', local: 'Casa', desc: 'Macarrão ao molho de tomate com carne moída (1 prato fundo); refrigerante ou vinho nos fins de semana.' };
  p.r.meals[5] = { ...p.r.meals[5], hor: '22:30', local: 'Casa', desc: 'Iogurte (170 g) ou 2 quadradinhos de chocolate ao leite.' };
  p.r.meals.push({ id: uid(), nome: 'Pós-treino', extra: true, nao: false, hor: '19:45', local: 'Casa', desc: 'Whey protein (30 g) com água, 3x/semana.' });
  return normalizePatient(p);
}
