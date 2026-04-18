// ═══════════════════════════════════════════════════════════════════════
// 14-physics: per-frame physics, collisions, and camera follow
// ═══════════════════════════════════════════════════════════════════════

function updatePhysics(dt) {
  // Horizontal movement
  let targetVX = 0;
  if (keys.left) targetVX -= MOVE_SPEED;
  if (keys.right) targetVX += MOVE_SPEED;
  velocityX += (targetVX - velocityX) * 10 * dt;

  // Jump (double-jump)
  if (keys.jump && !jumpPressed && jumpsLeft > 0) {
    if (jumpsLeft === 2) sfxJump(); else sfxDoubleJump();
    velocityY = JUMP_FORCE;
    jumpsLeft--;
    jumpPressed = true;
    isGrounded = false;
  }
  if (!keys.jump) jumpPressed = false;

  // Gravity + apply velocity
  velocityY += GRAVITY * dt;
  player.position.x += velocityX * dt;
  player.position.y += velocityY * dt;

  // Platform collisions (AABB sweep onto the top surface)
  isGrounded = false;
  playerOnPlatform = null;
  for (const p of platforms) {
    const halfW = p.w / 2;
    const pLeft = p.x - halfW;
    const pRight = p.x + halfW;
    const pTop = p.y;
    const playerBottom = player.position.y - playerH / 2;
    const prevBottom = playerBottom - velocityY * dt;

    if (
      player.position.x + playerW * 0.3 > pLeft &&
      player.position.x - playerW * 0.3 < pRight &&
      playerBottom <= pTop &&
      prevBottom >= pTop - 0.5 &&
      velocityY <= 0
    ) {
      player.position.y = pTop + playerH / 2;
      velocityY = 0;
      isGrounded = true;
      jumpsLeft = 2;
      playerOnPlatform = p;
    }
  }

  // Fell off the world
  if (player.position.y < -15) gameOver();

  // Yellow coin pickup
  for (const coin of coins) {
    if (coin.userData.collected) continue;
    const dx = player.position.x - coin.position.x;
    const dy = player.position.y - coin.position.y;
    if (dx * dx + dy * dy < 1.44) { // 1.2^2
      coin.userData.collected = true;
      coin.visible = false;
      sfxCoin();
      addScore(10);
    }
  }

  // Red shield coin pickup
  for (const rc of redCoins) {
    if (rc.userData.collected) continue;
    const dx = player.position.x - rc.position.x;
    const dy = player.position.y - rc.position.y;
    if (dx * dx + dy * dy < 1.96) { // 1.4^2
      rc.userData.collected = true;
      rc.visible = false;
      activateShield();
    }
  }

  // Spike hazards
  for (const h of hazards) {
    const dx = player.position.x - h.position.x;
    const dy = (player.position.y - playerH / 2) - h.position.y;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) hitPlayer();
  }

  // Entities
  updateBrownEnemies(dt);
  updateStickEnemies(dt);
  updateStrawberryEnemies(dt);
  updatePteroEnemies(dt);
  updateFlames(dt);
  updateWaterPuddles(dt);
  updateEggs(dt);
  updatePlayerTrail();
  updateCompanions(dt);
  updateInvincibility(dt);

  distance = Math.max(distance, Math.floor(player.position.x));
  ui.distance.textContent = distance + 'm';
}

function updateCamera(dt) {
  const targetX = player.position.x + 3;
  const targetY = Math.max(player.position.y + 1, 2);
  camera.position.x += (targetX - camera.position.x) * 3 * dt;
  camera.position.y += (targetY - camera.position.y) * 2 * dt;
  camera.lookAt(camera.position.x, camera.position.y, 0);
}
