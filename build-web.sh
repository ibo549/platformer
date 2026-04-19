#!/usr/bin/env python3
"""Build the web distribution (external assets, no base64 inlining).

Output goes to web/ — a directory you can upload anywhere static (GitHub Pages,
Netlify, a blog CDN, whatever). Sprites load as ordinary HTTP requests, so the
HTML is tiny and the browser can cache each asset separately.

  web/
  ├── index.html       # ~140KB — HTML + CSS + inlined src/*.js (no sprite data)
  ├── halil.webp       # ~150KB each — loaded on demand
  ├── lara.webp
  └── karolcia.webp

Runs on macOS and Linux. Only stdlib + Python3. Produces the same .webp files
you already built for the iOS bundle — if they're missing, this warns and falls
back to .png (you can regenerate the optimized sprites via optimize_sprites.py).

Usage:
    python3 build-web.sh        # or just ./build-web.sh
"""
import pathlib
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC_DIR = ROOT / 'src'
WEB_DIR = ROOT / 'web'
GAME_SRC = ROOT / 'game.src.html'
WEB_ASSETS = ROOT / 'web-assets'  # manifest, icons — copied verbatim into web/

# Sprite placeholders and their source filename (without extension)
SPRITES = {
    '{{HALIL_SPRITE}}': 'halil',
    '{{LARA_SPRITE}}': 'lara',
    '{{KAROLCIA_SPRITE}}': 'karolcia',
}


def pick_sprite(name):
    """Return path to preferred sprite file (.webp if available, else .png)."""
    webp = ROOT / 'sprites' / f'{name}.webp'
    png = ROOT / 'sprites' / f'{name}.png'
    if webp.exists():
        return webp
    if png.exists():
        print(f'  WARNING: {webp.name} missing, falling back to {png.name} '
              f'(run optimize_sprites.py for smaller assets)', file=sys.stderr)
        return png
    print(f'ERROR: no {webp.name} or {png.name} in sprites/', file=sys.stderr)
    sys.exit(1)


def main():
    if not GAME_SRC.exists():
        print(f'ERROR: missing {GAME_SRC}', file=sys.stderr)
        sys.exit(1)

    WEB_DIR.mkdir(exist_ok=True)

    html = GAME_SRC.read_text()

    # 1) Concatenate src/*.js in filename-sort order into {{GAME_JS}}
    js_files = sorted(SRC_DIR.glob('*.js'))
    if not js_files:
        print(f'ERROR: no JS modules in {SRC_DIR}', file=sys.stderr)
        sys.exit(1)
    parts = []
    for p in js_files:
        parts.append(f'// ───────────── {p.name} ─────────────')
        parts.append(p.read_text().rstrip())
    js_blob = '\n\n'.join(parts)
    if '{{GAME_JS}}' not in html:
        print('ERROR: {{GAME_JS}} placeholder not found in game.src.html', file=sys.stderr)
        sys.exit(1)
    html = html.replace('{{GAME_JS}}', js_blob)

    # 2) Replace sprite placeholders with plain relative URLs and copy the files
    for placeholder, name in SPRITES.items():
        if placeholder not in html:
            print(f'ERROR: placeholder {placeholder} not found', file=sys.stderr)
            sys.exit(1)
        src_file = pick_sprite(name)
        dest = WEB_DIR / src_file.name
        shutil.copy2(src_file, dest)
        html = html.replace(placeholder, src_file.name)

    # 3) Write the HTML
    out_html = WEB_DIR / 'index.html'
    out_html.write_text(html)

    # 4) Copy PWA assets (manifest, icons) verbatim
    pwa_items = []
    if WEB_ASSETS.exists():
        for p in sorted(WEB_ASSETS.iterdir()):
            if p.is_file():
                dest = WEB_DIR / p.name
                shutil.copy2(p, dest)
                pwa_items.append(p.name)

    # 5) Report sizes
    total = out_html.stat().st_size
    items = [('index.html', out_html.stat().st_size)]
    for name in SPRITES.values():
        path = WEB_DIR / pick_sprite(name).name
        items.append((path.name, path.stat().st_size))
        total += path.stat().st_size
    for name in pwa_items:
        path = WEB_DIR / name
        items.append((path.name, path.stat().st_size))
        total += path.stat().st_size

    print()
    for n, s in items:
        print(f'  web/{n:<20s}  {s/1024:7.1f} KB')
    print(f'  {"total":<24s}  {total/1024:7.1f} KB '
          f'({total/1_000_000:.2f} MB)')
    print(f'\n  → upload web/ to any static host. index.html is the entry point.')


if __name__ == '__main__':
    main()
