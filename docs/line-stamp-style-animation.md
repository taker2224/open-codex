# Creating a LINE-Style Animated Stamp with MoviePy

This guide walks through generating a short "LINE sticker" style animation using [MoviePy](https://zulko.github.io/moviepy/). The clip combines a breathing scale animation with a gentle bobbing motion so you can export an MP4 stamp that loops cleanly.

## Prerequisites

- Python 3.9+
- [MoviePy](https://pypi.org/project/moviepy/) and NumPy installed:

  ```bash
  pip install moviepy numpy
  ```

- A transparent PNG of your character or mascot. In this example the asset lives at `/mnt/data/2110ECDA-04AB-4408-AE40-1531EEECA71D.png` – replace it with your own path.

## Script

```python
from moviepy.editor import ImageClip, ColorClip, CompositeVideoClip
import numpy as np

W, H = 720, 720     # Canvas size (square for a sticker look)
FPS = 24
DUR = 5.0
IMG = "/mnt/data/2110ECDA-04AB-4408-AE40-1531EEECA71D.png"
OUT = "/mnt/data/line_stamp_style.mp4"

# Background (solid white)
bg = ColorClip((W, H), color=(255, 255, 255)).set_duration(DUR)

# Character art
char = ImageClip(IMG).set_duration(DUR)
scale = (H * 0.7) / char.h  # Fit character to 70% of the canvas height
char = char.resize(scale)

# Base position (center of the canvas)
base_x, base_y = W // 2, H // 2

# Animation helpers (vertical bob + subtle breathing scale)
def pos(t):
    y = base_y + 10 * np.sin(2 * np.pi * (t * 2))  # Bob up/down twice per second
    return (base_x - char.w / 2, y - char.h / 2)


def scale_func(t):
    return 1.0 + 0.05 * np.sin(2 * np.pi * (t * 1))  # Slow breathing motion


char_anim = char.set_position(pos).resize(lambda t: scale_func(t))

# Composite and render
final = CompositeVideoClip([bg, char_anim], size=(W, H)).set_duration(DUR)
final.write_videofile(OUT, fps=FPS, codec="libx264", audio=False, bitrate="2000k")
```

Save the script (for example, `stamp_animation.py`) and execute it with Python. MoviePy will render a five-second MP4 that loops smoothly.

## Tweaks

- **Bounce speed** – adjust the frequency multiplier in `pos(t)` to speed up or slow down the bobbing.
- **Breathing depth** – change the amplitude `0.05` in `scale_func` for a more dramatic or subtle scale.
- **Canvas color** – swap `(255, 255, 255)` for any RGB tuple to change the background.
- **Output format** – MoviePy can export GIFs by calling `write_gif` instead of `write_videofile` if you prefer animated stickers.
