import { LESSONS } from './lessons-data.js';
import * as modal from './modal.js';

const KEY = 'caricatureLab.gallery.v1';

export function listWorks() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch (_) {
    return [];
  }
}

export function saveWork(work) {
  const all = listWorks();
  all.unshift({ id: 'w_' + Date.now() + '_' + Math.floor(Math.random() * 9999), ...work });
  // cap gallery to 50 items so localStorage doesn't explode
  while (all.length > 50) all.pop();
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch (err) {
    // quota exceeded — drop oldest until it fits or bail
    while (all.length > 1) {
      all.pop();
      try { localStorage.setItem(KEY, JSON.stringify(all)); return; }
      catch (_) { /* keep dropping */ }
    }
  }
}

export function deleteWork(id) {
  const all = listWorks().filter(w => w.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function renderGallery(root) {
  const works = listWorks();

  root.innerHTML = `
    <section class="panel">
      <h1>Gallery</h1>
      <p style="color:var(--muted); margin-top:-4px;">
        Everything you save from the Studio lives here, in your browser. Nothing
        leaves your device.
      </p>
      ${works.length === 0
        ? `<div class="empty">No drawings yet. Open the <a href="#" data-go="studio">Studio</a> and save one.</div>`
        : `<div class="gallery-grid">${works.map(renderCard).join('')}</div>`
      }
    </section>
  `;

  root.querySelectorAll('[data-go]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.CaricatureLab.go(el.dataset.go);
    });
  });

  root.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await modal.confirm('Delete this drawing permanently?', {
        title: 'Delete drawing',
        okText: 'Delete',
        cancelText: 'Keep',
        kind: 'danger',
      });
      if (!ok) return;
      deleteWork(btn.dataset.del);
      renderGallery(root);
      modal.toast('Drawing deleted');
    });
  });

  root.querySelectorAll('[data-download]').forEach(btn => {
    btn.addEventListener('click', () => {
      const w = works.find(x => x.id === btn.dataset.download);
      if (!w) return;
      const a = document.createElement('a');
      a.href = w.dataUrl;
      a.download = (w.title || 'caricature').replace(/[^a-z0-9_\-]+/gi, '_') + '.png';
      a.click();
    });
  });
}

function renderCard(w) {
  const date = new Date(w.createdAt).toLocaleString();
  const lessonName = (w.lessonId != null && LESSONS[w.lessonId]) ? LESSONS[w.lessonId].title : '';
  return `
    <div class="gallery-item">
      <img src="${w.dataUrl}" alt="${escapeHtml(w.title)}" />
      <div class="gallery-meta" style="flex-direction:column; align-items:flex-start; gap:4px;">
        <div style="color:var(--text); font-size:13px; font-weight:600;">${escapeHtml(w.title)}</div>
        <div>${lessonName ? escapeHtml(lessonName) + ' · ' : ''}${date}</div>
        <div style="display:flex; gap:6px; margin-top:4px;">
          <button class="btn" data-download="${w.id}" style="padding:4px 8px; font-size:12px;">⇩ PNG</button>
          <button class="btn danger" data-del="${w.id}" style="padding:4px 8px; font-size:12px;">Delete</button>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
