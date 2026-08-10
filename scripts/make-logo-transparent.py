# Buat logo transparan dari gambar user (hapus background putih via flood fill dari sudut)
from PIL import Image
from collections import deque

SRC = r"C:\Users\JunSu\AppData\Roaming\Hermes\composer-images\composer_2026-08-10_05-29-32-129_f4f2dc.png"
OUT = r"D:\web\junearch\wcc\public\logo-kwitansi.png"

im = Image.open(SRC).convert("RGBA")
w, h = im.size
px = im.load()

# flood fill dari semua sudut: hapus piksel yang "cukup putih" dan tersambung
WHITE_THRESHOLD = 235
visited = set()
q = deque()
for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (0, h // 2), (w // 2, h - 1), (w - 1, h // 2)]:
    q.append((x, y))

while q:
    x, y = q.popleft()
    if (x, y) in visited or not (0 <= x < w and 0 <= y < h):
        continue
    r, g, b, a = px[x, y]
    if a < 40 or (r >= WHITE_THRESHOLD and g >= WHITE_THRESHOLD and b >= WHITE_THRESHOLD):
        visited.add((x, y))
        px[x, y] = (0, 0, 0, 0)  # transparan
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q.append((x + dx, y + dy))

# crop ke bounding box konten
bbox = im.getbbox()
print("bbox:", bbox)
im = im.crop(bbox) if bbox else im

# resize jadi 512x512 (kotak, isi tengah)
size = 512
canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
ratio = min(size / im.width, size / im.height)
nw, nh = int(im.width * ratio), int(im.height * ratio)
im2 = im.resize((nw, nh), Image.LANCZOS)
canvas.paste(im2, ((size - nw) // 2, (size - nh) // 2), im2)
canvas.save(OUT)
print("saved:", OUT, canvas.size)
