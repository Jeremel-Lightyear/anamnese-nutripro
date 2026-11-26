// Exames: registro longitudinal, referências científicas, semáforo, solicitação e combos rápidos
import { parseBRNumber, homaIR, ckdEpi2021, bedsideSchwartz, fmt } from './calculations.js';

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
    id: 'lipid-ped', cat: 'Perfil Lipídico Pediátrico',
    items: [
      'Sociedade Brasileira de Cardiologia (SBC) / Sociedade Brasileira de Pediatria (SBP). Diretriz de Prevenção da Aterosclerose na Infância e Adolescência / Atualização da Diretriz Brasileira de Dislipidemias.',
    ],
  },
  {
    id: 'renal-ped', cat: 'Função Renal Pediátrica (TFGe)',
    items: [
      'Schwartz GJ, Muñoz A, Schneider MF, et al. New equations to estimate GFR in children with CKD (Bedside Schwartz). J Am Soc Nephrol. 2009;20(3):629–637.',
      'Kidney Disease: Improving Global Outcomes (KDIGO). KDIGO 2024 CKD Guideline.',
    ],
  },
  {
    id: 'glic-ped', cat: 'Glicemia e HOMA-IR Pediátrico',
    items: [
      'Sociedade Brasileira de Diabetes (SBD 2024) / ISPAD Clinical Practice Consensus Guidelines; avaliação de HOMA-IR condicionada ao estadiamento puberal de Tanner.',
    ],
  },
  {
    id: 'caliper', cat: 'Intervalos Pediátricos de Crescimento',
    items: [
      'Adeli K et al. CALIPER Database — Pediatric Reference Intervals (CSCC/AACC) e recomendações da SBP.',
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

/** Badge de protocolo etário ativo para a Aba 8 e impressão A4. */
export function labAgeBadge(ctx = {}) {
  const age = ctx && ctx.age !== null && ctx.age !== undefined && Number.isFinite(ctx.age) ? ctx.age : null;
  if (age === null) {
    return {
      protocol: 'Adulto',
      label: 'Parâmetros ativos: Adulto',
      hint: 'Informar data de nascimento para ajuste etário',
      printLabel: 'Adulto',
      isPediatric: false,
      missingDob: true,
    };
  }
  const months = ctx.ageMonths !== null && ctx.ageMonths !== undefined && Number.isFinite(ctx.ageMonths) ? ctx.ageMonths : age * 12;
  if (age < 12) {
    const ageDisp = age < 2 ? `${Math.floor(months)} meses` : `${age} anos`;
    return {
      protocol: 'Pediátrico',
      label: `Parâmetros ativos: Pediátrico (${ageDisp})`,
      hint: '',
      printLabel: `Pediátrico · ${ageDisp}`,
      isPediatric: true,
      missingDob: false,
    };
  }
  if (age < 20) {
    return {
      protocol: 'Adolescente',
      label: `Parâmetros ativos: Adolescente (${age} anos)`,
      hint: '',
      printLabel: `Adolescente · ${age} anos`,
      isPediatric: true,
      missingDob: false,
    };
  }
  return {
    protocol: 'Adulto',
    label: `Parâmetros ativos: Adulto (${age} anos)`,
    hint: '',
    printLabel: `Adulto · ${age} anos`,
    isPediatric: false,
    missingDob: false,
  };
}

/** Retorna definição do exame adaptada à idade do paciente (preservando id `k`). */
export function examForAge(examOrKey, ctx = {}) {
  const e = typeof examOrKey === 'string' ? LAB_BY_KEY[examOrKey] : examOrKey;
  if (!e) return null;
  const years = ctx && ctx.age !== null && ctx.age !== undefined && Number.isFinite(ctx.age) ? ctx.age : null;
  if (years === null) return e;
  const months = ctx.ageMonths !== null && ctx.ageMonths !== undefined && Number.isFinite(ctx.ageMonths) ? ctx.ageMonths : years * 12;

  switch (e.k) {
    case 'hemoglobina':
      if (months < 6) {
        return {
          ...e, r: 'Faixa etária lactente (ver laudo)', sexDep: false,
          note: 'Em lactentes < 6 meses a hemoglobina varia rapidamente; confrontar com o laudo.',
          cut: 'Menor de 6 meses: confrontar com faixa etária do laudo.',
          ev: () => ['Conferir laudo', 'neutral'],
        };
      }
      if (months < 24) {
        return {
          ...e, r: '≥ 10,5', sexDep: false,
          note: 'Corte OMS 2024 para 6–23 meses: anemia < 10,5 g/dL.',
          cut: 'Normal ≥ 10,5 · Baixo / Anemia < 10,5 g/dL (6–23 meses, OMS 2024).',
          ev: (v) => (v < 10.5 ? LOW : OK),
        };
      }
      if (months < 60) {
        return {
          ...e, r: '≥ 11,0', sexDep: false,
          note: 'Corte OMS 2024 para 2–4 anos (24–59 meses): anemia < 11,0 g/dL.',
          cut: 'Normal ≥ 11,0 · Baixo / Anemia < 11,0 g/dL (2–4 anos, OMS 2024).',
          ev: (v) => (v < 11.0 ? LOW : OK),
        };
      }
      if (years <= 11) {
        return {
          ...e, r: '≥ 11,5', sexDep: false,
          note: 'Corte OMS 2024 para 5–11 anos: anemia < 11,5 g/dL.',
          cut: 'Normal ≥ 11,5 · Baixo / Anemia < 11,5 g/dL (5–11 anos, OMS 2024).',
          ev: (v) => (v < 11.5 ? LOW : OK),
        };
      }
      if (years <= 14) {
        return {
          ...e, r: '≥ 12,0', sexDep: false,
          note: 'Corte OMS 2024 para 12–14 anos: anemia < 12,0 g/dL.',
          cut: 'Normal ≥ 12,0 · Baixo / Anemia < 12,0 g/dL (12–14 anos, OMS 2024).',
          ev: (v) => (v < 12.0 ? LOW : OK),
        };
      }
      return e;

    case 'ferritina':
      if (years < 5) {
        return {
          ...e, r: '≥ 12 (deficiência < 12)', sexDep: false,
          note: 'Deficiência de ferro < 12 µg/L em crianças < 5 anos saudáveis ou < 30 µg/L na presença de inflamação/infecção.',
          cut: 'Normal ≥ 12 · Baixo / Deficiência < 12 µg/L (< 5 anos). Na presença de inflamação: < 30 µg/L.',
          ev: (v) => (v < 12 ? LOW : v > 150 ? HIGH : OK),
        };
      }
      if (years < 18) {
        return {
          ...e, r: '≥ 15 (deficiência < 15)', sexDep: false,
          note: 'Deficiência de ferro < 15 µg/L em ≥ 5 anos saudáveis ou < 70 µg/L na presença de inflamação/infecção.',
          cut: 'Normal ≥ 15 · Baixo / Deficiência < 15 µg/L (≥ 5 anos). Na presença de inflamação: < 70 µg/L.',
          ev: (v) => (v < 15 ? LOW : v > 150 ? HIGH : OK),
        };
      }
      return e;

    case 'colt':
      if (years >= 2 && years <= 19) {
        return {
          ...e, r: '< 170', src: 'SBC / SBP', cat: 'lipid-ped',
          note: 'Perfil lipídico pediátrico (2–19 anos, SBC/SBP).',
          cut: 'Normal < 170 · Limítrofe 170–199 · Alto ≥ 200 mg/dL (2–19 anos).',
          ev: (v) => (v < 170 ? OK : v < 200 ? WARN('Limítrofe') : HIGH),
        };
      }
      return e;

    case 'hdl':
      if (years >= 2 && years <= 19) {
        return {
          ...e, r: '> 45', src: 'SBC / SBP', cat: 'lipid-ped',
          note: 'Perfil lipídico pediátrico (2–19 anos, SBC/SBP).',
          cut: 'Normal > 45 · Limítrofe 40–45 · Baixo < 40 mg/dL (2–19 anos).',
          ev: (v) => (v > 45 ? OK : v >= 40 ? WARN('Limítrofe') : LOW),
        };
      }
      return e;

    case 'ldl':
      if (years >= 2 && years <= 19) {
        return {
          ...e, r: '< 110', src: 'SBC / SBP', cat: 'lipid-ped',
          note: 'Perfil lipídico pediátrico (2–19 anos, SBC/SBP).',
          cut: 'Normal < 110 · Limítrofe 110–129 · Alto ≥ 130 mg/dL (2–19 anos).',
          ev: (v) => (v < 110 ? OK : v < 130 ? WARN('Limítrofe') : HIGH),
        };
      }
      return e;

    case 'naohdl':
      if (years >= 2 && years <= 19) {
        return {
          ...e, r: '< 120', src: 'SBC / SBP', cat: 'lipid-ped',
          note: 'Calculado automaticamente: colesterol total − HDL. Cortes pediátricos (2–19 anos, SBC/SBP).',
          cut: 'Normal < 120 · Limítrofe 120–144 · Alto ≥ 145 mg/dL (2–19 anos).',
          ev: (v) => (v < 120 ? OK : v < 145 ? WARN('Limítrofe') : HIGH),
        };
      }
      return e;

    case 'tg':
      if (years <= 9) {
        return {
          ...e, r: '< 75 (jejum) · < 85 (sem jejum)', src: 'SBC / SBP', cat: 'lipid-ped',
          note: 'Cortes pediátricos para 0–9 anos (SBC/SBP): jejum < 75 mg/dL; sem jejum < 85 mg/dL.',
          cut: 'Jejum (0–9 anos): Normal < 75 · Limítrofe 75–99 · Alto ≥ 100 mg/dL. Sem jejum: < 85 mg/dL.',
          ev: (v) => (v < 75 ? OK : v < 100 ? WARN('Limítrofe') : HIGH),
        };
      }
      if (years <= 19) {
        return {
          ...e, r: '< 90 (jejum) · < 100 (sem jejum)', src: 'SBC / SBP', cat: 'lipid-ped',
          note: 'Cortes pediátricos para 10–19 anos (SBC/SBP): jejum < 90 mg/dL; sem jejum < 100 mg/dL.',
          cut: 'Jejum (10–19 anos): Normal < 90 · Limítrofe 90–129 · Alto ≥ 130 mg/dL. Sem jejum: < 100 mg/dL.',
          ev: (v) => (v < 90 ? OK : v < 130 ? WARN('Limítrofe') : HIGH),
        };
      }
      return e;

    case 'tfge':
      if (years < 18) {
        return {
          ...e, src: 'Schwartz 2009 / KDIGO', cat: 'renal-ped',
          note: years < 1
            ? 'Equação de Schwartz modificada indicada para 1–17 anos; em < 1 ano confrontar com referência neonatal.'
            : 'Equação de Schwartz Modificada (Bedside Schwartz, 2009): 0,413 × estatura (cm) / creatinina. Requer estatura na Aba 7.',
          cut: 'Normal ≥ 90 · Atenção 60–89 · Baixo / DRC < 60 mL/min/1,73m² (Bedside Schwartz 2009 / KDIGO 2024).',
        };
      }
      return e;

    case 'creatinina':
      if (years < 1) {
        return {
          ...e, r: 'Faixa etária lactente (ver laudo)', src: 'CALIPER / SBP', cat: 'renal-ped', sexDep: false,
          note: 'Conferir faixa etária do laudo (CALIPER/SBP).',
          cut: 'Lactentes < 1 ano: conferir faixa etária do laudo (CALIPER/SBP).',
          ev: () => ['Conferir laudo', 'neutral'],
        };
      }
      if (years <= 2) {
        return {
          ...e, r: '0,20–0,45', src: 'CALIPER / SBP', cat: 'renal-ped', sexDep: false,
          note: 'Conferir faixa etária do laudo (CALIPER/SBP).',
          cut: '1–2 anos: 0,20–0,45 mg/dL. Conferir faixa etária do laudo (CALIPER/SBP).',
          ev: rng(0.2, 0.45),
        };
      }
      if (years <= 5) {
        return {
          ...e, r: '0,25–0,55', src: 'CALIPER / SBP', cat: 'renal-ped', sexDep: false,
          note: 'Conferir faixa etária do laudo (CALIPER/SBP).',
          cut: '3–5 anos: 0,25–0,55 mg/dL. Conferir faixa etária do laudo (CALIPER/SBP).',
          ev: rng(0.25, 0.55),
        };
      }
      if (years <= 11) {
        return {
          ...e, r: '0,30–0,70', src: 'CALIPER / SBP', cat: 'renal-ped', sexDep: false,
          note: 'Conferir faixa etária do laudo (CALIPER/SBP).',
          cut: '6–11 anos: 0,30–0,70 mg/dL. Conferir faixa etária do laudo (CALIPER/SBP).',
          ev: rng(0.3, 0.7),
        };
      }
      if (years <= 14) {
        return {
          ...e, r: '0,45–0,85', src: 'CALIPER / SBP', cat: 'renal-ped', sexDep: false,
          note: 'Conferir faixa etária do laudo (CALIPER/SBP).',
          cut: '12–14 anos: 0,45–0,85 mg/dL. Conferir faixa etária do laudo (CALIPER/SBP).',
          ev: rng(0.45, 0.85),
        };
      }
      if (years < 18) {
        return {
          ...e, r: 'F 0,50–0,90 · M 0,60–1,10', src: 'CALIPER / SBP', cat: 'renal-ped', sexDep: true,
          note: 'Conferir faixa etária do laudo (CALIPER/SBP).',
          cut: '15–17 anos: F 0,50–0,90 · M 0,60–1,10 mg/dL. Conferir faixa etária do laudo (CALIPER/SBP).',
          ev: rngS([0.5, 0.9], [0.6, 1.1]),
        };
      }
      return e;

    case 'homa':
      if (years < 18) {
        return {
          ...e, r: 'Avaliar estágio de Tanner', src: 'SBD / ISPAD / SBP', cat: 'glic-ped',
          note: 'Calculado automaticamente: (glicemia × insulina) / 405. Em < 18 anos, o corte varia conforme o estágio puberal de Tanner devido à resistência insulínica fisiológica da puberdade; não aplicar o corte adulto BRAMS (< 2,7).',
          cut: 'Pediátrico (< 18 anos): avaliar conforme estágio puberal de Tanner (SBD 2024 / ISPAD / SBP).',
          ev: () => ['Avaliar Tanner', 'neutral'],
        };
      }
      return e;

    case 'fa':
      if (years < 18) {
        return {
          ...e, r: 'Faixa etária pediátrica (ver laudo)', src: 'CALIPER / SBP', cat: 'caliper', sexDep: false,
          note: 'Elevada fisiologicamente durante o crescimento ósseo e estirão puberal; não aplicar corte fixo de adulto.',
          cut: 'Faixa etária pediátrica (CALIPER/SBP): valores usuais ~100–350 U/L na infância (podendo ultrapassar 400 U/L no estirão puberal). Conferir laudo.',
          ev: () => ['Conferir laudo', 'neutral'],
        };
      }
      return e;

    case 'fosforo':
      if (years < 18) {
        return {
          ...e, r: 'Faixa etária pediátrica (ver laudo)', src: 'CALIPER / SBP', cat: 'caliper', sexDep: false,
          note: 'Valores fisiologicamente mais elevados em crianças e adolescentes pelo metabolismo ósseo em crescimento.',
          cut: 'Faixa etária pediátrica (CALIPER/SBP): lactentes ~4,5–6,7 · 1–12 anos ~3,6–5,8 · 13–17 anos ~2,7–4,9 mg/dL. Conferir laudo.',
          ev: () => ['Conferir laudo', 'neutral'],
        };
      }
      return e;

    case 'acurico':
      if (years < 18) {
        return {
          ...e, r: 'Faixa etária pediátrica (ver laudo)', src: 'CALIPER / SBP', cat: 'caliper', sexDep: false,
          note: 'Varia conforme idade e maturação puberal; não aplicar corte fixo de adulto.',
          cut: 'Faixa etária pediátrica (CALIPER/SBP): infância ~2,0–5,5 mg/dL, aproximando-se dos valores adultos na adolescência. Conferir laudo.',
          ev: () => ['Conferir laudo', 'neutral'],
        };
      }
      return e;

    case 'tsh':
      if (years < 18) {
        return {
          ...e, r: 'Faixa etária pediátrica (ver laudo)', src: 'CALIPER / SBP', cat: 'caliper', sexDep: false,
          note: 'Limites de TSH variam conforme idade pediátrica e método laboratorial.',
          cut: 'Faixa etária pediátrica (CALIPER/SBP): lactentes e pré-escolares têm limite superior mais amplo (~0,7–5,7 mUI/L), reduzindo gradualmente até a adolescência. Conferir laudo.',
          ev: () => ['Conferir laudo', 'neutral'],
        };
      }
      return e;

    default:
      return e;
  }
}

/** Valor efetivo: digitado manualmente ou calculado (HOMA-IR, não-HDL, TFGe). ctx = { sex, age, ageMonths, heightCm } */
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
    if (ctx.age !== null && ctx.age !== undefined && ctx.age >= 1 && ctx.age < 18) {
      const g = bedsideSchwartz(P(v.creatinina), ctx.heightCm, ctx.age);
      return g !== null ? fmt(g, 0) : '';
    }
    const g = ckdEpi2021(P(v.creatinina), ctx.age, ctx.sex);
    return g !== null ? fmt(g, 0) : '';
  }
  return '';
}
export const isAutoValue = (d, key, ctx = {}) => !has(d && d.v && d.v[key]) && labValue(d, key, ctx) !== '';

/** Dica neutra quando falta dado para cálculo automático (ex.: estatura na Aba 7 para Schwartz). */
export function labHint(d, key, ctx = {}) {
  if (key !== 'tfge' || has(d && d.v && d.v.tfge)) return null;
  if (!has(d && d.v && d.v.creatinina)) return null;
  if (ctx.age !== null && ctx.age !== undefined && ctx.age >= 1 && ctx.age < 18 && !(ctx.heightCm > 0)) {
    return { label: 'Informar estatura (Aba 7)', tone: 'neutral' };
  }
  return null;
}

/** Semáforo: retorna { label, tone } ou null. tone: ok | warn | bad | neutral */
export function evalExam(key, valueStr, sexOrCtx, ctxArg = {}) {
  const ctx = sexOrCtx && typeof sexOrCtx === 'object' ? sexOrCtx : { ...ctxArg, sex: sexOrCtx };
  const sex = ctx.sex;
  const e = examForAge(key, ctx);
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
