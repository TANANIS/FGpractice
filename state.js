// state.js
export let buffer = [];          // [{dir,t}]
export const keys = new Set();   // keyboard pressed
export let ok=0, ng=0;

export function pushDir(dir){
  const now = performance.now();
  if (!buffer.length || buffer[buffer.length-1].dir !== dir){
    buffer.push({dir, t:now});
    const cutoff = now - 2500;
    buffer = buffer.filter(x=>x.t>=cutoff);
  }
}
export function clearAll(){
  buffer = [];
  ok=0; ng=0;
}
