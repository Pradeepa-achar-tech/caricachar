import { LESSONS } from './lessons-data.js';

export function renderLessons(root, args) {
  if (args && args.id != null) {
    renderDetail(root, args.id);
  } else {
    renderList(root);
  }
}

function renderList(root) {
  const cards = LESSONS.map((l, i) => `
    <div class="lesson-card" data-id="${i}">
      <div class="mod">Module ${i + 1}</div>
      <h3>${l.title}</h3>
      <p>${l.summary}</p>
    </div>
  `).join('');

  root.innerHTML = `
    <section class="panel">
      <h1>Lessons</h1>
      <p style="color:var(--muted); margin-top:-4px;">
        A guided curriculum. Work top-to-bottom the first time — you can revisit any
        module later.
      </p>
      <div class="lesson-grid">${cards}</div>
    </section>
  `;

  root.querySelectorAll('.lesson-card').forEach(card => {
    card.addEventListener('click', () => {
      window.CaricatureLab.go('lessons', { id: Number(card.dataset.id) });
    });
  });
}

function renderDetail(root, id) {
  const lesson = LESSONS[id];
  if (!lesson) { renderList(root); return; }

  const steps = lesson.steps.map((s, i) =>
    `<div class="step"><span class="step-n">${i + 1}.</span>${s}</div>`
  ).join('');

  const prev = id > 0 ? id - 1 : null;
  const next = id < LESSONS.length - 1 ? id + 1 : null;

  root.innerHTML = `
    <section class="panel">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <div>
          <div style="color:var(--accent-2); font-size:12px; letter-spacing:1px; text-transform:uppercase;">
            Module ${id + 1}
          </div>
          <h1 style="margin:2px 0 0;">${lesson.title}</h1>
        </div>
        <button class="btn ghost" data-back>← All lessons</button>
      </div>
      <p style="color:var(--muted);">${lesson.summary}</p>

      <div class="lesson-detail">
        <div>
          ${lesson.illustration}
        </div>
        <div>
          <h3>Steps</h3>
          ${steps}
          ${lesson.principle ? `<div class="panel" style="margin-top:12px; background:var(--panel-2); border-left:3px solid var(--accent-2);">
            <h3 style="margin-top:0; color:var(--accent-2);">Caricature principle</h3>
            <p style="color:var(--text); margin:0;">${lesson.principle}</p>
          </div>` : ''}
          <div style="margin-top:10px;">
            <button class="btn primary" data-practice>Practice in Studio →</button>
          </div>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; margin-top:18px;">
        <button class="btn" data-nav="prev" ${prev === null ? 'disabled style="opacity:0.4"' : ''}>← Previous</button>
        <button class="btn" data-nav="next" ${next === null ? 'disabled style="opacity:0.4"' : ''}>Next →</button>
      </div>
    </section>
  `;

  root.querySelector('[data-back]').addEventListener('click', () =>
    window.CaricatureLab.go('lessons'));
  root.querySelector('[data-practice]').addEventListener('click', () =>
    window.CaricatureLab.go('studio', { lessonId: id }));
  root.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.nav === 'prev' ? prev : next;
      if (target !== null) window.CaricatureLab.go('lessons', { id: target });
    });
  });
}
