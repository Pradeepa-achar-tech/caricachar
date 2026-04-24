// Sketch Grid — generate printable drawing-grid sheets at real-world scale.
// Output SVG uses mm coordinates so when printed at 100% the cells are physically
// the size the student picked. Optional reference image can sit under the grid for
// the classic "grid-copy" portrait method.

import * as modal from './modal.js';

const PAPERS = {
  A3: { w: 297, h: 420 },
  A4: { w: 210, h: 297 },
  A5: { w: 148, h: 210 },
};

const CELLS = [
  { label: '1 cm', mm: 10 },
  { label: '2 cm', mm: 20 },
  { label: '2.5 cm', mm: 25 },
  { label: '5 cm', mm: 50 },
];

// ---------------------------------------------------------------------------
// Teach mode — a virtual drawing teacher that walks the student through the
// outline one line at a time. Each step highlights the cells the line covers
// and paints the construction line on top of the grid (in mm units).
// Coordinates inside a step are fractions of the grid area (0..1).
// ---------------------------------------------------------------------------
const ACCENT_COLOR = '#ff7a59';
const GHOST_COLOR = '#9a7b58';

const TEACH_STEPS = [
  {
    title: 'Head silhouette',
    instruction: 'Draw a loose oval from the top of the hair down to the chin. It covers roughly the middle half of the grid width.',
    bounds: { x: 0.22, y: 0.10, w: 0.56, h: 0.65 },
    render: (a, box) => ellipseEl(box.cx, box.yAt(0.43), box.w * 0.25, box.h * 0.32, a, { dashed: true }),
  },
  {
    title: 'Vertical centerline',
    instruction: 'Light vertical line straight down through the middle of the head — keeps every feature symmetric.',
    bounds: { x: 0.48, y: 0.10, w: 0.04, h: 0.66 },
    render: (a, box) => lineEl(box.cx, box.yAt(0.10), box.cx, box.yAt(0.76), a, { dashed: true }),
  },
  {
    title: 'Eye line',
    instruction: 'Horizontal line across the head at half the head height. The eyes sit on this line.',
    bounds: { x: 0.22, y: 0.40, w: 0.56, h: 0.04 },
    render: (a, box) => lineEl(box.xAt(0.24), box.yAt(0.42), box.xAt(0.76), box.yAt(0.42), a, { dashed: true }),
  },
  {
    title: 'Nose base line',
    instruction: 'Horizontal line roughly two-thirds of the way from the top of the head down to the chin.',
    bounds: { x: 0.28, y: 0.54, w: 0.44, h: 0.04 },
    render: (a, box) => lineEl(box.xAt(0.30), box.yAt(0.56), box.xAt(0.70), box.yAt(0.56), a, { dashed: true }),
  },
  {
    title: 'Mouth line',
    instruction: 'Halfway between the nose base and the chin.',
    bounds: { x: 0.32, y: 0.62, w: 0.36, h: 0.04 },
    render: (a, box) => lineEl(box.xAt(0.34), box.yAt(0.64), box.xAt(0.66), box.yAt(0.64), a, { dashed: true }),
  },
  {
    title: 'Left eye almond',
    instruction: 'On the left side of the centerline, sitting on the eye line, draw an almond shape.',
    bounds: { x: 0.33, y: 0.38, w: 0.14, h: 0.08 },
    render: (a, box) => almondEl(box.xAt(0.40), box.yAt(0.42), box.w * 0.058, box.h * 0.02, a),
  },
  {
    title: 'Right eye almond',
    instruction: 'Mirror the left eye on the other side of the centerline — same height, same size.',
    bounds: { x: 0.53, y: 0.38, w: 0.14, h: 0.08 },
    render: (a, box) => almondEl(box.xAt(0.60), box.yAt(0.42), box.w * 0.058, box.h * 0.02, a),
  },
  {
    title: 'Nose wedge',
    instruction: 'Wedge from between the brows down to the nose base line, centered on the centerline.',
    bounds: { x: 0.44, y: 0.39, w: 0.12, h: 0.19 },
    render: (a, box) => pathEl(
      `M ${box.xAt(0.50)} ${box.yAt(0.40)} L ${box.xAt(0.46)} ${box.yAt(0.55)} Q ${box.xAt(0.50)} ${box.yAt(0.58)} ${box.xAt(0.54)} ${box.yAt(0.55)} Z`,
      a, { fill: a ? 'rgba(255,122,89,0.1)' : 'none' }),
  },
  {
    title: 'Mouth',
    instruction: 'Central seam first, then upper-lip cupid bow, lower-lip pillow — all on the mouth line.',
    bounds: { x: 0.38, y: 0.61, w: 0.24, h: 0.06 },
    render: (a, box) => pathEl(
      `M ${box.xAt(0.40)} ${box.yAt(0.64)} Q ${box.xAt(0.50)} ${box.yAt(0.67)} ${box.xAt(0.60)} ${box.yAt(0.64)}`,
      a, { strokeWidth: 1.0 }),
  },
  {
    title: 'Ears',
    instruction: 'On each side of the head, between the eye line (top of ear) and the nose base line (bottom of ear).',
    bounds: { x: 0.20, y: 0.42, w: 0.60, h: 0.18 },
    render: (a, box) => {
      return [
        pathEl(`M ${box.xAt(0.25)} ${box.yAt(0.44)} Q ${box.xAt(0.22)} ${box.yAt(0.52)} ${box.xAt(0.26)} ${box.yAt(0.58)}`, a),
        pathEl(`M ${box.xAt(0.75)} ${box.yAt(0.44)} Q ${box.xAt(0.78)} ${box.yAt(0.52)} ${box.xAt(0.74)} ${box.yAt(0.58)}`, a),
      ].join('');
    },
  },
  {
    title: 'Hair silhouette',
    instruction: 'Trace the outer hair shape above and around the head — follow the contour on your reference photo.',
    bounds: { x: 0.22, y: 0.05, w: 0.56, h: 0.20 },
    render: (a, box) => pathEl(
      `M ${box.xAt(0.26)} ${box.yAt(0.22)} Q ${box.xAt(0.40)} ${box.yAt(0.08)} ${box.xAt(0.50)} ${box.yAt(0.09)} Q ${box.xAt(0.64)} ${box.yAt(0.08)} ${box.xAt(0.74)} ${box.yAt(0.22)}`,
      a, { strokeWidth: 1.0 }),
  },
];

function strokeAttrs(a, w = 0.8) {
  return a
    ? `stroke="${ACCENT_COLOR}" stroke-width="${w}"`
    : `stroke="${GHOST_COLOR}" stroke-width="${w * 0.5}" opacity="0.45"`;
}
function lineEl(x1, y1, x2, y2, a, opts = {}) {
  const dash = opts.dashed ? `stroke-dasharray="${a ? '2.4 1.6' : '1.5 1.5'}"` : '';
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${strokeAttrs(a, opts.strokeWidth || 0.8)} ${dash} fill="none"/>`;
}
function ellipseEl(cx, cy, rx, ry, a, opts = {}) {
  const dash = opts.dashed ? `stroke-dasharray="${a ? '2.4 1.6' : '1.5 1.5'}"` : '';
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${strokeAttrs(a, 0.9)} ${dash} fill="none"/>`;
}
function almondEl(cx, cy, rx, ry, a) {
  return `<path d="M ${cx - rx} ${cy} Q ${cx} ${cy - ry} ${cx + rx} ${cy} Q ${cx} ${cy + ry} ${cx - rx} ${cy} Z" ${strokeAttrs(a, 0.8)} fill="${a ? 'rgba(255,122,89,0.15)' : 'none'}"/>`;
}
function pathEl(d, a, opts = {}) {
  return `<path d="${d}" ${strokeAttrs(a, opts.strokeWidth || 0.8)} fill="${opts.fill || 'none'}"/>`;
}

function boundsToCellRange(bounds, cols, rows) {
  const c0 = Math.max(1, Math.floor(bounds.x * cols) + 1);
  const c1 = Math.min(cols, Math.max(c0, Math.ceil((bounds.x + bounds.w) * cols)));
  const r0 = Math.max(1, Math.floor(bounds.y * rows) + 1);
  const r1 = Math.min(rows, Math.max(r0, Math.ceil((bounds.y + bounds.h) * rows)));
  return { c0, c1, r0, r1 };
}

export function renderGrid(root) {
  root.innerHTML = `
    <section class="panel">
      <h1>Sketch Grid</h1>
      <p style="color:var(--muted); margin-top:-4px;">
        Print a grid sheet at true scale, copy the same grid onto your drawing pad,
        then transfer what you see one cell at a time. Classic method — works for
        portraits, caricatures, and anything else you want to enlarge accurately.
      </p>
      <div class="grid-wrap">
        <aside class="grid-ctrl" id="g-ctrl"></aside>
        <div class="grid-stage" id="g-stage"></div>
      </div>
    </section>
  `;

  const ctrl = root.querySelector('#g-ctrl');
  const stage = root.querySelector('#g-stage');

  const state = {
    paper: 'A4',
    orientation: 'portrait',
    cell: 20,           // mm
    showNumX: true,
    showNumY: true,
    diagonals: 'off',   // off | main | cell
    lineShade: 'medium',
    refOriginalDataUrl: null,
    refDataUrl: null,
    refOpacity: 0.35,
    photoStyle: 'original', // original | grayscale | pencil
    pencilBoost: 1.0,       // contrast multiplier for pencil mode
    teachMode: false,
    teachStep: 0,
  };

  ctrl.innerHTML = `
    <h3>Paper</h3>
    <div class="btn-group" data-key="paper">
      <button class="btn gb" data-val="A3">A3</button>
      <button class="btn gb" data-val="A4">A4</button>
      <button class="btn gb" data-val="A5">A5</button>
    </div>
    <div class="paper-dim" id="paper-dim"></div>

    <h3>Orientation</h3>
    <div class="btn-group" data-key="orientation">
      <button class="btn gb" data-val="portrait">▯ Portrait</button>
      <button class="btn gb" data-val="landscape">▭ Landscape</button>
    </div>

    <h3>Grid cell</h3>
    <div class="btn-group" data-key="cell">
      ${CELLS.map(c => `<button class="btn gb" data-val="${c.mm}">${c.label}</button>`).join('')}
    </div>

    <h3>Axis numbers</h3>
    <div class="tool-row">
      <label class="chk"><input type="checkbox" id="numx" checked> X axis (columns)</label>
    </div>
    <div class="tool-row">
      <label class="chk"><input type="checkbox" id="numy" checked> Y axis (rows)</label>
    </div>

    <h3>Diagonals</h3>
    <div class="btn-group" data-key="diagonals">
      <button class="btn gb" data-val="off">Off</button>
      <button class="btn gb" data-val="main">Main</button>
      <button class="btn gb" data-val="cell">Per cell</button>
    </div>

    <h3>Line shade</h3>
    <div class="btn-group" data-key="lineShade">
      <button class="btn gb" data-val="light">Light</button>
      <button class="btn gb" data-val="medium">Medium</button>
      <button class="btn gb" data-val="dark">Dark</button>
    </div>

    <h3>Reference photo (optional)</h3>
    <div class="tool-row">
      <label class="btn" style="flex:1; cursor:pointer;">
        📷 Upload
        <input type="file" id="g-ref" accept="image/*" hidden>
      </label>
      <button class="btn" id="g-ref-clear" style="flex:1;" disabled>Remove</button>
    </div>
    <div class="slider-group">
      <label><span>Opacity</span><span class="val" id="g-op-val">35%</span></label>
      <input type="range" id="g-op" min="0.1" max="0.9" step="0.05" value="0.35">
    </div>

    <h3>Photo style <span style="font-size:10px; color:var(--muted); font-weight:400;">(for pencil artists)</span></h3>
    <div class="btn-group" data-key="photoStyle">
      <button class="btn gb" data-val="original">Color</button>
      <button class="btn gb" data-val="grayscale">Gray</button>
      <button class="btn gb" data-val="pencil">✎ Pencil</button>
    </div>
    <div class="slider-group" id="pencil-boost-row" style="display:none;">
      <label><span>Pencil darkness</span><span class="val" id="g-pb-val">1.0×</span></label>
      <input type="range" id="g-pb" min="0.6" max="2.0" step="0.05" value="1.0">
    </div>

    <h3 style="margin-top:14px;">Teach me — line by line</h3>
    <div class="tool-row">
      <button class="btn" id="teach-toggle" style="width:100%;">🎓 Enable teach mode</button>
    </div>
    <div id="teach-panel" style="display:none;">
      <div class="teach-card">
        <div class="teach-head">
          <span class="teach-counter" id="teach-counter"></span>
          <span class="teach-title" id="teach-title"></span>
        </div>
        <div class="teach-inst" id="teach-inst"></div>
        <div class="teach-cells" id="teach-cells"></div>
        <div class="tool-row" style="margin-top:10px;">
          <button class="btn" id="teach-prev" style="flex:1;">← Prev</button>
          <button class="btn primary" id="teach-next" style="flex:1;">Next →</button>
        </div>
      </div>
    </div>

    <h3 style="margin-top:14px;">Export</h3>
    <div class="tool-row">
      <button class="btn primary" id="g-print" style="flex:1;">🖨 Print</button>
    </div>
    <div class="tool-row">
      <button class="btn" id="g-png" style="flex:1;">⇩ PNG</button>
      <button class="btn" id="g-svg" style="flex:1;">⇩ SVG</button>
    </div>
    <div class="principle" style="margin-top:10px;">
      Tip: print at <strong>100% scale</strong> (uncheck "fit to page") so the cells come
      out exactly the size you chose on your sheet.
    </div>
  `;

  // button-group wiring
  ctrl.querySelectorAll('.btn-group').forEach(grp => {
    const key = grp.dataset.key;
    grp.querySelectorAll('[data-val]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const raw = btn.dataset.val;
        state[key] = isNaN(Number(raw)) ? raw : Number(raw);
        refreshActive();
        if (key === 'photoStyle') {
          ctrl.querySelector('#pencil-boost-row').style.display = state.photoStyle === 'pencil' ? '' : 'none';
          await applyPhotoStyle();
        }
        render();
      });
    });
  });

  function refreshActive() {
    ctrl.querySelectorAll('.btn-group').forEach(grp => {
      const key = grp.dataset.key;
      grp.querySelectorAll('[data-val]').forEach(btn => {
        const raw = btn.dataset.val;
        const v = isNaN(Number(raw)) ? raw : Number(raw);
        btn.classList.toggle('active', v === state[key]);
      });
    });
    const p = PAPERS[state.paper];
    const w = state.orientation === 'landscape' ? p.h : p.w;
    const h = state.orientation === 'landscape' ? p.w : p.h;
    ctrl.querySelector('#paper-dim').textContent = `${w} × ${h} mm`;
  }

  // checkboxes
  ctrl.querySelector('#numx').addEventListener('change', e => { state.showNumX = e.target.checked; render(); });
  ctrl.querySelector('#numy').addEventListener('change', e => { state.showNumY = e.target.checked; render(); });

  // reference photo
  const refInput = ctrl.querySelector('#g-ref');
  const refClear = ctrl.querySelector('#g-ref-clear');
  refInput.addEventListener('change', e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      state.refOriginalDataUrl = reader.result;
      refClear.disabled = false;
      await applyPhotoStyle();
      render();
    };
    reader.readAsDataURL(f);
    refInput.value = '';
  });
  refClear.addEventListener('click', () => {
    state.refDataUrl = null;
    state.refOriginalDataUrl = null;
    refClear.disabled = true;
    render();
  });
  const opInput = ctrl.querySelector('#g-op');
  const opVal = ctrl.querySelector('#g-op-val');
  opInput.addEventListener('input', () => {
    state.refOpacity = Number(opInput.value);
    opVal.textContent = Math.round(state.refOpacity * 100) + '%';
    render();
  });
  const pbInput = ctrl.querySelector('#g-pb');
  const pbVal = ctrl.querySelector('#g-pb-val');
  pbInput.addEventListener('input', async () => {
    state.pencilBoost = Number(pbInput.value);
    pbVal.textContent = state.pencilBoost.toFixed(1) + '×';
    if (state.photoStyle === 'pencil') {
      await applyPhotoStyle();
      render();
    }
  });

  async function applyPhotoStyle() {
    if (!state.refOriginalDataUrl) {
      state.refDataUrl = null;
      return;
    }
    state.refDataUrl = await processPhoto(state.refOriginalDataUrl, state.photoStyle, state.pencilBoost);
  }

  // teach mode
  const teachToggle = ctrl.querySelector('#teach-toggle');
  const teachPanel = ctrl.querySelector('#teach-panel');
  const teachPrev = ctrl.querySelector('#teach-prev');
  const teachNext = ctrl.querySelector('#teach-next');
  teachToggle.addEventListener('click', () => {
    state.teachMode = !state.teachMode;
    state.teachStep = 0;
    teachToggle.textContent = state.teachMode ? '✕ Disable teach mode' : '🎓 Enable teach mode';
    teachToggle.style.borderColor = state.teachMode ? 'var(--accent)' : '';
    teachToggle.style.color = state.teachMode ? 'var(--accent)' : '';
    teachPanel.style.display = state.teachMode ? 'block' : 'none';
    refreshTeachUI();
    render();
  });
  teachPrev.addEventListener('click', () => {
    if (state.teachStep > 0) { state.teachStep -= 1; refreshTeachUI(); render(); }
  });
  teachNext.addEventListener('click', () => {
    if (state.teachStep < TEACH_STEPS.length - 1) { state.teachStep += 1; refreshTeachUI(); render(); }
  });

  function refreshTeachUI() {
    if (!state.teachMode) return;
    const step = TEACH_STEPS[state.teachStep];
    ctrl.querySelector('#teach-counter').textContent = `Line ${state.teachStep + 1} of ${TEACH_STEPS.length}`;
    ctrl.querySelector('#teach-title').textContent = step.title;
    ctrl.querySelector('#teach-inst').textContent = step.instruction;
    const { w, h } = paperDimsFor(state);
    const margin = 12;
    const cell = state.cell;
    const gw = Math.floor((w - margin * 2) / cell) * cell;
    const gh = Math.floor((h - margin * 2) / cell) * cell;
    const cols = gw / cell;
    const rows = gh / cell;
    const r = boundsToCellRange(step.bounds, cols, rows);
    ctrl.querySelector('#teach-cells').innerHTML =
      `📍 On your paper: work inside <strong>cols ${r.c0}-${r.c1}</strong>, <strong>rows ${r.r0}-${r.r1}</strong>.`;
    teachPrev.disabled = state.teachStep === 0;
    teachNext.disabled = state.teachStep === TEACH_STEPS.length - 1;
    teachPrev.style.opacity = teachPrev.disabled ? 0.4 : 1;
    teachNext.style.opacity = teachNext.disabled ? 0.4 : 1;
  }

  // exports
  ctrl.querySelector('#g-print').addEventListener('click', onPrint);
  ctrl.querySelector('#g-png').addEventListener('click', onDownloadPng);
  ctrl.querySelector('#g-svg').addEventListener('click', onDownloadSvg);

  refreshActive();
  render();

  function render() {
    if (state.teachMode) refreshTeachUI();
    stage.innerHTML = `<div class="grid-paper">${buildSvg(state, { withTeach: true })}</div>`;
  }

  function onPrint() {
    const svg = buildSvg(state);
    const printWin = window.open('', '_blank', 'width=900,height=1100');
    if (!printWin) {
      modal.alert('Your browser blocked the print window. Allow pop-ups for this site and try again.', { title: 'Pop-up blocked', kind: 'danger' });
      return;
    }
    printWin.document.write(`<!DOCTYPE html><html><head><title>CaricatureLab — grid sheet</title>
      <style>
        @page { size: ${paperDimsFor(state).w}mm ${paperDimsFor(state).h}mm; margin: 0; }
        html, body { margin: 0; padding: 0; background: #fff; }
        svg { display: block; }
        @media print { @page { margin: 0; } }
      </style></head><body>${svg}
      <script>setTimeout(function(){window.print();}, 250);<\/script>
      </body></html>`);
    printWin.document.close();
  }

  async function onDownloadPng() {
    const svg = buildSvg(state);
    const dims = paperDimsFor(state);
    // 150 DPI gives ~A4: 1240×1754 — good balance between sharpness and size
    const dpi = 150;
    const wPx = Math.round(dims.w / 25.4 * dpi);
    const hPx = Math.round(dims.h / 25.4 * dpi);
    const url = await svgToPng(svg, wPx, hPx);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grid_${state.paper}_${state.orientation}_${state.cell / 10}cm.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function onDownloadSvg() {
    const svg = buildSvg(state);
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grid_${state.paper}_${state.orientation}_${state.cell / 10}cm.svg`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  return function dispose() {
    state.refDataUrl = null;
  };
}

function paperDimsFor(state) {
  const p = PAPERS[state.paper];
  return {
    w: state.orientation === 'landscape' ? p.h : p.w,
    h: state.orientation === 'landscape' ? p.w : p.h,
  };
}

function buildSvg(state, opts = {}) {
  const { w, h } = paperDimsFor(state);
  const cell = state.cell;
  const margin = 12; // mm — leaves room for axis numbers
  const gw = Math.floor((w - margin * 2) / cell) * cell;
  const gh = Math.floor((h - margin * 2) / cell) * cell;
  const gx = (w - gw) / 2;
  const gy = (h - gh) / 2;
  const cols = gw / cell;
  const rows = gh / cell;

  const shade = state.lineShade;
  const mainColor = shade === 'light' ? '#c9c9c9' : shade === 'dark' ? '#333' : '#888';
  const minorW = 0.18;
  const mainW = 0.28;

  const parts = [];
  parts.push(`<rect x="0" y="0" width="${w}" height="${h}" fill="#fff"/>`);

  // reference image inside grid area
  if (state.refDataUrl) {
    parts.push(`<image href="${state.refDataUrl}" x="${gx}" y="${gy}" width="${gw}" height="${gh}" preserveAspectRatio="xMidYMid meet" opacity="${state.refOpacity}"/>`);
  }

  // diagonals (under the grid so the grid sits on top)
  if (state.diagonals === 'cell') {
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x0 = gx + i * cell;
        const y0 = gy + j * cell;
        // X pattern — both diagonals per cell, center intersects at cell midpoint
        parts.push(`<line x1="${x0}" y1="${y0}" x2="${x0 + cell}" y2="${y0 + cell}" stroke="${mainColor}" stroke-width="${minorW * 0.7}" opacity="0.55"/>`);
        parts.push(`<line x1="${x0 + cell}" y1="${y0}" x2="${x0}" y2="${y0 + cell}" stroke="${mainColor}" stroke-width="${minorW * 0.7}" opacity="0.55"/>`);
      }
    }
  } else if (state.diagonals === 'main') {
    parts.push(`<line x1="${gx}" y1="${gy}" x2="${gx + gw}" y2="${gy + gh}" stroke="${mainColor}" stroke-width="${mainW}" stroke-dasharray="2 1.5"/>`);
    parts.push(`<line x1="${gx + gw}" y1="${gy}" x2="${gx}" y2="${gy + gh}" stroke="${mainColor}" stroke-width="${mainW}" stroke-dasharray="2 1.5"/>`);
  }

  // grid lines
  const gridLines = [];
  for (let i = 0; i <= cols; i++) {
    const x = gx + i * cell;
    const sw = (i === 0 || i === cols) ? mainW : minorW;
    gridLines.push(`<line x1="${x}" y1="${gy}" x2="${x}" y2="${gy + gh}" stroke="${mainColor}" stroke-width="${sw}"/>`);
  }
  for (let j = 0; j <= rows; j++) {
    const y = gy + j * cell;
    const sw = (j === 0 || j === rows) ? mainW : minorW;
    gridLines.push(`<line x1="${gx}" y1="${y}" x2="${gx + gw}" y2="${y}" stroke="${mainColor}" stroke-width="${sw}"/>`);
  }
  parts.push(gridLines.join(''));

  // tick labels
  const labelColor = '#555';
  const fs = 3; // mm-ish text size
  if (state.showNumX) {
    for (let i = 0; i < cols; i++) {
      const tx = gx + i * cell + cell / 2;
      parts.push(`<text x="${tx}" y="${gy - 2}" text-anchor="middle" font-size="${fs}" font-family="system-ui, sans-serif" fill="${labelColor}">${i + 1}</text>`);
    }
    // column numbers on bottom too
    for (let i = 0; i < cols; i++) {
      const tx = gx + i * cell + cell / 2;
      parts.push(`<text x="${tx}" y="${gy + gh + fs + 1}" text-anchor="middle" font-size="${fs}" font-family="system-ui, sans-serif" fill="${labelColor}">${i + 1}</text>`);
    }
  }
  if (state.showNumY) {
    for (let j = 0; j < rows; j++) {
      const ty = gy + j * cell + cell / 2 + fs * 0.35;
      parts.push(`<text x="${gx - 2}" y="${ty}" text-anchor="end" font-size="${fs}" font-family="system-ui, sans-serif" fill="${labelColor}">${j + 1}</text>`);
      parts.push(`<text x="${gx + gw + 2}" y="${ty}" text-anchor="start" font-size="${fs}" font-family="system-ui, sans-serif" fill="${labelColor}">${j + 1}</text>`);
    }
  }

  // teach overlay (screen-only — never in export)
  if (opts.withTeach && state.teachMode) {
    const step = TEACH_STEPS[state.teachStep];
    if (step) {
      const box = {
        x: gx, y: gy, w: gw, h: gh,
        cx: gx + gw / 2,
        cy: gy + gh / 2,
        xAt: (f) => gx + f * gw,
        yAt: (f) => gy + f * gh,
      };

      // Cell highlights on the CURRENT step's bounding cells
      const range = boundsToCellRange(step.bounds, cols, rows);
      for (let j = range.r0 - 1; j < range.r1; j++) {
        for (let i = range.c0 - 1; i < range.c1; i++) {
          parts.push(`<rect x="${gx + i * cell}" y="${gy + j * cell}" width="${cell}" height="${cell}" fill="rgba(255,122,89,0.10)" stroke="none"/>`);
        }
      }

      // All prior construction lines in ghost gray
      for (let k = 0; k < state.teachStep; k++) {
        parts.push(TEACH_STEPS[k].render(false, box));
      }
      // Current line in accent
      parts.push(step.render(true, box));
    }
  }

  // footer legend
  parts.push(`<text x="${w / 2}" y="${h - 3}" text-anchor="middle" font-size="2.6" font-family="system-ui, sans-serif" fill="#888">${cell / 10} cm grid · ${state.paper} ${state.orientation} · ${cols} × ${rows} cells · CaricatureLab</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${parts.join('')}</svg>`;
}

// --- Pencil sketch filter ---
// Classic recipe used in Photoshop tutorials:
//   base  = grayscale(photo)
//   mask  = blur(invert(grayscale(photo)))
//   result = base / (1 - mask)   via canvas 'color-dodge' composite
// Dark regions of the photo become pencil-like strokes; bright regions stay paper-white.
function processPhoto(originalDataUrl, style, pencilBoost = 1.0) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // downscale big uploads for snappy processing
      const MAX = 1400;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));

      if (style === 'original') {
        resolve(originalDataUrl);
        return;
      }

      const out = document.createElement('canvas');
      out.width = w; out.height = h;
      const ctx = out.getContext('2d');

      if (style === 'grayscale') {
        ctx.filter = 'grayscale(1) contrast(1.15)';
        ctx.drawImage(img, 0, 0, w, h);
        resolve(out.toDataURL('image/png'));
        return;
      }

      if (style === 'pencil') {
        // Step 1: grayscale base
        ctx.filter = 'grayscale(1)';
        ctx.drawImage(img, 0, 0, w, h);

        // Step 2: inverted + blurred mask on a scratch canvas
        const mask = document.createElement('canvas');
        mask.width = w; mask.height = h;
        const mctx = mask.getContext('2d');
        const blurPx = Math.max(4, Math.round(Math.min(w, h) / 80));
        mctx.filter = `grayscale(1) invert(1) blur(${blurPx}px)`;
        mctx.drawImage(img, 0, 0, w, h);

        // Step 3: color-dodge blend (base / (1 - mask))
        ctx.filter = 'none';
        ctx.globalCompositeOperation = 'color-dodge';
        ctx.drawImage(mask, 0, 0);
        ctx.globalCompositeOperation = 'source-over';

        // Optional darkness boost — multiplies contrast to make strokes darker
        if (pencilBoost && pencilBoost !== 1.0) {
          const boosted = document.createElement('canvas');
          boosted.width = w; boosted.height = h;
          const bctx = boosted.getContext('2d');
          const c = 0.85 + pencilBoost * 0.8;
          const br = 1.15 - pencilBoost * 0.1;
          bctx.filter = `contrast(${c}) brightness(${br})`;
          bctx.drawImage(out, 0, 0);
          resolve(boosted.toDataURL('image/png'));
          return;
        }

        resolve(out.toDataURL('image/png'));
        return;
      }

      resolve(originalDataUrl);
    };
    img.onerror = () => resolve(originalDataUrl);
    img.src = originalDataUrl;
  });
}

async function svgToPng(svgString, wPx, hPx) {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = wPx;
    canvas.height = hPx;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, wPx, hPx);
    ctx.drawImage(img, 0, 0, wPx, hPx);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}
