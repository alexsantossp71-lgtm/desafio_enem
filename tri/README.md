# Parâmetros TRI por questão

Este diretório organiza os parâmetros psicométricos oficiais do ENEM e o vínculo de cada item com o ID interno do Desafio ENEM.

## Resultado da pesquisa de disponibilidade

| Edições | Situação | Evidência |
|---|---|---|
| 2009–2012 | Não confirmados em download público aberto | Não há base pública aberta validada para esses parâmetros históricos; não preencher por estimativa. |
| 2013–2021 | Campos A/B/C confirmados nos microdados públicos e associações concluídas | Declaração do Inep à CMRI e cruzamentos por caderno/posição ou texto e alternativas. |
| 2022–2025 | CSVs oficiais de itens localizados e associações concluídas | Campos A/B/C presentes nos arquivos `ITENS_PROVA_AAAA.csv` incorporados à branch. |

**Atenção:** a planilha separada “Parâmetros dos itens | Enem 2020” não significa que 2020 seja a única edição com parâmetros. Os microdados de 2013–2025 contêm os campos A/B/C utilizados neste trabalho.

## Fontes

- Página oficial dos microdados: https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/microdados/enem
- Provas e gabaritos oficiais: páginas anuais do Inep, por exemplo https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/2020
- Outros documentos do ENEM: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/outros-documentos
- Decisão CMRI nº 113/2022 (confirmação do Inep sobre A, B e C nos microdados 2013–2021): https://www.gov.br/casacivil/pt-br/assuntos/colegiados/comissao-mista-de-reavaliacao-de-informacoes-cmri/decisoes-de-recurso-de-4a-instancia/2022/decisao-113-2022-nup-23546-022178-2022-63.pdf

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

## Procedimento de associação aplicado

1. Preservar os arquivos oficiais `ITENS_PROVA_AAAA.csv` e os códigos de caderno da aplicação regular.
2. Relacionar cada questão ao `CO_ITEM` usando posição e área quando a sequência coincide; usar enunciado e alternativas quando a numeração interna não coincide.
3. Preservar `TP_LINGUA` e `TP_VERSAO_DIGITAL` quando existirem.
4. Registrar divergências de área, gabarito, itens abandonados e itens anulados, sem inventar parâmetros.
5. Gerar `tri/mapeamento_AAAA.csv` e `tri/dados/enem_AAAA.json` para o carregamento na tela da questão.

## Formato dos arquivos gerados

Um arquivo de dados por ano, por exemplo `tri/dados/enem_2020.json`:

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
      "anulada_inep": false,
      "status": "associado"
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

**Situação atual:** as 173 questões de 2020 foram associadas aos itens oficiais. O mapeamento e os parâmetros estão em `tri/mapeamento_2020.csv` e `tri/dados/enem_2020.json`.

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

**Resultado:** os parâmetros oficiais de 2020 foram associados às 173 questões cadastradas. O mapeamento auditável está em `tri/mapeamento_2020.csv`, e os valores usados pela tela estão em `tri/dados/enem_2020.json`.

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


### Associações concluídas — 2013 a 2019

| Ano | Questões associadas | Com A/B/C | Sem parâmetros | Anuladas |
|---:|---:|---:|---:|---:|
| 2013 | 175 | 175 | 0 | 0 |
| 2014 | 175 | 171 | 4 | 0 |
| 2015 | 175 | 175 | 0 | 0 |
| 2016 | 176 | 173 | 3 | 0 |
| 2017 | 175 | 175 | 0 | 0 |
| 2018 | 174 | 173 | 1 | 1 |
| 2019 | 172 | 167 | 5 | 0 |

- Em 2015, a questão `2015_95` foi identificada como Linguagens em inglês (`TP_LINGUA=0.0`), apesar da matéria divergente no banco.
- Em 2016, a questão `2016_93` também exige preservar a variante inglesa (`TP_LINGUA=0.0`).
- Em 2017, as 40 questões de Linguagens foram associadas por comparação do enunciado e das cinco alternativas; o número interno não coincide com a posição impressa no caderno azul. As demais áreas foram associadas por posição.
- Em 2018, a questão `2018_163` foi anulada pelo Inep e fica sem parâmetros. A questão `2018_15` apresenta divergência de gabarito entre o banco (C) e o Inep (D), sinalizada no JSON e na tela.

**Códigos dos cadernos azuis regulares usados (2013–2019)**

| Ano | LC | CH | CN | MT |
|---:|---:|---:|---:|---:|
| 2013 | 177 | 167 | 171 | 181 |
| 2014 | 205 | 195 | 199 | 209 |
| 2015 | 241 | 231 | 235 | 245 |
| 2016 | 299 | 295 | 291 | 303 |
| 2017 | 399 | 395 | 391 | 403 |
| 2018 | 455 | 451 | 447 | 459 |
| 2019 | 511 | 507 | 503 | 515 |

**Exceções de numeração tratadas explicitamente**
- 2016: o ID interno segue a ordem CH, CN, LC, MT, enquanto a posição oficial foi ajustada por área: CH e CN +45; LC −90; MT sem deslocamento.
- 2017: o CSV oficial usa posição local em CH, CN e MT; as 40 questões de Linguagens foram ligadas por texto do enunciado e alternativas, pois a ordem interna não coincide com a posição do caderno.
- 2015_95 e 2016_93: foi preservada a variante de língua inglesa por `TP_LINGUA=0.0`.

### Associação concluída — banco de questões 2020

Foi possível associar **as 173 questões existentes no arquivo `questoes/enem_2020.json`** aos itens oficiais do caderno azul da aplicação regular.

**Método aplicado**
- Numeração impressa e área do caderno azul: LC posições 1–45, CH 46–90, CN 91–135 e MT 136–180.
- Códigos oficiais usados: `CO_PROVA 577` (LC), `567` (CH), `597` (CN) e `587` (MT).
- Na questão 5 de Linguagens, foi preservado `TP_LINGUA=1.0` (espanhol).
- Cada associação foi conferida por posição, área, código do caderno e registro oficial; os 173 `CO_ITEM` são únicos.
- O caderno azul regular é identificado na página oficial do Inep: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/2020

**Resultado**
- 173 associações feitas.
- 171 questões com parâmetros A, B e C.
- 2 questões anuladas pelo Inep, sem parâmetros utilizáveis: `2020_135` e `2020_157`.
- 1 divergência entre o gabarito interno e o oficial: `2020_140` — banco indica E; tabela oficial indica C. Os parâmetros foram associados ao item identificado pelo enunciado, mas a divergência fica sinalizada e não foi corrigida automaticamente.
- 6 registros têm divergência entre `materia` no JSON do projeto e a área oficial identificada pelo número/caderno: `2020_5`, `2020_20`, `2020_102`, `2020_124`, `2020_150` e `2020_152`. A associação TRI usa a área oficial; o campo `materia` original foi preservado para não alterar silenciosamente a classificação existente.

**Arquivos**
- `tri/mapeamento_2020.csv`: 173 linhas de associação explícita.
- `tri/dados/enem_2020.json`: parâmetros e metadados associados por questão.
- `tri/associar_parametros.py`: agora registra divergências de área e gabarito; para executar este ano com as divergências conhecidas, use `--permitir-divergencia-area`.

Os valores A/B/C foram copiados sem arredondamento adicional dos campos `NU_PARAM_A`, `NU_PARAM_B` e `NU_PARAM_C` do CSV oficial. Itens anulados ficam com parâmetros nulos, nunca estimados.

### Associações TRI concluídas — 2020 a 2025

As associações foram realizadas para todas as questões cadastradas nesses seis anos, usando o caderno azul da aplicação regular e o CSV de itens oficial do Inep. A numeração impressa foi cruzada com área, `CO_PROVA`, cor do caderno e posição; os códigos de item são únicos dentro de cada edição.

| Ano | Questões associadas | Com A/B/C | Sem parâmetros | Anuladas pelo Inep |
|---:|---:|---:|---:|---:|
| 2020 | 173 | 171 | 2 | 2 |
| 2021 | 175 | 171 | 4 | 1 |
| 2022 | 174 | 168 | 6 | 0 |
| 2023 | 174 | 173 | 1 | 0 |
| 2024 | 174 | 174 | 0 | 0 |
| 2025 | 172 | 170 | 2 | 0 |
| **Total** | **1.042** | **1.027** | **15** | **3** |

Os 12 itens sem parâmetros que não foram anulados estão marcados pelo Inep como abandonados na calibração TRI (`IN_ITEM_ABAN`); esse sinal não equivale a anulação da questão. O painel diferencia os dois casos.

**Alertas encontrados e preservados**
- Divergência de área entre o banco e a área oficial: 2020 (6 questões) e 2021 (11 questões).
- Divergência de gabarito entre o banco e o Inep: 2020 (1), 2021 (4) e 2025 (2). Os valores oficiais aparecem no painel como alerta; não foram alterados silenciosamente.
- Itens anulados: 2020_135, 2020_157 e 2021_138.
- Itens abandonados na calibração, sem A/B/C: 2021_24, 2021_43, 2021_118; 2022_64, 2022_112, 2022_113, 2022_119, 2022_134, 2022_141; 2023_161; 2025_125, 2025_172.

**Fontes e reprodutibilidade**
- Cada ano tem um mapeamento explícito em `tri/mapeamento_AAAA.csv`, uma exportação em `tri/dados/enem_AAAA.json` e a cópia do CSV de itens em `tri/fontes/ITENS_PROVA_AAAA.csv`.
- Códigos `CO_PROVA` usados para os cadernos azuis regulares: 2021 LC 889 / CH 879 / CN 909 / MT 899; 2022 LC 1065 / CH 1055 / CN 1085 / MT 1075; 2023 LC 1201 / CH 1191 / CN 1221 / MT 1211; 2024 LC 1395 / CH 1383 / CN 1419 / MT 1407; 2025 LC 1459 / CH 1447 / CN 1483 / MT 1471. Para 2020, ver a seção acima.
- Os anos 2021 e 2022 têm códigos azuis alternativos com o mesmo conjunto de itens e gabaritos; foi escolhido o código da aplicação regular.
- O painel da questão carrega automaticamente `tri/dados/enem_AAAA.json`. A ausência de um arquivo TRI em outra edição não impede o carregamento do simulado.

Os parâmetros A/B/C são os valores originais do Inep, sem classificação didática automática de dificuldade. Para 2009–2012, não foi confirmado acesso público aos parâmetros históricos; não são estimados nem inventados.

### Cobertura consolidada — 2013 a 2025

| Indicador | Total |
|---|---:|
| Questões associadas | **2.264** |
| Questões com A/B/C disponíveis | **2.236** |
| Sem parâmetros A/B/C | 28 |
| Anuladas pelo Inep entre as anteriores | 4 |
| Abandonadas na calibração, mas não anuladas | 24 |

Foram identificadas 66 divergências de área entre o campo `materia` original do banco e a área oficial do item. Também foram identificadas 8 divergências de gabarito entre o banco e o Inep: `2018_15`, `2020_140`, `2021_15`, `2021_25`, `2021_38`, `2021_53`, `2025_23` e `2025_33`. Esses dados ficam sinalizados; não houve correção silenciosa dos campos originais.

Os arquivos por edição são:
- `tri/fontes/ITENS_PROVA_AAAA.csv`: fonte de parâmetros do Inep.
- `tri/mapeamento_AAAA.csv`: vínculo auditável entre ID do projeto e `CO_ITEM`.
- `tri/dados/enem_AAAA.json`: parâmetros e alertas usados pela tela da questão.


