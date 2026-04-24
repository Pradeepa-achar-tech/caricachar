// Nav builder — vertical sidebar with icons + section headers.
// Config-driven so adding a view is a one-line change.

const ICONS = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12L12 3l9 9"/><path d="M5 10v11h14V10"/></svg>`,
  lessons: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2V5z"/><path d="M8 8h8M8 12h6"/></svg>`,
  exaggerate: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c4.5 0 7 3.5 7 7 0 5-3 10-7 11-4-1-7-6-7-11 0-3.5 2.5-7 7-7z"/><circle cx="9.5" cy="10" r="1"/><circle cx="14.5" cy="10" r="1"/><path d="M9 15q3 2 6 0"/></svg>`,
  pose: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4.5" r="2"/><path d="M12 7v6"/><path d="M7 9l5 3 5-3"/><path d="M12 13l-3 8M12 13l3 8"/></svg>`,
  grid: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M9 3.5v17M15 3.5v17M3.5 9h17M3.5 15h17"/></svg>`,
  studio: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3.5l5.5 5.5L9 20.5H3.5V15z"/><path d="M13 5.5l5.5 5.5"/></svg>`,
  gallery: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="2"/><circle cx="9" cy="9" r="1.8"/><path d="M3.5 17l5-5 6 6 2-2 4 4"/></svg>`,
};

export const NAV_CONFIG = [
  { type: 'btn', view: 'home', label: 'Home', icon: 'home' },
  {
    type: 'section',
    label: 'Caricature',
    items: [
      { view: 'lessons',    label: 'Lessons',    icon: 'lessons' },
      { view: 'exaggerate', label: 'Exaggerate', icon: 'exaggerate' },
      { view: 'pose3d',     label: '3D Pose',    icon: 'pose' },
    ],
  },
  {
    type: 'section',
    label: 'Portrait',
    items: [
      { view: 'grid', label: 'Sketch Grid', icon: 'grid' },
    ],
  },
  {
    type: 'section',
    label: 'Workspace',
    items: [
      { view: 'studio',  label: 'Studio',  icon: 'studio' },
      { view: 'gallery', label: 'Gallery', icon: 'gallery' },
    ],
  },
];

function makeItem(view, label, iconKey, onNavigate) {
  const btn = document.createElement('button');
  btn.className = 'nav-item';
  btn.dataset.view = view;
  btn.innerHTML = `<span class="nav-icon">${ICONS[iconKey] || ''}</span><span class="nav-label">${label}</span>`;
  btn.addEventListener('click', () => onNavigate(view));
  return btn;
}

export function buildNav(container, onNavigate) {
  container.innerHTML = '';
  const buttonsByView = {};

  NAV_CONFIG.forEach(entry => {
    if (entry.type === 'btn') {
      const btn = makeItem(entry.view, entry.label, entry.icon, onNavigate);
      container.appendChild(btn);
      buttonsByView[entry.view] = btn;
      return;
    }
    if (entry.type === 'section') {
      const label = document.createElement('div');
      label.className = 'nav-section-label';
      label.textContent = entry.label;
      container.appendChild(label);
      entry.items.forEach(item => {
        const btn = makeItem(item.view, item.label, item.icon, onNavigate);
        container.appendChild(btn);
        buttonsByView[item.view] = btn;
      });
    }
  });

  return {
    setActive(view) {
      Object.entries(buttonsByView).forEach(([v, btn]) => {
        btn.classList.toggle('active', v === view);
      });
    },
  };
}
