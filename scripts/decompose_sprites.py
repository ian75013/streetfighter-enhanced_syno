import os
from PIL import Image

def decompose(image_path, output_dir, prefix):
    if os.path.exists(output_dir):
        import shutil
        shutil.rmtree(output_dir)
    os.makedirs(output_dir)
        
    img = Image.open(image_path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    visited = set()
    sprites = []
    
    def is_magenta(r, g, b, a):
        # Allow slight variations of #FF00FF
        return r > 240 and g < 15 and b > 240
        
    print(f"Scanning {image_path}...")
    for y in range(height):
        for x in range(width):
            if (x, y) not in visited:
                r, g, b, a = pixels[x, y]
                if not is_magenta(r, g, b, a) and a > 0:
                    # Found a new sprite, BFS to find bounding box
                    min_x, min_y, max_x, max_y = x, y, x, y
                    queue = [(x, y)]
                    visited.add((x, y))
                    
                    while queue:
                        cx, cy = queue.pop(0)
                        
                        min_x = min(min_x, cx)
                        min_y = min(min_y, cy)
                        max_x = max(max_x, cx)
                        max_y = max(max_y, cy)
                        
                        for dx, dy in [(0,1), (1,0), (0,-1), (-1,0), (1,1), (1,-1), (-1,1), (-1,-1)]:
                            nx, ny = cx + dx, cy + dy
                            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                                nr, ng, nb, na = pixels[nx, ny]
                                if not is_magenta(nr, ng, nb, na) and na > 0:
                                    visited.add((nx, ny))
                                    queue.append((nx, ny))
                    
                    # filter small noise and giant borders
                    width_box = max_x - min_x
                    height_box = max_y - min_y
                    if width_box > 5 and height_box > 5 and width_box < 300 and height_box < 300:
                        sprites.append((min_x, min_y, max_x, max_y))
    
    # Sort roughly by row (assuming rows are well separated) then by x
    # We will use row chunks of ~50 pixels high to group by row
    sprites.sort(key=lambda s: (s[1] // 60, s[0]))
    
    print(f"Found {len(sprites)} sprites. Saving to {output_dir}...")
    for i, (min_x, min_y, max_x, max_y) in enumerate(sprites):
        sprite_img = Image.new("RGBA", (max_x - min_x + 1, max_y - min_y + 1))
        sprite_pixels = sprite_img.load()
        
        for y in range(min_y, max_y + 1):
            for x in range(min_x, max_x + 1):
                r, g, b, a = pixels[x, y]
                if not is_magenta(r, g, b, a):
                    sprite_pixels[x - min_x, y - min_y] = (r, g, b, a)
                else:
                    sprite_pixels[x - min_x, y - min_y] = (0, 0, 0, 0)
                    
        sprite_img.save(os.path.join(output_dir, f"{prefix}_{i+1:03d}.png"))
    print("Done.")

akuma_img = "/home/yann/.gemini/antigravity/brain/19c87417-0c7f-4b58-b57b-269375e99160/media__1778318720968.png"
ken_img = "/home/yann/.gemini/antigravity/brain/19c87417-0c7f-4b58-b57b-269375e99160/media__1778318721329.png"

decompose(akuma_img, "/home/yann/Documents/Github/streetfighter-enhanced_syno/res/AkumaRaw", "akuma")
decompose(ken_img, "/home/yann/Documents/Github/streetfighter-enhanced_syno/res/KenRaw", "ken")
