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

- Provas e gabaritos oficiais do ENEM 2020 (Inep), com cadernos regulares, digitais e reaplicação/PPL: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/2020

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

## Inventário do banco do projeto — edição 2020

Inspeção direta de `questoes/enem_2020.json` na branch de trabalho:

| Área no banco | Questões cadastradas |
|---|---:|
| Ciências Humanas (`ciencias-humanas`) | 49 |
| Ciências da Natureza (`ciencias-natureza`) | 45 |
| Linguagens (`linguagens`) | 39 |
| Matemática (`matematica`) | 40 |
| **Total** | **173** |

Todas as questões inspecionadas possuem cinco alternativas e gabarito interno. Esses totais descrevem o conteúdo atual do projeto; não representam a quantidade de itens calibrados pelo Inep e não autorizam associação automática.

### Cuidados específicos de 2020

- A edição tem cadernos impressos e digitais. O código da prova/caderno precisa ser preservado no cruzamento.
- A tabela oficial de itens contém posição, área, código do item, código da prova, cor, língua e parâmetros. Em Linguagens, a língua (`TP_LINGUA`) é relevante para distinguir os blocos de questões.
- Há uma particularidade nos cadernos digitais de Linguagens: os códigos de prova 691, 692, 693 e 694 podem conter dois conjuntos de itens sob o mesmo código, separados por `TP_VERSAO_DIGITAL`. Um cruzamento que ignore essa variável pode gerar mais de um candidato para a mesma chave.
- Uma análise independente do arquivo oficial de 2020 documenta os códigos de prova regulares e a necessidade de relacionar cada posição ao caderno efetivamente aplicado. Isso reforça que o sufixo do ID interno não é chave oficial.

**Situação desta etapa:** o inventário do banco foi concluído, mas ainda não há parâmetros A/B/C associados às 173 questões. O mapeamento explícito continua vazio até que cada ID seja ligado, sem ambiguidade, ao item oficial e ao caderno correspondente. Nenhum valor TRI foi estimado ou copiado de outra questão.

Fonte oficial dos microdados: https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/enem

## Fonte de parâmetros obtida — ENEM 2020

O arquivo completo `tri/fontes/ITENS_PROVA_2020.csv` foi incorporado à branch de trabalho a partir de uma cópia espelhada do arquivo oficial do Inep. O manifesto da cópia registra o caminho original `microdados_enem_2020/DADOS/ITENS_PROVA_2020.csv` e o SHA-256 da fonte `57c9eea2a56d45271d036da38f1219bdedf4a6295a9b6829690fe6b8db96444b`.

Inventário do CSV incorporado:
- 4.415 linhas de registros de caderno/item.
- Áreas: LC 1.310; CH 1.035; CN 1.035; MT 1.035 linhas.
- Itens distintos por área: LC 150; CN 150; CH 135; MT 147.
- 42 registros marcados como itens abandonados.
- 360 registros com `TP_VERSAO_DIGITAL` preenchido.
- Campos A/B/C presentes no arquivo.

**Atenção:** as linhas representam aparições dos itens em cadernos e versões, não 4.415 questões diferentes. O mesmo `CO_ITEM` aparece em mais de um caderno, com posição e cor diferentes. A edição digital de Linguagens também exige considerar `TP_VERSAO_DIGITAL`; por isso o validador agora inclui `TP_LINGUA` e `TP_VERSAO_DIGITAL` na chave composta. O modelo `tri/mapeamento_modelo.csv` foi atualizado.

Origem pública da cópia e manifesto de integridade: https://github.com/HenriqueLindemann/analise-enem (manifesto em `src/tri_enem/data/itens/manifest.json`). A fonte primária continua sendo o Inep: https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/enem

**Resultado:** os parâmetros oficiais de 2020 agora estão disponíveis localmente na branch. Ainda não foram ligados aos IDs `2020_N` do Desafio ENEM; essa etapa depende de identificar o `CO_ITEM` correto para cada questão do banco e selecionar a linha do caderno/versão correspondente.

### Índice normalizado por item

Também foi gerado `tri/fontes/ITENS_2020_UNICOS.csv`, com uma linha por combinação área + `CO_ITEM` (582 itens). A consolidação foi conferida: os valores de gabarito, indicador de anulação e parâmetros A/B/C são consistentes entre as diferentes aparições do mesmo item nos cadernos; não foram encontrados conflitos. O arquivo mantém a contagem de registros de caderno de cada item.

Distribuição do índice: CH 135; CN 150; LC 150; MT 147. Esse índice facilita a consulta dos parâmetros, mas não resolve a identificação dos IDs internos do site.

### Teste de cruzamento por sequência de gabaritos — 2020

Foi feito um teste adicional comparando as letras corretas cadastradas no banco com as sequências de `TX_GABARITO` dos cadernos presentes em `ITENS_PROVA_2020.csv`.

**Conclusão: o gabarito, sozinho, não identifica os itens.** Há muitas repetições de letras e diferentes cadernos/versões. Em uma consulta por área e posição, o mesmo número de posição pode retornar vários `CO_ITEM` de diferentes provas; alguns compartilham a mesma letra correta. Portanto, não é seguro escolher um candidato apenas porque o gabarito coincide.

Exemplos observados:
- Linguagens, ID interno `2020_6`: há vários registros na posição 6 em provas/cadernos diferentes; a letra C coincide em mais de um contexto.
- Matemática, ID interno `2020_136`: a posição 136 não deve ser interpretada diretamente como `CO_POSICAO` sem primeiro determinar a convenção de numeração usada no banco; os registros oficiais exibem candidatos de várias provas.
- A sequência global do banco também não coincide de forma inequívoca com uma única sequência de caderno, pois o banco tem quantidades diferentes de questões por área e pode não representar a mesma seleção/ordem do caderno.

**Próximo passo necessário:** obter o caderno oficial de referência de 2020 (PDF) e fazer correspondência pelo conteúdo do enunciado e das alternativas, usando a tabela de itens para recuperar `CO_ITEM` e os parâmetros. O gabarito será uma validação auxiliar, nunca a chave principal. Até essa conferência, o arquivo de mapeamento permanece vazio e nenhum A/B/C é atribuído aos IDs internos.

