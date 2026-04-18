// ═══════════════════════════════════════════════════════════════════════
// 02-bubble: speech bubble factory (one factory, previously three)
// ═══════════════════════════════════════════════════════════════════════

function makeSpeechBubble(text, textColor = '#111', fontSize = 18) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 48;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.roundRect(0, 0, 256, 40, 8);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(118, 40); ctx.lineTo(128, 48); ctx.lineTo(138, 40);
  ctx.fill();
  ctx.fillStyle = textColor;
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 28);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0 });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(3.5, 0.7, 1);
  return sprite;
}
