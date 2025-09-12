// reaction.js
import { DOM } from './config.js';

const TIME_LIMIT = { easy: 6000, normal: 3500, hard: 2200 };
const MOVE_KEYS = ['dp', 'fb', 'tatsu'];

let active = false, pool = [], idx = 0, ok = 0, ng = 0;
let rafId = null, timeoutId = null, startTs = 0, perQuestionMs = 0;

function moveName(key){
  const opt = Array.from(DOM.moveSel.options).find(o=>o.value===key);
  return opt ? opt.textContent : key;
}
function buildPool(count){
  pool = [];
  for (let i=0;i<count;i++){
    const move = MOVE_KEYS[Math.floor(Math.random()*MOVE_KEYS.length)];
    const faceLeft = Math.random()<0.5;
    pool.push({ move, faceLeft, name: moveName(move) });
  }
}
function renderQuestion(q){
  // 讓既有判定引擎使用這兩個狀態
  DOM.moveSel.value = q.move;
  DOM.face.checked  = q.faceLeft;
  DOM.questionBox.textContent = `${q.name}（${q.faceLeft?'面向左':'面向右'}）`;
  DOM.reactRemain.textContent = (pool.length - idx - 1).toString();
}
function startTimer(ms){
  stopTimer();
  perQuestionMs = ms;
  startTs = performance.now();
  const loop = ()=>{
    const elapsed = performance.now() - startTs;
    const ratio = Math.max(0, Math.min(1, elapsed / perQuestionMs));
    if (DOM.timerBar) DOM.timerBar.style.width = `${(1 - ratio) * 100}%`;
    if (elapsed >= perQuestionMs){ handleAnswer(false); return; }
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
  timeoutId = setTimeout(()=>handleAnswer(false), perQuestionMs + 50);
}
function stopTimer(){
  if (rafId) cancelAnimationFrame(rafId), rafId = null;
  if (timeoutId) clearTimeout(timeoutId), timeoutId = null;
  if (DOM.timerBar) DOM.timerBar.style.width = '0%';
}
function nextQuestion(){
  if (idx >= pool.length){ finish(); return; }
  renderQuestion(pool[idx]);
  const diff = DOM.difficulty?.value || 'normal';
  startTimer(TIME_LIMIT[diff] ?? TIME_LIMIT.normal);
}
function handleAnswer(isOk){
  if (!active) return;
  stopTimer();
  if (isOk) ok++; else ng++;
  DOM.reactOk.textContent = String(ok);
  DOM.reactNg.textContent = String(ng);
  idx++;
  nextQuestion();
}
function finish(){
  active = false;
  stopTimer();
  DOM.questionBox.textContent = '完成！';
}
export function initReactionBindings(){
  DOM.reactionStart?.addEventListener('click', ()=>{
    if (!active) start();
  });
}
export function start(){
  active = true; ok=0; ng=0; idx=0;
  DOM.reactOk.textContent='0';
  DOM.reactNg.textContent='0';
  const count = parseInt(DOM.questionCount?.value || '10', 10) || 10;
  DOM.reactRemain.textContent = String(count);
  DOM.questionBox.textContent = '準備中…';
  buildPool(count);
  nextQuestion();
}
export function stop(){
  if (!active) return;
  active = false;
  stopTimer();
  DOM.questionBox.textContent = '（已停止）';
}
export function isActive(){ return active; }
export function onJudgeResult(hit){
  if (!active) return;
  if (hit.ok) handleAnswer(true);
}