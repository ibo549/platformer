from PIL import Image, ImageDraw, ImageFilter
import random, sys

# Character data matching game.src.html characterData
CHARACTERS = {
    'halil': {
        'file': 'halil.png',
        'crop_x': 55, 'crop_w': 200,
        'content_top': 308, 'content_bottom': 668,
        'mirror': False,
    },
    'lara': {
        'file': 'lara.png',
        'crop_x': 30, 'crop_w': 210,
        'content_top': 302, 'content_bottom': 709,
        'mirror': False,
    },
    'karolcia': {
        'file': 'karolcia.png',
        'crop_x': 70, 'crop_w': 200,
        'content_top': 342, 'content_bottom': 683,
        'mirror': True,
    },
}

# Parse argument
char_key = sys.argv[1] if len(sys.argv) > 1 else 'lara'
if char_key not in CHARACTERS:
    print(f"Unknown character '{char_key}'. Choose from: {', '.join(CHARACTERS.keys())}")
    sys.exit(1)

char = CHARACTERS[char_key]
root = '/Users/halil.karaca/Desktop/platformer'

# Load sprite sheet and extract idle frame
sheet = Image.open(f'{root}/{char["file"]}').convert('RGBA')
content_h = char['content_bottom'] - char['content_top']
frame = sheet.crop((char['crop_x'], char['content_top'],
                    char['crop_x'] + char['crop_w'], char['content_bottom']))
if char['mirror']:
    frame = frame.transpose(Image.FLIP_LEFT_RIGHT)

# Create 1024x1024 icon
size = 1024
icon = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(icon)

# Dark navy/purple gradient background
for y in range(size):
    r = int(10 + (26 - 10) * y / size)
    g = int(10 + (26 - 10) * y / size)
    b = int(26 + (58 - 26) * y / size)
    draw.line([(0, y), (size - 1, y)], fill=(r, g, b, 255))

# Add pixel stars
random.seed(42)
star_color = (255, 224, 102, 200)
for _ in range(40):
    sx = random.randint(20, size - 20)
    sy = random.randint(20, int(size * 0.6))
    ss = random.choice([2, 3, 4])
    draw.rectangle([sx, sy, sx + ss, sy + ss], fill=star_color)
    # Cross shape for some
    if ss >= 3 and random.random() > 0.5:
        draw.rectangle([sx - ss, sy + ss//2, sx + ss*2, sy + ss//2 + 1], fill=star_color)
        draw.rectangle([sx + ss//2, sy - ss, sx + ss//2 + 1, sy + ss*2], fill=star_color)

# Draw green platform
platform_y = int(size * 0.75)
platform_color = (82, 183, 136, 255)
platform_dark = (45, 106, 79, 255)
platform_bright = (120, 220, 170, 255)
# Platform blocks
block_w = 40
for bx in range(0, size, block_w):
    draw.rectangle([bx, platform_y, bx + block_w - 2, platform_y + 30], fill=platform_color)
    draw.rectangle([bx, platform_y, bx + block_w - 2, platform_y + 4], fill=platform_bright)
    draw.rectangle([bx, platform_y + 26, bx + block_w - 2, platform_y + 30], fill=platform_dark)

# Ground below platform
for y in range(platform_y + 30, size):
    shade = max(0, 20 - (y - platform_y - 30) // 5)
    draw.line([(0, y), (size - 1, y)], fill=(shade, shade + 5, shade, 255))

# Scale and place character on the platform
char_height = int(size * 0.55)
char_width = int(frame.width * char_height / frame.height)
frame_resized = frame.resize((char_width, char_height), Image.NEAREST)

# Center horizontally, place on platform
char_x = (size - char_width) // 2
char_y = platform_y - char_height + 5  # feet on platform

icon.paste(frame_resized, (char_x, char_y), frame_resized)

# Add a gold coin near top-right
coin_x, coin_y = int(size * 0.78), int(size * 0.12)
coin_size = 40
draw.ellipse([coin_x, coin_y, coin_x + coin_size, coin_y + coin_size], fill=(255, 224, 102, 255))
draw.ellipse([coin_x + 6, coin_y + 6, coin_x + coin_size - 6, coin_y + coin_size - 6], fill=(240, 160, 48, 255))
draw.ellipse([coin_x + 12, coin_y + 12, coin_x + coin_size - 12, coin_y + coin_size - 12], fill=(255, 224, 102, 255))

# Round corners
corner_radius = 220
mask = Image.new('L', (size, size), 0)
mask_draw = ImageDraw.Draw(mask)
mask_draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=corner_radius, fill=255)
icon.putalpha(mask)

# Save
out_dir = f'{root}/PlatformerApp/PlatformerApp/Assets'
icon.save(f'{out_dir}/AppIcon1024.png')

# Generate other sizes
for s in [180, 167, 152, 120, 76]:
    cr = int(corner_radius * s / size)
    small = icon.resize((s, s), Image.NEAREST if s < 200 else Image.LANCZOS)
    # Re-apply rounded corners at the new size
    m = Image.new('L', (s, s), 0)
    md = ImageDraw.Draw(m)
    md.rounded_rectangle([0, 0, s - 1, s - 1], radius=cr, fill=255)
    small.putalpha(m)
    small.save(f'{out_dir}/AppIcon{s}.png')

print(f"All icons generated with {char_key}'s sprite!")
