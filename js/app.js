import { buildNav } from './nav.js';
import { renderHome } from './home.js';
import { renderLessons } from './lessons.js';
import { renderStudio } from './studio.js';
import { renderPose3D } from './mannequin.js';
import { renderExaggerate } from './exaggerate.js';
import { renderGrid } from './grid.js';
import { renderGallery } from './gallery.js';
import {
  installGlobalHandlers,
  confirm as modalConfirm,
  alert as modalAlert,
  toast,
} from './modal.js';

// Route stray native dialogs and uncaught errors through our own UI.
installGlobalHandlers();

// When the service worker detects a new version, ask the user in-app (no native popup).
let updatePromptOpen = false;
window.addEventListener('cl:sw-update', async () => {
  if (updatePromptOpen) return;
  updatePromptOpen = true;
  const ok = await modalConfirm('A new version is ready. Reload now?', {
    title: 'Update available',
    okText: 'Reload',
    cancelText: 'Later',
  });
  updatePromptOpen = false;
  if (ok) window.dispatchEvent(new CustomEvent('cl:sw-apply-update'));
});

// ---- PWA install prompt ----
// Chrome/Edge fire `beforeinstallprompt` after their own engagement heuristics.
// iOS Safari never fires it. We surface install as:
//   1. Always-visible sidebar button + top banner when not yet installed
//   2. First-visit modal offering install (dismissible, remembered 14 days)
//   3. Platform-appropriate fallback instructions when no native prompt exists
setupInstallUX();

function setupInstallUX() {
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const sideBtn = document.getElementById('install-btn');
  const banner = document.getElementById('install-banner');
  const bannerGo = document.getElementById('install-banner-go');
  const bannerClose = document.getElementById('install-banner-close');

  if (isStandalone) {
    sideBtn?.remove();
    banner?.remove();
    return;
  }

  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);

  const DISMISS_KEY = 'cl_install_dismiss_until';
  const INSTALLED_KEY = 'cl_installed';

  // Sidebar button should always be visible in browser mode as a fallback entry.
  if (sideBtn) sideBtn.hidden = false;

  // Banner — hide if dismissed recently OR if user already installed
  const dismissUntil = Number(localStorage.getItem(DISMISS_KEY) || '0');
  const alreadyInstalled = localStorage.getItem(INSTALLED_KEY) === '1';
  if (!alreadyInstalled && Date.now() >= dismissUntil && banner) {
    banner.hidden = false;
  }

  // If the install event arrives after boot, still surface the banner.
  window.addEventListener('cl:install-ready', () => {
    if (banner && !alreadyInstalled && Date.now() >= dismissUntil) banner.hidden = false;
  });

  async function triggerInstall() {
    const deferred = window.__deferredInstall;
    if (deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      window.__deferredInstall = null;
      if (outcome === 'accepted') markInstalled();
      return;
    }
    // No native prompt available — show platform-specific how-to.
    if (isIOS) {
      await modalAlert(
        'To install on iPhone / iPad (Safari):\n\n' +
        '1. Tap the Share button at the bottom of the screen (⇧ icon).\n' +
        '2. Scroll down and tap "Add to Home Screen".\n' +
        '3. Tap "Add" — the app will appear on your home screen.',
        { title: 'Install on iOS' }
      );
    } else if (isAndroid) {
      await modalAlert(
        'To install on Android:\n\n' +
        '1. Tap the ⋮ menu in your browser.\n' +
        '2. Tap "Install app" or "Add to Home Screen".\n\n' +
        'If you don\'t see the option, keep using the app for a minute and your browser will offer it automatically.',
        { title: 'Install on Android' }
      );
    } else {
      await modalAlert(
        'To install on desktop:\n\n' +
        '• In Chrome or Edge, look for the install icon (⊕ or monitor icon) in the address bar, click it and choose Install.\n' +
        '• Or open the browser menu and choose "Install Chitra Bidsu" / "Apps" → "Install".',
        { title: 'Install on desktop' }
      );
    }
  }

  function markInstalled() {
    localStorage.setItem(INSTALLED_KEY, '1');
    banner?.remove();
    sideBtn?.remove();
    toast('App installed ✓', { kind: 'good' });
  }

  function dismissBanner(days = 14) {
    if (!banner) return;
    banner.hidden = true;
    localStorage.setItem(DISMISS_KEY, String(Date.now() + days * 86400000));
  }

  sideBtn?.addEventListener('click', triggerInstall);
  bannerGo?.addEventListener('click', triggerInstall);
  bannerClose?.addEventListener('click', () => dismissBanner(14));

  window.addEventListener('appinstalled', markInstalled);

  // Welcome modal on first visit — one-time unless explicitly dismissed again.
  const WELCOME_KEY = 'cl_install_welcomed';
  const welcomed = localStorage.getItem(WELCOME_KEY) === '1';
  if (!welcomed && !alreadyInstalled && Date.now() >= dismissUntil) {
    // small delay so the app has rendered something first
    setTimeout(async () => {
      localStorage.setItem(WELCOME_KEY, '1');
      const ok = await modalConfirm(
        'Install Chitra Bidsu on your device for a faster, full-screen experience — works offline, appears on your home screen, and feels like a native app.',
        { title: 'Install the app?', okText: 'Install now', cancelText: 'Not now' }
      );
      if (ok) triggerInstall();
      else dismissBanner(14);
    }, 1200);
  }
}

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
