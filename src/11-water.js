// ═══════════════════════════════════════════════════════════════════════
// 11-water: puddles on the ground. Player splashes; enemies melt over 2 encounters.
// ═══════════════════════════════════════════════════════════════════════

const waterPuddles = [];

function createWaterPuddle(x, y) {
  const g = new THREE.Group();
  const w = 2.5 + Math.random() * 2;

  const mudColor = 0x6b4226;
  const mudDark = 0x4a2e15;

  // Mud banks
  const mudL = box(0.4, 0.35, 1.1, mudColor);
  mudL.position.set(-w / 2 - 0.1, 0.18, 0); g.add(mudL);
  const mudR = box(0.4, 0.35, 1.1, mudColor);
  mudR.position.set(w / 2 + 0.1, 0.18, 0); g.add(mudR);
  const mudB = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.25, 0.2), sharedMat(mudDark));
  mudB.position.set(0, 0.12, -0.5); g.add(mudB);

  // Water surface — main body, sheen, specular highlight
  const puddle = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.2, 0.9),
    sharedMat(0x0088ee, { transparent: true, opacity: 0.85 })
  );
  puddle.position.y = 0.25; g.add(puddle);

  const sheen = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.5, 0.05, 0.4),
    sharedMat(0x55ccff, { transparent: true, opacity: 0.7 })
  );
  sheen.position.set(0, 0.36, 0.1); g.add(sheen);

  const spec = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.25, 0.04, 0.18),
    sharedMat(0xffffff, { transparent: true, opacity: 0.6 })
  );
  spec.position.set(w * 0.12, 0.37, 0.15); g.add(spec);

  // Animated ripple dots — each has its own material so we can fade opacity per-frame per-dot
  const dotGeo = sharedBox(0.18, 0.03, 0.18);
  const ripples = [];
  for (let i = 0; i < 4; i++) {
    const dot = new THREE.Mesh(
      dotGeo,
      new THREE.MeshBasicMaterial({ color: 0xccf0ff, transparent: true, opacity: 0.5 })
    );
    dot.position.set((Math.random() - 0.5) * w * 0.5, 0.36, (Math.random() - 0.5) * 0.4);
    g.add(dot);
    ripples.push(dot);
  }

  // Mud splatters around edges
  for (let i = 0; i < 5; i++) {
    const splatW = 0.15 + Math.random() * 0.15;
    const splat = new THREE.Mesh(
      new THREE.BoxGeometry(splatW, 0.08, 0.15),
      sharedMat(i % 2 === 0 ? mudColor : mudDark)
    );
    const angle = (i / 5) * Math.PI * 2;
    splat.position.set(
      Math.cos(angle) * (w / 2 + 0.2 + Math.random() * 0.3),
      0.04,
      Math.sin(angle) * 0.5
    );
    g.add(splat);
  }

  g.position.set(x, y, 0.2);
  g.userData = { w, playerSplashed: false, rippleTimer: 0, ripples };
  scene.add(g);
  waterPuddles.push(g);
  return g;
}

function updateWaterPuddles(dt) {
  const viewHalf = (camera.right - camera.left) * 0.6;
  const camX = camera.position.x;

  for (const wp of waterPuddles) {
    const wd = wp.userData;

    wd.rippleTimer += dt;
    for (let i = 0; i < wd.ripples.length; i++) {
      wd.ripples[i].material.opacity = 0.25 + Math.sin(wd.rippleTimer * 3 + i * 2) * 0.2;
    }

    const wLeft = wp.position.x - wd.w / 2;
    const wRight = wp.position.x + wd.w / 2;

    // Player splash
    const px = player.position.x;
    const py = player.position.y - playerH / 2;
    if (px > wLeft && px < wRight && Math.abs(py - wp.position.y) < 1.0 && isGrounded) {
      if (!wd.playerSplashed) {
        wd.playerSplashed = true;
        sfxSplash();
      }
    } else {
      wd.playerSplashed = false;
    }

    // Only process melting when puddle is onscreen
    if (Math.abs(wp.position.x - camX) > viewHalf) continue;

    const allGroundEnemies = [enemies, stickEnemies, strawEnemies];
    const MELT_DURATION = 5.0;

    for (const arr of allGroundEnemies) {
      for (let i = arr.length - 1; i >= 0; i--) {
        const e = arr[i];
        const ed = e.userData;
        if (!ed.alive) continue;

        const inThisPuddle =
          e.position.x > wLeft && e.position.x < wRight &&
          Math.abs(e.position.x - camX) < viewHalf;

        if (inThisPuddle && !ed.melting) {
          if (!ed.puddleHits) ed.puddleHits = 0;
          if (!ed._inPuddle) {
            ed._inPuddle = true;
            ed.puddleHits++;
            if (ed.puddleHits === 1 && !ed.wetDrops) {
              ed.wet = true;
              ed.wetTimer = 0;
              ed.wetDrops = [];
              const dropGeo = sharedBox(0.08, 0.12, 0.08);
              const dropMat = sharedMat(0x44bbff, { transparent: true, opacity: 0.8 });
              for (let dIdx = 0; dIdx < 5; dIdx++) {
                const drop = new THREE.Mesh(dropGeo, dropMat);
                drop.userData.angle = (dIdx / 5) * Math.PI * 2;
                drop.userData.speed = 2 + Math.random();
                drop.userData.radius = 0.5 + Math.random() * 0.3;
                drop.userData.yOff = Math.random() * 0.6;
                e.add(drop);
                ed.wetDrops.push(drop);
              }
              // Slight blue tint on first splash (clone material so we don't mutate the shared pool)
              e.traverse(child => {
                if (child.isMesh && child.material && !child.material._wetTinted) {
                  child.material = child.material.clone();
                  child.material._wetTinted = true;
                  child.material.color.lerp(new THREE.Color(0x66aadd), 0.15);
                }
              });
              sfxSplash();
            }
          }
          if (ed.puddleHits >= 2) {
            ed.melting = true;
            ed.meltTimer = MELT_DURATION;
            ed.vx = 0;
            sfxOhMyGodTow();
          }
        }
        if (!inThisPuddle && ed._inPuddle) {
          ed._inPuddle = false;
        }

        if (ed.wet && ed.wetDrops) {
          ed.wetTimer = (ed.wetTimer || 0) + dt;
          for (const drop of ed.wetDrops) {
            const a = drop.userData.angle + ed.wetTimer * drop.userData.speed;
            drop.position.x = Math.cos(a) * drop.userData.radius;
            drop.position.y = drop.userData.yOff + Math.sin(ed.wetTimer * 3 + drop.userData.angle) * 0.15;
            drop.position.z = Math.sin(a) * drop.userData.radius * 0.5 + 0.3;
          }
        }

        if (ed.melting) {
          ed.meltTimer -= dt;
          const t = Math.max(0, ed.meltTimer / MELT_DURATION);
          e.scale.set(0.5 + t * 0.5, t, 0.5 + t * 0.5);
          e.position.y = ed.groundY || wp.position.y;
          e.traverse(child => {
            if (child.isMesh && child.material && !child.material._waterTinted) {
              child.material = child.material.clone();
              child.material._waterTinted = true;
            }
            if (child.isMesh && child.material && child.material._waterTinted) {
              child.material.color.lerp(new THREE.Color(0x1199ff), dt * 1.5);
            }
          });
          if (ed.meltTimer <= 0) {
            ed.alive = false;
            ed.squishTimer = 0;
            // Water kills don't count for the kill pip (no extra life)
            spawnEnemyBurst(e.position.x, e.position.y + 0.5);
          }
        }
      }
    }
  }
}
