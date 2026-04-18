#!/usr/bin/env python3
"""Build game.html by inlining base64 sprite data into game.src.html."""
import pathlib, sys

root = pathlib.Path(__file__).resolve().parent
src = root / "game.src.html"
out = root / "game.html"

html = src.read_text()

placeholders = {
    "{{HALIL_SPRITE}}": root / "sprites" / "halil.b64",
    "{{LARA_SPRITE}}": root / "sprites" / "lara.b64",
    "{{KAROLCIA_SPRITE}}": root / "sprites" / "karolcia.b64",
}

for tag, path in placeholders.items():
    data = path.read_text().strip()
    if tag not in html:
        print(f"ERROR: placeholder {tag} not found in game.src.html", file=sys.stderr)
        sys.exit(1)
    html = html.replace(tag, data)

out.write_text(html)
print(f"Built {out.name} ({out.stat().st_size / 1_000_000:.1f} MB)")
