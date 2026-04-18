// ═══════════════════════════════════════════════════════════════════════
// 09-enemies: ground enemies (brown / stick / strawberry) + shared helpers
// ═══════════════════════════════════════════════════════════════════════
//
// Common lifecycle: create art → push to array → per-frame update (patrol,
// waddle, optional talk bubble, collision with player → stomp or hit).
// Helpers at the top capture the shared logic so each specific update
// function only has to describe what's unique.

// ─── Dimensions & arrays ───
const ENEMY_W = 0.9;
const ENEMY_H = 0.9;
const ENEMY_SPEED = 2.5;

const STICK_W = 0.7;
const STICK_H = 4.5;
const STICK_SPEED = 1.8;

const STRAW_W = 1.2;
const STRAW_H = 1.6;
const STRAW_SPEED = 3.0;

const enemies = [];
const stickEnemies = [];
const strawEnemies = [];

// ─── Score & milestone helpers ───
function setScore(v) {
  score = v;
  ui.score.textContent = score;
}
function addScore(n) {
  setScore(score + n);
  checkCoinMilestone();
}
function checkCoinMilestone() {
  const milestone = Math.floor(score / 150);
  if (milestone > lastMilestone) {
    lastMilestone = milestone;
    spawnConfetti();
    sfxCelebration();
    ui.score.style.color = '#ffe066';
    ui.score.style.textShadow = '0 0 8px #ffe066';
    setTimeout(() => {
      ui.score.style.color = '#fff';
      ui.score.style.textShadow = 'none';
    }, 600);
  }
}

function onEnemyKilled(x, y) {
  spawnEnemyBurst(x, y);
  killCount++;
  updateKillDisplay();
  if (killCount % 5 === 0 && lives < MAX_LIVES) {
    lives++;
    updateLivesDisplay();
    updateKillDisplay();
    sfxLifeUp();
    ui.lives.style.borderColor = '#52b788';
    ui.lives.style.background = 'rgba(82,183,136,0.15)';
    setTimeout(() => {
      ui.lives.style.borderColor = '#555';
      ui.lives.style.background = 'transparent';
    }, 500);
  }
}

// ─── Shared enemy helpers ───

// Tick the squish-out timer and splice when it expires. Returns true if the caller
// should skip this iteration (enemy is dead or just removed).
function handleDeathTimer(e, d, dt, arr, i) {
  if (d.alive) return false;
  d.squishTimer -= dt;
  if (d.squishTimer <= 0) {
    scene.remove(e);
    arr.splice(i, 1);
  }
  return true;
}

// Move between patrolLeft/patrolRight, bouncing when it hits either end.
function doPatrol(e, d, dt) {
  e.position.x += d.vx * dt;
  if (e.position.x <= d.patrolLeft) d.vx = Math.abs(d.vx);
  if (e.position.x >= d.patrolRight) d.vx = -Math.abs(d.vx);
}

// Distance from the camera horizontally — enemies far off-screen skip their
// talk-bubble + wet-drop + flap animation to save time.
const OFFSCREEN_SKIP = 20;
function isOffscreenEnemy(e) {
  return Math.abs(e.position.x - camera.position.x) > OFFSCREEN_SKIP;
}

// Rectangle-rectangle player overlap. Returns {eTop, pBottom} if hitting, else null.
function playerOverlap(ex, ey, ew, eh) {
  const eLeft = ex - ew * 0.5;
  const eRight = ex + ew * 0.5;
  const eBottom = ey;
  const eTop = ey + eh;
  const pLeft = player.position.x - playerW * 0.3;
  const pRight = player.position.x + playerW * 0.3;
  const pBottom = player.position.y - playerH / 2;
  const pTop = player.position.y + playerH / 2;
  if (pRight > eLeft && pLeft < eRight && pTop > eBottom && pBottom < eTop) {
    return { eTop, pBottom };
  }
  return null;
}

// A stomp is an overlap where the player is falling AND the player's feet are
// near the top of the enemy (within stompFrac*enemyHeight from the top).
function isStomp(overlap, enemyH, stompFrac) {
  return velocityY < 0 && overlap.pBottom >= overlap.eTop - enemyH * stompFrac;
}

// Begin squish-out death animation in place.
function squishDeath(e, d, squishTime, scaleY, yOffset = 0) {
  d.alive = false;
  d.squishTimer = squishTime;
  e.scale.y = scaleY;
  e.position.y += yOffset;
}

// Opacity/timer update for a speech bubble. `onTalkStart` fires the voice sfx.
function updateTalkBubble(d, distToPlayer, dt, opts) {
  if (!d.bubble) return;
  if (d.talkDuration > 0) {
    d.talkDuration -= dt;
    d.bubble.material.opacity = Math.min(1, d.talkDuration * 3);
    if (d.talkDuration <= 0) {
      d.bubble.material.opacity = 0;
      d.talkTimer = opts.cooldownMin + Math.random() * opts.cooldownRange;
    }
  } else if (distToPlayer < opts.range) {
    d.talkTimer -= dt;
    if (d.talkTimer <= 0) {
      d.talkDuration = opts.duration;
      d.bubble.material.opacity = 1;
      if (opts.onTalkStart) opts.onTalkStart();
    }
  }
}

// ─── Brown enemy ───
function createBrownEnemy(x, y) {
  const g = new THREE.Group();

  // Body and head
  const body = box(ENEMY_W, ENEMY_H * 0.7, 0.6, 0x8B4513);
  body.position.y = ENEMY_H * 0.35; g.add(body);
  const head = box(ENEMY_W * 0.7, ENEMY_H * 0.35, 0.5, 0xA0522D);
  head.position.y = ENEMY_H * 0.7; g.add(head);

  // Eyes (whites + pupils)
  const eyeL = box(0.15, 0.12, 0.1, 0xffffff);
  eyeL.position.set(-0.15, ENEMY_H * 0.55, 0.31); g.add(eyeL);
  const eyeR = box(0.15, 0.12, 0.1, 0xffffff);
  eyeR.position.set(0.15, ENEMY_H * 0.55, 0.31); g.add(eyeR);
  const pupilL = box(0.08, 0.08, 0.05, 0x000000);
  pupilL.position.set(-0.15, ENEMY_H * 0.53, 0.36); g.add(pupilL);
  const pupilR = box(0.08, 0.08, 0.05, 0x000000);
  pupilR.position.set(0.15, ENEMY_H * 0.53, 0.36); g.add(pupilR);

  // Angry eyebrows
  const browL = box(0.2, 0.06, 0.05, 0x000000);
  browL.position.set(-0.15, ENEMY_H * 0.65, 0.36);
  browL.rotation.z = 0.3; g.add(browL);
  const browR = box(0.2, 0.06, 0.05, 0x000000);
  browR.position.set(0.15, ENEMY_H * 0.65, 0.36);
  browR.rotation.z = -0.3; g.add(browR);

  // Feet
  const footL = box(0.25, 0.15, 0.3, 0x654321);
  footL.position.set(-0.22, 0.07, 0.1); g.add(footL);
  const footR = box(0.25, 0.15, 0.3, 0x654321);
  footR.position.set(0.22, 0.07, 0.1); g.add(footR);

  g.position.set(x, y, 0);
  g.userData = {
    alive: true,
    vx: (Math.random() > 0.5 ? 1 : -1) * ENEMY_SPEED,
    patrolLeft: x - 6 - Math.random() * 4,
    patrolRight: x + 6 + Math.random() * 4,
    squishTimer: 0,
    walkTimer: 0,
    vy: 0,
    onGround: true,
    groundY: y,
    jumpCooldown: 1 + Math.random() * 5,
  };
  scene.add(g);
  enemies.push(g);
  return g;
}

function updateBrownEnemies(dt) {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const d = e.userData;
    if (handleDeathTimer(e, d, dt, enemies, i)) continue;

    doPatrol(e, d, dt);

    // Random hops
    if (d.onGround) {
      d.jumpCooldown -= dt;
      if (d.jumpCooldown <= 0) {
        d.vy = 8 + Math.random() * 4;
        d.onGround = false;
        d.jumpCooldown = 2 + Math.random() * 4;
      }
    }
    if (!d.onGround) {
      d.vy += GRAVITY * dt;
      e.position.y += d.vy * dt;
      if (e.position.y <= d.groundY) {
        e.position.y = d.groundY;
        d.vy = 0;
        d.onGround = true;
      }
    }

    if (!isOffscreenEnemy(e)) {
      d.walkTimer += dt * 8;
      e.rotation.z = Math.sin(d.walkTimer) * 0.12;
    }

    const ov = playerOverlap(e.position.x, e.position.y, ENEMY_W * 0.9, ENEMY_H);
    if (ov) {
      if (isStomp(ov, ENEMY_H, 0.45)) {
        squishDeath(e, d, 0.4, 0.3, -ENEMY_H * 0.25);
        sfxStomp();
        sfxKupa();
        onEnemyKilled(e.position.x, e.position.y + ENEMY_H * 0.5);
        addScore(20);
        velocityY = JUMP_FORCE * 0.7;
      } else if (invincibleTimer <= 0) {
        hitPlayer();
      }
    }
  }
}

// ─── Stick enemy (tall, 2 stomps, shouts KOLA) ───
function createStickEnemy(x, y) {
  const g = new THREE.Group();

  const body = box(STICK_W * 0.45, STICK_H * 0.85, 0.35, 0x8B5E3C);
  body.position.y = STICK_H * 0.42; g.add(body);
  const grain = box(STICK_W * 0.12, STICK_H * 0.7, 0.04, 0x6B3F22);
  grain.position.set(0.04, STICK_H * 0.4, 0.18); g.add(grain);

  const eyeL = box(0.08, 0.08, 0.08, 0x111111);
  eyeL.position.set(-0.07, STICK_H * 0.78, 0.18); g.add(eyeL);
  const eyeR = box(0.08, 0.08, 0.08, 0x111111);
  eyeR.position.set(0.07, STICK_H * 0.78, 0.18); g.add(eyeR);

  // Left arm + fingers
  const armL = box(0.5, 0.08, 0.1, 0x7A5230);
  armL.position.set(-0.4, STICK_H * 0.55, 0.05);
  armL.rotation.z = -0.2; g.add(armL);
  for (const [fx, fy, rz] of [[-0.65, STICK_H * 0.58, 0.3], [-0.68, STICK_H * 0.55, 0], [-0.65, STICK_H * 0.52, -0.25]]) {
    const f = box(0.2, 0.04, 0.04, 0x7A5230);
    f.position.set(fx, fy, 0.05);
    f.rotation.z = rz;
    g.add(f);
  }

  // Right arm + fingers
  const armR = box(0.5, 0.08, 0.1, 0x7A5230);
  armR.position.set(0.4, STICK_H * 0.55, 0.05);
  armR.rotation.z = 0.2; g.add(armR);
  for (const [fx, fy, rz] of [[0.65, STICK_H * 0.58, -0.3], [0.68, STICK_H * 0.55, 0], [0.65, STICK_H * 0.52, 0.25]]) {
    const f = box(0.2, 0.04, 0.04, 0x7A5230);
    f.position.set(fx, fy, 0.05);
    f.rotation.z = rz;
    g.add(f);
  }

  const spot = box(0.15, 0.18, 0.08, 0xcc2222);
  spot.position.set(0, STICK_H * 0.4, 0.2); g.add(spot);

  const footL = box(0.15, 0.12, 0.2, 0x6B3F22);
  footL.position.set(-0.1, 0.06, 0.05); g.add(footL);
  const footR = box(0.15, 0.12, 0.2, 0x6B3F22);
  footR.position.set(0.1, 0.06, 0.05); g.add(footR);

  const bubble = makeSpeechBubble('KOLA KOLA KOLA KOLA', '#6B3F22', 18);
  bubble.position.set(0, STICK_H + 0.6, 0.3);
  g.add(bubble);

  g.position.set(x, y, 0);
  g.userData = {
    alive: true,
    hp: 2,
    vx: (Math.random() > 0.5 ? 1 : -1) * STICK_SPEED,
    patrolLeft: x - 6 - Math.random() * 4,
    patrolRight: x + 6 + Math.random() * 4,
    squishTimer: 0,
    walkTimer: 0,
    isStick: true,
    bubble,
    talkTimer: 2 + Math.random() * 5,
    talkDuration: 0,
  };
  scene.add(g);
  stickEnemies.push(g);
  return g;
}

const STICK_TALK_OPTS = {
  range: 12,
  duration: 1.8,
  cooldownMin: 3,
  cooldownRange: 4,
  onTalkStart: sfxKola,
};

function updateStickEnemies(dt) {
  for (let i = stickEnemies.length - 1; i >= 0; i--) {
    const e = stickEnemies[i];
    const d = e.userData;
    if (handleDeathTimer(e, d, dt, stickEnemies, i)) continue;

    doPatrol(e, d, dt);

    const offscreen = isOffscreenEnemy(e);
    if (!offscreen) {
      d.walkTimer += dt * 4;
      e.rotation.z = Math.sin(d.walkTimer) * 0.06;
      updateTalkBubble(d, Math.abs(e.position.x - player.position.x), dt, STICK_TALK_OPTS);
    }

    const curH = d.hp === 1 ? STICK_H * 0.65 : STICK_H;
    const ov = playerOverlap(e.position.x, e.position.y, STICK_W, curH);
    if (ov) {
      if (isStomp(ov, curH, 0.25)) {
        d.hp--;
        if (d.hp <= 0) {
          squishDeath(e, d, 0.5, 0.2, -STICK_H * 0.3);
          sfxStomp();
          onEnemyKilled(e.position.x, e.position.y + STICK_H * 0.5);
          addScore(50);
        } else {
          e.scale.y = 0.65;
          e.scale.x = 1.15;
          sfxHit();
          addScore(10);
        }
        velocityY = JUMP_FORCE * 0.7;
      } else if (invincibleTimer <= 0) {
        hitPlayer();
      }
    }
  }
}

// ─── Strawberry enemy (1 stomp, shouts GAW) ───
function createStrawberryEnemy(x, y) {
  const g = new THREE.Group();

  // Body (three boxes, narrowing toward the bottom)
  const bodyMat = sharedMat(0xdd2233);
  const bodyTop = new THREE.Mesh(sharedBox(STRAW_W, STRAW_H * 0.45, 0.5), bodyMat);
  bodyTop.position.y = STRAW_H * 0.55; g.add(bodyTop);
  const bodyMid = new THREE.Mesh(sharedBox(STRAW_W * 0.85, STRAW_H * 0.3, 0.45), bodyMat);
  bodyMid.position.y = STRAW_H * 0.32; g.add(bodyMid);
  const bodyBot = new THREE.Mesh(sharedBox(STRAW_W * 0.6, STRAW_H * 0.2, 0.4), bodyMat);
  bodyBot.position.y = STRAW_H * 0.15; g.add(bodyBot);

  // Seed spots
  for (const [sx, sy] of [
    [-0.25, STRAW_H*0.6], [0.2, STRAW_H*0.65], [-0.1, STRAW_H*0.45],
    [0.3, STRAW_H*0.48], [-0.3, STRAW_H*0.35], [0.1, STRAW_H*0.3],
    [-0.15, STRAW_H*0.55], [0.25, STRAW_H*0.38],
  ]) {
    const seed = box(0.1, 0.12, 0.06, 0xffaa22);
    seed.position.set(sx, sy, 0.26);
    g.add(seed);
  }

  // Leaf stem, branches and tips (cap is also leaf-green)
  const leafColor = 0x228844;
  const stem = box(0.12, 0.3, 0.12, leafColor);
  stem.position.set(0, STRAW_H * 0.82, 0); g.add(stem);

  const branchL = box(0.08, 0.25, 0.08, leafColor);
  branchL.position.set(-0.15, STRAW_H * 0.9, 0);
  branchL.rotation.z = 0.5; g.add(branchL);
  const branchR = box(0.08, 0.25, 0.08, leafColor);
  branchR.position.set(0.15, STRAW_H * 0.9, 0);
  branchR.rotation.z = -0.5; g.add(branchR);

  const tipL = box(0.06, 0.15, 0.06, leafColor);
  tipL.position.set(-0.28, STRAW_H * 0.95, 0);
  tipL.rotation.z = 0.8; g.add(tipL);
  const tipR = box(0.06, 0.15, 0.06, leafColor);
  tipR.position.set(0.28, STRAW_H * 0.95, 0);
  tipR.rotation.z = -0.8; g.add(tipR);
  const tipM = box(0.06, 0.15, 0.06, leafColor);
  tipM.position.set(0, STRAW_H * 0.97, 0); g.add(tipM);

  const cap = box(STRAW_W * 0.7, 0.12, 0.35, leafColor);
  cap.position.set(0, STRAW_H * 0.76, 0); g.add(cap);

  // Face
  const eyeL = box(0.16, 0.18, 0.08, 0x111111);
  eyeL.position.set(-0.18, STRAW_H * 0.55, 0.28); g.add(eyeL);
  const eyeR = box(0.16, 0.18, 0.08, 0x111111);
  eyeR.position.set(0.18, STRAW_H * 0.55, 0.28); g.add(eyeR);
  const mouth = box(0.2, 0.12, 0.06, 0x991122);
  mouth.position.set(0, STRAW_H * 0.42, 0.28); g.add(mouth);

  // Arms, fingers, legs, feet
  const armL = box(0.35, 0.08, 0.1, 0xdd2233);
  armL.position.set(-0.7, STRAW_H * 0.4, 0);
  armL.rotation.z = -0.3; g.add(armL);
  const armR = box(0.35, 0.08, 0.1, 0xdd2233);
  armR.position.set(0.7, STRAW_H * 0.4, 0);
  armR.rotation.z = 0.3; g.add(armR);

  for (const [fx, fy, rz] of [[-0.88, STRAW_H*0.43, 0.3], [-0.9, STRAW_H*0.4, 0], [-0.88, STRAW_H*0.37, -0.3]]) {
    const f = box(0.15, 0.04, 0.04, 0xcc1122);
    f.position.set(fx, fy, 0);
    f.rotation.z = rz;
    g.add(f);
  }
  for (const [fx, fy, rz] of [[0.88, STRAW_H*0.43, -0.3], [0.9, STRAW_H*0.4, 0], [0.88, STRAW_H*0.37, 0.3]]) {
    const f = box(0.15, 0.04, 0.04, 0xcc1122);
    f.position.set(fx, fy, 0);
    f.rotation.z = rz;
    g.add(f);
  }

  const legL = box(0.12, 0.25, 0.14, 0xdd2233);
  legL.position.set(-0.18, 0.05, 0); g.add(legL);
  const legR = box(0.12, 0.25, 0.14, 0xdd2233);
  legR.position.set(0.18, 0.05, 0); g.add(legR);

  const ftL = box(0.16, 0.08, 0.18, 0xcc1122);
  ftL.position.set(-0.18, -0.02, 0.04); g.add(ftL);
  const ftR = box(0.16, 0.08, 0.18, 0xcc1122);
  ftR.position.set(0.18, -0.02, 0.04); g.add(ftR);

  const bubble = makeSpeechBubble('GAW GAW GAW GAW GAW', '#cc2222', 16);
  bubble.position.set(0, STRAW_H + 0.5, 0.3);
  g.add(bubble);

  g.position.set(x, y, 0);
  g.userData = {
    alive: true,
    vx: (Math.random() > 0.5 ? 1 : -1) * STRAW_SPEED,
    patrolLeft: x - 7 - Math.random() * 4,
    patrolRight: x + 7 + Math.random() * 4,
    squishTimer: 0,
    walkTimer: 0,
    isStrawberry: true,
    bubble,
    talkTimer: 2 + Math.random() * 4,
    talkDuration: 0,
  };
  scene.add(g);
  strawEnemies.push(g);
  return g;
}

const STRAW_TALK_OPTS = {
  range: 12,
  duration: 1.5,
  cooldownMin: 3,
  cooldownRange: 3,
  onTalkStart: sfxGaw,
};

function updateStrawberryEnemies(dt) {
  for (let i = strawEnemies.length - 1; i >= 0; i--) {
    const e = strawEnemies[i];
    const d = e.userData;
    if (handleDeathTimer(e, d, dt, strawEnemies, i)) continue;

    doPatrol(e, d, dt);

    const offscreen = isOffscreenEnemy(e);
    if (!offscreen) {
      d.walkTimer += dt * 6;
      e.rotation.z = Math.sin(d.walkTimer) * 0.1;
      updateTalkBubble(d, Math.abs(e.position.x - player.position.x), dt, STRAW_TALK_OPTS);
    }

    const ov = playerOverlap(e.position.x, e.position.y, STRAW_W, STRAW_H);
    if (ov) {
      if (isStomp(ov, STRAW_H, 0.35)) {
        squishDeath(e, d, 0.4, 0.25, -STRAW_H * 0.2);
        sfxStomp();
        onEnemyKilled(e.position.x, e.position.y + STRAW_H * 0.5);
        addScore(30);
        velocityY = JUMP_FORCE * 0.7;
      } else if (invincibleTimer <= 0) {
        hitPlayer();
      }
    }
  }
}
