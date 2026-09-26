#!/usr/bin/env python3
"""Validate the SEO contract of the generated static site."""

from __future__ import annotations

import json
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
EXPECTED_ORIGIN = "https://estudioindigo.com.co"


class SEOParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_title = False
        self.in_json_ld = False
        self.title_parts: list[str] = []
        self.json_ld_parts: list[str] = []
        self.json_ld_blocks: list[str] = []
        self.metas: list[dict[str, str]] = []
        self.links: list[dict[str, str]] = []
        self.images: list[dict[str, str]] = []
        self.h1_count = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key: value or "" for key, value in attrs}
        if tag == "title":
            self.in_title = True
        elif tag == "meta":
            self.metas.append(values)
        elif tag == "link":
            self.links.append(values)
        elif tag == "img":
            self.images.append(values)
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "script" and values.get("type") == "application/ld+json":
            self.in_json_ld = True
            self.json_ld_parts = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False
        elif tag == "script" and self.in_json_ld:
            self.in_json_ld = False
            self.json_ld_blocks.append("".join(self.json_ld_parts).strip())

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)
        if self.in_json_ld:
            self.json_ld_parts.append(data)

    @property
    def title(self) -> str:
        return "".join(self.title_parts).strip()

    def meta(self, key: str, value: str) -> str:
        for item in self.metas:
            if item.get(key) == value:
                return item.get("content", "")
        return ""

    def link(self, rel: str) -> str:
        for item in self.links:
            if item.get("rel") == rel:
                return item.get("href", "")
        return ""


def fail(errors: list[str], label: str, message: str) -> None:
    errors.append(f"{label}: {message}")


def validate_html(path: Path, errors: list[str]) -> None:
    label = str(path.relative_to(DIST))
    parser = SEOParser()
    parser.feed(path.read_text(encoding="utf-8"))

    robots = parser.meta("name", "robots")
    noindex = "noindex" in robots.lower()
    canonical = parser.link("canonical")

    if not parser.title:
        fail(errors, label, "falta <title>")
    if not parser.meta("name", "description"):
        fail(errors, label, "falta meta description")
    if not robots:
        fail(errors, label, "falta meta robots")
    if not canonical.startswith(f"{EXPECTED_ORIGIN}/"):
        fail(errors, label, f"canonical inválida: {canonical!r}")
    if not noindex:
        for prop in ("og:title", "og:description", "og:url", "og:image", "og:image:alt"):
            if not parser.meta("property", prop):
                fail(errors, label, f"falta {prop}")
        for name in ("twitter:card", "twitter:title", "twitter:description", "twitter:image", "twitter:image:alt"):
            if not parser.meta("name", name):
                fail(errors, label, f"falta {name}")
        if parser.h1_count != 1:
            fail(errors, label, f"debe tener un H1; encontrados: {parser.h1_count}")

    for index, image in enumerate(parser.images, start=1):
        if "alt" not in image:
            fail(errors, label, f"imagen {index} sin atributo alt")

    if not parser.json_ld_blocks:
        fail(errors, label, "falta JSON-LD")
    for index, block in enumerate(parser.json_ld_blocks, start=1):
        try:
            json.loads(block)
        except json.JSONDecodeError as exc:
            fail(errors, label, f"JSON-LD {index} inválido: {exc}")


def validate_sitemap(errors: list[str]) -> None:
    sitemap = DIST / "sitemap.xml"
    robots = DIST / "robots.txt"
    if not sitemap.exists():
        fail(errors, "sitemap.xml", "no fue generado")
        return
    if not robots.exists():
        fail(errors, "robots.txt", "no fue generado")
    elif f"Sitemap: {EXPECTED_ORIGIN}/sitemap.xml" not in robots.read_text(encoding="utf-8"):
        fail(errors, "robots.txt", "no anuncia el sitemap canónico")

    root = ET.parse(sitemap).getroot()
    namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    urls = [node.text or "" for node in root.findall("sm:url/sm:loc", namespace)]
    if len(urls) != len(set(urls)):
        fail(errors, "sitemap.xml", "contiene URLs duplicadas")
    if len(urls) != 15:
        fail(errors, "sitemap.xml", f"se esperaban 15 URLs y hay {len(urls)}")
    for url in urls:
        parsed = urlparse(url)
        if f"{parsed.scheme}://{parsed.netloc}" != EXPECTED_ORIGIN or (parsed.path != "/" and not parsed.path.endswith("/")):
            fail(errors, "sitemap.xml", f"URL no canónica: {url}")


def main() -> int:
    if not DIST.exists():
        print("No existe dist/. Ejecuta npm run build primero.", file=sys.stderr)
        return 1

    errors: list[str] = []
    html_files = sorted(DIST.rglob("*.html"))
    if not html_files:
        errors.append("dist/: no contiene archivos HTML")
    for path in html_files:
        validate_html(path, errors)
    validate_sitemap(errors)

    if errors:
        print("SEO check falló:\n- " + "\n- ".join(errors), file=sys.stderr)
        return 1
    print(f"SEO check correcto: {len(html_files)} páginas HTML y 15 URLs canónicas.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
