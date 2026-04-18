// ═══════════════════════════════════════════════════════════════════════
// 06-companions: Mickey / Minnie / Scooby mesh builders + named registry
// ═══════════════════════════════════════════════════════════════════════
//
// Each hatched egg produces one of these. The character-select registers which
// companion belongs to which character via characterData[key].companion = 'mickey' etc.

function createMinnieMesh() {
  const g = new THREE.Group();

  // Body — pink dress
  const body = box(0.6, 0.55, 0.4, 0xff4477);
  body.position.y = 0.28; g.add(body);
  const skirt = box(0.7, 0.2, 0.45, 0xff2255);
  skirt.position.y = 0.1; g.add(skirt);

  // White polka dots on dress
  for (const [dx, dy] of [[-0.15, 0.35], [0.1, 0.25], [-0.05, 0.15], [0.2, 0.38]]) {
    const d = box(0.08, 0.08, 0.05, 0xffffff);
    d.position.set(dx, dy, 0.22);
    g.add(d);
  }

  // Head
  const head = box(0.55, 0.5, 0.4, 0x222222);
  head.position.y = 0.8; g.add(head);
  const face = box(0.35, 0.3, 0.05, 0xffccaa);
  face.position.set(0, 0.75, 0.22); g.add(face);

  // Eyes, smile
  const eyeL = box(0.1, 0.1, 0.05, 0x000000);
  eyeL.position.set(-0.08, 0.78, 0.26); g.add(eyeL);
  const eyeR = box(0.1, 0.1, 0.05, 0x000000);
  eyeR.position.set(0.08, 0.78, 0.26); g.add(eyeR);
  const smile = box(0.12, 0.04, 0.05, 0xff4466);
  smile.position.set(0, 0.68, 0.26); g.add(smile);

  // Ears
  const earL = box(0.28, 0.28, 0.2, 0x222222);
  earL.position.set(-0.28, 1.1, 0); g.add(earL);
  const earR = box(0.28, 0.28, 0.2, 0x222222);
  earR.position.set(0.28, 1.1, 0); g.add(earR);

  // Bow
  const bowL = box(0.22, 0.15, 0.15, 0xff2222);
  bowL.position.set(-0.13, 1.15, 0.15); g.add(bowL);
  const bowR = box(0.22, 0.15, 0.15, 0xff2222);
  bowR.position.set(0.13, 1.15, 0.15); g.add(bowR);
  const knot = box(0.1, 0.1, 0.1, 0xcc0000);
  knot.position.set(0, 1.15, 0.18); g.add(knot);
  for (const [dx, dy] of [[-0.15, 1.18], [0.15, 1.18], [-0.1, 1.1], [0.1, 1.1]]) {
    const d = box(0.05, 0.05, 0.02, 0xffffff);
    d.position.set(dx, dy, 0.22);
    g.add(d);
  }

  // Feet
  const footL = box(0.18, 0.1, 0.2, 0xff4477);
  footL.position.set(-0.15, 0.05, 0.05); g.add(footL);
  const footR = box(0.18, 0.1, 0.2, 0xff4477);
  footR.position.set(0.15, 0.05, 0.05); g.add(footR);

  g.scale.setScalar(0.9);
  return g;
}

function createMickeyMesh() {
  const g = new THREE.Group();

  // Body — blue shirt, dark shorts
  const body = box(0.6, 0.55, 0.4, 0x2255cc);
  body.position.y = 0.28; g.add(body);
  const shorts = box(0.65, 0.2, 0.42, 0x1a44aa);
  shorts.position.y = 0.1; g.add(shorts);

  // Two white buttons on shorts
  const btnL = box(0.08, 0.08, 0.05, 0xffffff);
  btnL.position.set(-0.08, 0.22, 0.22); g.add(btnL);
  const btnR = box(0.08, 0.08, 0.05, 0xffffff);
  btnR.position.set(0.08, 0.22, 0.22); g.add(btnR);

  // Head and face
  const head = box(0.55, 0.5, 0.4, 0x222222);
  head.position.y = 0.8; g.add(head);
  const face = box(0.35, 0.3, 0.05, 0xffccaa);
  face.position.set(0, 0.75, 0.22); g.add(face);

  // Eyes, nose, smile
  const eyeL = box(0.1, 0.1, 0.05, 0x000000);
  eyeL.position.set(-0.08, 0.78, 0.26); g.add(eyeL);
  const eyeR = box(0.1, 0.1, 0.05, 0x000000);
  eyeR.position.set(0.08, 0.78, 0.26); g.add(eyeR);
  const nose = box(0.1, 0.08, 0.06, 0x111111);
  nose.position.set(0, 0.72, 0.26); g.add(nose);
  const smile = box(0.12, 0.04, 0.05, 0x222222);
  smile.position.set(0, 0.66, 0.26); g.add(smile);

  // Classic Mickey ears
  const earL = box(0.3, 0.3, 0.2, 0x222222);
  earL.position.set(-0.28, 1.12, 0); g.add(earL);
  const earR = box(0.3, 0.3, 0.2, 0x222222);
  earR.position.set(0.28, 1.12, 0); g.add(earR);

  // White gloves
  const gloveL = box(0.14, 0.12, 0.12, 0xffffff);
  gloveL.position.set(-0.38, 0.3, 0.05); g.add(gloveL);
  const gloveR = box(0.14, 0.12, 0.12, 0xffffff);
  gloveR.position.set(0.38, 0.3, 0.05); g.add(gloveR);

  // Yellow shoes
  const footL = box(0.2, 0.1, 0.22, 0xffcc00);
  footL.position.set(-0.15, 0.05, 0.05); g.add(footL);
  const footR = box(0.2, 0.1, 0.22, 0xffcc00);
  footR.position.set(0.15, 0.05, 0.05); g.add(footR);

  g.scale.setScalar(0.9);
  return g;
}

function createScoobyMesh() {
  const g = new THREE.Group();

  // Body, belly
  const body = box(0.75, 0.45, 0.4, 0xb5651d);
  body.position.y = 0.35; g.add(body);
  const belly = box(0.5, 0.3, 0.05, 0xd4a056);
  belly.position.set(0, 0.32, 0.22); g.add(belly);

  // Spots
  for (const [dx, dy] of [[-0.2, 0.45], [0.15, 0.5], [-0.05, 0.3], [0.25, 0.35]]) {
    const s = box(0.12, 0.1, 0.05, 0x3d2b1f);
    s.position.set(dx, dy, 0.22);
    g.add(s);
  }

  // Head and snout
  const head = box(0.45, 0.45, 0.38, 0xb5651d);
  head.position.set(0.15, 0.78, 0); g.add(head);
  const snout = box(0.3, 0.22, 0.25, 0xd4a056);
  snout.position.set(0.28, 0.72, 0.12); g.add(snout);
  const nose = box(0.14, 0.12, 0.1, 0x111111);
  nose.position.set(0.4, 0.76, 0.2); g.add(nose);

  // Eyes
  const eyeL = box(0.1, 0.12, 0.05, 0x000000);
  eyeL.position.set(0.08, 0.85, 0.2); g.add(eyeL);
  const eyeR = box(0.1, 0.12, 0.05, 0x000000);
  eyeR.position.set(0.22, 0.85, 0.2); g.add(eyeR);
  const eyeWL = box(0.12, 0.14, 0.04, 0xffffff);
  eyeWL.position.set(0.08, 0.86, 0.18); g.add(eyeWL);
  const eyeWR = box(0.12, 0.14, 0.04, 0xffffff);
  eyeWR.position.set(0.22, 0.86, 0.18); g.add(eyeWR);

  // Floppy ears
  const earL = box(0.15, 0.3, 0.12, 0x8B4513);
  earL.position.set(-0.05, 0.7, 0.05); g.add(earL);
  const earR = box(0.15, 0.3, 0.12, 0x8B4513);
  earR.position.set(0.35, 0.7, 0.05); g.add(earR);

  // Collar + tag
  const collar = box(0.5, 0.1, 0.42, 0x2288dd);
  collar.position.set(0.1, 0.55, 0); g.add(collar);
  const tag = box(0.1, 0.1, 0.06, 0xffdd00);
  tag.position.set(0.1, 0.48, 0.22);
  tag.rotation.z = Math.PI / 4;
  g.add(tag);

  // Legs and paws
  for (const [lx, pawLightX] of [[-0.2, -0.2], [-0.08, -0.08], [0.3, 0.3], [0.42, 0.42]]) {
    const leg = box(0.12, 0.25, 0.14, 0xb5651d);
    leg.position.set(lx, 0.12, 0.08);
    g.add(leg);
    const paw = box(0.14, 0.06, 0.16, 0xd4a056);
    paw.position.set(pawLightX, 0, 0.08);
    g.add(paw);
  }

  // Tail
  const tail = box(0.08, 0.25, 0.08, 0xb5651d);
  tail.position.set(-0.4, 0.5, 0);
  tail.rotation.z = 0.4;
  g.add(tail);

  g.scale.setScalar(0.85);
  return g;
}

const companionFactories = {
  mickey: createMickeyMesh,
  minnie: createMinnieMesh,
  scooby: createScoobyMesh,
};

function createCompanionMesh() {
  const name = currentCharData().companion;
  const factory = companionFactories[name] || createMinnieMesh;
  return factory();
}
