// ═══════════════════════════════════════════════════════════════════════
// 17-main: bootstrap (init + loaders) and the requestAnimationFrame loop
// ═══════════════════════════════════════════════════════════════════════

function init() {
  initUI();
  createBackground();
  generateStaticLevel();

  // Kick off character sprite loads in parallel
  for (const key of Object.keys(characterData)) {
    loadCharacter(key);
    drawPreview(key);
  }

  bindInput();
  bindResize();

  // Prime the player to start on the idle frame of the default character
  // (loadCharacter sets this once images resolve, so we just set visibility).
  player.visible = true;

  animate();
}

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.getElapsedTime();

  if (gameState === 'playing') {
    updatePhysics(dt);
    updateAnimation(dt);
    updateCamera(dt);
  }

  animateCoins(time);
  updateShieldVisual(time);
  updateConfetti(dt);
  updateEnemyParticles(dt);
  renderer.render(scene, camera);
}

init();
