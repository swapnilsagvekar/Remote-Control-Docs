#!/usr/bin/env python3
"""Build Trial Admin presentation PDF with sharp screenshot embeds (PyMuPDF)."""

from __future__ import annotations

import io
import re
from pathlib import Path

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MD_PATH = ROOT / "content" / "skitii-trial-admin-presentation.md"
ASSETS = ROOT / "assets" / "admin-panel" / "presentation"
OUT_PDF = ROOT / "output" / "Skitii_Trial_Admin_Panel_Documentation.pdf"

# Landscape A4 in points (1 pt = 1/72 in)
PAGE_W, PAGE_H = 841.89, 595.28
MARGIN = 28
JPEG_QUALITY = 95


def strip_md(text: str) -> str:
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    replacements = {
        "\u2014": "-",
        "\u2013": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2022": "-",
        "\u00a0": " ",
        "\u2192": "->",
        "\u2194": "<->",
        "\u00d7": "x",
        "\u2026": "...",
    }
    for src, dst in replacements.items():
        text = text.replace(src, dst)
    return text.strip()


def parse_markdown(md: str) -> tuple[dict[str, str], list[dict]]:
    meta: dict[str, str] = {}
    for line in md.splitlines()[:12]:
        m = re.match(r"\*\*(.+?):\*\*\s*(.+)", line)
        if m:
            meta[m.group(1).strip()] = m.group(2).strip()

    body = re.sub(r"^#[^\n]+\n[\s\S]*?---\n", "", md, count=1)
    sections: list[dict] = []
    current: dict | None = None

    for raw in body.splitlines():
        if raw.startswith("## "):
            if current:
                sections.append(current)
            current = {"title": strip_md(raw[3:]), "blocks": []}
            continue
        if current is None:
            continue

        img = re.match(
            r"!\[([^\]]*)\]\(\.\./assets/admin-panel/presentation/([^)]+)\)", raw
        )
        if img:
            current["blocks"].append(
                {"type": "image", "alt": img.group(1), "file": img.group(2)}
            )
            continue
        if raw.startswith("### "):
            current["blocks"].append({"type": "h3", "text": strip_md(raw[4:])})
            continue
        if raw.startswith("|") and "---" not in raw:
            current["blocks"].append({"type": "table_row", "text": raw})
            continue
        if raw.startswith("|") and "---" in raw:
            continue
        if raw.startswith("- "):
            current["blocks"].append({"type": "li", "text": strip_md(raw[2:])})
            continue
        if re.match(r"^\d+\.\s+", raw):
            current["blocks"].append(
                {"type": "li", "text": strip_md(re.sub(r"^\d+\.\s+", "", raw))}
            )
            continue
        if raw.strip() == "":
            current["blocks"].append({"type": "spacer"})
            continue
        current["blocks"].append({"type": "p", "text": strip_md(raw)})

    if current:
        sections.append(current)
    return meta, sections


def new_page(doc: fitz.Document) -> fitz.Page:
    return doc.new_page(width=PAGE_W, height=PAGE_H)


def draw_header_footer(page: fitz.Page, page_no: int, total: int) -> None:
    page.draw_line(
        fitz.Point(MARGIN, 22),
        fitz.Point(PAGE_W - MARGIN, 22),
        color=(0.89, 0.91, 0.94),
        width=0.6,
    )
    page.insert_text(
        fitz.Point(MARGIN, 16),
        "SKITII Trials  |  Admin Panel Documentation",
        fontsize=8,
        fontname="helv",
        color=(0.39, 0.45, 0.55),
    )
    page.insert_text(
        fitz.Point(PAGE_W - MARGIN - 70, 16),
        "CONFIDENTIAL",
        fontsize=8,
        fontname="helv",
        color=(0.05, 0.58, 0.53),
    )
    page.draw_line(
        fitz.Point(MARGIN, PAGE_H - 20),
        fitz.Point(PAGE_W - MARGIN, PAGE_H - 20),
        color=(0.89, 0.91, 0.94),
        width=0.6,
    )
    page.insert_text(
        fitz.Point(MARGIN, PAGE_H - 10),
        "Swapnil Sagvekar  -  Skitii Trials Admin 2026",
        fontsize=8,
        fontname="helv",
        color=(0.58, 0.64, 0.72),
    )
    label = f"Page {page_no} / {total}"
    page.insert_text(
        fitz.Point(PAGE_W - MARGIN - 60, PAGE_H - 10),
        label,
        fontsize=8,
        fontname="helv",
        color=(0.05, 0.18, 0.42),
    )


def add_cover(doc: fitz.Document, meta: dict[str, str]) -> None:
    page = new_page(doc)
    page.draw_rect(page.rect, color=None, fill=(0.03, 0.15, 0.37))
    page.insert_text(
        fitz.Point(48, 120),
        "SKITII TRIALS PLATFORM",
        fontsize=12,
        fontname="helv",
        color=(0.37, 0.92, 0.83),
    )
    page.insert_textbox(
        fitz.Rect(48, 145, PAGE_W - 48, 240),
        "Trial Admin Panel\nDocumentation",
        fontsize=34,
        fontname="helv",
        color=(1, 1, 1),
        align=fitz.TEXT_ALIGN_LEFT,
    )
    page.insert_textbox(
        fitz.Rect(48, 250, PAGE_W - 48, 300),
        "Overview of every module with real screenshots.",
        fontsize=13,
        fontname="helv",
        color=(0.80, 0.84, 0.88),
    )
    y = 340
    for key in ("Date", "Author", "Audience", "App"):
        if key in meta:
            page.insert_text(
                fitz.Point(48, y),
                strip_md(f"{key}:  {meta[key]}"),
                fontsize=11,
                fontname="helv",
                color=(0.58, 0.64, 0.72),
            )
            y += 22


def jpeg_bytes(path: Path) -> bytes:
    img = Image.open(path).convert("RGB")
    buf = io.BytesIO()
    # subsampling=0 keeps UI text edges sharper
    img.save(
        buf,
        format="JPEG",
        quality=JPEG_QUALITY,
        optimize=True,
        subsampling=0,
    )
    return buf.getvalue()


def add_image_page(doc: fitz.Document, path: Path, caption: str) -> None:
    page = new_page(doc)
    page.insert_textbox(
        fitz.Rect(MARGIN, 28, PAGE_W - MARGIN, 48),
        strip_md(caption or path.stem),
        fontsize=12,
        fontname="helv",
        color=(0.05, 0.18, 0.42),
    )
    top = 54
    bottom = PAGE_H - 28
    max_w = PAGE_W - 2 * MARGIN
    max_h = bottom - top
    # 1856x940 aspect
    img_w = max_w
    img_h = img_w * 940 / 1856
    if img_h > max_h:
        img_h = max_h
        img_w = img_h * 1856 / 940
    x0 = MARGIN + (max_w - img_w) / 2
    rect = fitz.Rect(x0, top, x0 + img_w, top + img_h)
    page.insert_image(rect, stream=jpeg_bytes(path))


class TextCursor:
    def __init__(self, doc: fitz.Document):
        self.doc = doc
        self.page: fitz.Page | None = None
        self.y = 0.0

    def ensure_page(self) -> fitz.Page:
        if self.page is None:
            self.page = new_page(self.doc)
            self.y = 36
        return self.page

    def need(self, height: float) -> fitz.Page:
        page = self.ensure_page()
        if self.y + height > PAGE_H - 32:
            self.page = new_page(self.doc)
            self.y = 36
            page = self.page
        return page

    def add_heading(self, text: str) -> None:
        self.page = new_page(self.doc)
        self.y = 40
        self.page.insert_textbox(
            fitz.Rect(MARGIN, self.y, PAGE_W - MARGIN, self.y + 28),
            text,
            fontsize=18,
            fontname="helv",
            color=(0.05, 0.18, 0.42),
        )
        self.y += 34

    def add_subheading(self, text: str) -> None:
        page = self.need(22)
        page.insert_textbox(
            fitz.Rect(MARGIN, self.y, PAGE_W - MARGIN, self.y + 18),
            text,
            fontsize=13,
            fontname="helv",
            color=(0.06, 0.46, 0.43),
        )
        self.y += 20

    def add_paragraph(self, text: str) -> None:
        page = self.need(40)
        rect = fitz.Rect(MARGIN, self.y, PAGE_W - MARGIN, PAGE_H - 32)
        rc = page.insert_textbox(
            rect,
            text,
            fontsize=11,
            fontname="helv",
            color=(0.12, 0.16, 0.23),
            align=fitz.TEXT_ALIGN_LEFT,
        )
        # rc is unused height remaining; estimate used lines
        used = max(16, min(rect.height - rc if rc >= 0 else 48, 120))
        self.y += used + 4

    def add_bullet(self, text: str) -> None:
        self.add_paragraph(f"-  {text}")

    def add_spacer(self) -> None:
        self.y += 8

    def add_table(self, rows: list[str]) -> None:
        parsed = []
        for row in rows:
            cells = [strip_md(c.strip()) for c in row.strip("|").split("|")]
            parsed.append(cells)
        if not parsed:
            return
        cols = max(len(r) for r in parsed)
        col_w = (PAGE_W - 2 * MARGIN) / cols
        row_h = 16
        need_h = row_h * len(parsed) + 8
        page = self.need(need_h)
        for i, row in enumerate(parsed):
            for j in range(cols):
                cell = row[j] if j < len(row) else ""
                if len(cell) > 48:
                    cell = cell[:47] + "..."
                x0 = MARGIN + j * col_w
                rect = fitz.Rect(x0, self.y, x0 + col_w, self.y + row_h)
                fill = (0.95, 0.96, 0.98) if i == 0 else None
                page.draw_rect(rect, color=(0.80, 0.84, 0.88), fill=fill, width=0.6)
                page.insert_textbox(
                    rect + (3, 3, -3, -2),
                    cell,
                    fontsize=8,
                    fontname="helv",
                    color=(0.06, 0.09, 0.16),
                )
            self.y += row_h
        self.y += 10


def build() -> None:
    md = MD_PATH.read_text(encoding="utf-8")
    meta, sections = parse_markdown(md)

    doc = fitz.open()
    add_cover(doc, meta)

    for section in sections:
        cursor = TextCursor(doc)
        cursor.add_heading(section["title"])
        table_buf: list[str] = []

        def end_table() -> None:
            nonlocal table_buf
            if table_buf:
                cursor.add_table(table_buf)
                table_buf = []

        for block in section["blocks"]:
            btype = block["type"]
            if btype != "table_row":
                end_table()

            if btype == "image":
                # finish text page context; image gets its own full page
                path = ASSETS / block["file"]
                if not path.exists():
                    raise FileNotFoundError(path)
                add_image_page(doc, path, block.get("alt") or section["title"])
                cursor.page = None
            elif btype == "h3":
                cursor.add_subheading(block["text"])
            elif btype == "p":
                cursor.add_paragraph(block["text"])
            elif btype == "li":
                cursor.add_bullet(block["text"])
            elif btype == "table_row":
                table_buf.append(block["text"])
            elif btype == "spacer":
                cursor.add_spacer()
        end_table()

    # Header/footer on all but cover
    total = doc.page_count
    for i in range(1, total):
        draw_header_footer(doc[i], i + 1, total)

    OUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUT_PDF, garbage=4, deflate=True)
    doc.close()
    print(
        f"Done: {OUT_PDF} ({OUT_PDF.stat().st_size // 1024} KB, {total} pages, JPEG q={JPEG_QUALITY})"
    )


if __name__ == "__main__":
    build()
