#!/usr/bin/env python3
"""Generate Pronoun Trainer app icons (PNG) with no dependencies.

Design: playful rounded tile with a purple->orange vertical gradient, a white
speech-bubble (pill + tail) with three dark-purple dots. Rendered with 4x
supersampling for smooth edges, then box-downsampled to the output sizes.
"""
import os
import struct
import zlib

SIZES = [512, 192, 180]
OUT = os.path.join(os.path.dirname(__file__), "..", "icons")

TOP = (108, 92, 231)      # #6C5CE7 purple
BOT = (255, 159, 67)      # #FF9F43 orange
BUBBLE = (255, 255, 255)
DOT = (95, 39, 205)       # #5F27CD


def render(size):
    SS = 4  # supersample factor
    W = H = size * SS

    # geometry in final-size units
    m = size * 0.05
    x0, y0, x1, y1 = m, m, size - m, size - m
    R = size * 0.20  # outer corner radius

    bw, bh = size * 0.56, size * 0.30   # bubble size
    bxc, byc = size * 0.5, size * 0.46  # bubble center
    bx0, by0 = bxc - bw / 2, byc - bh / 2
    bx1, by1 = bxc + bw / 2, byc + bh / 2
    br = bh / 2  # pill end radius

    tx0 = bx0 + bw * 0.20          # tail (downward triangle on bubble bottom)
    tx1 = bx0 + bw * 0.46
    ty0 = by1
    ty1 = by1 + size * 0.11
    txc = (tx0 + tx1) / 2

    dr = size * 0.050              # dot radius
    dcx = [bx0 + bw * 0.30, bxc, bx0 + bw * 0.70]
    dcy = byc

    def in_pill(x, y):
        cx = min(max(x, bx0 + br), bx1 - br)
        cy = min(max(y, by0), by1)
        return (x - cx) ** 2 + (y - cy) ** 2 <= br * br or (bx0 + br <= x <= bx1 - br and by0 <= y <= by1)

    def in_tri(x, y):
        def sign(p1, p2, p3):
            return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])
        d1 = sign((x, y), (tx0, ty0), (tx1, ty0))
        d2 = sign((x, y), (tx1, ty0), (txc, ty1))
        d3 = sign((x, y), (txc, ty1), (tx0, ty0))
        has_neg = d1 < 0 or d2 < 0 or d3 < 0
        has_pos = d1 > 0 or d2 > 0 or d3 > 0
        return not (has_neg and has_pos)

    def tag(x, y):
        if x < x0 or x > x1 or y < y0 or y > y1:
            return "out"
        cx = min(max(x, x0 + R), x1 - R)
        cy = min(max(y, y0 + R), y1 - R)
        if (x - cx) ** 2 + (y - cy) ** 2 > R * R:
            return "out"
        if in_pill(x, y) or in_tri(x, y):
            for c in dcx:
                if (x - c) ** 2 + (y - dcy) ** 2 <= dr * dr:
                    return "dot"
            return "bubble"
        return "bg"

    rgba = bytearray(size * size * 4)
    for py in range(size):
        for px in range(size):
            counts = {"bg": 0, "bubble": 0, "dot": 0, "out": 0}
            for sy in range(SS):
                for sx in range(SS):
                    fx = px + (sx + 0.5) / SS
                    fy = py + (sy + 0.5) / SS
                    counts[tag(fx, fy)] += 1
            n = SS * SS
            # background color at pixel center
            t = min(1.0, max(0.0, (py + 0.5) / size))
            bgc = tuple(int(TOP[i] + (BOT[i] - TOP[i]) * t) for i in range(3))
            r = g = b = a = 0
            for name, col in (("bg", bgc), ("bubble", BUBBLE), ("dot", DOT)):
                c = counts[name]
                if c:
                    r += col[0] * c
                    g += col[1] * c
                    b += col[2] * c
                    a += 255 * c
            idx = (py * size + px) * 4
            rgba[idx] = round(r / n)
            rgba[idx + 1] = round(g / n)
            rgba[idx + 2] = round(b / n)
            rgba[idx + 3] = round(a / n)
    return bytes(rgba)


def downsample(rgba, src, dst):
    """Box-downsample a src x src RGBA buffer to dst x dst."""
    out = bytearray(dst * dst * 4)
    f = src / dst
    for py in range(dst):
        for px in range(dst):
            x0 = int(px * f)
            x1 = int((px + 1) * f)
            y0 = int(py * f)
            y1 = int((py + 1) * f)
            rs = gs = bs = as_ = 0
            for yy in range(y0, y1):
                row = (yy * src + x0) * 4
                for xx in range(x0, x1):
                    rs += rgba[row]
                    gs += rgba[row + 1]
                    bs += rgba[row + 2]
                    as_ += rgba[row + 3]
                    row += 4
            n = (x1 - x0) * (y1 - y0)
            idx = (py * dst + px) * 4
            out[idx] = round(rs / n)
            out[idx + 1] = round(gs / n)
            out[idx + 2] = round(bs / n)
            out[idx + 3] = round(as_ / n)
    return bytes(out)


def png(width, height, rgba):
    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    raw = b"".join(b"\x00" + bytes(rgba[y * width * 4:(y + 1) * width * 4]) for y in range(height))
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr)
            + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def main():
    os.makedirs(OUT, exist_ok=True)
    big = render(512)
    files = {
        "icon-512.png": (512, big),
        "icon-192.png": (192, downsample(big, 512, 192)),
        "apple-touch-icon.png": (180, downsample(big, 512, 180)),
    }
    for name, (size, data) in files.items():
        path = os.path.join(OUT, name)
        with open(path, "wb") as f:
            f.write(png(size, size, data))
        print("wrote", path, os.path.getsize(path), "bytes")


if __name__ == "__main__":
    main()
