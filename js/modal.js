// In-app modal dialogs — promise-based replacements for browser-native
// alert / confirm / prompt. Call via `await modal.confirm('...')` etc.

let root = null;

function ensureRoot() {
  if (!root) {
    root = document.createElement('div');
    root.className = 'modal-root';
    document.body.appendChild(root);
  }
  return root;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function show(opts) {
  const {
    title,
    body,
    kind = 'info',           // info | danger
    inputDefault = null,      // null = no input
    inputPlaceholder = '',
    okText = 'OK',
    cancelText = 'Cancel',
    showCancel = false,
  } = opts;

  return new Promise((resolve) => {
    const host = ensureRoot();
    const overlay = document.createElement('div');
    overlay.className = `modal-overlay modal-kind-${kind}`;
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        ${title ? `<div class="modal-title">${escapeHtml(title)}</div>` : ''}
        <div class="modal-body">${escapeHtml(body)}</div>
        ${inputDefault !== null
          ? `<input type="text" class="modal-input" value="${escapeHtml(inputDefault)}" placeholder="${escapeHtml(inputPlaceholder)}" autocomplete="off"/>`
          : ''}
        <div class="modal-actions">
          ${showCancel ? `<button class="btn modal-cancel" type="button">${escapeHtml(cancelText)}</button>` : ''}
          <button class="btn primary modal-ok" type="button">${escapeHtml(okText)}</button>
        </div>
      </div>
    `;
    host.appendChild(overlay);
    // animate in
    requestAnimationFrame(() => overlay.classList.add('open'));

    const input = overlay.querySelector('.modal-input');
    const ok = overlay.querySelector('.modal-ok');
    const cancel = overlay.querySelector('.modal-cancel');

    const cancelValue = inputDefault !== null ? null : false;
    const okValue = () => (inputDefault !== null ? (input ? input.value : '') : true);

    function close(value) {
      overlay.classList.remove('open');
      document.removeEventListener('keydown', onKey);
      setTimeout(() => overlay.remove(), 200);
      resolve(value);
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(cancelValue);
      } else if (e.key === 'Enter') {
        // Enter submits unless user is in a multiline field (we only have inputs)
        if (!showCancel || document.activeElement === input || document.activeElement === ok) {
          e.preventDefault();
          close(okValue());
        }
      }
    }

    ok.addEventListener('click', () => close(okValue()));
    if (cancel) cancel.addEventListener('click', () => close(cancelValue));
    // click-outside: only for plain alerts (no cancel, no input) — less destructive
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay && !showCancel && inputDefault === null) close(cancelValue);
    });
    document.addEventListener('keydown', onKey);

    setTimeout(() => {
      if (input) { input.focus(); input.select(); }
      else ok.focus();
    }, 60);
  });
}

export function alert(body, opts = {}) {
  return show({
    title: opts.title || 'Notice',
    body,
    okText: opts.okText || 'OK',
    showCancel: false,
    kind: opts.kind || 'info',
  });
}

export function confirm(body, opts = {}) {
  return show({
    title: opts.title || 'Confirm',
    body,
    okText: opts.okText || 'OK',
    cancelText: opts.cancelText || 'Cancel',
    showCancel: true,
    kind: opts.kind || 'info',
  });
}

export function prompt(body, defaultValue = '', opts = {}) {
  return show({
    title: opts.title || 'Enter a value',
    body,
    inputDefault: String(defaultValue == null ? '' : defaultValue),
    inputPlaceholder: opts.placeholder || '',
    okText: opts.okText || 'OK',
    cancelText: opts.cancelText || 'Cancel',
    showCancel: true,
    kind: opts.kind || 'info',
  });
}

// Convenience toast — lightweight non-blocking success / error flash
export function toast(message, { kind = 'good', ms = 2200 } = {}) {
  const el = document.createElement('div');
  el.className = `modal-toast modal-toast-${kind}`;
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 200);
  }, ms);
}
