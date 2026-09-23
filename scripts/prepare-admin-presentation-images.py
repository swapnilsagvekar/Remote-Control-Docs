#!/usr/bin/env python3
"""Crop Trial Admin screenshots and (optionally) sharpen a Puppeteer PDF."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SRC = Path("/home/swapnil/Pictures/admin-panel-screenshot")
OUT_DIR = ROOT / "assets" / "admin-panel" / "presentation"

# Remove Ubuntu dock + GNOME bar + Firefox tabs/bookmarks
LEFT, TOP, RIGHT, BOTTOM = 64, 140, 1920, 1080

MAPPING = [
    ("01-login-email.png", "Screenshot from 2026-09-12 10-26-16.png"),
    ("02-login-otp.png", "Screenshot from 2026-09-12 10-26-23.png"),
    ("03-dashboard.png", "Screenshot from 2026-09-12 10-13-46.png"),
    ("04-trials-list.png", "Screenshot from 2026-09-12 10-13-53.png"),
    ("05-trial-create-basics.png", "Screenshot from 2026-09-12 10-14-03.png"),
    ("06-trial-weekly-forms.png", "Screenshot from 2026-09-12 10-14-10.png"),
    ("07-institutions.png", "Screenshot from 2026-09-12 10-14-24.png"),
    ("08-configurations.png", "Screenshot from 2026-09-12 10-14-37.png"),
    ("09-patients-list.png", "Screenshot from 2026-09-12 10-14-54.png"),
    ("10-patient-add-1.png", "Screenshot from 2026-09-12 10-15-02.png"),
    ("11-patient-add-2.png", "Screenshot from 2026-09-12 10-15-13.png"),
    ("12-patient-edit.png", "Screenshot from 2026-09-12 10-22-19.png"),
    ("13-patient-view-hrv.png", "Screenshot from 2026-09-12 10-15-59.png"),
    ("14-patient-weekly-schedule.png", "Screenshot from 2026-09-12 10-16-05.png"),
    ("15-weekly-form-vitals.png", "Screenshot from 2026-09-12 10-16-14.png"),
    ("16-weekly-form-hrv.png", "Screenshot from 2026-09-12 10-22-43.png"),
    ("17-sessions-list.png", "Screenshot from 2026-09-12 10-16-29.png"),
    ("18-session-info.png", "Screenshot from 2026-09-12 10-16-45.png"),
    ("19-session-pre.png", "Screenshot from 2026-09-12 10-16-53.png"),
    ("20-session-post.png", "Screenshot from 2026-09-12 10-17-00.png"),
    ("21-session-readings.png", "Screenshot from 2026-09-12 10-17-07.png"),
    ("22-session-stats.png", "Screenshot from 2026-09-12 10-28-08.png"),
    ("23-session-stats-table.png", "Screenshot from 2026-09-12 10-28-16.png"),
    ("24-session-stats-drilldown.png", "Screenshot from 2026-09-12 10-28-25.png"),
    ("25-weekly-stats.png", "Screenshot from 2026-09-12 10-28-42.png"),
    ("26-weekly-stats-table.png", "Screenshot from 2026-09-12 10-28-49.png"),
    ("27-weekly-stats-drilldown.png", "Screenshot from 2026-09-12 10-28-57.png"),
    ("28-music.png", "Screenshot from 2026-09-12 10-23-10.png"),
]


def cover_toast(img: Image.Image) -> Image.Image:
    draw = ImageDraw.Draw(img)
    bg = img.getpixel((1400, 50))
    draw.rectangle([1450, 20, img.width - 1, 110], fill=bg)
    return img


def crop_screenshots(src_dir: Path) -> list[Path]:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    paths: list[Path] = []
    for out_name, src_name in MAPPING:
        src_path = src_dir / src_name
        if not src_path.exists():
            raise FileNotFoundError(src_path)
        img = Image.open(src_path).convert("RGB")
        cropped = img.crop((LEFT, TOP, RIGHT, BOTTOM))
        if out_name == "02-login-otp.png":
            cropped = cover_toast(cropped)
        out_path = OUT_DIR / out_name
        cropped.save(out_path, format="PNG", compress_level=3)
        paths.append(out_path)
        print(f"OK {out_name} {cropped.size}")
    return paths


def sharpen_pdf(pdf_path: Path, image_paths: list[Path]) -> None:
    """Replace Chromium's soft embeds with high-quality JPEGs. Layout unchanged."""
    import io

    import fitz

    def jpeg_bytes(path: Path) -> bytes:
        img = Image.open(path).convert("RGB")
        buf = io.BytesIO()
        img.save(
            buf,
            format="JPEG",
            quality=95,
            optimize=True,
            subsampling=0,
        )
        return buf.getvalue()

    doc = fitz.open(pdf_path)
    shot_xrefs: list[int] = []
    seen: set[int] = set()
    for page in doc:
        for info in page.get_image_info(xrefs=True):
            if info.get("width") == 1856 and info.get("height") == 940:
                xref = info["xref"]
                if xref not in seen:
                    seen.add(xref)
                    shot_xrefs.append(xref)

    if len(shot_xrefs) != len(image_paths):
        raise RuntimeError(
            f"Screenshot count mismatch: pdf={len(shot_xrefs)} files={len(image_paths)}"
        )

    for i, xref in enumerate(shot_xrefs):
        data = jpeg_bytes(image_paths[i])
        for page in doc:
            if any(img[0] == xref for img in page.get_images(full=True)):
                page.replace_image(xref, stream=data)
                break
        print(f"replaced {image_paths[i].name} ({len(data) // 1024} KB jpeg)")

    tmp = pdf_path.with_suffix(".sharp.pdf")
    doc.save(tmp, garbage=4, deflate=True)
    doc.close()
    shutil.move(tmp, pdf_path)
    print(f"sharpened PDF -> {pdf_path} ({pdf_path.stat().st_size // 1024} KB)")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", type=Path, default=DEFAULT_SRC)
    parser.add_argument("--pdf", type=Path, default=None)
    parser.add_argument("--skip-crop", action="store_true")
    args = parser.parse_args()

    paths = (
        [OUT_DIR / name for name, _ in MAPPING]
        if args.skip_crop
        else crop_screenshots(args.src)
    )
    if args.pdf:
        sharpen_pdf(args.pdf, paths)


if __name__ == "__main__":
    main()
