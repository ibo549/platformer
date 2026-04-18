// ═══════════════════════════════════════════════════════════════════════
// 04-characters: sprite-sheet crops, theming config, loading, preview
// ═══════════════════════════════════════════════════════════════════════
//
// To add a new character:
//   1) Drop a 1536-wide PNG sprite sheet into the root and a data-URL .b64 into sprites/
//   2) Add a placeholder like {{NEWCHAR_SPRITE}} and its b64 mapping in build.sh
//   3) Add a key to `characterData` below with crops + theming
//   4) Add a 'companion' factory to src/06-companions.js if you want an extra egg-hatch buddy
//   5) Add a char-option tile to the start screen HTML in game.src.html
//   6) Register load+preview calls in src/10-main.js
// No other code paths need character-specific branches — everything reads from characterData.

const characterData = {
  halil: {
    file: '{{HALIL_SPRITE}}',
    contentTop: 0,
    contentBottom: 360,
    crops: [
      { x: 0,    w: 200 },  // idle
      { x: 202,  w: 225 },  // run 1
      { x: 429,  w: 230 },  // run 2
      { x: 661,  w: 195 },  // jump
      { x: 858,  w: 180 },  // fall
      { x: 1040, w: 235 },  // land/crouch
    ],
    // Theming — consumed by shield, coin, HUD, win screen, companion lookup
    shieldColor: 0x44aaff,
    shieldHudRGB: '0,150,255',
    shieldCoin: { outer: 0x2266ff, inner: 0x66aaff, symbol: 0xaaddff },
    companionIcon: '🐭',
    companion: 'mickey',
    winMessage: 'ALL 8 MICKEYS RESCUED!',
    // Loaded lazily
    textures: [],
    loaded: false,
  },
  lara: {
    file: '{{LARA_SPRITE}}',
    contentTop: 0,
    contentBottom: 407,
    crops: [
      { x: 0,    w: 210 },  // idle
      { x: 212,  w: 235 },  // run 1
      { x: 449,  w: 245 },  // run 2
      { x: 696,  w: 235 },  // jump
      { x: 933,  w: 235 },  // fall
      { x: 1170, w: 265 },  // land/crouch
    ],
    shieldColor: 0xff2255,
    shieldHudRGB: '255,60,100',
    shieldCoin: { outer: 0xff2222, inner: 0xff6666, symbol: 0x44aaff },
    companionIcon: '🐭',
    companion: 'minnie',
    winMessage: 'ALL 8 MINNIES RESCUED!',
    textures: [],
    loaded: false,
  },
  karolcia: {
    mirror: true,
    file: '{{KAROLCIA_SPRITE}}',
    contentTop: 0,
    contentBottom: 341,
    crops: [
      { x: 0,    w: 200 },  // idle
      { x: 202,  w: 225 },  // run 1
      { x: 429,  w: 225 },  // run 2
      { x: 656,  w: 230 },  // jump
      { x: 888,  w: 240 },  // fall
      { x: 1130, w: 240 },  // land/crouch
    ],
    shieldColor: 0xff2255,
    shieldHudRGB: '255,60,100',
    shieldCoin: { outer: 0xff2222, inner: 0xff6666, symbol: 0x44aaff },
    companionIcon: '🐶',
    companion: 'scooby',
    winMessage: 'ALL 8 SCOOBYS RESCUED!',
    textures: [],
    loaded: false,
  },
};

function currentCharData() {
  return characterData[selectedChar];
}

// Load image via blob (avoids WKWebView canvas-taint when used with file:// URLs)
function loadImageAsBlob(src) {
  return fetch(src)
    .then(r => r.blob())
    .then(blob => createImageBitmap(blob))
    .catch(() => new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    }));
}

// Derive a run frame with squash/stretch/lean by transforming an existing frame canvas.
function deriveRunFrame(srcCanvas, opts) {
  const c = document.createElement('canvas');
  c.width = NORM_W; c.height = NORM_H;
  const ctx = c.getContext('2d');
  ctx.save();
  const cx = NORM_W / 2;
  const bottom = NORM_H;
  ctx.translate(cx, bottom);
  ctx.scale(1 / (opts.scaleY || 1), opts.scaleY || 1);
  if (opts.lean) ctx.rotate(opts.lean);
  const oy = opts.offsetY || 0;
  ctx.translate(-cx, -bottom + oy);
  ctx.drawImage(srcCanvas, 0, 0);
  ctx.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

function loadCharacter(key) {
  const data = characterData[key];
  const contentH = data.contentBottom - data.contentTop;
  const img = new Image();
  img.onload = () => {
    const canvases = [];
    for (const crop of data.crops) {
      const c = document.createElement('canvas');
      c.width = NORM_W; c.height = NORM_H;
      const ctx = c.getContext('2d');
      const destX = Math.floor((NORM_W - crop.w) / 2);
      const destY = Math.floor((NORM_H - contentH) / 2);
      if (data.mirror) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(img, crop.x, data.contentTop, crop.w, contentH, -(destX + crop.w), destY, crop.w, contentH);
        ctx.restore();
      } else {
        ctx.drawImage(img, crop.x, data.contentTop, crop.w, contentH, destX, destY, crop.w, contentH);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      data.textures.push(tex);
      canvases.push(c);
    }
    // Derived run frames: contact/push-off squash-stretch applied to run1 (canvases[1]) and run2 (canvases[2]).
    // Indices 6-9 appear in animFrames.run — engine walks them between drawn run1/run2.
    data.textures.push(deriveRunFrame(canvases[1], { scaleY: 0.94, offsetY: 12, lean: 0.03 }));
    data.textures.push(deriveRunFrame(canvases[1], { scaleY: 1.06, offsetY: -10, lean: -0.02 }));
    data.textures.push(deriveRunFrame(canvases[2], { scaleY: 0.94, offsetY: 12, lean: -0.03 }));
    data.textures.push(deriveRunFrame(canvases[2], { scaleY: 1.06, offsetY: -10, lean: 0.02 }));

    data.loaded = true;
    if (key === selectedChar && data.textures.length > 0) {
      playerMat.map = data.textures[0];
      playerMat.needsUpdate = true;
    }
  };
  img.src = data.file;
}

function drawPreview(key) {
  const data = characterData[key];
  loadImageAsBlob(data.file).then(img => {
    const canvas = document.getElementById('preview-' + key);
    const ctx = canvas.getContext('2d');
    const crop = data.crops[0];
    const contentH = data.contentBottom - data.contentTop;
    canvas.width = crop.w;
    canvas.height = contentH;
    if (data.mirror) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(img, crop.x, data.contentTop, crop.w, contentH, -crop.w, 0, crop.w, contentH);
      ctx.restore();
    } else {
      ctx.drawImage(img, crop.x, data.contentTop, crop.w, contentH, 0, 0, crop.w, contentH);
    }
  });
}

function setFrame(index) {
  const data = characterData[selectedChar];
  if (!data.loaded) return;
  playerMat.map = data.textures[index];
  playerMat.needsUpdate = true;
}

function selectCharacter(key) {
  selectedChar = key;
  document.querySelectorAll('.char-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('char-' + key).classList.add('selected');
  const data = characterData[key];
  if (data.loaded) {
    playerMat.map = data.textures[0];
    playerMat.needsUpdate = true;
  }
  ui.companionIcon.textContent = data.companionIcon;
}
