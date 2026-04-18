// ═══════════════════════════════════════════════════════════════════════
// 03-background: procedurally built static scenery (sky, sun, mountains, trees, grass)
// ═══════════════════════════════════════════════════════════════════════

function createBackground() {
  // Sunrise sky gradient bands
  const skyColors = [0xff7e5f, 0xfeb47b, 0xfcd4a5, 0x7ec8e3, 0x4a90d9];
  const bandH = 8;
  for (let i = 0; i < skyColors.length; i++) {
    const band = new THREE.Mesh(
      sharedBox(300, bandH, 0.01),
      sharedMat(skyColors[i], { depthWrite: false })
    );
    band.position.set(50, -camH + bandH * i + bandH / 2, -15);
    scene.add(band);
  }

  // Pixel-art sun (upper area)
  const sunGlow = box(6, 6, 0.1, 0xffdd44, { transparent: true, opacity: 0.3, depthWrite: false });
  sunGlow.position.set(30, 14, -14);
  scene.add(sunGlow);
  const sunGlow2 = box(4, 4, 0.1, 0xffee66, { transparent: true, opacity: 0.5, depthWrite: false });
  sunGlow2.position.set(30, 14, -13.9);
  scene.add(sunGlow2);
  const sunCore = box(2.5, 2.5, 0.1, 0xffee88, { depthWrite: false });
  sunCore.position.set(30, 14, -13.8);
  scene.add(sunCore);
  const sunInner = box(1.5, 1.5, 0.1, 0xfffff0, { depthWrite: false });
  sunInner.position.set(30, 14, -13.7);
  scene.add(sunInner);

  // Daytime mountains (green/blue tones) — 3 parallax layers
  for (let layer = 0; layer < 3; layer++) {
    const depth = -8 + layer * -2;
    const opacity = 0.25 + layer * 0.1;
    const baseH = 3 + layer * 1.5;
    const color = [0x5b8a72, 0x4a7a63, 0x3a6a54][layer];
    const mat = sharedMat(color, { transparent: true, opacity });
    for (let i = -10; i < 30; i++) {
      const mh = baseH + Math.random() * 2;
      const mw = 2 + Math.random() * 3;
      const m = new THREE.Mesh(new THREE.BoxGeometry(mw, mh, 1), mat);
      m.position.set(i * 5 + Math.random() * 2, GROUND_Y + mh * 0.5, depth);
      scene.add(m);
    }
  }

  // Background trees (between mountains and gameplay)
  for (let i = 0; i < 20; i++) {
    const tx = -20 + i * 20 + Math.random() * 12;
    const treeH = 3 + Math.random() * 2;
    const trunkH = treeH * 0.4;
    const canopyH = treeH * 0.65;
    const tz = -6 - Math.random();
    const treeOpacity = 0.5 + Math.random() * 0.2;

    const trunkMat = sharedMat(0x8B5E3C, { transparent: true, opacity: treeOpacity });
    const trunk = new THREE.Mesh(sharedBox(0.4, trunkH, 0.4), trunkMat);
    trunk.position.set(tx, GROUND_Y + trunkH * 0.5, tz);
    scene.add(trunk);

    const canopyColor = Math.random() > 0.5 ? 0x3da35d : 0x2d8a4e;
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(2 + Math.random(), canopyH, 0.5),
      sharedMat(canopyColor, { transparent: true, opacity: treeOpacity })
    );
    canopy.position.set(tx, GROUND_Y + trunkH + canopyH * 0.5 - 0.3, tz);
    scene.add(canopy);
  }

  // Ground grass blades
  const grassColors = [0x4ade80, 0x22c55e];
  for (let i = 0; i < 100; i++) {
    const gx = -10 + Math.random() * 380;
    const gw = 0.1 + Math.random() * 0.1;
    const gh = 0.3 + Math.random() * 0.3;
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(gw, gh, 0.05),
      sharedMat(grassColors[Math.floor(Math.random() * 2)])
    );
    blade.position.set(gx, GROUND_Y + gh * 0.5, 0.5);
    scene.add(blade);
  }
}
