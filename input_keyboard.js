// input_keyboard.js
import { applySOCD } from './socd.js';
import { keys, pushDir } from './state.js';
import { renderStick, renderLog } from './ui.js';

function currentDir(){
  let l = keys.has('ArrowLeft')||keys.has('a');
  let r = keys.has('ArrowRight')||keys.has('d');
  let u = keys.has('ArrowUp')||keys.has('w');
  let d = keys.has('ArrowDown')||keys.has('s');
  ({U:u,D:d,L:l,R:r} = applySOCD(u,d,l,r));
  let dir = 5;
  if (u && l) dir = 7; else if (u && r) dir = 9; else if (d && l) dir = 1; else if (d && r) dir = 3;
  else if (l) dir = 4; else if (r) dir = 6; else if (u) dir = 8; else if (d) dir = 2; else dir = 5;
  return dir;
}

export function initKeyboard(onAction){
  window.addEventListener('keydown', (e)=>{
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(e.key)){
      const before = currentDir();
      keys.add(e.key);
      const dir = currentDir();
      if (dir!==before){ pushDir(dir); renderStick(dir); renderLog(); }
    }
    if (['j','k','l','J','K','L'].includes(e.key)){ onAction(); }
  });
  window.addEventListener('keyup', (e)=>{
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(e.key)){
      const before = currentDir();
      keys.delete(e.key);
      const dir = currentDir();
      if (dir!==before){ pushDir(dir); renderStick(dir); renderLog(); }
    }
  });
  // 初始中立
  pushDir(5); renderStick(5); renderLog();
}
 