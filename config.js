// config.js
export const DEFAULTS = { stepMs: 160, totalMs: 430, punchMs: 120, deadzone: 0.25 };
export const DOM = {
  // 模式與區塊
  mode:        document.querySelector('#mode'),
  freeBlock:   document.querySelector('#freeBlock'),
  reactionBlock: document.querySelector('#reactionBlock'),
  reactSection:  document.querySelector('#reactSection'),

  // 既有控制
  face:        document.querySelector('#face'),
  moveSel:     document.querySelector('#move'),
  hitboxMode:  document.querySelector('#hitboxMode'),
  socdNeutral: document.querySelector('#socdNeutral'),

  // 反應模式控制
  reactionStart: document.querySelector('#reactionStart'),
  questionCount: document.querySelector('#questionCount'),
  difficulty:    document.querySelector('#difficulty'),
  questionBox:   document.querySelector('#questionBox'),
  timerBar:      document.querySelector('#timerBar'),
  reactOk:       document.querySelector('#reactOk'),
  reactNg:       document.querySelector('#reactNg'),
  reactRemain:   document.querySelector('#reactRemain'),

  // 其他 UI
  resetBtn:    document.querySelector('#reset'),
  logEl:       document.querySelector('#log'),
  judgeEl:     document.querySelector('#judge'),
  lastBox:     document.querySelector('#lastBox'),
  okEl:        document.querySelector('#ok'),
  ngEl:        document.querySelector('#ng'),
  rateEl:      document.querySelector('#rate'),
  usePad:      document.querySelector('#usePad'),
  padStatus:   document.querySelector('#padStatus'),
  stickCells:  Array.from(document.querySelectorAll('.cell')),
};