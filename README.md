# Chibi Runner

A tiny pixel-art platformer I built with my daughter. We picked the characters, the enemies, the sound effects, and argued about whether strawberries should say "GAW GAW." (They do.)

Runs in a browser or as a standalone iPad / iPhone app via a WKWebView wrapper.

## The game

Pick a character, run and jump across the level, stomp enemies, splash through puddles, and rescue the eight eggs before you run out of lives. Each egg hatches a companion that tags along behind you.

### Characters

| Character | Theme | Companion |
|---|---|---|
| **Halil** | blue | Mickey |
| **Lara** | red / pink | Minnie |
| **Karolcia** | warm | Scooby |

Each character has their own sprite sheet with a 6-frame animation set (idle, two run frames, jump, fall, land). Four extra run frames are derived at load time for squash/stretch, so running doesn't look stiff.

### Enemies

- **Brown** — ground goomba-style, one stomp.
- **Stick** — two stomps; first one just cracks it.
- **Strawberry** — one stomp, shouts "GAW GAW" on approach.
- **Pterodactyl** — flies, shoots flame projectiles, two stomps. Unlocked on Hard.

### Difficulty

Chosen after character select:

- **Easy** — only brown enemies.
- **Normal** — adds stick and strawberry.
- **Hard** — adds pterodactyl. Full difficulty.

### Systems we're quietly proud of

- **Water puddles that slowly melt enemies.** First puddle: the enemy gets wet, five droplets orbit its head. Second puddle: it freezes, turns blue, shrinks over five seconds, says "oh my god-tow," and dissolves.
- **Adaptive pixel rendering** based on physical pixels (`CSS size × devicePixelRatio`) so upscale stays on integer boundaries — no blurry diagonals. Different `PIXEL_SCALE` per form factor.
- **Shield power-ups** with pixel-heart animation, color-keyed to the character, showing a glowing icon in the HUD without shifting the other HUD elements around.
- **Lives from kills.** 5 enemies stomped = 1 extra life, shown as poop-emoji pips.
- **Eggs never spawn on spikes.** Learned the hard way.

## Running it

### Browser

```bash
./serve.sh
```

Builds `game.html`, opens it in your browser, serves on port 8080.

### iPad / iPhone

```bash
./deploy.sh
```

Builds, signs, and installs to the USB-connected device. You'll need:

- Xcode 26
- Developer Mode on the device (Settings → Privacy & Security → Developer Mode)
- `brew install ideviceinstaller`
- Your device trusted ("Trust This Computer" prompt)

First launch on a new device: Settings → General → VPN & Device Management → trust your developer profile.

### Iterating from Linux (no Mac, no USB)

The live deploy is a PWA at **[chibi.halilk.com](https://chibi.halilk.com/)**. Push to `main` triggers `.github/workflows/deploy.yml`, which builds `web/` and ships it to Cloudflare Pages. About 45 seconds end-to-end. Next launch of the iPad home-screen icon pulls the fresh version.

**Install as a PWA:**
- **iPad/iPhone**: open in Safari → Share → *Add to Home Screen*. Launches standalone, full screen, no browser chrome.
- **Android**: open in Chrome → install prompt appears, or menu → *Install app*.
- Updates propagate on next launch automatically (network-first service worker; offline works from last cache).

See [`PWA.md`](PWA.md) for the original design notes, and [`CLAUDE.md`](CLAUDE.md) for the full hosting + CI/CD docs.

## How the build works

The game code is split into ~17 small JS modules under `src/` — roughly 150-500 lines each, grouped by concern (audio, player, enemies, level, physics, etc.). `game.src.html` is the HTML + CSS shell with a `{{GAME_JS}}` placeholder.

`build.sh` concatenates `src/*.js` in filename-sort order into one script block and inlines the character sprite sheets (base64-encoded under `sprites/*.b64`) into the placeholders. Out comes `game.html` — a single ~4.4 MB standalone file with everything embedded.

Sprite embedding matters: WKWebView treats images loaded from `file://` as cross-origin when drawn to canvas, so texture cropping silently breaks on iOS. Data URLs are same-origin, so the engine can crop sprite frames cleanly.

`optimize_sprites.py` is a one-shot utility that crops the character PNGs vertically to the content band and repacks frames tightly — that's what keeps `game.html` well under 5 MB instead of 10+ MB.

## Layout

```
src/                     editable JS modules — 17 small files, each focused on one concern
  01-core.js               constants, state, audio, three.js setup, material/geo pools
  02-bubble.js             speech-bubble factory
  03-background.js         sky, sun, mountains, trees, grass
  04-characters.js         characterData, theming, sprite loading
  05-player.js             player mesh, shield, animation, hit/invincibility
  06-companions.js         Mickey / Minnie / Scooby meshes + registry
  07-world.js              platforms, coins, red shield coins, hazards, ground
  08-particles.js          confetti, enemy burst, egg shell burst
  09-enemies.js            shared helpers + brown / stick / strawberry
  10-ptero.js              pterodactyl + flame projectiles
  11-water.js              puddles + enemy melt system
  12-eggs.js               eggs + hatched companion trail
  13-level.js              static level gen + dynamic entity spawn
  14-physics.js            per-frame physics + camera
  15-game-state.js         start / retry / game-over / win transitions
  16-input.js              keyboard + touch + UI bindings
  17-main.js               bootstrap + RAF loop
game.src.html            HTML + CSS shell (with {{GAME_JS}} + sprite placeholders)
game.html                build artifact — regenerated by build.sh
build.sh                 concatenates src/*.js + inlines sprites
optimize_sprites.py      crops + repacks character PNGs
sprites/*.b64            per-character sprite data URLs
{halil,lara,karolcia}.png   source art (cropped to content bands)
serve.sh                 local dev: build + browser + server
deploy.sh                build + install on USB device
PlatformerApp/           Xcode wrapper (WKWebView)
generate_icon.py         regenerate app icons from a character
generate_splash.py       regenerate splash screens from a character
CLAUDE.md                detailed notes, known issues, character-add guide
```

## Adding a character

See the "Adding a New Character" section in [CLAUDE.md](CLAUDE.md). It covers sprite sheet layout, the crop coordinates you need to figure out, every `selectedChar ===` branch you have to touch, and how to write a new companion mesh.

## Credits

Built with my daughter. Every enemy, every puddle, every "GAW GAW" was her idea or ours together.
