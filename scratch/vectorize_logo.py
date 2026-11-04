import numpy as np
from PIL import Image

img = Image.open('/home/jabs/.gemini/antigravity/brain/73a86177-8992-43f9-950d-59d24b90bafd/.user_uploaded/media_1793806559829_0252ae30.png').convert('RGB')
arr = np.array(img)
h, w, _ = arr.shape

# Main palette in user image
palette = [
    ('wine', '#6a3f49', (106, 63, 73)),
    ('bronze_dot', '#5a5746', (90, 87, 70)),
    ('teal', '#526569', (82, 101, 105)),
    ('light_sage', '#abae99', (171, 174, 153)),
    ('sand', '#cab695', (202, 182, 149)),
    ('crimson', '#975151', (151, 81, 81)),
    ('olive', '#788166', (120, 129, 102)),
    ('slate_blue', '#96a8b4', (150, 168, 180)),
    ('amber', '#c1793f', (193, 121, 63)),
]

def trace_boundary(mask):
    # Pad mask to avoid edge issues
    padded = np.pad(mask, 1, mode='constant', constant_values=0)
    
    # Find first point
    ys, xs = np.where(padded)
    if len(ys) == 0:
        return []
    
    # Start at topmost-leftmost pixel
    start_y, start_x = ys[0], xs[0]
    
    # 8-direction offsets: E, SE, S, SW, W, NW, N, NE
    dirs = [(0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1), (-1, 0), (-1, 1)]
    
    points = []
    curr = (start_y, start_x)
    points.append((curr[1]-1, curr[0]-1))
    
    # Backtrack direction (started from outside, so entering from west)
    backtrack = 4
    
    while True:
        found = False
        start_d = (backtrack + 2) % 8
        for i in range(8):
            d = (start_d + i) % 8
            ny, nx = curr[0] + dirs[d][0], curr[1] + dirs[d][1]
            if padded[ny, nx]:
                curr = (ny, nx)
                points.append((curr[1]-1, curr[0]-1))
                backtrack = (d + 4) % 8
                found = True
                break
        if not found or curr == (start_y, start_x) or len(points) > 20000:
            break
            
    return points

def rdp(points, epsilon):
    if len(points) < 3:
        return points
    p1 = np.array(points[0])
    p2 = np.array(points[-1])
    line_vec = p2 - p1
    line_len = np.linalg.norm(line_vec)
    
    if line_len == 0:
        dists = np.linalg.norm(np.array(points) - p1, axis=1)
    else:
        line_unit = line_vec / line_len
        vecs = np.array(points) - p1
        proj = np.sum(vecs * line_unit, axis=1)
        proj_vecs = np.outer(proj, line_unit)
        dists = np.linalg.norm(vecs - proj_vecs, axis=1)
        
    max_idx = np.argmax(dists)
    max_dist = dists[max_idx]
    
    if max_dist > epsilon:
        left = rdp(points[:max_idx+1], epsilon)
        right = rdp(points[max_idx:], epsilon)
        return left[:-1] + right
    else:
        return [points[0], points[-1]]

svg_paths = []
for name, hex_code, rgb in palette:
    dist = np.linalg.norm(arr - rgb, axis=2)
    mask = dist < 28
    
    # Remove small noise
    if np.sum(mask) < 200:
        continue
        
    pts = trace_boundary(mask)
    if len(pts) > 5:
        # Simplify polygon
        simplified = rdp(pts, epsilon=1.8)
        d_str = "M " + " L ".join(f"{x:.1f},{y:.1f}" for x, y in simplified) + " Z"
        svg_paths.append((name, hex_code, d_str))
        print(f'{name}: raw {len(pts)} -> simplified {len(simplified)} points')

# Generate full SVG
svg_out = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 612 612" fill="none">',
]
for name, hex_code, d_str in svg_paths:
    svg_out.append(f'  <path id="{name}" d="{d_str}" fill="{hex_code}" />')
svg_out.append('</svg>')

with open('/mnt/Development/Linux/repo/omnistore-ai/scratch_logo.svg', 'w') as f:
    f.write('\n'.join(svg_out))
print('Saved /mnt/Development/Linux/repo/omnistore-ai/scratch_logo.svg')
