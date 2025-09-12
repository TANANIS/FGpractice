// main.js
import { DOM } from './config.js';
import { clearAll } from './state.js';
import { initKeyboard } from './input_keyboard.js';
import { initGamepad } from './input_gamepad.js';
import { checkSequence } from './judge.js';
import { appendJudgeLine, showLastBox, resetPanels } from './ui.js';

// 反應模式控制
import { initReactionBindings, onJudgeResult as reactionOnJudge, isActive as reactionActive, stop as reactionStop } from './reaction.js';

function applyModeUI(){
  const isReaction = DOM.mode?.value === 'reaction';
  if (DOM.freeBlock)      DOM.freeBlock.style.display = isReaction ? 'none' : '';
  if (DOM.reactionBlock)  DOM.reactionBlock.style.display = isReaction ? '' : 'none';
  if (DOM.reactSection)   DOM.reactSection.style.display = isReaction ? '' : 'none';
  if (DOM.moveSel)        DOM.moveSel.disabled = isReaction;
  if (DOM.face)           DOM.face.disabled    = isReaction;
}
DOM.mode?.addEventListener('change', ()=>{
  const wasReaction = reactionActive();
  if (DOM.mode.value === 'free' && wasReaction){
    reactionStop();
    if (DOM.questionBox)  DOM.questionBox.textContent = '（未開始）';
    if (DOM.reactRemain)  DOM.reactRemain.textContent = '0';
    if (DOM.reactOk)      DOM.reactOk.textContent = '0';
    if (DOM.reactNg)      DOM.reactNg.textContent = '0';
  }
  applyModeUI();
});

function onAction(kind){ // 'P' | 'K'
  const t = performance.now();
  const hit = checkSequence(t, kind);

  // 更新統計（簡單掛在 window 以供 UI 讀取）
  if (hit.ok) { window.__ok = (window.__ok||0)+1; } else { window.__ng = (window.__ng||0)+1; }
  const stamp = Math.round(performance.now()%100000).toString().padStart(5,'0');
  appendJudgeLine(hit, stamp);
  showLastBox(hit, stamp);

  const totalOk = window.__ok||0, totalNg = window.__ng||0;
  if (DOM.okEl)   DOM.okEl.textContent = totalOk;
  if (DOM.ngEl)   DOM.ngEl.textContent = totalNg;
  if (DOM.rateEl) DOM.rateEl.textContent = (totalOk+totalNg ? Math.round(totalOk/(totalOk+totalNg)*100):0) + '%';

  // 反應模式推進
  if (reactionActive()) reactionOnJudge(hit);
}

// 掛輸入
initKeyboard(()=>onAction('P'), ()=>onAction('K'));
initGamepad( ()=>onAction('P'), ()=>onAction('K') );

// 重置
DOM.resetBtn?.addEventListener('click', ()=>{
  window.__ok = 0; window.__ng = 0;
  if (DOM.okEl) DOM.okEl.textContent='0';
  if (DOM.ngEl) DOM.ngEl.textContent='0';
  if (DOM.rateEl) DOM.rateEl.textContent='0%';
  resetPanels(); clearAll();
  if (reactionActive()) reactionStop();
});

// 啟用反應模式按鈕綁定與初始 UI
initReactionBindings();
applyModeUI();