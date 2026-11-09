#!/usr/bin/env python3
"""Valida e exporta a associação entre IDs do Desafio ENEM e itens oficiais do Inep.

Uso:
  python tri/associar_parametros.py --ano 2020 \
    --questoes questoes/enem_2020.json \
    --itens ITENS_PROVA_2020.csv \
    --mapeamento tri/mapeamento_2020.csv \
    --saida tri/enem_2020.json

O mapeamento é deliberadamente explícito: o script NÃO presume que o sufixo do
ID interno seja CO_ITEM ou CO_POSICAO. Cada linha deve ser conferida com o
caderno oficial antes de ser incluída.
"""
from __future__ import annotations

import argparse
import csv
import json
from decimal import Decimal, InvalidOperation
from pathlib import Path

REQUIRED_ITEM_FIELDS = {
    "CO_ITEM", "CO_POSICAO", "SG_AREA", "CO_PROVA", "TX_COR",
    "NU_PARAM_A", "NU_PARAM_B", "NU_PARAM_C", "IN_ITEM_ABAN",
}
REQUIRED_MAP_FIELDS = {"id", "co_item", "co_prova", "co_posicao", "tx_cor", "sg_area"}
AREA_MAP = {
    "CH": "ciencias-humanas",
    "CN": "ciencias-natureza",
    "LC": "linguagens",
    "MT": "matematica",
}


def read_csv(path: Path):
    for encoding in ("utf-8-sig", "latin-1"):
        try:
            with path.open("r", encoding=encoding, newline="") as f:
                sample = f.read(4096)
                f.seek(0)
                delimiter = ";" if sample.count(";") >= sample.count(",") else ","
                reader = csv.DictReader(f, delimiter=delimiter)
                rows = list(reader)
                return [str(name).strip().upper() for name in (reader.fieldnames or [])], rows
        except UnicodeDecodeError:
            continue
    raise ValueError(f"Não foi possível decodificar {path}")


def norm(value):
    return str(value or "").strip().upper()


def number(value):
    value = str(value or "").strip().replace(",", ".")
    if not value or value in {".", "-", "NA", "N/A"}:
        return None
    try:
        return float(Decimal(value))
    except InvalidOperation:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ano", type=int, required=True)
    ap.add_argument("--questoes", type=Path, required=True)
    ap.add_argument("--itens", type=Path, required=True)
    ap.add_argument("--mapeamento", type=Path, required=True)
    ap.add_argument("--saida", type=Path, required=True)
    args = ap.parse_args()

    banco = json.loads(args.questoes.read_text(encoding="utf-8"))
    questoes = banco.get("itens", [])
    ids = {str(q.get("id")) for q in questoes}
    if len(ids) != len(questoes):
        raise SystemExit("ERRO: IDs duplicados no banco de questões.")

    _, raw_items = read_csv(args.itens)
    if not raw_items:
        raise SystemExit("ERRO: arquivo oficial sem linhas.")
    item_fields = {norm(k) for k in raw_items[0].keys()}
    missing_fields = REQUIRED_ITEM_FIELDS - item_fields
    if missing_fields:
        raise SystemExit("ERRO: faltam campos no CSV oficial: " + ", ".join(sorted(missing_fields)))

    # Indexa por chave composta, preservando prova/caderno e área.
    official = {}
    for row in raw_items:
        r = {norm(k): (v or "").strip() for k, v in row.items()}
        key = (norm(r["CO_ITEM"]), norm(r["CO_PROVA"]), norm(r["SG_AREA"]), norm(r["TX_COR"]))
        official.setdefault(key, []).append(r)

    _, mapping_rows = read_csv(args.mapeamento)
    if not mapping_rows:
        raise SystemExit("ERRO: mapeamento vazio; nenhuma associação será inventada.")
    map_fields = {norm(k).lower() for k in mapping_rows[0].keys()}
    missing_map = REQUIRED_MAP_FIELDS - map_fields
    if missing_map:
        raise SystemExit("ERRO: faltam campos no mapeamento: " + ", ".join(sorted(missing_map)))

    output = []
    used_ids, used_keys = set(), set()
    errors = []
    for row in mapping_rows:
        r = {str(k).strip().lower(): (v or "").strip() for k, v in row.items()}
        qid = r["id"]
        key = (norm(r["co_item"]), norm(r["co_prova"]), norm(r["sg_area"]), norm(r["tx_cor"]))
        if qid not in ids:
            errors.append(f"{qid}: ID não existe no banco")
            continue
        if qid in used_ids:
            errors.append(f"{qid}: ID interno repetido no mapeamento")
            continue
        if key in used_keys:
            errors.append(f"{qid}: item oficial repetido no mapeamento")
            continue
        candidates = official.get(key, [])
        if len(candidates) != 1:
            errors.append(f"{qid}: chave oficial encontrada {len(candidates)} vezes; esperado 1")
            continue
        item = candidates[0]
        try:
            mapped_position = int(r["co_posicao"])
            official_position = int(float(item["CO_POSICAO"]))
        except (TypeError, ValueError):
            errors.append(f"{qid}: posição inválida no mapeamento ou no CSV oficial")
            continue
        if mapped_position != official_position:
            errors.append(f"{qid}: posição informada ({mapped_position}) diverge da oficial ({official_position})")
            continue
        if AREA_MAP.get(norm(item["SG_AREA"])) != next(
            (q.get("materia") for q in questoes if str(q.get("id")) == qid), None
        ):
            errors.append(f"{qid}: área do item oficial diverge da área do banco")
            continue

        abandoned = norm(item["IN_ITEM_ABAN"]) in {"1", "SIM", "S"}
        params = {
            "a": number(item["NU_PARAM_A"]),
            "b": number(item["NU_PARAM_B"]),
            "c": number(item["NU_PARAM_C"]),
        }
        if not abandoned and any(v is None for v in params.values()):
            errors.append(f"{qid}: item não abandonado com parâmetro ausente")
            continue

        output.append({
            "id": qid,
            "co_item": item["CO_ITEM"],
            "co_prova": item["CO_PROVA"],
            "co_posicao": int(item["CO_POSICAO"]),
            "cor_caderno": item["TX_COR"],
            "area": item["SG_AREA"],
            "parametros": params,
            "item_abandonado": abandoned,
            "status_associacao": "validada",
        })
        used_ids.add(qid)
        used_keys.add(key)

    if errors:
        raise SystemExit("ASSOCIAÇÃO NÃO EXPORTADA. Corrija os problemas:\n- " + "\n- ".join(errors))
    result = {
        "ano": args.ano,
        "fonte": f"INEP — Microdados do ENEM {args.ano}",
        "arquivo_fonte": args.itens.name,
        "metodo": "cruzamento explícito por CO_ITEM, CO_PROVA, SG_AREA e TX_COR; conferência externa do caderno oficial",
        "questoes": output,
    }
    args.saida.parent.mkdir(parents=True, exist_ok=True)
    args.saida.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Exportadas {len(output)} associações validadas para {args.saida}")


if __name__ == "__main__":
    main()
