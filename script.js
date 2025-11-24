
let questoes = []; let indiceAtual = 0; let pontuacao = 0; let tempoRestante; let timerInterval;
const TEMPO_POR_QUESTAO = 180;
const menuScreen = document.getElementById('menu-screen');
const quizActive = document.getElementById('quiz-active');
const resultScreen = document.getElementById('result-container');
const quizContainer = document.getElementById('quiz-container');
const timerDisplay = document.getElementById('timer-display');
const progressText = document.getElementById('progress');
const tituloProva = document.getElementById('prova-titulo');
const scoreElem = document.getElementById('final-score');
const feedbackElem = document.getElementById('final-feedback');

const yearsDiv = document.getElementById('year-buttons');
for (let y = 2023; y >= 2009; y--) {
    let btn = document.createElement('button');
    btn.className = 'year-btn';
    btn.innerText = y;
    btn.onclick = function() { iniciarProva(y); };
    yearsDiv.appendChild(btn);
}

async function iniciarProva(ano) {
    menuScreen.style.display = 'none'; resultScreen.style.display = 'none'; quizActive.style.display = 'block';
    tituloProva.innerText = `Prova do ENEM ${ano}`;
    quizContainer.innerHTML = '<p style="text-align:center">Carregando prova...</p>';
    try {
        const response = await fetch(`questoes/enem_${ano}.json`);
        if (!response.ok) throw new Error("Arquivo não encontrado.");
        const dados = await response.json();
        questoes = dados.itens;
        if (!questoes || questoes.length === 0) throw new Error("Sem questões.");
        indiceAtual = 0; pontuacao = 0; carregarQuestao(indiceAtual);
    } catch (erro) {
        console.error(erro);
        quizContainer.innerHTML = `<p style="text-align:center;color:red">Erro: ${erro.message}</p><button onclick="location.reload()">Voltar</button>`;
    }
}

function carregarQuestao(index) {
    clearInterval(timerInterval); tempoRestante = TEMPO_POR_QUESTAO; atualizarDisplayTimer();
    timerDisplay.classList.remove('timer-danger');
    progressText.innerText = `Questão ${index + 1} de ${questoes.length}`;
    const q = questoes[index];

    let htmlImg = q.imagem ? `<div class="img-container" style="text-align:center;margin-bottom:20px;"><img src="${q.imagem}"></div>` : '';
    let htmlOpts = '<div class="options-list">';
    q.alternativas.forEach((t, i) => {
        let l = String.fromCharCode(65 + i);
        htmlOpts += `<label class="option-label"><input type="radio" name="opcao" value="${i}"><span style="margin-left:8px;"><strong>${l})</strong> ${t}</span></label>`;
    });
    htmlOpts += '</div>';

    quizContainer.innerHTML = `<div class="question-box">${htmlImg}<div class="question-text">${q.enunciado}</div>${htmlOpts}</div>`;
    iniciarCronometro();
}

function iniciarCronometro() {
    timerInterval = setInterval(() => {
        tempoRestante--; atualizarDisplayTimer();
        if (tempoRestante <= 30) timerDisplay.classList.add('timer-danger');
        if (tempoRestante <= 0) { clearInterval(timerInterval); lidarComTimeout(); }
    }, 1000);
}
function atualizarDisplayTimer() {
    let m = Math.floor(tempoRestante / 60); let s = tempoRestante % 60;
    timerDisplay.innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}
function lidarComTimeout() {
    timerDisplay.innerText = "TEMPO!";
    document.querySelectorAll('input[name="opcao"]').forEach(op => op.disabled = true);
    setTimeout(() => avancarParaProxima(false), 1500);
}
function verificarEProxima() {
    clearInterval(timerInterval);
    const sel = document.querySelector('input[name="opcao"]:checked');
    let acertou = false;
    if (sel && parseInt(sel.value) === questoes[indiceAtual].correta) acertou = true;
    avancarParaProxima(acertou);
}
function avancarParaProxima(ok) {
    if (ok) pontuacao++;
    indiceAtual++;
    if (indiceAtual < questoes.length) carregarQuestao(indiceAtual);
    else mostrarResultadoFinal();
}
function mostrarResultadoFinal() {
    quizActive.style.display = 'none'; timerDisplay.style.display = 'none'; resultScreen.style.display = 'block';
    scoreElem.innerText = `${pontuacao}/${questoes.length}`;
    let p = (pontuacao / questoes.length) * 100;
    let msg = p >= 80 ? "Excelente!" : p >= 60 ? "Bom trabalho!" : "Precisa estudar mais.";
    scoreElem.style.color = p >= 60 ? (p>=80?"#27ae60":"#f39c12") : "#c0392b";
    feedbackElem.innerText = msg;
}
window.verificarEProxima = verificarEProxima; window.iniciarProva = iniciarProva;
const vDiv = document.createElement('div');
vDiv.style.cssText = "position:fixed;bottom:5px;right:10px;font-size:0.7rem;color:#ccc;pointer-events:none;";
vDiv.innerText = "Gerado: " + new Date().toLocaleTimeString();
document.body.appendChild(vDiv);
