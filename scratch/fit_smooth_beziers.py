import numpy as np
from PIL import Image
import subprocess

# Load image
img = Image.open('/home/jabs/.gemini/antigravity/brain/73a86177-8992-43f9-950d-59d24b90bafd/.user_uploaded/media_1793806559829_0252ae30.png').convert('RGB')
arr = np.array(img)
is_bg = np.all(arr > 240, axis=2)
visited = np.zeros((612, 612), dtype=bool)

components = []
for y in range(0, 612):
    for x in range(0, 612):
        if not is_bg[y, x] and not visited[y, x]:
            comp_pixels = []
            queue = [(y, x)]
            visited[y, x] = True
            while queue:
                cy, cx = queue.pop()
                comp_pixels.append((cy, cx))
                for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < 612 and 0 <= nx < 612:
                        if not is_bg[ny, nx] and not visited[ny, nx]:
                            visited[ny, nx] = True
                            queue.append((ny, nx))
            if len(comp_pixels) > 500:
                pix = np.array(comp_pixels)
                colors = arr[pix[:, 0], pix[:, 1]]
                mean_col = np.median(colors, axis=0).astype(int)
                hex_col = f'#{mean_col[0]:02x}{mean_col[1]:02x}{mean_col[2]:02x}'
                components.append((len(comp_pixels), hex_col, pix))

def trace_component(pix):
    mask = np.zeros((614, 614), dtype=bool)
    mask[pix[:, 0] + 1, pix[:, 1] + 1] = True
    ys, xs = np.where(mask)
    start_y, start_x = ys[0], xs[0]
    dirs = [(0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1), (-1, 0), (-1, 1)]
    points = []
    curr = (start_y, start_x)
    points.append((curr[1]-1, curr[0]-1))
    backtrack = 4
    for _ in range(30000):
        found = False
        start_d = (backtrack + 2) % 8
        for i in range(8):
            d = (start_d + i) % 8
            ny, nx = curr[0] + dirs[d][0], curr[1] + dirs[d][1]
            if mask[ny, nx]:
                curr = (ny, nx)
                points.append((curr[1]-1, curr[0]-1))
                backtrack = (d + 4) % 8
                found = True
                break
        if not found or curr == (start_y, start_x):
            break
    return points

# Catmull-Rom to cubic Bezier converter
def catmull_rom_to_bezier(pts):
    if len(pts) < 3:
        return 'M ' + ' L '.join(f'{p[0]:.1f},{p[1]:.1f}' for p in pts) + ' Z'
    
    n = len(pts)
    d = [f'M {pts[0][0]:.2f},{pts[0][1]:.2f}']
    
    for i in range(n):
        p0 = pts[(i - 1) % n]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n]
        
        # Tangents
        t1x = (p2[0] - p0[0]) * 0.5
        t1y = (p2[1] - p0[1]) * 0.5
        t2x = (p3[0] - p1[0]) * 0.5
        t2y = (p3[1] - p1[1]) * 0.5
        
        # Bezier control points
        cp1x = p1[0] + t1x / 3.0
        cp1y = p1[1] + t1y / 3.0
        cp2x = p2[0] - t2x / 3.0
        cp2y = p2[1] - t2y / 3.0
        
        d.append(f'C {cp1x:.2f},{cp1y:.2f} {cp2x:.2f},{cp2y:.2f} {p2[0]:.2f},{p2[1]:.2f}')
        
    d.append('Z')
    return ' '.join(d)

cx, cy = 306.0, 305.0
scale = 0.205

svg_elements = []
for i, (size, hex_col, pix) in enumerate(sorted(components, key=lambda x: -x[0])):
    raw_pts = trace_component(pix)
    # Subsample points evenly around the perimeter for a pristine smooth curve
    # 12 to 24 key control points are ideal for fluid organic curves
    step = max(1, len(raw_pts) // 18)
    subsampled = [raw_pts[k] for k in range(0, len(raw_pts), step)]
    
    # Scale to 100x100
    norm_pts = [(50.0 + (p[0] - cx) * scale, 50.0 + (p[1] - cy) * scale) for p in subsampled]
    
    bezier_d = catmull_rom_to_bezier(norm_pts)
    svg_elements.append(f'  <path id="petal_{i+1}" d="{bezier_d}" fill="{hex_col}" />')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <!-- Subtle circular backdrop -->
  <rect width="100" height="100" rx="22" fill="#08090a" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
  <g>
{chr(10).join(svg_elements)}
  </g>
</svg>'''

with open('/mnt/Development/Linux/repo/omnistore-ai/scratch/smooth_logo.svg', 'w') as f:
    f.write(svg_content)

# Render to PNG using ImageMagick
subprocess.run(['magick', '/mnt/Development/Linux/repo/omnistore-ai/scratch/smooth_logo.svg', '/mnt/Development/Linux/repo/omnistore-ai/scratch/smooth_logo.png'])
print('Generated and rendered smooth_logo.svg & smooth_logo.png successfully!')
