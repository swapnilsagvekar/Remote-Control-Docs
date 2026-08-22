from fpdf import FPDF
from fpdf.enums import XPos, YPos
import re

MD_FILE = "/home/swapnil/Desktop/Swapnil/projects/Skitii-Docs-Generation/content/skitii-trial-story.md"
OUT_FILE = "/home/swapnil/Desktop/Swapnil/projects/Skitii-Docs-Generation/content/Skitii_Trial_Specification.pdf"

# Brand colors
PRIMARY   = (13,  110, 200)   # Skitii blue
ACCENT    = (0,   180, 160)   # teal
DARK      = (30,  30,  50)    # near-black headings
LIGHT_BG  = (245, 248, 252)   # page background tint
ROW_ALT   = (235, 243, 252)   # table alternate row
RULE_COL  = (200, 215, 235)   # horizontal rule
WHITE     = (255, 255, 255)
CODE_BG   = (240, 243, 248)
CODE_FG   = (40,  60,  100)
MUTED     = (120, 130, 150)

class TrialPDF(FPDF):
    def __init__(self):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_auto_page_break(auto=True, margin=22)
        self.set_margins(20, 20, 20)
        self._in_table   = False
        self._col_widths = []
        self._table_rows = []
        self._table_header = []
        self._in_code    = False
        self._code_lines = []
        self._page_num   = 0

    def header(self):
        if self.page_no() == 1:
            return
        # Top accent bar
        self.set_fill_color(*PRIMARY)
        self.rect(0, 0, 210, 5, style="F")
        self.set_xy(20, 8)
        self.set_font("Helvetica", "B", 7)
        self.set_text_color(*MUTED)
        self.cell(0, 4, "SKITII TRIALS -- PRODUCT STORY & TECHNICAL SPECIFICATION", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.set_draw_color(*RULE_COL)
        self.line(20, 13, 190, 13)
        self.ln(3)

    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(-14)
        self.set_draw_color(*RULE_COL)
        self.line(20, self.get_y(), 190, self.get_y())
        self.ln(1)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(*MUTED)
        self.cell(0, 5, f"Page {self.page_no() - 1}", align="R")

    def cover_page(self, meta: dict):
        self.add_page()
        # Full-width gradient-like header band
        self.set_fill_color(*PRIMARY)
        self.rect(0, 0, 210, 90, style="F")
        self.set_fill_color(*ACCENT)
        self.rect(0, 85, 210, 8, style="F")

        # Logo text / brand
        self.set_xy(20, 20)
        self.set_font("Helvetica", "B", 32)
        self.set_text_color(*WHITE)
        self.cell(0, 14, "SKITII", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        self.set_x(20)
        self.set_font("Helvetica", "", 14)
        self.set_text_color(200, 225, 255)
        self.cell(0, 8, "Clinical Trials Platform", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        self.set_x(20)
        self.set_font("Helvetica", "B", 18)
        self.set_text_color(*WHITE)
        self.ln(6)
        self.cell(0, 9, "Product Story & Technical Specification", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # Meta block below band
        self.set_xy(20, 105)
        fields = [
            ("Version",  meta.get("Version",  "1.0")),
            ("Date",     meta.get("Date",     "July 2027")),
            ("Customer", meta.get("Customer", "Yenepoya Hospital")),
            ("Scope",    meta.get("Scope",    "")),
        ]
        for label, value in fields:
            self.set_font("Helvetica", "B", 9)
            self.set_text_color(*PRIMARY)
            self.cell(32, 7, label.upper(), new_x=XPos.RIGHT, new_y=YPos.TOP)
            self.set_font("Helvetica", "", 9)
            self.set_text_color(*DARK)
            self.multi_cell(138, 7, value, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        # Bottom decoration
        self.set_xy(20, 260)
        self.set_draw_color(*ACCENT)
        self.set_line_width(0.8)
        self.line(20, 265, 190, 265)
        self.set_font("Helvetica", "", 8)
        self.set_text_color(*MUTED)
        self.set_xy(20, 267)
        self.cell(0, 5, "Confidential -- Internal Use Only", align="C")

    def h1(self, text):
        text = sanitize(text)
        self.ln(4)
        x, y = self.get_x(), self.get_y()
        self.set_fill_color(*PRIMARY)
        self.rect(20, y, 3, 10, style="F")
        self.set_fill_color(*LIGHT_BG)
        self.rect(23, y, 167, 10, style="F")
        self.set_xy(27, y + 1)
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(*PRIMARY)
        self.cell(160, 8, text.upper(), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def h2(self, text):
        text = sanitize(text)
        self.ln(3)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*DARK)
        self.cell(0, 7, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        # Underline
        x = self.get_x()
        y = self.get_y()
        self.set_draw_color(*ACCENT)
        self.set_line_width(0.4)
        self.line(20, y, 100, y)
        self.set_line_width(0.2)
        self.ln(1)

    def h3(self, text):
        text = sanitize(text)
        self.ln(2)
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(*ACCENT)
        self.cell(0, 6, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(0.5)

    def body(self, text, indent=0):
        text = sanitize(text)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*DARK)
        self.set_x(20 + indent)
        self.multi_cell(170 - indent, 5.5, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def bullet(self, text, level=0):
        text = sanitize(text)
        indent = 5 + level * 5
        self.set_x(20 + indent)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*PRIMARY)
        self.cell(5, 5.5, "-", new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*DARK)
        self.multi_cell(165 - indent, 5.5, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def numbered(self, num, text):
        text = sanitize(text)
        self.set_x(20 + 3)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*PRIMARY)
        self.cell(7, 5.5, f"{num}.", new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*DARK)
        self.multi_cell(160, 5.5, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def blockquote(self, text):
        text = sanitize(text)
        self.set_fill_color(*LIGHT_BG)
        x, y = self.get_x(), self.get_y()
        # Estimate height
        lines = max(1, len(text) // 80 + 1)
        h = lines * 5.5 + 4
        self.rect(20, y, 2, h, style="F")
        self.set_fill_color(*LIGHT_BG)
        self.rect(22, y, 168, h, style="F")
        self.set_xy(26, y + 2)
        self.set_font("Helvetica", "I", 8.5)
        self.set_text_color(*MUTED)
        self.multi_cell(162, 5.5, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)

    def code_block(self, lines_list):
        lines_list = [sanitize(l) for l in lines_list]
        text = "\n".join(lines_list)
        self.set_fill_color(*CODE_BG)
        num_lines = len(lines_list)
        h = num_lines * 4.8 + 5
        x, y = self.get_x(), self.get_y()
        if y + h > 275:
            self.add_page()
            y = self.get_y()
        self.rect(20, y, 170, h, style="F")
        self.set_xy(23, y + 2.5)
        self.set_font("Courier", "", 7.5)
        self.set_text_color(*CODE_FG)
        self.multi_cell(164, 4.8, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def render_table(self, header, rows):
        if not header:
            return
        n = len(header)
        avail = 170
        # Estimate column widths by header length
        raw = [max(len(h), 8) for h in header]
        total = sum(raw)
        widths = [avail * w / total for w in raw]

        # Check page space
        needed = 7 + len(rows) * 6
        if self.get_y() + needed > 270:
            self.add_page()

        y = self.get_y()
        # Header row
        self.set_fill_color(*PRIMARY)
        self.rect(20, y, avail, 7, style="F")
        self.set_xy(20, y)
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(*WHITE)
        for i, col in enumerate(header):
            self.cell(widths[i], 7, col, border=0, align="C", new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.ln(7)

        # Data rows
        for r_idx, row in enumerate(rows):
            bg = ROW_ALT if r_idx % 2 == 0 else WHITE
            self.set_fill_color(*bg)
            row_y = self.get_y()
            # measure max height for this row
            max_h = 6
            self.set_xy(20, row_y)
            self.set_font("Helvetica", "", 8)
            self.set_text_color(*DARK)
            for i, cell_val in enumerate(row):
                self.set_xy(20 + sum(widths[:i]), row_y)
                self.set_fill_color(*bg)
                self.multi_cell(widths[i], 6, cell_val, border=0, align="L",
                                fill=True, new_x=XPos.RIGHT, new_y=YPos.TOP)
            self.set_xy(20, row_y + max_h)

        # Bottom border
        self.set_draw_color(*RULE_COL)
        self.line(20, self.get_y(), 190, self.get_y())
        self.ln(3)

    def horizontal_rule(self):
        self.ln(2)
        self.set_draw_color(*RULE_COL)
        self.line(20, self.get_y(), 190, self.get_y())
        self.ln(3)


def sanitize(text):
    """Replace special unicode chars with ASCII equivalents."""
    text = text.replace('\u2014', '--')
    text = text.replace('\u2013', '-')
    text = text.replace('\u2019', "'")
    text = text.replace('\u2018', "'")
    text = text.replace('\u201c', '"')
    text = text.replace('\u201d', '"')
    text = text.replace('\u2022', '*')
    text = text.replace('\u2192', '->')
    text = text.replace('\u2713', 'v')
    text = text.replace('\u00d7', 'x')
    text = text.replace('\u2026', '...')
    text = text.replace('\u00e9', 'e')
    text = text.replace('\u2265', '>=')
    text = text.replace('\u2264', '<=')
    text = text.replace('\u00b0', 'deg')
    return text.encode('latin-1', errors='replace').decode('latin-1')


def clean(text):
    """Remove markdown bold/italic markers and sanitize unicode."""
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)
    text = re.sub(r'\*(.+?)\*',     r'\1', text)
    text = re.sub(r'`(.+?)`',       r'\1', text)
    text = re.sub(r'__(.+?)__',     r'\1', text)
    return sanitize(text).strip()


def parse_table_line(line):
    parts = [c.strip() for c in line.strip().strip("|").split("|")]
    return [clean(p) for p in parts]


def is_separator_row(line):
    return bool(re.match(r'^\|[\s\-\|:]+\|?\s*$', line))


def extract_meta(lines):
    meta = {}
    for line in lines[:15]:
        m = re.match(r'^\*\*(.+?):\*\*\s*(.+)', line)
        if m:
            meta[m.group(1).strip()] = m.group(2).strip()
    return meta


def render(pdf: TrialPDF, lines):
    in_code  = False
    code_buf = []
    in_table = False
    tbl_hdr  = []
    tbl_rows = []
    num_counter = {}  # section -> counter

    i = 0
    while i < len(lines):
        line = lines[i]
        raw  = line.rstrip()

        # Code fence
        if raw.startswith("```"):
            if not in_code:
                in_code  = True
                code_buf = []
            else:
                pdf.code_block(code_buf)
                in_code  = False
                code_buf = []
            i += 1
            continue

        if in_code:
            code_buf.append(raw)
            i += 1
            continue

        # Table
        if raw.startswith("|"):
            if is_separator_row(raw):
                i += 1
                continue
            cells = parse_table_line(raw)
            if not in_table:
                in_table = True
                tbl_hdr  = cells
                tbl_rows = []
            else:
                tbl_rows.append(cells)
            i += 1
            continue
        else:
            if in_table:
                pdf.render_table(tbl_hdr, tbl_rows)
                in_table = False
                tbl_hdr  = []
                tbl_rows = []

        # Horizontal rule
        if re.match(r'^-{3,}$', raw):
            pdf.horizontal_rule()
            i += 1
            continue

        # H1
        m = re.match(r'^# (.+)', raw)
        if m:
            text = clean(m.group(1))
            if "Skitii Trials" in text or "Skitii Trial" in text:
                i += 1
                continue
            pdf.add_page()
            pdf.h1(text)
            i += 1
            continue

        # H2
        m = re.match(r'^## (.+)', raw)
        if m:
            pdf.h2(clean(m.group(1)))
            i += 1
            continue

        # H3
        m = re.match(r'^### (.+)', raw)
        if m:
            pdf.h3(clean(m.group(1)))
            i += 1
            continue

        # Blockquote
        m = re.match(r'^>\s*(.*)', raw)
        if m:
            txt = m.group(1)
            # Collect multi-line blockquotes
            while i + 1 < len(lines) and lines[i+1].startswith(">"):
                i += 1
                txt += " " + lines[i].lstrip(">").strip()
            pdf.blockquote(clean(txt))
            i += 1
            continue

        # Numbered list
        m = re.match(r'^(\d+)\.\s+(.*)', raw)
        if m:
            pdf.numbered(m.group(1), clean(m.group(2)))
            i += 1
            continue

        # Bullet (levels)
        m = re.match(r'^(\s*[-*])\s+(.*)', raw)
        if m:
            level = len(m.group(1)) // 2
            pdf.bullet(clean(m.group(2)), level=level)
            i += 1
            continue

        # Blank line
        if raw.strip() == "":
            pdf.ln(1.5)
            i += 1
            continue

        # Skip metadata lines at top (bold key: value)
        if re.match(r'^\*\*.+:\*\*', raw):
            i += 1
            continue

        # Body text
        if raw.strip():
            pdf.body(clean(raw))
        i += 1

    # flush table if file ends inside one
    if in_table:
        pdf.render_table(tbl_hdr, tbl_rows)


def main():
    with open(MD_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()

    lines = [l.rstrip("\n") for l in lines]

    meta = extract_meta(lines)

    pdf = TrialPDF()
    pdf.cover_page(meta)

    # Skip the metadata header block (first ~10 lines)
    start = 0
    for idx, l in enumerate(lines[:20]):
        if l.strip() == "---" and idx > 3:
            start = idx + 1
            break

    render(pdf, lines[start:])

    pdf.output(OUT_FILE)
    print(f"PDF saved → {OUT_FILE}")


if __name__ == "__main__":
    main()
