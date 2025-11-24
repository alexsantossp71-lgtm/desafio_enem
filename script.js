/* ==========================================================================
   SCRIPT.JS - LÓGICA DO SIMULADO ENEM
   ========================================================================== */

// --- VARIÁVEIS GLOBAIS DE ESTADO ---
let questoes = [];          // Armazena as questões da prova atual
let indiceAtual = 0;        // Qual questão estamos vendo agora (0, 1, 2...)
let pontuacao = 0;          // Quantas o usuário acertou
let tempoRestante;          // Segundos restando na questão atual
let timerInterval;          // Referência para o setInterval do relógio
const TEMPO_POR_QUESTAO = 180; // 3 minutos em segundos

// --- ELEMENTOS DO DOM (INTERFACE) ---
// Telas
const menuScreen = document.getElementById('menu-screen');
const quizActive = document.getElementById('quiz-active');
const resultScreen = document.getElementById('result-container');

// Elementos do Quiz
const quizContainer = document.getElementById('quiz-container');
const timerDisplay = document.getElementById('timer-display');
const progressText = document.getElementById('progress');
const tituloProva = document.getElementById('prova-titulo');
const scoreElem = document.getElementById('final-score');
const feedbackElem = document.getElementById('final-feedback');

/* ==========================================================================
   1. FUNÇÕES DE INICIALIZAÇÃO E MENU
   ========================================================================== */

/**
 * Chamada quando o usuário clica num botão de ano (ex: "2023").
 * Busca o arquivo JSON correspondente e inicia o quiz.
 */
async function iniciarProva(ano) {
    // 1. Interface: Esconde menu, mostra quiz
    menuScreen.style.display = 'none';
    resultScreen.style.display = 'none';
    quizActive.style.display = 'block';
    
    tituloProva.innerText = `Prova do ENEM ${ano}`;
    quizContainer.innerHTML = '<p style="text-align:center">Carregando prova...</p>';

    try {
        // 2. Busca o JSON gerado pelo Python
        const response = await fetch(`questoes/enem_${ano}.json`);
        
        if (!response.ok) {
            throw new Error(`Arquivo questoes/enem_${ano}.json não encontrado.`);
        }
        
        const dados = await response.json();
        
        // 3. Carrega os dados na variável global
        // O JSON tem o formato: { "ano": 2023, "itens": [...] }
        questoes = dados.itens;
        
        if (!questoes || questoes.length === 0) {
            throw new Error("Este arquivo JSON está vazio ou sem questões.");
        }

        // 4. Reseta estados e começa
        indiceAtual = 0;
        pontuacao = 0;
        carregarQuestao(indiceAtual);

    } catch (erro) {
        console.error(erro);
        quizContainer.innerHTML = `
            <div style="text-align:center; color:#c0392b; padding:20px;">
                <h3>Erro ao carregar a prova!</h3>
                <p>${erro.message}</p>
                <button onclick="location.reload()" style="padding:10px; margin-top:10px;">Voltar</button>
            </div>
        `;
    }
}

/* ==========================================================================
   2. EXIBIÇÃO DA QUESTÃO (CORE)
   ========================================================================== */

function carregarQuestao(index) {
    // 1. Resetar Cronômetro
    clearInterval(timerInterval);
    tempoRestante = TEMPO_POR_QUESTAO;
    atualizarDisplayTimer();
    timerDisplay.classList.remove('timer-danger'); // Remove cor vermelha se tiver
    
    // 2. Atualizar texto de progresso
    progressText.innerText = `Questão ${index + 1} de ${questoes.length}`;
    
    // 3. Pegar dados da questão atual
    const qData = questoes[index];
    
    // 4. Montar HTML da Imagem (se existir)
    let htmlImagem = '';
    if (qData.imagem) {
        // O caminho já vem correto do JSON (ex: "imagens/2009/foto.png")
        htmlImagem = `
            <div class="img-container" style="text-align:center; margin-bottom:20px;">
                <img src="${qData.imagem}" alt="Imagem da questão" style="max-width:100%; max-height:400px; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
            </div>
        `;
    }

    // 5. Montar HTML das Alternativas
    let htmlAlternativas = '<div class="options-list">';
    qData.alternativas.forEach((textoOpcao, i) => {
        // Gera letras A, B, C, D, E baseadas no índice
        const letra = String.fromCharCode(65 + i); 
        htmlAlternativas += `
            <label class="option-label">
                <input type="radio" name="opcao" value="${i}">
                <span style="margin-left:8px;"><strong>${letra})</strong> ${textoOpcao}</span>
            </label>
        `;
    });
    htmlAlternativas += '</div>';

    // 6. Inserir tudo no container
    // Usamos innerHTML para processar as tags <br> e <strong> do enunciado
    quizContainer.innerHTML = `
        <div class="question-box">
            ${htmlImagem}
            <div class="question-text" style="font-size:1.1rem; line-height:1.6; margin-bottom:20px;">
                ${qData.enunciado}
            </div>
            ${htmlAlternativas}
        </div>
    `;
    
    // 7. Iniciar a contagem regressiva
    iniciarCronometro();
}

/* ==========================================================================
   3. CRONÔMETRO
   ========================================================================== */

function iniciarCronometro() {
    timerInterval = setInterval(() => {
        tempoRestante--;
        atualizarDisplayTimer();

        // Alerta visual (fica vermelho) quando faltam 30 segundos
        if (tempoRestante <= 30) {
            timerDisplay.classList.add('timer-danger');
        }

        // Tempo acabou
        if (tempoRestante <= 0) {
            clearInterval(timerInterval);
            lidarComTimeout();
        }
    }, 1000);
}

function atualizarDisplayTimer() {
    let m = Math.floor(tempoRestante / 60);
    let s = tempoRestante % 60;
    // Formatação 00:00
    timerDisplay.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function lidarComTimeout() {
    timerDisplay.innerText = "TEMPO!";
    // Trava as opções para não clicar depois do tempo
    const opcoes = document.querySelectorAll('input[name="opcao"]');
    opcoes.forEach(op => op.disabled = true);
    
    // Espera 1.5s e avança contando como erro
    setTimeout(() => {
         avancarParaProxima(false);
    }, 1500);
}

/* ==========================================================================
   4. VERIFICAÇÃO E NAVEGAÇÃO
   ========================================================================== */

// Função chamada pelo botão "Próxima Questão"
function verificarEProxima() {
    // Para o tempo imediatamente
    clearInterval(timerInterval);
    
    const opcaoSelecionada = document.querySelector('input[name="opcao"]:checked');
    let acertou = false;

    // Se o usuário selecionou algo
    if (opcaoSelecionada) {
        const respostaUsuario = parseInt(opcaoSelecionada.value);
        if (respostaUsuario === questoes[indiceAtual].correta) {
            acertou = true;
        }
    } else {
        // Se clicou em próxima sem marcar nada, conta como erro (ou poderia dar um alert pedindo pra marcar)
        // Por enquanto, vamos assumir que pular = errar
        acertou = false;
    }

    avancarParaProxima(acertou);
}

function avancarParaProxima(foiCorreta) {
    if (foiCorreta) {
        pontuacao++;
    }
    
    indiceAtual++;

    if (indiceAtual < questoes.length) {
        // Ainda tem questões: carrega a próxima
        carregarQuestao(indiceAtual);
    } else {
        // Acabaram as questões: mostra resultado
        mostrarResultadoFinal();
    }
}

/* ==========================================================================
   5. TELA DE RESULTADOS
   ========================================================================== */

function mostrarResultadoFinal() {
    quizActive.style.display = 'none';
    timerDisplay.style.display = 'none'; // Esconde o relógio
    resultScreen.style.display = 'block';

    scoreElem.innerText = `${pontuacao}/${questoes.length}`;

    // Lógica simples de feedback
    const porcentagem = (pontuacao / questoes.length) * 100;
    let mensagem = "";
    let cor = "";

    if (porcentagem >= 80) {
        mensagem = "Excelente! Você dominou essa prova.";
        cor = "#27ae60"; // Verde
    } else if (porcentagem >= 60) {
        mensagem = "Bom trabalho! Mas ainda há espaço para melhorar.";
        cor = "#f39c12"; // Laranja
