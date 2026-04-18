// ═══════════════════════════════════════════════════════════════════════
// 12-eggs: collectible eggs + companions (hatched friends that follow player)
// ═══════════════════════════════════════════════════════════════════════

const eggs = [];
const companions = [];

function createEgg(x, y) {
  const g = new THREE.Group();

  const eggBody = box(0.7, 0.9, 0.5, 0xfff8ee);
  eggBody.position.y = 0.45; g.add(eggBody);
  const top = box(0.5, 0.3, 0.4, 0xfff8ee);
  top.position.y = 0.85; g.add(top);

  for (const [dx, dy] of [[-0.15, 0.5], [0.12, 0.35], [0.0, 0.65], [-0.2, 0.3]]) {
    const spot = box(0.12, 0.12, 0.05, 0xff88aa);
    spot.position.set(dx, dy, 0.26);
    g.add(spot);
  }

  const crack = box(0.3, 0.04, 0.02, 0xddccbb);
  crack.position.set(0, 0.55, 0.27);
  crack.rotation.z = 0.2;
  g.add(crack);

  g.position.set(x, y, 0.05);
  g.userData = { cracked: false, wobbleTimer: 0 };

  scene.add(g);
  eggs.push(g);
  return g;
}

function crackEgg(egg) {
  egg.userData.cracked = true;
  egg.visible = false;
  sfxEggCrack();
  spawnEggShellBurst(egg.position.x, egg.position.y);

  const companion = createCompanionMesh();
  companion.position.set(egg.position.x, egg.position.y, 0);
  const followDelay = (companions.length + 1) * COMPANION_TRAIL_LEN;
  companion.userData = { followDelay, walkTimer: 0, facingRight: true };
  scene.add(companion);
  companions.push(companion);
  ui.companionCount.textContent = companions.length + '/8';

  if (companions.length >= 8) {
    setTimeout(() => winGame(), 500);
  }
}

function updateEggs(dt) {
  for (const egg of eggs) {
    if (egg.userData.cracked) continue;

    egg.userData.wobbleTimer += dt;
    egg.rotation.z = Math.sin(egg.userData.wobbleTimer * 2.5) * 0.08;

    const eLeft = egg.position.x - 0.4;
    const eRight = egg.position.x + 0.4;
    const eBottom = egg.position.y;
    const eTop = egg.position.y + 1.0;
    const pLeft = player.position.x - playerW * 0.35;
    const pRight = player.position.x + playerW * 0.35;
    const pBottom = player.position.y - playerH / 2;
    const pTop = player.position.y + playerH / 2;

    if (pRight > eLeft && pLeft < eRight && pTop > eBottom && pBottom < eTop) {
      crackEgg(egg);
    }
  }
}

function updateCompanions(dt) {
  for (const m of companions) {
    const delay = m.userData.followDelay;
    const idx = Math.max(0, playerTrail.length - delay);
    if (playerTrail.length === 0) continue;

    const target = playerTrail[idx] || playerTrail[0];
    m.position.x += (target.x - m.position.x) * 6 * dt;
    m.position.y += (target.y - m.position.y) * 6 * dt;

    if (target.x > m.position.x + 0.05) m.userData.facingRight = true;
    if (target.x < m.position.x - 0.05) m.userData.facingRight = false;
    m.scale.x = m.userData.facingRight ? 0.9 : -0.9;

    const speed = Math.abs(target.x - m.position.x);
    if (speed > 0.1) {
      m.userData.walkTimer += dt * 10;
      m.rotation.z = Math.sin(m.userData.walkTimer) * 0.08;
    } else {
      m.rotation.z = 0;
    }
  }
}
