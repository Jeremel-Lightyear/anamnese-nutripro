// Escala de Bristol: 7 ilustrações SVG inline + Modo Paciente (tela cheia)
const D = '#5a3715'; // contorno
const M = '#8b5a2b'; // corpo
const L = '#b98a55'; // brilho

const blob = (shapes, extra = '') =>
  `<g fill="${D}" stroke="${D}" stroke-width="4" stroke-linejoin="round">${shapes}</g><g fill="${M}">${shapes}</g>${extra}`;
const wrap = (inner) =>
  `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" role="img" focusable="false" aria-hidden="true">${inner}</svg>`;

// Tipo 1: caroços duros e separados (nozes)
const nuts = [[22, 26, 8], [46, 20, 7], [72, 28, 9], [98, 22, 7], [32, 54, 8], [60, 56, 8], [88, 52, 9]];
const svg1 = wrap(
  blob(nuts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')) +
    nuts.map(([x, y, r]) => `<circle cx="${x - r * 0.3}" cy="${y - r * 0.35}" r="${r * 0.28}" fill="${L}" opacity=".75"/>`).join('') +
    nuts.map(([x, y, r]) => `<path d="M${x + r * 0.1} ${y + r * 0.2} q${r * 0.35} ${r * 0.3} ${r * 0.6} ${-r * 0.1}" fill="none" stroke="${D}" stroke-width="1.2" opacity=".6"/>`).join('')
);

// Tipo 2: salsicha grumosa / encaroçada
const lumps = [[22, 41, 11], [34, 34, 12], [46, 45, 11], [58, 34, 12], [70, 46, 11], [82, 35, 12], [96, 42, 11]];
const svg2 = wrap(
  blob(lumps.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('') + `<rect x="24" y="32" width="72" height="20" rx="6"/>`) +
    lumps.map(([x, y, r]) => `<circle cx="${x - 3}" cy="${y - 4}" r="2.6" fill="${L}" opacity=".7"/>`).join('') +
    `<path d="M26 56 q34 8 68 0" fill="none" stroke="${D}" stroke-width="1.4" opacity=".35"/>`
);

// Tipo 3: salsicha com rachaduras
const svg3 = wrap(
  blob(`<rect x="14" y="27" width="92" height="26" rx="13"/>`) +
    `<path d="M24 33 H94" stroke="${L}" stroke-width="3.2" stroke-linecap="round" opacity=".6"/>` +
    [34, 52, 70, 88]
      .map((x, i) => `<path d="M${x} ${i % 2 ? 53 : 27} l${i % 2 ? 4 : -4} ${i % 2 ? -9 : 9} l${i % 2 ? -3 : 3} 8" fill="none" stroke="${D}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`)
      .join('')
);

// Tipo 4: salsicha/cobra lisa e macia
const snake = 'M16 52 C34 26 52 66 72 42 S100 32 106 38';
const svg4 = wrap(
  `<path d="${snake}" fill="none" stroke="${D}" stroke-width="26" stroke-linecap="round"/>` +
    `<path d="${snake}" fill="none" stroke="${M}" stroke-width="20" stroke-linecap="round"/>` +
    `<path d="${snake}" transform="translate(0,-5)" fill="none" stroke="${L}" stroke-width="4" stroke-linecap="round" opacity=".55"/>`
);

// Tipo 5: pedaços macios com bordas definidas
const soft = [[28, 32, 16, 11, -10], [62, 26, 13, 10, 8], [93, 38, 15, 12, -6], [44, 58, 15, 10, 6], [80, 62, 14, 9, -8]];
const svg5 = wrap(
  blob(soft.map(([x, y, rx, ry, a]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${x} ${y})"/>`).join('')) +
    soft.map(([x, y, rx, ry]) => `<ellipse cx="${x - rx * 0.25}" cy="${y - ry * 0.4}" rx="${rx * 0.4}" ry="${ry * 0.18}" fill="${L}" opacity=".6"/>`).join('')
);

// Tipo 6: pedaços pastosos com bordas irregulares
const mush = [
  'M14 40 q3-9 11-7 q4-8 12-3 q7-6 12 2 q8-2 9 7 q6 5 1 12 q-2 8-11 7 q-6 7-14 2 q-9 3-13-4 q-9-2-7-11z',
  'M70 30 q5-8 12-4 q8-5 13 2 q9 0 9 8 q6 6 0 12 q-2 8-11 6 q-7 6-14 0 q-9 1-10-8 q-6-4-3-10 q-1-4 4-6z',
  'M42 58 q4-6 10-3 q6-4 10 2 q6 2 5 8 q4 5-2 9 q-5 5-11 1 q-7 2-10-4 q-6-3-3-9 q0-3 1-4z',
];
const svg6 = wrap(
  blob(mush.map((d) => `<path d="${d}"/>`).join('')) +
    [[28, 40], [36, 46], [80, 36], [90, 44], [52, 66], [58, 72]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${L}" opacity=".8"/>`).join('')
);

// Tipo 7: totalmente líquido
const svg7 = wrap(
  `<path d="M10 56 C18 40 34 46 48 42 C62 34 80 40 92 44 C108 46 112 58 100 64 C84 72 60 66 44 70 C28 72 6 68 10 56 Z" fill="${M}" fill-opacity=".85" stroke="${D}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M24 52 C36 46 50 50 62 47" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round" opacity=".6"/>` +
    `<circle cx="22" cy="28" r="3.2" fill="${M}" stroke="${D}" stroke-width="1.5"/><circle cx="96" cy="26" r="2.6" fill="${M}" stroke="${D}" stroke-width="1.5"/>` +
    `<circle cx="62" cy="22" r="3.6" fill="${M}" stroke="${D}" stroke-width="1.5"/><circle cx="76" cy="58" r="3" fill="none" stroke="${L}" stroke-width="1.5"/><circle cx="36" cy="60" r="2.2" fill="none" stroke="${L}" stroke-width="1.5"/>`
);

export const BRISTOL = [
  { n: 1, legend: 'Caroços duros e separados, como nozes', badge: 'Constipação severa', tone: 'bad', svg: svg1 },
  { n: 2, legend: 'Formato de salsicha, grumoso/encaroçado', badge: 'Constipação leve', tone: 'warn', svg: svg2 },
  { n: 3, legend: 'Salsicha com rachaduras na superfície', badge: 'Normal / Ideal', tone: 'ok', svg: svg3 },
  { n: 4, legend: 'Salsicha ou cobra, lisa e macia', badge: 'Normal / Ideal', tone: 'ok', svg: svg4 },
  { n: 5, legend: 'Pedaços macios com bordas bem definidas', badge: 'Falta de fibras / Tendência amolecida', tone: 'warn', svg: svg5 },
  { n: 6, legend: 'Pedaços pastosos com bordas irregulares', badge: 'Diarreia leve / Inflamação', tone: 'warn', svg: svg6 },
  { n: 7, legend: 'Totalmente líquido, sem pedaços sólidos', badge: 'Diarreia severa', tone: 'bad', svg: svg7 },
];

const CHECK = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/** Texto: "Tipo 2 (Constipação leve)" ou "Tipo 2 (...) alternando com Tipo 4 (...)". */
export function bristolText(types) {
  const list = (Array.isArray(types) ? types : [])
    .map((n) => BRISTOL.find((b) => b.n === Number(n)))
    .filter(Boolean)
    .map((b) => `Tipo ${b.n} (${b.badge})`);
  return list.join(' alternando com ');
}

export function renderBristolCards(selected = []) {
  return BRISTOL.map((b) => {
    const sel = selected.includes(b.n);
    return `<button type="button" class="bristol-card${sel ? ' sel' : ''}" data-act="bristol" data-n="${b.n}" aria-pressed="${sel}">
      <span class="bc-check">${CHECK}</span>
      <span class="bc-art">${b.svg}</span>
      <strong>Tipo ${b.n}</strong>
      <span class="bc-legend">${b.legend}</span>
      <em class="badge ${b.tone}">${b.badge}</em>
    </button>`;
  }).join('');
}

const CLOSE_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

/** Modo Paciente: tela cheia, só ilustrações numeradas. Ao tocar, chama onPick(n) e fecha. */
export function openPatientMode(onPick) {
  if (typeof document === 'undefined') return;
  const old = document.getElementById('bristol-modal');
  if (old) old.remove();
  const el = document.createElement('div');
  el.id = 'bristol-modal';
  el.className = 'bristol-modal';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Escala de Bristol — modo paciente');
  el.innerHTML = `<div class="bm-shell">
    <div class="bm-head">
      <div><small class="mono">MODO PACIENTE · ESCALA DE BRISTOL</small><h2>Qual figura mais se parece com as suas evacuações?</h2></div>
      <button type="button" class="btn icon" data-close aria-label="Fechar">${CLOSE_SVG}</button>
    </div>
    <div class="bm-grid">${BRISTOL.map(
      (b) => `<button type="button" class="bm-item" data-n="${b.n}" aria-label="Tipo ${b.n}">
        <span class="bc-art">${b.svg}</span><strong class="mono">${b.n}</strong></button>`
    ).join('')}</div>
  </div>`;
  const close = () => {
    document.removeEventListener('keydown', onKey);
    el.remove();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('[data-close]')) return close();
    const it = e.target.closest('.bm-item');
    if (it) {
      const n = Number(it.dataset.n);
      close();
      onPick(n);
    }
  });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(el);
  el.querySelector('.bm-item').focus();
}
