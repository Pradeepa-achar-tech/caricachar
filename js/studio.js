import { getStroke } from 'https://esm.sh/perfect-freehand@1.2.0';
import { saveWork } from './gallery.js';
import { LESSONS } from './lessons-data.js';
import * as modal from './modal.js';

const SWATCHES = ['#22211d', '#7a3b2e', '#c98b66', '#d94c2e', '#f2a93b', '#4e7a3a', '#2e5a8c', '#8436a1'];

export function renderStudio(root, args) {
  const lessonId = args && args.lessonId != null ? args.lessonId : null;
  const lesson = lessonId != null ? LESSONS[lessonId] : null;

  root.innerHTML = `
    <section class="panel">
      <div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:10px;">
        <h1 style="margin:0;">Studio</h1>
        ${lesson ? `<div style="color:var(--muted); font-size:13px;">Practicing: <strong style="color:var(--accent-2);">${lesson.title}</strong></div>` : ''}
      </div>

      <div class="toolbar" id="studio-toolbar">
        <label>tool</label>
        <button class="btn" data-tool="pen" title="Pen">✎ Pen</button>
        <button class="btn" data-tool="eraser" title="Eraser">⌫ Eraser</button>
        <span style="width:1px; height:22px; background:var(--border); margin:0 4px;"></span>
        <label>size</label>
        <input id="size" type="range" min="1" max="40" value="6" />
        <label>smooth</label>
        <input id="smooth" type="range" min="0" max="100" value="55" />
        <span style="width:1px; height:22px; background:var(--border); margin:0 4px;"></span>
        <label>color</label>
        <input id="color" type="color" value="#22211d" />
        <span id="swatches" class="swatch-row" style="margin:0;"></span>
        <span style="width:1px; height:22px; background:var(--border); margin:0 4px;"></span>
        <button class="btn" id="btn-guide" title="Toggle guide overlay">◐ Guide</button>
        <button class="btn" id="btn-undo" title="Undo last stroke">↶ Undo</button>
        <button class="btn danger" id="btn-clear" title="Clear canvas">✕ Clear</button>
        <button class="btn primary" id="btn-save" title="Save to gallery">💾 Save</button>
      </div>

      <div class="studio-wrap">
        <aside class="studio-sidepanel" id="studio-side">
          ${lesson ? `
            <div class="side-section">
              <div class="side-header">
                <h3 style="margin:0;">${lesson.title}</h3>
                <button class="btn ghost side-hide" id="side-hide" title="Hide panel">✕</button>
              </div>
              <div class="lesson-thumb">${lesson.illustration}</div>
            </div>
            <div class="side-section">
              <h3>Steps</h3>
              <ol class="step-list">
                ${lesson.steps.map(s => `<li>${s}</li>`).join('')}
              </ol>
            </div>
            ${lesson.principle ? `
              <div class="side-section">
                <h3 style="color:var(--accent-2);">Caricature principle</h3>
                <div class="tip principle-tip">${lesson.principle}</div>
              </div>` : ''}
          ` : `
            <div class="side-section">
              <div class="side-header">
                <h3 style="margin:0;">Free practice</h3>
                <button class="btn ghost side-hide" id="side-hide" title="Hide panel">✕</button>
              </div>
              <div class="tip">Sketch a big head first, then add features. Do not press hard — speed creates variation. Tap <strong>Guide</strong> above to toggle the face grid.</div>
              <div style="margin-top:8px;">
                <button class="btn" id="pick-lesson" style="width:100%;">Pick a lesson to practice →</button>
              </div>
            </div>
          `}
          <div class="side-section">
            <h3>Shortcuts</h3>
            <div class="tip">
              <strong>P</strong> pen &nbsp; <strong>E</strong> eraser<br>
              <strong>[</strong>&nbsp;<strong>]</strong> size<br>
              <strong>Ctrl+Z</strong> undo
            </div>
          </div>
        </aside>
        <button class="btn side-show" id="side-show" title="Show lesson panel" style="display:none;">▸ Show lesson</button>
        <div class="studio-canvas-wrap">
          <canvas id="studio-canvas" class="studio-canvas" width="900" height="620"></canvas>
          <div style="color:var(--muted); font-size:12px; margin-top:6px;">
            Pressure-aware pen uses <a href="https://github.com/steveruizok/perfect-freehand" target="_blank" rel="noopener">perfect-freehand</a>.
            Works with mouse, trackpad, or stylus.
          </div>
        </div>
      </div>
    </section>
  `;

  const canvas = root.querySelector('#studio-canvas');
  const ctx = canvas.getContext('2d');
  const sizeEl = root.querySelector('#size');
  const smoothEl = root.querySelector('#smooth');
  const colorEl = root.querySelector('#color');
  const swatchesEl = root.querySelector('#swatches');
  const sideEl = root.querySelector('#studio-side');
  const sideHideBtn = root.querySelector('#side-hide');
  const sideShowBtn = root.querySelector('#side-show');
  const studioWrap = root.querySelector('.studio-wrap');
  const pickLessonBtn = root.querySelector('#pick-lesson');

  if (sideHideBtn) sideHideBtn.addEventListener('click', () => {
    studioWrap.classList.add('side-collapsed');
    sideShowBtn.style.display = 'inline-block';
    // canvas container resized — re-measure after the reflow
    requestAnimationFrame(() => setupHiDPI());
  });
  if (sideShowBtn) sideShowBtn.addEventListener('click', () => {
    studioWrap.classList.remove('side-collapsed');
    sideShowBtn.style.display = 'none';
    requestAnimationFrame(() => setupHiDPI());
  });
  if (pickLessonBtn) pickLessonBtn.addEventListener('click', () =>
    window.CaricatureLab.go('lessons'));

  let tool = 'pen';
  let guideOn = false;
  let color = colorEl.value;
  let size = Number(sizeEl.value);
  let smoothing = Number(smoothEl.value) / 100;
  let poseRefImg = null;
  const poseRefData = localStorage.getItem('cl.poseReference');
  if (poseRefData) {
    poseRefImg = new Image();
    poseRefImg.onload = () => redraw();
    poseRefImg.src = poseRefData;
  }

  const strokes = []; // {points: [[x,y,p]], size, color, tool, smoothing}
  let currentStroke = null;

  // swatches
  SWATCHES.forEach((c, i) => {
    const sw = document.createElement('div');
    sw.className = 'swatch' + (i === 0 ? ' active' : '');
    sw.style.background = c;
    sw.dataset.color = c;
    sw.addEventListener('click', () => {
      color = c;
      colorEl.value = c;
      swatchesEl.querySelectorAll('.swatch').forEach(s => s.classList.toggle('active', s === sw));
    });
    swatchesEl.appendChild(sw);
  });

  // tool buttons
  root.querySelectorAll('[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => selectTool(btn.dataset.tool));
  });

  function selectTool(t) {
    tool = t;
    root.querySelectorAll('[data-tool]').forEach(b =>
      b.style.borderColor = b.dataset.tool === t ? 'var(--accent)' : '');
    canvas.style.cursor = t === 'eraser' ? 'cell' : 'crosshair';
  }
  selectTool('pen');

  // color + size + smooth
  colorEl.addEventListener('input', () => {
    color = colorEl.value;
    swatchesEl.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  });
  sizeEl.addEventListener('input', () => { size = Number(sizeEl.value); });
  smoothEl.addEventListener('input', () => { smoothing = Number(smoothEl.value) / 100; });

  // canvas sizing — scale for DPR on first paint
  function setupHiDPI() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }
  setupHiDPI();
  const resizeObs = new ResizeObserver(() => setupHiDPI());
  resizeObs.observe(canvas);

  // drawing
  function pointFromEvt(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const p = e.pressure && e.pressure > 0 ? e.pressure : 0.5;
    return [x, y, p];
  }

  function onDown(e) {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    currentStroke = {
      points: [pointFromEvt(e)],
      size,
      color,
      tool,
      smoothing,
    };
    strokes.push(currentStroke);
    redraw();
  }
  function onMove(e) {
    if (!currentStroke) return;
    const [x, y, p] = pointFromEvt(e);
    const last = currentStroke.points[currentStroke.points.length - 1];
    // dedupe near-identical points
    if (last && Math.hypot(x - last[0], y - last[1]) < 1) return;
    currentStroke.points.push([x, y, p]);
    redraw();
  }
  function onUp(e) {
    if (!currentStroke) return;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) { /* noop */ }
    // Collapse empty single-click strokes into a dot
    if (currentStroke.points.length < 2) {
      const [x, y, p] = currentStroke.points[0];
      currentStroke.points.push([x + 0.5, y + 0.5, p]);
    }
    currentStroke = null;
    redraw();
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onUp);

  function drawStroke(s) {
    const outline = getStroke(s.points, {
      size: s.size,
      thinning: 0.5,
      smoothing: s.smoothing,
      streamline: 0.5,
      simulatePressure: true,
      last: s === currentStroke ? false : true,
    });
    if (!outline.length) return;

    const path = new Path2D();
    path.moveTo(outline[0][0], outline[0][1]);
    for (let i = 1; i < outline.length; i++) {
      const [x, y] = outline[i];
      path.lineTo(x, y);
    }
    path.closePath();

    if (s.tool === 'eraser') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000';
      ctx.fill(path);
      ctx.restore();
    } else {
      ctx.fillStyle = s.color;
      ctx.fill(path);
    }
  }

  function drawGuide() {
    if (!guideOn) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    // pose reference if saved
    if (poseRefImg && poseRefImg.complete && poseRefImg.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = 0.28;
      const imgW = poseRefImg.naturalWidth;
      const imgH = poseRefImg.naturalHeight;
      const scale = Math.min(w / imgW, h / imgH) * 0.92;
      const dw = imgW * scale;
      const dh = imgH * scale;
      ctx.drawImage(poseRefImg, (w - dw) / 2, (h - dh) / 2, dw, dh);
      ctx.restore();
    }
    ctx.save();
    ctx.strokeStyle = '#c98b66';
    ctx.globalAlpha = 0.35;
    ctx.setLineDash([6, 5]);
    ctx.lineWidth = 1;
    const cx = w / 2, cy = h / 2;
    const rx = Math.min(w, h) * 0.28;
    const ry = rx * 1.35;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    // centerline
    ctx.beginPath(); ctx.moveTo(cx, cy - ry); ctx.lineTo(cx, cy + ry); ctx.stroke();
    // eye line
    ctx.beginPath(); ctx.moveTo(cx - rx, cy); ctx.lineTo(cx + rx, cy); ctx.stroke();
    // nose base
    ctx.beginPath(); ctx.moveTo(cx - rx * 0.8, cy + ry * 0.35); ctx.lineTo(cx + rx * 0.8, cy + ry * 0.35); ctx.stroke();
    // mouth
    ctx.beginPath(); ctx.moveTo(cx - rx * 0.6, cy + ry * 0.6); ctx.lineTo(cx + rx * 0.6, cy + ry * 0.6); ctx.stroke();
    ctx.restore();
  }

  function redraw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    // paper tone
    ctx.fillStyle = '#faf7f1';
    ctx.fillRect(0, 0, w, h);
    drawGuide();
    for (const s of strokes) drawStroke(s);
  }

  // toolbar actions
  root.querySelector('#btn-guide').addEventListener('click', () => {
    guideOn = !guideOn;
    redraw();
  });
  root.querySelector('#btn-undo').addEventListener('click', undo);
  root.querySelector('#btn-clear').addEventListener('click', async () => {
    if (strokes.length) {
      const ok = await modal.confirm('Clear the whole canvas? This cannot be undone.', {
        title: 'Clear canvas',
        okText: 'Clear',
        cancelText: 'Keep drawing',
        kind: 'danger',
      });
      if (!ok) return;
    }
    strokes.length = 0;
    redraw();
  });
  root.querySelector('#btn-save').addEventListener('click', async () => {
    const prev = guideOn;
    guideOn = false;
    redraw();
    const dataUrl = canvas.toDataURL('image/png');
    guideOn = prev;
    redraw();
    const title = await modal.prompt('What should we call this drawing?',
      lesson ? lesson.title : 'Untitled caricature',
      { title: 'Save to gallery', placeholder: 'e.g. My first caricature', okText: 'Save' });
    if (title === null) return;
    saveWork({ title: title || 'Untitled', dataUrl, lessonId, createdAt: Date.now() });
    modal.toast('Saved to gallery ✓');
  });

  function undo() {
    strokes.pop();
    redraw();
  }

  // keyboard shortcuts
  const onKey = (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (e.key.toLowerCase() === 'p') selectTool('pen');
    else if (e.key.toLowerCase() === 'e') selectTool('eraser');
    else if (e.key === '[') { sizeEl.value = Math.max(1, size - 1); size = Number(sizeEl.value); }
    else if (e.key === ']') { sizeEl.value = Math.min(40, size + 1); size = Number(sizeEl.value); }
  };
  window.addEventListener('keydown', onKey);

  // dispose
  return () => {
    resizeObs.disconnect();
    window.removeEventListener('keydown', onKey);
  };
}
