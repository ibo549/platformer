from PIL import Image, ImageDraw, ImageFont
import random, sys

# Character data — crops point at the idle frame on the packed sprite sheets
# (the ones optimize_sprites.py writes to sprites/). Each packed sheet has the
# idle frame at x=0 and is cropped vertically to the character's content band.
CHARACTERS = {
    'halil': {
        'file': 'sprites/halil.png',
        'crop_x': 0, 'crop_w': 200,
        'content_top': 0, 'content_bottom': 360,
        'mirror': False,
    },
    'lara': {
        'file': 'sprites/lara.png',
        'crop_x': 0, 'crop_w': 210,
        'content_top': 0, 'content_bottom': 407,
        'mirror': False,
    },
    'karolcia': {
        'file': 'sprites/karolcia.png',
        'crop_x': 0, 'crop_w': 200,
        'content_top': 0, 'content_bottom': 341,
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

def make_splash(width, height, filename):
    img = Image.new('RGBA', (width, height), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    # Gradient background
    for y in range(height):
        r = int(10 + (15 - 10) * y / height)
        g = int(10 + (12 - 10) * y / height)
        b = int(26 + (41 - 26) * y / height)
        draw.line([(0, y), (width - 1, y)], fill=(r, g, b, 255))

    # Stars
    random.seed(123)
    for _ in range(80):
        sx = random.randint(10, width - 10)
        sy = random.randint(10, int(height * 0.55))
        ss = random.choice([2, 3, 4])
        draw.rectangle([sx, sy, sx + ss, sy + ss], fill=(255, 224, 102, 180))

    # Title text
    try:
        title_size = min(width, height) // 10
        sub_size = title_size // 2
        font = ImageFont.truetype('/System/Library/Fonts/SFNSMono.ttf', title_size)
        subfont = ImageFont.truetype('/System/Library/Fonts/SFNSMono.ttf', sub_size)
    except:
        font = ImageFont.load_default()
        subfont = font

    title = "CHIBI RUNNER"
    subtitle = "Pixel Platformer"

    # Center title
    title_bbox = draw.textbbox((0, 0), title, font=font)
    title_w = title_bbox[2] - title_bbox[0]
    title_h = title_bbox[3] - title_bbox[1]
    tx = (width - title_w) // 2
    ty = int(height * 0.12)

    # Shadow
    draw.text((tx + 3, ty + 3), title, fill=(50, 30, 0, 200), font=font)
    draw.text((tx, ty), title, fill=(255, 224, 102, 255), font=font)

    # Subtitle
    sub_bbox = draw.textbbox((0, 0), subtitle, font=subfont)
    sub_w = sub_bbox[2] - sub_bbox[0]
    draw.text(((width - sub_w) // 2, ty + title_h + 20), subtitle, fill=(136, 136, 136, 255), font=subfont)

    # Green platform in center
    plat_y = int(height * 0.78)
    plat_w = int(width * 0.5)
    plat_x = (width - plat_w) // 2
    block = 30
    for bx in range(plat_x, plat_x + plat_w, block):
        draw.rectangle([bx, plat_y, bx + block - 2, plat_y + 20], fill=(82, 183, 136, 255))
        draw.rectangle([bx, plat_y, bx + block - 2, plat_y + 4], fill=(120, 220, 170, 255))

    # Place character centered on platform
    char_h = int(height * 0.45)
    char_w = int(frame.width * char_h / frame.height)
    resized = frame.resize((char_w, char_h), Image.NEAREST)
    cx = (width - char_w) // 2
    cy = plat_y - char_h + 5
    img.paste(resized, (cx, cy), resized)

    img = img.convert('RGB')
    out_dir = f'{root}/PlatformerApp/PlatformerApp/Assets'
    img.save(f'{out_dir}/{filename}')
    print(f"Saved {filename} ({width}x{height}) with {char_key}'s sprite")

make_splash(2732, 2048, 'LaunchImage.png')
make_splash(2048, 2732, 'LaunchImagePortrait.png')
