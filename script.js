
let questoes = []; let indiceAtual = 0; let pontuacao = 0; let tempoRestante; let timerInterval;
let qtdGlobal = 10; // Padrão
let materiaGlobal = 'all'; // Padrão
let anoSelecionado = null; // Armazena o ano escolhido

const TEMPO_POR_QUESTAO = 180;

// Elementos
const menuScreen = document.getElementById('menu-screen');
const quizActive = document.getElementById('quiz-active');
const resultScreen = document.getElementById('result-container');
const quizContainer = document.getElementById('quiz-container');
const timerDisplay = document.getElementById('timer-display');
const progressText = document.getElementById('progress');
const tituloProva = document.getElementById('prova-titulo');
const scoreElem = document.getElementById('final-score');
const feedbackElem = document.getElementById('final-feedback');
const startBtn = document.getElementById('start-btn');

// --- 1. GERAÇÃO DOS BOTÕES DE ANO ---
const yearsDiv = document.getElementById('year-buttons');
for (let y = 2023; y >= 2009; y--) {
    let btn = document.createElement('button');
    btn.className = 'year-btn';
    btn.innerText = y;
    // IMPORTANTE: Agora chama selecionarAno, não iniciarQuiz
    btn.onclick = function() { selecionarAno(y, this); };
    yearsDiv.appendChild(btn);
}

// --- 2. FUNÇÕES DE SELEÇÃO (CORRIGIDAS) ---

// Seleciona Quantidade
window.selecionarQtd = function(qtd, btn) {
    qtdGlobal = qtd;
    console.log("Qtd selecionada:", qtdGlobal);
    // Remove active dos outros botões desse grupo
    const container = document.getElementById('qtd-selector');
    container.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// Seleciona Matéria
window.selecionarMateria = function(mat, btn) {
    materiaGlobal = mat;
    console.log("Matéria selecionada:", materiaGlobal);
    const container = document.getElementById('mat-selector');
    container.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// Seleciona Ano (Apenas visual + Habilitar botão Start)
window.selecionarAno = function(ano, btn) {
    anoSelecionado = ano;
    console.log("Ano selecionado:", anoSelecionado);

    // Remove selecionado dos outros anos
    document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    // Habilita o botão Iniciar
    startBtn.disabled = false;
    startBtn.innerText = `INICIAR PROVA ${ano} (▶)`;
    startBtn.style.backgroundColor = "#27ae60";
}

// --- 3. INICIAR QUIZ (LÓGICA REAL) ---
window.iniciarQuiz = async function() {
    if (!anoSelecionado) return; // Segurança

    menuScreen.style.display = 'none';
    resultScreen.style.display = 'none';
    quizActive.style.display = 'block';

    const nomesMateria = {
        'all': 'Geral',
        'ciencias-humanas': 'Humanas',
        'ciencias-natureza': 'Natureza',
        'linguagens': 'Linguagens',
        'matematica': 'Matemática'
    };

    let txtQtd = qtdGlobal === 'all' ? 'Completa' : qtdGlobal;
    let txtMat = nomesMateria[materiaGlobal] || 'Geral';
    tituloProva.innerText = `ENEM ${anoSelecionado} | ${txtMat}`;

    quizContainer.innerHTML = '<p style="text-align:center">Filtrando questões...</p>';

    try {
        const response = await fetch(`questoes/enem_${anoSelecionado}.json`);
        if (!response.ok) throw new Error("Arquivo da prova não encontrado.");
        const dados = await response.json();

        let listaCompleta = dados.itens;
        if (!listaCompleta || listaCompleta.length === 0) throw new Error("Sem questões neste ano.");

        // Filtro Matéria
        let listaFiltrada = listaCompleta;
        if (materiaGlobal !== 'all') {
            listaFiltrada = listaCompleta.filter(item => item.materia === materiaGlobal);
        }

        if (listaFiltrada.length === 0) {
            throw new Error(`Não há questões de ${nomesMateria[materiaGlobal]} em ${anoSelecionado}.`);
        }

        // Filtro Quantidade
        if (qtdGlobal === 'all') {
            questoes = listaFiltrada;
        } else {
            questoes = shuffleArray([...listaFiltrada]).slice(0, qtdGlobal);
        }

        indiceAtual = 0; pontuacao = 0; carregarQuestao(indiceAtual);
    } catch (erro) {
        console.error(erro);
        quizContainer.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <h3 style="color:#c0392b">Ops!</h3>
                <p>${erro.message}</p>
                <button onclick="location.reload()" style="padding:10px; margin-top:10px;">Voltar</button>
            </div>`;
    }
}

// --- UTILITÁRIOS ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
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

    let badgeMat = q.materia ? `<span style="font-size:0.8rem; background:#ecf0f1; padding:2px 6px; border-radius:4px; color:#7f8c8d;">${q.materia}</span>` : '';

    quizContainer.innerHTML = `
        <div class="question-box">
            <div style="text-align:right; margin-bottom:5px;">${badgeMat}</div>
            ${htmlImg}
            <div class="question-text">${q.enunciado}</div>
            ${htmlOpts}
        </div>`;
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
window.verificarEProxima = function() {
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

// Versão de Debug
const vDiv = document.createElement('div');
vDiv.style.cssText = "position:fixed;bottom:5px;right:10px;font-size:0.7rem;color:#ccc;pointer-events:none;";
vDiv.innerText = "Interface Corrigida: " + new Date().toLocaleTimeString();
document.body.appendChild(vDiv);
