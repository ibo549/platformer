// ═══════════════════════════════════════════════════════════════════════
// 01-core: constants, state, pixel-scale, audio, three.js setup, pools
// ═══════════════════════════════════════════════════════════════════════

// ─── Physics / world constants ───
const GRAVITY = -38;
const JUMP_FORCE = 16;
const MOVE_SPEED = 8;
const GROUND_Y = -3;
const COIN_SIZE = 0.4;
const MAX_LIVES = 10;

// Character sprite normalization (shared canvas size for all characters)
const NORM_W = 260;
const NORM_H = 410;

// ─── Pixel scale ───
// Render at reduced resolution, upscale with nearest-neighbor CSS.
// Must be an integer so the CSS upscale from backing to display is clean.
// Fractional values (e.g. 3/dpr when dpr=2 = 1.5) produce uneven pixel widths.
function getPixelScale() {
  const dpr = window.devicePixelRatio || 1;
  const physH = window.innerHeight * dpr;
  const raw = physH >= 2000 ? 6 / dpr : 3 / dpr;
  return Math.max(1, Math.round(raw));
}
let PIXEL_SCALE = getPixelScale();

// ─── Mutable game state (shared across modules) ───
let gameState = 'start';          // 'start' | 'playing' | 'over' | 'win' | 'menu'
let score = 0;
let distance = 0;
let lastMilestone = 0;
let killCount = 0;
let lives = 2;
let hasShield = false;
let invincibleTimer = 0;

// Player kinematics
let velocityX = 0;
let velocityY = 0;
let isGrounded = false;
let jumpsLeft = 2;
let facingRight = true;
let playerOnPlatform = null;

// Player animation
let currentFrame = 0;
let frameTimer = 0;
let animState = 'idle';

// Selection
let selectedChar = 'halil';
let gameDifficulty = 'normal';

// Input
const keys = { left: false, right: false, jump: false };
let jumpPressed = false;

// ─── Audio (Web Audio API chiptune) ───
let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, duration, type = 'square', vol = 0.15) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playNoiseBurst(duration, freq, q, vol, envPow = 0.15) {
  if (!audioCtx) return;
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * duration, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) {
    const env = Math.exp(-i / (d.length * envPow));
    d[i] = (Math.random() * 2 - 1) * env;
  }
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const bp = audioCtx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = q;
  const g = audioCtx.createGain();
  g.gain.value = vol;
  src.connect(bp); bp.connect(g); g.connect(audioCtx.destination);
  src.start();
}

function speak(text, { rate = 1.5, pitch = 1.5, volume = 0.8 } = {}) {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate; u.pitch = pitch; u.volume = volume;
  speechSynthesis.speak(u);
}

// ─── SFX library ───
function sfxJump() { ensureAudio(); playTone(300, 0.1, 'square', 0.12); setTimeout(() => playTone(500, 0.1, 'square', 0.10), 50); }
function sfxDoubleJump() { ensureAudio(); playTone(400, 0.08, 'square', 0.10); setTimeout(() => playTone(600, 0.08, 'square', 0.10), 40); setTimeout(() => playTone(800, 0.12, 'square', 0.08), 80); }
function sfxCoin() { ensureAudio(); playTone(988, 0.06, 'square', 0.10); setTimeout(() => playTone(1319, 0.12, 'square', 0.10), 60); }
function sfxDeath() { ensureAudio(); playTone(400, 0.15, 'square', 0.15); setTimeout(() => playTone(300, 0.15, 'square', 0.15), 120); setTimeout(() => playTone(200, 0.2, 'square', 0.15), 240); setTimeout(() => playTone(100, 0.4, 'sawtooth', 0.12), 400); }
function sfxStart() { ensureAudio(); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.12, 'square', 0.10), i * 80)); }
function sfxStomp() { ensureAudio(); playTone(200, 0.08, 'square', 0.15); setTimeout(() => playTone(120, 0.15, 'sawtooth', 0.12), 60); }
function sfxLifeUp() { ensureAudio(); [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => playTone(f, 0.12, 'triangle', 0.12), i * 70)); }
function sfxEggCrack() { ensureAudio(); playTone(600, 0.06, 'triangle', 0.12); setTimeout(() => playTone(900, 0.08, 'triangle', 0.10), 50); setTimeout(() => playTone(1200, 0.15, 'triangle', 0.12), 100); }
function sfxShield() { ensureAudio(); playTone(440, 0.1, 'triangle', 0.12); setTimeout(() => playTone(660, 0.1, 'triangle', 0.12), 80); setTimeout(() => playTone(880, 0.15, 'triangle', 0.10), 160); }
function sfxShieldBreak() { ensureAudio(); playTone(600, 0.1, 'square', 0.12); setTimeout(() => playTone(300, 0.15, 'sawtooth', 0.10), 80); }
function sfxKola() { speak('kola kola kola kola', { rate: 1.2, pitch: 0.1, volume: 0.8 }); setTimeout(() => speak('kola kola', { rate: 2.0, pitch: 2.0, volume: 0.4 }), 400); }
function sfxGaw() { speak('gaw gaw gaw gaw gaw', { rate: 1.6, pitch: 1.8, volume: 0.7 }); }
function sfxKupa() {
  ensureAudio();
  if (!audioCtx) return;
  [500, 350, 200, 120, 60].forEach((f, i) => setTimeout(() => playTone(f, 0.1, 'sawtooth', 0.15), i * 50));
  setTimeout(() => {
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.15, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.3));
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    const g = audioCtx.createGain();
    g.gain.value = 0.12;
    src.connect(g); g.connect(audioCtx.destination);
    src.start();
  }, 200);
}
function sfxHit() { ensureAudio(); playTone(180, 0.12, 'sawtooth', 0.15); setTimeout(() => playTone(140, 0.15, 'square', 0.12), 80); }
function sfxSplash() {
  ensureAudio();
  if (!audioCtx) return;
  playNoiseBurst(0.15, 1200, 0.8, 0.2);
  playTone(900, 0.06, 'sine', 0.12);
  setTimeout(() => playTone(700, 0.07, 'sine', 0.10), 30);
  setTimeout(() => playTone(500, 0.08, 'sine', 0.08), 70);
  setTimeout(() => playTone(350, 0.10, 'sine', 0.06), 120);
  setTimeout(() => {
    const bbl = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.08, audioCtx.sampleRate);
    const bd = bbl.getChannelData(0);
    for (let i = 0; i < bd.length; i++) bd[i] = Math.sin(i * 0.15) * Math.exp(-i / (bd.length * 0.4)) * 0.3;
    const bs = audioCtx.createBufferSource();
    bs.buffer = bbl;
    const bg = audioCtx.createGain();
    bg.gain.value = 0.15;
    bs.connect(bg); bg.connect(audioCtx.destination);
    bs.start();
  }, 180);
}
function sfxOhMyGodTow() { speak('oh my god-tow', { rate: 1.4, pitch: 2.0, volume: 0.8 }); }
function sfxPteroScreech() { ensureAudio(); [800, 1100, 1400, 1800].forEach((f, i) => setTimeout(() => playTone(f, 0.06, 'sawtooth', 0.08), i * 35)); }
function sfxPteroDazed() { ensureAudio(); [600, 500, 650, 450, 550, 400].forEach((f, i) => setTimeout(() => playTone(f, 0.08, 'triangle', 0.10), i * 60)); }
function sfxCelebration() {
  ensureAudio();
  const notes = [523, 659, 784, 880, 1047, 1175, 1319, 1568];
  notes.forEach((f, i) => setTimeout(() => playTone(f, 0.15, 'square', 0.12), i * 60));
  setTimeout(() => playTone(1568, 0.4, 'triangle', 0.10), notes.length * 60);
}

// ─── Three.js setup ───
const canvas = document.getElementById('game-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });

function getInternalSize() {
  return {
    w: Math.floor(window.innerWidth / PIXEL_SCALE),
    h: Math.floor(window.innerHeight / PIXEL_SCALE),
  };
}

let internal = getInternalSize();
renderer.setSize(internal.w, internal.h, false);
renderer.setPixelRatio(1);
renderer.setClearColor(0xff7e5f);
canvas.style.width = '100vw';
canvas.style.height = '100vh';

const scene = new THREE.Scene();
const camH = 10;
const camera = new THREE.OrthographicCamera(
  -camH * (internal.w / internal.h), camH * (internal.w / internal.h),
  camH, -camH, 0.1, 1000
);
camera.position.set(0, 2, 10);
camera.lookAt(0, 2, 0);

// ─── Lighting ───
scene.add(new THREE.AmbientLight(0xffffff, 0.8));
const dirLight = new THREE.DirectionalLight(0xffe4b5, 0.6);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// ─── Material & geometry pools ───
// Share materials/geometries for immutable meshes to slash WebGL overhead.
// Rule: share only where the material/geometry will never be mutated at runtime.
// For meshes that fade opacity or tint (particles, wet enemies, confetti), build fresh.
const _matCache = new Map();
function sharedMat(color, opts = {}) {
  const {
    transparent = false,
    opacity = 1.0,
    depthWrite = true,
    alphaTest = 0,
    side = THREE.FrontSide,
  } = opts;
  const key = `${color}|${transparent?1:0}|${opacity.toFixed(3)}|${depthWrite?1:0}|${alphaTest}|${side}`;
  let m = _matCache.get(key);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, transparent, opacity, depthWrite, alphaTest, side });
    _matCache.set(key, m);
  }
  return m;
}

const _boxCache = new Map();
function sharedBox(w, h, d) {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
  let g = _boxCache.get(key);
  if (!g) {
    g = new THREE.BoxGeometry(w, h, d);
    _boxCache.set(key, g);
  }
  return g;
}

// Convenience: shared-resources box mesh.
function box(w, h, d, color, opts) {
  return new THREE.Mesh(sharedBox(w, h, d), sharedMat(color, opts));
}

// ─── Cached DOM refs ───
// Populated by initUI() at bootstrap so per-frame code doesn't query the DOM.
const ui = {};
function initUI() {
  ui.score = document.getElementById('score-value');
  ui.distance = document.getElementById('distance-display');
  ui.lives = document.getElementById('lives-display');
  ui.livesSpan = ui.lives.querySelector('span');
  ui.killPips = document.getElementById('kill-pips');
  ui.companionIcon = document.getElementById('companion-icon');
  ui.companionCount = document.getElementById('companion-count');
  ui.shieldDisplay = document.getElementById('shield-display');
  ui.startScreen = document.getElementById('start-screen');
  ui.gameOverScreen = document.getElementById('game-over-screen');
  ui.winScreen = document.getElementById('win-screen');
  ui.finalScore = document.getElementById('final-score');
  ui.winSubtitle = document.getElementById('win-subtitle');
  ui.winScore = document.getElementById('win-score');
  ui.controlsHint = document.getElementById('controls-hint');
  ui.mobileControls = document.getElementById('mobile-controls');
}
