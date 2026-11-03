// ==UserScript==
// @name         Jimitri Mod Loader
// @namespace    jimitri-dash
// @version      1.0.0
// @description  Geode-style mod loader for Jimitri Dash
// @match        https://turkballbredissus.github.io/Jimitri-dash/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/* Works two ways:
   1) Paste this whole file into the F12 console (Console tab) and press Enter.
   2) Install it in Tampermonkey/Violentmonkey (the header above) to auto-load on every visit.
   Installed mods are saved in this browser's localStorage and re-run every time the loader starts. */
(() => {
  if (window.__jdLoader) { window.__jdLoader.toggle(); return; }

  const KEY = 'jdmods:v1';
  const raf = window.requestAnimationFrame.bind(window);   // native copies, so speedhack mods can't slow us
  const st = window.setTimeout.bind(window);
  const loaded = new Map();                                 // id -> { buttons, unload, frames, error }
  let mods = readStore();

  function readStore() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
  function writeStore() {
    try { localStorage.setItem(KEY, JSON.stringify(mods)); }
    catch (e) { toast('Could not save mods (browser storage blocked or full)'); }
  }

  /* ---------- helpers ---------- */
  const h = (tag, props = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const k in props) {
      if (k === 'class') e.className = props[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), props[k]);
      else e.setAttribute(k, props[k]);
    }
    for (const c of kids.flat()) e.append(c);
    return e;
  };
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'mod';
  const toB64 = s => btoa(unescape(encodeURIComponent(s)));
  const fromB64 = s => decodeURIComponent(escape(atob(s)));

  /* ---------- mod format ----------
     .jdmod (JSON):  { format:1, id, name, version, author, description, code }
     raw .js:        optional header comments  // @name  // @version  // @author  // @description
     share code:     "JDMOD:" + base64(JSON)                                                      */
  function parseMod(text, fallbackName) {
    text = String(text).trim();
    if (!text) throw new Error('Nothing to import');
    if (text.startsWith('JDMOD:')) text = fromB64(text.slice(6).trim());
    let m;
    if (text.startsWith('{')) {
      m = JSON.parse(text);
      if (typeof m.code !== 'string' || !m.code.trim()) throw new Error('Mod file has no "code" field');
    } else {
      const tag = k => ((text.match(new RegExp('^\\s*//\\s*@' + k + '\\s+(.+)$', 'm')) || [])[1] || '').trim();
      m = { name: tag('name') || fallbackName, version: tag('version'), author: tag('author'), description: tag('description'), code: text };
    }
    m.name = String(m.name || 'Untitled mod').slice(0, 60);
    m.version = String(m.version || '1.0.0').slice(0, 20);
    m.author = String(m.author || 'unknown').slice(0, 40);
    m.description = String(m.description || '').slice(0, 240);
    m.id = slug(m.id || m.name);
    return { id: m.id, name: m.name, version: m.version, author: m.author, description: m.description, code: m.code, enabled: true };
  }
  const exportObj = m => ({ format: 1, id: m.id, name: m.name, version: m.version, author: m.author, description: m.description, code: m.code });

  /* ---------- mod runtime ---------- */
  const gEval = (0, eval);
  function runMod(m) {
    stopMod(m.id);
    const ctx = { buttons: [], unload: [], frames: new Set(), error: null };
    const nsKey = k => 'jdmodstore:' + m.id + ':' + k;
    const jd = {
      id: m.id, version: m.version,
      log: (...a) => console.log('[mod:' + m.name + ']', ...a),
      notify: msg => toast(m.name + ': ' + msg),
      get: p => { try { return gEval(p); } catch (e) { return undefined; } },
      set: (p, v) => { try { window.__jdTmp = v; gEval(p + '=window.__jdTmp'); return true; } catch (e) { return false; } },
      onFrame: fn => { ctx.frames.add(fn); return () => ctx.frames.delete(fn); },
      onUnload: fn => { ctx.unload.push(fn); },
      addButton: (label, fn) => { ctx.buttons.push({ label: String(label), fn }); renderMods(); },
      storage: {
        get: (k, d) => { try { const v = localStorage.getItem(nsKey(k)); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
        set: (k, v) => { try { localStorage.setItem(nsKey(k), JSON.stringify(v)); } catch (e) {} }
      }
    };
    try { new Function('jd', m.code)(jd); }
    catch (e) { ctx.error = e.message; console.error('[mod:' + m.name + ']', e); }
    loaded.set(m.id, ctx);
  }
  function stopMod(id) {
    const ctx = loaded.get(id);
    if (!ctx) return;
    for (const fn of ctx.unload) { try { fn(); } catch (e) { console.error(e); } }
    ctx.frames.clear();
    loaded.delete(id);
  }
  (function frameLoop(t) {
    for (const ctx of loaded.values())
      for (const fn of ctx.frames) { try { fn(t); } catch (e) { ctx.error = e.message; ctx.frames.delete(fn); console.error(e); } }
    raf(frameLoop);
  })();

  /* ---------- actions ---------- */
  function addMod(m) {
    const existing = mods.find(x => x.id === m.id);
    const warn = 'Mods run with full access to the game and its saved data (levels, icons).\nOnly import mods from people you trust.\n\n';
    const q = existing
      ? warn + 'Replace "' + existing.name + '" v' + existing.version + ' with "' + m.name + '" v' + m.version + ' by ' + m.author + '?'
      : warn + 'Install "' + m.name + '" v' + m.version + ' by ' + m.author + '?';
    if (!confirm(q)) return false;
    if (existing) { stopMod(existing.id); mods = mods.filter(x => x.id !== m.id); }
    mods.push(m);
    writeStore();
    runMod(m);
    renderMods();
    toast('Installed ' + m.name);
    return true;
  }
  function delMod(m) {
    if (!confirm('Delete "' + m.name + '"?')) return;
    stopMod(m.id);
    mods = mods.filter(x => x.id !== m.id);
    writeStore(); renderMods();
    toast('Deleted ' + m.name + ' (some effects last until you reload)');
  }
  async function copyText(text, okMsg) {
    try { await navigator.clipboard.writeText(text); toast(okMsg); }
    catch (e) { prompt('Copy this:', text); }
  }
  const copyCode = m => copyText('JDMOD:' + toB64(JSON.stringify(exportObj(m))), 'Share code copied for ' + m.name);
  function exportMod(m) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(exportObj(m), null, 2)], { type: 'application/json' }));
    const a = h('a', { href: url, download: m.id + '.jdmod' });
    document.body.append(a); a.click(); a.remove();
    st(() => URL.revokeObjectURL(url), 1000);
  }
  async function importFiles(files) {
    for (const f of files) {
      try { addMod(parseMod(await f.text(), f.name.replace(/\.(jdmod|json|js)$/i, ''))); }
      catch (e) { toast('Import failed (' + f.name + '): ' + e.message); }
    }
  }

  /* ---------- UI (shadow DOM so the game's CSS can't touch it) ---------- */
  const host = h('div', { style: 'position:fixed;left:0;right:0;bottom:0;z-index:2147483647;pointer-events:none' });
  const root = host.attachShadow({ mode: 'open' });
  root.append(h('style', {}, `
    *{box-sizing:border-box;font-family:Consolas,'Courier New',monospace;font-size:12px}
    .bar{display:flex;justify-content:center;padding:8px;pointer-events:none}
    .fab{pointer-events:auto;background:#1a1a2ee6;color:#3ddc84;border:2px solid #3ddc84;border-radius:8px;
         padding:8px 22px;font-weight:bold;letter-spacing:2px;cursor:pointer;font-size:13px}
    .fab:hover{background:#3ddc84;color:#052}
    .panel{pointer-events:auto;display:none;position:absolute;left:50%;transform:translateX(-50%);bottom:56px;
           width:min(440px,94vw);max-height:72vh;overflow:auto;background:#12121cf2;color:#e8ffe8;
           border:2px solid #3ddc84;border-radius:10px;box-shadow:0 6px 30px #000a}
    .panel.open{display:block}
    .hd{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#3ddc84;color:#052;font-weight:bold;position:sticky;top:0}
    .bd{padding:10px 12px}
    h4{margin:10px 0 6px;color:#3ddc84;font-size:11px;text-transform:uppercase;letter-spacing:1px}
    .empty{opacity:.6;padding:10px 0}
    .mod{background:#0007;border:1px solid #2a4;border-radius:8px;padding:8px;margin:6px 0}
    .mod.err{border-color:#d44}
    .top{display:flex;gap:8px;align-items:center}
    .meta{display:flex;flex-direction:column}
    .ver{opacity:.65;font-size:11px}
    .desc{margin:6px 0 0;opacity:.85}
    .errmsg{margin:6px 0 0;color:#f88}
    .acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
    button{background:#1a3;color:#fff;border:0;border-radius:5px;padding:5px 9px;cursor:pointer}
    button:hover{background:#2c4}
    button.del{background:#a33}button.del:hover{background:#c44}
    button.modbtn{background:#36c}button.modbtn:hover{background:#48e}
    textarea{width:100%;height:70px;background:#000a;color:#cfc;border:1px solid #385;border-radius:5px;padding:6px;resize:vertical}
    .row{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
    .toast{pointer-events:none;position:absolute;left:50%;transform:translateX(-50%);bottom:64px;background:#000d;color:#fff;
           border:1px solid #3ddc84;border-radius:6px;padding:8px 14px;opacity:0;transition:opacity .2s;max-width:90vw;text-align:center}
    .toast.show{opacity:1}
    input[type=checkbox]{width:18px;height:18px;accent-color:#3ddc84;cursor:pointer}
  `));

  const list = h('div');
  const countEl = h('span', {}, '0');
  const paste = h('textarea', { placeholder: 'Paste a share code (JDMOD:...), .jdmod JSON, or raw mod JavaScript' });
  const fileIn = h('input', { type: 'file', accept: '.jdmod,.json,.js', multiple: '', style: 'display:none' });
  fileIn.addEventListener('change', () => { importFiles([...fileIn.files]); fileIn.value = ''; });
  const toastEl = h('div', { class: 'toast' });

  const panel = h('div', { class: 'panel' },
    h('div', { class: 'hd' }, h('span', {}, 'MOD LOADER'), h('span', {}, 'installed: ', countEl)),
    h('div', { class: 'bd' },
      h('h4', {}, 'Installed mods'), list,
      h('h4', {}, 'Import / share'),
      h('div', { class: 'row' },
        h('button', { onclick: () => fileIn.click() }, 'IMPORT FILE'),
        fileIn),
      paste,
      h('div', { class: 'row' },
        h('button', {
          onclick: () => {
            try { if (addMod(parseMod(paste.value, 'Pasted mod'))) paste.value = ''; }
            catch (e) { toast('Import failed: ' + e.message); }
          }
        }, 'IMPORT CODE'))));
  const fab = h('button', { class: 'fab', onclick: () => panel.classList.toggle('open') }, 'MODS');
  root.append(panel, toastEl, h('div', { class: 'bar' }, fab));

  // keep clicks and typing inside the menu from reaching the game (space = jump, etc.)
  for (const el of [panel, fab])
    for (const t of ['keydown', 'keyup', 'keypress', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend', 'wheel'])
      el.addEventListener(t, e => e.stopPropagation());

  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = st(() => toastEl.classList.remove('show'), 2800);
  }

  function renderMods() {
    list.replaceChildren();
    countEl.textContent = mods.length;
    if (!mods.length) list.append(h('div', { class: 'empty' }, 'No mods installed yet. Import one below.'));
    for (const m of mods) {
      const ctx = loaded.get(m.id);
      const sw = h('input', { type: 'checkbox' });
      sw.checked = !!m.enabled;
      sw.addEventListener('change', () => {
        m.enabled = sw.checked; writeStore();
        if (m.enabled) runMod(m); else { stopMod(m.id); toast('Disabled. Some mods only fully turn off after a page reload.'); }
        renderMods();
      });
      list.append(h('div', { class: 'mod' + (ctx && ctx.error ? ' err' : '') },
        h('div', { class: 'top' }, sw,
          h('div', { class: 'meta' }, h('b', {}, m.name), h('span', { class: 'ver' }, 'v' + m.version + ' by ' + m.author))),
        m.description ? h('div', { class: 'desc' }, m.description) : '',
        ctx && ctx.error ? h('div', { class: 'errmsg' }, 'Error: ' + ctx.error) : '',
        h('div', { class: 'acts' },
          ctx ? ctx.buttons.map(b => h('button', { class: 'modbtn', onclick: () => { try { b.fn(); } catch (e) { toast(e.message); } } }, b.label)) : [],
          h('button', { onclick: () => copyCode(m) }, 'COPY CODE'),
          h('button', { onclick: () => exportMod(m) }, 'EXPORT'),
          h('button', { class: 'del', onclick: () => delMod(m) }, 'DELETE'))));
    }
  }

  document.body.append(host);
  renderMods();
  for (const m of mods) if (m.enabled) runMod(m);
  renderMods();

  window.__jdLoader = {
    toggle: () => { host.style.display = host.style.display === 'none' ? '' : 'none'; },
    mods: () => mods, add: addMod, parse: parseMod
  };
  console.log('%c[jd] Mod loader ready (' + mods.length + ' mod' + (mods.length === 1 ? '' : 's') + '). Click MODS at the bottom.', 'color:#3ddc84;font-weight:bold');
})();
