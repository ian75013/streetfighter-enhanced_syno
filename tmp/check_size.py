import os
from PIL import Image

for img_name in sorted(os.listdir('res/KenRaw'))[1:6]:
    path = os.path.join('res/KenRaw', img_name)
    with Image.open(path) as img:
        print(f"{img_name}: {img.size}")
