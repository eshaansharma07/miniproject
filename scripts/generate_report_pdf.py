from __future__ import annotations

from pathlib import Path
import textwrap


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "evaluator_guide.md"
OUTPUT = ROOT / "docs" / "Intrusion_Detection_Evaluator_Guide.pdf"

PAGE_WIDTH = 595
PAGE_HEIGHT = 842
MARGIN_X = 48
MARGIN_TOP = 56
MARGIN_BOTTOM = 48


def pdf_escape(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def wrap_text(text: str, width: int) -> list[str]:
    if not text:
        return [""]
    return textwrap.wrap(text, width=width, break_long_words=False, break_on_hyphens=False) or [text]


def layout_lines(markdown: str) -> list[tuple[str, int, str]]:
    lines: list[tuple[str, int, str]] = []
    in_code = False

    for raw in markdown.splitlines():
        line = raw.rstrip()

        if line.startswith("```"):
            in_code = not in_code
            continue

        if in_code:
            for part in wrap_text(line or " ", 86):
                lines.append((part, 9, "Courier"))
            lines.append(("", 6, "Courier"))
            continue

        if line.startswith("# "):
            lines.append((line[2:].strip(), 20, "Helvetica-Bold"))
            lines.append(("", 8, "Helvetica"))
            continue

        if line.startswith("## "):
            lines.append((line[3:].strip(), 15, "Helvetica-Bold"))
            lines.append(("", 5, "Helvetica"))
            continue

        if line.startswith("### "):
            lines.append((line[4:].strip(), 12, "Helvetica-Bold"))
            lines.append(("", 3, "Helvetica"))
            continue

        if line.startswith("- "):
            wrapped = wrap_text(f"- {line[2:].strip()}", 88)
            for part in wrapped:
                lines.append((part, 10, "Helvetica"))
            continue

        if line[:2].isdigit() and line[1:3] == ". ":
            wrapped = wrap_text(line, 88)
            for part in wrapped:
                lines.append((part, 10, "Helvetica"))
            continue

        if not line:
            lines.append(("", 5, "Helvetica"))
            continue

        for part in wrap_text(line, 92):
            lines.append((part, 10, "Helvetica"))

    return lines


def build_pages(lines: list[tuple[str, int, str]]) -> list[str]:
    pages: list[str] = []
    current: list[str] = []
    y = PAGE_HEIGHT - MARGIN_TOP

    for text, size, font in lines:
        leading = size + 4
        if y - leading < MARGIN_BOTTOM:
            pages.append("\n".join(current))
            current = []
            y = PAGE_HEIGHT - MARGIN_TOP

        if text:
            current.append("BT")
            current.append(f"/{font} {size} Tf")
            current.append(f"1 0 0 1 {MARGIN_X} {y} Tm")
            current.append(f"({pdf_escape(text)}) Tj")
            current.append("ET")
        y -= leading

    if current:
        pages.append("\n".join(current))

    return pages


def build_pdf(pages: list[str]) -> bytes:
    objects: list[bytes] = []

    def add_object(payload: str | bytes) -> int:
        data = payload.encode("latin-1") if isinstance(payload, str) else payload
        objects.append(data)
        return len(objects)

    font_helvetica = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    font_bold = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
    font_courier = add_object("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>")

    page_ids: list[int] = []
    content_ids: list[int] = []

    placeholder_pages_id = len(objects) + 1

    for page_content in pages:
        stream = page_content.encode("latin-1")
        content_id = add_object(
            b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream"
        )
        content_ids.append(content_id)
        page_id = add_object(
            (
                "<< /Type /Page /Parent {parent} 0 R /MediaBox [0 0 595 842] "
                "/Resources << /Font << /Helvetica {h} 0 R /Helvetica-Bold {b} 0 R /Courier {c} 0 R >> >> "
                "/Contents {content} 0 R >>"
            ).format(parent=placeholder_pages_id, h=font_helvetica, b=font_bold, c=font_courier, content=content_id)
        )
        page_ids.append(page_id)

    kids = " ".join(f"{page_id} 0 R" for page_id in page_ids)
    pages_obj = f"<< /Type /Pages /Kids [{kids}] /Count {len(page_ids)} >>"
    objects.insert(placeholder_pages_id - 1, pages_obj.encode("latin-1"))

    catalog_id = add_object(f"<< /Type /Catalog /Pages {placeholder_pages_id} 0 R >>")

    output = bytearray(b"%PDF-1.4\n")
    offsets = [0]

    for index, obj in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(f"{index} 0 obj\n".encode("ascii"))
        output.extend(obj)
        output.extend(b"\nendobj\n")

    xref_start = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("ascii"))

    output.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root {catalog_id} 0 R >>\n"
            f"startxref\n{xref_start}\n%%EOF\n"
        ).encode("ascii")
    )
    return bytes(output)


def main() -> None:
    markdown = SOURCE.read_text(encoding="utf-8")
    lines = layout_lines(markdown)
    pages = build_pages(lines)
    pdf = build_pdf(pages)
    OUTPUT.write_bytes(pdf)
    print(f"Generated {OUTPUT}")


if __name__ == "__main__":
    main()
