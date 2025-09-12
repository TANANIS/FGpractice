// input_keyboard.js
import { applySOCD } from './socd.js';
import { keys, pushDir } from './state.js';
import { renderStick, renderLog } from './ui.js';

/**
 * 1) 將 KeyboardEvent 正規化
 *    - 方向鍵統一成 'ArrowUp/Left/Down/Right'
 *    - WASD 大小寫一律視為方向（W=Up, A=Left, S=Down, D=Right）
 *    - 空白鍵視為 Up
 *    - 行為鍵保留原字元（j/k/l/m/,/. 以及 Shift 的 '<','>'）
 */
function normalizeKey(e) {
  const rawKey = e.key;                  // 可能是 'w'、'W'、','、'ArrowUp'、' ' 等
  const lower  = rawKey.length === 1 ? rawKey.toLowerCase() : rawKey;
  const code   = e.code;                 // 可能是 'KeyW'、'ArrowUp'、'Space' 等

  // 空白 = 上
  if (rawKey === ' ' || code === 'Space') return 'ArrowUp';

  // Arrow 方向
  if (rawKey === 'ArrowUp'    || code === 'ArrowUp')    return 'ArrowUp';
  if (rawKey === 'ArrowLeft'  || code === 'ArrowLeft')  return 'ArrowLeft';
  if (rawKey === 'ArrowDown'  || code === 'ArrowDown')  return 'ArrowDown';
  if (rawKey === 'ArrowRight' || code === 'ArrowRight') return 'ArrowRight';

  // WASD（大小寫都吃）
  if (lower === 'w' || code === 'KeyW') return 'ArrowUp';
  if (lower === 'a' || code === 'KeyA') return 'ArrowLeft';
  if (lower === 's' || code === 'KeyS') return 'ArrowDown';
  if (lower === 'd' || code === 'KeyD') return 'ArrowRight';

  // 行為鍵（Punch: j/k/l, Kick: m , .；含 Shift 的 < >）
  if (['j','k','l','m',',','.','<','>'].includes(lower)) return lower;

  // 其他按鍵不處理
  return null;
}

function currentDirFromKeys() {
  // 只看方向 token（Arrow*）
  let L = keys.has('ArrowLeft');
  let R = keys.has('ArrowRight');
  let U = keys.has('ArrowUp');
  let D = keys.has('ArrowDown');

  // 套用 SOCD 規則
  ({ U, D, L, R } = applySOCD(U, D, L, R));

  // 轉為數字方向（7/8/9/4/5/6/1/2/3）
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

export function initKeyboard(onPunch, onKick) {
  function handleKeyDown(e) {
    const tok = normalizeKey(e);
    if (!tok) return;

    // 阻止方向鍵/空白的預設捲動/按鈕行為
    if (tok.startsWith('Arrow')) e.preventDefault();

    // 行為鍵（一次觸發即可，不需要長按重複）
    if (tok === 'j' || tok === 'k' || tok === 'l') {
      onPunch && onPunch();
      return;
    }
    if (tok === 'm' || tok === ',' || tok === '.' || tok === '<' || tok === '>') {
      onKick && onKick();
      return;
    }

    // 方向鍵：加入集合 → 推送方向 → 更新 UI/LOG
    const before = currentDirFromKeys();
    keys.add(tok);
    const after = currentDirFromKeys();
    if (after !== before) {
      pushDir(after);
      renderStick(after);
      renderLog();
    }
  }

  function handleKeyUp(e) {
    const tok = normalizeKey(e);
    if (!tok) return;

    if (tok.startsWith('Arrow')) e.preventDefault();

    // 方向鍵：移除集合 → 推送方向 → 更新 UI/LOG
    if (tok.startsWith('Arrow')) {
      const before = currentDirFromKeys();
      keys.delete(tok);
      const after = currentDirFromKeys();
      if (after !== before) {
        pushDir(after);
        renderStick(after);
        renderLog();
      }
    }
    // 行為鍵的 keyup 不需處理（行為在 keydown 觸發）
  }

  // 掛載監聽（passive: false 才能 preventDefault）
  window.addEventListener('keydown', handleKeyDown, { passive: false });
  window.addEventListener('keyup', handleKeyUp, { passive: false });

  // 讓空白處點一下可奪回焦點，避免被表單元素吃鍵
  window.addEventListener('mousedown', () => window.focus());
}
