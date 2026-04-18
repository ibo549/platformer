// ═══════════════════════════════════════════════════════════════════════
// 07-world: platforms, coins (yellow + red shield), hazards, ground
// ═══════════════════════════════════════════════════════════════════════

const platforms = [];
const coins = [];
const redCoins = [];
const hazards = [];

// Build a grass-topped platform mesh with dirt bottom and some grass blades on top.
function createPlatformMesh(w, h, color = 0x2d6a4f) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1), sharedMat(color));

  const topMat = sharedMat(0x52b788);
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, 1.02), topMat);
  top.position.y = h / 2 + 0.1;
  mesh.add(top);

  const botMat = sharedMat(0x1b4332);
  const bot = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 1.01), botMat);
  bot.position.y = -h / 2 - 0.06;
  mesh.add(bot);

  const grassColors = [0x4ade80, 0x22c55e];
  const grassCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < grassCount; i++) {
    const gw = 0.1 + Math.random() * 0.1;
    const gh = 0.2 + Math.random() * 0.2;
    const gx = (Math.random() - 0.5) * (w - 0.3);
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(gw, gh, 0.05),
      sharedMat(grassColors[Math.floor(Math.random() * 2)])
    );
    blade.position.set(gx, h / 2 + gh * 0.5 + 0.1, 0.5);
    mesh.add(blade);
  }
  return mesh;
}

function createCoin(x, y) {
  const coin = box(COIN_SIZE, COIN_SIZE, 0.1, 0xffe066);
  coin.position.set(x, y, 0.1);
  coin.userData.collected = false;
  coin.userData.baseY = y;
  const inner = box(COIN_SIZE * 0.5, COIN_SIZE * 0.5, 0.12, 0xf0a030);
  coin.add(inner);
  scene.add(coin);
  coins.push(coin);
  return coin;
}

const RED_COIN_SIZE = 0.7;
function createRedCoin(x, y) {
  const theme = currentCharData().shieldCoin;
  const coin = box(RED_COIN_SIZE, RED_COIN_SIZE, 0.15, theme.outer);
  coin.position.set(x, y, 0.1);
  coin.userData.collected = false;
  coin.userData.baseY = y;
  const inner = box(RED_COIN_SIZE * 0.45, RED_COIN_SIZE * 0.45, 0.17, theme.inner);
  coin.add(inner);
  const sym = box(RED_COIN_SIZE * 0.2, RED_COIN_SIZE * 0.25, 0.02, theme.symbol);
  sym.position.z = 0.1;
  coin.add(sym);
  scene.add(coin);
  redCoins.push(coin);
  return coin;
}

function createHazard(x, y, w) {
  const count = Math.floor(w / 0.7);
  for (let i = 0; i < count; i++) {
    const spike = box(0.3, 0.5, 0.3, 0xff4444);
    spike.position.set(x - w / 2 + 0.35 + i * 0.7, y + 0.25, 0);
    const tip = box(0.15, 0.25, 0.15, 0xff6666);
    tip.position.y = 0.35;
    spike.add(tip);
    scene.add(spike);
    hazards.push(spike);
  }
}

// Per-frame bob for coins (both kinds).
function animateCoins(time) {
  for (const coin of coins) {
    if (!coin.userData.collected) {
      const bob = Math.round(Math.sin(time * 3 + coin.position.x) * 3) / 3 * 0.15;
      coin.position.y = coin.userData.baseY + bob;
    }
  }
  for (const rc of redCoins) {
    if (!rc.userData.collected) {
      const bob = Math.round(Math.sin(time * 2 + rc.position.x) * 3) / 3 * 0.2;
      rc.position.y = rc.userData.baseY + bob;
      const pulse = 1.0 + Math.sin(time * 4) * 0.1;
      rc.scale.setScalar(pulse);
    }
  }
}

// Ground (created once, persists for the life of the page)
const groundWidth = 400;
const ground = createPlatformMesh(groundWidth, 1, 0x1b4332);
ground.position.set(groundWidth / 2 - 10, GROUND_Y - 0.5, 0);
scene.add(ground);
platforms.push({
  mesh: ground,
  x: groundWidth / 2 - 10,
  y: GROUND_Y,
  w: groundWidth,
  h: 1,
  isGround: true,
});
