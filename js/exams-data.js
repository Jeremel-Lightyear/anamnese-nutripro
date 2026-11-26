// Exames: registro longitudinal, referências científicas, semáforo, solicitação e combos rápidos
import { parseBRNumber, homaIR, ckdEpi2021, fmt } from './calculations.js';

// ---------- Referências bibliográficas (agrupadas por categoria) ----------
export const REFERENCES = [
  {
    id: 'lipid', cat: 'Perfil Lipídico',
    items: ['Sociedade Brasileira de Cardiologia (SBC). Atualização da Diretriz Brasileira de Dislipidemias e Prevenção da Aterosclerose – 2025. Arq Bras Cardiol. 2025.'],
  },
  {
    id: 'glic', cat: 'Perfil Glicêmico',
    items: ['Sociedade Brasileira de Diabetes (SBD). Diretriz Oficial da Sociedade Brasileira de Diabetes – Edição 2024 (Diagnóstico de diabetes mellitus).'],
  },
  {
    id: 'homa', cat: 'Resistência à Insulina (HOMA-IR)',
    items: ['Geloneze B, Vasques ACJ, Stabe CFC, et al. HOMA1-IR and HOMA2-IR indexes in identifying insulin resistance and metabolic syndrome: Brazilian Metabolic Syndrome Study (BRAMS). Arq Bras Endocrinol Metabol. 2009;53(2):281–287.'],
  },
  {
    id: 'anemia', cat: 'Hemoglobina e Anemia',
    items: ['World Health Organization (WHO). Guideline on haemoglobin cutoffs to define anaemia in individuals and populations. Geneva: WHO; 2024.'],
  },
  {
    id: 'ferro', cat: 'Ferritina e Ferro',
    items: ['World Health Organization (WHO). WHO guideline on use of ferritin concentrations to assess iron status in individuals and populations. Geneva: WHO; 2020.'],
  },
  {
    id: 'renal', cat: 'Função Renal e TFGe',
    items: [
      'Kidney Disease: Improving Global Outcomes (KDIGO). KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease. Kidney Int. 2024;105(4S):S117–S314.',
      'Inker LA, et al. New Creatinine- and Cystatin C-Based Equations to Estimate GFR without Race (CKD-EPI 2021). N Engl J Med. 2021;385:1737–1749.',
    ],
  },
  {
    id: 'vitd', cat: 'Vitamina D',
    items: ['Sociedade Brasileira de Endocrinologia e Metabologia (SBEM) e Sociedade Brasileira de Patologia Clínica/Medicina Laboratorial (SBPC/ML). Posicionamento Oficial sobre Intervalos de Referência da Vitamina D – 25(OH)D.'],
  },
  {
    id: 'tireo', cat: 'Tireoide',
    items: ['Departamento de Tireoide da Sociedade Brasileira de Endocrinologia e Metabologia (SBEM). Consenso Brasileiro para Diagnóstico e Tratamento do Hipotireoidismo. Arq Bras Endocrinol Metabol.'],
  },
  {
    id: 'ped', cat: 'Antropometria e Hidratação Pediátrica',
    items: [
      'WHO Multicentre Growth Reference Study Group. WHO Child Growth Standards (0–5 years). Geneva: WHO; 2006.',
      'de Onis M et al. Development of a WHO growth reference for school-aged children and adolescents (5–19 years). Bull World Health Organ. 2007;85:660–667.',
      'Brasil. Ministério da Saúde. Orientações para a coleta e análise de dados antropométricos em serviços de saúde: Norma Técnica do SISVAN.',
      'Holliday MA, Segar WE. The maintenance need for water in parenteral fluid therapy. Pediatrics. 1957;19(5):823–832.',
      'Institute of Medicine (IOM). Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate. Washington, DC: National Academies Press; 2005.',
    ],
  },
  {
    id: 'outros', cat: 'Demais marcadores (Vitaminas, Eletrólitos, Enzimas Hepáticas)',
    items: [
      'Manual MSD – Versão para Profissionais de Saúde.',
      'Intervalos de referência laboratoriais padronizados (SBPC/ML), sempre sujeitos à conferência do método/laudo.',
    ],
  },
];

// ---------- Avaliadores (semáforo) ----------
const OK = ['Normal', 'ok'];
const LOW = ['Baixo', 'bad'];
const HIGH = ['Alto', 'bad'];
const WARN = (t) => [t, 'warn'];
const rng = (lo, hi) => (v) => (v < lo ? LOW : v > hi ? HIGH : OK);
const rngS = (f, m) => (v, s) => {
  const r = s === 'Feminino' ? f : m;
  return v < r[0] ? LOW : v > r[1] ? HIGH : OK;
};
const maxS = (f, m) => (v, s) => (v > (s === 'Feminino' ? f : m) ? HIGH : OK);
const ltS = (f, m) => (v, s) => (v >= (s === 'Feminino' ? f : m) ? HIGH : OK);

// k: id (NÃO ALTERAR — compatível com pacientes salvos) · n: nome · u: unidade · r: referência
// src: fonte curta · note: observação clínica · cut: cortes completos · cat: categoria da bibliografia
export const LAB_EXAMS = [
  { k: 'hemoglobina', n: 'Hemoglobina', u: 'g/dL', r: 'F 12,0–16,0 · M 13,5–17,5', src: 'OMS 2024', cat: 'anemia', sexDep: true,
    note: 'Cortes OMS de anemia em adultos não gestantes: F < 12,0 e M < 13,0 g/dL; gestantes 2º tri < 10,5 g/dL.',
    cut: 'Referência: F 12,0–16,0 · M 13,5–17,5 g/dL. Anemia (OMS, adultos não gestantes): F < 12,0 · M < 13,0 g/dL; gestantes 2º trimestre < 10,5 g/dL.',
    ev: rngS([12, 16], [13.5, 17.5]) },
  { k: 'hematocrito', n: 'Hematócrito', u: '%', r: 'F 36–46 · M 41–53', src: 'MSD / SBPC-ML', cat: 'outros', sexDep: true,
    note: 'Conferir faixa do laudo (método do analisador).', cut: 'F 36–46% · M 41–53%.', ev: rngS([36, 46], [41, 53]) },
  { k: 'glicemia', n: 'Glicemia de jejum', u: 'mg/dL', r: '70–99', src: 'SBD 2024', cat: 'glic',
    note: 'Diagnóstico de diabetes requer confirmação por 2ª medida ou outro critério.',
    cut: 'Baixo < 70 · Normal 70–99 · Pré-DM 100–125 · DM ≥ 126 mg/dL.',
    ev: (v) => (v < 70 ? LOW : v < 100 ? OK : v < 126 ? WARN('Pré-DM') : ['DM / Alto', 'bad']) },
  { k: 'hba1c', n: 'HbA1c', u: '%', r: '< 5,7', src: 'SBD 2024', cat: 'glic',
    note: 'Pode ser afetada por anemias, hemoglobinopatias e gestação.',
    cut: 'Normal < 5,7 · Pré-DM 5,7–6,4 · DM ≥ 6,5 %.',
    ev: (v) => (v < 5.7 ? OK : v < 6.5 ? WARN('Pré-DM') : ['DM / Alto', 'bad']) },
  { k: 'insulina', n: 'Insulina', u: 'µUI/mL', r: '2–25', src: 'SBD / método', cat: 'glic',
    note: 'Alta variabilidade conforme kit/método laboratorial; não usar isoladamente para diagnóstico.',
    cut: 'Referência usual de jejum: 2–25 µUI/mL (varia conforme kit/método).', ev: rng(2, 25) },
  { k: 'homa', n: 'HOMA-IR', u: '', r: '< 2,7', src: 'BRAMS (2009)', cat: 'homa', auto: true,
    note: 'Corte para adultos brasileiros (Geloneze et al.). Não aplicar em pacientes em uso de insulina exógena. Calculado automaticamente: (glicemia × insulina) / 405.',
    cut: 'Normal < 2,7 · Alto ≥ 2,7.', ev: (v) => (v < 2.7 ? OK : HIGH) },
  { k: 'colt', n: 'Colesterol Total', u: 'mg/dL', r: '< 190', src: 'SBC 2025', cat: 'lipid',
    note: 'Interpretar junto de LDL, HDL e não-HDL.', cut: 'Normal < 190 · Alto ≥ 190 mg/dL.', ev: (v) => (v < 190 ? OK : HIGH) },
  { k: 'hdl', n: 'HDL', u: 'mg/dL', r: '> 40', src: 'SBC 2025', cat: 'lipid',
    note: 'Valores muito elevados não conferem proteção adicional comprovada.', cut: 'Normal > 40 · Baixo ≤ 40 mg/dL.', ev: (v) => (v > 40 ? OK : LOW) },
  { k: 'ldl', n: 'LDL', u: 'mg/dL', r: '< 115 (baixo risco) · < 100 · < 70 · < 50 · < 40', src: 'SBC 2025', cat: 'lipid',
    note: 'A meta depende da estratificação de risco cardiovascular do paciente.',
    cut: 'Metas por risco: Baixo < 115 · Intermediário < 100 · Alto < 70 · Muito alto < 50 · Extremo < 40 mg/dL. Semáforo: Normal < 100 · Atenção 100–114 · Alto ≥ 115.',
    ev: (v) => (v < 100 ? OK : v < 115 ? WARN('Atenção') : HIGH) },
  { k: 'vldl', n: 'VLDL', u: 'mg/dL', r: '< 30', src: 'MSD / SBPC-ML', cat: 'outros',
    note: 'Geralmente estimado (TG/5); perde validade com TG elevado.', cut: 'Normal < 30 mg/dL.', ev: (v) => (v < 30 ? OK : HIGH) },
  { k: 'naohdl', n: 'Colesterol não-HDL', u: 'mg/dL', r: '< 145 (baixo risco) a < 70', src: 'SBC 2025', cat: 'lipid', auto: true,
    note: 'Calculado automaticamente: colesterol total − HDL. Útil quando TG elevado.',
    cut: 'Metas por risco: Baixo < 145 · Interm. < 130 · Alto < 100 · Muito alto < 80 · Extremo < 70 mg/dL. Semáforo: Normal < 130 · Atenção 130–144 · Alto ≥ 145.',
    ev: (v) => (v < 130 ? OK : v < 145 ? WARN('Atenção') : HIGH) },
  { k: 'tg', n: 'Triglicerídeos', u: 'mg/dL', r: '< 150 (jejum) · < 175 (sem jejum)', src: 'SBC 2025', cat: 'lipid',
    note: 'TG ≥ 500 mg/dL eleva o risco de pancreatite.', cut: 'Normal < 150 (jejum) · Atenção 150–174 · Alto ≥ 175 mg/dL.',
    ev: (v) => (v < 150 ? OK : v < 175 ? WARN('Atenção') : HIGH) },
  { k: 'ureia', n: 'Ureia', u: 'mg/dL', r: '15–45', src: 'KDIGO 2024', cat: 'renal',
    note: 'Influenciada por hidratação e ingestão proteica.', cut: 'Referência 15–45 mg/dL.', ev: rng(15, 45) },
  { k: 'creatinina', n: 'Creatinina', u: 'mg/dL', r: 'F 0,50–1,00 · M 0,70–1,20', src: 'KDIGO 2024', cat: 'renal', sexDep: true,
    note: 'Sofre influência direta da massa muscular e suplementação de creatina.',
    cut: 'F 0,50–1,00 · M 0,70–1,20 mg/dL.', ev: rngS([0.5, 1.0], [0.7, 1.2]) },
  { k: 'tfge', n: 'TFG estimada (TFGe)', u: 'mL/min/1,73m²', r: '≥ 90', src: 'KDIGO 2024', cat: 'renal', auto: true,
    note: 'Equação CKD-EPI 2021 sem fator raça; TFGe < 60 por ≥ 3 meses define DRC. Calculada automaticamente com creatinina, sexo e idade.',
    cut: 'Normal ≥ 90 · Atenção 60–89 · Baixo / DRC < 60 mL/min/1,73m².',
    ev: (v) => (v >= 90 ? OK : v >= 60 ? WARN('Atenção') : ['Baixo / DRC', 'bad']) },
  { k: 'acurico', n: 'Ácido Úrico', u: 'mg/dL', r: 'F 2,4–6,0 · M 3,4–7,2', src: 'MSD / SBPC-ML', cat: 'outros', sexDep: true,
    note: 'Conferir faixa do laudo.', cut: 'F 2,4–6,0 · M 3,4–7,2 mg/dL.', ev: rngS([2.4, 6.0], [3.4, 7.2]) },
  { k: 'tgo', n: 'TGO (AST)', u: 'U/L', r: 'F ≤ 32 · M ≤ 40', src: 'SBPC-ML', cat: 'outros', sexDep: true,
    note: 'Pode variar conforme reagente/método; conferir faixa do laudo.', cut: 'F ≤ 32 · M ≤ 40 U/L.', ev: maxS(32, 40) },
  { k: 'tgp', n: 'TGP (ALT)', u: 'U/L', r: 'F ≤ 33 · M ≤ 41', src: 'SBPC-ML', cat: 'outros', sexDep: true,
    note: 'Pode variar conforme reagente/método; conferir faixa do laudo.', cut: 'F ≤ 33 · M ≤ 41 U/L.', ev: maxS(33, 41) },
  { k: 'ggt', n: 'Gama GT', u: 'U/L', r: 'F < 40 · M < 60', src: 'SBPC-ML', cat: 'outros', sexDep: true,
    note: 'Pode variar conforme reagente/método; conferir faixa do laudo.', cut: 'F < 40 · M < 60 U/L.', ev: ltS(40, 60) },
  { k: 'fa', n: 'Fosfatase Alcalina', u: 'U/L', r: '40–129', src: 'MSD / SBPC-ML', cat: 'outros',
    note: 'Elevada fisiologicamente em crescimento e gestação.', cut: '40–129 U/L (adultos).', ev: rng(40, 129) },
  { k: 'tsh', n: 'TSH', u: 'mUI/L', r: '0,4–4,5', src: 'SBEM', cat: 'tireo',
    note: 'Gestantes: < 2,5 (1º tri) e < 3,0 mUI/L (2º/3º tri). Idosos > 65 anos toleram limite superior discretamente maior.',
    cut: 'Adultos: 0,4–4,5 mUI/L. Gestantes: < 2,5 (1º trimestre) · < 3,0 (2º/3º trimestres).', ev: rng(0.4, 4.5) },
  { k: 't4l', n: 'T4 Livre', u: 'ng/dL', r: '0,74–1,72', src: 'SBEM', cat: 'tireo',
    note: 'Fortemente dependente do kit laboratorial; sempre confrontar com o laudo.', cut: '0,74–1,72 ng/dL.', ev: rng(0.74, 1.72) },
  { k: 't3l', n: 'T3 Livre', u: 'pg/mL', r: '2,3–4,2', src: 'SBEM', cat: 'tireo',
    note: 'Dependente do método; confrontar com o laudo.', cut: '2,3–4,2 pg/mL.', ev: rng(2.3, 4.2) },
  { k: 'ferritina', n: 'Ferritina', u: 'ng/mL', r: 'F 13–150 · M 30–400', src: 'OMS 2020', cat: 'ferro', sexDep: true,
    note: 'Deficiência < 15 µg/L em saudáveis ou < 70 µg/L na presença de inflamação/infecção (proteína de fase aguda).',
    cut: 'Referência: F 13–150 · M 30–400 ng/mL. Deficiência de ferro (OMS): < 15 µg/L (saudáveis) ou < 70 µg/L com inflamação/infecção.',
    ev: rngS([13, 150], [30, 400]) },
  { k: 'ferro', n: 'Ferro Sérico', u: 'µg/dL', r: '60–170', src: 'MSD / SBPC-ML', cat: 'ferro',
    note: 'Variação circadiana e dependente de jejum; interpretar com ferritina e saturação.', cut: '60–170 µg/dL.', ev: rng(60, 170) },
  { k: 'ist', n: 'Índice de Sat. Transferrina', u: '%', r: '20–50', src: 'MSD / SBPC-ML', cat: 'ferro',
    note: 'Valores < 20% sugerem deficiência de ferro funcional.', cut: '20–50%.', ev: rng(20, 50) },
  { k: 'vitd', n: 'Vitamina D (25-OH)', u: 'ng/mL', r: '20–60', src: 'SBEM / SBPC-ML', cat: 'vitd',
    note: 'População geral saudável < 65a: > 20 ng/mL. Idosos, gestantes e osteoporose: 30–60 ng/mL.',
    cut: 'Baixo < 20 · Atenção 20–29 (grupos de risco) · Normal 30–60 · Alto > 60 · Risco tox. > 100 ng/mL.',
    ev: (v) => (v < 20 ? LOW : v < 30 ? WARN('Atenção') : v <= 60 ? OK : v <= 100 ? HIGH : ['Risco tox.', 'bad']) },
  { k: 'b12', n: 'Vitamina B12', u: 'pg/mL', r: '200–900', src: 'MSD / SBPC-ML', cat: 'outros',
    note: 'Valores entre 200–300 pg/mL podem exigir correlação clínica/homocisteína.',
    cut: 'Baixo < 200 · Atenção 200–299 · Normal 300–900 · Alto > 900 pg/mL.',
    ev: (v) => (v < 200 ? LOW : v < 300 ? WARN('Atenção') : v <= 900 ? OK : HIGH) },
  { k: 'folico', n: 'Ácido Fólico', u: 'ng/mL', r: '3,1–17,5', src: 'MSD / SBPC-ML', cat: 'outros',
    note: 'Em gestantes, priorizar níveis > 5 ng/mL.', cut: '3,1–17,5 ng/mL.', ev: rng(3.1, 17.5) },
  { k: 'vitc', n: 'Vitamina C', u: 'mg/dL', r: '0,4–2,0', src: 'MSD / SBPC-ML', cat: 'outros',
    note: 'Sensível à conservação da amostra (proteger da luz e analisar rápido).', cut: '0,4–2,0 mg/dL.', ev: rng(0.4, 2.0) },
  { k: 'zinco', n: 'Zinco', u: 'µg/dL', r: '70–120', src: 'MSD / SBPC-ML', cat: 'outros',
    note: 'Reduz em fase aguda inflamatória; evitar tubos com contaminação por zinco.', cut: '70–120 µg/dL.', ev: rng(70, 120) },
  { k: 'magnesio', n: 'Magnésio', u: 'mg/dL', r: '1,7–2,4', src: 'MSD / SBPC-ML', cat: 'outros',
    note: 'Magnésio sérico pouco reflete o estoque corporal total.', cut: '1,7–2,4 mg/dL.', ev: rng(1.7, 2.4) },
  { k: 'calcio', n: 'Cálcio', u: 'mg/dL', r: '8,6–10,2', src: 'MSD / SBPC-ML', cat: 'outros',
    note: 'Corrigir pela albumina quando houver hipoalbuminemia.', cut: '8,6–10,2 mg/dL.', ev: rng(8.6, 10.2) },
  { k: 'fosforo', n: 'Fósforo', u: 'mg/dL', r: '2,5–4,5', src: 'MSD / SBPC-ML', cat: 'outros',
    note: 'Valores mais altos em crianças.', cut: '2,5–4,5 mg/dL (adultos).', ev: rng(2.5, 4.5) },
  { k: 'potassio', n: 'Potássio', u: 'mEq/L', r: '3,5–5,1', src: 'MSD / SBPC-ML', cat: 'outros',
    note: 'Hemólise da amostra pode elevar falsamente o resultado.', cut: '3,5–5,1 mEq/L.', ev: rng(3.5, 5.1) },
  { k: 'pth', n: 'PTH', u: 'pg/mL', r: '15–65', src: 'MSD / SBPC-ML', cat: 'outros',
    note: 'Interpretar junto de cálcio e 25(OH)D.', cut: '15–65 pg/mL.', ev: rng(15, 65) },
  { k: 'ptn', n: 'Proteínas Totais', u: 'g/dL', r: '6,0–8,3', src: 'MSD / SBPC-ML', cat: 'outros',
    note: 'Conferir faixa do laudo.', cut: '6,0–8,3 g/dL.', ev: rng(6.0, 8.3) },
  { k: 'albumina', n: 'Albumina', u: 'g/dL', r: '3,5–5,2', src: 'MSD / SBPC-ML', cat: 'outros',
    note: 'Proteína de fase aguda negativa; reflete estado inflamatório e não deve ser usada isoladamente como marcador de desnutrição.',
    cut: '3,5–5,2 g/dL.', ev: rng(3.5, 5.2) },
  { k: 'pcr', n: 'PCR Ultrassensível', u: 'mg/L', r: '< 1,0 baixo · 1,0–3,0 interm. · > 3,0 alto', src: 'MSD / SBPC-ML', cat: 'outros',
    note: 'Valores > 10 mg/L sugerem processo infeccioso ou inflamatório agudo.',
    cut: 'Risco baixo < 1,0 · Intermediário 1,0–3,0 · Alto > 3,0 mg/L. > 10 mg/L: investigar processo agudo.',
    ev: (v) => (v < 1 ? OK : v <= 3 ? WARN('Avaliar risco') : HIGH) },
  { k: 'homocisteina', n: 'Homocisteína', u: 'µmol/L', r: '5–15', src: 'MSD / SBPC-ML', cat: 'outros',
    note: 'Eleva-se na deficiência de B12, folato e B6.', cut: '5–15 µmol/L.', ev: rng(5, 15) },
  { k: 'cortisol', n: 'Cortisol', u: 'µg/dL', r: '6–18 (manhã)', src: 'MSD / SBPC-ML', cat: 'outros',
    note: 'Ritmo circadiano: coleta matinal (6–10h). Sem semáforo automático.', cut: '6–18 µg/dL (coleta matinal).', ev: null },
  { k: 'prot24', n: 'Proteinúria 24h', u: 'mg/24h', r: '< 150', src: 'KDIGO 2024', cat: 'renal',
    note: 'Depende de coleta completa de 24h.', cut: 'Normal < 150 mg/24h.', ev: (v) => (v < 150 ? OK : HIGH) },
];

export const LAB_BY_KEY = Object.fromEntries(LAB_EXAMS.map((e) => [e.k, e]));
export const refsFor = (exam) => REFERENCES.find((r) => r.id === exam.cat) || REFERENCES[REFERENCES.length - 1];

const has = (s) => s !== undefined && s !== null && String(s).trim() !== '';

/** Valor efetivo: digitado manualmente ou calculado (HOMA-IR, não-HDL, TFGe). ctx = { sex, age } */
export function labValue(d, key, ctx = {}) {
  const v = (d && d.v) || {};
  if (has(v[key])) return String(v[key]);
  const P = parseBRNumber;
  if (key === 'homa') {
    const h = homaIR(P(v.glicemia), P(v.insulina));
    return h !== null ? fmt(h, 2) : '';
  }
  if (key === 'naohdl') {
    const ct = P(v.colt), hdl = P(v.hdl);
    return ct !== null && hdl !== null && ct - hdl > 0 ? fmt(ct - hdl, 0) : '';
  }
  if (key === 'tfge') {
    const g = ckdEpi2021(P(v.creatinina), ctx.age, ctx.sex);
    return g !== null ? fmt(g, 0) : '';
  }
  return '';
}
export const isAutoValue = (d, key, ctx = {}) => !has(d && d.v && d.v[key]) && labValue(d, key, ctx) !== '';

/** Semáforo: retorna { label, tone } ou null. tone: ok | warn | bad | neutral */
export function evalExam(key, valueStr, sex) {
  const e = LAB_BY_KEY[key];
  if (!e || !e.ev || !has(valueStr)) return null;
  const v = parseBRNumber(valueStr);
  if (v === null) return null;
  if (e.sexDep && sex !== 'Masculino' && sex !== 'Feminino') return { label: 'Definir sexo', tone: 'neutral' };
  const r = e.ev(v, sex);
  return r ? { label: r[0], tone: r[1] } : null;
}

export const REQUEST_EXAMS = [
  { k: 'hemograma', n: 'Hemograma completo' },
  { k: 'lipidograma', n: 'Colesterol total e frações' },
  { k: 'glicemia', n: 'Glicemia' },
  { k: 'hba1c', n: 'HbA1c' },
  { k: 'insulina', n: 'Insulina / HOMA-IR e Beta' },
  { k: 'ureiacreat', n: 'Ureia / Creatinina' },
  { k: 'acurico', n: 'Ácido úrico' },
  { k: 'tgotgp', n: 'TGO / TGP' },
  { k: 'fagtt', n: 'FA / GGT' },
  { k: 'tsh', n: 'TSH / T4 livre' },
  { k: 'vitc', n: 'Vitamina C' },
  { k: 'vitd', n: '25(OH)VitD' },
  { k: 'b12', n: 'Vitamina B12' },
  { k: 'folico', n: 'Ácido fólico' },
  { k: 'homocisteina', n: 'Homocisteína' },
  { k: 'zinco', n: 'Zinco' },
  { k: 'ferritina', n: 'Ferritina' },
  { k: 'transferrina', n: 'Transferrina e Índ. sat. de transf.' },
  { k: 'proteinas', n: 'Proteínas totais e frações' },
  { k: 'totl', n: 'Teste oral de tolerância à lactose (TOTL)' },
  { k: 'totg', n: 'Teste oral de tolerância à glicose (TOTG)' },
  { k: 'pcr', n: 'Proteína C reativa ultrassensível' },
  { k: 'fibrinogenio', n: 'Fibrinogênio' },
];

export const COMBOS = [
  {
    id: 'metabolico',
    label: 'Check-up Metabólico Básico',
    keys: ['hemograma', 'lipidograma', 'glicemia', 'hba1c', 'insulina', 'ureiacreat', 'acurico', 'tgotgp', 'pcr'],
  },
  {
    id: 'anemias',
    label: 'Rastreio de Anemias e Carências',
    keys: ['hemograma', 'ferritina', 'transferrina', 'b12', 'folico', 'vitd', 'zinco', 'homocisteina'],
  },
  {
    id: 'tireo-hepatico',
    label: 'Perfil Tireoidiano e Hepático',
    keys: ['tsh', 'tgotgp', 'fagtt', 'proteinas'],
  },
];
