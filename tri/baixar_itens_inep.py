#!/usr/bin/env python3
"""Baixa somente a tabela de itens dos microdados oficiais do ENEM.

Não mantém nem processa o arquivo de participantes (que pode ter vários GB).
Uso:
  python tri/baixar_itens_inep.py --anos 2020
  python tri/baixar_itens_inep.py --anos 2013-2021 2022 2023 2024 2025
"""
from __future__ import annotations

import argparse
import re
import urllib.request
import zipfile
from pathlib import Path

BASE = "https://download.inep.gov.br/microdados/microdados_enem_{ano}.zip"
PARAMS = {"NU_PARAM_A", "NU_PARAM_B", "NU_PARAM_C"}


def parse_years(values):
    years = set()
    for value in values:
        if "-" in value:
            start, end = map(int, value.split("-", 1))
            years.update(range(start, end + 1))
        else:
            years.add(int(value))
    invalid = sorted(y for y in years if y < 2009 or y > 2025)
    if invalid:
        raise SystemExit(f"Anos fora do intervalo suportado: {invalid}")
    return sorted(years)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--anos", nargs="+", required=True, help="Anos ou intervalos, ex.: 2020 2013-2021")
    ap.add_argument("--destino", type=Path, default=Path("tri/fontes"))
    args = ap.parse_args()
    args.destino.mkdir(parents=True, exist_ok=True)

    for year in parse_years(args.anos):
        url = BASE.format(ano=year)
        zip_path = args.destino / f"microdados_enem_{year}.zip"
        print(f"[{year}] Baixando {url}")
        try:
            urllib.request.urlretrieve(url, zip_path)
        except Exception as exc:
            print(f"[{year}] FALHA no download: {exc}")
            continue

        try:
            with zipfile.ZipFile(zip_path) as archive:
                matches = [
                    name for name in archive.namelist()
                    if re.search(rf"(^|/)ITENS(?:_PROVA)?_{year}\.csv$", name, re.I)
                ]
                if not matches:
                    matches = [
                        name for name in archive.namelist()
                        if "ITENS" in Path(name).name.upper() and name.lower().endswith(".csv")
                    ]
                if not matches:
                    print(f"[{year}] AVISO: não encontrei CSV de itens no ZIP.")
                    continue
                # Prefer the file explicitly named for the requested year.
                matches.sort(key=lambda n: (str(year) not in Path(n).name, len(n)))
                source = matches[0]
                target = args.destino / f"ITENS_PROVA_{year}.csv"
                target.write_bytes(archive.read(source))
                print(f"[{year}] Extraído: {source} -> {target} ({target.stat().st_size:,} bytes)")
                with target.open("r", encoding="latin-1", errors="replace") as f:
                    header = f.readline().strip().replace('"', "").split(";")
                present = {x.strip().upper() for x in header}
                missing = PARAMS - present
                if missing:
                    print(f"[{year}] PARÂMETROS NÃO LOCALIZADOS: {', '.join(sorted(missing))}")
                else:
                    print(f"[{year}] Campos A/B/C encontrados no cabeçalho.")
        except zipfile.BadZipFile:
            print(f"[{year}] FALHA: o arquivo baixado não é um ZIP válido.")
        finally:
            # Mantém apenas a tabela pequena de itens; remove o pacote grande.
            if zip_path.exists():
                zip_path.unlink()


if __name__ == "__main__":
    main()
