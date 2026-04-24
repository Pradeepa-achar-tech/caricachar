import { buildNav } from './nav.js';
import { renderHome } from './home.js';
import { renderLessons } from './lessons.js';
import { renderStudio } from './studio.js';
import { renderPose3D } from './mannequin.js';
import { renderExaggerate } from './exaggerate.js';
import { renderGrid } from './grid.js';
import { renderGallery } from './gallery.js';

const views = {
  home: renderHome,
  lessons: renderLessons,
  studio: renderStudio,
  pose3d: renderPose3D,
  exaggerate: renderExaggerate,
  grid: renderGrid,
  gallery: renderGallery,
};

const appEl = document.getElementById('app');
const navEl = document.getElementById('nav');
const sidebar = document.getElementById('sidebar');
const backdrop = document.getElementById('sidebar-backdrop');
const menuToggle = document.getElementById('menu-toggle');
let currentDispose = null;

const nav = buildNav(navEl, (view) => go(view));

function closeDrawer() {
  sidebar?.classList.remove('open');
  backdrop?.classList.remove('open');
}
function toggleDrawer() {
  const open = sidebar?.classList.toggle('open');
  backdrop?.classList.toggle('open', open);
}
menuToggle?.addEventListener('click', toggleDrawer);
backdrop?.addEventListener('click', closeDrawer);

export function go(view, args) {
  if (typeof currentDispose === 'function') {
    try { currentDispose(); } catch (_) { /* noop */ }
  }
  appEl.innerHTML = '';
  nav.setActive(view);
  const renderer = views[view] || views.home;
  currentDispose = renderer(appEl, args) || null;
  // close mobile drawer when navigating
  if (window.innerWidth <= 900) closeDrawer();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

go('home');

window.CaricatureLab = { go };
