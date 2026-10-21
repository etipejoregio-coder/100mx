'use strict';
/* =====================================================================
   100 MEXICANOS DIJERON - lógica del juego
   ===================================================================== */

/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const clone = (o) => JSON.parse(JSON.stringify(o));

function h(tag, props, ...kids) {
  if (props == null || typeof props !== 'object' || props.nodeType || Array.isArray(props)) {
    kids.unshift(props);
    props = {};
  }
  const e = document.createElement(tag);
  let val;
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'value') val = v;
    else if (v === true) e.setAttribute(k, '');
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  kids.flat(Infinity).forEach((c) => {
    if (c == null || c === false) return;
    e.append(c.nodeType ? c : document.createTextNode(String(c)));
  });
  if (val !== undefined) e.value = val;
  return e;
}

function merge(base, over) {
  if (over === undefined || over === null) return base;
  if (Array.isArray(base) || typeof base !== 'object' || base === null) return over;
  if (typeof over !== 'object' || Array.isArray(over)) return base;
  const out = { ...base };
  for (const k of Object.keys(over)) out[k] = k in base ? merge(base[k], over[k]) : over[k];
  return out;
}

const normCode = (c) => (c || '').replace(/^Numpad(\d)$/, 'Digit$1');
const normText = (s) =>
  String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

function keyLabel(c) {
  if (!c) return '—';
  return c.replace(/^Key/, '').replace(/^Digit/, '').replace('Numpad', 'Num ').replace('Arrow', 'Flecha ')
    .replace('Semicolon', ';').replace('Escape', 'Esc').replace('Space', 'Espacio').replace('Enter', 'Enter');
}

const MAXANS = 5; // la marquesina tiene 5 renglones
const xNode = () => h('img', { class: 'xi', src: ((curSkin().img || {}).x) || 'skins/clasico/x.png', alt: 'X' });

/* posiciones (en píxeles de la imagen de marquesina 1999x1294) */
const IW = 1999, IH = 1294;
const P = (x, y, w, h) => `left:${(x / IW) * 100}%;top:${(y / IH) * 100}%;width:${(w / IW) * 100}%;height:${(h / IH) * 100}%`;
const ROW_CY = [422, 556, 688, 818, 950];
const STRIKE_CX = [855, 995, 1135];
const LAYOUT = [
  ['#qbar', [250, 1188, 1500, 80]],
  ['#teamA .tscore', [108, 466, 374, 164]], ['#teamB .tscore', [1517, 466, 374, 164]],
  ['#teamA .players', [262, 712, 228, 255]], ['#teamB .players', [1545, 712, 228, 255]],
  ['#teamA .tturn', [262, 985, 228, 50]], ['#teamB .tturn', [1545, 985, 228, 50]],
  ['#bankInfo', [612, 314, 300, 42]], ['#phaseInfo', [912, 314, 290, 42]], ['#roundInfo', [1202, 314, 230, 42]]
];

/* ---------- valores por defecto ---------- */
const NOIMG = { bg: '', logo: '', board: '', title: '', x: '' };
const DEFAULT_SKINS = [
  { id: 'clasico', name: 'Clásico azul y rojo (tu diseño)', builtin: true, layout: 'image',
    c: { bg1: '#1b3fd9', bg2: '#050a2a', teamA: '#1f6bff', teamB: '#e51b1b', gold: '#ffc21a', panel: '#06123a', line: '#27a8ff' },
    img: { ...NOIMG, board: 'skins/clasico/marquesina.jpg', title: 'skins/clasico/titulo.jpg' } },
  { id: 'mexico', name: 'Fiesta mexicana', builtin: true, layout: 'auto',
    c: { bg1: '#0a8a45', bg2: '#04200f', teamA: '#15a35a', teamB: '#d4202a', gold: '#ffd23f', panel: '#0b2a16', line: '#ffffff' },
    img: { ...NOIMG } },
  { id: 'neon', name: 'Neón nocturno', builtin: true, layout: 'auto',
    c: { bg1: '#6a1bd9', bg2: '#12012e', teamA: '#00b8f0', teamB: '#ff2d95', gold: '#ffe14a', panel: '#1a0640', line: '#d86bff' },
    img: { ...NOIMG } }
];

const DEFAULT_TEXTS = {
  title1: '100', title2: 'MEXICANOS', title3: 'DIJERON',
  credit: 'HECHO POR DANIEL LEON',
  startHint: 'PRESIONA ENTER O HAZ CLIC PARA COMENZAR  ·  ESC = MENÚ',
  teamA: 'EQUIPO AZUL', teamB: 'EQUIPO ROJO',
  bank: 'BANCO', round: 'RONDA', turn: '¡TURNO!', steal: '¡ROBO!', faceoff: '¡A LOS PULSADORES!',
  winner: '¡GANA EL {EQUIPO}!', winnerHint: 'ENTER para continuar',
  menuTitle: 'MENU DE CONFIGURACION DE 100 MEXICANOS DIJERON',
  menu1: 'SKINS VISUALIZACION', menu2: 'CONFIGURAR TECLADO', menu3: 'SONIDOS',
  menu4: 'EDITAR LAS PREGUNTAS', menu5: 'CERRAR MENU', menu6: 'APAGAR PC'
};
const TEXT_LABELS = {
  title1: 'Título: número grande (100)', title2: 'Título: línea 2', title3: 'Título: línea 3 (banner rojo)',
  credit: 'Texto de crédito (pantalla principal)', startHint: 'Mensaje para comenzar',
  teamA: 'Nombre del equipo 1 (azul)', teamB: 'Nombre del equipo 2 (rojo)',
  bank: 'Etiqueta "Banco"', round: 'Etiqueta "Ronda"', turn: 'Etiqueta de turno', steal: 'Etiqueta de robo',
  faceoff: 'Mensaje de cara a cara', winner: 'Mensaje de ganador ({EQUIPO} = nombre del equipo)', winnerHint: 'Aviso bajo el ganador',
  menuTitle: 'Título del menú', menu1: 'Menú opción 1', menu2: 'Menú opción 2', menu3: 'Menú opción 3',
  menu4: 'Menú opción 4', menu5: 'Menú opción 5', menu6: 'Menú opción 6'
};

const ACTIONS = [
  ['start', 'Iniciar juego / cerrar aviso de ganador', 'Enter'],
  ['menu', 'Abrir / cerrar menú', 'Escape'],
  ['strike', 'Error (X)', 'KeyX'],
  ['next', 'Siguiente pregunta', 'KeyN'],
  ['prev', 'Pregunta anterior', 'KeyB'],
  ['resetBuzz', 'Reiniciar pulsadores', 'KeyR'],
  ['controlA', 'Dar el control al equipo AZUL', 'ArrowLeft'],
  ['controlB', 'Dar el control al equipo ROJO', 'ArrowRight'],
  ['awardA', 'Dar el banco al AZUL', 'KeyZ'],
  ['awardB', 'Dar el banco al ROJO', 'KeyC'],
  ['revealAll', 'Mostrar todas las respuestas', 'KeyV'],
  ['toggleQ', 'Mostrar / ocultar la pregunta', 'KeyQ'],
  ['titleScreen', 'Volver a la pantalla principal', 'KeyT'],
  ['fullscreen', 'Pantalla completa', 'F11'],
  ['voice', 'Activar / desactivar voz', 'KeyM']
];
for (let n = 1; n <= MAXANS; n++) ACTIONS.push(['r' + n, 'Revelar respuesta ' + n, 'Digit' + n]);

const NUM_WORDS = ['uno', 'dos', 'tres', 'cuatro', 'cinco'];
function defaultPhrases() {
  const p = {
    start: ['iniciar juego', 'comenzar juego', 'empezar juego', 'comenzar', 'empezar'],
    menu: ['abrir menu', 'cerrar menu', 'menu'],
    strike: ['error', 'equis', 'tache', 'incorrecto'],
    next: ['siguiente pregunta', 'siguiente', 'otra pregunta'],
    prev: ['pregunta anterior', 'anterior'],
    resetBuzz: ['reiniciar pulsadores', 'reiniciar botones', 'limpiar pulsadores'],
    controlA: ['control azul', 'control al azul', 'juega el azul'],
    controlB: ['control rojo', 'control al rojo', 'juega el rojo'],
    awardA: ['puntos al azul', 'puntos azul', 'banco azul'],
    awardB: ['puntos al rojo', 'puntos rojo', 'banco rojo'],
    revealAll: ['mostrar todas', 'revelar todas', 'mostrar todo'],
    toggleQ: ['mostrar pregunta', 'ocultar pregunta'],
    titleScreen: ['pantalla principal', 'ir al inicio'],
    fullscreen: ['pantalla completa'],
    voice: ['desactivar voz']
  };
  NUM_WORDS.forEach((w, i) => {
    p['r' + (i + 1)] = ['respuesta ' + w, 'respuesta ' + (i + 1), 'revelar ' + w, 'numero ' + w, 'numero ' + (i + 1)];
  });
  return p;
}

const SOUNDS = [
  ['intro', 'Música de inicio'], ['buzz', 'Pulsador'], ['reveal', 'Respuesta correcta'],
  ['strike', 'Error / X'], ['award', 'Puntos para el equipo'], ['win', 'Equipo ganador'], ['next', 'Cambio de pregunta']
];

const toQ = (list) => list.map((x) => ({ q: x.q, a: x.a.slice(0, MAXANS).map(([t, p]) => ({ t, p })) }));

function makeDefaults() {
  const actions = {};
  ACTIONS.forEach(([id, , code]) => (actions[id] = code));
  return {
    texts: clone(DEFAULT_TEXTS),
    skins: clone(DEFAULT_SKINS),
    skinId: 'clasico',
    keys: {
      actions,
      A: ['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG'],
      B: ['KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon']
    },
    playerNames: {
      A: ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4', 'Jugador 5'],
      B: ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4', 'Jugador 5']
    },
    playersPerTeam: 5,
    rules: { target: 300, multipliers: [1, 1, 1, 2, 3], showQuestion: true },
    voice: { enabled: false, lang: 'es-MX', matchAnswers: false, phrases: defaultPhrases() },
    sounds: { volume: 0.8, muted: false, custom: {} },
    questions: toQ(window.DEFAULT_QUESTIONS || []),
    progress: { q: 0, round: 1, scoreA: 0, scoreB: 0 }
  };
}

/* ---------- almacenamiento (Electron o navegador) ---------- */
const hasApi = !!window.api;
const store = {
  async load() {
    if (hasApi) return await window.api.loadConfig();
    try { return JSON.parse(localStorage.getItem('cmd_config') || 'null'); } catch { return null; }
  },
  async save(c) {
    if (hasApi) return window.api.saveConfig(c);
    try { localStorage.setItem('cmd_config', JSON.stringify(c)); } catch { toast('No se pudo guardar (archivo muy grande)'); }
  }
};
function pickFile(kind) {
  if (hasApi) return window.api.pickFile(kind);
  return new Promise((res) => {
    const i = document.createElement('input');
    i.type = 'file';
    i.accept = kind === 'audio' ? 'audio/*' : 'image/*';
    i.onchange = () => {
      const f = i.files[0];
      if (!f) return res(null);
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(f);
    };
    i.click();
  });
}

/* ---------- estado ---------- */
let cfg = makeDefaults();
const state = {
  screen: 'title', q: 0, round: 1, scoreA: 0, scoreB: 0,
  revealed: [], just: new Set(), strikes: 0, bank: 0,
  phase: 'faceoff', control: null, buzzed: null, stealTeam: null,
  showQ: true, winner: null
};
const menu = { open: false, view: 'main', sel: 0 };
const qe = { sel: 0, tab: 'q' };
let capture = null;

const cur = () => cfg.questions[state.q];
const other = (t) => (t === 'A' ? 'B' : 'A');
const curSkin = () => cfg.skins.find((s) => s.id === cfg.skinId) || cfg.skins[0];
const mult = () => {
  const m = cfg.rules.multipliers.length ? cfg.rules.multipliers : [1];
  return m[Math.min(state.round - 1, m.length - 1)] || 1;
};

let persistTimer;
function persist() {
  cfg.progress = { q: state.q, round: state.round, scoreA: state.scoreA, scoreB: state.scoreB };
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => store.save(cfg), 250);
}

let toastTimer;
function toast(msg, ms = 2200) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), ms);
}

/* ---------- sonido ---------- */
let actx;
const ac = () => (actx = actx || new (window.AudioContext || window.webkitAudioContext)());
function tone(f, t0, d, type = 'sine', v = 0.3) {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  const now = c.currentTime + t0;
  o.type = type;
  o.frequency.setValueAtTime(f, now);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v * cfg.sounds.volume), now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + d);
  o.connect(g).connect(c.destination);
  o.start(now);
  o.stop(now + d + 0.05);
}
const SYNTH = {
  buzz: () => { tone(520, 0, .15, 'square', .35); tone(780, .12, .25, 'square', .35); },
  reveal: () => { tone(880, 0, .15, 'sine', .5); tone(1320, .12, .35, 'sine', .5); },
  strike: () => { tone(140, 0, .9, 'sawtooth', .5); tone(110, 0, .9, 'square', .3); },
  award: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .1, .25, 'triangle', .5)),
  win: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * .16, .3, 'triangle', .5)),
  next: () => { tone(400, 0, .08, 'sine', .4); tone(600, .08, .12, 'sine', .4); },
  intro: () => [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, i * .18, .4, 'sawtooth', .25))
};
function play(name, force) {
  if (cfg.sounds.muted && !force) return;
  const src = cfg.sounds.custom[name];
  if (src) {
    const a = new Audio(src);
    a.volume = cfg.sounds.volume;
    a.play().catch(() => {});
  } else {
    try { SYNTH[name](); } catch { /* sin audio */ }
  }
}

/* ---------- apariencia ---------- */
function fit() {
  const s = Math.min(innerWidth / 1920, innerHeight / 1080);
  $('#stage').style.transform = `translate(-50%, -50%) scale(${s})`;
}

const isImgLayout = () => { const s = curSkin(); return s.layout === 'image' && !!(s.img && s.img.board); };

function applySkin() {
  const s = curSkin();
  const r = document.documentElement.style;
  const c = s.c;
  r.setProperty('--bg1', c.bg1); r.setProperty('--bg2', c.bg2);
  r.setProperty('--teamA', c.teamA); r.setProperty('--teamB', c.teamB);
  r.setProperty('--gold', c.gold); r.setProperty('--panel', c.panel); r.setProperty('--line', c.line);
  const img = s.img || {};
  const on = isImgLayout();
  document.body.classList.toggle('img-layout', on);
  const bgImg = img.bg || (on ? img.board : '');
  $('#bgLayer').style.backgroundImage = bgImg ? `url("${bgImg}")` : '';
  $('#bgLayer').classList.toggle('img', !!bgImg);
  $('#title').style.backgroundImage = img.title ? `url("${img.title}")` : '';
  $('#title').classList.toggle('full', !!img.title);
  $('#bframe').style.backgroundImage = on ? `url("${img.board}")` : '';
  $('#board').style.backgroundImage = !on && img.board ? `url("${img.board}")` : '';
  $('#bgLayer').classList.toggle('blur', on && !img.bg);
  LAYOUT.forEach(([sel, box]) => {
    document.querySelectorAll(sel).forEach((el) => { el.style.cssText = on ? P(...box) : ''; });
  });
  buildLogos();
}

function logo(big) {
  const s = curSkin();
  const t = cfg.texts;
  const box = h('div', { class: 'logo ' + (big ? 'big' : 'small') });
  if (s.img && s.img.logo) {
    box.append(h('img', { src: s.img.logo, class: 'logoimg' }));
    return box;
  }
  box.append(
    h('div', { class: 'l1' }, h('i', {}, '★'), h('b', {}, t.title1), h('i', {}, '★')),
    h('div', { class: 'l2' }, t.title2),
    h('div', { class: 'l3' }, h('span', {}, t.title3))
  );
  return box;
}

function buildLogos() {
  const s = curSkin();
  const tl = $('#titleLogo');
  tl.innerHTML = '';
  tl.append(logo(true));
  const bl = $('#boardLogo');
  bl.innerHTML = '';
  bl.append(logo(false));
  bl.classList.toggle('nobanner', !!(s.img && s.img.logo));
  $('#credit').textContent = cfg.texts.credit;
  $('#credit').classList.toggle('hidden', !cfg.texts.credit);
  $('#startHint').textContent = cfg.texts.startHint;
}

function updateBoard() {
  const q = cur();
  const st = state;
  const t = cfg.texts;
  $('#qbar').textContent = q ? q.q : '—';
  $('#qbar').classList.toggle('hidden', !st.showQ);

  for (const team of ['A', 'B']) {
    const el = $('#team' + team);
    el.querySelector('.tname span').textContent = t['team' + team];
    el.querySelector('.tscore').textContent = st['score' + team];
    el.classList.toggle('control', st.control === team && st.phase === 'play');
    el.classList.toggle('stealing', st.phase === 'steal' && st.stealTeam === team);
    el.querySelector('.tturn').textContent =
      st.phase === 'steal' && st.stealTeam === team ? t.steal : st.control === team && st.phase === 'play' ? t.turn : '';
    const ul = el.querySelector('.players');
    ul.innerHTML = '';
    for (let i = 0; i < cfg.playersPerTeam; i++) {
      const buzzed = st.buzzed && st.buzzed.team === team && st.buzzed.idx === i;
      ul.append(h('li', { class: buzzed ? 'buzzed' : '' },
        h('span', {}, cfg.playerNames[team][i] || 'Jugador ' + (i + 1)),
        h('small', {}, keyLabel(cfg.keys[team][i]))));
    }
  }

  $('#roundInfo').textContent = `${t.round} ${st.round}  ×${mult()}`;
  $('#bankInfo').textContent = `${t.bank}: ${st.bank}`;
  $('#phaseInfo').textContent = st.phase === 'faceoff' ? (st.buzzed ? '' : t.faceoff) : st.phase === 'steal' ? t.steal : '';

  const rows = $('#rows');
  rows.innerHTML = '';
  const imgOn = isImgLayout();
  if (q) {
    q.a.forEach((a, i) => {
      const rev = st.revealed[i];
      rows.append(h('div', { class: 'row' + (rev ? ' rev' : '') + (st.just.has(i) ? ' flip' : ''), style: imgOn ? P(700, ROW_CY[i] - 52, 725, 104) : '' },
        h('div', { class: 'num' }, String(i + 1)),
        rev ? h('div', { class: 'ans' }, h('span', { class: 't' }, a.t), h('span', { class: 'p' }, String(a.p)))
            : h('div', { class: 'dots' }, '●●●●●●●●')));
    });
    if (imgOn) for (let i = q.a.length; i < MAXANS; i++) rows.append(h('div', { class: 'row empty', style: P(560, ROW_CY[i] - 62, 880, 124) }));
  }
  st.just.clear();

  const sl = $('#strikes');
  sl.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const s = h('div', { class: 'slot' + (i < st.strikes ? ' on' : ''), style: imgOn ? P(STRIKE_CX[i] - 57, 1098 - 57, 114, 114) : '' });
    s.append(xNode());
    sl.append(s);
  }
}

function showScreen(name) {
  state.screen = name;
  $('#title').classList.toggle('hidden', name !== 'title');
  $('#board').classList.toggle('hidden', name !== 'board');
  if (name === 'board') updateBoard();
}

function refreshAll() {
  buildLogos();
  updateBoard();
}

let bigxTimer;
function bigX(n) {
  const el = $('#bigx');
  el.innerHTML = '';
  for (let i = 0; i < n; i++) {
    el.append(h('span', { class: 'bx' }, xNode()));
  }
  el.classList.remove('hidden');
  clearTimeout(bigxTimer);
  bigxTimer = setTimeout(() => el.classList.add('hidden'), 1400);
}

function showWinner(team) {
  const el = $('#winner');
  el.innerHTML = '';
  el.append(
    h('div', { class: 'w1' }, cfg.texts.winner.replace('{EQUIPO}', cfg.texts['team' + team])),
    h('div', { class: 'w2' }, cfg.texts.winnerHint)
  );
  el.classList.remove('hidden');
}
function hideWinner() {
  state.winner = null;
  $('#winner').classList.add('hidden');
}

/* ---------- lógica del juego ---------- */
function loadQ() {
  const n = cfg.questions.length;
  if (state.q >= n) state.q = 0;
  Object.assign(state, { revealed: [], strikes: 0, bank: 0, phase: 'faceoff', control: null, buzzed: null, stealTeam: null });
  state.just.clear();
  updateBoard();
  persist();
}

function startGame() {
  if (!cfg.questions.length) { toast('No hay preguntas. Agrega algunas en el menú (4).'); return; }
  showScreen('board');
  loadQ();
  play('intro');
}

function endRound(team) {
  state['score' + team] += state.bank;
  state.phase = 'roundEnd';
  state.control = team;
  persist();
  if (state['score' + team] >= cfg.rules.target) {
    state.winner = team;
    showWinner(team);
    play('win');
  } else {
    play('award');
  }
  updateBoard();
}

function reveal(i) {
  const q = cur();
  if (!q || i < 0 || i >= q.a.length || state.revealed[i]) return;
  state.revealed[i] = true;
  state.just.add(i);
  play('reveal');
  if (state.phase === 'roundEnd') { updateBoard(); return; }
  state.bank += q.a[i].p * mult();
  if (state.phase === 'faceoff' && i === 0 && state.buzzed) {
    state.phase = 'play';
    state.control = state.buzzed.team;
  }
  if (state.phase === 'steal') { endRound(state.stealTeam); return; }
  if (state.phase === 'play' && q.a.every((_, k) => state.revealed[k])) { endRound(state.control); return; }
  updateBoard();
}

function strike() {
  if (state.phase === 'roundEnd') return;
  play('strike');
  if (state.phase === 'play' && state.control) {
    state.strikes++;
    bigX(state.strikes);
    if (state.strikes >= 3) {
      state.phase = 'steal';
      state.stealTeam = other(state.control);
    }
  } else if (state.phase === 'steal') {
    bigX(1);
    endRound(state.control);
    return;
  } else {
    bigX(1);
  }
  updateBoard();
}

function setControl(team) {
  if (state.phase === 'roundEnd' || state.phase === 'steal') return;
  state.phase = 'play';
  state.control = team;
  updateBoard();
}

function awardBank(team) {
  if (state.phase === 'roundEnd') return;
  endRound(team);
}

function buzz(team, idx) {
  if (state.screen !== 'board' || state.phase !== 'faceoff' || state.buzzed) return;
  state.buzzed = { team, idx };
  play('buzz');
  updateBoard();
}

function resetBuzzers() {
  state.buzzed = null;
  updateBoard();
}

function revealAll() {
  const q = cur();
  if (!q) return;
  let any = false;
  q.a.forEach((_, i) => { if (!state.revealed[i]) { state.revealed[i] = true; state.just.add(i); any = true; } });
  if (any) play('reveal');
  updateBoard();
}

function nextQ(d) {
  const n = cfg.questions.length;
  if (!n) return;
  state.q = (state.q + d + n) % n;
  state.round = Math.max(1, state.round + d);
  hideWinner();
  loadQ();
  play('next');
}

function resetGame() {
  state.scoreA = 0; state.scoreB = 0; state.round = 1; state.q = 0;
  hideWinner();
  loadQ();
  toast('Contadores reiniciados');
}

async function toggleFullscreen() {
  if (hasApi) await window.api.fullscreen();
  else if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});
}

async function shutdownPC() {
  if (!hasApi) { toast('Apagar la PC solo está disponible en la app instalada'); return; }
  if (confirm('¿Apagar la PC en 10 segundos?\n(Para cancelar: abre CMD y escribe  shutdown /a )')) {
    const ok = await window.api.shutdown();
    if (!ok) toast('Solo funciona en Windows');
  }
}

function doAction(id) {
  if (id === 'menu') { menu.open ? closeMenu() : openMenu('main'); return; }
  if (menu.open) return;
  if (state.winner && (id === 'start' || id === 'next')) { hideWinner(); if (id === 'start') return; }
  if (id === 'fullscreen') return toggleFullscreen();
  if (id === 'voice') return toggleVoice();
  if (state.screen === 'title') { if (id === 'start') startGame(); return; }
  if (/^r[1-5]$/.test(id)) return reveal(Number(id.slice(1)) - 1);
  switch (id) {
    case 'strike': return strike();
    case 'next': return nextQ(1);
    case 'prev': return nextQ(-1);
    case 'resetBuzz': return resetBuzzers();
    case 'controlA': return setControl('A');
    case 'controlB': return setControl('B');
    case 'awardA': return awardBank('A');
    case 'awardB': return awardBank('B');
    case 'revealAll': return revealAll();
    case 'toggleQ': state.showQ = !state.showQ; return updateBoard();
    case 'titleScreen': hideWinner(); return showScreen('title');
    default:
  }
}

/* ---------- voz ---------- */
let rec = null;
let voiceOn = false;
let voiceError = '';

function updateVoiceUI() {
  const el = $('#voiceStatus');
  el.textContent = voiceOn ? '🎤 VOZ ACTIVA' : voiceError ? '🎤 ' + voiceError : '';
  $('#btnVoice').style.background = voiceOn ? '#0a7a3b' : 'rgba(0,0,0,.5)';
}

function handleVoice(raw) {
  const t = ' ' + normText(raw) + ' ';
  toast('🎤 ' + raw.trim(), 1500);
  let best = null;
  for (const [id, list] of Object.entries(cfg.voice.phrases)) {
    for (const p of list) {
      const np = normText(p);
      if (np && t.includes(' ' + np + ' ') && (!best || np.length > best.len)) best = { id, len: np.length };
    }
  }
  if (best) { doAction(best.id); return; }
  if (cfg.voice.matchAnswers && state.screen === 'board' && !menu.open) {
    cur().a.forEach((a, i) => {
      const na = normText(a.t);
      if (na && !state.revealed[i] && t.includes(' ' + na + ' ')) reveal(i);
    });
  }
}

function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { voiceError = 'sin soporte de voz'; toast('Este motor no soporta reconocimiento de voz'); updateVoiceUI(); return; }
  voiceError = '';
  rec = new SR();
  rec.lang = cfg.voice.lang;
  rec.continuous = true;
  rec.interimResults = false;
  rec.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) handleVoice(e.results[i][0].transcript);
    }
  };
  rec.onerror = (e) => {
    if (e.error === 'no-speech' || e.error === 'aborted') return;
    voiceOn = false;
    voiceError = 'error de voz: ' + e.error;
    if (e.error === 'network') toast('La voz necesita internet y un motor compatible. Prueba la versión web en Chrome/Edge (ver README).', 5000);
    updateVoiceUI();
  };
  rec.onend = () => {
    if (voiceOn) { try { rec.start(); } catch { /* ya iniciado */ } } else updateVoiceUI();
  };
  voiceOn = true;
  try { rec.start(); } catch { /* ya iniciado */ }
  updateVoiceUI();
}
function stopVoice() {
  voiceOn = false;
  if (rec) { try { rec.stop(); } catch { /* nada */ } }
  updateVoiceUI();
}
function toggleVoice() {
  voiceOn ? stopVoice() : startVoice();
  toast(voiceOn ? '🎤 Voz activada' : '🎤 Voz desactivada');
}

/* ---------- menú ---------- */
function openMenu(view = 'main') {
  menu.open = true;
  menu.view = view;
  if (view === 'main') menu.sel = 0;
  renderMenu();
}
function closeMenu() {
  menu.open = false;
  capture = null;
  renderMenu();
  refreshAll();
  persist();
}
function renderMenu() {
  const o = $('#menuOverlay');
  o.innerHTML = '';
  o.classList.toggle('hidden', !menu.open);
  if (!menu.open) return;
  const views = { main: viewMain, skins: viewSkins, keys: viewKeys, sounds: viewSounds, questions: viewQuestions };
  o.append(views[menu.view]());
}
function panel(title, ...content) {
  return h('div', { class: 'mpanel wide' },
    h('div', { class: 'mhead' },
      h('button', { class: 'btn', onclick: () => { refreshAll(); openMenu('main'); } }, '← Volver al menú'),
      h('div', { class: 'mtitle2' }, title)),
    h('div', { class: 'mbody' }, ...content));
}
function setSel(i) {
  menu.sel = i;
  document.querySelectorAll('.mbtn').forEach((b, j) => b.classList.toggle('sel', j === i));
}
function menuItems() {
  return [
    () => openMenu('skins'), () => openMenu('keys'), () => openMenu('sounds'),
    () => openMenu('questions'), () => closeMenu(), () => shutdownPC()
  ];
}

function viewMain() {
  const fns = menuItems();
  return h('div', { class: 'mpanel' },
    h('div', { class: 'mtitle' }, cfg.texts.menuTitle),
    fns.map((fn, i) => h('div', { class: 'mbtn' + (i === menu.sel ? ' sel' : ''), onclick: fn, onmouseenter: () => setSel(i) },
      h('span', { class: 'n' }, String(i + 1)),
      h('span', { class: 't' }, cfg.texts['menu' + (i + 1)]))));
}

/* --- skins --- */
const SKIN_COLORS = [
  ['bg1', 'Fondo (color claro)'], ['bg2', 'Fondo (color oscuro)'], ['teamA', 'Equipo 1'], ['teamB', 'Equipo 2'],
  ['gold', 'Dorado / marco'], ['panel', 'Paneles oscuros'], ['line', 'Brillo de los renglones']
];
const SKIN_IMAGES = [
  ['bg', 'Imagen de fondo', 'Cubre todo el fondo (recomendado 1920×1080).'],
  ['logo', 'Logo del título', 'Reemplaza el texto "100 MEXICANOS DIJERON" (PNG con transparencia).'],
  ['title', 'Pantalla principal completa', 'Imagen 16:9 que reemplaza toda la pantalla de inicio.'],
  ['board', 'Marquesina completa', 'Imagen del tablero (usa las mismas posiciones que la incluida si eliges "sobre imagen").'],
  ['x', 'Imagen de la X de error', 'PNG con fondo transparente (por defecto, la X naranja).']
];

function dupSkin() {
  const base = clone(curSkin());
  base.id = 'skin_' + Date.now();
  base.name = 'Mi skin ' + (cfg.skins.filter((s) => !s.builtin).length + 1);
  base.builtin = false;
  cfg.skins.push(base);
  cfg.skinId = base.id;
  applySkin();
  persist();
  renderMenu();
}

function viewSkins() {
  const sk = curSkin();
  const list = h('div', { class: 'col' },
    h('h3', {}, 'Skins disponibles'),
    cfg.skins.map((s) => h('button', {
      class: 'btn wide' + (s.id === cfg.skinId ? ' on' : ''),
      onclick: () => { cfg.skinId = s.id; applySkin(); persist(); renderMenu(); }
    }, s.name + (s.builtin ? '' : '  (mío)'))),
    h('button', { class: 'btn wide accent', onclick: dupSkin }, '+ Crear mi propio skin (copia del actual)'));

  const ed = h('div', { class: 'col' }, h('h3', {}, 'Skin seleccionado: ' + sk.name));
  if (sk.builtin) {
    ed.append(h('p', { class: 'hint' }, 'Los skins incluidos no se modifican. Pulsa "Crear mi propio skin" para cambiar colores y poner tus propias imágenes de fondo, logo y marquesina.'));
  } else {
    ed.append(h('div', { class: 'line' }, h('label', {}, 'Nombre del skin'),
      h('input', { type: 'text', value: sk.name, onchange: (e) => { sk.name = e.target.value || 'Mi skin'; persist(); renderMenu(); } })));
    const lay = h('select', { onchange: (e) => { sk.layout = e.target.value; applySkin(); persist(); } },
      h('option', { value: 'auto' }, 'Automático (tablero generado por el juego)'),
      h('option', { value: 'image' }, 'Sobre imagen de marquesina (como la incluida)'));
    lay.value = sk.layout || 'auto';
    ed.append(h('div', { class: 'line' }, h('label', {}, 'Tipo de tablero'), lay));
    SKIN_COLORS.forEach(([k, label]) => {
      ed.append(h('div', { class: 'line' }, h('label', {}, label),
        h('input', { type: 'color', value: sk.c[k], oninput: (e) => { sk.c[k] = e.target.value; applySkin(); persist(); } })));
    });
    sk.img = { ...NOIMG, ...(sk.img || {}) };
    SKIN_IMAGES.forEach(([k, label, hint]) => {
      ed.append(h('div', { class: 'line' }, h('label', {}, label),
        h('button', { class: 'btn', onclick: async () => {
          const u = await pickFile('image');
          if (u) { sk.img[k] = u; applySkin(); persist(); renderMenu(); }
        } }, 'Elegir imagen…'),
        h('button', { class: 'btn', onclick: () => { sk.img[k] = ''; applySkin(); persist(); renderMenu(); } }, 'Quitar'),
        h('span', { class: 'hint' }, sk.img[k] ? '✔ imagen cargada' : hint)));
    });
    ed.append(h('div', { class: 'line' }, h('button', { class: 'btn danger', onclick: () => {
      if (!confirm('¿Eliminar este skin?')) return;
      cfg.skins = cfg.skins.filter((s) => s.id !== sk.id);
      cfg.skinId = 'clasico';
      applySkin(); persist(); renderMenu();
    } }, 'Eliminar este skin')));
  }
  return panel('SKINS VISUALIZACION', h('div', { class: 'cols2' }, list, ed));
}

/* --- teclado --- */
function findKeyUse(code, ignoreGet) {
  const c = normCode(code);
  for (const [id, label] of ACTIONS) {
    if (normCode(cfg.keys.actions[id]) === c && cfg.keys.actions[id] !== ignoreGet()) return label;
  }
  for (const t of ['A', 'B']) {
    for (let i = 0; i < 5; i++) {
      if (normCode(cfg.keys[t][i]) === c && cfg.keys[t][i] !== ignoreGet()) return `Jugador ${i + 1} (${t === 'A' ? 'azul' : 'rojo'})`;
    }
  }
  return null;
}

function keyBtn(get, set) {
  const b = h('button', { class: 'btn key' }, keyLabel(get()));
  b.onclick = () => {
    b.textContent = 'Presiona una tecla…';
    b.classList.add('wait');
    capture = (code) => {
      capture = null;
      if (code !== 'Escape') {
        const dup = findKeyUse(code, get);
        if (dup) toast('⚠ Esa tecla ya se usa en: ' + dup, 3500);
        set(code);
        persist();
      }
      renderMenu();
    };
  };
  return b;
}

function viewKeys() {
  const acts = h('div', { class: 'grid' }, ACTIONS.map(([id, label]) =>
    h('div', { class: 'cell' }, h('span', {}, label), keyBtn(() => cfg.keys.actions[id], (c) => (cfg.keys.actions[id] = c)))));

  const teamBox = (t, title) => h('div', { class: 'col' }, h('h3', {}, title),
    [0, 1, 2, 3, 4].map((i) => h('div', { class: 'line' },
      h('input', { type: 'text', value: cfg.playerNames[t][i], onchange: (e) => { cfg.playerNames[t][i] = e.target.value; persist(); } }),
      keyBtn(() => cfg.keys[t][i], (c) => (cfg.keys[t][i] = c)))));

  const ppt = h('select', { onchange: (e) => { cfg.playersPerTeam = Number(e.target.value); persist(); } },
    [1, 2, 3, 4, 5].map((n) => h('option', { value: n }, n + (n === 1 ? ' jugador' : ' jugadores'))));
  ppt.value = String(cfg.playersPerTeam);

  const phrases = h('details', {}, h('summary', {}, 'Frases de voz (separadas por coma). Tú puedes cambiarlas.'),
    ACTIONS.map(([id, label]) => h('div', { class: 'line' }, h('label', {}, label),
      h('input', { type: 'text', style: 'width:620px', value: (cfg.voice.phrases[id] || []).join(', '),
        onchange: (e) => { cfg.voice.phrases[id] = e.target.value.split(',').map((x) => x.trim()).filter(Boolean); persist(); } }))));

  const lang = h('select', { onchange: (e) => { cfg.voice.lang = e.target.value; persist(); if (voiceOn) { stopVoice(); startVoice(); } } },
    [['es-MX', 'Español (México)'], ['es-ES', 'Español (España)'], ['es-US', 'Español (EE. UU.)']].map(([v, l]) => h('option', { value: v }, l)));
  lang.value = cfg.voice.lang;

  return panel('CONFIGURAR TECLADO, JUGADORES Y CONTADORES',
    h('p', { class: 'hint' }, 'Haz clic en el botón de una tecla y presiona la nueva tecla. Funciona con cualquier teclado, incluidos pulsadores USB que simulan teclas. Esc cancela.'),
    h('div', { class: 'line' }, h('span', {}, 'Última tecla detectada: '), h('span', { id: 'lastKey' }, '— presiona una tecla —')),
    h('h3', {}, 'Acciones del juego'), acts,
    h('h3', {}, 'Jugadores y pulsadores'),
    h('div', { class: 'line' }, h('label', {}, 'Jugadores por equipo'), ppt),
    h('div', { class: 'cols2', style: 'grid-template-columns:1fr 1fr' }, teamBox('A', 'Equipo 1 (azul)'), teamBox('B', 'Equipo 2 (rojo)')),
    h('h3', {}, 'Reglas y contadores'),
    h('div', { class: 'line' }, h('label', {}, 'Puntos para ganar la partida'),
      h('input', { type: 'number', min: 1, value: cfg.rules.target, onchange: (e) => { cfg.rules.target = Math.max(1, Number(e.target.value) || 300); persist(); } })),
    h('div', { class: 'line' }, h('label', {}, 'Multiplicador por ronda (coma)'),
      h('input', { type: 'text', value: cfg.rules.multipliers.join(', '), onchange: (e) => {
        const m = e.target.value.split(',').map((x) => Number(x.trim())).filter((x) => x > 0);
        cfg.rules.multipliers = m.length ? m : [1];
        persist(); updateBoard();
      } }),
      h('span', { class: 'hint' }, 'Ej.: 1, 1, 1, 2, 3  → rondas 4 doble y 5 en adelante triple')),
    h('div', { class: 'line' },
      h('button', { class: 'btn', onclick: () => { resetBuzzers(); toast('Pulsadores reiniciados'); } }, 'Reiniciar pulsadores'),
      h('button', { class: 'btn danger', onclick: () => { if (confirm('¿Reiniciar los contadores de ambos equipos?')) resetGame(); } }, 'Reiniciar contadores'),
      h('button', { class: 'btn', onclick: toggleFullscreen }, 'Pantalla completa'),
      h('span', { class: 'hint' }, `Marcador actual: Azul ${state.scoreA} · Rojo ${state.scoreB}`)),
    h('h3', {}, 'Comandos de voz'),
    h('div', { class: 'line' },
      h('label', {}, 'Activar voz al abrir el juego'),
      h('input', { type: 'checkbox', checked: cfg.voice.enabled, onchange: (e) => { cfg.voice.enabled = e.target.checked; persist(); } }),
      h('button', { class: 'btn', onclick: () => { toggleVoice(); } }, 'Probar voz ahora'),
      lang),
    h('div', { class: 'line' },
      h('label', {}, 'Revelar diciendo el texto de la respuesta'),
      h('input', { type: 'checkbox', checked: cfg.voice.matchAnswers, onchange: (e) => { cfg.voice.matchAnswers = e.target.checked; persist(); } }),
      h('span', { class: 'hint' }, 'Si dices exactamente una respuesta del tablero, se revela sola.')),
    phrases);
}

/* --- sonidos --- */
function viewSounds() {
  const rows = SOUNDS.map(([id, label]) => {
    const custom = cfg.sounds.custom[id];
    return h('div', { class: 'line' }, h('label', {}, label),
      h('button', { class: 'btn', onclick: () => play(id, true) }, '▶ Probar'),
      h('button', { class: 'btn', onclick: async () => {
        const u = await pickFile('audio');
        if (u) { cfg.sounds.custom[id] = u; persist(); renderMenu(); }
      } }, 'Elegir MP3…'),
      h('button', { class: 'btn', onclick: () => { delete cfg.sounds.custom[id]; persist(); renderMenu(); } }, 'Restaurar'),
      h('span', { class: 'hint' }, custom ? '✔ usando tu archivo' : 'sonido incluido'));
  });
  return panel('SONIDOS',
    h('p', { class: 'hint' }, 'Puedes cambiar cualquier sonido por tu propio archivo MP3 (también WAV u OGG).'),
    h('div', { class: 'line' }, h('label', {}, 'Volumen general'),
      h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: cfg.sounds.volume, oninput: (e) => { cfg.sounds.volume = Number(e.target.value); persist(); } })),
    h('div', { class: 'line' }, h('label', {}, 'Silenciar todo'),
      h('input', { type: 'checkbox', checked: cfg.sounds.muted, onchange: (e) => { cfg.sounds.muted = e.target.checked; persist(); } })),
    rows);
}

/* --- preguntas y textos --- */
function exportQ() {
  const b = new Blob([JSON.stringify(cfg.questions, null, 2)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(b), download: 'preguntas-100-mexicanos.json' });
  document.body.append(a);
  a.click();
  a.remove();
}
function importQ() {
  const i = document.createElement('input');
  i.type = 'file';
  i.accept = '.json,application/json';
  i.onchange = () => {
    const f = i.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!Array.isArray(data)) throw new Error('formato');
        const list = data.map((x) => ({
          q: String(x.q),
          a: x.a.map((y) => (Array.isArray(y) ? { t: String(y[0]), p: Number(y[1]) || 0 } : { t: String(y.t), p: Number(y.p) || 0 })).slice(0, MAXANS)
        }));
        cfg.questions = list;
        qe.sel = 0;
        persist(); renderMenu();
        toast('Preguntas importadas: ' + list.length);
      } catch { toast('Archivo inválido. Usa el formato exportado por el juego.'); }
    };
    r.readAsText(f);
  };
  i.click();
}

function viewQuestions() {
  const tabBtn = (id, label) => h('button', { class: 'btn' + (qe.tab === id ? ' on' : ''), onclick: () => { qe.tab = id; renderMenu(); } }, label);
  const tabs = h('div', { class: 'tabs' }, tabBtn('q', 'Preguntas y respuestas'), tabBtn('t', 'Nombre del juego y textos'));
  if (qe.tab === 't') {
    return panel('EDITAR LAS PREGUNTAS',
      tabs,
      h('p', { class: 'hint' }, 'Aquí cambias el nombre "100 Mexicanos Dijeron" y todos los textos del juego.'),
      Object.keys(DEFAULT_TEXTS).map((k) => h('div', { class: 'line' }, h('label', {}, TEXT_LABELS[k] || k),
        h('input', { type: 'text', style: 'width:760px', value: cfg.texts[k], onchange: (e) => { cfg.texts[k] = e.target.value; persist(); refreshAll(); } }))),
      h('div', { class: 'line' }, h('button', { class: 'btn danger', onclick: () => {
        if (confirm('¿Restaurar todos los textos originales?')) { cfg.texts = clone(DEFAULT_TEXTS); persist(); refreshAll(); renderMenu(); }
      } }, 'Restaurar textos originales')));
  }

  const qs = cfg.questions;
  if (!qs.length) qs.push({ q: 'Nueva pregunta', a: [{ t: 'Respuesta 1', p: 50 }, { t: 'Respuesta 2', p: 30 }, { t: 'Respuesta 3', p: 20 }] });
  qe.sel = Math.max(0, Math.min(qe.sel, qs.length - 1));
  const q = qs[qe.sel];

  const list = h('div', { class: 'col' },
    h('div', { class: 'qlist' }, qs.map((x, i) => h('button', {
      class: 'btn wide' + (i === qe.sel ? ' on' : ''), onclick: () => { qe.sel = i; renderMenu(); }
    }, `${i + 1}. ${x.q.length > 42 ? x.q.slice(0, 42) + '…' : x.q}`))),
    h('div', { class: 'line' },
      h('button', { class: 'btn accent', onclick: () => { qs.push({ q: 'Nueva pregunta', a: [{ t: '', p: 0 }] }); qe.sel = qs.length - 1; persist(); renderMenu(); } }, '+ Nueva'),
      h('button', { class: 'btn', onclick: () => { if (qe.sel > 0) { [qs[qe.sel - 1], qs[qe.sel]] = [qs[qe.sel], qs[qe.sel - 1]]; qe.sel--; persist(); renderMenu(); } } }, '↑'),
      h('button', { class: 'btn', onclick: () => { if (qe.sel < qs.length - 1) { [qs[qe.sel + 1], qs[qe.sel]] = [qs[qe.sel], qs[qe.sel + 1]]; qe.sel++; persist(); renderMenu(); } } }, '↓'),
      h('button', { class: 'btn danger', onclick: () => { if (confirm('¿Eliminar esta pregunta?')) { qs.splice(qe.sel, 1); persist(); renderMenu(); } } }, 'Eliminar')),
    h('div', { class: 'line' },
      h('button', { class: 'btn', onclick: importQ }, 'Importar JSON'),
      h('button', { class: 'btn', onclick: exportQ }, 'Exportar JSON'),
      h('button', { class: 'btn danger', onclick: () => {
        if (confirm('¿Restaurar las preguntas de ejemplo? Se perderán las tuyas.')) { cfg.questions = toQ(window.DEFAULT_QUESTIONS); qe.sel = 0; persist(); renderMenu(); }
      } }, 'Restaurar ejemplo')));

  const total = q.a.reduce((s, a) => s + (Number(a.p) || 0), 0);
  const ed = h('div', { class: 'col' },
    h('h3', {}, 'Pregunta'),
    h('textarea', { value: q.q, onchange: (e) => { q.q = e.target.value; persist(); if (state.q === qe.sel) updateBoard(); renderMenu(); } }),
    h('h3', {}, 'Respuestas (máximo 5, ordénalas de mayor a menor puntaje)'),
    q.a.map((a, i) => h('div', { class: 'ansrow' }, h('b', {}, i + 1 + '.'),
      h('input', { type: 'text', value: a.t, onchange: (e) => { a.t = e.target.value; persist(); } }),
      h('input', { type: 'number', min: 0, value: a.p, onchange: (e) => { a.p = Number(e.target.value) || 0; persist(); renderMenu(); } }),
      h('button', { class: 'btn danger', onclick: () => { if (q.a.length > 1) { q.a.splice(i, 1); persist(); renderMenu(); } } }, '✕'))),
    h('div', { class: 'line' },
      h('button', { class: 'btn accent', onclick: () => { if (q.a.length < MAXANS) { q.a.push({ t: '', p: 0 }); persist(); renderMenu(); } else toast('Máximo ' + MAXANS + ' respuestas (la marquesina tiene 5 renglones)'); } }, '+ Respuesta'),
      h('span', { class: 'hint' }, `Suma de puntos: ${total}`)),
    h('div', { class: 'line' }, h('button', { class: 'btn on', onclick: () => {
      state.q = qe.sel;
      closeMenu();
      if (state.screen !== 'board') showScreen('board');
      loadQ();
    } }, '▶ Jugar esta pregunta ahora')));

  return panel('EDITAR LAS PREGUNTAS', tabs, h('div', { class: 'cols2', style: 'grid-template-columns:460px 1fr' }, list, ed));
}

/* ---------- teclado global ---------- */
addEventListener('keydown', (e) => {
  const lk = $('#lastKey');
  if (lk) lk.textContent = `${e.code}  (${e.key})`;

  if (capture) { e.preventDefault(); capture(e.code); return; }
  const tag = e.target && e.target.tagName;
  const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag);
  if (typing && e.code !== 'Escape') return;
  if (e.repeat) return;
  const code = normCode(e.code);

  if (menu.open) {
    if (code === 'Escape') {
      e.preventDefault();
      if (typing) e.target.blur();
      menu.view === 'main' ? closeMenu() : openMenu('main');
      return;
    }
    if (menu.view === 'main') {
      const fns = menuItems();
      if (/^Digit[1-6]$/.test(code)) { e.preventDefault(); fns[Number(code.slice(5)) - 1](); }
      else if (code === 'ArrowDown') { e.preventDefault(); setSel((menu.sel + 1) % 6); }
      else if (code === 'ArrowUp') { e.preventDefault(); setSel((menu.sel + 5) % 6); }
      else if (code === 'Enter') { e.preventDefault(); fns[menu.sel](); }
    }
    return;
  }
  if (typing) return;

  const A = cfg.keys.actions;
  if (code === normCode(A.menu) || code === 'Escape') { e.preventDefault(); doAction('menu'); return; }

  if (state.screen === 'board') {
    for (const t of ['A', 'B']) {
      const idx = cfg.keys[t].findIndex((k) => normCode(k) === code);
      if (idx >= 0 && idx < cfg.playersPerTeam) { e.preventDefault(); buzz(t, idx); return; }
    }
  }
  for (const [id] of ACTIONS) {
    if (id !== 'menu' && normCode(A[id]) === code) { e.preventDefault(); doAction(id); return; }
  }
});

/* ---------- arranque ---------- */
function bindUI() {
  $('#title').addEventListener('click', () => { if (!menu.open) doAction('start'); });
  $('#btnMenu').addEventListener('click', () => doAction('menu'));
  $('#btnFs').addEventListener('click', toggleFullscreen);
  $('#btnVoice').addEventListener('click', toggleVoice);
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button');
    if (b) b.blur();
  });
  addEventListener('resize', fit);
}

async function init() {
  let loaded = null;
  try { loaded = await store.load(); } catch { /* primera vez */ }
  cfg = merge(makeDefaults(), loaded || {});
  // los skins incluidos siempre se mantienen originales
  DEFAULT_SKINS.forEach((s) => {
    const i = cfg.skins.findIndex((x) => x.id === s.id);
    if (i < 0) cfg.skins.unshift(clone(s)); else cfg.skins[i] = clone(s);
  });
  cfg.skins.forEach((s) => { s.img = { ...NOIMG, ...(s.img || {}) }; s.layout = s.layout || 'auto'; });
  if (!cfg.skins.some((s) => s.id === cfg.skinId)) cfg.skinId = 'clasico';
  if (!Array.isArray(cfg.questions) || !cfg.questions.length) cfg.questions = toQ(window.DEFAULT_QUESTIONS);
  cfg.questions.forEach((x) => { x.a = x.a.slice(0, MAXANS); });

  state.q = Math.min(cfg.progress.q || 0, cfg.questions.length - 1);
  state.round = cfg.progress.round || 1;
  state.scoreA = cfg.progress.scoreA || 0;
  state.scoreB = cfg.progress.scoreB || 0;
  state.showQ = cfg.rules.showQuestion !== false;

  bindUI();
  fit();
  applySkin();
  showScreen('title');
  updateVoiceUI();
  if (cfg.voice.enabled) startVoice();
}
init();
