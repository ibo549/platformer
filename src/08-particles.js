// ═══════════════════════════════════════════════════════════════════════
// 08-particles: confetti + enemy-death burst + egg-shell burst
// ═══════════════════════════════════════════════════════════════════════
//
// Particles mutate material opacity per frame, so they each get their own
// material (NOT the shared pool). Geometries can still share from the pool.

// Confetti — thrown at win and at coin milestones.
const confettiParticles = [];
const confettiColors = [0xff4444, 0xffe066, 0x4ecdc4, 0xff6b6b, 0x52b788, 0xaa66ff, 0xff8844, 0x66bbff];

function spawnConfetti() {
  const px = player.position.x;
  const py = player.position.y;
  for (let i = 0; i < 60; i++) {
    const size = 0.15 + Math.random() * 0.2;
    const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    const p = new THREE.Mesh(
      sharedBox(size, size, size * 0.3),
      new THREE.MeshBasicMaterial({ color })
    );
    p.position.set(
      px + (Math.random() - 0.5) * 2,
      py + Math.random() * 2,
      0.5 + Math.random() * 0.5
    );
    p.userData = {
      vx: (Math.random() - 0.5) * 12,
      vy: 8 + Math.random() * 12,
      vr: (Math.random() - 0.5) * 15,
      life: 2.0 + Math.random() * 1.0,
      age: 0,
    };
    scene.add(p);
    confettiParticles.push(p);
  }
}

function updateConfetti(dt) {
  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    const p = confettiParticles[i];
    p.userData.age += dt;
    if (p.userData.age >= p.userData.life) {
      scene.remove(p);
      p.material.dispose();
      confettiParticles.splice(i, 1);
      continue;
    }
    p.userData.vy -= 18 * dt;
    p.position.x += p.userData.vx * dt;
    p.position.y += p.userData.vy * dt;
    p.rotation.x += p.userData.vr * dt;
    p.rotation.z += p.userData.vr * 0.7 * dt;
    const fadeStart = p.userData.life * 0.7;
    if (p.userData.age > fadeStart) {
      p.material.opacity = 1.0 - (p.userData.age - fadeStart) / (p.userData.life - fadeStart);
      p.material.transparent = true;
    }
  }
}

// Enemy death burst — earthy/reddish chunks.
const enemyParticles = [];
const BURST_COLORS = [0x8B4513, 0xA0522D, 0x654321, 0xD2691E, 0xff4444, 0xffe066];

function spawnEnemyBurst(x, y) {
  for (let i = 0; i < 18; i++) {
    const size = 0.1 + Math.random() * 0.15;
    const color = BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)];
    const p = new THREE.Mesh(
      sharedBox(size, size, size),
      new THREE.MeshBasicMaterial({ color, transparent: true })
    );
    const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 3 + Math.random() * 5;
    p.position.set(x, y, 0.3);
    p.userData = {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 4,
      vr: (Math.random() - 0.5) * 20,
      life: 0.6 + Math.random() * 0.4,
      age: 0,
    };
    scene.add(p);
    enemyParticles.push(p);
  }
}

function updateEnemyParticles(dt) {
  for (let i = enemyParticles.length - 1; i >= 0; i--) {
    const p = enemyParticles[i];
    p.userData.age += dt;
    if (p.userData.age >= p.userData.life) {
      scene.remove(p);
      p.material.dispose();
      enemyParticles.splice(i, 1);
      continue;
    }
    p.userData.vy -= 20 * dt;
    p.position.x += p.userData.vx * dt;
    p.position.y += p.userData.vy * dt;
    p.rotation.x += p.userData.vr * dt;
    p.rotation.z += p.userData.vr * 0.6 * dt;
    const t = p.userData.age / p.userData.life;
    p.material.opacity = 1.0 - t * t;
    p.scale.setScalar(1.0 - t * 0.5);
  }
}

// Egg shell burst — reuses the enemy-particle updater.
const SHELL_COLORS = [0xfff8ee, 0xffeecc, 0xff88aa, 0xffffff];
function spawnEggShellBurst(x, y) {
  for (let i = 0; i < 12; i++) {
    const size = 0.08 + Math.random() * 0.12;
    const color = SHELL_COLORS[Math.floor(Math.random() * SHELL_COLORS.length)];
    const p = new THREE.Mesh(
      sharedBox(size, size * 1.3, size * 0.5),
      new THREE.MeshBasicMaterial({ color, transparent: true })
    );
    const angle = (i / 12) * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    p.position.set(x, y + 0.4, 0.3);
    p.userData = {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 3,
      vr: (Math.random() - 0.5) * 15,
      life: 0.5 + Math.random() * 0.3,
      age: 0,
    };
    scene.add(p);
    enemyParticles.push(p);
  }
}
