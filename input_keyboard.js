// input_keyboard.js (Space acts as W / Up=8)
import { applySOCD } from "./socd.js";
import { keys, pushDir } from "./state.js";
import { renderStick, renderLog } from "./ui.js";

function currentDir() {
  let l = keys.has("ArrowLeft") || keys.has("a");
  let r = keys.has("ArrowRight") || keys.has("d");
  let u = keys.has("ArrowUp") || keys.has("w");
  let d = keys.has("ArrowDown") || keys.has("s");
  ({ U: u, D: d, L: l, R: r } = applySOCD(u, d, l, r));
  let dir = 5;
  if (u && l) dir = 7;
  else if (u && r) dir = 9;
  else if (d && l) dir = 1;
  else if (d && r) dir = 3;
  else if (l) dir = 4;
  else if (r) dir = 6;
  else if (u) dir = 8;
  else if (d) dir = 2;
  else dir = 5;
  return dir;
}

export function initKeyboard(onPunch, onKick) {
  window.addEventListener("keydown", (e) => {
    // Space = W (Up). Prevent page scroll and treat as holding 'w'.
    if (e.code === "Space") {
      e.preventDefault();
      const before = currentDir();
      if (!keys.has("w")) {
        // guard against auto-repeat
        keys.add("w");
        const dir = currentDir();
        if (dir !== before) {
          pushDir(dir);
          renderStick(dir);
          renderLog();
        }
      }
      return; // handled
    }

    if (
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "a",
        "d",
        "w",
        "s",
      ].includes(e.key)
    ) {
      const before = currentDir();
      keys.add(e.key);
      const dir = currentDir();
      if (dir !== before) {
        pushDir(dir);
        renderStick(dir);
        renderLog();
      }
    }
    // P（拳）= J K L
    if (["j", "k", "l", "J", "K", "L"].includes(e.key)) {
      onPunch();
    }
    // K（腳）= M , . 以及其 Shift（< >）
    if (["m", "M", ",", ".", "<", ">"].includes(e.key)) {
      onKick();
    }
  });

  window.addEventListener("keyup", (e) => {
    // Release Space = release 'w'
    if (e.code === "Space") {
      const before = currentDir();
      if (keys.has("w")) keys.delete("w");
      const dir = currentDir();
      if (dir !== before) {
        pushDir(dir);
        renderStick(dir);
        renderLog();
      }
      return; // handled
    }

    if (
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "a",
        "d",
        "w",
        "s",
      ].includes(e.key)
    ) {
      const before = currentDir();
      keys.delete(e.key);
      const dir = currentDir();
      if (dir !== before) {
        pushDir(dir);
        renderStick(dir);
        renderLog();
      }
    }
  });

  // 初始中立
  pushDir(5);
  renderStick(5);
  renderLog();
}
