#!/usr/bin/env python3
"""
Extracts the "React TD" logo lockup from its dedicated reference sheet and
removes the flat cream background, producing a transparent-background PNG.

Source: references/392B53D7-A37F-4D1D-A193-2AE5E9FB77D6.PNG — a dedicated logo
file (not a UI mockup screenshot with the logo incidentally in one panel), so
no cropping is needed, only background removal.

Technique: color-distance keying against the sampled background color. The
backdrop is a uniform cream (~250,240,228) with no gradient/texture, so a
simple Euclidean-distance threshold with a soft falloff band cleanly separates
it from the logo's saturated ink (navy blue, dark red, gold) without touching
letter highlights. This is NOT a general-purpose matting tool — it works here
specifically because the background is flat and far in color-space from every
part of the artwork; don't reach for this on a photographic or gradient
background.

Usage: python3 design/gen/extract-logo.py
Requires: pillow, numpy (pip3 install --user pillow numpy)

Outputs:
  design/assets/logo/logo-wordmark-source.png  — full-res matte, source of truth
  public/art/logo-wordmark.png                 — downscaled shipped asset
"""

from PIL import Image
import numpy as np

SRC = "references/392B53D7-A37F-4D1D-A193-2AE5E9FB77D6.PNG"
SOURCE_OUT = "design/assets/logo/logo-wordmark-source.png"
SHIPPED_OUT = "public/art/logo-wordmark.png"
SHIPPED_WIDTH = 900  # ~3x the title screen's display width, for retina headroom

# Sampled from the four corners of SRC — all landed within a couple of RGB
# values of this, confirming a uniform flat backdrop.
BG_COLOR = np.array([250, 240, 228], dtype=np.float32)

# Distance band: pixels closer than LOW to BG_COLOR go fully transparent;
# pixels farther than HIGH stay fully opaque; linear falloff between. Tuned by
# inspection (composited onto a dark background) rather than derived — if the
# source file changes, re-tune by checking for a visible seam or eaten
# highlights.
LOW, HIGH = 8, 40


def main() -> None:
    img = Image.open(SRC).convert("RGBA")
    arr = np.array(img).astype(np.float32)

    dist = np.sqrt(((arr[:, :, :3] - BG_COLOR) ** 2).sum(axis=2))
    alpha = np.clip((dist - LOW) / (HIGH - LOW), 0, 1) * 255
    arr[:, :, 3] = alpha

    keyed = Image.fromarray(arr.astype(np.uint8))
    keyed = keyed.crop(keyed.getbbox())  # trim the now-transparent margin
    keyed.save(SOURCE_OUT)
    print(f"wrote {SOURCE_OUT} {keyed.size}")

    w, h = keyed.size
    target_h = round(h * SHIPPED_WIDTH / w)
    shipped = keyed.resize((SHIPPED_WIDTH, target_h), Image.LANCZOS)
    shipped.save(SHIPPED_OUT, optimize=True)
    print(f"wrote {SHIPPED_OUT} {shipped.size}")


if __name__ == "__main__":
    main()
