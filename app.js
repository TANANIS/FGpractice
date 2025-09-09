(()=>{
  const $ = (s)=>document.querySelector(s);
  const $$ = (s)=>Array.from(document.querySelectorAll(s));
  const face = $('#face');
  const moveSel = $('#move');
  const resetBtn = $('#reset');
  const logEl = $('#log');
  const judgeEl = $('#judge');
  const lastBox = $('#lastBox');
  const okEl = $('#ok');
  const ngEl = $('#ng');
  const rateEl = $('#rate');
  const usePad = $('#usePad');
  const padStatus = $('#padStatus');
  const hitboxMode = $('#hitboxMode');
  const socdNeutral = $('#socdNeutral');
  const DEFAULTS = { stepMs: 160, totalMs: 430, punchMs: 120, deadzone: 0.25 };

  // 狀態
  let buffer = []; // {dir:number, t:number}
  let keys = new Set();
  let ok=0, ng=0;

  // Gamepad 狀態
  let lastPadDir = 5;
  let prevPadButtons = new Set();

  // 招式表（面向右）。面向左會鏡像（6↔4, 3↔1；5 不動）
  const MOVES = {
    dp:   { name:'昇龍拳',  seqR:[[6,2,3]], action:'P',
            altR:[[6,2,2],[2,6,6],[6,2,8],[6,2,5,2],[2,6,5,6],[6,2,5,8]] },
    fb:   { name:'波動拳',  seqR:[[2,3,6]], action:'P' },                 // 236P
    tatsu:{ name:'旋風腳',  seqR:[[2,1,4]], action:'K', altR:[[2,5,4],[2,4,4],[2,2,4]] } // 214K
  };

  // 鏡像方向
  function mirrorDir(dir){ const map={1:3,3:1,4:6,6:4,7:9,9:7}; return map[dir] ?? dir; }
  function mirrorSeq(seq){ return seq.map(mirrorDir); }

  function getActiveSeqs(){
    const mv = MOVES[moveSel.value];
    const base = mv.seqR.map(s=>s.slice());
    const alts = (hitboxMode.checked && mv.altR) ? mv.altR.map(s=>s.slice()) : [];
    let seqs = base.concat(alts);
    if (face.checked){ seqs = seqs.map(mirrorSeq); }
    return {seqs, action: mv.action, name: mv.name};
  }

  // SOCD（可切換）
  function applySOCD(u,d,l,r){
    if (!socdNeutral.checked) return {U:u,D:d,L:l,R:r};
    return { U: u && !d, D: d && !u, L: l && !r, R: r && !l };
  }

  // 方向（鍵盤）
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

  function pushDir(dir){
    const now = performance.now();
    if (!buffer.length || buffer[buffer.length-1].dir !== dir){
      buffer.push({dir, t:now});
      const cutoff = now - 2500; // 2.5s 視窗
      buffer = buffer.filter(x=>x.t>=cutoff);
      renderStick(dir);
      renderLog();
    }
  }

  function renderStick(dir){
    $$('.cell').forEach(c=> c.classList.toggle('active', Number(c.dataset.dir)===dir));
  }

  function renderLog(){
    const rows = buffer.map(b=>`${Math.round(b.t%100000).toString().padStart(5,'0')}  dir=<em>${b.dir}</em>`);
    logEl.innerHTML = rows.join('\n');
    logEl.scrollTop = logEl.scrollHeight;
  }

  // ===== 判定邏輯 =====
  function checkSequence(pressTime){
 const stepMs  = DEFAULTS.stepMs;
 const totalMs = DEFAULTS.totalMs;
 const pressMs = DEFAULTS.punchMs;

    const {seqs, action, name} = getActiveSeqs();
    const winStart = pressTime - totalMs;
    const win = buffer.filter(x=>x.t>=winStart && x.t<=pressTime);

    // 嚴格相等：只檢查步驟順序與間隔；出拳寬限另行處理（以便 DP 錨點後移）
    function matchOneExact(seq){
      let i=0, lastT=null;
      for (const item of win){
        if (item.dir===seq[i]){
          if (lastT!==null && (item.t - lastT) > stepMs) return {ok:false};
          lastT = item.t; i++; if (i===seq.length) break;
        }
      }
      if (i!==seq.length) return {ok:false};
      return {ok:true, lastT};
    }

    // DP 實戰啟發式（6-2-2 與 2-6-6），僅回傳最後關鍵步驟時間
    function dpHeuristic(){
      if (moveSel.value !== 'dp') return {ok:false};
      const dirs = win.map(x=>x.dir);
      const times = win.map(x=>x.t);
      const isR = d=> d===6 || d===3 || d===9; // 右成份（含 ↘/↗）
      const isD = d=> d===2 || d===1 || d===3; // 下成份（含 ↙/↘）
      const isNonR = d=> !isR(d);
      const isNonD = d=> !isD(d);

      // A: 6-2-2 型（兩個下成份，中間必有非下；且第一個下之前/同時有右成份）
      for (let i=0;i<dirs.length;i++){
        if (!isD(dirs[i])) continue;
        for (let j=i+1;j<dirs.length;j++){
          if (!isD(dirs[j])) continue;
          let separated=false; for (let k=i+1;k<j;k++){ if (isNonD(dirs[k])) {separated=true; break;} }
          if (!separated) continue;
          let a=-1; for (let m=0;m<=i;m++){ if (isR(dirs[m])) a=m; }
          if (a===-1) continue;
          if (times[i]-times[a] > stepMs) continue;
          if (times[j]-times[i] > stepMs) continue;
          return {ok:true, lastT: times[j], pattern:'622'};
        }
      }

      // B: 2-6-6 型（兩個右成份，中間必有非右；且第二次右之前曾出現下成份）
      for (let i=0;i<dirs.length;i++){
        if (!isR(dirs[i])) continue;
        for (let j=i+1;j<dirs.length;j++){
          if (!isR(dirs[j])) continue;
          let separated=false; for (let k=i+1;k<j;k++){ if (isNonR(dirs[k])) {separated=true; break;} }
          if (!separated) continue;
          let hasDownBeforeSecond=false; for (let m=0;m<=j;m++){ if (isD(dirs[m])) {hasDownBeforeSecond=true; break;} }
          if (!hasDownBeforeSecond) continue;
          if (times[j]-times[i] > stepMs) continue;
          return {ok:true, lastT: times[j], pattern:'266'};
        }
      }
      return {ok:false};
    }

    // 昇龍完成後允許補「前(6/4) 或 5」：在步驟間隔內把錨點延後
    function anchorAfterFinish(lastT){
      if (moveSel.value !== 'dp') return lastT;
      const forward = face.checked ? 4 : 6;
      for (const item of win){
        if (item.t>lastT && (item.t-lastT)<=stepMs && (item.dir===forward || item.dir===5)){
          return item.t;
        }
      }
      return lastT;
    }

    // (1) 嚴格序列（含 5 的變體）
    for (const seq of seqs){
      const r = matchOneExact(seq);
      if (r.ok){
        const anchor = anchorAfterFinish(r.lastT);
        if (pressTime - anchor <= pressMs){
          return {ok:true, action, name, via:'exact', seq};
        }
      }
    }

    // (2) DP 啟發式（處理 622 / 266）
    const dpH = dpHeuristic();
    if (dpH.ok){
      const anchor = anchorAfterFinish(dpH.lastT);
      if (pressTime - anchor <= pressMs){
        return {ok:true, action, name, via:'dp_heuristic', pattern: dpH.pattern};
      }
    }

    return {ok:false, action, name};
  }

  function addResult(hit){
    if (hit.ok) ok++; else ng++;
    okEl.textContent = ok; ngEl.textContent = ng;
    rateEl.textContent = (ok+ng? Math.round(ok/(ok+ng)*100):0) + '%';

    const stamp = Math.round(performance.now()%100000).toString().padStart(5,'0');
    const mv = hit.name || 'Move';

    // 寫入「判定紀錄」LOG（只記結果）
    if (judgeEl){
      const viaTxt = hit.via==='exact' ? '精確' : (hit.via==='dp_heuristic' ? '啟發式' : '');
      const seqTxt = Array.isArray(hit.seq) ? hit.seq.join(' → ')
                    : (hit.pattern==='622' ? '6 → 2 → 2'
                      : (hit.pattern==='266' ? '2 → 6 → 6' : ''));
      const line = ' '+stamp+'  '
        + (hit.ok? '✅ <span class="hit">'+mv+' OK</span>' : '❌ <span class="miss">Miss</span>')
        + (seqTxt? ' <span class="sub">['+seqTxt+']</span>':'')
        + (viaTxt? ' <span class="sub">'+viaTxt+'</span>':'');
      judgeEl.innerHTML += (judgeEl.innerHTML? '\n':'') + line;
      judgeEl.scrollTop = judgeEl.scrollHeight;
    }

    // 常駐顯示上一筆（直到下一次覆蓋）
    if (lastBox){
      const viaTxt = hit.via==='exact' ? '精確' : (hit.via==='dp_heuristic' ? '啟發式' : '');
      const seqTxt = Array.isArray(hit.seq) ? hit.seq.join(' → ')
                    : (hit.pattern==='622' ? '6 → 2 → 2'
                      : (hit.pattern==='266' ? '2 → 6 → 6' : ''));
      const statusHtml = hit.ok ? '✅ <span class="hit">成功</span>' : '❌ <span class="miss">失誤</span>';
      lastBox.innerHTML = '<div><span class="sub">'+stamp+'</span></div>'
        + '<div>'+mv+' '+statusHtml
        + (seqTxt? ' <span class="sub">['+seqTxt+']</span>':'')
        + (viaTxt? ' <span class="sub">'+viaTxt+'</span>':'')
        + '</div>';
    }
  }

  function onAction(){
    const t = performance.now();
    addResult(checkSequence(t));
  }

  // 鍵盤事件（J/K/L = 行為鍵）
  window.addEventListener('keydown', (e)=>{
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(e.key)){
      const before = currentDir();
      keys.add(e.key);
      const dir = currentDir();
      if (dir!==before) pushDir(dir);
    }
    if (['j','k','l','J','K','L'].includes(e.key)) onAction();
  });
  window.addEventListener('keyup', (e)=>{
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','w','s'].includes(e.key)){
      const before = currentDir();
      keys.delete(e.key);
      const dir = currentDir();
      if (dir!==before) pushDir(dir);
    }
  });

  // Reset：清空統計與兩個 log，但保留「上一筆判定」
  resetBtn.addEventListener('click',()=>{
    ok=0; ng=0; okEl.textContent='0'; ngEl.textContent='0'; rateEl.textContent='0%';
    if (judgeEl) judgeEl.textContent='';
    if (logEl) logEl.textContent='';
    buffer=[];
  });

  // ===== Gamepad 支援 =====
  window.addEventListener('gamepadconnected', (e)=>{ padStatus.textContent = `已連線：${e.gamepad.id}`; });
  window.addEventListener('gamepaddisconnected', ()=>{ padStatus.textContent = '未連線'; });

  function readPad(){
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && pads[0];
    if (!p) return {connected:false, dir:5, action:false, name:''};

    const b = p.buttons;
    let up = b[12]?.pressed || false;
    let down = b[13]?.pressed || false;
    let left = b[14]?.pressed || false;
    let right = b[15]?.pressed || false;

    // 左搖桿軸
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

    // 行為鍵：A/B/X/Y 任一的新按下
    const faceIdx = [0,1,2,3];
    let action = false;
    const nowPressed = new Set();
    faceIdx.forEach(i=>{ if (b[i]?.pressed){ nowPressed.add(i); if (!prevPadButtons.has(i)) action = true; }});
    prevPadButtons = nowPressed;

    return {connected:true, dir, action, name:p.id};
  }

  function padLoop(){
    if (usePad.checked){
      const s = readPad();
      padStatus.textContent = s.connected ? `已連線：${navigator.getGamepads()[0]?.id || 'Gamepad'}` : '未連線';
      if (s.connected){
        if (s.dir !== lastPadDir){ lastPadDir = s.dir; pushDir(s.dir); }
        if (s.action){ onAction(); }
      }
    }
    requestAnimationFrame(padLoop);
  }
  padLoop();

  // 初始中心點，確保 5（中立）會被納入事件序列
  pushDir(5);
})();
