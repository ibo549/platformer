// ═══════════════════════════════════════════════════════════════════════
// 13-level: level generation, split into static (once) and dynamic (per play)
// ═══════════════════════════════════════════════════════════════════════
//
// generateStaticLevel — runs once at bootstrap. Platforms + yellow coins + hazards.
// spawnDynamicEntities — runs on every Play click. Clears prior enemies/eggs/red
// coins/puddles/companions and spawns fresh ones based on gameDifficulty.

function generateStaticLevel() {
  let px = 6;
  for (let i = 0; i < 60; i++) {
    const pw = 2 + Math.random() * 4;
    const py = GROUND_Y + 1.5 + Math.random() * 6;
    const gap = 3 + Math.random() * 3;

    const plat = createPlatformMesh(pw, 0.5);
    plat.position.set(px + pw / 2, py, 0);
    scene.add(plat);
    platforms.push({
      mesh: plat,
      x: px + pw / 2,
      y: py + 0.25,
      w: pw,
      h: 0.5,
    });

    const coinCount = Math.floor(Math.random() * 3) + 1;
    for (let c = 0; c < coinCount; c++) {
      createCoin(px + pw * (c + 1) / (coinCount + 1), py + 1 + Math.random() * 0.5);
    }
    if (Math.random() > 0.5) createCoin(px + Math.random() * 3, GROUND_Y + 1);
    if (Math.random() > 0.7 && i > 3) createHazard(px + pw / 2, GROUND_Y, pw * 0.5);

    px += pw + gap;
  }

  // Arc-shaped coin clusters
  for (let a = 0; a < 15; a++) {
    const arcX = 15 + a * 20 + Math.random() * 10;
    const arcY = GROUND_Y + 2 + Math.random() * 3;
    for (let c = 0; c < 5; c++) {
      const angle = (c / 4) * Math.PI;
      createCoin(arcX + c * 1.2, arcY + Math.sin(angle) * 1.5);
    }
  }
}

function clearArrayAndScene(arr) {
  for (const m of arr) scene.remove(m);
  arr.length = 0;
}

function spawnDynamicEntities() {
  clearArrayAndScene(enemies);
  clearArrayAndScene(stickEnemies);
  clearArrayAndScene(strawEnemies);
  clearArrayAndScene(pteroEnemies);
  clearArrayAndScene(flames);
  clearArrayAndScene(waterPuddles);
  clearArrayAndScene(eggs);
  clearArrayAndScene(companions);
  clearArrayAndScene(redCoins);

  // Yellow coins persist — just reset collected state
  for (const coin of coins) {
    coin.userData.collected = false;
    coin.visible = true;
  }

  // Brown enemies — always present
  for (let i = 0; i < 5; i++) {
    createBrownEnemy(8 + i * 12 + Math.random() * 6, GROUND_Y);
  }
  for (let i = 0; i < 40; i++) {
    const ex = 12 + i * 8 + Math.random() * 4;
    if (Math.random() > 0.45) createBrownEnemy(ex, GROUND_Y);
  }

  // Stick + strawberry on normal + hard
  if (gameDifficulty !== 'easy') {
    for (let i = 0; i < 8; i++) {
      createStickEnemy(25 + i * 35 + Math.random() * 15, GROUND_Y);
    }
    for (let i = 0; i < 6; i++) {
      createStrawberryEnemy(18 + i * 45 + Math.random() * 20, GROUND_Y);
    }
  }

  // Pterodactyls on hard only
  if (gameDifficulty === 'hard') {
    for (let i = 0; i < 5; i++) {
      createPteroEnemy(30 + i * 50 + Math.random() * 20, GROUND_Y + 3 + Math.random() * 3);
    }
  }

  // Water puddles
  for (let i = 0; i < 8; i++) {
    createWaterPuddle(15 + i * 40 + Math.random() * 25, GROUND_Y);
  }

  // Eggs — nudge away from spike hazards
  for (let i = 0; i < 8; i++) {
    let ex = 20 + i * 40 + Math.random() * 20;
    for (const h of hazards) {
      if (Math.abs(ex - h.position.x) < 2) ex += 3;
    }
    createEgg(ex, GROUND_Y);
  }

  // Red shield coins (colored per character)
  for (let i = 0; i < 6; i++) {
    createRedCoin(30 + i * 55 + Math.random() * 20, GROUND_Y + 1.5 + Math.random() * 3);
  }
}
