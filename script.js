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
let questoesOriginaisSimulado = [];
let carregamentoId = 0;
let avancando = false;
let modoTempo = 'cronometrado';

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
    feedback: document.getElementById('final-feedback'),
    timerModeSelector: document.getElementById('timer-mode-selector')
};

const nomesMateria = {
    all: '📚 Todas',
    'ciencias-humanas': '🌍 Humanas',
    'ciencias-natureza': '🧬 Natureza',
    linguagens: '📖 Linguagens',
    matematica: '📐 Matemática',
    geral: 'Geral'
};

let parametrosTriPorId = new Map();
const linhaCabecalhoQuestao = document.createElement('div');
linhaCabecalhoQuestao.className = 'question-meta-row';
const indicadoresTriQuestao = document.createElement('div');
indicadoresTriQuestao.className = 'question-tri-indicators';
if (els.progress && els.progress.parentNode) {
    els.progress.parentNode.insertBefore(linhaCabecalhoQuestao, els.progress);
    linhaCabecalhoQuestao.appendChild(els.progress);
    linhaCabecalhoQuestao.appendChild(indicadoresTriQuestao);
}

function classificarDificuldadeTRI(valorB) {
    if (!Number.isFinite(valorB)) return null;
    // Faixas didáticas de apresentação; não são categorias oficiais do Inep.
    if (valorB < -1) return { texto: 'FÁCIL', classe: 'easy' };
    if (valorB > 1) return { texto: 'DIFÍCIL · estimativa', classe: 'hard' };
    return { texto: 'MÉDIA · estimativa', classe: 'medium' };
}

function renderizarIndicadoresTRI(questao) {
    indicadoresTriQuestao.replaceChildren();
    const registro = questao.parametrosTRI ||
        parametrosTriPorId.get(String(questao.id)) ||
        questao.parametrosTri || questao.tri || null;
    if (!registro) return;

    const parametros = registro.parametros || registro;
    const valores = [
        ['A', parametros.a ?? parametros.A],
        ['B', parametros.b ?? parametros.B],
        ['C', parametros.c ?? parametros.C]
    ];
    const disponiveis = valores.filter(([, valor]) => valor !== null && valor !== undefined && valor !== '' && Number.isFinite(Number(valor)));
    if (!disponiveis.length) return;

    const grupo = document.createElement('span');
    grupo.className = 'tri-values';
    grupo.setAttribute('aria-label', 'Parâmetros da Teoria de Resposta ao Item');
    disponiveis.forEach(([nome, valor], indice) => {
        if (indice) grupo.appendChild(document.createTextNode(' · '));
        const item = document.createElement('span');
        item.textContent = nome + ' ' + Number(valor).toFixed(2);
        grupo.appendChild(item);
    });
    indicadoresTriQuestao.appendChild(grupo);

    const dificuldade = classificarDificuldadeTRI(Number(parametros.b ?? parametros.B));
    if (dificuldade) {
        const etiqueta = document.createElement('span');
        etiqueta.className = 'difficulty-tag ' + dificuldade.classe;
        etiqueta.textContent = dificuldade.texto;
        etiqueta.title = 'Classificação didática estimada a partir do parâmetro B; não é uma categoria oficial do Inep.';
        indicadoresTriQuestao.appendChild(etiqueta);
    }
}

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

function adicionarConteudoAlternativa(container, alternativa, indice) {
    const letra = document.createElement('b');
    letra.textContent = `${String.fromCharCode(65 + indice)}) `;
    container.appendChild(letra);

    const valor = String(alternativa ?? '');
    const imagem = valor.match(/^<img src="(https:\/\/raw\.githubusercontent\.com\/gabriel-antonelli\/extract-enem-data\/main\/enem-data\/[A-Za-z0-9_./-]+)" alt="Alternativa ([A-E])">$/)
        || valor.match(/^<img src="(https:\/\/s3\.amazonaws\.com\/qcon-assets-production\/images\/provas\/30082\/imagem-retificada-questao-05[1-5]\.jpg)" alt="Gráfico da alternativa ([A-E])">$/);

    if (imagem) {
        const img = document.createElement('img');
        img.src = imagem[1];
        img.alt = `Alternativa ${imagem[2]}`;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.style.display = 'block';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '220px';
        img.style.height = 'auto';
        img.style.objectFit = 'contain';
        img.style.margin = '8px 0';
        img.onerror = () => img.remove();
        container.appendChild(img);
        return;
    }

    container.appendChild(document.createTextNode(valor));
}

function escaparHTML(valor) {
    return String(valor).replace(/[&<>"']/g, caractere => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[caractere]);
}

function sanitizarEnunciado(html) {
    // O banco do ENEM pode trazer imagens em Markdown dentro do próprio enunciado.
    // Converte esse formato para HTML antes da sanitização.
    const convertido = String(html || '').replace(
        /!\[([^\]]*)\]\((https?:\/\/[^\s)]+|(?:\.\/)?imagens\/[^\s)]+)(?:\s+["'][^"']*["'])?\)/g,
        (_, textoAlternativo, url) => `<img src="${escaparHTML(url)}" alt="${escaparHTML(textoAlternativo || 'Imagem de apoio da questão')}">`
    );
    const modelo = document.createElement('template');
    modelo.innerHTML = convertido;

    const permitidas = new Set(['DIV', 'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'SPAN', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'SUB', 'SUP', 'IMG']);
    const proibidas = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON', 'SVG', 'MATH']);

    function limpar(no) {
        [...no.childNodes].forEach(filho => {
            if (filho.nodeType !== Node.ELEMENT_NODE) return;
            if (proibidas.has(filho.tagName)) {
                filho.remove();
                return;
            }
            if (filho.tagName === 'IMG') {
                const origem = filho.getAttribute('src') || '';
                let urlSegura = null;
                try {
                    const url = new URL(origem, document.baseURI);
                    const hostPermitido = url.hostname === 'enem.dev' || url.hostname.endsWith('.enem.dev') || (url.hostname === 'enempratica.com' && url.pathname.startsWith('/provas/'));
                    if (url.origin === location.origin || (url.protocol === 'https:' && hostPermitido)) {
                        urlSegura = url.href;
                    }
                } catch { /* URL inválida: imagem removida. */ }
                if (!urlSegura) {
                    filho.remove();
                    return;
                }
                const alt = filho.getAttribute('alt') || 'Imagem de apoio da questão';
                [...filho.attributes].forEach(attr => filho.removeAttribute(attr.name));
                filho.setAttribute('src', urlSegura);
                filho.setAttribute('alt', alt);
                filho.setAttribute('loading', 'lazy');
                filho.setAttribute('decoding', 'async');
                filho.addEventListener('error', () => filho.remove(), { once: true });
                return;
            }
            limpar(filho);
            if (!permitidas.has(filho.tagName)) {
                filho.replaceWith(...filho.childNodes);
                return;
            }
            [...filho.attributes].forEach(attr => {
                const classeContexto = filho.tagName === 'DIV' && attr.name === 'class' && attr.value === 'contexto';
                if (!classeContexto) filho.removeAttribute(attr.name);
            });
        });
    }

    limpar(modelo.content);
    return modelo.innerHTML;
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
for (let ano = 2025; ano >= 2009; ano--) {
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

        // Carrega uma única fonte TRI por ano. O formato do projeto é
        // tri/dados/enem_AAAA.json; a situação do vínculo fica no campo "status".
        let triPorId = new Map();
        try {
            const respostaTri = await fetch(`tri/dados/enem_${ano}.json`, {
                headers: { Accept: 'application/json' },
                cache: 'no-store'
            });
            if (respostaTri.ok) {
                const dadosTri = await respostaTri.json();
                if (Array.isArray(dadosTri.questoes)) {
                    dadosTri.questoes.forEach(registro => {
                        if (registro && registro.id) {
                            triPorId.set(String(registro.id), registro);
                        }
                    });
                }
            } else if (respostaTri.status !== 404) {
                console.warn(`Falha HTTP ao carregar TRI de ${ano}: ${respostaTri.status}`);
            }
        } catch (erroTri) {
            console.warn(`Parâmetros TRI de ${ano} indisponíveis:`, erroTri);
        }

        // O mesmo registro alimenta o cabeçalho e o cartão detalhado da questão.
        parametrosTriPorId = triPorId;
        const validas = json.itens.filter(validarQuestao).map(questao => {
            const tri = triPorId.get(String(questao.id));
            return tri ? { ...questao, parametrosTRI: tri } : questao;
        });
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

window.selecionarModoTempo = function (modo, btn) {
    if (modo !== 'cronometrado' && modo !== 'livre') return;
    modoTempo = modo;
    els.timerModeSelector.querySelectorAll('[data-timer-mode]').forEach(botao => {
        const ativo = botao === btn;
        botao.classList.toggle('active', ativo);
        botao.setAttribute('aria-pressed', String(ativo));
    });
};

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
    questoesOriginaisSimulado = [...lista];
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


window.repetirSimulado = function () {
    if (!questoesOriginaisSimulado.length) return;
    clearInterval(timerInterval);
    questoesFiltradas = [...questoesOriginaisSimulado];
    indiceAtual = 0;
    pontuacao = 0;
    respostasUsuario = [];
    avancando = false;
    window.dispatchEvent(new Event('simulado:repetido'));
    els.result.style.display = 'none';
    els.menu.style.display = 'none';
    els.quiz.style.display = 'block';
    carregarQuestao(0);
};

function carregarQuestao(indice) {
    clearInterval(timerInterval);
    avancando = false;

    const questao = questoesFiltradas[indice];
    if (!questao) return finalizar();

    let tempoRestante = TEMPO_POR_QUESTAO;
    if (modoTempo === 'livre') {
        els.timer.textContent = 'Tempo livre';
        els.timer.style.backgroundColor = '#2c3e50';
        els.timer.setAttribute('aria-label', 'Modo de tempo livre, sem contagem regressiva');
    } else {
        atualizarTimer(tempoRestante);
    }
    els.progress.textContent = `Questão ${indice + 1} de ${questoesFiltradas.length}`;
    renderizarIndicadoresTRI(questao);

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

    // Se o enunciado já contém imagem em Markdown/HTML, ela será exibida
    // no próprio texto e não duplicaremos o campo separado "imagem".
    const temImagemNoEnunciado = /!\[[^\]]*\]\((?:https?:\/\/|(?:\.\/)?imagens\/)/i.test(questao.enunciado) || /<img\b/i.test(questao.enunciado);
    const imagem = temImagemNoEnunciado ? null : caminhoImagemSeguro(questao.imagem);
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
    enunciado.innerHTML = sanitizarEnunciado(questao.enunciado);
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
        adicionarConteudoAlternativa(texto, alternativa, indiceAlternativa);
        label.append(radio, texto);
        opcoes.appendChild(label);
    });
    caixa.appendChild(opcoes);

    els.quizContainer.replaceChildren(caixa);
    const botaoProximo = document.getElementById('next-btn');
    botaoProximo.textContent = indice === questoesFiltradas.length - 1 ? 'Finalizar simulado' : 'Próxima questão ›';

    if (modoTempo === 'cronometrado') {
        timerInterval = setInterval(() => {
            tempoRestante -= 1;
            atualizarTimer(tempoRestante);
            if (tempoRestante <= 0) {
                clearInterval(timerInterval);
                avancar(false, true);
            }
        }, 1000);
    }
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

    const questaoAtual = questoesFiltradas[indiceAtual];
    const marcada = document.querySelector('input[name="resp"]:checked');
    const respostaMarcada = marcada ? Number(marcada.value) : null;
    respostasUsuario.push({
        questao: indiceAtual + 1,
        acertou,
        tempoEsgotado,
        respostaMarcada,
        dadosQuestao: questaoAtual
    });
    window.dispatchEvent(new CustomEvent('desafio:questaoRespondida', {
        detail: {
            id: questaoAtual.id,
            year: questaoAtual.__ano || anoAtual,
            subject: questaoAtual.materia || 'Geral',
            ok: Boolean(acertou),
            respostaMarcada,
            enunciado: questaoAtual.enunciado
        }
    }));

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
    window.dispatchEvent(new CustomEvent('desafio:simuladoFinalizado', {
        detail: {
            year: anoAtual,
            total: questoesFiltradas.length,
            correct: pontuacao
        }
    }));
}

function gerarCardsResultado() {
    let container = document.getElementById('questions-cards');
    if (!container) {
        container = document.createElement('section');
        container.id = 'questions-cards';
        container.className = 'result-analysis';
        const botaoReiniciar = document.getElementById('restart-btn');
        botaoReiniciar.parentNode.insertBefore(container, botaoReiniciar);
    }
    const total = respostasUsuario.length;
    const acertos = respostasUsuario.filter(item => item.acertou).length;
    const erros = total - acertos;
    const percentual = total ? Math.round(acertos / total * 100) : 0;
    const heading = document.createElement('h2');
    heading.textContent = 'Análise do seu desempenho';
    heading.style.cssText = 'margin:26px 0 16px;text-align:left;color:var(--text-color,#243247);';
    const summary = document.createElement('div');
    summary.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;margin-bottom:18px;';
    [['Acertos',acertos,'#168653'],['Erros',erros,'#d94848'],['Aproveitamento',percentual+'%','#4263eb']].forEach(([label,value,color]) => {
        const card=document.createElement('article');
        card.style.cssText='padding:14px;border:1px solid var(--border-color,#e2e8f0);border-radius:12px;background:var(--panel-bg,#fff);text-align:center;';
        const strong=document.createElement('strong');strong.textContent=value;strong.style.cssText='display:block;font-size:1.55rem;color:'+color+';';
        const caption=document.createElement('span');caption.textContent=label;caption.style.cssText='font-size:.85rem;color:var(--muted-color,#64748b);';
        card.append(strong,caption);summary.appendChild(card);
    });
    const chart=document.createElement('section');
    chart.setAttribute('aria-label','Gráfico de acertos e erros');
    chart.style.cssText='padding:16px;border:1px solid var(--border-color,#e2e8f0);border-radius:12px;margin-bottom:22px;background:var(--panel-bg,#fff);';
    const chartTitle=document.createElement('h3');chartTitle.textContent='Distribuição do resultado';chartTitle.style.margin='0 0 14px';
    const visuals=document.createElement('div');visuals.style.cssText='display:grid;grid-template-columns:minmax(100px,140px) minmax(0,1fr);align-items:center;gap:18px;';
    const donut=document.createElement('div');donut.setAttribute('role','img');donut.setAttribute('aria-label',percentual+'% de acertos e '+(100-percentual)+'% de erros');donut.style.cssText='width: min(30vw,124px);height:min(30vw,124px);min-width:100px;min-height:100px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#16a36a 0% '+percentual+'%,#e05252 '+percentual+'% 100%);';
    const donutCenter=document.createElement('div');donutCenter.style.cssText='width:68%;height:68%;border-radius:50%;background:var(--panel-bg,#fff);display:grid;place-content:center;text-align:center;';
    const donutValue=document.createElement('strong');donutValue.textContent=percentual+'%';donutValue.style.cssText='font-size:1.35rem;font-weight:800;color:#102a43;';
    const donutLabel=document.createElement('small');donutLabel.textContent='acertos';donutLabel.style.cssText='color:#334e68;font-weight:700;';
    donutCenter.append(donutValue,donutLabel);donut.appendChild(donutCenter);
    const barWrap=document.createElement('div');
    const barLabel=document.createElement('strong');barLabel.textContent='Acertos x erros';barLabel.style.cssText='display:block;margin-bottom:10px;color:#102a43;font-size:1rem;font-weight:800;';
    const track=document.createElement('div');track.style.cssText='display:flex;height:18px;overflow:hidden;border-radius:20px;background:#e9eef5;';
    const correctBar=document.createElement('span');correctBar.style.cssText='width:'+percentual+'%;background:#087443;';
    const wrongBar=document.createElement('span');wrongBar.style.cssText='width:'+(100-percentual)+'%;background:#b42318;';
    track.append(correctBar,wrongBar);
    const legend=document.createElement('p');legend.textContent=acertos+' corretas ('+percentual+'%) · '+erros+' incorretas ('+(100-percentual)+'%)';legend.style.cssText='font-size:.9rem;line-height:1.5;color:#243b53;font-weight:600;margin:10px 0 0;';
    barWrap.append(barLabel,track,legend);visuals.append(donut,barWrap);chart.append(chartTitle,visuals);
    const title=document.createElement('h3');title.textContent='Revise suas questões';title.style.cssText='text-align:left;margin:24px 0 8px;';
    const hint=document.createElement('p');hint.textContent='Clique em uma questão para rever o enunciado, sua resposta, o gabarito e a resolução. Passe o mouse sobre o número para identificar a questão pelo início do enunciado.';hint.style.cssText='font-size:.9rem;color:var(--muted-color,#64748b);margin:0 0 14px;';
    const grade=document.createElement('div');grade.className='cards-wrapper';grade.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(52px,1fr));gap:9px;';
    respostasUsuario.forEach(resposta => {
        const card=document.createElement('button');card.type='button';
        card.className='question-card '+(resposta.acertou?'correct':'incorrect');
        card.textContent=resposta.questao;
        const trecho = (() => {
            const temp = document.createElement('div');
            temp.innerHTML = typeof sanitizarEnunciado === 'function'
                ? sanitizarEnunciado(resposta.dadosQuestao?.enunciado || '')
                : String(resposta.dadosQuestao?.enunciado || '');
            const texto = (temp.textContent || '').replace(/\s+/g, ' ').trim();
            const palavras = texto.split(/\s+/).filter(Boolean);
            return palavras.slice(0, 32).join(' ') + (palavras.length > 32 ? '…' : '');
        })();
        const identificacao = 'Questão ' + resposta.questao + (trecho ? ': ' + trecho : ': enunciado indisponível');
        card.title = identificacao;
        card.setAttribute('aria-label', identificacao + '. ' +
            (resposta.acertou ? 'Resposta correta.' : 'Resposta incorreta ou não respondida.') +
            ' Clique para abrir a revisão.');
        card.style.cssText='cursor:pointer;min-height:48px;font:inherit;font-weight:700;border:0;';
        card.addEventListener('click',()=>{
            if(typeof window.abrirRevisaoDaSessao==='function'&&resposta.dadosQuestao){
                const q=resposta.dadosQuestao;
                window.abrirRevisaoDaSessao(q,{id:q.id||('Questão '+resposta.questao),year:q.__ano||anoAtual,subject:q.materia||'Geral',ok:resposta.acertou,respostaMarcada:resposta.respostaMarcada});
            }
        });
        grade.appendChild(card);
    });
    const actions=document.createElement('div');
    actions.style.cssText='display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin:24px 0 8px;';
    const repeat=document.createElement('button');
    repeat.type='button';repeat.id='repeat-simulation-btn';repeat.textContent='↻ Repetir simulado';
    repeat.style.cssText='background:#087443;color:#fff;border:0;border-radius:10px;padding:13px 20px;font:inherit;font-weight:800;cursor:pointer;min-height:46px;';
    repeat.addEventListener('click',()=>{if(typeof window.repetirSimulado==='function')window.repetirSimulado()});
    actions.appendChild(repeat);
    const restart=document.getElementById('restart-btn');
    restart.textContent='Novo simulado';
    restart.style.cssText='background:#24476b;color:#fff;border:0;border-radius:10px;padding:13px 20px;font:inherit;font-weight:800;cursor:pointer;min-height:46px;';
    actions.appendChild(restart);
    container.replaceChildren(heading,summary,chart,title,hint,grade,actions);

}
window.addEventListener('pagehide', () => clearInterval(timerInterval));
