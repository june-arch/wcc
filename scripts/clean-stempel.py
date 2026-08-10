# Bersihkan stempel user: flood-fill transparan dari corner + crop + resize 512
from PIL import Image
from collections import deque

SRC = r"C:\Users\JunSu\AppData\Roaming\Hermes\composer-images\composer_2026-08-10_05-56-51-146_8ac01e.png"
OUT = r"D:\web\junearch\wcc\public\stempel-wcc.png"

im = Image.open(SRC).convert("RGBA")
w, h = im.size
px = im.load()

# flood fill dari semua sisi: hapus piksel semi-transparan / cukup terang yang tersambung
def is_bg(r, g, b, a):
    # background = alpha sangat rendah ATAU sangat terang (putih/abu) dengan alpha rendah-menengah
    if a < 60:
        return True
    if r > 235 and g > 235 and b > 235 and a < 200:
        return True
    return False

visited = set()
q = deque()
# seed dari semua tepi
for x in range(w):
    q.append((x, 0)); q.append((x, h - 1))
for y in range(h):
    q.append((0, y)); q.append((w - 1, y))

while q:
    x, y = q.popleft()
    if (x, y) in visited or not (0 <= x < w and 0 <= y < h):
        continue
    r, g, b, a = px[x, y]
    if is_bg(r, g, b, a):
        visited.add((x, y))
        px[x, y] = (0, 0, 0, 0)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q.append((x + dx, y + dy))

bbox = im.getbbox()
print("bbox setelah clean:", bbox)
im = im.crop(bbox) if bbox else im

# resize jadi 512x512 (isi tengah, proporsional)
size = 512
canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
ratio = min(size / im.width, size / im.height)
nw, nh = int(im.width * ratio), int(im.height * ratio)
im2 = im.resize((nw, nh), Image.LANCZOS)
canvas.paste(im2, ((size - nw) // 2, (size - nh) // 2), im2)
canvas.save(OUT)
print("saved:", OUT, canvas.size)

# verifikasi warna
import collections
orange = 0
for x in range(0, size, 3):
    for y in range(0, size, 3):
        r, g, b, a = canvas.getpixel((x, y))
        if a > 100 and r > 140 and 40 < g < 180 and b < 110:
            orange += 1
print("piksel oranye (sampling 3px):", orange)
