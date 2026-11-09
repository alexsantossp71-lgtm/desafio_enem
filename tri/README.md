# Parâmetros TRI por questão

Este diretório organiza os parâmetros psicométricos oficiais do ENEM e o vínculo de cada item com o ID interno do Desafio ENEM.

## Resultado da pesquisa de disponibilidade

| Edições | Situação | Evidência |
|---|---|---|
| 2009–2012 | Não confirmados em download público aberto | A adoção da TRI começou em 2009, mas os parâmetros históricos eram acessíveis por canal restrito/Sedap; não preencher por estimativa. |
| 2013–2021 | Confirmados nos microdados públicos | O Inep confirmou à CMRI que os microdados dessas edições contêm A, B e C para itens das aplicações regular, PPL e digital. |
| 2022–2024 | Campos confirmados nos dicionários; falta validar os CSVs integrais | Dicionários dessas edições descrevem NU_PARAM_A, NU_PARAM_B e NU_PARAM_C na tabela de itens. |
| 2025 | Pendente de validação do arquivo de itens | A página oficial já publica os microdados 2025; verificar o dicionário e a tabela ITENS_PROVA_2025 antes de declarar cobertura. |

**Atenção:** a página “Outros Documentos” do Inep lista uma planilha separada intitulada “Parâmetros dos itens | Enem 2020”. Isso não significa que 2020 seja o único ano com parâmetros: o Inep confirmou os campos também nos microdados públicos de 2013–2021.

## Fontes

- Página oficial dos microdados: https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/enem
- Outros documentos do ENEM: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/outros-documentos
- Decisão CMRI nº 113/2022 (transcreve a confirmação do Inep sobre A, B e C nos microdados 2013–2021): https://www.gov.br/casacivil/pt-br/assuntos/colegiados/comissao-mista-de-reavaliacao-de-informacoes-cmri/decisoes-de-recurso-de-4a-instancia/2022/decisao-113-2022-nup-23546-022178-2022-63.pdf
- Dicionários de variáveis das edições 2022, 2023 e 2024, que descrevem os três parâmetros na tabela de itens.

## Campos oficiais relevantes

- `CO_ITEM`: código do item.
- `CO_POSICAO`: posição do item na prova.
- `SG_AREA`: área (CH, CN, LC, MT).
- `CO_PROVA`: identificador da prova.
- `TX_COR`: cor do caderno.
- `NU_PARAM_A`: discriminação.
- `NU_PARAM_B`: dificuldade (valor maior indica item mais difícil).
- `NU_PARAM_C`: acerto casual.
- `IN_ITEM_ABAN`: indicador de item abandonado.
- `TX_GABARITO`: gabarito; “X” indica item anulado.

## Regra de associação com o Desafio ENEM

Os IDs internos, como `2020_136`, **não serão presumidos iguais** a `CO_ITEM` nem a `CO_POSICAO`. O vínculo deverá ser validado usando:

1. texto do enunciado e alternativas em `questoes/enem_AAAA.json`;
2. caderno oficial de referência da mesma edição/aplicação;
3. área, posição, cor e código da prova na tabela oficial de itens;
4. código oficial `CO_ITEM`.

Só aceitar associação inequívoca. Uma mesma questão pode ter mais de uma linha na tabela de itens quando aparece em aplicações/cadernos diferentes; a chave precisa preservar ano, aplicação, prova/caderno e código do item. Não colapsar versões diferentes sem justificativa.

## Próxima sequência técnica

1. Baixar o ZIP oficial de cada edição e extrair somente o arquivo `ITENS_PROVA_AAAA.csv` (não é necessário carregar o arquivo de milhões de participantes).
2. Validar se os campos A/B/C existem e quantos registros possuem valores.
3. Filtrar aplicação regular e áreas do banco do projeto; preservar PPL/digital em fontes separadas quando houver.
4. Construir uma tabela de correspondência auditável entre `id` interno e `CO_ITEM`.
5. Conferir os casos ambíguos no caderno oficial antes de gerar os arquivos JSON do site.

## Formato final planejado

Um arquivo por ano, por exemplo `tri/enem_2020.json`:

```json
{
  "ano": 2020,
  "fonte": "INEP — Microdados do ENEM 2020",
  "arquivo_fonte": "ITENS_PROVA_2020.csv",
  "questoes": [
    {
      "id": "2020_136",
      "co_item": "código oficial",
      "co_prova": "identificador oficial",
      "co_posicao": 136,
      "cor_caderno": "AZUL",
      "area": "MT",
      "parametros": {"a": 0.0, "b": 0.0, "c": 0.0},
      "item_abandonado": false,
      "status_associacao": "validada"
    }
  ]
}
```

Os números são apenas ilustrativos. Ausência de parâmetro deve ser `null`, nunca zero. Os valores originais serão preservados; arredondamento será apenas na apresentação. A classificação “fácil/médio/difícil” será uma camada didática separada, com faixas documentadas, não um campo oficial do Inep.
