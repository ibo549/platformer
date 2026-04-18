// ═══════════════════════════════════════════════════════════════════════
// 05-player: player mesh, shield, animation state machine, hit/invincibility, trail
// ═══════════════════════════════════════════════════════════════════════

// Normalized frame aspect: NORM_W / NORM_H ≈ 0.634
const playerH = 2.8;
const playerW = playerH * 0.634;
const playerGeo = new THREE.PlaneGeometry(playerW, playerH);
const playerMat = new THREE.MeshBasicMaterial({
  transparent: true,
  side: THREE.DoubleSide,
  alphaTest: 0.1,
});
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.set(0, GROUND_Y + playerH / 2, 0);
scene.add(player);

// Trail (used by companions to follow at varying delays)
const playerTrail = [];
const COMPANION_TRAIL_LEN = 30;

function updatePlayerTrail() {
  playerTrail.push({ x: player.position.x, y: player.position.y });
  const maxLen = (companions.length + 2) * COMPANION_TRAIL_LEN + 60;
  if (playerTrail.length > maxLen) playerTrail.splice(0, playerTrail.length - maxLen);
}

// ─── Shield (tiny pixel hearts flowing around a capsule that hugs the body) ───
const shieldGroup = new THREE.Group();
const SHIELD_SEGMENTS = 16;
const shieldHearts = [];

const capW = 1.1;   // half-width of capsule
const capH = 1.5;   // half-height of straight sides
const capR = 0.55;  // corner radius

// Precompute a lookup table of (x,y) points around the capsule.
// Query capsulePoint(t) with t in [0,1); we bilinearly interpolate.
const CAPSULE_LUT_SIZE = 128;
const _capsuleLUT = new Float32Array(CAPSULE_LUT_SIZE * 2);
(function buildCapsuleLUT() {
  const straight = capH - capR;
  const perim = 2 * straight * 2 + 2 * Math.PI * capR;
  for (let i = 0; i < CAPSULE_LUT_SIZE; i++) {
    const t = i / CAPSULE_LUT_SIZE;
    let d = t * perim;
    let x, y;
    if (d < straight * 2) {
      x = capW; y = -capH + capR + d;
    } else if ((d -= straight * 2) < Math.PI * capR) {
      const ang = d / capR;
      x = capW * Math.cos(ang);
      y = capH - capR + capR * Math.sin(ang);
    } else if ((d -= Math.PI * capR) < straight * 2) {
      x = -capW; y = capH - capR - d;
    } else {
      d -= straight * 2;
      const ang = Math.PI + d / capR;
      x = -capW * Math.cos(ang - Math.PI);
      y = -capH + capR + capR * Math.sin(ang);
    }
    _capsuleLUT[i * 2] = x;
    _capsuleLUT[i * 2 + 1] = y;
  }
})();

function capsulePoint(t) {
  t = ((t % 1) + 1) % 1;
  const f = t * CAPSULE_LUT_SIZE;
  const i0 = Math.floor(f) % CAPSULE_LUT_SIZE;
  const i1 = (i0 + 1) % CAPSULE_LUT_SIZE;
  const a = f - Math.floor(f);
  const x = _capsuleLUT[i0 * 2] * (1 - a) + _capsuleLUT[i1 * 2] * a;
  const y = _capsuleLUT[i0 * 2 + 1] * (1 - a) + _capsuleLUT[i1 * 2 + 1] * a;
  return { x, y };
}

// Pixel heart: 6x7 dot pattern built from a shared unit box, using per-heart material
// so we can animate opacity per-heart (not per-pixel) — all pixels of one heart
// share one material, saving ~16x material count vs. the original.
const HEART_PIXEL = 0.05;
const heartGeo = sharedBox(HEART_PIXEL, HEART_PIXEL, 0.05);
const HEART_ROWS = [
  [0,1,0,0,0,1,0],
  [1,1,1,0,1,1,1],
  [1,1,1,1,1,1,1],
  [0,1,1,1,1,1,0],
  [0,0,1,1,1,0,0],
  [0,0,0,1,0,0,0],
];

function makePixelHeart(color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
  g.userData.mat = mat;
  for (let r = 0; r < HEART_ROWS.length; r++) {
    for (let c = 0; c < HEART_ROWS[r].length; c++) {
      if (!HEART_ROWS[r][c]) continue;
      const b = new THREE.Mesh(heartGeo, mat);
      b.position.set((c - 3) * HEART_PIXEL, (2.5 - r) * HEART_PIXEL, 0);
      g.add(b);
    }
  }
  return g;
}

function buildShieldHearts() {
  while (shieldGroup.children.length) shieldGroup.remove(shieldGroup.children[0]);
  // Dispose the old per-heart materials to avoid leaks between character swaps
  for (const h of shieldHearts) h.userData.mat.dispose();
  shieldHearts.length = 0;
  const color = currentCharData().shieldColor;
  for (let i = 0; i < SHIELD_SEGMENTS; i++) {
    const heart = makePixelHeart(color);
    shieldGroup.add(heart);
    shieldHearts.push(heart);
  }
}

shieldGroup.visible = false;
scene.add(shieldGroup);

function updateShieldVisual(time) {
  shieldGroup.visible = hasShield;
  if (!hasShield) return;
  shieldGroup.position.set(player.position.x, player.position.y, 0);
  for (let i = 0; i < SHIELD_SEGMENTS; i++) {
    const t = (i / SHIELD_SEGMENTS) + time * 0.15;
    const pt = capsulePoint(t);
    const breathe = 1.0 + Math.sin(time * 3 + i * 0.7) * 0.06;
    const heart = shieldHearts[i];
    heart.position.set(pt.x * breathe, pt.y * breathe, 0.2);
    heart.userData.mat.opacity = 0.65 + Math.sin(time * 4 + i * 0.9) * 0.2;
  }
}

function activateShield() {
  hasShield = true;
  sfxShield();
  const rgb = currentCharData().shieldHudRGB;
  ui.shieldDisplay.style.display = 'flex';
  ui.shieldDisplay.style.borderColor = `rgba(${rgb},0.7)`;
  ui.shieldDisplay.style.boxShadow = `0 0 6px rgba(${rgb},0.4)`;
  ui.shieldDisplay.style.animation = 'shieldPulse 2s ease-in-out infinite';
}

function breakShield() {
  hasShield = false;
  sfxShieldBreak();
  ui.shieldDisplay.style.display = 'none';
  invincibleTimer = 0.5;
}

// ─── Animation state machine ───
// Run cycle: contact1 → run1 → push1 → contact2 → run2 → push2
// Frames 6-9 are derived squash/stretch versions of run1/run2.
const ANIM_FRAMES = {
  idle: [0],
  run:  [6, 1, 7, 8, 2, 9],
  jump: [3],
  fall: [4],
  land: [5],
};

function updateAnimation(dt) {
  let newState = 'idle';
  if (!isGrounded) newState = velocityY > 0 ? 'jump' : 'fall';
  else if (Math.abs(velocityX) > 0.5) newState = 'run';

  if (newState !== animState) {
    animState = newState;
    currentFrame = 0;
    frameTimer = 0;
  }

  const frames = ANIM_FRAMES[animState];
  const runSpeed = Math.min(Math.abs(velocityX) / 12, 1);
  const speed = animState === 'run' ? 0.06 + 0.05 * (1 - runSpeed) : 0.2;

  frameTimer += dt;
  if (frameTimer >= speed) {
    frameTimer = 0;
    currentFrame = (currentFrame + 1) % frames.length;
  }

  setFrame(frames[currentFrame]);

  if (velocityX > 0.5) facingRight = true;
  if (velocityX < -0.5) facingRight = false;
  player.scale.x = facingRight ? 1 : -1;
}

// ─── Hit / invincibility ───
function hitPlayer() {
  if (invincibleTimer > 0) return;

  if (hasShield) {
    breakShield();
    return;
  }

  lives--;
  updateLivesDisplay();
  sfxHit();

  if (lives <= 0) {
    gameOver();
  } else {
    invincibleTimer = 1.5;
    velocityY = JUMP_FORCE * 0.5;
    velocityX = facingRight ? -6 : 6;
  }
}

function updateInvincibility(dt) {
  if (invincibleTimer > 0) {
    invincibleTimer -= dt;
    player.visible = Math.floor(invincibleTimer * 10) % 2 === 0;
    if (invincibleTimer <= 0) {
      invincibleTimer = 0;
      player.visible = true;
    }
  }
}

function updateLivesDisplay() {
  let hearts = '';
  for (let i = 0; i < lives; i++) hearts += '\u2665';
  ui.livesSpan.textContent = hearts;
  ui.livesSpan.style.color = lives <= 1 ? '#ff6666' : '#ff4444';
}

function updateKillDisplay() {
  const progress = killCount % 5;
  let pips = '';
  for (let i = 0; i < 5; i++) pips += i < progress ? '\u{1F4A9}' : '\u25CB';
  ui.killPips.textContent = pips;
}
