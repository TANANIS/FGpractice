// moves.js
import { DOM } from "./config.js";

const MOVES = {
  dp: {
    name: "昇龍拳",
    seqR: [[6, 2, 3]],
    action: "P",
    altR: [
      [6, 2, 2],
      [2, 6, 6],
      [6, 2, 8], 
      [6, 3, 9], 
      [6, 2, 5, 2],
      [2, 6, 5, 6],
      [6, 2, 5, 8],
    ],
  },
  fb: { name: "波動拳", seqR: [[2, 3, 6]], action: "P" },
  tatsu: {
    name: "旋風腳",
    seqR: [[2, 1, 4]],
    action: "K",
    altR: [
      [2, 5, 4],
      [2, 4, 4],
      [2, 2, 4],
    ],
  },
};

function mirrorDir(dir) {
  const m = { 1: 3, 3: 1, 4: 6, 6: 4, 7: 9, 9: 7 };
  return m[dir] ?? dir;
}
function mirrorSeq(seq) {
  return seq.map(mirrorDir);
}

export function getActiveSeqs() {
  const mv = MOVES[DOM.moveSel.value];
  const base = mv.seqR.map((s) => s.slice());
  const alts =
    DOM.hitboxMode.checked && mv.altR ? mv.altR.map((s) => s.slice()) : [];
  let seqs = base.concat(alts);
  if (DOM.face.checked) {
    seqs = seqs.map(mirrorSeq);
  }
  return { seqs, action: mv.action, name: mv.name };
}

export function forwardDir() {
  // 依面向回傳前方 6/4
  return DOM.face.checked ? 4 : 6;
}
