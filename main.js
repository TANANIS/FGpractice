// main.js
import { DOM } from './config.js';
import { clearAll, ok, ng } from './state.js';
import { initKeyboard } from './input_keyboard.js';
import { initGamepad } from './input_gamepad.js';
import { checkSequence } from './judge.js';
import { renderStats, appendJudgeLine, showLastBox, resetPanels } from './ui.js';

function onAction(kind){ // kind: 'P' | 'K'
  const t = performance.now();
  const hit = checkSequence(t, kind);

  // 更新統計
  if (hit.ok) { window.__ok = (window.__ok||0)+1; } else { window.__ng = (window.__ng||0)+1; }
  // 讓 ui.js 讀到最新數字（簡單做法：掛到 window 再讀）
  const stamp = Math.round(performance.now()%100000).toString().padStart(5,'0');
  appendJudgeLine(hit, stamp);
  showLastBox(hit, stamp);
  // renderStats 用 window.__ok/__ng
  const totalOk = window.__ok||0, totalNg = window.__ng||0;
  DOM.okEl.textContent = totalOk;
  DOM.ngEl.textContent = totalNg;
  DOM.rateEl.textContent = (totalOk+totalNg ? Math.round(totalOk/(totalOk+totalNg)*100):0) + '%';
}

initKeyboard(
  ()=>onAction('P'),
  ()=>onAction('K')
);
initGamepad(
  ()=>onAction('P'),
  ()=>onAction('K')
);

DOM.resetBtn.addEventListener('click', ()=>{
  window.__ok = 0; window.__ng = 0;
  DOM.okEl.textContent='0'; DOM.ngEl.textContent='0'; DOM.rateEl.textContent='0%';
  resetPanels(); clearAll();
});
