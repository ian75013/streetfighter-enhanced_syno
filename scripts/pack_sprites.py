import json
import os
from PIL import Image

def generate_plist(prefix, frames_info, tex_width, tex_height):
    plist = []
    plist.append('<?xml version="1.0" encoding="UTF-8"?>')
    plist.append('<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">')
    plist.append('<plist version="1.0">')
    plist.append('    <dict>')
    plist.append('        <key>frames</key>')
    plist.append('        <dict>')
    
    # Add full sprite entry if needed (not strictly needed by Cocos but sometimes expected)
    # the game actually uses akuma.png as the first frame in plist, but let's skip unless error
    
    for info in frames_info:
        plist.append(f'            <key>{info["name"]}</key>')
        plist.append('            <dict>')
        plist.append('                <key>frame</key>')
        plist.append(f'                <string>{{{{{info["x"]},{info["y"]}}},{{{info["w"]},{info["h"]}}}}}</string>')
        plist.append('                <key>offset</key>')
        # Bottom aligned pivot assumption for fighter games
        # offset is from center of sourceSize to center of trimmed sprite
        # In cocos, offset = (trimCenter - origCenter)
        plist.append('                <string>{0,0}</string>')
        plist.append('                <key>rotated</key>')
        plist.append('                <false/>')
        plist.append('                <key>sourceColorRect</key>')
        plist.append(f'                <string>{{{{0,0}},{{{info["w"]},{info["h"]}}}}}</string>')
        plist.append('                <key>sourceSize</key>')
        plist.append(f'                <string>{{{info["w"]},{info["h"]}}}</string>')
        plist.append('            </dict>')
        
    plist.append('        </dict>')
    plist.append('        <key>metadata</key>')
    plist.append('        <dict>')
    plist.append('            <key>format</key>')
    plist.append('            <integer>2</integer>')
    plist.append('            <key>realTextureFileName</key>')
    plist.append(f'            <string>{prefix}.png</string>')
    plist.append('            <key>size</key>')
    plist.append(f'            <string>{{{tex_width},{tex_height}}}</string>')
    plist.append('            <key>textureFileName</key>')
    plist.append(f'            <string>{prefix}.png</string>')
    plist.append('        </dict>')
    plist.append('    </dict>')
    plist.append('</plist>')
    return "\n".join(plist)

def pack_character(char_key, output_prefix, raw_dir):
    try:
        with open("mapping.json", "r") as f:
            mapping = json.load(f)[char_key]
    except FileNotFoundError:
        print(f"mapping.json not found! Using first 50 frames for {char_key} as fallback.")
        mapping = {str(i): i for i in range(1, 51)}
        
    sprites = []
    max_h = 0
    total_w = 0
    
    for i in range(1, 51):
        raw_idx = mapping.get(str(i), i)
        raw_path = os.path.join(raw_dir, f"{char_key}_{raw_idx:03d}.png")
        if not os.path.exists(raw_path):
            print(f"Warning: {raw_path} not found!")
            continue
            
        img = Image.open(raw_path)
        sprites.append((i, img))
        max_h = max(max_h, img.size[1])
        total_w += img.size[0] + 2 # 2px padding
        
    # Create packed image
    # To keep it simple, we'll pack into a wide strip or a fixed width grid
    TEX_WIDTH = 1024
    TEX_HEIGHT = 1024
    packed = Image.new("RGBA", (TEX_WIDTH, TEX_HEIGHT), (0,0,0,0))
    
    x = 2
    y = 2
    row_h = 0
    frames_info = []
    
    for frame_idx, img in sprites:
        w, h = img.size
        if x + w + 2 > TEX_WIDTH:
            x = 2
            y += row_h + 2
            row_h = 0
            
        packed.paste(img, (x, y))
        frames_info.append({
            "name": f"{char_key}_{frame_idx:02d}.png",
            "x": x,
            "y": y,
            "w": w,
            "h": h
        })
        
        x += w + 2
        row_h = max(row_h, h)
        
    actual_height = y + row_h + 2
    packed = packed.crop((0, 0, TEX_WIDTH, actual_height))
    
    # Save PNG
    out_png = f"res/{output_prefix}.png"
    packed.save(out_png)
    print(f"Saved {out_png}")
    
    # Save Plist
    out_plist = f"res/{output_prefix}.plist"
    plist_content = generate_plist(output_prefix, frames_info, TEX_WIDTH, actual_height)
    with open(out_plist, "w") as f:
        f.write(plist_content)
    print(f"Saved {out_plist}")

pack_character("ken", "running", "res/KenRaw")
pack_character("akuma", "akuma-running", "res/AkumaRaw")
