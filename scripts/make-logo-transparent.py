from PIL import Image
from pathlib import Path

src = Path("public/brand/logo-source.png")
img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if r > 235 and g > 235 and b > 235:
            pixels[x, y] = (r, g, b, 0)
        elif r > 220 and g > 220 and b > 220:
            dist = ((255 - r) + (255 - g) + (255 - b)) / 3
            alpha = min(255, int(dist * 12))
            if alpha < 40:
                pixels[x, y] = (r, g, b, 0)
            else:
                pixels[x, y] = (r, g, b, alpha)

bbox = img.getbbox()
if bbox:
    img = img.crop(bbox)

out = Path("public/brand/logo.png")
img.save(out, "PNG")
print("logo", img.size, out.stat().st_size)

iw, ih = img.size
icon = img.crop((0, 0, iw, int(ih * 0.42)))
bbox2 = icon.getbbox()
if bbox2:
    icon = icon.crop(bbox2)

side = max(icon.size) + 8
sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
ox = (side - icon.size[0]) // 2
oy = (side - icon.size[1]) // 2
sq.paste(icon, (ox, oy), icon)
mark = Path("public/brand/logo-mark.png")
sq.save(mark, "PNG")
print("mark", sq.size, mark.stat().st_size)

fav = sq.resize((64, 64), Image.Resampling.LANCZOS)
fav.save("public/brand/favicon.png", "PNG")
print("favicon ok")
