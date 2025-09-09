// ui.js
import { DOM } from './config.js';
import { ok, ng, buffer } from './state.js';

export function renderStick(dir){
  DOM.stickCells.forEach(c=> c.classList.toggle('active', Number(c.dataset.dir)===dir));
}
export function renderLog(){
  const rows = buffer.map(b=>`${Math.round(b.t%100000).toString().padStart(5,'0')}  dir=<em>${b.dir}</em>`);
  DOM.logEl.innerHTML = rows.join('\n');
  DOM.logEl.scrollTop = DOM.logEl.scrollHeight;
}
export function renderStats(){
  const total = ok+ng;
  DOM.okEl.textContent = ok;
  DOM.ngEl.textContent = ng;
  DOM.rateEl.textContent = (total? Math.round(ok/total*100):0) + '%';
}
export function appendJudgeLine(hit, stamp){
  const viaTxt = hit.via==='exact' ? '精確' : (hit.via==='dp_heuristic' ? '啟發式' : '');
  const seqTxt = Array.isArray(hit.seq) ? hit.seq.join(' → ')
                : (hit.pattern==='622' ? '6 → 2 → 2'
                  : (hit.pattern==='266' ? '2 → 6 → 6' : ''));
  const line = ' '+stamp+'  '
    + (hit.ok? '✅ <span class="hit">'+(hit.name||'Move')+' OK</span>' : '❌ <span class="miss">Miss</span>')
    + (seqTxt? ' <span class="sub">['+seqTxt+']</span>':'')
    + (viaTxt? ' <span class="sub">'+viaTxt+'</span>':'');
  DOM.judgeEl.innerHTML += (DOM.judgeEl.innerHTML? '\n':'') + line;
  DOM.judgeEl.scrollTop = DOM.judgeEl.scrollHeight;
}
export function showLastBox(hit, stamp){
  const viaTxt = hit.via==='exact' ? '精確' : (hit.via==='dp_heuristic' ? '啟發式' : '');
  const seqTxt = Array.isArray(hit.seq) ? hit.seq.join(' → ')
                : (hit.pattern==='622' ? '6 → 2 → 2'
                  : (hit.pattern==='266' ? '2 → 6 → 6' : ''));
  const statusHtml = hit.ok ? '✅ <span class="hit">成功</span>' : '❌ <span class="miss">失誤</span>';
  DOM.lastBox.innerHTML = '<div><span class="sub">'+stamp+'</span></div>'
    + '<div>'+(hit.name||'Move')+' '+statusHtml
    + (seqTxt? ' <span class="sub">['+seqTxt+']</span>':'')
    + (viaTxt? ' <span class="sub">'+viaTxt+'</span>':'')
    + '</div>';
}
export function resetPanels(){
  DOM.judgeEl.textContent='';
  DOM.logEl.textContent='';
}
export function setPadStatus(txt){ DOM.padStatus.textContent = txt; }
