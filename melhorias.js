(() => {
'use strict';
const KEY='desafioEnemHistoricoV1', THEME='desafioEnemTemaV1', GOAL='desafioEnemMetaV1', SESS='desafioEnemSessoesV1';
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){console.warn(e)}};
let history=read(KEY,[]), reviewOnly=false, sessionSaved=false, difficultyFilter='all';
function nivelQuestao(q){const p=q?.parametrosTRI?.parametros||q?.parametrosTri?.parametros||q?.tri?.parametros||q?.parametrosTRI||q?.parametrosTri||q?.tri;const b=Number(p?.b??p?.B);if(!Number.isFinite(b))return null;return b < -1?'facil':b > 1?'dificil':'media'}
function filtrarDificuldade(lista){return difficultyFilter==='all'?lista:lista.filter(q=>nivelQuestao(q)===difficultyFilter)}
window.addEventListener('simulado:repetido',()=>{sessionSaved=false});
function theme(t){document.documentElement.dataset.theme=t;const b=document.getElementById('theme-toggle');if(b){b.textContent=t==='dark'?'☀️ Modo claro':'🌙 Modo escuro';b.setAttribute('aria-pressed',String(t==='dark'))}save(THEME,t)}
function panel(){
 const menu=document.getElementById('menu-screen');if(!menu||document.getElementById('dashboard'))return;
 const p=document.createElement('section');p.id='dashboard';p.className='dashboard';
 p.innerHTML='<div class="dashboard-heading"><div><span class="eyebrow">SEU ESPAÇO DE ESTUDOS</span><h2>Vamos evoluir hoje?</h2><p class="muted">Acompanhe seu ritmo e continue de onde parou.</p></div><button id="theme-toggle" class="theme-toggle" type="button">🌙 Modo escuro</button></div>'+
 '<div class="stats-grid chart-stats"><article class="stat-card chart-card"><div class="chart-heading"><span>Questões respondidas</span><strong id="stat-total">0</strong></div><small>Últimos 7 dias</small><div id="chart-questions" class="weekly-chart" role="img" aria-label="Questões respondidas nos últimos sete dias"></div></article><article class="stat-card chart-card"><div class="chart-heading"><span>Taxa de acertos</span><strong id="stat-rate">0%</strong></div><small>Por área de conhecimento</small><div id="chart-accuracy" class="pie-chart-wrap"></div></article><article class="stat-card chart-card"><div class="chart-heading"><span>Simulados concluídos</span><strong id="stat-sessions">0</strong></div><small>Últimos 7 dias</small><div id="chart-sessions" class="weekly-chart" role="img" aria-label="Simulados concluídos nos últimos sete dias"></div></article></div>'+
 '<div class="dashboard-columns">' +
 '<section class="panel-card"><div class="panel-title"><div><span class="eyebrow">CONSTÂNCIA</span><h3>Meta de estudos</h3></div><span class="panel-icon">◎</span></div><p class="muted">Defina quantas questões deseja responder.</p><div class="goal-row"><input id="goal-input" type="number" min="1" max="500" aria-label="Meta de questões"><button id="goal-save" class="small-primary" type="button">Salvar meta</button></div><div class="goal-track"><span id="goal-progress"></span></div><p id="goal-caption" class="muted"></p><div id="achievements" class="achievements"></div></section></div>'+
 '<section class="panel-card history-panel"><div class="panel-title"><div><span class="eyebrow">SEU PROGRESSO</span><h3>Histórico de questões</h3></div><span class="muted">Salvo neste dispositivo</span></div><div id="history-list" class="history-list"></div></section>';
 menu.insertBefore(p,menu.querySelector('.config-box'));
 document.getElementById('theme-toggle').addEventListener('click',()=>theme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
 document.getElementById('goal-input').value=read(GOAL,20);
 document.getElementById('goal-save').addEventListener('click',()=>{save(GOAL,Math.max(1,Math.min(500,Number(document.getElementById('goal-input').value)||20)));refresh()});
 theme(read(THEME,'light'));refresh();
}
const arquivosQuestoes=new Map(), arquivosSolucoes=new Map();
function primeirasCincoPalavras(enunciado){
 const temp=document.createElement('div');
 temp.innerHTML=typeof sanitizarEnunciado==='function'?sanitizarEnunciado(enunciado):String(enunciado||'');
 const texto=(temp.textContent||'').replace(/\s+/g,' ').trim();
 const palavras=texto.split(' ').filter(Boolean);
 return palavras.slice(0,5).join(' ')+(palavras.length>5?'…':'');
}
async function obterTrechoHistorico(registro){
 if(registro.preview)return registro.preview;
 const ano=Number(registro.year),id=String(registro.id||'');
 if(!Number.isInteger(ano)||!/^\d{4}_\d+$/.test(id))return '';
 try{
  let questoes=arquivosQuestoes.get(ano);
  if(!questoes){
   const resposta=await fetch('questoes/enem_'+ano+'.json',{cache:'default'});
   if(!resposta.ok)return '';
   const dados=await resposta.json();questoes=Array.isArray(dados.itens)?dados.itens:[];
   arquivosQuestoes.set(ano,questoes);
  }
  const questao=questoes.find(q=>q.id===id);
  return questao?primeirasCincoPalavras(questao.enunciado):'';
 }catch(e){console.warn('Não foi possível recuperar o trecho da questão:',e);return ''}
}
async function abrirRevisao(registro){
 const id=String(registro.id||'');
 const ano=Number(registro.year);
 if(!/^\d{4}_\d+$/.test(id)||!Number.isInteger(ano)){alert('Não foi possível identificar esta questão no histórico.');return}
 let questoes=arquivosQuestoes.get(ano), solucoes=arquivosSolucoes.get(ano);
 try{
  if(!questoes){const resposta=await fetch('questoes/enem_'+ano+'.json?v=20261102-video-links',{cache:'no-store'});if(!resposta.ok)throw new Error('Arquivo da prova indisponível.');const dados=await resposta.json();questoes=Array.isArray(dados.itens)?dados.itens:[];arquivosQuestoes.set(ano,questoes)}
  if(!solucoes){const resposta=await fetch('solucoes/enem_'+ano+'.json?v=20261102-resolucoes',{cache:'no-store'});if(resposta.ok){const dados=await resposta.json();solucoes=new Map((dados.questoes||[]).map(item=>[item.id,item]));arquivosSolucoes.set(ano,solucoes)}}
  const q=questoes.find(item=>item.id===id);
  if(!q)throw new Error('A questão não foi encontrada no arquivo da prova.');
  // Busca os parâmetros TRI para que o nível também apareça na revisão.
  try{
   const triResponse=await fetch('tri/dados/enem_'+ano+'.json',{headers:{Accept:'application/json'},cache:'no-store'});
   if(triResponse.ok){
    const triData=await triResponse.json();
    const triItem=(Array.isArray(triData.questoes)?triData.questoes:[]).find(item=>String(item.id)===id);
    if(triItem)q.parametrosTRI=triItem;
   }
  }catch(triError){console.warn('Nível TRI indisponível na revisão de '+id,triError)}
  mostrarRevisao(q,registro,solucoes?.get(id)||null);
 }catch(e){console.error('Falha ao abrir revisão:',e);alert(e.message||'Não foi possível abrir a questão.')}
}
function mostrarRevisao(q,registro,solucao=null){
 document.getElementById('question-review-modal')?.remove();
 const overlay=document.createElement('div');overlay.id='question-review-modal';overlay.className='review-overlay';overlay.setAttribute('role','presentation');
 const modal=document.createElement('section');modal.className='review-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','review-title');
 const header=document.createElement('div');header.className='review-header';
 const title=document.createElement('h2');title.id='review-title';title.textContent='Revisão · '+q.id;
 let levelBadge=null;
 const triRecord=q.parametrosTRI||q.parametrosTri||q.tri||null;
 const triParams=triRecord?.parametros||triRecord;
 const bValue=Number(triParams?.b??triParams?.B);
 if(Number.isFinite(bValue)){
  const level=bValue < -1 ? 'FÁCIL' : bValue > 1 ? 'DIFÍCIL' : 'MÉDIA';
  levelBadge=document.createElement('span');levelBadge.className='review-difficulty-badge';
  levelBadge.textContent='Nível estimado: '+level;
  levelBadge.style.cssText='display:inline-flex;align-items:center;padding:5px 10px;border-radius:999px;background:'+(level==='FÁCIL'?'#dcfce7':level==='DIFÍCIL'?'#fee2e2':'#fef3c7')+';color:'+(level==='FÁCIL'?'#166534':level==='DIFÍCIL'?'#991b1b':'#92400e')+';font-size:.78rem;font-weight:800;white-space:nowrap;';
 }
 const close=document.createElement('button');close.type='button';close.className='review-close';close.textContent='Fechar';close.setAttribute('aria-label','Fechar revisão');close.addEventListener('click',()=>overlay.remove());header.append(title);if(levelBadge)header.appendChild(levelBadge);header.append(close);
 const body=document.createElement('div');body.className='review-body';
 const imageUrl=typeof caminhoImagemSeguro==='function'?caminhoImagemSeguro(q.imagem):null;
 if(imageUrl){const imageBox=document.createElement('div');imageBox.className='review-image';const image=document.createElement('img');image.src=imageUrl;image.alt='Imagem de apoio da questão';image.loading='lazy';image.onerror=()=>imageBox.remove();imageBox.appendChild(image);body.appendChild(imageBox)}
 const statement=document.createElement('div');statement.className='question-text review-question';statement.innerHTML=typeof sanitizarEnunciado==='function'?sanitizarEnunciado(q.enunciado):String(q.enunciado||'');body.appendChild(statement);
 const options=document.createElement('ol');options.className='review-options';
 const alternatives=Array.isArray(q.alternativas)?q.alternativas:[];
 const missingAlternatives=[];
 alternatives.forEach((alt,i)=>{if(!String(alt??'').trim()){missingAlternatives.push(String.fromCharCode(65+i));return}const li=document.createElement('li');if(typeof adicionarConteudoAlternativa==='function')adicionarConteudoAlternativa(li,alt,i);else li.textContent=String.fromCharCode(65+i)+') '+alt;const classes=[];if(i===q.correta)classes.push('review-correct-option');if(i===registro.respostaMarcada)classes.push('review-user-option');li.className=classes.join(' ');if(i===registro.respostaMarcada){li.style.outline='2px solid #4263eb';li.style.outlineOffset='2px'}options.appendChild(li)});
 if(options.children.length)body.appendChild(options);
 if(missingAlternatives.length){const note=document.createElement('p');note.className='review-note';note.textContent=options.children.length?'Alternativas ainda não cadastradas: '+missingAlternatives.join(', ')+'.':'As alternativas desta questão ainda não foram cadastradas no banco de dados.';body.appendChild(note)}
 const answer=document.createElement('p');answer.className='review-answer';answer.textContent='Gabarito: '+String.fromCharCode(65+Number(q.correta));body.appendChild(answer);
  if(Number.isInteger(registro.respostaMarcada)){const chosen=document.createElement('p');chosen.className='review-note';chosen.textContent='Sua resposta: '+String.fromCharCode(65+registro.respostaMarcada)+(registro.respostaMarcada===q.correta?' · Você acertou!':' · Esta alternativa não era a correta.');body.appendChild(chosen)}else if(registro.respostaMarcada===null){const chosen=document.createElement('p');chosen.className='review-note';chosen.textContent='Você não marcou uma alternativa nesta questão.';body.appendChild(chosen)}
 const explanation=solucao?.resolucao||q.resolucao||q.solucao||q.explicacao||q.comentario;
 if(explanation){const section=document.createElement('section');section.className='review-explanation';const h=document.createElement('h3');h.textContent='Resolução';const p=document.createElement('p');p.textContent=String(explanation);section.append(h,p);body.appendChild(section)}
 const actions=document.createElement('div');actions.className='review-actions';
 const videoUrl=solucao?.videoUrl||q.youtubeUrl||q.youtube_url||q.videoSolucao||q.video_solucao||q.youtube;
 let videoLink=null;
 if(typeof videoUrl==='string'&&videoUrl.trim()){try{const u=new URL(videoUrl);if(u.protocol==='https:'&&['youtube.com','www.youtube.com','youtu.be','m.youtube.com'].includes(u.hostname)){const id=u.hostname==='youtu.be'?u.pathname.split('/').filter(Boolean)[0]:u.searchParams.get('v');if(id&&/^[A-Za-z0-9_-]{11}$/.test(id))videoLink='https://www.youtube.com/watch?v='+id}}catch{}}
 const video=document.createElement('a');video.className='review-video-link';video.target='_blank';video.rel='noopener noreferrer';video.href=videoLink||'https://www.youtube.com/results?search_query='+encodeURIComponent('ENEM '+registro.year+' questão '+q.id.split('_').pop()+' resolução');video.textContent=videoLink?'▶ Assistir à resolução em vídeo':'▶ Buscar resolução no YouTube';actions.appendChild(video);
 if(!videoLink&&solucao?.videoStatus==='pendente_pesquisa'){const status=document.createElement('p');status.className='review-note';status.textContent='Vídeo específico ainda não validado para esta questão; o botão abre uma busca no YouTube.';actions.prepend(status)}
 if(!explanation){const note=document.createElement('p');note.className='review-note';note.textContent='A resolução escrita ainda não foi cadastrada. Você pode consultar o gabarito e buscar uma explicação em vídeo.';body.appendChild(note)}
 modal.append(header,body,actions);overlay.appendChild(modal);document.body.appendChild(overlay);
 overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove()});
 const esc=e=>{if(e.key==='Escape'){overlay.remove();document.removeEventListener('keydown',esc)}};document.addEventListener('keydown',esc);close.focus();
}


window.abrirRevisaoDaSessao = async function(q, registro) {
 const year=Number(registro.year);
 if(!q||!Number.isInteger(year)){alert('Não foi possível identificar esta questão.');return}
 let solucoes=arquivosSolucoes.get(year);
 try{
  if(!solucoes){
   const response=await fetch('solucoes/enem_'+year+'.json?v=20261102-resolucoes',{cache:'no-store'});
   if(response.ok){const data=await response.json();solucoes=new Map((data.questoes||[]).map(item=>[item.id,item]));arquivosSolucoes.set(year,solucoes)}
  }
  mostrarRevisao(q,{...registro,id:q.id||registro.id},solucoes?.get(q.id)||null);
 }catch(error){console.warn('Não foi possível carregar a resolução:',error);mostrarRevisao(q,{...registro,id:q.id||registro.id},null)}
};

const AREA_LABELS={'ciencias-humanas':'Ciências Humanas','ciencias-natureza':'Ciências da Natureza',linguagens:'Linguagens',matematica:'Matemática',geral:'Geral'};
const CHART_COLORS=['#4263eb','#12a594','#f59f00','#e64980','#7950f2','#0c8599'];
function localDateKey(value){
 const d=new Date(value);if(Number.isNaN(d.getTime()))return '';
 return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function lastSevenDays(){
 const today=new Date();today.setHours(0,0,0,0);
 return Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(today.getDate()-6+i);return {key:localDateKey(d),label:d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.',''),date:d}});
}
function renderWeeklyChart(id,records,dateField,emptyText){
 const box=document.getElementById(id);if(!box)return;box.replaceChildren();
 const days=lastSevenDays(),counts=days.map(day=>records.filter(item=>localDateKey(item[dateField])===day.key).length);
 const max=Math.max(1,...counts);
 if(!records.length){const empty=document.createElement('p');empty.className='chart-empty';empty.textContent=emptyText;box.appendChild(empty);return}
 const bars=document.createElement('div');bars.className='bar-chart';
 days.forEach((day,i)=>{
  const col=document.createElement('div');col.className='bar-column';
  const value=document.createElement('b');value.className='bar-value';value.textContent=counts[i];
  const track=document.createElement('div');track.className='bar-track';
  const fill=document.createElement('span');fill.className='bar-fill';fill.style.height=(counts[i]?Math.max(7,counts[i]/max*100):0)+'%';fill.setAttribute('aria-hidden','true');track.appendChild(fill);
  const label=document.createElement('small');label.className='bar-label';label.textContent=day.label;
  col.title=day.date.toLocaleDateString('pt-BR')+': '+counts[i];col.append(value,track,label);bars.appendChild(col);
 });
 box.appendChild(bars);
}
function renderAccuracyPie(){
 const box=document.getElementById('chart-accuracy');if(!box)return;box.replaceChildren();
 const groups=new Map();
 history.forEach(item=>{const key=item.subject||'geral';if(!groups.has(key))groups.set(key,{total:0,correct:0});const g=groups.get(key);g.total++;if(item.ok)g.correct++});
 const entries=[...groups.entries()].sort((a,b)=>b[1].total-a[1].total);
 if(!entries.length){const empty=document.createElement('p');empty.className='chart-empty';empty.textContent='Responda questões para visualizar o desempenho por área.';box.appendChild(empty);return}
 const total=entries.reduce((sum,[,v])=>sum+v.total,0);let cursor=0;
 const stops=entries.map(([,v],i)=>{const start=cursor;cursor+=v.total/total*100;return CHART_COLORS[i%CHART_COLORS.length]+' '+start.toFixed(2)+'% '+cursor.toFixed(2)+'%'}).join(', ');
 const pie=document.createElement('div');pie.className='accuracy-pie';pie.style.background='conic-gradient('+stops+')';pie.setAttribute('role','img');pie.setAttribute('aria-label','Distribuição das questões respondidas por área');
 const center=document.createElement('div');center.className='pie-center';const number=document.createElement('strong');number.textContent=Math.round(history.filter(x=>x.ok).length/total*100)+'%';const caption=document.createElement('small');caption.textContent='geral';center.append(number,caption);pie.appendChild(center);
 const legend=document.createElement('div');legend.className='pie-legend';
 entries.forEach(([area,v],i)=>{const row=document.createElement('div');row.className='pie-legend-item';const dot=document.createElement('span');dot.className='pie-dot';dot.style.background=CHART_COLORS[i%CHART_COLORS.length];const name=document.createElement('span');name.className='pie-area';name.textContent=AREA_LABELS[area]||area;const rate=document.createElement('strong');rate.textContent=Math.round(v.correct/v.total*100)+'%';const count=document.createElement('small');count.textContent=v.correct+'/'+v.total+' acertos';row.append(dot,name,rate,count);legend.appendChild(row)});
 box.append(pie,legend);
}
function refresh(){
 const $=id=>document.getElementById(id);if(!$('dashboard'))return;
 const total=history.length,correct=history.filter(x=>x.ok).length,sessions=read(SESS,[]);
 $('stat-total').textContent=total;$('stat-rate').textContent=(total?Math.round(correct/total*100):0)+'%';$('stat-sessions').textContent=sessions.length;
 renderWeeklyChart('chart-questions',history,'date','Ainda não há questões respondidas no período.');
 renderWeeklyChart('chart-sessions',sessions,'date','Ainda não há simulados concluídos no período.');
 renderAccuracyPie();
 const goal=read(GOAL,20),pct=Math.min(100,Math.round(total/goal*100));$('goal-input').value=goal;$('goal-progress').style.width=pct+'%';$('goal-caption').textContent=Math.min(total,goal)+' de '+goal+' questões respondidas ('+pct+'%).';
 const badges=[[1,'🌱 Primeiro passo'],[10,'🔥 10 questões'],[50,'⭐ 50 questões'],[100,'🏅 100 questões'],[250,'🚀 250 questões']];$('achievements').replaceChildren();
 badges.forEach(x=>{const s=document.createElement('span');s.className='achievement'+(total>=x[0]?' unlocked':'');s.textContent=(total>=x[0]?'✓ ':'○ ')+x[1];$('achievements').appendChild(s)});
 const list=$('history-list');list.replaceChildren();if(!history.length){const p=document.createElement('p');p.className='muted';p.textContent='Responda sua primeira questão para começar seu histórico.';list.appendChild(p)}else history.slice().reverse().forEach(x=>{const row=document.createElement('div');row.className='history-item';const info=document.createElement('div');info.className='history-info';const a=document.createElement('strong');a.textContent=x.year+' · '+x.subject;const b=document.createElement('span');b.textContent=x.id+' · '+new Date(x.date).toLocaleDateString('pt-BR');const preview=document.createElement('span');preview.className='history-preview';preview.textContent=x.preview||'Carregando enunciado…';info.append(a,b,preview);if(!x.preview){obterTrechoHistorico(x).then(trecho=>{preview.textContent=trecho||'Trecho indisponível';if(trecho){x.preview=trecho;save(KEY,history)}})}const c=document.createElement('b');c.className=x.ok?'status-correct':'status-wrong';c.textContent=x.ok?'Acertou':'Revisar';const open=document.createElement('button');open.type='button';open.className='history-open-btn';open.textContent='Abrir revisão';open.addEventListener('click',()=>abrirRevisao(x));row.append(info,c,open);list.appendChild(row)});
}
function advanced(){
 const q=document.getElementById('box-qtd');if(!q||document.getElementById('advanced-filters'))return;
 const a=document.createElement('div');a.id='advanced-filters';a.className='advanced-filters';
 a.innerHTML='<div class="difficulty-filter"><p class="section-title">5. Nível de dificuldade:</p><div class="difficulty-options" role="group" aria-label="Filtrar questões por dificuldade"><button type="button" class="mode-btn active" data-difficulty="all" aria-pressed="true">Todas</button><button type="button" class="mode-btn" data-difficulty="facil" aria-pressed="false">Fácil</button><button type="button" class="mode-btn" data-difficulty="media" aria-pressed="false">Média</button><button type="button" class="mode-btn" data-difficulty="dificil" aria-pressed="false">Difícil</button></div><p class="muted filter-help">O nível é estimado pelo parâmetro B da TRI. Questões sem parâmetros não entram nos filtros de dificuldade.</p></div><label class="filter-check"><input id="filter-errors" type="checkbox"> Revisar somente questões que já errei</label><p class="muted filter-help">Combine os filtros para montar um treino direcionado.</p>';
 q.after(a);
 a.querySelectorAll('[data-difficulty]').forEach(btn=>btn.addEventListener('click',()=>{difficultyFilter=btn.dataset.difficulty;a.querySelectorAll('[data-difficulty]').forEach(x=>{const active=x===btn;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active))});if(typeof window.atualizarBotaoStart==='function')window.atualizarBotaoStart();atualizarInicioCombinado()}));
 a.querySelector('#filter-errors').addEventListener('change',e=>{reviewOnly=e.target.checked;atualizarBotaoStart();atualizarInicioCombinado()});
}

function atualizarInicioRevisao(){
 if(!reviewOnly)return;
 const botao=document.getElementById('start-btn');if(!botao)return;
 const idsErrados=new Set(history.filter(item=>!item.ok).map(item=>item.id));
 const disponiveis=dadosCompletosAno.filter(q=>idsErrados.has(q.id)&&(materiaAtual==='all'||q.materia===materiaAtual));
 const quantidade=qtdAtual==='all'?disponiveis.length:Math.min(Number(qtdAtual),disponiveis.length);
 botao.disabled=!anoAtual||quantidade===0;
 botao.textContent=quantidade?('INICIAR REVISÃO — '+quantidade+' QUESTÕES'):'SEM QUESTÕES ERRADAS NESTE FILTRO';
}
const atualizarBotaoOriginal=window.atualizarBotaoStart;
if(typeof atualizarBotaoOriginal==='function')window.atualizarBotaoStart=function(){
 const resultado=atualizarBotaoOriginal.apply(this,arguments);
 atualizarInicioRevisao();
 return resultado;
};
window.addEventListener('desafio:questaoRespondida', event => {
 const item=event.detail||{};
 if(!item.id)return;
 history.push({
  id:item.id,
  year:item.year,
  subject:item.subject||'Geral',
  preview:primeirasCincoPalavras(item.enunciado),
  ok:Boolean(item.ok),
  respostaMarcada:item.respostaMarcada,
  date:new Date().toISOString()
 });
 if(history.length>2000)history=history.slice(-2000);
 save(KEY,history);
 refresh();
});
window.addEventListener('desafio:simuladoFinalizado', event => {
 if(sessionSaved)return;
 sessionSaved=true;
 const item=event.detail||{};
 const sessions=read(SESS,[]);
 sessions.push({year:item.year,total:item.total,correct:item.correct,date:new Date().toISOString()});
 save(SESS,sessions.slice(-300));
 refresh();
});
const originalLoad=window.carregarAno;
if(typeof originalLoad==='function')window.carregarAno=async function(){const r=await originalLoad.apply(this,arguments);return r};
const originalStart=window.irParaQuiz;
if(typeof originalStart==='function')window.irParaQuiz=function(){
 sessionSaved=false;
 const wrong=new Set(history.filter(x=>!x.ok).map(x=>x.id));let filtered=filtrarDificuldade(dadosCompletosAno);if(reviewOnly)filtered=filtered.filter(q=>wrong.has(q.id));if(!filtered.length){alert('Não há questões disponíveis para os filtros selecionados.');return}const previous=dadosCompletosAno;dadosCompletosAno=filtered;const r=originalStart.apply(this,arguments);dadosCompletosAno=previous;
 let bar=document.getElementById('quiz-progress-track');if(!bar){bar=document.createElement('div');bar.id='quiz-progress-track';bar.className='quiz-progress-track';bar.innerHTML='<span id="quiz-progress-fill"></span>';document.querySelector('.quiz-header').after(bar)}
 return r;
};

/* Seleção combinada: permite reunir anos e matérias em um único simulado. */
const multiYearData=new Map();
let multiYearSelected=new Set(), multiSubjectSelected=new Set(), multiLoadToken=0;
function prepararSelecaoCombinada(){
 const yearBox=document.querySelector('#menu-screen .config-box');
 const yearGrid=document.getElementById('year-buttons');
 const subjectBox=document.getElementById('box-materia');
 const qtyBox=document.getElementById('box-qtd');
 if(!yearBox||!yearGrid||!subjectBox||!qtyBox||document.getElementById('multi-year-selector'))return;
 yearGrid.hidden=true;yearGrid.style.display='none';
 subjectBox.hidden=true;subjectBox.style.display='none';
 const title=yearBox.querySelector('.section-title');
 if(title)title.textContent='1. Escolha um ou mais anos:';
 const selector=document.createElement('div');selector.id='multi-year-selector';
 selector.innerHTML='<div class="multi-year-grid" id="multi-year-options"></div><p class="multi-selection-help">Você pode combinar provas de anos diferentes.</p><section class="multi-subject-section"><p class="section-title">2. Escolha uma ou mais matérias:</p><div class="multi-subject-grid" id="multi-subject-options"><span class="muted">Selecione os anos para carregar as matérias.</span></div></section>';
 yearBox.appendChild(selector);
 const options=selector.querySelector('#multi-year-options');
 const yearsButton=document.createElement('button');yearsButton.type='button';yearsButton.className='year-btn multi-all-btn';yearsButton.textContent='Todos';yearsButton.setAttribute('aria-pressed','false');
 yearsButton.addEventListener('click',()=>{const all=[...Array(17)].map((_,i)=>2025-i);const selecting=multiYearSelected.size!==all.length;multiYearSelected=selecting?new Set(all):new Set();options.querySelectorAll('[data-year]').forEach(btn=>{const active=multiYearSelected.has(Number(btn.dataset.year));btn.classList.toggle('selected',active);btn.setAttribute('aria-pressed',String(active))});yearsButton.classList.toggle('selected',selecting);yearsButton.setAttribute('aria-pressed',String(selecting));carregarAnosCombinados()});
 options.appendChild(yearsButton);
 for(let year=2025;year>=2009;year--){
  const button=document.createElement('button');button.type='button';button.className='year-btn';button.textContent=year;button.dataset.year=String(year);button.setAttribute('aria-pressed','false');
  button.addEventListener('click',()=>{if(multiYearSelected.has(year))multiYearSelected.delete(year);else multiYearSelected.add(year);const active=multiYearSelected.has(year);button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));const all=multiYearSelected.size===17;yearsButton.classList.toggle('selected',all);yearsButton.setAttribute('aria-pressed',String(all));carregarAnosCombinados()});
  options.appendChild(button);
 }
 const start=document.getElementById('start-btn');
 if(start)start.textContent='SELECIONE ANOS E MATÉRIAS';
}
async function carregarAnosCombinados(){
 const token=++multiLoadToken, selected=[...multiYearSelected].sort((a,b)=>b-a);
 const subjectBox=document.getElementById('multi-subject-options');
 const start=document.getElementById('start-btn');
 if(!selected.length){multiSubjectSelected.clear();subjectBox.innerHTML='<span class="muted">Selecione os anos para carregar as matérias.</span>';atualizarInicioCombinado();return}
 subjectBox.innerHTML='<span class="muted">Carregando matérias dos anos selecionados…</span>';
 if(start){start.disabled=true;start.textContent='CARREGANDO PROVAS…'}
 const results=await Promise.all(selected.map(async year=>{
  if(multiYearData.has(year))return [year,multiYearData.get(year)];
  try{
   const response=await fetch('questoes/enem_'+year+'.json',{headers:{Accept:'application/json'},cache:'default'});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const json=await response.json();
   const items=Array.isArray(json.itens)?json.itens.filter(q=>typeof validarQuestao!=='undefined'?validarQuestao(q):q&&Array.isArray(q.alternativas)):[];
   try{
    const triResponse=await fetch('tri/dados/enem_'+year+'.json',{headers:{Accept:'application/json'},cache:'no-store'});
    if(triResponse.ok){
     const triData=await triResponse.json();
     const triById=new Map((Array.isArray(triData.questoes)?triData.questoes:[]).filter(item=>item&&item.id).map(item=>[String(item.id),item]));
     items.forEach(question=>{const tri=triById.get(String(question.id));if(tri)question.parametrosTRI=tri});
    }
   }catch(triError){console.warn('Parâmetros TRI indisponíveis para '+year,triError)}
   multiYearData.set(year,items);
   return [year,items]
  }catch(error){console.warn('Falha ao carregar '+year,error);return [year,[]]}
 }));
 if(token!==multiLoadToken)return;
 const failed=results.filter(([,items])=>!items.length).map(([year])=>year);
 const available=new Set(results.flatMap(([,items])=>items.map(q=>q.materia||'geral')));
 const previous=multiSubjectSelected;
 multiSubjectSelected=new Set([...previous].filter(subject=>available.has(subject)));
 subjectBox.replaceChildren();
 const subjects=[...available].sort((a,b)=>(AREA_LABELS[a]||a).localeCompare(AREA_LABELS[b]||b,'pt-BR'));
 const allSubjectsButton=document.createElement('button');allSubjectsButton.type='button';allSubjectsButton.className='year-btn multi-all-btn multi-subject-all-btn';allSubjectsButton.textContent='Todas';allSubjectsButton.setAttribute('aria-pressed',String(subjects.length>0&&multiSubjectSelected.size===subjects.length));
 const syncSubjectButtons=()=>{const all=subjects.length>0&&multiSubjectSelected.size===subjects.length;allSubjectsButton.classList.toggle('selected',all);allSubjectsButton.setAttribute('aria-pressed',String(all));subjectBox.querySelectorAll('[data-subject]').forEach(button=>{const active=multiSubjectSelected.has(button.dataset.subject);button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active))});atualizarInicioCombinado()};
 allSubjectsButton.addEventListener('click',()=>{multiSubjectSelected=multiSubjectSelected.size===subjects.length?new Set():new Set(subjects);syncSubjectButtons()});
 subjectBox.appendChild(allSubjectsButton);
 subjects.forEach(subject=>{
  const button=document.createElement('button');button.type='button';button.className='year-btn multi-subject-btn';button.textContent=AREA_LABELS[subject]||subject;button.dataset.subject=subject;button.setAttribute('aria-pressed',String(multiSubjectSelected.has(subject)));
  if(multiSubjectSelected.has(subject))button.classList.add('selected');
  button.addEventListener('click',()=>{if(multiSubjectSelected.has(subject))multiSubjectSelected.delete(subject);else multiSubjectSelected.add(subject);syncSubjectButtons()});
  subjectBox.appendChild(button);
 });
 if(failed.length){const warning=document.createElement('p');warning.className='multi-selection-help';warning.textContent='Não foi possível carregar: '+failed.join(', ')+'.';subjectBox.appendChild(warning)}
 atualizarInicioCombinado();
}
function questoesCombinadas(){
 return [...multiYearSelected].sort((a,b)=>a-b).flatMap(year=>(multiYearData.get(year)||[]).filter(q=>multiSubjectSelected.has(q.materia||'geral')).map(q=>({...q,__ano:year})));
}
function atualizarInicioCombinado(){
 const start=document.getElementById('start-btn');if(!start)return;
 const qtyBox=document.getElementById('box-qtd');
 const quantityEnabled=multiYearSelected.size>0&&multiSubjectSelected.size>0;
 if(qtyBox){qtyBox.style.opacity=quantityEnabled?'1':'0.5';qtyBox.style.pointerEvents=quantityEnabled?'auto':'none';}
 const total=filtrarDificuldade(questoesCombinadas()).filter(q=>!reviewOnly||history.some(x=>x.id===q.id&&!x.ok)).length;
 const amount=qtdAtual==='all'?total:Math.min(Number(qtdAtual),total);
 const ready=multiYearSelected.size>0&&multiSubjectSelected.size>0&&amount>0;
 start.disabled=!ready;
 start.textContent=ready?'INICIAR SIMULADO — '+amount+' QUESTÕES':(multiYearSelected.size?'SELECIONE AO MENOS UMA MATÉRIA':'SELECIONE UM OU MAIS ANOS');
}
const selecionarQtdOriginal=window.selecionarQtd;
window.selecionarQtd=function(quantidade,btn){selecionarQtdOriginal(quantidade,btn);atualizarInicioCombinado()};
window.irParaQuiz=function(){
 let lista=filtrarDificuldade(questoesCombinadas());
 if(reviewOnly){const wrong=new Set(history.filter(x=>!x.ok).map(x=>x.id));lista=lista.filter(q=>wrong.has(q.id))}
 if(!lista.length){alert(reviewOnly?'Não há questões erradas nos anos e matérias selecionados.':'Não há questões para os filtros selecionados.');return}
 dadosCompletosAno=lista;anoAtual='Múltiplos anos';materiaAtual='all';
 originalStart.apply(this,arguments);
 const heading=document.getElementById('prova-titulo');
 if(heading)heading.textContent=[...multiYearSelected].sort((a,b)=>a-b).join(', ')+' | '+[...multiSubjectSelected].map(x=>AREA_LABELS[x]||x).join(', ');
};

const originalQuestion=window.carregarQuestao;
if(typeof originalQuestion==='function')window.carregarQuestao=function(){
 const r=originalQuestion.apply(this,arguments);
 const fill=document.getElementById('quiz-progress-fill');if(fill)fill.style.width=((indiceAtual+1)/questoesFiltradas.length*100)+'%';
 document.querySelectorAll('.option-label input').forEach(input=>input.addEventListener('change',()=>{document.querySelectorAll('.option-label').forEach(x=>x.classList.remove('is-selected'));input.closest('.option-label').classList.add('is-selected')}));
 return r;
};
panel();advanced();prepararSelecaoCombinada();refresh();
document.addEventListener('DOMContentLoaded',()=>{panel();advanced();prepararSelecaoCombinada();refresh()});
window.addEventListener('storage',e=>{if(e.key===KEY){history=read(KEY,[]);refresh()}});
})();