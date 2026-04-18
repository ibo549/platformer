#!/usr/bin/env python3
"""Optimize character sprite sheets by cropping to content band and repacking frames.

Original sheets are 1536x1024 with the character in a thin horizontal band (~300-400px
tall) and significant dead space between the 6 frames. This script:
  1) Crops vertically to the content band
  2) Repacks frames tightly with a small gap between them
  3) Writes optimized PNG with max compression
  4) Emits a JS snippet with new crop coordinates for characterData

Usage:
    python3 optimize_sprites.py

Output:
    Writes <name>.png (overwrites source sheets) and prints new crop data.
"""
import base64
import pathlib
import sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent

# (name, contentTop, contentBottom, crops) — sourced from game.src.html characterData
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

GAP = 2  # transparent pixels between frames (nearest-neighbor sampling won't bleed)

def main():
    print()
    js_lines = []
    for name, spec in CHARS.items():
        src_path = ROOT / f'{name}.png'
        if not src_path.exists():
            print(f'  skip {name}: no source PNG', file=sys.stderr)
            continue
        src = Image.open(src_path).convert('RGBA')
        content_h = spec['bottom'] - spec['top']

        # Compute new width = sum of frame widths + gaps
        frames_w = sum(c['w'] for c in spec['crops'])
        new_w = frames_w + GAP * (len(spec['crops']) - 1)
        new_h = content_h

        # Build new image by copying each frame into place
        out = Image.new('RGBA', (new_w, new_h), (0, 0, 0, 0))
        new_crops = []
        cursor = 0
        for c in spec['crops']:
            frame = src.crop((c['x'], spec['top'], c['x'] + c['w'], spec['bottom']))
            out.paste(frame, (cursor, 0))
            new_crops.append({'x': cursor, 'w': c['w']})
            cursor += c['w'] + GAP

        out_path = ROOT / f'{name}.png'
        out.save(out_path, optimize=True, compress_level=9)
        size_kb = out_path.stat().st_size / 1024
        old_size_kb = src_path.stat().st_size / 1024 if src_path.exists() else 0

        # Regenerate b64
        b64_path = ROOT / 'sprites' / f'{name}.b64'
        data = base64.b64encode(out_path.read_bytes()).decode('ascii')
        b64_path.write_text(f'data:image/png;base64,{data}')
        b64_kb = b64_path.stat().st_size / 1024

        print(f'{name:10s}: {src.size} -> ({new_w}, {new_h}), '
              f'PNG {size_kb:.1f}KB, .b64 {b64_kb:.1f}KB')

        crop_str = ',\n      '.join(
            f"{{ x: {c['x']:<5d} w: {c['w']} }},  // {label}".replace("w:", ", w:")
            for c, label in zip(new_crops, ['idle', 'run 1', 'run 2', 'jump', 'fall', 'land/crouch'])
        )
        js_lines.append(f'// {name}\n'
                        f'  contentTop: 0, contentBottom: {new_h},\n'
                        f'  crops: [\n      {crop_str}\n  ],')

    print()
    print('─── paste into src/04-characters.js (or let the script patch for you) ───')
    for j in js_lines:
        print(j)
        print()

if __name__ == '__main__':
    main()
