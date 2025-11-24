/* ==========================================================================
   SCRIPT.JS - LÓGICA DO SIMULADO ENEM
   ========================================================================== */

// --- VARIÁVEIS GLOBAIS DE ESTADO ---
let questoes = [];          
let indiceAtual = 0;        
let pontuacao = 0;          
let tempoRestante;          
let timerInterval;          
const TEMPO_POR_QUESTAO = 180; // 3 minutos em segundos

// --- ELEMENTOS DO DOM (INTERFACE) ---
const menuScreen = document.getElementById('menu-screen');
const quizActive = document.getElementById('quiz-active');
const resultScreen = document.getElementById('result-container');
const quizContainer = document.getElementById('quiz-container');
const timerDisplay = document.getElementById('timer-display');
const progressText = document.getElementById('progress');
const tituloProva = document.getElementById('prova-titulo');
const scoreElem = document.getElementById('final-score');
const feedbackElem = document.getElementById('final-feedback');

/* ==========================================================================
   1. FUNÇÕES DE INICIALIZAÇÃO E MENU
   ========================================================================== */

async function iniciarProva(ano) {
    menuScreen.style.display = 'none';
    resultScreen.style.display = 'none';
    quizActive.style.display = 'block';
    
    tituloProva.innerText = `Prova do ENEM ${ano}`;
    quizContainer.innerHTML = '<p style="text-align:center">Carregando prova...</p>';

    try {
        const response = await fetch(`questoes/enem_${ano}.json`);
        
        if (!response.ok) {
            throw new Error(`Arquivo questoes/enem_${ano}.json não encontrado.`);
        }
        
        const dados = await response.json();
        questoes = dados.itens;
        
        if (!questoes || questoes.length === 0) {
            throw new Error("Este arquivo JSON está vazio ou sem questões.");
        }

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
   2. EXIBIÇÃO DA QUESTÃO
   ========================================================================== */

function carregarQuestao(index) {
    clearInterval(timerInterval);
    tempoRestante = TEMPO_POR_QUESTAO;
    atualizarDisplayTimer();
    timerDisplay.classList.remove('timer-danger'); 
    
    progressText.innerText = `Questão ${index + 1} de ${questoes.length}`;
    
    const qData = questoes[index];
    
    // HTML da Imagem
    let htmlImagem = '';
    if (qData.imagem) {
        htmlImagem = `
            <div class="img-container" style="text-align:center; margin-bottom:20px;">
                <img src="${qData.imagem}" alt="Imagem da questão" style="max-width:100%; max-height:400px; border-radius:8px; box-shadow:0 2px 5px rgba(0,0,0,0.1);">
            </div>
        `;
    }

    // HTML das Alternativas
    let htmlAlternativas = '<div class="options-list">';
    qData.alternativas.forEach((textoOpcao, i) => {
        const letra = String.fromCharCode(65 + i); 
        htmlAlternativas += `
            <label class="option-label">
                <input type="radio" name="opcao" value="${i}">
                <span style="margin-left:8px;"><strong>${letra})</strong> ${textoOpcao}</span>
            </label>
        `;
    });
    htmlAlternativas += '</div>';

    // HTML do Enunciado
    quizContainer.innerHTML = `
        <div class="question-box">
            ${htmlImagem}
            <div class="question-text" style="font-size:1.1rem; line-height:1.6; margin-bottom:20px;">
                ${qData.enunciado}
            </div>
            ${htmlAlternativas}
        </div>
    `;
    
    iniciarCronometro();
}

/* ==========================================================================
   3. CRONÔMETRO
   ========================================================================== */

function iniciarCronometro() {
    timerInterval = setInterval(() => {
        tempoRestante--;
        atualizarDisplayTimer();

        if (tempoRestante <= 30) {
            timerDisplay.classList.add('timer-danger');
        }

        if (tempoRestante <= 0) {
            clearInterval(timerInterval);
            lidarComTimeout();
        }
    }, 1000);
}

function atualizarDisplayTimer() {
    let m = Math.floor(tempoRestante / 60);
    let s = tempoRestante % 60;
    timerDisplay.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function lidarComTimeout() {
    timerDisplay.innerText = "TEMPO!";
    const opcoes = document.querySelectorAll('input[name="opcao"]');
    opcoes.forEach(op => op.disabled = true);
    
    setTimeout(() => {
         avancarParaProxima(false);
    }, 1500);
}

/* ==========================================================================
   4. VERIFICAÇÃO E NAVEGAÇÃO
   ========================================================================== */

function verificarEProxima() {
    clearInterval(timerInterval);
    
    const opcaoSelecionada = document.querySelector('input[name="opcao"]:checked');
    let acertou = false;

    if (opcaoSelecionada) {
        const respostaUsuario = parseInt(opcaoSelecionada.value);
        if (respostaUsuario === questoes[indiceAtual].correta) {
            acertou = true;
        }
    } 

    avancarParaProxima(acertou);
}

function avancarParaProxima(foiCorreta) {
    if (foiCorreta) {
        pontuacao++;
    }
    
    indiceAtual++;

    if (indiceAtual < questoes.length) {
        carregarQuestao(indiceAtual);
    } else {
        mostrarResultadoFinal();
    }
}

/* ==========================================================================
   5. TELA DE RESULTADOS
   ========================================================================== */

function mostrarResultadoFinal() {
    quizActive.style.display = 'none';
    timerDisplay.style.display = 'none';
    resultScreen.style.display = 'block';

    scoreElem.innerText = `${pontuacao}/${questoes.length}`;

    const porcentagem = (pontuacao / questoes.length) * 100;
    let mensagem = "";
    let cor = "";

    if (porcentagem >= 80) {
        mensagem = "Excelente! Você dominou essa prova.";
        cor = "#27ae60";
    } else if (porcentagem >= 60) {
        mensagem = "Bom trabalho! Mas ainda há espaço para melhorar.";
        cor = "#f39c12";
    } else {
        mensagem = "Precisa estudar mais. Não desanime e tente outra prova!";
        cor = "#c0392b";
    }

    scoreElem.style.color = cor;
    feedbackElem.innerText = mensagem;
}

/* ==========================================================================
   6. UTILITÁRIOS E EXPORTAÇÃO
   ========================================================================== */

// Função Nova: Mostra a versão no canto da tela
function exibirVersao() {
    const versaoDiv = document.createElement('div');
    
    // Estilo fixo no canto inferior direito
    versaoDiv.style.cssText = `
        position: fixed;
        bottom: 5px;
        right: 10px;
        background-color: rgba(255, 255, 255, 0.8);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        color: #7f8c8d;
        pointer-events: none;
        z-index: 9999;
        font-family: monospace;
        border: 1px solid #ddd;
    `;
    
    // Pega a data de modificação do arquivo HTML atual
    const dataVersao = document.lastModified;
    versaoDiv.innerHTML = `Versão: ${dataVersao}`;
    
    document.body.appendChild(versaoDiv);
}

// Inicialização Global
window.verificarEProxima = verificarEProxima;
window.iniciarProva = iniciarProva;

// Chama a função de versão ao carregar
exibirVersao();
