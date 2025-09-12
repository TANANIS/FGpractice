// input_gamepad.js
import { DOM, DEFAULTS } from './config.js';
import { applySOCD } from './socd.js';
import { pushDir } from './state.js';
import { renderStick, renderLog, setPadStatus } from './ui.js';

let rafId = null;
let enabled = false;
let lastDir = 5;

function pickPad(){
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (let i = 0; i < pads.length; i++){
    if (pads[i]) return pads[i];
  }
  return null;
}

function axisToDir(ax, ay, deadzone){
  // 軸向：-1..1；上是負、左是負
  const L = ax <= -deadzone;
  const R = ax >=  deadzone;
  const U = ay <= -deadzone;
  const D = ay >=  deadzone;

  // D-Pad 與搖桿併用：先把搖桿向量轉成布林，再跟 D-Pad 做 OR
  return { L, R, U, D };
}

function dpadToDir(pad){
  const btn = pad.buttons;
  const L = !!btn[14]?.pressed;
  const R = !!btn[15]?.pressed;
  const U = !!btn[12]?.pressed;
  const D = !!btn[13]?.pressed;
  return { L, R, U, D };
}

function boolsToNum({L,R,U,D}){
  // 套 SOCD：回中
  ({U,D,L,R} = applySOCD(U,D,L,R));
  if (U && L) return 7;
  if (U && R) return 9;
  if (D && L) return 1;
  if (D && R) return 3;
  if (L) return 4;
  if (R) return 6;
  if (U) return 8;
  if (D) return 2;
  return 5;
}

function mapActions(pad, onPunch, onKick){
  const b = pad.buttons;
  // Punch：A/B/X/Y
  if (b[0]?.pressed || b[1]?.pressed || b[2]?.pressed || b[3]?.pressed) onPunch && onPunch();
  // Kick：LB/RB 或 LT/RT（部分手把 LT/RT 是軸，部分是按鈕）
  if (b[4]?.pressed || b[5]?.pressed || b[6]?.pressed || b[7]?.pressed) onKick && onKick();
}

function poll(onPunch, onKick){
  if (!enabled){ setPadStatus('未使用'); return; }

  const pad = pickPad();
  if (!pad){
    setPadStatus('未連線');
    rafId = requestAnimationFrame(()=>poll(onPunch, onKick));
    return;
  }

  // 狀態字串
  setPadStatus((pad.id || 'Gamepad') + (pad.mapping ? ` · ${pad.mapping}` : ''));

  // 方向：合併 D-Pad + 左搖桿
  const dz = DEFAULTS.deadzone ?? 0.25;
  const a = axisToDir(pad.axes[0]||0, pad.axes[1]||0, dz);
  const d = dpadToDir(pad);
  const dirNum = boolsToNum({
    L: a.L || d.L,
    R: a.R || d.R,
    U: a.U || d.U,
    D: a.D || d.D,
  });

  if (dirNum !== lastDir){
    lastDir = dirNum;
    pushDir(dirNum);
    renderStick(dirNum);
    renderLog();
  }

  // 行為鍵
  mapActions(pad, onPunch, onKick);

  rafId = requestAnimationFrame(()=>poll(onPunch, onKick));
}

export function initGamepad(onPunch, onKick){
  // UI 切換
  DOM.usePad?.addEventListener('change', ()=>{
    enabled = !!DOM.usePad.checked;
    if (enabled){
      // 立刻開始掃描一次（有些環境不會觸發 connected 事件）
      if (!rafId) rafId = requestAnimationFrame(()=>poll(onPunch, onKick));
    }else{
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      setPadStatus('未使用');
    }
  });

  // 事件（支援會發事件的瀏覽器）
  window.addEventListener('gamepadconnected', ()=>{
    if (DOM.usePad?.checked){
      enabled = true;
      if (!rafId) rafId = requestAnimationFrame(()=>poll(onPunch, onKick));
    }
  });
  window.addEventListener('gamepaddisconnected', ()=>{
    // 不停輪，讓使用者重新插回也能抓到
  });

  // 預設狀態
  setPadStatus('未連線');
}
