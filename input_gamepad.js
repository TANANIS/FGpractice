// input_gamepad.js
import { DEFAULTS, DOM } from './config.js';
import { applySOCD } from './socd.js';
import { pushDir } from './state.js';
import { renderStick, renderLog, setPadStatus } from './ui.js';

let lastPadDir = 5;
let prevPadButtons = new Set();

function readPad(){
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const p = pads && pads[0];
  if (!p) return {connected:false, dir:5, action:false};

  const b = p.buttons;
  let up = b[12]?.pressed || false;
  let down = b[13]?.pressed || false;
  let left = b[14]?.pressed || false;
  let right = b[15]?.pressed || false;

  const dz = DEFAULTS.deadzone;
  const ax = p.axes?.[0] ?? 0, ay = p.axes?.[1] ?? 0;
  let lx = Math.abs(ax) > dz ? ax : 0;
  let ly = Math.abs(ay) > dz ? ay : 0;

  let L = left || lx < -dz;
  let R = right || lx > dz;
  let U = up   || ly < -dz;
  let D = down || ly > dz;

  ({U,D,L,R} = applySOCD(U,D,L,R));

  let dir = 5;
  if (U && L) dir = 7; else if (U && R) dir = 9; else if (D && L) dir = 1; else if (D && R) dir = 3;
  else if (L) dir = 4; else if (R) dir = 6; else if (U) dir = 8; else if (D) dir = 2; else dir = 5;

  const faceIdx = [0,1,2,3];
  let action = false;
  const nowPressed = new Set();
  faceIdx.forEach(i=>{ if (b[i]?.pressed){ nowPressed.add(i); if (!prevPadButtons.has(i)) action = true; }});
  prevPadButtons = nowPressed;

  return {connected:true, dir, action};
}

export function initGamepad(onAction){
  window.addEventListener('gamepadconnected', (e)=> setPadStatus(`已連線：${e.gamepad.id}`));
  window.addEventListener('gamepaddisconnected', ()=> setPadStatus('未連線'));

  function loop(){
    if (DOM.usePad.checked){
      const s = readPad();
      setPadStatus(s.connected ? `已連線：${navigator.getGamepads()?.[0]?.id || 'Gamepad'}` : '未連線');
      if (s.connected){
        if (s.dir !== lastPadDir){ lastPadDir = s.dir; pushDir(s.dir); renderStick(s.dir); renderLog(); }
        if (s.action){ onAction(); }
      }
    }
    requestAnimationFrame(loop);
  }
  loop();
}
