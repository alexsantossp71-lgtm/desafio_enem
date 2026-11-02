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
 '<div class="stats-grid"><article class="stat-card"><span>Questões respondidas</span><strong id="stat-total">0</strong><small>no seu histórico</small></article><article class="stat-card"><span>Taxa de acertos</span><strong id="stat-rate">0%</strong><small>aproveitamento geral</small></article><article class="stat-card"><span>Simulados concluídos</span><strong id="stat-sessions">0</strong><small>sessões finalizadas</small></article></div>'+
 '<div class="dashboard-columns"><section class="panel-card"><div class="panel-title"><div><span class="eyebrow">POR ÁREA</span><h3>Matérias</h3></div><span class="panel-icon">▦</span></div><div id="subject-cards" class="subject-cards"><p class="muted">Selecione um ano para ver as matérias disponíveis.</p></div></section>'+
 '<section class="panel-card"><div class="panel-title"><div><span class="eyebrow">CONSTÂNCIA</span><h3>Meta de estudos</h3></div><span class="panel-icon">◎</span></div><p class="muted">Defina quantas questões deseja responder.</p><div class="goal-row"><input id="goal-input" type="number" min="1" max="500" aria-label="Meta de questões"><button id="goal-save" class="small-primary" type="button">Salvar meta</button></div><div class="goal-track"><span id="goal-progress"></span></div><p id="goal-caption" class="muted"></p><div id="achievements" class="achievements"></div></section></div>'+
 '<section class="panel-card history-panel"><div class="panel-title"><div><span class="eyebrow">SEU PROGRESSO</span><h3>Histórico recente</h3></div><span class="muted">Salvo neste dispositivo</span></div><div id="history-list" class="history-list"></div></section>';
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
 Object.keys(counts).forEach(m=>{const pair=names[m]||['📘',m],b=document.createElement('button');b.type='button';b.className='subject-card';const i=document.createElement('span');i.className='subject-symbol';i.textContent=pair[0];const n=document.createElement('strong');n.textContent=pair[1];const c=document.createElement('small');c.textContent=counts[m]+' questões';b.append(i,n,c);b.addEventListener('click',()=>{const target=[...document.querySelectorAll('#mat-buttons-container button')].find(x=>x.textContent===(names[m]||['',m])[1]||x.textContent===m);if(target){target.click();document.getElementById('box-materia').scrollIntoView({behavior:'smooth',block:'center'})}});box.appendChild(b)});
}
function refresh(){
 const $=id=>document.getElementById(id);if(!$('dashboard'))return;
 const total=history.length,correct=history.filter(x=>x.ok).length,sessions=read(SESS,[]);
 $('stat-total').textContent=total;$('stat-rate').textContent=(total?Math.round(correct/total*100):0)+'%';$('stat-sessions').textContent=sessions.length;
 const goal=read(GOAL,20),pct=Math.min(100,Math.round(total/goal*100));$('goal-input').value=goal;$('goal-progress').style.width=pct+'%';$('goal-caption').textContent=Math.min(total,goal)+' de '+goal+' questões respondidas ('+pct+'%).';
 const badges=[[1,'🌱 Primeiro passo'],[10,'🔥 10 questões'],[50,'⭐ 50 questões'],[100,'🏅 100 questões'],[250,'🚀 250 questões']];$('achievements').replaceChildren();
 badges.forEach(x=>{const s=document.createElement('span');s.className='achievement'+(total>=x[0]?' unlocked':'');s.textContent=(total>=x[0]?'✓ ':'○ ')+x[1];$('achievements').appendChild(s)});
 const list=$('history-list');list.replaceChildren();if(!history.length){const p=document.createElement('p');p.className='muted';p.textContent='Responda sua primeira questão para começar seu histórico.';list.appendChild(p)}else history.slice(-6).reverse().forEach(x=>{const row=document.createElement('div');row.className='history-item';const a=document.createElement('strong');a.textContent=x.year+' · '+x.subject;const b=document.createElement('span');b.textContent=x.id+' · '+new Date(x.date).toLocaleDateString('pt-BR');const c=document.createElement('b');c.className=x.ok?'status-correct':'status-wrong';c.textContent=x.ok?'Acertou':'Revisar';row.append(a,b,c);list.appendChild(row)});
 subjects();
}
function advanced(){
 const q=document.getElementById('box-qtd');if(!q||document.getElementById('advanced-filters'))return;
 const a=document.createElement('div');a.id='advanced-filters';a.className='advanced-filters';a.innerHTML='<label class="filter-check"><input id="filter-errors" type="checkbox"> Revisar somente questões que já errei</label><p class="muted filter-help">Combine com ano, matéria e quantidade para uma revisão direcionada.</p>';q.after(a);
 a.querySelector('input').addEventListener('change',e=>{reviewOnly=e.target.checked;atualizarBotaoStart()});
}
const originalAdvance=window.avancar;
if(typeof originalAdvance==='function')window.avancar=function(ok,timeout){
 const q=questoesFiltradas[indiceAtual];if(q){history.push({id:q.id||('Questão '+(indiceAtual+1)),year:anoAtual,subject:q.materia||'Geral',ok:!!ok,date:new Date().toISOString()});if(history.length>2000)history=history.slice(-2000);save(KEY,history)}
 const result=originalAdvance.call(this,ok,timeout);refresh();return result;
};
const originalFinish=window.finalizar;
if(typeof originalFinish==='function')window.finalizar=function(){
 if(!sessionSaved){sessionSaved=true;const sessions=read(SESS,[]);sessions.push({year:anoAtual,total:questoesFiltradas.length,correct:pontuacao,date:new Date().toISOString()});save(SESS,sessions.slice(-300))}
 const result=originalFinish.apply(this,arguments);refresh();return result;
};
const originalLoad=window.carregarAno;
if(typeof originalLoad==='function')window.carregarAno=async function(){const r=await originalLoad.apply(this,arguments);subjects();return r};
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