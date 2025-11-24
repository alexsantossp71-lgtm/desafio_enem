
// --- ESTADO DA APLICAÇÃO ---
let dadosCompletosAno = [];
let questoesFiltradas = [];
let indiceAtual = 0;
let pontuacao = 0;
let timerInterval;
let anoAtual = null;
let materiaAtual = 'all';
let qtdAtual = 10;

// --- ELEMENTOS DOM ---
const els = {
    menu: document.getElementById('menu-screen'),
    quiz: document.getElementById('quiz-active'),
    result: document.getElementById('result-container'),
    yearGrid: document.getElementById('year-buttons'),
    matContainer: document.getElementById('mat-buttons-container'),
    boxMateria: document.getElementById('box-materia'),
    boxQtd: document.getElementById('box-qtd'),
    startBtn: document.getElementById('start-btn'),
    loading: document.getElementById('loading-msg'),
    quizContainer: document.getElementById('quiz-container'),
    timer: document.getElementById('timer-display'),
    progress: document.getElementById('progress'),
    titulo: document.getElementById('prova-titulo'),
    score: document.getElementById('final-score'),
    feedback: document.getElementById('final-feedback')
};

const nomesMateria = {
    'all': '📚 Todas',
    'ciencias-humanas': '🌍 Humanas',
    'ciencias-natureza': '🧬 Natureza',
    'linguagens': '📖 Linguagens',
    'matematica': '📐 Matemática',
    'geral': 'Geral'
};

// --- 1. INICIALIZAR ---
// Cria botões de ano
for (let y = 2023; y >= 2009; y--) {
    let btn = document.createElement('button');
    btn.className = 'year-btn';
    btn.innerText = y;
    btn.onclick = () => carregarAno(y, btn);
    els.yearGrid.appendChild(btn);
}

// --- 2. LÓGICA DE CARREGAMENTO ---
async function carregarAno(ano, btnElement) {
    // UI Update
    document.querySelectorAll('.year-btn').forEach(b => b.classList.remove('selected'));
    btnElement.classList.add('selected');

    els.loading.style.display = 'block';
    els.startBtn.disabled = true;
    els.boxMateria.style.opacity = 0.5;
    els.boxQtd.style.opacity = 0.5;

    anoAtual = ano;

    try {
        const res = await fetch(`questoes/enem_${ano}.json`);
        if (!res.ok) throw new Error('Prova não encontrada');

        const json = await res.json();
        dadosCompletosAno = json.itens;

        console.log(`Ano ${ano} carregado. ${dadosCompletosAno.length} questões.`);

        // Gerar botões de matéria com base no que existe no JSON
        gerarBotoesMateria();

        // Destrava UI
        els.loading.style.display = 'none';
        els.boxMateria.style.opacity = 1;
        els.boxMateria.style.pointerEvents = 'auto';
        els.boxQtd.style.opacity = 1;
        els.boxQtd.style.pointerEvents = 'auto';

        atualizarBotaoStart();

    } catch (err) {
        console.error(err);
        alert("Erro ao carregar prova: " + err.message);
        els.loading.style.display = 'none';
    }
}

function gerarBotoesMateria() {
    els.matContainer.innerHTML = '';

    // Identifica matérias únicas presentes neste ano
    const mats = new Set();
    dadosCompletosAno.forEach(q => {
        if(q.materia) mats.add(q.materia);
    });

    // Sempre adiciona "Todas"
    criarBtnMateria('all', nomesMateria['all'], true);
    materiaAtual = 'all';

    // Ordem de preferência
    ['ciencias-humanas', 'ciencias-natureza', 'linguagens', 'matematica'].forEach(m => {
        if(mats.has(m)) criarBtnMateria(m, nomesMateria[m] || m, false);
    });
}

function criarBtnMateria(val, texto, ativo) {
    let btn = document.createElement('button');
    btn.className = `mode-btn ${ativo ? 'active' : ''}`;
    btn.innerText = texto;
    btn.onclick = () => {
        materiaAtual = val;
        els.matContainer.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        atualizarBotaoStart();
    };
    els.matContainer.appendChild(btn);
}

// Seleção de Qtd
window.selecionarQtd = function(q, btn) {
    qtdAtual = q;
    document.getElementById('qtd-selector').querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    atualizarBotaoStart();
}

function atualizarBotaoStart() {
    if(anoAtual && dadosCompletosAno.length > 0) {
        els.startBtn.disabled = false;
        els.startBtn.style.backgroundColor = "#27ae60";
        let mName = materiaAtual === 'all' ? 'COMPLETA' : (nomesMateria[materiaAtual] || materiaAtual);
        els.startBtn.innerText = `INICIAR: ${anoAtual} (${mName})`;
    }
}

// --- 3. QUIZ ---
window.irParaQuiz = function() {
    // Filtragem
    let lista = dadosCompletosAno;

    if(materiaAtual !== 'all') {
        lista = lista.filter(q => q.materia === materiaAtual);
    }

    if(lista.length === 0) {
        alert("Erro: Nenhuma questão encontrada para este filtro.");
        return;
    }

    // Embaralhamento se não for "todas"
    if(qtdAtual !== 'all') {
        lista = lista.sort(() => Math.random() - 0.5).slice(0, qtdAtual);
    }

    questoesFiltradas = lista;
    indiceAtual = 0;
    pontuacao = 0;

    // Troca tela
    els.menu.style.display = 'none';
    els.result.style.display = 'none';
    els.quiz.style.display = 'block';

    let mTitulo = materiaAtual === 'all' ? 'Geral' : (nomesMateria[materiaAtual] || materiaAtual);
    els.titulo.innerText = `${anoAtual} | ${mTitulo}`;

    carregarQuestao(0);
}

function carregarQuestao(idx) {
    clearInterval(timerInterval);
    let tempo = 180; // 3 min
    atualizarTimer(tempo);

    els.progress.innerText = `Questão ${idx + 1} de ${questoesFiltradas.length}`;
    const q = questoesFiltradas[idx];

    let imgHTML = q.imagem ? `<div class="img-container" style="text-align:center; margin-bottom:15px;"><img src="${q.imagem}"></div>` : '';

    let optsHTML = '<div class="options-list">';
    q.alternativas.forEach((alt, i) => {
        let letra = String.fromCharCode(65+i);
        optsHTML += `<label class="option-label"><input type="radio" name="resp" value="${i}"><span style="margin-left:10px;"><b>${letra})</b> ${alt}</span></label>`;
    });
    optsHTML += '</div>';

    let matBadge = q.materia ? `<div style="text-align:right; margin-bottom:5px;"><span style="font-size:0.7rem; background:#eee; padding:3px 6px; border-radius:4px;">${nomesMateria[q.materia]||q.materia}</span></div>` : '';

    els.quizContainer.innerHTML = `<div class="question-box">${matBadge}${imgHTML}<div class="question-text">${q.enunciado}</div>${optsHTML}</div>`;

    timerInterval = setInterval(() => {
        tempo--;
        atualizarTimer(tempo);
        if(tempo <= 0) { clearInterval(timerInterval); avancar(false); }
    }, 1000);
}

function atualizarTimer(s) {
    let m = Math.floor(s/60);
    let sec = s%60;
    els.timer.innerText = `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
    els.timer.style.backgroundColor = s < 30 ? '#e74c3c' : '#2c3e50';
}

window.verificarEProxima = function() {
    clearInterval(timerInterval);
    const sel = document.querySelector('input[name="resp"]:checked');
    let acertou = false;
    if(sel && parseInt(sel.value) === questoesFiltradas[indiceAtual].correta) acertou = true;
    avancar(acertou);
}

function avancar(acertou) {
    if(acertou) pontuacao++;
    indiceAtual++;
    if(indiceAtual < questoesFiltradas.length) {
        carregarQuestao(indiceAtual);
    } else {
        finalizar();
    }
}

function finalizar() {
    els.quiz.style.display = 'none';
    els.result.style.display = 'block';
    els.score.innerText = `${pontuacao}/${questoesFiltradas.length}`;

    let p = (pontuacao / questoesFiltradas.length) * 100;
    let msg = p >= 70 ? "Mandou bem! 👏" : "Continue treinando! 💪";
    els.feedback.innerText = msg;
}

// Versão Debug
const v = document.createElement('div');
v.innerText = "Versão Master: " + new Date().toLocaleTimeString();
v.style.cssText = "position:fixed; bottom:5px; right:10px; font-size:0.7rem; color:#ccc;";
document.body.appendChild(v);
