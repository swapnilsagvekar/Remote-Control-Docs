from PIL import Image
import sys

path = sys.argv[1]
target_w = int(sys.argv[2]) if len(sys.argv) > 2 else 500
max_h = int(sys.argv[3]) if len(sys.argv) > 3 else 800

img = Image.open(path)
w, h = img.size

# Prefer full readable width; only shrink if the chart becomes too tall.
nw = target_w
nh = max(1, round(h * target_w / w))

if nh > max_h:
    scale = max_h / h
    nw = max(1, round(w * scale))
    nh = max_h

if (nw, nh) != (w, h):
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    img.save(path)

print(img.size)
