#!/usr/bin/env python3
"""Optimize character sprite sheets: crop → repack → pngquant → WebP.

Starts from the 1536x1024 source PNG and:
  1) Crops vertically to the content band
  2) Repacks frames tightly with a small gap between them
  3) Runs pngquant to drop to a paletted PNG (lossy but visually identical for pixel art)
  4) Emits a lossless WebP with the same pixels (usually smaller than the quantized PNG)
  5) Writes sprites/<name>.b64 picking whichever of PNG/WebP is smaller
  6) Overwrites <name>.png with the quantized version so icon/splash generators
     use the same color-reduced source

Tool deps (install once):
  macOS:        brew install pngquant webp
  Arch Linux:   sudo pacman -S pngquant libwebp
  Debian:       sudo apt install pngquant webp

Python deps: Pillow (system-wide or venv). PIL does WebP natively, no cwebp binary needed.

Usage:
    python3 optimize_sprites.py

Output:
    - Overwrites <name>.png (paletted) and sprites/<name>.b64
    - Writes <name>.webp for the web build
    - Prints a JS snippet for src/04-characters.js if crop coordinates changed
"""
import base64
import pathlib
import shutil
import subprocess
import sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent

# (contentTop, contentBottom in source 1536x1024 sheet; crops are frame x,w in that sheet)
CHARS = {
    'halil': {
        'top': 308, 'bottom': 668,
        'crops': [
            {'x': 55, 'w': 200},
            {'x': 260, 'w': 225},
            {'x': 505, 'w': 230},
            {'x': 770, 'w': 195},
            {'x': 1010, 'w': 180},
            {'x': 1235, 'w': 235},
        ],
    },
    'lara': {
        'top': 302, 'bottom': 709,
        'crops': [
            {'x': 30, 'w': 210},
            {'x': 255, 'w': 235},
            {'x': 495, 'w': 245},
            {'x': 755, 'w': 235},
            {'x': 1005, 'w': 235},
            {'x': 1250, 'w': 265},
        ],
    },
    'karolcia': {
        'top': 342, 'bottom': 683,
        'crops': [
            {'x': 70, 'w': 200},
            {'x': 300, 'w': 225},
            {'x': 540, 'w': 225},
            {'x': 760, 'w': 230},
            {'x': 1005, 'w': 240},
            {'x': 1255, 'w': 240},
        ],
    },
}

GAP = 2  # transparent pixel gap between packed frames (nearest-filter sampling won't bleed)
PNGQUANT_QUALITY = '70-100'


def have_tool(name):
    """Return True if `name` is an executable on PATH."""
    return shutil.which(name) is not None


def crop_and_repack(name, spec):
    """Return (PIL.Image packed, [{x, w}] new crops) starting from the raw source sheet.

    If <name>.png is already the packed sheet from a previous run, fall back to
    reading frame widths off it (contentBottom - contentTop becomes 0 -> new_h).
    """
    src_path = ROOT / 'sprites' / f'{name}.png'
    if not src_path.exists():
        return None, None
    src = Image.open(src_path).convert('RGBA')

    # If the source has already been cropped to content, spec coords won't line up.
    # Detect by checking if the source height matches spec's content band.
    source_h = src.size[1]
    expected_h = spec['bottom'] - spec['top']
    # If heights match within a pixel of the expected content band, we're already packed.
    if abs(source_h - expected_h) <= 2:
        # Nothing to do — the PNG is already tight.
        return src, spec['crops']

    content_h = expected_h
    frames_w = sum(c['w'] for c in spec['crops'])
    new_w = frames_w + GAP * (len(spec['crops']) - 1)
    out = Image.new('RGBA', (new_w, content_h), (0, 0, 0, 0))
    new_crops = []
    cursor = 0
    for c in spec['crops']:
        frame = src.crop((c['x'], spec['top'], c['x'] + c['w'], spec['bottom']))
        out.paste(frame, (cursor, 0))
        new_crops.append({'x': cursor, 'w': c['w']})
        cursor += c['w'] + GAP
    return out, new_crops


def run_pngquant(path: pathlib.Path):
    """Quantize in place. Silently leaves the file alone if pngquant is missing or
    if the image can't hit the quality floor — the WebP step will still compress it."""
    if not have_tool('pngquant'):
        print(f'  skip pngquant (not installed): {path.name}', file=sys.stderr)
        return
    result = subprocess.run([
        'pngquant',
        f'--quality={PNGQUANT_QUALITY}',
        '--speed=1',
        '--strip',
        '--force',
        '--output', str(path),
        str(path),
    ])
    if result.returncode != 0:
        # 99 = can't reduce colors below threshold. Keep the truecolor PNG; WebP still wins.
        print(f'  pngquant returned {result.returncode} for {path.name} '
              f'(keeping truecolor, WebP lossless will still shrink)', file=sys.stderr)


def save_webp_lossless(img: Image.Image, path: pathlib.Path):
    img.save(path, 'WEBP', lossless=True, quality=100, method=6)


def main():
    if not have_tool('pngquant'):
        print('WARNING: pngquant not found. Install with '
              '`brew install pngquant` (macOS) or `pacman -S pngquant` (Arch).',
              file=sys.stderr)

    js_blocks = []
    labels = ['idle', 'run 1', 'run 2', 'jump', 'fall', 'land/crouch']

    for name, spec in CHARS.items():
        packed, new_crops = crop_and_repack(name, spec)
        if packed is None:
            print(f'  skip {name}: no source PNG', file=sys.stderr)
            continue

        png_path = ROOT / 'sprites' / f'{name}.png'
        webp_path = ROOT / 'sprites' / f'{name}.webp'
        b64_path = ROOT / 'sprites' / f'{name}.b64'

        # Write the cropped/packed sheet as PNG (truecolor)
        packed.save(png_path, optimize=True, compress_level=9)
        size_truecolor = png_path.stat().st_size

        # Quantize in place (if tool available)
        run_pngquant(png_path)
        size_quantized = png_path.stat().st_size

        # Re-load the quantized PNG and export as lossless WebP
        qimg = Image.open(png_path).convert('RGBA')
        save_webp_lossless(qimg, webp_path)
        size_webp = webp_path.stat().st_size

        # Pick the smaller of the two for the iOS base64 payload
        if size_webp <= size_quantized:
            mime, payload, chosen = 'image/webp', webp_path.read_bytes(), 'webp'
        else:
            mime, payload, chosen = 'image/png', png_path.read_bytes(), 'png'
        b64 = base64.b64encode(payload).decode('ascii')
        b64_path.write_text(f'data:{mime};base64,{b64}')

        print(f'{name:10s}: truecolor PNG {size_truecolor/1024:6.1f}KB  '
              f'→ pngquant {size_quantized/1024:6.1f}KB  '
              f'→ WebP {size_webp/1024:6.1f}KB  '
              f'(.b64 uses {chosen}, {b64_path.stat().st_size/1024:6.1f}KB)')

        # Emit JS crop block for comparison with src/04-characters.js
        crops_str = ',\n      '.join(
            f"{{ x: {c['x']:<5d} w: {c['w']} }}".replace('w:', ', w:')
            + f"  // {label}"
            for c, label in zip(new_crops, labels)
        )
        js_blocks.append(
            f'  // {name}\n'
            f'  contentTop: 0, contentBottom: {packed.size[1]},\n'
            f'  crops: [\n      {crops_str}\n  ],'
        )

    print()
    print('─── if crop coordinates changed, paste into src/04-characters.js ───')
    print('\n\n'.join(js_blocks))


if __name__ == '__main__':
    main()
