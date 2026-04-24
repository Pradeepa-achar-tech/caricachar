export function renderHome(root) {
  root.innerHTML = `
    <section class="panel hero-panel">
      <div class="hero">
        <div class="hero-text">
          <h1>Two studios in one browser tab.</h1>
          <p>CaricatureLab teaches two kinds of drawing: the playful <strong>caricature</strong>,
          where exaggeration is the whole point, and the careful <strong>pencil portrait</strong>,
          where grids and shading deliver true likeness. Pick a track below.</p>
        </div>
        <div class="hero-art">${heroSvg()}</div>
      </div>
    </section>

    <section class="tracks">
      ${trackCard({
        key: 'caricature',
        icon: '🎭',
        title: 'Caricature',
        tagline: 'Distort the face until its character screams.',
        items: [
          { view: 'lessons',    label: 'Lessons',    sub: 'Curriculum from head shapes to full caricature' },
          { view: 'exaggerate', label: 'Exaggerate', sub: 'Slider playground + warp your own photo' },
          { view: 'pose3d',     label: '3D Pose',    sub: 'Poseable mannequin for body reference' },
          { view: 'studio',     label: 'Studio',     sub: 'Pressure-smoothed pen for quick sketches' },
        ],
      })}
      ${trackCard({
        key: 'portrait',
        icon: '✎',
        title: 'Pencil Portrait',
        tagline: 'Grid it, trace it, shade it, finish it.',
        items: [
          { view: 'grid',   label: 'Sketch Grid', sub: 'Printable A4/A3/A5 grids + photo-to-pencil filter + line-by-line teacher' },
          { view: 'studio', label: 'Studio',      sub: 'Digital practice canvas' },
        ],
      })}
    </section>

    <section class="panel">
      <h2>How to get started</h2>
      <ol style="line-height:1.7; color:var(--muted);">
        <li>New to caricature? Open the <strong style="color:var(--text);">Caricature → Lessons</strong> and
          work through module 1.</li>
        <li>Want a realistic pencil portrait? Open <strong style="color:var(--text);">Sketch Grid</strong>,
          upload a reference photo, switch the Photo style to <strong>Pencil</strong>, and print at 100%.</li>
        <li>Inside Sketch Grid, click <strong style="color:var(--text);">🎓 Enable teach mode</strong> to
          walk through the outline one construction line at a time.</li>
      </ol>
    </section>
  `;

  root.querySelectorAll('[data-go]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      window.CaricatureLab.go(el.dataset.go);
    });
  });
}

function trackCard({ key, icon, title, tagline, items }) {
  return `
    <div class="track track-${key}">
      <div class="track-head">
        <div class="track-icon">${icon}</div>
        <div>
          <h2>${title}</h2>
          <div class="track-tag">${tagline}</div>
        </div>
      </div>
      <div class="track-items">
        ${items.map(it => `
          <a class="track-item" href="#" data-go="${it.view}">
            <div class="track-item-label">${it.label}</div>
            <div class="track-item-sub">${it.sub}</div>
            <div class="track-item-arrow">→</div>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

function heroSvg() {
  return `
  <svg viewBox="0 0 300 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <radialGradient id="face" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stop-color="#ffe0c8"/>
        <stop offset="100%" stop-color="#c98b66"/>
      </radialGradient>
    </defs>
    <path d="M60 150 Q60 40 160 40 Q260 40 255 150 Q250 230 190 260 Q170 310 150 280 Q120 310 110 260 Q60 230 60 150 Z"
          fill="url(#face)" stroke="#2b1b12" stroke-width="3"/>
    <path d="M120 55 Q150 20 195 50 Q210 30 225 55 Q240 38 240 60" fill="none" stroke="#2b1b12" stroke-width="4" stroke-linecap="round"/>
    <path d="M95 130 Q120 110 145 128" stroke="#2b1b12" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M180 128 Q210 108 240 128" stroke="#2b1b12" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="120" cy="155" rx="18" ry="14" fill="#fff" stroke="#2b1b12" stroke-width="2.5"/>
    <ellipse cx="210" cy="155" rx="18" ry="14" fill="#fff" stroke="#2b1b12" stroke-width="2.5"/>
    <circle cx="124" cy="158" r="6" fill="#2b1b12"/>
    <circle cx="214" cy="158" r="6" fill="#2b1b12"/>
    <path d="M160 150 Q135 210 160 215 Q180 220 175 200 Q170 180 168 155"
          fill="#e2a88a" stroke="#2b1b12" stroke-width="3"/>
    <path d="M120 245 Q160 270 210 235" stroke="#2b1b12" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="160" cy="285" r="3" fill="#2b1b12"/>
  </svg>`;
}
