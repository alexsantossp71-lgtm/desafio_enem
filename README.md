# Desafio ENEM 🎯

Aplicativo web de **questões do ENEM** para treinar por ano, matéria e quantidade de questões, com cronômetro e pontuação — atmosfera de prova real.

## ✨ Funcionalidades

- 📅 **Filtro por ano** — questões organizadas por edição do ENEM
- 📚 **Filtro por matéria** — selecione a área de conhecimento desejada
- 🔢 **Quantidade personalizável** — escolha quantas questões por simulado
- ⏱️ **Cronômetro integrado** — simule o tempo real de prova
- ✅ **Pontuação e feedback** — resultado final com desempenho
- 📊 **Modo quiz interativo** — navegação entre questões com feedback
- 💾 **Dados das questões** em JSON para fácil atualização

## 🚀 Como executar

```bash
# Opção 1: Python
python3 -m http.server 8000
# acesse http://localhost:8000

# Opção 2: Node.js
npx serve
```

## 📁 Estrutura do projeto

```
├── index.html          # Tela de menu e configuração
├── quiz-active         # Tela do quiz (dinâmica)
├── script.js           # Lógica da aplicação (estado, filtros, timer)
├── style.css           # Estilos
├── questoes/           # Questões por ano/matéria (JSON)
└── imagens/            # Imagens de apoio às questões
```

## 🛠️ Tecnologias

- HTML5 + CSS3
- JavaScript vanilla
- Dados em JSON carregados via `fetch`

## 📄 Licença

Projeto de estudo para preparação ao ENEM.

## 📚 Atualização do banco (2024–2025)

- ENEM 2024: 174 questões importadas.
- ENEM 2025: 168 questões importadas.
- Mantidos os IDs por ano e o formato JSON consumido pelo site.
- Excluídas as cinco questões de língua estrangeira, seguindo o padrão adotado no banco de 2023, e os itens anulados.
- Gabaritos conferidos com os gabaritos oficiais do caderno azul do INEP; o campo de gabarito da extração estruturada não foi usado como fonte de verdade.
- Imagens recuperadas para questões ausentes são carregadas de `enempratica.com/provas/`; os demais itens com imagem mantêm a descrição visual textual quando disponível.

Fontes:
- [INEP — Provas e gabaritos 2024](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/2024)
- [INEP — Provas e gabaritos 2025](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/2025)
- [Extração estruturada de questões ENEM](https://github.com/GustavoDMentz/Simulador-enem)
- [Enem na Prática — banco de questões e gabaritos](https://enempratica.com/questoes-enem)
