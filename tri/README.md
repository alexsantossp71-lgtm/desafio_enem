# Parâmetros TRI por questão

Este diretório armazenará os parâmetros psicométricos oficiais do ENEM e o vínculo de cada item com o ID interno do Desafio ENEM.

## Fonte e cobertura

- Fonte primária: microdados do ENEM publicados pelo Inep.
- Arquivo de itens: `ITENS_PROVA_AAAA.csv` (nome pode variar por edição).
- Campos esperados: `CO_ITEM`, `CO_POSICAO`, `SG_AREA`, `CO_PROVA`, `TX_COR`, `NU_PARAM_A`, `NU_PARAM_B`, `NU_PARAM_C`, `IN_ITEM_ABAN`.
- O Inep confirmou publicamente a disponibilização dos parâmetros A, B e C nos microdados das edições 2013 a 2021.
- Para 2022 em diante, os microdados também incluem a base de itens; a presença e integridade dos três parâmetros será validada edição por edição antes da importação.
- Para 2009 a 2012, a disponibilidade pública dos parâmetros ainda precisa ser confirmada. Não serão estimados nem inventados valores para preencher lacunas.

## Associação ao banco do projeto

Os IDs internos, como `2020_136`, não devem ser tratados automaticamente como `CO_ITEM` nem como posição oficial. O vínculo será feito com evidência cruzada entre:

1. texto/enunciado e alternativas do banco `questoes/enem_AAAA.json`;
2. caderno oficial de referência (prioridade: caderno azul, aplicação regular);
3. área, posição, cor e código da prova no arquivo `ITENS_PROVA_AAAA.csv`;
4. código oficial do item (`CO_ITEM`).

A associação só será aceita quando a correspondência for inequívoca. Itens anulados/abandonados serão identificados e não receberão rótulo de dificuldade como se fossem itens válidos.

## Formato de saída

Um arquivo por ano, por exemplo `enem_2020.json`:

```json
{
  "ano": 2020,
  "fonte": "INEP — Microdados do ENEM 2020",
  "arquivo_fonte": "ITENS_PROVA_2020.csv",
  "criterio_prova": "aplicação regular; caderno azul como referência",
  "questoes": [
    {
      "id": "2020_136",
      "co_item": "código oficial do item",
      "co_prova": "código oficial da prova",
      "co_posicao": 136,
      "cor_caderno": "AZUL",
      "area": "MT",
      "parametros": {
        "a": 0.0,
        "b": 0.0,
        "c": 0.0
      },
      "item_abandonado": false,
      "classificacao_b": "a definir com critério documentado"
    }
  ]
}
```

Os números acima são apenas um esquema de formato, não valores reais.

## Regras de interpretação

- A: discriminação.
- B: dificuldade (valor maior indica item mais difícil).
- C: probabilidade de acerto casual.
- O parâmetro B não será convertido automaticamente em “fácil/médio/difícil” sem definir e documentar faixas por área.
- A ausência de um parâmetro será representada como dado ausente, nunca como zero.
- Os valores originais do Inep serão preservados; arredondamento será feito apenas na apresentação.

## Fontes consultadas

- Inep — Microdados do ENEM: https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/enem
- Inep — Outros documentos / Parâmetros dos itens: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/outros-documentos
- Decisão CMRI nº 107/2022, que reproduz confirmação do Inep sobre os parâmetros A, B e C nas edições 2013–2021: https://www.gov.br/casacivil/pt-br/assuntos/colegiados/comissao-mista-de-reavaliacao-de-informacoes-cmri/decisoes-de-recurso-de-4a-instancia/2022/decisao-107-2022-nup-23546-081050-2021-51.pdf
