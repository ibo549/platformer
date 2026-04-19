# Shipping as a PWA (Linux → iPad, no macOS)

This is the plan for ditching the native iOS build when you're iterating from
a Linux machine. The iPad gets a home-screen icon, launches fullscreen, and
works offline — but you never have to touch Xcode or USB again.

## Why this works

The native app is just a `WKWebView` pointing at a bundled `game.html`.
Everything meaningful already renders in a plain browser. Once the iPad
installs the game as a PWA from Safari, there's no functional difference —
home-screen icon, splash, no browser chrome, works offline via a service
worker. Updates propagate whenever you push a new build to the host.

## What to add to the repo

Four small pieces. All of them live in `web/` and get wired up by
`build-web.sh`.

### 1. `web/manifest.json`

Declares the app name, icons, theme color, and standalone display mode.

```json
{
  "name": "Chibi Runner",
  "short_name": "Chibi",
  "description": "A tiny pixel-art platformer",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "landscape",
  "background_color": "#0f0c29",
  "theme_color": "#ee5a24",
  "icons": [
    { "src": "icon-180.png", "sizes": "180x180", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### 2. Icons

Reuse what `generate_icon.py` already produces. You need two sizes for
the PWA:

- `web/icon-180.png` — iPad/iPhone home-screen icon (Safari's preferred
  size on iOS). Copy `PlatformerApp/PlatformerApp/Assets/AppIcon180.png`.
- `web/icon-512.png` — manifest-level icon, used for splash. Resize
  `AppIcon1024.png` down to 512 (or regenerate at that size).

Quick one-liner with Pillow:

```bash
python3 -c "from PIL import Image; \
  Image.open('PlatformerApp/PlatformerApp/Assets/AppIcon180.png') \
    .save('web/icon-180.png'); \
  Image.open('PlatformerApp/PlatformerApp/Assets/AppIcon1024.png') \
    .resize((512, 512)).save('web/icon-512.png')"
```

### 3. HTML `<head>` tags in `game.src.html`

iOS needs its own set of meta tags on top of the web standard.

```html
<link rel="manifest" href="manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Chibi Runner">
<link rel="apple-touch-icon" href="icon-180.png">
<meta name="theme-color" content="#0f0c29">
```

Drop these into `<head>` near the existing `<meta>` tags. They're
harmless in the iOS native build path — `build.sh` will inline them into
`game.html` too, and WKWebView just ignores the ones it doesn't need.

### 4. `web/sw.js` — the service worker

Caches the four-file bundle on first load so the iPad works offline after
that. Bumps cache version when you change assets.

```js
const CACHE = 'chibi-runner-v1';
const ASSETS = [
  './',
  './index.html',
  './halil.webp',
  './lara.webp',
  './karolcia.webp',
  './manifest.json',
  './icon-180.png',
  './icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
```

Register it from the page — a tiny `<script>` tag at the end of `<body>`
in `game.src.html`:

```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }
</script>
```

**When you ship an update:** bump `'chibi-runner-v1'` → `'chibi-runner-v2'`.
The next iPad launch fetches fresh assets, swaps the cache, and old
versions get cleaned up. Without the bump, the iPad keeps serving
cached assets forever (which is the point for offline play, but means
updates don't reach the device).

### 5. Update `build-web.sh` to copy the new files

Extend the "copy sprites to web/" step to also copy:

- `web/manifest.json`  (from a source file at `web-assets/manifest.json`)
- `web/sw.js`          (from `web-assets/sw.js`)
- `web/icon-180.png`, `web/icon-512.png`  (from `web-assets/`)

Keep the source-of-truth copies in a `web-assets/` directory in the repo
root so `web/` stays fully a build artifact.

## Picking a host (all free for a project this size)

| Host | How to deploy | Works with private repo | Auto-deploy on push |
|------|---|---|---|
| Cloudflare Pages | Dashboard-connect the repo, set build command `bash build-web.sh`, output dir `web` | yes | yes |
| Netlify CLI | `netlify deploy --dir=web --prod` | yes | optional |
| Vercel CLI | `vercel deploy web --prod` | yes | optional |
| GitHub Pages | Push `web/` to a `gh-pages` branch | needs public repo or Pro | yes |
| Personal VPS | `rsync -az web/ user@host:/var/www/chibi/` | yes | no |

Cloudflare Pages is the most hands-off. Connect it once, and every
`git push` from Linux triggers a deploy. Netlify/Vercel CLI are simpler
if you don't want CI — one command from your shell ships it.

## Installing on the iPad

One-time, per iPad:

1. Open the URL in **Safari** (not Chrome — iOS PWA install only works
   from Safari).
2. Tap the Share icon → **Add to Home Screen**.
3. Confirm the name ("Chibi Runner"). Done. There's an icon on the home
   screen now.
4. Tap the icon. It launches fullscreen, hidden Safari chrome, own
   multitasking card. For all intents and purposes, it's the native app.

First launch caches the bundle via the service worker. After that, the
game works with zero connectivity as long as the cache holds.

## The shipping workflow, from Linux

```bash
# 1. Change code in src/ or game.src.html
# 2. Bump the sw.js cache version ('chibi-runner-v1' → 'v2')
./build-web.sh
netlify deploy --dir=web --prod     # or: git push, if CF Pages is wired
```

The iPad pulls the new version on next launch (or with pull-to-refresh
while in the app).

## iOS PWA caveats worth knowing

- Safari on iPadOS supports PWAs but more grudgingly than Android Chrome.
  `display: standalone` and the `apple-mobile-web-app-*` meta tags are
  what make it feel native.
- Landscape orientation is a hint, not a hard lock. If you want the game
  locked to landscape, the HTML/CSS already sets this via `<meta
  viewport>` and CSS media queries — no extra work.
- WebAudio needs a user tap to start (same as in the native app). Your
  existing `ensureAudio()` on first input handles this.
- Offline works **within the cached assets**. Any `<link>` to Google
  Fonts or external three.js CDN will fail offline. For a truly offline
  experience, inline the three.js module into the build or vendor it as
  `web/three.module.js` and reference it relatively. The current setup
  pulls three.js from `cdnjs.cloudflare.com` via importmap — that's an
  online-only dependency. Swap it for a local copy if you want offline
  parity.

## If you just want a quick-ship without full PWA setup

Skip steps 1, 2, 4. Keep only step 3 (the iOS meta tags). Host `web/`
anywhere. `Add to Home Screen` still works, you get the home-screen
icon and fullscreen mode. You lose offline support, but gain a
ten-minute setup instead of a half-hour one.
