# Desafio ENEM 🎯

**Prepare-se para o ENEM resolvendo questões de provas anteriores em um simulado interativo.**

O Desafio ENEM é uma aplicação web leve, feita com HTML, CSS e JavaScript, que permite selecionar o ano da prova, filtrar questões por matéria e montar simulados com quantidade personalizada de questões. Durante a resolução, o participante acompanha o tempo e recebe sua pontuação ao final.

## ✨ Recursos

- **Questões por edição:** banco organizado por ano, de 2009 a 2025.
- **Filtro por matéria:** pratique uma área específica ou misture os conteúdos disponíveis.
- **Simulados flexíveis:** escolha 10, 30, 60 questões ou resolva todas as questões disponíveis no filtro.
- **Cronômetro:** acompanhe o tempo gasto durante o simulado.
- **Resultado imediato:** veja sua pontuação ao concluir a atividade.
- **Navegação interativa:** responda uma questão por vez e avance pelo simulado.
- **Banco em JSON:** conteúdo separado da interface para facilitar manutenção e atualização.

## 🚀 Como usar

1. Abra a aplicação no navegador.
2. Escolha o ano da prova.
3. Selecione a matéria desejada.
4. Defina a quantidade de questões.
5. Inicie o simulado, responda às questões e acompanhe o cronômetro.
6. Ao terminar, confira sua pontuação e inicie uma nova tentativa.

## 💻 Executar localmente

É necessário servir os arquivos por um servidor HTTP local, pois o navegador pode bloquear a leitura dos arquivos JSON quando a página é aberta diretamente pelo protocolo `file://`.

**Com Python 3:**

```bash
git clone https://github.com/alexsantossp71-lgtm/desafio_enem.git
cd desafio_enem
python3 -m http.server 8000
```

Acesse [http://localhost:8000](http://localhost:8000).

**Alternativa com Node.js:**

```bash
npx serve .
```

Abra o endereço local informado pelo comando.

## 🗂️ Organização do projeto

```text
desafio_enem/
├── index.html          # Estrutura da aplicação e telas
├── style.css           # Estilos e layout
├── script.js           # Lógica do simulado
├── melhorias.js        # Melhorias complementares da interface
├── questoes/           # Banco de questões em arquivos JSON por ano
└── imagens/            # Imagens de apoio utilizadas nas questões
```

## 🧰 Tecnologias

- HTML5
- CSS3
- JavaScript (sem framework)
- JSON para armazenamento das questões
- GitHub Pages para publicação estática (quando habilitado no repositório)

## 📚 Banco de questões

As questões são mantidas em arquivos JSON separados por edição do exame. As edições de 2024 e 2025 foram incorporadas ao projeto com:

| Edição | Questões no banco |
|:--|--:|
| ENEM 2024 | 174 |
| ENEM 2025 | 168 |

Na preparação desses conjuntos, foram adotados os seguintes critérios:

- conferência dos gabaritos com os gabaritos oficiais do caderno azul do INEP;
- exclusão de itens anulados;
- manutenção do padrão de exclusão das cinco questões de língua estrangeira adotado no banco de 2023;
- preservação do formato JSON esperado pela aplicação.

### Fontes e referências

- [INEP — Provas e gabaritos do ENEM 2024](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/2024)
- [INEP — Provas e gabaritos do ENEM 2025](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/2025)
- [Simulador ENEM — extração estruturada de questões](https://github.com/GustavoDMentz/Simulador-enem)
- [Enem na Prática — banco de questões](https://enempratica.com/questoes-enem)

## 🤝 Contribuições

Sugestões, correções e melhorias são bem-vindas. Ao propor alterações no banco de questões, informe o ano, a numeração do item e a fonte utilizada para conferir o enunciado e o gabarito.

## 📄 Licença

Projeto de estudo e preparação para o ENEM. Consulte as fontes originais para informações sobre direitos de uso dos enunciados e imagens.
