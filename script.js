
// ESTADO
let questoesDoAno = []; // Armazena TODAS as questões do ano selecionado
let questoesQuiz = [];  // Armazena as questões FILTRADAS para o quiz
let indiceAtual = 0;
let pontuacao = 0;
let timerInterval;
let tempoRestante;
const TEMPO_POR_QUESTAO = 180;

// VARIÁVEIS DE SELEÇÃO
let anoSelecionado = null;
let materiaSelecionada = 'all';
let qtdSelecionada = 10;

// DOM ELEMENTS
const boxMateria = document.getElementById('box-materia');
const matContainer = document.getElementById('mat-buttons-container');
const startBtn = document.getElementById('start-btn');
const loadingMsg = document.getElementById('loading-msg');

const nomesAmigaveis = {
    'all': '📚 Todas',
    'ciencias-humanas': '🌍 Humanas',
    'ciencias-natureza': '🧬 Natureza',
    'linguagens': '📖 Linguagens',
    'matematica': '📐 Matemática',
    'geral': 'Geral'
};

// --- 1. INICIALIZAÇÃO: Botões de Ano ---
const yearsDiv = document.getElementById('year-buttons');
for (let y = 2023; y >= 2009; y--) {
    let btn = document.createElement('button');
    btn.className = 'year-btn';
    btn.innerText = y;
    btn.onclick = function() { carregarDadosDoAno(y, this); }; // Chama a função que baixa o JSON
    yearsDiv.appendChild(btn);
}

// --- 2. LÓGICA DE CARREGAMENTO (REATIVIDADE) ---
async function carregarDadosDoAno(ano, btn) {
    // Visual
    document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    // Reset UI
    startBtn.disabled = true;
    startBtn.innerText = "CARREGANDO PROVA...";
    startBtn.style.backgroundColor = "#bdc3c7";
    boxMateria.style.opacity = "0.5";
    boxMateria.style.pointerEvents = "none";
    loadingMsg.style.display = "block";

    anoSelecionado = ano;

    try {
        // BAIXA O JSON AGORA
        const response = await fetch(`questoes/enem_${ano}.json`);
        if (!response.ok) throw new Error("Prova não encontrada");
        const dados = await response.json();
        questoesDoAno = dados.itens; // Salva na memória

        if (!questoesDoAno || questoesDoAno.length === 0) throw new Error("Prova vazia");

        console.log(`Ano ${ano} carregado. Total: ${questoesDoAno.length} questões.`);

        // GERA OS BOTÕES DE MATÉRIA DINAMICAMENTE
        gerarBotoesMateria();

        // Libera a interface
        loadingMsg.style.display = "none";
        boxMateria.style.opacity = "1";
        boxMateria.style.pointerEvents = "auto";

        // Prepara botão de iniciar
        atualizarBotaoIniciar();

    } catch (erro) {
        console.error(erro);
        alert("Erro ao carregar prova: " + erro.message);
        startBtn.innerText = "ERRO AO CARREGAR";
    }
}

function gerarBotoesMateria() {
    // Descobre quais matérias existem neste ano
    const materiasEncontradas = new Set();
    questoesDoAno.forEach(q => {
        if(q.materia) materiasEncontradas.add(q.materia);
    });

    matContainer.innerHTML = ''; // Limpa botões antigos

    // Botão "Todas" (Sempre existe se tiver questões)
    criarBotaoMateria('all', nomesAmigaveis['all'], true);
    materiaSelecionada = 'all'; // Reseta seleção para 'Todas'

    // Cria botões apenas para o que existe
    const ordemDesejada = ['ciencias-humanas', 'ciencias-natureza', 'linguagens', 'matematica'];

    ordemDesejada.forEach(chave => {
        if (materiasEncontradas.has(chave)) {
            criarBotaoMateria(chave, nomesAmigaveis[chave] || chave, false);
        }
    });

    // Se tiver "geral" ou outras coisas estranhas
    materiasEncontradas.forEach(mat => {
        if (!ordemDesejada.includes(mat) && mat !== 'all' && mat !== 'geral') {
             criarBotaoMateria(mat, mat, false);
        }
    });
}

function criarBotaoMateria(valor, texto, ativo) {
    let btn = document.createElement('button');
    btn.className = `mode-btn ${ativo ? 'active' : ''}`;
    btn.innerText = texto;
    btn.onclick = function() {
        materiaSelecionada = valor;
        // Atualiza visual
        matContainer.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        atualizarBotaoIniciar();
    };
    matContainer.appendChild(btn);
}

// --- 3. SELEÇÃO DE QUANTIDADE ---
window.selecionarQtd = function(qtd, btn) {
    qtdSelecionada = qtd;
    document.getElementById('qtd-selector').querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    atualizarBotaoIniciar();
}

function atualizarBotaoIniciar() {
    if (anoSelecionado && questoesDoAno.length > 0) {
        let txtMat = materiaSelecionada === 'all' ? 'COMPLETA' : nomesAmigaveis[materiaSelecionada].toUpperCase();
        startBtn.disabled = false;
        startBtn.style.backgroundColor = "#27ae60";
        startBtn.innerText = `INICIAR: ${anoSelecionado} | ${txtMat}`;
    }
}

// --- 4. INICIAR O QUIZ (COM DADOS JÁ NA MEMÓRIA) ---
window.irParaQuiz = function() {
    // Filtra
    let listaFiltrada = questoesDoAno;

    if (materiaSelecionada !== 'all') {
        listaFiltrada = questoesDoAno.filter(q => q.materia === materiaSelecionada);
    }

    if (qtdSelecionada !== 'all') {
        listaFiltrada = shuffleArray([...listaFiltrada]).slice(0, qtdSelecionada);
    } else {
        // Se for "Todas", não embaralha para manter a ordem da prova? 
        // Ou embaralha? Geralmente simulado completo mantém ordem. Vamos manter ordem se for ALL.
        // Se for matéria específica, mantemos ordem também.
        // Apenas embaralha se for quantidade reduzida (treino).
    }

    questoesQuiz = listaFiltrada;

    if (questoesQuiz.length === 0) {
        alert("Erro inesperado: 0 questões selecionadas.");
        return;
    }

    // Troca de Tela
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('result-container').style.display = 'none';
    document.getElementById('quiz-active').style.display = 'block';

    let txtQtd = qtdSelecionada === 'all' ? 'Completa' : qtdSelecionada;
    let nomeMat = nomesAmigaveis[materiaSelecionada] || materiaSelecionada;
    document.getElementById('prova-titulo').innerText = `${anoSelecionado} | ${nomeMat} | ${txtQtd} Questões`;

    indiceAtual = 0;
    pontuacao = 0;
    carregarQuestaoNaTela(0);
}

// --- 5. LÓGICA DO QUIZ (CORE) ---
function carregarQuestaoNaTela(index) {
    clearInterval(timerInterval);
    tempoRestante = TEMPO_POR_QUESTAO;
    atualizarDisplayTimer();
    document.getElementById('timer-display').classList.remove('timer-danger');
    document.getElementById('progress').innerText = `Questão ${index + 1} de ${questoesQuiz.length}`;

    const q = questoesQuiz[index];
    const container = document.getElementById('quiz-container');

    let htmlImg = q.imagem ? `<div class="img-container" style="text-align:center;margin-bottom:20px;"><img src="${q.imagem}"></div>` : '';

    let htmlOpts = '<div class="options-list">';
    q.alternativas.forEach((t, i) => {
        let l = String.fromCharCode(65 + i);
        htmlOpts += `<label class="option-label"><input type="radio" name="opcao" value="${i}"><span style="margin-left:8px;"><strong>${l})</strong> ${t}</span></label>`;
    });
    htmlOpts += '</div>';

    // Badge Matéria
    let nomeMatUI = q.materia ? (nomesAmigaveis[q.materia] || q.materia) : 'Geral';
    let badge = `<div style="text-align:right; margin-bottom:5px;"><span style="font-size:0.75rem; background:#ecf0f1; padding:4px 8px; border-radius:4px; color:#7f8c8d;">${nomeMatUI}</span></div>`;

    container.innerHTML = `<div class="question-box">${badge}${htmlImg}<div class="question-text">${q.enunciado}</div>${htmlOpts}</div>`;

    iniciarCronometro();
}

// ... (Resto das funções de cronômetro e verificação iguais) ...

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function iniciarCronometro() {
    timerInterval = setInterval(() => {
        tempoRestante--; atualizarDisplayTimer();
        if (tempoRestante <= 30) document.getElementById('timer-display').classList.add('timer-danger');
        if (tempoRestante <= 0) { clearInterval(timerInterval); lidarComTimeout(); }
    }, 1000);
}
function atualizarDisplayTimer() {
    let m = Math.floor(tempoRestante / 60); let s = tempoRestante % 60;
    document.getElementById('timer-display').innerText = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}
function lidarComTimeout() {
    document.getElementById('timer-display').innerText = "TEMPO!";
    document.querySelectorAll('input[name="opcao"]').forEach(op => op.disabled = true);
    setTimeout(() => avancarParaProxima(false), 1500);
}
window.verificarEProxima = function() {
    clearInterval(timerInterval);
    const sel = document.querySelector('input[name="opcao"]:checked');
    let acertou = false;
    if (sel && parseInt(sel.value) === questoesQuiz[indiceAtual].correta) acertou = true;
    avancarParaProxima(acertou);
}
function avancarParaProxima(ok) {
    if (ok) pontuacao++;
    indiceAtual++;
    if (indiceAtual < questoesQuiz.length) carregarQuestaoNaTela(indiceAtual);
    else mostrarResultadoFinal();
}
function mostrarResultadoFinal() {
    document.getElementById('quiz-active').style.display = 'none';
    document.getElementById('timer-display').style.display = 'none';
    document.getElementById('result-container').style.display = 'block';

    const scoreElem = document.getElementById('final-score');
    const feedbackElem = document.getElementById('final-feedback');

    scoreElem.innerText = `${pontuacao}/${questoesQuiz.length}`;
    let p = (pontuacao / questoesQuiz.length) * 100;
    let msg = p >= 80 ? "Excelente!" : p >= 60 ? "Bom trabalho!" : "Precisa estudar mais.";
    scoreElem.style.color = p >= 60 ? (p>=80?"#27ae60":"#f39c12") : "#c0392b";
    feedbackElem.innerText = msg;
}

// Debug Version
const vDiv = document.createElement('div');
vDiv.style.cssText = "position:fixed;bottom:5px;right:10px;font-size:0.7rem;color:#ccc;pointer-events:none;";
vDiv.innerText = "Versão Reativa: " + new Date().toLocaleTimeString();
document.body.appendChild(vDiv);
