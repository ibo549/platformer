// ═══════════════════════════════════════════════════════════════════════
// 10-ptero: pterodactyl (flying, 2 stomps, shoots flames) + flame projectiles
// ═══════════════════════════════════════════════════════════════════════

const PTERO_W = 2.2;
const PTERO_H = 1.4;
const PTERO_SPEED = 3.0;
const FLAME_SPEED = 7.0;
const FLAME_INTERVAL = 3.0;

const pteroEnemies = [];
const flames = [];

function createPteroEnemy(x, y) {
  const g = new THREE.Group();

  // Body, belly, head, beak, crest
  const body = box(PTERO_W * 0.5, PTERO_H * 0.35, 0.4, 0x6b2fa0);
  body.position.y = PTERO_H * 0.4; g.add(body);
  const belly = box(PTERO_W * 0.4, PTERO_H * 0.15, 0.42, 0x9b6fc0);
  belly.position.y = PTERO_H * 0.3; g.add(belly);
  const head = box(0.35, 0.3, 0.3, 0x7b3fb0);
  head.position.set(PTERO_W * 0.32, PTERO_H * 0.55, 0); g.add(head);

  const beak = box(0.4, 0.1, 0.12, 0xf5a623);
  beak.position.set(PTERO_W * 0.52, PTERO_H * 0.5, 0); g.add(beak);
  const lBeak = box(0.3, 0.06, 0.1, 0xf5a623);
  lBeak.position.set(PTERO_W * 0.48, PTERO_H * 0.44, 0); g.add(lBeak);

  const crest = box(0.12, 0.25, 0.08, 0xe8412e);
  crest.position.set(PTERO_W * 0.25, PTERO_H * 0.75, 0);
  crest.rotation.z = -0.3; g.add(crest);
  const crest2 = box(0.09, 0.18, 0.06, 0xff6633);
  crest2.position.set(PTERO_W * 0.18, PTERO_H * 0.7, 0);
  crest2.rotation.z = -0.2; g.add(crest2);

  // Eyes
  const eyeR = box(0.1, 0.09, 0.08, 0xffdd00);
  eyeR.position.set(PTERO_W * 0.36, PTERO_H * 0.6, 0.16); g.add(eyeR);
  const eyeL = box(0.1, 0.09, 0.08, 0xffdd00);
  eyeL.position.set(PTERO_W * 0.36, PTERO_H * 0.6, -0.16); g.add(eyeL);
  const pupilR = box(0.04, 0.06, 0.02, 0x220000);
  pupilR.position.set(PTERO_W * 0.38, PTERO_H * 0.6, 0.2); g.add(pupilR);
  const pupilL = box(0.04, 0.06, 0.02, 0x220000);
  pupilL.position.set(PTERO_W * 0.38, PTERO_H * 0.6, -0.2); g.add(pupilL);

  // Wings — each wing has its own pivot group so it can flap; sharing geometry
  // is fine but the meshes themselves still have to be unique (rotation).
  const wingGeo = sharedBox(PTERO_W * 0.55, 0.06, 0.7);
  const wingMat = sharedMat(0x4a1a7a);
  const boneGeo = sharedBox(PTERO_W * 0.5, 0.04, 0.04);
  const boneMat = sharedMat(0x8b5fc0);

  const wingL = new THREE.Mesh(wingGeo, wingMat);
  const boneL = new THREE.Mesh(boneGeo, boneMat);
  const wingPivotL = new THREE.Group();
  wingPivotL.position.set(0, PTERO_H * 0.45, 0.2);
  wingL.position.set(-PTERO_W * 0.15, 0.05, 0.15);
  boneL.position.set(-PTERO_W * 0.15, 0.07, 0.0);
  wingPivotL.add(wingL); wingPivotL.add(boneL);
  g.add(wingPivotL);

  const wingR = new THREE.Mesh(wingGeo, wingMat);
  const boneR = new THREE.Mesh(boneGeo, boneMat);
  const wingPivotR = new THREE.Group();
  wingPivotR.position.set(0, PTERO_H * 0.45, -0.2);
  wingR.position.set(-PTERO_W * 0.15, 0.05, -0.15);
  boneR.position.set(-PTERO_W * 0.15, 0.07, 0.0);
  wingPivotR.add(wingR); wingPivotR.add(boneR);
  g.add(wingPivotR);

  // Tail
  const tail = box(0.5, 0.06, 0.1, 0x6b2fa0);
  tail.position.set(-PTERO_W * 0.45, PTERO_H * 0.38, 0); g.add(tail);
  const tailTip = box(0.25, 0.12, 0.16, 0xe8412e);
  tailTip.position.set(-PTERO_W * 0.6, PTERO_H * 0.36, 0);
  tailTip.rotation.z = Math.PI / 4; g.add(tailTip);

  // Feet
  const footL = box(0.08, 0.2, 0.08, 0x5a3580);
  footL.position.set(0.1, PTERO_H * 0.15, 0.12); g.add(footL);
  const footR = box(0.08, 0.2, 0.08, 0x5a3580);
  footR.position.set(0.1, PTERO_H * 0.15, -0.12); g.add(footR);

  // Dazed stars (hidden until first hit)
  const starsGroup = new THREE.Group();
  starsGroup.visible = false;
  const starMat = sharedMat(0xffdd00);
  const starCenterGeo = sharedBox(0.1, 0.1, 0.04);
  const starPointGeo = sharedBox(0.06, 0.06, 0.03);
  for (let s = 0; s < 3; s++) {
    const star = new THREE.Group();
    star.add(new THREE.Mesh(starCenterGeo, starMat));
    for (let p = 0; p < 4; p++) {
      const pt = new THREE.Mesh(starPointGeo, starMat);
      const angle = (p / 4) * Math.PI * 2;
      pt.position.set(Math.cos(angle) * 0.08, Math.sin(angle) * 0.08, 0);
      pt.rotation.z = angle;
      star.add(pt);
    }
    star.userData.orbitAngle = (s / 3) * Math.PI * 2;
    starsGroup.add(star);
  }
  starsGroup.position.set(PTERO_W * 0.25, PTERO_H * 0.85, 0);
  g.add(starsGroup);

  const bubble = makeSpeechBubble('SKREEEE!', '#cc4400', 16);
  bubble.position.set(0, PTERO_H + 0.5, 0.3);
  g.add(bubble);

  g.position.set(x, y, 0);
  g.userData = {
    alive: true,
    hp: 2,
    deformed: false,
    vx: (Math.random() > 0.5 ? 1 : -1) * PTERO_SPEED,
    patrolLeft: x - 6 - Math.random() * 3,
    patrolRight: x + 6 + Math.random() * 3,
    flyY: y,
    walkTimer: Math.random() * 6,
    flapTimer: Math.random() * 6,
    flameTimer: 1 + Math.random() * 2,
    squishTimer: 0,
    isPtero: true,
    wingPivotL, wingPivotR,
    starsGroup,
    starTimer: 0,
    bubble,
    talkTimer: 2 + Math.random() * 5,
    talkDuration: 0,
  };
  scene.add(g);
  pteroEnemies.push(g);
  return g;
}

function createFlame(x, y, directionX) {
  const g = new THREE.Group();
  // Projectiles are short-lived; shared materials + geometries are safe here
  // because these meshes don't get per-instance opacity animation.
  const glow = box(0.7, 0.5, 0.5, 0xffff88, { transparent: true, opacity: 0.35 });
  g.add(glow);
  const core = box(0.4, 0.25, 0.25, 0xffee66);
  g.add(core);
  const inner = box(0.25, 0.18, 0.18, 0xff8800);
  inner.position.x = directionX > 0 ? -0.1 : 0.1;
  g.add(inner);
  const outer = box(0.3, 0.22, 0.22, 0xdd2200);
  outer.position.x = directionX > 0 ? 0.15 : -0.15;
  g.add(outer);
  const tip = box(0.15, 0.12, 0.12, 0xffffff);
  tip.position.x = directionX > 0 ? 0.28 : -0.28;
  g.add(tip);

  g.position.set(x, y, 0);
  g.userData = {
    vx: directionX * FLAME_SPEED,
    lifetime: 6.0,
    flickerTimer: 0,
  };
  scene.add(g);
  flames.push(g);
  return g;
}

const PTERO_TALK_OPTS = {
  range: 15,
  duration: 1.5,
  cooldownMin: 3,
  cooldownRange: 4,
};

function updatePteroEnemies(dt) {
  for (let i = pteroEnemies.length - 1; i >= 0; i--) {
    const e = pteroEnemies[i];
    const d = e.userData;
    if (handleDeathTimer(e, d, dt, pteroEnemies, i)) continue;

    doPatrol(e, d, dt);
    e.scale.x = d.vx > 0 ? 1 : -1;

    const offscreen = isOffscreenEnemy(e);
    d.walkTimer += dt * 2;
    e.position.y = d.flyY + Math.sin(d.walkTimer) * 1.5;

    if (!offscreen) {
      d.flapTimer += dt * 8;
      const flapAngle = Math.sin(d.flapTimer) * 0.5;
      d.wingPivotL.rotation.x = flapAngle;
      d.wingPivotR.rotation.x = -flapAngle;

      if (d.deformed && d.starsGroup) {
        d.starsGroup.visible = true;
        d.starTimer += dt * 3;
        const stars = d.starsGroup.children;
        for (let s = 0; s < stars.length; s++) {
          const angle = d.starTimer + stars[s].userData.orbitAngle;
          stars[s].position.set(Math.cos(angle) * 0.5, Math.sin(angle) * 0.25 + 0.15, Math.sin(angle) * 0.3);
          stars[s].rotation.z += dt * 4;
        }
      }

      updateTalkBubble(d, Math.abs(e.position.x - player.position.x), dt, PTERO_TALK_OPTS);
    }

    // Flame firing
    d.flameTimer -= dt;
    const distToPlayer = Math.abs(e.position.x - player.position.x);
    if (d.flameTimer <= 0 && distToPlayer < 15) {
      const dirX = player.position.x > e.position.x ? 1 : -1;
      createFlame(e.position.x + dirX * PTERO_W * 0.4, e.position.y + PTERO_H * 0.3, dirX);
      d.flameTimer = FLAME_INTERVAL;
      sfxPteroScreech();
      if (d.talkDuration <= 0) {
        d.talkDuration = 1.0;
        d.bubble.material.opacity = 1;
      }
    }

    const curH = d.deformed ? PTERO_H * 0.6 : PTERO_H;
    const ov = playerOverlap(e.position.x, e.position.y, PTERO_W, curH);
    if (ov) {
      if (isStomp(ov, curH, 0.35)) {
        d.hp--;
        if (d.hp <= 0) {
          squishDeath(e, d, 0.5, 0.2);
          sfxStomp();
          onEnemyKilled(e.position.x, e.position.y + PTERO_H * 0.5);
          addScore(40);
        } else {
          d.deformed = true;
          e.scale.y = 0.6;
          d.wingPivotL.rotation.z = -0.5;
          d.flyY -= 1;
          const sign = d.vx > 0 ? 1 : -1;
          d.vx = sign * PTERO_SPEED * 0.7;
          sfxPteroDazed();
          addScore(10);
        }
        velocityY = JUMP_FORCE * 0.7;
      } else if (invincibleTimer <= 0) {
        hitPlayer();
      }
    }
  }
}

function updateFlames(dt) {
  for (let i = flames.length - 1; i >= 0; i--) {
    const f = flames[i];
    const d = f.userData;

    f.position.x += d.vx * dt;
    d.lifetime -= dt;

    d.flickerTimer += dt * 12;
    const flicker = Math.sin(d.flickerTimer) * 0.15;
    f.scale.set(1 + flicker, 1 - flicker, 1 + flicker * 0.5);
    f.rotation.z = Math.sin(d.flickerTimer * 1.3) * 0.2;

    if (d.lifetime <= 0 || Math.abs(f.position.x - player.position.x) > 25) {
      scene.remove(f);
      flames.splice(i, 1);
      continue;
    }

    const fLeft = f.position.x - 0.2;
    const fRight = f.position.x + 0.2;
    const fBottom = f.position.y - 0.12;
    const fTop = f.position.y + 0.12;
    const pLeft = player.position.x - playerW * 0.3;
    const pRight = player.position.x + playerW * 0.3;
    const pBottom = player.position.y - playerH / 2;
    const pTop = player.position.y + playerH / 2;
    if (pRight > fLeft && pLeft < fRight && pTop > fBottom && pBottom < fTop) {
      if (invincibleTimer <= 0) hitPlayer();
      scene.remove(f);
      flames.splice(i, 1);
    }
  }
}
