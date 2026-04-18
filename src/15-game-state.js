// ═══════════════════════════════════════════════════════════════════════
// 15-game-state: start / restart / game-over / win transitions
// ═══════════════════════════════════════════════════════════════════════

function startGame() {
  ui.startScreen.style.opacity = '0';
  setTimeout(() => { ui.startScreen.style.display = 'none'; }, 500);
  ui.gameOverScreen.style.display = 'none';
  ui.winScreen.style.display = 'none';

  ensureAudio();
  sfxStart();

  gameState = 'playing';
  setScore(0);
  lastMilestone = 0;
  killCount = 0;
  distance = 0;
  updateKillDisplay();
  velocityX = 0;
  velocityY = 0;
  lives = 2;
  invincibleTimer = 0;
  player.visible = true;
  updateLivesDisplay();
  player.position.set(0, GROUND_Y + playerH / 2, 0);
  camera.position.set(0, 2, 10);
  ui.distance.textContent = '0m';
  ui.companionCount.textContent = '0/8';
  playerTrail.length = 0;

  // Reset shield state + rebuild hearts in the chosen character's color
  hasShield = false;
  shieldGroup.visible = false;
  buildShieldHearts();
  ui.shieldDisplay.style.display = 'none';

  spawnDynamicEntities();

  setTimeout(() => { ui.controlsHint.style.opacity = '0'; }, 4000);
}

function returnToMenu() {
  ui.gameOverScreen.style.display = 'none';
  ui.winScreen.style.display = 'none';
  gameState = 'menu';
  ui.startScreen.style.display = 'flex';
  ui.startScreen.style.opacity = '1';
}

function gameOver() {
  if (gameState !== 'playing') return;
  gameState = 'over';
  sfxDeath();
  ui.gameOverScreen.style.display = 'flex';
  ui.finalScore.textContent = `SCORE: ${score}  DIST: ${distance}m`;
}

function winGame() {
  if (gameState !== 'playing') return;
  gameState = 'win';
  sfxCelebration();
  for (let i = 0; i < 3; i++) {
    setTimeout(() => spawnConfetti(), i * 300);
  }
  ui.winScreen.style.display = 'flex';
  ui.winSubtitle.textContent = currentCharData().winMessage;
  ui.winScore.textContent = `SCORE: ${score}  DIST: ${distance}m  KILLS: ${killCount}`;
}
