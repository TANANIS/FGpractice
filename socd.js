// socd.js
import { DOM } from './config.js';
export function applySOCD(u,d,l,r){
  if (!DOM.socdNeutral.checked) return {U:u,D:d,L:l,R:r};
  return { U: u && !d, D: d && !u, L: l && !r, R: r && !l };
}
