#!/usr/bin/env python3
"""Baixa imagens ENEM referenciadas em enem.dev e converte os JSONs para caminhos locais."""
import json, re, time, urllib.request
from pathlib import Path

ROOT = Path(".")
YEARS = (2022, 2023)
URL_RE = re.compile(r"https?://enem\.dev/(20\d{2})/questions/(\d+)/([A-Za-z0-9-]+\.(?:png|jpe?g|webp))", re.I)

def collect(value, found):
    if isinstance(value, dict):
        for v in value.values(): collect(v, found)
    elif isinstance(value, list):
        for v in value: collect(v, found)
    elif isinstance(value, str):
        for m in URL_RE.finditer(value):
            found[m.group(0)] = m.groups()

def replace(value, mapping):
    if isinstance(value, dict):
        return {k: replace(v, mapping) for k, v in value.items()}
    if isinstance(value, list):
        return [replace(v, mapping) for v in value]
    if isinstance(value, str):
        for old, new in mapping.items(): value = value.replace(old, new)
    return value

def valid_image(data):
    return (data.startswith(b"\x89PNG\r\n\x1a\n") or data.startswith(b"\xff\xd8\xff")
            or (len(data) > 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"))

def main():
    docs, urls = {}, {}
    for year in YEARS:
        path = ROOT / "questoes" / f"enem_{year}.json"
        docs[year] = json.loads(path.read_text(encoding="utf-8"))
        collect(docs[year], urls)
    if not urls:
        print("Nenhuma referência enem.dev encontrada; nada a fazer.")
        return
    mapping, failures = {}, []
    for i, (url, (year, qnum, filename)) in enumerate(sorted(urls.items()), 1):
        ext = filename.rsplit(".", 1)[1].lower()
        local_name = f"{year}_{qnum}_{filename}"
        local_path = f"imagens/{year}/{local_name}"
        target = ROOT / local_path
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists() and valid_image(target.read_bytes()):
            mapping[url] = local_path
            continue
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; DesafioENEM-image-recovery/1.0)"})
        error = None
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=30) as response:
                    data = response.read()
                if not valid_image(data):
                    raise ValueError("resposta não é PNG/JPEG/WebP válido")
                target.write_bytes(data)
                mapping[url] = local_path
                error = None
                break
            except Exception as exc:
                error = str(exc)
                time.sleep(2 * (attempt + 1))
        if error:
            failures.append((url, error))
        print(f"[{i}/{len(urls)}] {'OK' if error is None else 'FALHOU'} {url}")
    if failures:
        print(f"\nFalha em {len(failures)} de {len(urls)} imagens. JSONs não serão alterados.")
        for url, error in failures: print(f"- {url}: {error}")
        raise SystemExit(1)
    for year, doc in docs.items():
        path = ROOT / "questoes" / f"enem_{year}.json"
        path.write_text(json.dumps(replace(doc, mapping), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\nRecuperação concluída: {len(mapping)} imagens salvas localmente.")
if __name__ == "__main__": main()
