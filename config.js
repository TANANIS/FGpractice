// config.js
export const DEFAULTS = { stepMs: 160, totalMs: 430, punchMs: 120, deadzone: 0.25 };
export const DOM = {
  face:        document.querySelector('#face'),
  moveSel:     document.querySelector('#move'),
  resetBtn:    document.querySelector('#reset'),
  logEl:       document.querySelector('#log'),
  judgeEl:     document.querySelector('#judge'),
  lastBox:     document.querySelector('#lastBox'),
  okEl:        document.querySelector('#ok'),
  ngEl:        document.querySelector('#ng'),
  rateEl:      document.querySelector('#rate'),
  usePad:      document.querySelector('#usePad'),
  padStatus:   document.querySelector('#padStatus'),
  hitboxMode:  document.querySelector('#hitboxMode'),
  socdNeutral: document.querySelector('#socdNeutral'),
  stickCells:  Array.from(document.querySelectorAll('.cell')),
};
