// Photo warp — mesh-based forward-triangle warp so the student can exaggerate a
// real photograph and then draw it on paper. No ML, no backend; the image
// never leaves the browser.

import { saveWork } from './gallery.js';
import * as modal from './modal.js';

const GRID_COLS = 9;
const GRID_ROWS = 11;
const MAX_DIM = 600;

const TIPS = [
  'Push one feature, pull a neighbor. Resist enlarging everything.',
  'Look for what is already extra in the subject — caricature amplifies what is there.',
  'Small drags in the eye region move a lot. Light touches there.',
  'The jawline is the second-highest-impact feature after the nose.',
  'Flip the comparison thumbnail on/off as you work — tiny mismatches reveal character.',
];

export function mountPhotoWarp(stageEl, ctrlEl) {
  stageEl.innerHTML = `
    <div class="photo-warp-empty" id="pw-empty">
      <div style="text-align:center;">
        <label class="btn primary" style="cursor:pointer; font-size:15px; padding:12px 22px;">
          📷 Upload a photo
          <input type="file" id="pw-file" accept="image/*" hidden>
        </label>
        <p style="color:#664a33; font-size:13px; margin-top:14px; max-width:360px;">
          Your photo stays in your browser — nothing is uploaded anywhere.
          Once loaded, drag the red handles to warp the mesh: push a handle outward to
          enlarge that region, inward to shrink it.
        </p>
      </div>
    </div>
    <div class="photo-warp-stage" id="pw-stage" style="display:none;">
      <canvas id="pw-canvas"></canvas>
      <div class="photo-thumb" id="pw-thumb" title="Original — drag reference"></div>
    </div>
  `;

  ctrlEl.innerHTML = `
    <h3>How to warp</h3>
    <div class="tip">
      Drag any red dot on the image to bend the mesh there. Build up the caricature by
      making small moves, then stand back and evaluate.
    </div>

    <h3>View</h3>
    <div class="tool-row">
      <button class="btn pw-toggle" data-flag="handles" style="width:100%;">◉ Hide handles</button>
    </div>
    <div class="tool-row">
      <button class="btn pw-toggle" data-flag="sketch" style="width:100%;">✎ Sketch mode</button>
    </div>
    <div class="tool-row">
      <button class="btn pw-toggle" data-flag="grid" style="width:100%;">⊞ Proportion grid</button>
    </div>

    <h3>Actions</h3>
    <div class="tool-row">
      <button class="btn" id="pw-new" style="width:100%;">📷 New photo</button>
    </div>
    <div class="tool-row">
      <button class="btn" id="pw-reset" style="flex:1;">↺ Reset</button>
      <button class="btn" id="pw-undo"  style="flex:1;">↶ Undo</button>
    </div>

    <h3>Export</h3>
    <div class="tool-row">
      <button class="btn primary" id="pw-print" style="flex:1;">🖨 Print</button>
      <button class="btn primary" id="pw-download" style="flex:1;">⇩ PNG</button>
    </div>
    <div class="tool-row">
      <button class="btn" id="pw-save" style="flex:1;">💾 Gallery</button>
      <button class="btn" id="pw-ref"  style="flex:1;">↗ Studio</button>
    </div>

    <div class="principle" id="pw-tip">${pickTip()}</div>
  `;

  const fileInput = stageEl.querySelector('#pw-file');
  const emptyDiv = stageEl.querySelector('#pw-empty');
  const stageWrap = stageEl.querySelector('#pw-stage');
  const canvas = stageEl.querySelector('#pw-canvas');
  const thumb = stageEl.querySelector('#pw-thumb');
  const ctx = canvas.getContext('2d');

  // state
  let img = null;
  let src = [];
  let dst = [];
  let undoStack = [];
  let dragging = null;
  let imgW = 0, imgH = 0;
  const flags = { handles: true, sketch: false, grid: false };

  fileInput.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) loadFile(f);
    fileInput.value = '';
  });

  ctrlEl.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.flag;
      flags[key] = !flags[key];
      updateToggleLabel(btn, key);
      render();
    });
    updateToggleLabel(btn, btn.dataset.flag);
  });

  ctrlEl.querySelector('#pw-new').addEventListener('click', () => fileInput.click());
  ctrlEl.querySelector('#pw-reset').addEventListener('click', resetWarp);
  ctrlEl.querySelector('#pw-undo').addEventListener('click', undo);
  ctrlEl.querySelector('#pw-save').addEventListener('click', saveToGallery);
  ctrlEl.querySelector('#pw-ref').addEventListener('click', sendToStudio);
  ctrlEl.querySelector('#pw-print').addEventListener('click', printForDrawing);
  ctrlEl.querySelector('#pw-download').addEventListener('click', downloadImage);

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  function updateToggleLabel(btn, key) {
    const on = flags[key];
    btn.style.borderColor = on ? 'var(--accent)' : '';
    btn.style.color = on ? 'var(--accent)' : '';
    const labels = {
      handles: on ? '◉ Hide handles' : '◉ Show handles',
      sketch:  on ? '✎ Sketch: on'   : '✎ Sketch mode',
      grid:    on ? '⊞ Grid: on'     : '⊞ Proportion grid',
    };
    btn.textContent = labels[key] || btn.textContent;
  }

  function loadFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const tmp = new Image();
      tmp.onload = () => { img = tmp; setupImage(); };
      tmp.onerror = () => flash('Could not read that image.', true);
      tmp.src = reader.result;
    };
    reader.onerror = () => flash('Could not read that file.', true);
    reader.readAsDataURL(file);
  }

  function setupImage() {
    const scale = Math.min(MAX_DIM / img.width, MAX_DIM / img.height, 1);
    imgW = Math.round(img.width * scale);
    imgH = Math.round(img.height * scale);
    canvas.width = imgW;
    canvas.height = imgH;
    canvas.style.maxWidth = '100%';
    canvas.style.cursor = 'grab';
    emptyDiv.style.display = 'none';
    stageWrap.style.display = 'flex';

    // build the grid
    src = [];
    dst = [];
    for (let j = 0; j < GRID_ROWS; j++) {
      for (let i = 0; i < GRID_COLS; i++) {
        const x = (i / (GRID_COLS - 1)) * imgW;
        const y = (j / (GRID_ROWS - 1)) * imgH;
        src.push({ x, y });
        dst.push({ x, y });
      }
    }
    undoStack = [];

    // draw an unwarped thumbnail of the original in the corner
    const tw = 110;
    const th = Math.round(tw * (imgH / imgW));
    thumb.innerHTML = `<canvas width="${tw}" height="${th}"></canvas><div class="thumb-label">original</div>`;
    const tCtx = thumb.querySelector('canvas').getContext('2d');
    tCtx.drawImage(img, 0, 0, tw, th);

    render();
  }

  function render() {
    if (!img) return;
    ctx.save();
    ctx.filter = flags.sketch ? 'grayscale(1) contrast(1.6) brightness(1.05)' : 'none';
    ctx.clearRect(0, 0, imgW, imgH);
    ctx.fillStyle = '#faf7f1';
    ctx.fillRect(0, 0, imgW, imgH);

    for (let j = 0; j < GRID_ROWS - 1; j++) {
      for (let i = 0; i < GRID_COLS - 1; i++) {
        const a = j * GRID_COLS + i;
        const b = a + 1;
        const c = a + GRID_COLS;
        const d = c + 1;
        drawTri(src[a], src[b], src[c], dst[a], dst[b], dst[c]);
        drawTri(src[b], src[d], src[c], dst[b], dst[d], dst[c]);
      }
    }
    ctx.restore();

    if (flags.grid)    drawProportionGrid();
    if (flags.handles) drawHandles();
  }

  function drawTri(s0, s1, s2, d0, d1, d2) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(d0.x, d0.y);
    ctx.lineTo(d1.x, d1.y);
    ctx.lineTo(d2.x, d2.y);
    ctx.closePath();
    ctx.clip();

    const den = (s1.x - s0.x) * (s2.y - s0.y) - (s2.x - s0.x) * (s1.y - s0.y);
    if (Math.abs(den) < 1e-6) { ctx.restore(); return; }
    const a = ((d1.x - d0.x) * (s2.y - s0.y) - (d2.x - d0.x) * (s1.y - s0.y)) / den;
    const b = ((d1.y - d0.y) * (s2.y - s0.y) - (d2.y - d0.y) * (s1.y - s0.y)) / den;
    const c = ((s1.x - s0.x) * (d2.x - d0.x) - (s2.x - s0.x) * (d1.x - d0.x)) / den;
    const d = ((s1.x - s0.x) * (d2.y - d0.y) - (s2.x - s0.x) * (d1.y - d0.y)) / den;
    const e = d0.x - a * s0.x - c * s0.y;
    const f = d0.y - b * s0.x - d * s0.y;
    ctx.transform(a, b, c, d, e, f);
    ctx.drawImage(img, 0, 0, imgW, imgH);
    ctx.restore();
  }

  function drawHandles() {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 122, 89, 0.45)';
    ctx.lineWidth = 1;
    for (let j = 0; j < GRID_ROWS; j++) {
      ctx.beginPath();
      for (let i = 0; i < GRID_COLS; i++) {
        const p = dst[j * GRID_COLS + i];
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    for (let i = 0; i < GRID_COLS; i++) {
      ctx.beginPath();
      for (let j = 0; j < GRID_ROWS; j++) {
        const p = dst[j * GRID_COLS + i];
        if (j === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#ff7a59';
    ctx.strokeStyle = '#1b0d07';
    ctx.lineWidth = 1.5;
    for (const p of dst) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawProportionGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(30, 30, 30, 0.45)';
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1;
    const x1 = imgW / 3, x2 = 2 * imgW / 3;
    const y1 = imgH / 3, y2 = 2 * imgH / 3;
    ctx.beginPath();
    ctx.moveTo(x1, 0); ctx.lineTo(x1, imgH);
    ctx.moveTo(x2, 0); ctx.lineTo(x2, imgH);
    ctx.moveTo(0, y1); ctx.lineTo(imgW, y1);
    ctx.moveTo(0, y2); ctx.lineTo(imgW, y2);
    ctx.stroke();
    ctx.restore();
  }

  function onDown(e) {
    if (!img) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    const { x, y } = evtToCanvas(e);
    let best = -1;
    let bd = 400; // 20px radius squared
    for (let i = 0; i < dst.length; i++) {
      const p = dst[i];
      const d2 = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d2 < bd) { bd = d2; best = i; }
    }
    if (best !== -1) {
      dragging = best;
      pushUndo();
      canvas.style.cursor = 'grabbing';
    }
  }

  function onMove(e) {
    if (dragging == null || dragging === -1 || !img) return;
    const { x, y } = evtToCanvas(e);
    // clamp inside the image bounds
    dst[dragging].x = Math.max(0, Math.min(imgW, x));
    dst[dragging].y = Math.max(0, Math.min(imgH, y));
    render();
  }

  function onUp(e) {
    if (dragging != null && dragging !== -1) {
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) { /* noop */ }
      dragging = null;
      canvas.style.cursor = 'grab';
    }
  }

  function evtToCanvas(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (imgW / rect.width),
      y: (e.clientY - rect.top)  * (imgH / rect.height),
    };
  }

  function pushUndo() {
    undoStack.push(dst.map(p => ({ x: p.x, y: p.y })));
    if (undoStack.length > 40) undoStack.shift();
  }

  function resetWarp() {
    if (!img) return;
    pushUndo();
    dst = src.map(p => ({ x: p.x, y: p.y }));
    render();
  }

  function undo() {
    if (undoStack.length === 0) return;
    dst = undoStack.pop();
    render();
  }

  function exportDataUrl() {
    const prevHandles = flags.handles;
    const prevGrid = flags.grid;
    flags.handles = false;
    flags.grid = false;
    render();
    const url = canvas.toDataURL('image/png');
    flags.handles = prevHandles;
    flags.grid = prevGrid;
    render();
    return url;
  }

  async function saveToGallery() {
    if (!img) return flash('Upload a photo first.', true);
    const url = exportDataUrl();
    const title = await modal.prompt('What should we call this warped portrait?', 'Photo caricature', {
      title: 'Save to gallery',
      placeholder: 'e.g. Grandpa, exaggerated',
      okText: 'Save',
    });
    if (title === null) return;
    saveWork({ title: title || 'Untitled', dataUrl: url, lessonId: null, createdAt: Date.now() });
    flash('Saved to gallery ✓');
  }

  function sendToStudio() {
    if (!img) return flash('Upload a photo first.', true);
    localStorage.setItem('cl.poseReference', exportDataUrl());
    flash('Reference saved — open Studio, toggle Guide, and trace.');
  }

  function downloadImage() {
    if (!img) return flash('Upload a photo first.', true);
    const a = document.createElement('a');
    a.href = exportDataUrl();
    a.download = 'caricature_warp.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    flash('Downloaded ✓');
  }

  function printForDrawing() {
    if (!img) return flash('Upload a photo first.', true);
    const url = exportDataUrl();
    const printWin = window.open('', '_blank', 'width=800,height=1000');
    if (!printWin) return flash('Pop-up blocked. Allow pop-ups to print.', true);
    printWin.document.write(`
      <!DOCTYPE html><html><head><title>CaricatureLab — drawing reference</title>
      <style>
        @page { margin: 12mm; }
        html, body { margin: 0; padding: 0; background: #fff; font-family: system-ui, sans-serif; color: #333; }
        .wrap { padding: 16px; text-align: center; }
        .wrap h1 { font-size: 14px; margin: 0 0 10px; letter-spacing: 1px; text-transform: uppercase; color: #888; }
        .wrap img { max-width: 100%; height: auto; border: 1px solid #ddd; }
        .wrap p { font-size: 11px; color: #999; margin-top: 10px; }
        @media print { .wrap h1, .wrap p { display: none; } }
      </style></head><body>
      <div class="wrap">
        <h1>CaricatureLab — exaggerated reference</h1>
        <img src="${url}" alt="reference" onload="setTimeout(()=>window.print(), 200)">
        <p>Tape beside your sketchpad, or trace through on a light box.</p>
      </div>
      </body></html>
    `);
    printWin.document.close();
  }

  function flash(msg, err = false) {
    modal.toast(msg, { kind: err ? 'error' : 'good' });
  }

  return function dispose() {
    img = null;
    src = [];
    dst = [];
    undoStack = [];
  };
}

function pickTip() {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}
