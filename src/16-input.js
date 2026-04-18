// ═══════════════════════════════════════════════════════════════════════
// 16-input: keyboard, mobile touch buttons, and UI click bindings
// ═══════════════════════════════════════════════════════════════════════

function bindInput() {
  document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      keys.jump = true;
    }
  });
  document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') keys.jump = false;
  });

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    || ('ontouchstart' in window && navigator.maxTouchPoints > 1);
  if (isMobile) {
    ui.mobileControls.style.display = 'flex';
    ui.controlsHint.textContent = 'TAP BUTTONS TO MOVE AND JUMP';

    const addTouch = (id, key) => {
      const btn = document.getElementById(id);
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys[key] = true;
        btn.classList.add('active');
      }, { passive: false });
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys[key] = false;
        btn.classList.remove('active');
      }, { passive: false });
      btn.addEventListener('touchcancel', () => {
        keys[key] = false;
        btn.classList.remove('active');
      });
    };
    addTouch('btn-left', 'left');
    addTouch('btn-right', 'right');
    addTouch('btn-jump', 'jump');
  }

  // Character select
  document.querySelectorAll('.char-option').forEach(el => {
    el.addEventListener('click', () => selectCharacter(el.dataset.char));
  });

  // Difficulty select
  document.querySelectorAll('.diff-option').forEach(el => {
    el.addEventListener('click', () => {
      gameDifficulty = el.dataset.diff;
      document.querySelectorAll('.diff-option').forEach(d => d.classList.remove('selected'));
      el.classList.add('selected');
    });
  });

  // Buttons
  document.getElementById('start-btn').addEventListener('click', startGame);
  document.getElementById('restart-btn').addEventListener('click', returnToMenu);
  document.getElementById('play-again-btn').addEventListener('click', returnToMenu);
}

function bindResize() {
  window.addEventListener('resize', () => {
    PIXEL_SCALE = getPixelScale();
    internal = getInternalSize();
    renderer.setSize(internal.w, internal.h, false);
    const a = internal.w / internal.h;
    camera.left = -camH * a;
    camera.right = camH * a;
    camera.updateProjectionMatrix();
  });
}
