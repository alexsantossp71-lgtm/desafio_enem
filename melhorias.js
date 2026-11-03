(() => {
'use strict';
const KEY='desafioEnemHistoricoV1', THEME='desafioEnemTemaV1', GOAL='desafioEnemMetaV1', SESS='desafioEnemSessoesV1';
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){console.warn(e)}};
let history=read(KEY,[]), reviewOnly=false, sessionSaved=false;
function theme(t){document.documentElement.dataset.theme=t;const b=document.getElementById('theme-toggle');if(b){b.textContent=t==='dark'?'☀️ Modo claro':'🌙 Modo escuro';b.setAttribute('aria-pressed',String(t==='dark'))}save(THEME,t)}
function panel(){
 const menu=document.getElementById('menu-screen');if(!menu||document.getElementById('dashboard'))return;
 const p=document.createElement('section');p.id='dashboard';p.className='dashboard';
 p.innerHTML='<div class="dashboard-heading"><div><span class="eyebrow">SEU ESPAÇO DE ESTUDOS</span><h2>Vamos evoluir hoje?</h2><p class="muted">Acompanhe seu ritmo e continue de onde parou.</p></div><button id="theme-toggle" class="theme-toggle" type="button">🌙 Modo escuro</button></div>'+
 '<div class="stats-grid chart-stats"><article class="stat-card chart-card"><div class="chart-heading"><span>Questões respondidas</span><strong id="stat-total">0</strong></div><small>Últimos 7 dias</small><div id="chart-questions" class="weekly-chart" role="img" aria-label="Questões respondidas nos últimos sete dias"></div></article><article class="stat-card chart-card"><div class="chart-heading"><span>Taxa de acertos</span><strong id="stat-rate">0%</strong></div><small>Por área de conhecimento</small><div id="chart-accuracy" class="pie-chart-wrap"></div></article><article class="stat-card chart-card"><div class="chart-heading"><span>Simulados concluídos</span><strong id="stat-sessions">0</strong></div><small>Últimos 7 dias</small><div id="chart-sessions" class="weekly-chart" role="img" aria-label="Simulados concluídos nos últimos sete dias"></div></article></div>'+
 '<section class="panel-card goal-panel"><div class="panel-title"><div><span class="eyebrow">CONSTÂNCIA</span><h3>Meta de estudos</h3></div><span class="panel-icon">◎</span></div><p class="muted">Defina quantas questões deseja responder.</p><div class="goal-row"><input id="goal-input" type="number" min="1" max="500" aria-label="Meta de questões"><button id="goal-save" class="small-primary" type="button">Salvar meta</button></div><div class="goal-track"><span id="goal-progress"></span></div><p id="goal-caption" class="muted"></p><div id="achievements" class="achievements"></div></section>'+
 '<section class="panel-card history-panel"><div class="panel-title"><div><span class="eyebrow">SEU PROGRESSO</span><h3>Histórico de questões</h3></div><span class="muted">Salvo neste dispositivo</span></div><div id="history-list" class="history-list"></div></section>';
 menu.insertBefore(p,menu.querySelector('.config-box'));
 document.getElementById('theme-toggle').addEventListener('click',()=>theme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
 document.getElementById('goal-input').value=read(GOAL,20);
 document.getElementById('goal-save').addEventListener('click',()=>{save(GOAL,Math.max(1,Math.min(500,Number(document.getElementById('goal-input').value)||20)));refresh()});
 theme(read(THEME,'light'));refresh();
}
function subjects(){
 const box=document.getElementById('subject-cards');if(!box||!dadosCompletosAno.length)return;
 const names={'ciencias-humanas':['🌍','Ciências Humanas'],'ciencias-natureza':['🧬','Ciências da Natureza'],linguagens:['📖','Linguagens'],matematica:['📐','Matemática'],geral:['📚','Geral']},counts={};
 dadosCompletosAno.forEach(q=>{const m=q.materia||'geral';counts[m]=(counts[m]||0)+1});
 box.replaceChildren();
 Object.keys(counts).forEach(m=>{const pair=names[m]||['📘',m],b=document.createElement('button');b.type='button';b.className='subject-card';const i=document.createElement('span');i.className='subject-symbol';i.textContent=pair[0];const n=document.createElement('strong');n.textContent=pair[1];const c=document.createElement('small');c.textContent=counts[m]+' questões';b.append(i,n,c);b.addEventListener('click',()=>{const target=[...document.querySelectorAll('#mat-buttons-container button')].find(x=>x.textContent.trim()===(nomesMateria[m]||m));if(target){target.click();document.getElementById('box-materia').scrollIntoView({behavior:'smooth',block:'center'})}});box.appendChild(b)});
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
  mostrarRevisao(q,registro,solucoes?.get(id)||null);
 }catch(e){console.error('Falha ao abrir revisão:',e);alert(e.message||'Não foi possível abrir a questão.')}
}
function mostrarRevisao(q,registro,solucao=null){
 document.getElementById('question-review-modal')?.remove();
 const overlay=document.createElement('div');overlay.id='question-review-modal';overlay.className='review-overlay';overlay.setAttribute('role','presentation');
 const modal=document.createElement('section');modal.className='review-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','review-title');
 const header=document.createElement('div');header.className='review-header';
 const title=document.createElement('h2');title.id='review-title';title.textContent='Revisão · '+q.id;
 const close=document.createElement('button');close.type='button';close.className='review-close';close.textContent='Fechar';close.setAttribute('aria-label','Fechar revisão');close.addEventListener('click',()=>overlay.remove());header.append(title,close);
 const body=document.createElement('div');body.className='review-body';
 const imageUrl=typeof caminhoImagemSeguro==='function'?caminhoImagemSeguro(q.imagem):null;
 if(imageUrl){const imageBox=document.createElement('div');imageBox.className='review-image';const image=document.createElement('img');image.src=imageUrl;image.alt='Imagem de apoio da questão';image.loading='lazy';image.onerror=()=>imageBox.remove();imageBox.appendChild(image);body.appendChild(imageBox)}
 const statement=document.createElement('div');statement.className='question-text review-question';statement.innerHTML=typeof sanitizarEnunciado==='function'?sanitizarEnunciado(q.enunciado):String(q.enunciado||'');body.appendChild(statement);
 const options=document.createElement('ol');options.className='review-options';
 const alternatives=Array.isArray(q.alternativas)?q.alternativas:[];
 const missingAlternatives=[];
 alternatives.forEach((alt,i)=>{if(!String(alt??'').trim()){missingAlternatives.push(String.fromCharCode(65+i));return}const li=document.createElement('li');if(typeof adicionarConteudoAlternativa==='function')adicionarConteudoAlternativa(li,alt,i);else li.textContent=String.fromCharCode(65+i)+') '+alt;if(i===q.correta)li.className='review-correct-option';options.appendChild(li)});
 if(options.children.length)body.appendChild(options);
 if(missingAlternatives.length){const note=document.createElement('p');note.className='review-note';note.textContent=options.children.length?'Alternativas ainda não cadastradas: '+missingAlternatives.join(', ')+'.':'As alternativas desta questão ainda não foram cadastradas no banco de dados.';body.appendChild(note)}
 const answer=document.createElement('p');answer.className='review-answer';answer.textContent='Gabarito: '+String.fromCharCode(65+Number(q.correta));body.appendChild(answer);
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
function renderAccuracyByArea(){
 const box=document.getElementById('chart-accuracy');if(!box)return;box.replaceChildren();
 const groups=new Map();
 history.forEach(item=>{const key=item.subject||'geral';if(!groups.has(key))groups.set(key,{total:0,correct:0});const g=groups.get(key);g.total++;if(item.ok)g.correct++});
 const entries=[...groups.entries()].sort((a,b)=>(b[1].correct/b[1].total)-(a[1].correct/a[1].total));
 if(!entries.length){const empty=document.createElement('p');empty.className='chart-empty';empty.textContent='Responda questões para visualizar o desempenho por área.';box.appendChild(empty);return}
 const list=document.createElement('div');list.className='accuracy-list';
 entries.forEach(([area,v])=>{
  const rate=Math.round(v.correct/v.total*100),row=document.createElement('div');row.className='accuracy-row';
  const heading=document.createElement('div');heading.className='accuracy-row-heading';
  const name=document.createElement('strong');name.textContent=AREA_LABELS[area]||area;
  const value=document.createElement('strong');value.textContent=rate+'%';
  const track=document.createElement('div');track.className='accuracy-track';
  const fill=document.createElement('span');fill.className='accuracy-fill';fill.style.width=rate+'%';track.appendChild(fill);
  const detail=document.createElement('small');detail.textContent=v.correct+' acertos em '+v.total+' questões';
  heading.append(name,value);row.append(heading,track,detail);list.appendChild(row);
 });
 box.appendChild(list);
}
function refresh(){
 const $=id=>document.getElementById(id);if(!$('dashboard'))return;
 const total=history.length,correct=history.filter(x=>x.ok).length,sessions=read(SESS,[]);
 $('stat-total').textContent=total;$('stat-rate').textContent=(total?Math.round(correct/total*100):0)+'%';$('stat-sessions').textContent=sessions.length;
 renderWeeklyChart('chart-questions',history,'date','Ainda não há questões respondidas no período.');
 renderWeeklyChart('chart-sessions',sessions,'date','Ainda não há simulados concluídos no período.');
 renderAccuracyByArea();
 const goal=read(GOAL,20),pct=Math.min(100,Math.round(total/goal*100));$('goal-input').value=goal;$('goal-progress').style.width=pct+'%';$('goal-caption').textContent=Math.min(total,goal)+' de '+goal+' questões respondidas ('+pct+'%).';
 const badges=[[1,'🌱 Primeiro passo'],[10,'🔥 10 questões'],[50,'⭐ 50 questões'],[100,'🏅 100 questões'],[250,'🚀 250 questões']];$('achievements').replaceChildren();
 badges.forEach(x=>{const s=document.createElement('span');s.className='achievement'+(total>=x[0]?' unlocked':'');s.textContent=(total>=x[0]?'✓ ':'○ ')+x[1];$('achievements').appendChild(s)});
 const list=$('history-list');list.replaceChildren();if(!history.length){const p=document.createElement('p');p.className='muted';p.textContent='Responda sua primeira questão para começar seu histórico.';list.appendChild(p)}else history.slice().reverse().forEach(x=>{const row=document.createElement('div');row.className='history-item';const info=document.createElement('div');info.className='history-info';const a=document.createElement('strong');a.textContent=x.year+' · '+x.subject;const b=document.createElement('span');b.textContent=x.id+' · '+new Date(x.date).toLocaleDateString('pt-BR');const preview=document.createElement('span');preview.className='history-preview';preview.textContent=x.preview||'Carregando enunciado…';info.append(a,b,preview);if(!x.preview){obterTrechoHistorico(x).then(trecho=>{preview.textContent=trecho||'Trecho indisponível';if(trecho){x.preview=trecho;save(KEY,history)}})}const c=document.createElement('b');c.className=x.ok?'status-correct':'status-wrong';c.textContent=x.ok?'Acertou':'Revisar';const open=document.createElement('button');open.type='button';open.className='history-open-btn';open.textContent='Abrir revisão';open.addEventListener('click',()=>abrirRevisao(x));row.append(info,c,open);list.appendChild(row)});
 
}
function advanced(){
 const q=document.getElementById('box-qtd');if(!q||document.getElementById('advanced-filters'))return;
 const a=document.createElement('div');a.id='advanced-filters';a.className='advanced-filters';a.innerHTML='<label class="filter-check"><input id="filter-errors" type="checkbox"> Revisar somente questões que já errei</label><p class="muted filter-help">Combine com ano, matéria e quantidade para uma revisão direcionada.</p>';q.after(a);
 a.querySelector('input').addEventListener('change',e=>{reviewOnly=e.target.checked;atualizarBotaoStart()});
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
const originalAdvance=window.avancar;
if(typeof originalAdvance==='function')window.avancar=function(ok,timeout){
 const q=questoesFiltradas[indiceAtual];if(q){history.push({id:q.id||('Questão '+(indiceAtual+1)),year:anoAtual,subject:q.materia||'Geral',preview:primeirasCincoPalavras(q.enunciado),ok:!!ok,date:new Date().toISOString()});if(history.length>2000)history=history.slice(-2000);save(KEY,history)}
 const result=originalAdvance.call(this,ok,timeout);refresh();return result;
};
const originalFinish=window.finalizar;
if(typeof originalFinish==='function')window.finalizar=function(){
 if(!sessionSaved){sessionSaved=true;const sessions=read(SESS,[]);sessions.push({year:anoAtual,total:questoesFiltradas.length,correct:pontuacao,date:new Date().toISOString()});save(SESS,sessions.slice(-300))}
 const result=originalFinish.apply(this,arguments);refresh();return result;
};
const originalLoad=window.carregarAno;
if(typeof originalLoad==='function')window.carregarAno=async function(){const r=await originalLoad.apply(this,arguments);return r};
const originalStart=window.irParaQuiz;
if(typeof originalStart==='function')window.irParaQuiz=function(){
 sessionSaved=false;
 if(reviewOnly){const wrong=new Set(history.filter(x=>!x.ok).map(x=>x.id));const filtered=dadosCompletosAno.filter(q=>wrong.has(q.id));if(!filtered.length){alert('Ainda não há questões erradas registradas para este ano e matéria.');return}const previous=dadosCompletosAno;dadosCompletosAno=filtered;originalStart.apply(this,arguments);dadosCompletosAno=previous;return}
 const r=originalStart.apply(this,arguments);
 let bar=document.getElementById('quiz-progress-track');if(!bar){bar=document.createElement('div');bar.id='quiz-progress-track';bar.className='quiz-progress-track';bar.innerHTML='<span id="quiz-progress-fill"></span>';document.querySelector('.quiz-header').after(bar)}
 return r;
};
const originalQuestion=window.carregarQuestao;
if(typeof originalQuestion==='function')window.carregarQuestao=function(){
 const r=originalQuestion.apply(this,arguments);
 const fill=document.getElementById('quiz-progress-fill');if(fill)fill.style.width=((indiceAtual+1)/questoesFiltradas.length*100)+'%';
 document.querySelectorAll('.option-label input').forEach(input=>input.addEventListener('change',()=>{document.querySelectorAll('.option-label').forEach(x=>x.classList.remove('is-selected'));input.closest('.option-label').classList.add('is-selected')}));
 return r;
};
panel();advanced();refresh();
document.addEventListener('DOMContentLoaded',()=>{panel();advanced();refresh()});
window.addEventListener('storage',e=>{if(e.key===KEY){history=read(KEY,[]);refresh()}});
})();