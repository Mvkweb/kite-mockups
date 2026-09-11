/* kite-shell shared module — Quick Share sheet.
   Visibility modes are single-select (check mark follows).
   Selected-items card: pick mockup files, Clear / Add / remove.
   Incoming card: Accept request (receiving progress) or Decline.
   Tapping a nearby device sends the current selection: transfer card
   morphs in and docks onto the target row (FLIP glide), live progress,
   Sent state, smooth undock. Works in the QS bottom sheet and the
   standalone mockup. */
(function initQuickShare() {
  const visRows = Array.from(document.querySelectorAll('[data-qs-vis]'));
  const devRows = Array.from(document.querySelectorAll('[data-qs-device]'));
  const selMounts = Array.from(document.querySelectorAll('[data-qs-selected]'));
  const incMounts = Array.from(document.querySelectorAll('[data-qs-incoming]'));
  const simMounts = Array.from(document.querySelectorAll('[data-qs-simulate]'));
  if (visRows.length === 0 && devRows.length === 0 && selMounts.length === 0) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  visRows.forEach((row) => {
    row.addEventListener('click', () => {
      visRows.forEach((r) => r.classList.toggle('active', r === row));
    });
  });

  /* ---------- mockup files (no real images, just file types) ---------- */
  const POOL = [
    { name: 'Final_Deck.zip', mb: 30, icon: 'folder_zip' },
    { name: 'wallpaper.png', mb: 4.2, icon: 'image' },
    { name: 'Q3-Report.pdf', mb: 2.8, icon: 'description' },
    { name: 'voice-memo.m4a', mb: 12.1, icon: 'audio_file' },
    { name: 'demo-clip.mp4', mb: 48, icon: 'video_file' },
    { name: 'notes.txt', mb: 0.02, icon: 'text_snippet' },
  ];
  const SCENARIOS = [
    { from: 'Your Phone', idx: [0] },
    { from: 'Your Tablet', idx: [4] },
    { from: 'Your Watch', idx: [5, 2] },
  ];
  let selIdx = [1, 2];
  let poolCursor = 3;
  let scenarioCursor = 0;
  let incoming = { ...SCENARIOS[0] };

  function fmtMB(mb) {
    if (mb >= 1) return `${parseFloat(mb.toFixed(1))} MB`;
    return `${Math.max(1, Math.round(mb * 1024))} KB`;
  }
  function totalMB(list) {
    return list.reduce((s, i) => s + POOL[i].mb, 0);
  }
  function countLabel(list) {
    const n = list.length;
    if (n === 0) return 'No files';
    return `${n} file${n === 1 ? '' : 's'} • ${fmtMB(totalMB(list))}`;
  }
  function sendSummary() {
    if (selIdx.length === 0) return { name: '', icon: 'draft', sub: '' };
    const first = POOL[selIdx[0]];
    const name = selIdx.length === 1 ? first.name : `${first.name} +${selIdx.length - 1} more`;
    return { name, icon: first.icon, sub: `${countLabel(selIdx)}` };
  }

  /* ---------- selected-items card ---------- */
  function fileChip(i, removable) {
    const f = POOL[i];
    return `
      <div class="qs-file" data-qs-file="${i}">
        <div class="qs-file-icon"><span class="icon">${f.icon}</span></div>
        <div class="qs-file-texts">
          <span class="qs-file-name">${f.name}</span>
          <span class="qs-file-size">${fmtMB(f.mb)}</span>
        </div>
        ${removable ? `<button class="qs-file-x" data-qs-remove="${i}" aria-label="Remove ${f.name}"><span class="icon">close</span></button>` : ''}
      </div>`;
  }

  function renderSelected() {
    selMounts.forEach((mount) => {
      const chips = selIdx.map((i) => fileChip(i, true)).join('');
      mount.innerHTML = `
        <div class="qs-card">
          <div class="qs-sel-head">
            <span class="icon qs-sel-check">check</span>
            <div>
              <div class="qs-sel-title">Selected items</div>
              <div class="qs-sel-sub">${countLabel(selIdx)}</div>
            </div>
          </div>
          ${selIdx.length ? `<div class="qs-files">${chips}</div>` : `<div class="qs-sel-empty">Nothing selected — tap Add to attach mockup files.</div>`}
          <div class="qs-actions">
            <button class="qs-btn outline" data-qs-clear><span class="icon">delete</span>Clear</button>
            <button class="qs-btn filled" data-qs-add><span class="icon">add</span>Add</button>
          </div>
        </div>`;
      mount.querySelector('[data-qs-clear]').addEventListener('click', () => {
        selIdx = [];
        renderSelected();
      });
      mount.querySelector('[data-qs-add]').addEventListener('click', () => {
        if (selIdx.length >= 6) return;
        const next = poolCursor % POOL.length;
        poolCursor += 1;
        if (!selIdx.includes(next)) selIdx.push(next);
        renderSelected();
      });
      mount.querySelectorAll('[data-qs-remove]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          selIdx = selIdx.filter((x) => x !== Number(btn.dataset.qsRemove));
          renderSelected();
        });
      });
    });
  }

  /* ---------- incoming request card ---------- */
  function renderIncoming() {
    incMounts.forEach((mount) => {
      if (!incoming) { mount.innerHTML = ''; return; }
      const files = incoming.idx.map((i) => fileChip(i, false)).join('');
      mount.innerHTML = `
        <div class="qs-card">
          <div class="qs-inc-from">
            <div class="qs-file-icon"><span class="icon">smartphone</span></div>
            <div>
              <div class="qs-inc-device">${incoming.from}</div>
              <div class="qs-inc-meta">${countLabel(incoming.idx)}</div>
            </div>
          </div>
          <div class="qs-inc-title">Accept request?</div>
          <div class="qs-files">${files}</div>
          <div class="qs-actions" data-qs-inc-actions>
            <button class="qs-btn outline" data-qs-decline>Decline</button>
            <button class="qs-btn filled" data-qs-accept>Accept</button>
          </div>
        </div>`;
      mount.querySelector('[data-qs-decline]').addEventListener('click', () => {
        dismissIncoming(mount);
      });
      mount.querySelector('[data-qs-accept]').addEventListener('click', () => {
        receiveIncoming(mount);
      });
    });
    simMounts.forEach((mount) => {
      mount.innerHTML = incoming
        ? ''
        : `<button class="qs-simulate">Simulate incoming request</button>`;
      const btn = mount.querySelector('.qs-simulate');
      if (btn) {
        btn.addEventListener('click', () => {
          scenarioCursor = (scenarioCursor + 1) % SCENARIOS.length;
          incoming = { ...SCENARIOS[scenarioCursor] };
          renderIncoming();
        });
      }
    });
  }

  function dismissIncoming(mount) {
    const card = mount.querySelector('.qs-card');
    incoming = null;
    if (!card || reduceMotion) { renderIncoming(); return; }
    const anim = card.animate(
      [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.96)' }],
      { duration: 220, easing: 'ease-in' }
    );
    anim.onfinish = () => renderIncoming();
  }

  function receiveIncoming(mount) {
    const card = mount.querySelector('.qs-card');
    if (!card) return;
    const actions = card.querySelector('[data-qs-inc-actions]');
    const prog = document.createElement('div');
    prog.innerHTML = `
      <div class="qs-progress"><div class="qs-progress-fill" style="transform:scaleX(0)"></div></div>
      <div class="qs-transfer-sub" style="margin-top:6px">Receiving from ${incoming.from}…</div>`;
    actions.replaceWith(prog);
    const fill = prog.querySelector('.qs-progress-fill');
    const note = prog.querySelector('.qs-transfer-sub');
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(100, p + 5 + Math.random() * 10);
      fill.style.transform = `scaleX(${p / 100})`;
      if (p >= 100) {
        clearInterval(t);
        note.textContent = 'Saved to Downloads';
        const title = card.querySelector('.qs-inc-title');
        if (title) title.textContent = 'Received';
        setTimeout(() => dismissIncoming(mount), 1500);
      }
    }, 130);
  }

  /* ---------- FLIP glide + card morph ---------- */
  function flipRows(list, mutate) {
    if (reduceMotion) { mutate(); return; }
    const kids = Array.from(list.children);
    const tops = new Map(kids.map((el) => [el, el.getBoundingClientRect().top]));
    mutate();
    kids.forEach((el) => {
      if (el.hidden || !el.isConnected) return;
      const dy = tops.get(el) - el.getBoundingClientRect().top;
      if (Math.abs(dy) > 1) {
        el.animate(
          [{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }],
          { duration: 340, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }
        );
      }
    });
  }

  function cardIn(card) {
    card.hidden = false;
    if (reduceMotion) return;
    card.animate(
      [
        { opacity: 0, transform: 'translateY(-14px) scale(0.96)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' },
      ],
      { duration: 400, easing: 'cubic-bezier(0.1, 0.9, 0.2, 1)' }
    );
  }

  function cardOut(card, done) {
    if (reduceMotion) { card.hidden = true; done(); return; }
    const anim = card.animate(
      [
        { opacity: 1, transform: 'translateY(0) scale(1)' },
        { opacity: 0, transform: 'translateY(-8px) scale(0.97)' },
      ],
      { duration: 200, easing: 'ease-in' }
    );
    anim.onfinish = done;
  }

  // one transfer card per nearby-device list (one per page)
  const lists = new Set(devRows.map((r) => r.closest('.dialog-rows-list')));
  lists.forEach((list) => {
    if (!list || list.querySelector('.qs-transfer')) return;
    const card = document.createElement('div');
    card.className = 'qs-transfer';
    card.hidden = true;
    card.innerHTML = `
      <div class="qs-transfer-icon"><span class="icon">draft</span></div>
      <div class="qs-transfer-body">
        <div class="qs-transfer-top">
          <span class="qs-transfer-name"></span>
          <span class="qs-transfer-pct">0%</span>
        </div>
        <div class="qs-progress"><div class="qs-progress-fill"></div></div>
        <div class="qs-transfer-sub"></div>
      </div>
      <button class="qs-transfer-cancel" title="Cancel send" aria-label="Cancel send">
        <span class="icon">close</span>
      </button>`;
    list.parentElement.insertBefore(card, list);
  });

  let timer = null;
  let startDelay = null;
  let activeRow = null;

  function dock(card, list, row) {
    const group = list.parentElement;
    card._qsGen = (card._qsGen || 0) + 1; // invalidate any pending fade-out
    if (row._qsNext === undefined) row._qsNext = row.nextElementSibling;
    flipRows(list, () => {
      row.classList.add('qs-target');
      group.classList.add('qs-linked');
      list.prepend(row);
      list.prepend(card);
    });
    cardIn(card);
  }

  function undock(card, list, row, fadeCard, done) {
    const group = list.parentElement;
    const restore = () => {
      flipRows(list, () => {
        row.classList.remove('qs-target');
        group.classList.remove('qs-linked');
        group.insertBefore(card, list);
        card.hidden = true;
        if (row._qsNext !== undefined) {
          if (row._qsNext && row._qsNext.parentElement === list) list.insertBefore(row, row._qsNext);
          else list.appendChild(row);
          row._qsNext = undefined;
        }
      });
      if (done) done();
    };
    if (fadeCard && !reduceMotion) {
      const gen = card._qsGen || 0;
      cardOut(card, () => { if (card._qsGen === gen) restore(); });
    } else { card.hidden = true; restore(); }
  }

  function stopTransfer(card, list, row, fadeCard) {
    if (timer) { clearInterval(timer); timer = null; }
    if (startDelay) { clearTimeout(startDelay); startDelay = null; }
    if (row) {
      row.classList.remove('active');
      const s = row.querySelector('[data-qs-sub]');
      if (s) s.textContent = s.dataset.base || 'Available';
    }
    if (activeRow === row) activeRow = null;
    undock(card, list, row, fadeCard);
  }

  devRows.forEach((row) => {
    const sub = row.querySelector('[data-qs-sub]');
    if (sub) sub.dataset.base = sub.textContent;
    row.addEventListener('click', () => {
      const list = row.closest('.dialog-rows-list');
      const card = list ? list.parentElement.querySelector('.qs-transfer') : null;
      if (!list || !card) return;

      // tapping the active target cancels; tapping another retargets
      if (activeRow === row && (timer || startDelay)) { stopTransfer(card, list, row, true); return; }
      if (activeRow) stopTransfer(card, list, activeRow, false);

      // empty selection: nudge the Add button instead of sending nothing
      if (selIdx.length === 0) {
        const add = document.querySelector('[data-qs-add]');
        if (add) {
          add.classList.remove('qs-nudge');
          void add.offsetWidth;
          add.classList.add('qs-nudge');
        }
        return;
      }

      const title = row.querySelector('.dialog-row-title');
      const target = title ? title.textContent.trim() : 'device';
      const sum = sendSummary();
      const iconEl = card.querySelector('.qs-transfer-icon .icon');
      const nameEl = card.querySelector('.qs-transfer-name');
      const fill = card.querySelector('.qs-progress-fill');
      const pct = card.querySelector('.qs-transfer-pct');
      const info = card.querySelector('.qs-transfer-sub');
      let p = 0;

      activeRow = row;
      row.classList.add('active');
      dock(card, list, row);
      if (iconEl) iconEl.textContent = sum.icon;
      if (nameEl) nameEl.textContent = `${sum.name} • ${fmtMB(totalMB(selIdx))}`;
      fill.style.transform = 'scaleX(0)';
      pct.textContent = '0%';
      info.textContent = `Sending to ${target}…`;
      let lastShown = 0;

      // let the dock glide finish before progress churn starts
      startDelay = setTimeout(() => {
        startDelay = null;
        if (activeRow !== row) return;
        timer = setInterval(() => {
          p = Math.min(100, p + 3 + Math.random() * 7 * (1 - p / 140));
          const shown = Math.floor(p);
          fill.style.transform = `scaleX(${p / 100})`;
          pct.textContent = `${shown}%`;
          if (sub && (shown - lastShown >= 2 || shown >= 100)) {
            lastShown = shown;
            sub.textContent = `Sending… ${shown}%`;
          }
          if (p >= 100) {
            clearInterval(timer); timer = null;
            info.textContent = `Sent to ${target}`;
            pct.textContent = 'Done';
            if (sub) sub.textContent = 'Received';
            setTimeout(() => {
              if (activeRow === row) stopTransfer(card, list, row, true);
            }, 1800);
          }
        }, 120);
      }, reduceMotion ? 0 : 420);

      card.querySelector('.qs-transfer-cancel').onclick = () => stopTransfer(card, list, row, true);
    });
  });

  renderSelected();
  renderIncoming();

  // standalone pages: footer Done/Cancel settle any in-flight transfer in place
  document._qsSettle = () => {
    if (!activeRow) return;
    const list = activeRow.closest('.dialog-rows-list');
    const card = list ? list.parentElement.querySelector('.qs-transfer') : null;
    if (list && card) stopTransfer(card, list, activeRow, true);
  };
})();
