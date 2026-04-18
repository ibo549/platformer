#!/usr/bin/env python3
"""Build game.html from the src/ modules + inline sprite data URLs into game.src.html."""
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent
src_html = root / "game.src.html"
out = root / "game.html"
src_dir = root / "src"

html = src_html.read_text()

# ── Step 1: concatenate JS modules into {{GAME_JS}} ──────────────────
js_files = sorted(src_dir.glob("*.js"))
if not js_files:
    print("ERROR: no files in src/ to concatenate", file=sys.stderr)
    sys.exit(1)

parts = []
for p in js_files:
    parts.append(f"// ───────────── {p.name} ─────────────")
    parts.append(p.read_text().rstrip())
js_blob = "\n\n".join(parts)

if "{{GAME_JS}}" not in html:
    print("ERROR: {{GAME_JS}} placeholder not found in game.src.html", file=sys.stderr)
    sys.exit(1)
html = html.replace("{{GAME_JS}}", js_blob)

# ── Step 2: inline sprite data URLs (referenced from src/04-characters.js) ──
placeholders = {
    "{{HALIL_SPRITE}}": root / "sprites" / "halil.b64",
    "{{LARA_SPRITE}}": root / "sprites" / "lara.b64",
    "{{KAROLCIA_SPRITE}}": root / "sprites" / "karolcia.b64",
}
for tag, path in placeholders.items():
    if tag not in html:
        print(f"ERROR: placeholder {tag} not found in game.src.html", file=sys.stderr)
        sys.exit(1)
    html = html.replace(tag, path.read_text().strip())

out.write_text(html)
size_mb = out.stat().st_size / 1_000_000
print(f"Built {out.name} ({size_mb:.1f} MB, {len(js_files)} JS modules concatenated)")
