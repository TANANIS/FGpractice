// judge.js
import { DEFAULTS } from "./config.js";
import { buffer } from "./state.js";
import { getActiveSeqs, forwardDir } from "./moves.js";

export function checkSequence(pressTime, pressKind){ // pressKind: 'P' | 'K'
  const stepMs = DEFAULTS.stepMs;
  const totalMs = DEFAULTS.totalMs;
  const pressMs = DEFAULTS.punchMs;

   const {seqs, action, name} = getActiveSeqs();
  // 若按的不是該招式要求的 P/K，直接 Miss（仍回傳 name 供 UI 顯示）
  if (pressKind && action && pressKind !== action){
    return {ok:false, action, name, reason:'wrong_action'};
  }
  const winStart = pressTime - totalMs;
  const win = buffer.filter((x) => x.t >= winStart && x.t <= pressTime);

  function matchOneExact(seq) {
    let i = 0,
      lastT = null;
    for (const item of win) {
      if (item.dir === seq[i]) {
        if (lastT !== null && item.t - lastT > stepMs) return { ok: false };
        lastT = item.t;
        i++;
        if (i === seq.length) break;
      }
    }
    if (i !== seq.length) return { ok: false };
    return { ok: true, lastT };
  }

  function dpHeuristic() {
    const dirs = win.map((x) => x.dir);
    const times = win.map((x) => x.t);
    const isR = (d) => d === 6 || d === 3 || d === 9;
    const isD = (d) => d === 2 || d === 1 || d === 3;
    const isU = (d) => d === 8 || d === 7 || d === 9;
    const isNonR = (d) => !isR(d);
    const isNonD = (d) => !isD(d);

    for (let i = 0; i < dirs.length; i++) {
      if (!isD(dirs[i])) continue;
      for (let j = i + 1; j < dirs.length; j++) {
        if (!isD(dirs[j])) continue;
        let separated = false;
        for (let k = i + 1; k < j; k++) {
          if (isNonD(dirs[k])) {
            separated = true;
            break;
          }
        }
        if (!separated) continue;
        let a = -1;
        for (let m = 0; m <= i; m++) {
          if (isR(dirs[m])) a = m;
        }
        if (a === -1) continue;
        if (times[i] - times[a] > stepMs) continue;
        if (times[j] - times[i] > stepMs) continue;
        return { ok: true, lastT: times[j], pattern: "622" };
      }
    }
    for (let i = 0; i < dirs.length; i++) {
      if (!isR(dirs[i])) continue;
      for (let j = i + 1; j < dirs.length; j++) {
        if (!isR(dirs[j])) continue;
        let separated = false;
        for (let k = i + 1; k < j; k++) {
          if (isNonR(dirs[k])) {
            separated = true;
            break;
          }
        }
        if (!separated) continue;
        let hasDownBeforeSecond = false;
        for (let m = 0; m <= j; m++) {
          if (isD(dirs[m])) {
            hasDownBeforeSecond = true;
            break;
          }
        }
        if (!hasDownBeforeSecond) continue;
        if (times[j] - times[i] > stepMs) continue;
        return { ok: true, lastT: times[j], pattern: "266" };
      }
    }

    for (let i = 0; i < dirs.length; i++) {
      if (!isR(dirs[i])) continue;
      for (let j = i; j < dirs.length; j++) {
        if (!isD(dirs[j])) continue;
        if (times[j] - times[i] > stepMs) continue;
        for (let k = j; k < dirs.length; k++) {
          if (!isU(dirs[k])) continue;
          if (times[k] - times[j] > stepMs) continue;
          return { ok: true, lastT: times[k], pattern: "628" };
        }
      }
    }
    return { ok: false };
  }

  function anchorAfterFinish(lastT) {
    const fwd = forwardDir();
    for (const item of win) {
      if (
        item.t > lastT &&
        item.t - lastT <= stepMs &&
        (item.dir === fwd || item.dir === 5)
      ) {
        return item.t;
      }
    }
    return lastT;
  }

  for (const seq of seqs) {
    const r = matchOneExact(seq);
    if (r.ok) {
      const anchor = anchorAfterFinish(r.lastT);
      if (pressTime - anchor <= pressMs) {
        return { ok: true, action, name, via: "exact", seq };
      }
    }
  }
  const dpH = dpHeuristic();
  if (dpH.ok) {
    const anchor = anchorAfterFinish(dpH.lastT);
    if (pressTime - anchor <= pressMs) {
      return {
        ok: true,
        action,
        name,
        via: "dp_heuristic",
        pattern: dpH.pattern,
      };
    }
  }
  return { ok: false, action, name };
}
