// Desafio ENEM — lógica principal
// Melhorias: carregamento protegido contra corrida, validação dos dados,
// embaralhamento sem mutação, renderização segura das alternativas e timer resiliente.

let dadosCompletosAno = [];
let questoesFiltradas = [];
let indiceAtual = 0;
let pontuacao = 0;
let timerInterval = null;
let anoAtual = null;
let materiaAtual = 'all';
let qtdAtual = 10;
let respostasUsuario = [];
let carregamentoId = 0;
let avancando = false;

const TEMPO_POR_QUESTAO = 180;

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
    all: '📚 Todas',
    'ciencias-humanas': '🌍 Humanas',
    'ciencias-natureza': '🧬 Natureza',
    linguagens: '📖 Linguagens',
    matematica: '📐 Matemática',
    geral: 'Geral'
};

function definirCarregamento(ativo, mensagem = '🔄 Carregando questões...') {
    els.loading.textContent = mensagem;
    els.loading.style.display = ativo ? 'block' : 'none';
    els.yearGrid.querySelectorAll('button').forEach(btn => {
        btn.disabled = ativo;
    });
}

function validarQuestao(q) {
    return q &&
        typeof q.enunciado === 'string' &&
        Array.isArray(q.alternativas) &&
        q.alternativas.length >= 2 &&
        Number.isInteger(q.correta) &&
        q.correta >= 0 &&
        q.correta < q.alternativas.length &&
        q.alternativas.every(a => typeof a === 'string');
}

function escaparHTML(valor) {
    return String(valor).replace(/[&<>"']/g, caractere => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[caractere]);
}

function caminhoImagemSeguro(caminho) {
    if (typeof caminho !== 'string' || !caminho.trim()) return null;
    try {
        const url = new URL(caminho, document.baseURI);
        if (url.origin !== location.origin || /^(javascript|data):/i.test(url.protocol)) return null;
        return url.href;
    } catch {
        return null;
    }
}

// Inicialização dos anos disponíveis.
for (let ano = 2023; ano >= 2009; ano--) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'year-btn';
    btn.textContent = ano;
    btn.addEventListener('click', () => carregarAno(ano, btn));
    els.yearGrid.appendChild(btn);
}

async function carregarAno(ano, btnElement) {
    const idDestaRequisicao = ++carregamentoId;

    els.yearGrid.querySelectorAll('.year-btn').forEach(btn => btn.classList.remove('selected'));
    btnElement.classList.add('selected');

    definirCarregamento(true, `🔄 Lendo prova de ${ano}...`);
    els.startBtn.disabled = true;
    els.startBtn.textContent = 'CARREGANDO...';
    els.boxMateria.style.opacity = '0.5';
    els.boxMateria.style.pointerEvents = 'none';
    els.boxQtd.style.opacity = '0.5';
    els.boxQtd.style.pointerEvents = 'none';

    // Não deixa dados do ano anterior serem usados se o novo carregamento falhar.
    anoAtual = ano;
    dadosCompletosAno = [];
    materiaAtual = 'all';
    els.matContainer.replaceChildren();

    try {
        const resposta = await fetch(`questoes/enem_${ano}.json`, {
            headers: { Accept: 'application/json' },
            cache: 'default'
        });

        if (!resposta.ok) {
            throw new Error(`Não foi possível carregar a prova (HTTP ${resposta.status}).`);
        }

        const json = await resposta.json();
        if (!json || !Array.isArray(json.itens)) {
            throw new Error('O arquivo da prova não contém uma lista válida de questões.');
        }

        const validas = json.itens.filter(validarQuestao);
        if (validas.length === 0) {
            throw new Error('Nenhuma questão válida foi encontrada neste arquivo.');
        }

        // Uma resposta antiga nunca pode sobrescrever a seleção mais recente.
        if (idDestaRequisicao !== carregamentoId) return;

        dadosCompletosAno = validas;
        gerarBotoesMateria();

        els.boxMateria.style.opacity = '1';
        els.boxMateria.style.pointerEvents = 'auto';
        els.boxQtd.style.opacity = '1';
        els.boxQtd.style.pointerEvents = 'auto';

        const descartadas = json.itens.length - validas.length;
        definirCarregamento(false);
        atualizarBotaoStart();

        if (descartadas > 0) {
            els.loading.textContent = `Aviso: ${descartadas} questão(ões) inválida(s) foram ignoradas.`;
            els.loading.style.display = 'block';
        }
    } catch (erro) {
        if (idDestaRequisicao !== carregamentoId) return;
        dadosCompletosAno = [];
        anoAtual = null;
        definirCarregamento(false);
        els.startBtn.disabled = true;
        els.startBtn.textContent = 'NÃO FOI POSSÍVEL CARREGAR';
        els.matContainer.innerHTML = '<p class="hint-text">Não foi possível carregar as matérias. Escolha outro ano ou tente novamente.</p>';
        console.error('Falha ao carregar prova:', erro);
        alert(`Erro ao carregar a prova de ${ano}: ${erro.message}`);
    }
}

function gerarBotoesMateria() {
    els.matContainer.replaceChildren();
    const materias = new Set(dadosCompletosAno.map(q => q.materia).filter(Boolean));

    criarBtnMateria('all', nomesMateria.all, true);
    materiaAtual = 'all';

    ['ciencias-humanas', 'ciencias-natureza', 'linguagens', 'matematica', 'geral'].forEach(materia => {
        if (materias.has(materia)) criarBtnMateria(materia, nomesMateria[materia] || materia, false);
    });

    // Inclui matérias inesperadas no JSON, sem escondê-las do usuário.
    [...materias].filter(m => !nomesMateria[m]).sort().forEach(m => criarBtnMateria(m, m, false));
}

function criarBtnMateria(valor, texto, ativo) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `mode-btn${ativo ? ' active' : ''}`;
    btn.textContent = texto;
    btn.addEventListener('click', () => {
        materiaAtual = valor;
        els.matContainer.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        atualizarBotaoStart();
    });
    els.matContainer.appendChild(btn);
}

window.selecionarQtd = function (quantidade, btn) {
    qtdAtual = quantidade;
    document.querySelectorAll('#qtd-selector .mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    atualizarBotaoStart();
};

function atualizarBotaoStart() {
    const total = materiaAtual === 'all'
        ? dadosCompletosAno.length
        : dadosCompletosAno.filter(q => q.materia === materiaAtual).length;

    const disponiveis = qtdAtual === 'all' ? total : Math.min(Number(qtdAtual), total);
    const pronto = Boolean(anoAtual && total > 0 && disponiveis > 0);
    els.startBtn.disabled = !pronto;

    if (!pronto) {
        els.startBtn.textContent = anoAtual ? 'NENHUMA QUESTÃO NESTE FILTRO' : 'SELECIONE O ANO';
        return;
    }

    const nome = materiaAtual === 'all' ? 'COMPLETA' : (nomesMateria[materiaAtual] || materiaAtual);
    els.startBtn.textContent = `INICIAR: ${anoAtual} (${nome}) — ${disponiveis} QUESTÕES`;
}

window.irParaQuiz = function () {
    let lista = materiaAtual === 'all'
        ? [...dadosCompletosAno]
        : dadosCompletosAno.filter(q => q.materia === materiaAtual);

    if (lista.length === 0) {
        alert('Nenhuma questão encontrada para este filtro.');
        return;
    }

    if (qtdAtual !== 'all') {
        // Fisher-Yates: embaralha uma cópia sem alterar o banco original.
        for (let i = lista.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lista[i], lista[j]] = [lista[j], lista[i]];
        }
        lista = lista.slice(0, Math.min(Number(qtdAtual), lista.length));
    }

    questoesFiltradas = lista;
    indiceAtual = 0;
    pontuacao = 0;
    respostasUsuario = [];
    avancando = false;

    els.menu.style.display = 'none';
    els.result.style.display = 'none';
    els.quiz.style.display = 'block';

    const tituloMateria = materiaAtual === 'all' ? 'Geral' : (nomesMateria[materiaAtual] || materiaAtual);
    els.titulo.textContent = `${anoAtual} | ${tituloMateria}`;
    carregarQuestao(0);
};

function carregarQuestao(indice) {
    clearInterval(timerInterval);
    avancando = false;

    const questao = questoesFiltradas[indice];
    if (!questao) return finalizar();

    let tempoRestante = TEMPO_POR_QUESTAO;
    atualizarTimer(tempoRestante);
    els.progress.textContent = `Questão ${indice + 1} de ${questoesFiltradas.length}`;

    const caixa = document.createElement('div');
    caixa.className = 'question-box';

    if (questao.materia) {
        const badge = document.createElement('div');
        badge.style.cssText = 'text-align:right;margin-bottom:5px;';
        const badgeTexto = document.createElement('span');
        badgeTexto.style.cssText = 'font-size:.7rem;background:#eee;padding:3px 6px;border-radius:4px;';
        badgeTexto.textContent = nomesMateria[questao.materia] || questao.materia;
        badge.appendChild(badgeTexto);
        caixa.appendChild(badge);
    }

    const imagem = caminhoImagemSeguro(questao.imagem);
    if (imagem) {
        const wrapper = document.createElement('div');
        wrapper.className = 'img-container';
        wrapper.style.cssText = 'text-align:center;margin-bottom:15px;';
        const img = document.createElement('img');
        img.src = imagem;
        img.alt = 'Imagem de apoio da questão';
        img.loading = 'lazy';
        img.onerror = () => wrapper.remove();
        wrapper.appendChild(img);
        caixa.appendChild(wrapper);
    }

    const enunciado = document.createElement('div');
    enunciado.className = 'question-text';
    // O banco contém HTML editorial (negrito, parágrafos e contexto).
    // As alternativas, ao contrário, são inseridas somente como texto abaixo.
    enunciado.innerHTML = questao.enunciado;
    caixa.appendChild(enunciado);

    const opcoes = document.createElement('div');
    opcoes.className = 'options-list';
    questao.alternativas.forEach((alternativa, indiceAlternativa) => {
        const label = document.createElement('label');
        label.className = 'option-label';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'resp';
        radio.value = indiceAlternativa;
        const texto = document.createElement('span');
        texto.style.marginLeft = '10px';
        const letra = document.createElement('b');
        letra.textContent = `${String.fromCharCode(65 + indiceAlternativa)}) `;
        texto.append(letra, document.createTextNode(alternativa));
        label.append(radio, texto);
        opcoes.appendChild(label);
    });
    caixa.appendChild(opcoes);

    els.quizContainer.replaceChildren(caixa);
    const botaoProximo = document.getElementById('next-btn');
    botaoProximo.textContent = indice === questoesFiltradas.length - 1 ? 'Finalizar simulado' : 'Próxima questão ›';

    timerInterval = setInterval(() => {
        tempoRestante -= 1;
        atualizarTimer(tempoRestante);
        if (tempoRestante <= 0) {
            clearInterval(timerInterval);
            avancar(false, true);
        }
    }, 1000);
}

function atualizarTimer(segundos) {
    const min = Math.floor(Math.max(0, segundos) / 60);
    const seg = Math.max(0, segundos) % 60;
    els.timer.textContent = `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
    els.timer.style.backgroundColor = segundos < 30 ? '#e74c3c' : '#2c3e50';
    els.timer.setAttribute('aria-label', `Tempo restante: ${min} minutos e ${seg} segundos`);
}

window.verificarEProxima = function () {
    if (avancando) return;
    clearInterval(timerInterval);
    const selecionada = document.querySelector('input[name="resp"]:checked');
    const acertou = Boolean(selecionada &&
        Number(selecionada.value) === questoesFiltradas[indiceAtual].correta);
    avancar(acertou, false);
};

function avancar(acertou, tempoEsgotado) {
    if (avancando) return;
    avancando = true;

    respostasUsuario.push({
        questao: indiceAtual + 1,
        acertou,
        tempoEsgotado
    });

    if (acertou) pontuacao += 1;
    indiceAtual += 1;

    if (indiceAtual < questoesFiltradas.length) {
        carregarQuestao(indiceAtual);
    } else {
        finalizar();
    }
}

function finalizar() {
    clearInterval(timerInterval);
    els.quiz.style.display = 'none';
    els.result.style.display = 'block';

    const total = questoesFiltradas.length;
    const percentual = total ? (pontuacao / total) * 100 : 0;
    els.score.textContent = `${pontuacao}/${total}`;
    els.feedback.textContent = `${percentual.toFixed(1).replace('.', ',')}% de aproveitamento. ` +
        (percentual >= 70 ? 'Mandou bem! 👏' : 'Continue treinando! 💪');

    gerarCardsResultado();
}

function gerarCardsResultado() {
    let container = document.getElementById('questions-cards');
    if (!container) {
        container = document.createElement('div');
        container.id = 'questions-cards';
        container.className = 'questions-cards';
        const botaoReiniciar = document.getElementById('restart-btn');
        botaoReiniciar.parentNode.insertBefore(container, botaoReiniciar);
    }

    const titulo = document.createElement('h3');
    titulo.textContent = 'Resultado por questão';
    titulo.style.cssText = 'text-align:center;margin-bottom:15px;color:#2c3e50;';
    const grade = document.createElement('div');
    grade.className = 'cards-wrapper';

    respostasUsuario.forEach(resposta => {
        const card = document.createElement('div');
        card.className = `question-card ${resposta.acertou ? 'correct' : 'incorrect'}`;
        card.textContent = resposta.questao;
        card.title = resposta.tempoEsgotado
            ? `Questão ${resposta.questao}: tempo esgotado`
            : resposta.acertou
                ? `Questão ${resposta.questao}: correta`
                : `Questão ${resposta.questao}: incorreta ou não respondida`;
        grade.appendChild(card);
    });

    container.replaceChildren(titulo, grade);
}

window.addEventListener('pagehide', () => clearInterval(timerInterval));
