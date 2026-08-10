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