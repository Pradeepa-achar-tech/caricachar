// Parametric caricature face + photo-warp. Two modes: sliders that drive an
// idealised SVG face (teaching mode), and mesh-warp on an uploaded photograph
// (real caricature mode — works as a reference for drawing on paper).

import { mountPhotoWarp } from './photo-warp.js';

const DEFAULTS = {
  headW: 1,       // 0.5 .. 1.6  (width scale)
  headH: 1,       // 0.5 .. 1.6
  forehead: 0,    // -0.5 .. 0.8 (vertical push of forehead bulge)
  eyeSize: 1,     // 0.4 .. 2.2
  eyeGap: 1,      // 0.5 .. 1.8
  noseLen: 1,     // 0.4 .. 2.5
  noseBulb: 1,    // 0.5 .. 2.5
  mouthW: 1,      // 0.5 .. 2.2
  chinLen: 1,     // 0.4 .. 1.8
  chinPoint: 0,   // -0.3 .. 0.8 (sharpness)
  earSize: 1,     // 0.3 .. 2.2
  browHeight: 0,  // -0.4 .. 0.4
};

const SLIDERS = [
  { key: 'headW',      label: 'Head width',       min: 0.5, max: 1.6, step: 0.01 },
  { key: 'headH',      label: 'Head height',      min: 0.5, max: 1.6, step: 0.01 },
  { key: 'forehead',   label: 'Forehead bulge',   min: -0.5, max: 0.8, step: 0.01 },
  { key: 'eyeSize',    label: 'Eye size',         min: 0.4, max: 2.2, step: 0.01 },
  { key: 'eyeGap',     label: 'Eye spacing',      min: 0.5, max: 1.8, step: 0.01 },
  { key: 'browHeight', label: 'Brow height',      min: -0.4, max: 0.4, step: 0.01 },
  { key: 'noseLen',    label: 'Nose length',      min: 0.4, max: 2.5, step: 0.01 },
  { key: 'noseBulb',   label: 'Nose bulb',        min: 0.5, max: 2.5, step: 0.01 },
  { key: 'mouthW',     label: 'Mouth width',      min: 0.5, max: 2.2, step: 0.01 },
  { key: 'chinLen',    label: 'Chin length',      min: 0.4, max: 1.8, step: 0.01 },
  { key: 'chinPoint',  label: 'Chin sharpness',   min: -0.3, max: 0.8, step: 0.01 },
  { key: 'earSize',    label: 'Ear size',         min: 0.3, max: 2.2, step: 0.01 },
];

const PRESETS = {
  'Portrait (neutral)': {},
  'Long face':    { headH: 1.4, chinLen: 1.4, noseLen: 1.2 },
  'Wide grin':    { mouthW: 2.0, headW: 1.2 },
  'Big nose':     { noseLen: 1.9, noseBulb: 2.0 },
  'Bulging eyes': { eyeSize: 1.9, eyeGap: 1.2 },
  'Grumpy':       { browHeight: -0.35, mouthW: 0.7, chinLen: 1.2, noseBulb: 1.5 },
  'Gremlin':      { headW: 1.3, eyeSize: 1.6, noseLen: 1.6, noseBulb: 1.8, mouthW: 1.6, earSize: 1.9, chinPoint: 0.6 },
  'Baby-face':    { headW: 1.3, headH: 0.9, forehead: 0.6, eyeSize: 1.6, eyeGap: 1.2, noseLen: 0.6, noseBulb: 1.2, chinLen: 0.6, mouthW: 0.9 },
};

const PRINCIPLES = [
  'Push one feature big, pull its neighbor small. Contrast carries the caricature.',
  'The head shape is the first thing a viewer reads — choose it before you touch features.',
  'Spacing between features (eye-gap, nose-to-mouth) is as expressive as the features themselves.',
  'A sharp chin + round forehead reads completely different from a round chin + flat forehead.',
  'Bigger ears usually read friendlier. Smaller ears read cold or severe.',
  'A tiny pupil in a huge eye reads intense. A large pupil in a small eye reads sweet.',
];

export function renderExaggerate(root) {
  root.innerHTML = `
    <section class="panel">
      <h1>Exaggerate</h1>
      <p style="color:var(--muted); margin-top:-4px;">
        Two ways to feel exaggeration: push sliders on an idealised face, or upload
        a photo and warp it directly — then draw the result on paper.
      </p>
      <div class="mode-tabs" id="mode-tabs">
        <button class="btn mode-tab" data-mode="parametric">Parametric face</button>
        <button class="btn mode-tab" data-mode="photo">Your photo</button>
      </div>
      <div class="exag-wrap">
        <div class="exag-stage" id="stage"></div>
        <aside class="exag-ctrl" id="ctrl"></aside>
      </div>
    </section>
  `;

  const stage = root.querySelector('#stage');
  const ctrl = root.querySelector('#ctrl');
  const tabs = root.querySelectorAll('.mode-tab');
  let currentDispose = null;

  function switchMode(mode) {
    if (typeof currentDispose === 'function') {
      try { currentDispose(); } catch (_) { /* noop */ }
    }
    tabs.forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
    if (mode === 'photo') {
      currentDispose = mountPhotoWarp(stage, ctrl);
    } else {
      currentDispose = mountParametric(stage, ctrl);
    }
  }

  tabs.forEach(t => t.addEventListener('click', () => switchMode(t.dataset.mode)));
  switchMode('parametric');

  return function dispose() {
    if (typeof currentDispose === 'function') currentDispose();
  };
}

function mountParametric(stage, ctrl) {
  const state = { ...DEFAULTS };

  ctrl.innerHTML = `
    <h3>Presets</h3>
    <div class="preset-row" id="preset-row"></div>
    <button class="btn" id="reset" style="width:100%; margin-bottom:10px;">↺ Reset</button>
    <button class="btn primary" id="randomize" style="width:100%; margin-bottom:12px;">🎲 Random caricature</button>
    <h3>Features</h3>
    <div id="slider-host"></div>
    <div class="principle" id="tip"></div>
  `;

  const sliderHost = ctrl.querySelector('#slider-host');
  const presetRow = ctrl.querySelector('#preset-row');
  const tip = ctrl.querySelector('#tip');

  // sliders
  const sliderMap = {};
  SLIDERS.forEach(s => {
    const wrap = document.createElement('div');
    wrap.className = 'slider-group';
    wrap.innerHTML = `
      <label><span>${s.label}</span><span class="val"></span></label>
      <input type="range" min="${s.min}" max="${s.max}" step="${s.step}" value="${state[s.key]}">
    `;
    sliderHost.appendChild(wrap);
    const input = wrap.querySelector('input');
    const valEl = wrap.querySelector('.val');
    valEl.textContent = fmt(state[s.key]);
    input.addEventListener('input', () => {
      state[s.key] = Number(input.value);
      valEl.textContent = fmt(state[s.key]);
      redraw();
    });
    sliderMap[s.key] = { input, valEl };
  });

  Object.keys(PRESETS).forEach(name => {
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = name;
    b.addEventListener('click', () => applyPreset(PRESETS[name]));
    presetRow.appendChild(b);
  });

  ctrl.querySelector('#reset').addEventListener('click', () => applyPreset({}));
  ctrl.querySelector('#randomize').addEventListener('click', () => {
    const next = {};
    SLIDERS.forEach(s => {
      // random within the outer 60% of range for more character
      const range = s.max - s.min;
      next[s.key] = s.min + Math.random() * range;
    });
    applyPreset(next);
    tip.textContent = pickRandom(PRINCIPLES);
  });

  tip.textContent = pickRandom(PRINCIPLES);

  function applyPreset(partial) {
    Object.keys(DEFAULTS).forEach(k => {
      state[k] = (k in partial) ? partial[k] : DEFAULTS[k];
      const m = sliderMap[k];
      if (m) { m.input.value = state[k]; m.valEl.textContent = fmt(state[k]); }
    });
    redraw();
  }

  function redraw() { stage.innerHTML = faceSvg(state); }

  redraw();

  return () => { /* nothing to dispose */ };
}

function fmt(v) {
  return (Math.round(v * 100) / 100).toFixed(2);
}
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ---------- svg builder ----------
function faceSvg(s) {
  const cx = 200;
  const cy = 250;
  const baseHeadW = 130;
  const baseHeadH = 170;
  const rx = baseHeadW * s.headW;
  const ry = baseHeadH * s.headH;

  // forehead bulge adjusts top curve; chin adjusts bottom
  const topY = cy - ry;
  const foreheadBulge = s.forehead * 30;
  const chinY = cy + ry + s.chinLen * 30 - 30;
  const chinPoint = s.chinPoint; // how pointy

  const headPath = `
    M ${cx} ${topY - foreheadBulge}
    C ${cx + rx} ${topY - foreheadBulge * 0.4}, ${cx + rx} ${cy + ry * 0.3}, ${cx + rx * (1 - chinPoint * 0.5)} ${cy + ry * 0.7}
    C ${cx + rx * (0.5 - chinPoint * 0.5)} ${chinY}, ${cx - rx * (0.5 - chinPoint * 0.5)} ${chinY}, ${cx - rx * (1 - chinPoint * 0.5)} ${cy + ry * 0.7}
    C ${cx - rx} ${cy + ry * 0.3}, ${cx - rx} ${topY - foreheadBulge * 0.4}, ${cx} ${topY - foreheadBulge}
    Z
  `;

  // eyes
  const eyeY = cy - ry * 0.05;
  const eyeGap = rx * 0.35 * s.eyeGap;
  const eyeR = 14 * s.eyeSize;
  const eyeL = { cx: cx - eyeGap, cy: eyeY };
  const eyeR2 = { cx: cx + eyeGap, cy: eyeY };
  const pupilR = Math.max(3, eyeR * 0.4);

  // brows
  const browY = eyeY - eyeR - 14 + (-s.browHeight * 20);

  // nose
  const noseTop = eyeY + eyeR + 4;
  const noseBottom = noseTop + 60 * s.noseLen;
  const bulbR = 12 * s.noseBulb;

  // mouth
  const mouthY = noseBottom + 30;
  const mouthW = 60 * s.mouthW;

  // ears
  const earRY = 30 * s.earSize;
  const earRX = 14 * s.earSize;
  const earY = eyeY + 10;

  return `
  <svg viewBox="0 0 400 560" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="skin" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#ffe6cc"/>
        <stop offset="100%" stop-color="#c98b66"/>
      </radialGradient>
    </defs>
    <!-- ears -->
    <ellipse cx="${cx - rx + 6}" cy="${earY}" rx="${earRX}" ry="${earRY}" fill="url(#skin)" stroke="#2b1b12" stroke-width="2.5"/>
    <ellipse cx="${cx + rx - 6}" cy="${earY}" rx="${earRX}" ry="${earRY}" fill="url(#skin)" stroke="#2b1b12" stroke-width="2.5"/>
    <!-- head -->
    <path d="${headPath}" fill="url(#skin)" stroke="#2b1b12" stroke-width="3"/>
    <!-- brows -->
    <path d="M ${eyeL.cx - eyeR * 1.1} ${browY + 6} Q ${eyeL.cx} ${browY - 6} ${eyeL.cx + eyeR * 1.1} ${browY + 6}"
          stroke="#2b1b12" stroke-width="${Math.max(3, eyeR * 0.35)}" fill="none" stroke-linecap="round"/>
    <path d="M ${eyeR2.cx - eyeR * 1.1} ${browY + 6} Q ${eyeR2.cx} ${browY - 6} ${eyeR2.cx + eyeR * 1.1} ${browY + 6}"
          stroke="#2b1b12" stroke-width="${Math.max(3, eyeR * 0.35)}" fill="none" stroke-linecap="round"/>
    <!-- eyes -->
    <ellipse cx="${eyeL.cx}" cy="${eyeL.cy}" rx="${eyeR}" ry="${eyeR * 0.85}" fill="#fff" stroke="#2b1b12" stroke-width="2.5"/>
    <ellipse cx="${eyeR2.cx}" cy="${eyeR2.cy}" rx="${eyeR}" ry="${eyeR * 0.85}" fill="#fff" stroke="#2b1b12" stroke-width="2.5"/>
    <circle cx="${eyeL.cx + pupilR * 0.2}" cy="${eyeL.cy}" r="${pupilR}" fill="#2b1b12"/>
    <circle cx="${eyeR2.cx + pupilR * 0.2}" cy="${eyeR2.cy}" r="${pupilR}" fill="#2b1b12"/>
    <!-- nose -->
    <path d="M ${cx - 6} ${noseTop}
             Q ${cx - 16 * s.noseBulb} ${(noseTop + noseBottom) / 2}
               ${cx - 10 * s.noseBulb} ${noseBottom}
             Q ${cx} ${noseBottom + 10}
               ${cx + 10 * s.noseBulb} ${noseBottom}
             Q ${cx + 16 * s.noseBulb} ${(noseTop + noseBottom) / 2}
               ${cx + 6} ${noseTop} Z"
          fill="#e2a88a" stroke="#2b1b12" stroke-width="2.5"/>
    <ellipse cx="${cx}" cy="${noseBottom - 2}" rx="${bulbR}" ry="${bulbR * 0.7}" fill="#d99477" stroke="#2b1b12" stroke-width="2"/>
    <!-- mouth -->
    <path d="M ${cx - mouthW} ${mouthY} Q ${cx} ${mouthY + 22} ${cx + mouthW} ${mouthY}"
          stroke="#2b1b12" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M ${cx - mouthW * 0.9} ${mouthY + 2}
             Q ${cx - mouthW * 0.45} ${mouthY - 10} ${cx} ${mouthY}
             Q ${cx + mouthW * 0.45} ${mouthY - 10} ${cx + mouthW * 0.9} ${mouthY + 2}"
          stroke="#2b1b12" stroke-width="2" fill="none"/>
  </svg>
  `;
}
