let questoes = [];
let indiceAtual = 0;
let pontuacao = 0;
let tempoRestante;
let timerInterval;
const TEMPO_POR_QUESTAO = 180; // 3 minutos

// Elementos do DOM
const quizContainer = document.getElementById('quiz-container');
const timerDisplay = document.getElementById('timer-display');
const progressText = document.getElementById('progress');
const activeScreen = document.getElementById('quiz-active');
const resultScreen = document.getElementById('result-container');

// --- CARREGAMENTO DOS DADOS (JSON) ---
async function carregarDados() {
    try {
        const response = await fetch('questoes.json');
        questoes = await response.json();
        iniciarQuiz();
    } catch (erro) {
        console.error("Erro ao carregar o JSON:", erro);
        quizContainer.innerHTML = "<p style='color:red'>Erro ao carregar questões. Verifique se o arquivo questoes.json está no repositório.</p>";
    }
}

function iniciarQuiz() {
    carregarQuestao(indiceAtual);
}

function carregarQuestao(index) {
    clearInterval(timerInterval);
    tempoRestante = TEMPO_POR_QUESTAO;
    atualizarDisplayTimer();
    timerDisplay.classList.remove('timer-danger');
    
    progressText.innerText = `Questão ${index + 1} de ${questoes.length}`;
    
    const qData = questoes[index];
    let html = `<div class="question-box">
                    <div class="question-text">${qData.q}</div>
                    <div class="options-list">`;
    
    qData.options.forEach((opt, i) => {
        html += `<label class="option-label">
                    <input type="radio" name="opcao" value="${i}">
                    <span>${opt}</span>
                 </label>`;
    });

    html += `</div></div>`;
    quizContainer.innerHTML = html;
    
    iniciarCronometro();
}

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
    setTimeout(() => {
         avancarParaProxima(false);
    }, 1000);
}

function verificarEProxima() {
    clearInterval(timerInterval);
    const opcaoSelecionada = document.querySelector('input[name="opcao"]:checked');
    let acertou = false;

    if (opcaoSelecionada) {
        const respostaUsuario = parseInt(opcaoSelecionada.value);
        if (respostaUsuario === questoes[indiceAtual].correct) {
            acertou = true;
        }
    }
    avancarParaProxima(acertou);
}

// Tornamos a função acessível globalmente para o botão HTML chamar
window.verificarEProxima = verificarEProxima;

function avancarParaProxima(foiCorreta) {
    if (foiCorreta) pontuacao++;
    indiceAtual++;

    if (indiceAtual < questoes.length) {
        carregarQuestao(indiceAtual);
    } else {
        mostrarResultadoFinal();
    }
}

function mostrarResultadoFinal() {
    activeScreen.style.display = 'none';
    timerDisplay.style.display = 'none';
    resultScreen.style.display = 'block';

    const scoreElem = document.getElementById('final-score');
    const feedbackElem = document.getElementById('final-feedback');

    scoreElem.innerText = `${pontuacao}/${questoes.length}`;
    
    let porcentagem = (pontuacao / questoes.length) * 100;
    if (porcentagem >= 80) feedbackElem.innerText = "Excelente! Você está muito bem preparado.";
    else if (porcentagem >= 60) feedbackElem.innerText = "Bom trabalho! Mas ainda pode melhorar.";
    else feedbackElem.innerText = "Precisa estudar mais os temas base.";
}

// Inicia tudo
carregarDados();
