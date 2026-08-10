# Generate stempel oranye bulat "WCC ORANYE CAPTURE" (transparan)
from PIL import Image, ImageDraw, ImageFont
import math

SIZE = 600
CENTER = SIZE // 2
OUT = r"D:\web\junearch\wcc\public\stempel-wcc.png"

img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# warna stempel: oranye (F97316)
col = (249, 115, 22, 255)

# lingkaran luar & dalam
r_out = 280
r_in = 235
d.ellipse([CENTER - r_out, CENTER - r_out, CENTER + r_out, CENTER + r_out], outline=col, width=14)
d.ellipse([CENTER - r_in, CENTER - r_in, CENTER + r_in, CENTER + r_in], outline=col, width=4)

# font
def font(sz, bold=False):
    import os
    path = r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf"
    return ImageFont.truetype(path, sz)

f_bold = font(44, bold=True)
f_reg = font(34)

# teks melengkung atas: "WCC ORANYE CAPTURE"
text_top = "WCC ORANYE CAPTURE"
r_text = (r_out + r_in) // 2  # radius teks
n = len(text_top)
angle_step = 10.0  # derajat per karakter (approx)
start_angle = 180 + (n * angle_step) / 2  # mulai dari kiri bawah, naik ke atas

for i, ch in enumerate(text_top):
    ang = math.radians(start_angle - i * angle_step)  # 180 = kiri, 0 = kanan (lewati atas)
    x = CENTER + r_text * math.cos(ang)
    y = CENTER - r_text * math.sin(ang)
    # rotasi karakter agar tegak lurus lingkaran
    tang = math.degrees(math.atan2(-math.cos(ang), math.sin(ang)))
    # render char ke tile kecil lalu rotate
    tile = Image.new("RGBA", (80, 80), (0, 0, 0, 0))
    td = ImageDraw.Draw(tile)
    td.text((40, 40), ch, font=f_bold, fill=col, anchor="mm")
    tile = tile.rotate(-tang, resample=Image.BICUBIC, expand=False)
    img.paste(tile, (int(x) - 40, int(y) - 40), tile)

# teks melengkung bawah (terbalik): "KWIITANSI"
text_bot = "KWIITANSI"
n2 = len(text_bot)
start_angle2 = 360 - (n2 * angle_step) / 2  # mulai dari kanan bawah
for i, ch in enumerate(text_bot):
    ang = math.radians(start_angle2 + i * angle_step)
    x = CENTER + r_text * math.cos(ang)
    y = CENTER - r_text * math.sin(ang)
    tang = math.degrees(math.atan2(-math.cos(ang), math.sin(ang)))
    tile = Image.new("RGBA", (80, 80), (0, 0, 0, 0))
    td = ImageDraw.Draw(tile)
    td.text((40, 40), ch, font=f_reg, fill=col, anchor="mm")
    tile = tile.rotate(-tang, resample=Image.BICUBIC, expand=False)
    img.paste(tile, (int(x) - 40, int(y) - 40), tile)

# tengah: nama pemilik
d.text((CENTER, CENTER - 30), "Riska Yulanda", font=f_bold, fill=col, anchor="mm")
d.text((CENTER, CENTER + 25), "Saputri", font=f_bold, fill=col, anchor="mm")

img.save(OUT)
print("stempel saved:", OUT)
