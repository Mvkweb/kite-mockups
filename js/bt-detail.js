/* kite-shell shared module — Bluetooth device detail drill-in.
   Gear on a device row slides the sheet to a detail view (toggles,
   battery, address, forget). Works in the QS bottom sheet and the
   standalone bluetooth mockup. */
(function initBtDetail() {
  const AUDIO_ICONS = new Set(['headphones', 'headset', 'earbuds', 'speaker', 'soundbar', 'car']);
  const TYPE_LABELS = {
    headphones: 'Headphones', headset: 'Headset', earbuds: 'Earbuds',
    keyboard: 'Keyboard', mouse: 'Mouse', speaker: 'Speaker',
    sports_esports: 'Game controller', watch: 'Watch',
    smartphone: 'Phone', tablet: 'Tablet', car: 'Car audio',
  };

  function fakeAddress(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) >>> 0;
    const bytes = [];
    for (let i = 0; i < 6; i++) bytes.push(((h >> (i * 5)) + i * 37).toString(16).padStart(2, '0').slice(-2).toUpperCase());
    return bytes.join(':');
  }

  function parseDevice(row) {
    const iconEl = row.querySelector('.dialog-icon-badge .icon');
    const titleEl = row.querySelector('.dialog-row-title');
    const subEl = row.querySelector('.dialog-row-subtitle');
    const icon = iconEl ? iconEl.textContent.trim() : 'bluetooth';
    const name = titleEl ? titleEl.textContent.trim() : 'Unknown device';
    const sub = subEl ? subEl.textContent.trim() : '';
    const connected = row.classList.contains('active');
    const batt = (sub.match(/(\d+)\s*%/) || [])[1] || null;
    return { row, icon, name, sub, connected, batt };
  }

  function setRowConnected(dev, on) {
    dev.row.classList.toggle('active', on);
    const subEl = dev.row.querySelector('.dialog-row-subtitle');
    if (subEl) {
      if (on) subEl.textContent = dev.batt ? `Connected • ${dev.batt}% battery` : 'Connected';
      else subEl.textContent = 'Saved';
    }
    dev.connected = on;
  }

  function switchRow(label, sub, on, act) {
    return `
      <div class="dialog-row-item" style="cursor:default">
        <div class="dialog-row-texts">
          <span class="dialog-row-title">${label}</span>
          ${sub ? `<span class="dialog-row-subtitle">${sub}</span>` : ''}
        </div>
        <button class="m3-switch" role="switch" aria-checked="${on}" data-on="${on}" data-act="${act}" aria-label="${label}"></button>
      </div>`;
  }

  function infoRow(icon, label, sub) {
    return `
      <div class="dialog-row-item" style="cursor:default">
        <div class="dialog-icon-badge"><span class="icon">${icon}</span></div>
        <div class="dialog-row-texts">
          <span class="dialog-row-title">${label}</span>
          <span class="dialog-row-subtitle">${sub}</span>
        </div>
      </div>`;
  }

  function renderDetail(detailView, dev, closeDetail) {
    const type = TYPE_LABELS[dev.icon] || 'Bluetooth device';
    const status = dev.connected ? 'Connected' : 'Saved';
    const heroSub = dev.batt ? `${status} • ${dev.batt}% battery` : status;
    const isAudio = AUDIO_ICONS.has(dev.icon);

    const useFor = isAudio
      ? switchRow('Media audio', 'Play media on this device', dev.connected, 'media')
        + switchRow('Phone calls', 'Route calls to this device', dev.connected, 'calls')
      : infoRow('tune', 'Profiles', 'HID input device');

    detailView.innerHTML = `
      <div class="modal-header-row">
        <button class="qs-icon-btn" data-bt-back title="Back" aria-label="Back to devices">
          <span class="icon">arrow_back</span>
        </button>
        <span class="modal-title" style="font-size:17px">Device details</span>
        <span style="width:36px"></span>
      </div>
      <div class="bt-detail-scroll">
        <div class="bt-hero">
          <div class="bt-hero-badge"><span class="icon">${dev.icon}</span></div>
          <div>
            <div class="bt-hero-name">${dev.name}</div>
            <div class="bt-hero-sub" data-hero-sub>${heroSub}</div>
          </div>
        </div>

        <div>
          <div class="bt-group-label">Connection</div>
          <div class="dialog-rows-list" style="margin-top:6px">
            ${switchRow(dev.connected ? 'Connected' : 'Connect', dev.connected ? 'Active connection' : 'Tap to connect', dev.connected, 'conn')}
          </div>
        </div>

        <div>
          <div class="bt-group-label">Use for</div>
          <div class="dialog-rows-list" style="margin-top:6px">${useFor}</div>
        </div>

        <div>
          <div class="bt-group-label">About</div>
          <div class="dialog-rows-list" style="margin-top:6px">
            ${dev.batt ? infoRow('battery_full', 'Battery', `${dev.batt}% remaining`) : ''}
            ${infoRow('category', 'Device type', type)}
            ${infoRow('tag', 'Device address', fakeAddress(dev.name))}
          </div>
        </div>

        <div>
          <div class="bt-group-label">Manage</div>
          <div class="dialog-rows-list" style="margin-top:6px">
            <button class="dialog-row-item bt-danger-row" data-act="forget" style="width:100%;font-family:inherit">
              <div class="dialog-icon-badge"><span class="icon">delete</span></div>
              <div class="dialog-row-texts">
                <span class="dialog-row-title">Forget device</span>
                <span class="dialog-row-subtitle" style="color:var(--qs-on-inactive-dim)">Remove pairing</span>
              </div>
            </button>
          </div>
        </div>
      </div>`;

    detailView.querySelector('[data-bt-back]').addEventListener('click', closeDetail);

    detailView.querySelectorAll('.m3-switch').forEach((sw) => {
      sw.addEventListener('click', () => {
        const on = sw.getAttribute('data-on') !== 'true';
        sw.setAttribute('data-on', String(on));
        sw.setAttribute('aria-checked', String(on));
        if (sw.dataset.act === 'conn') {
          setRowConnected(dev, on);
          const heroSub = detailView.querySelector('[data-hero-sub]');
          if (heroSub) heroSub.textContent = on ? (dev.batt ? `Connected • ${dev.batt}% battery` : 'Connected') : 'Saved';
          const label = sw.closest('.dialog-row-item').querySelector('.dialog-row-title');
          if (label) label.textContent = on ? 'Connected' : 'Connect';
        }
      });
    });

    const forgetBtn = detailView.querySelector('[data-act="forget"]');
    if (forgetBtn) {
      forgetBtn.addEventListener('click', () => {
        dev.row.remove();
        closeDetail(true);
      });
    }
  }

  document.querySelectorAll('.modal-content-container').forEach((container) => {
    const header = container.querySelector(':scope > .modal-header-row');
    const list = container.querySelector(':scope > .dialog-rows-list');
    const footer = container.querySelector(':scope > .modal-actions-footer');
    if (!header || !list) return; // not a device sheet

    // build sliding track: [ list view | detail view ], footer stays put
    const track = document.createElement('div');
    track.className = 'sheet-track';
    const listView = document.createElement('div');
    listView.className = 'sheet-view sheet-view-list';
    const detailView = document.createElement('div');
    detailView.className = 'sheet-view sheet-view-detail';
    container.insertBefore(track, footer || null);
    track.appendChild(listView);
    track.appendChild(detailView);
    listView.appendChild(header);
    listView.appendChild(list);

    function ensureEmpty() {
      const rows = list.querySelectorAll('.dialog-row-item');
      let empty = list.querySelector('.bt-empty');
      if (rows.length === 0 && !empty) {
        empty = document.createElement('div');
        empty.className = 'bt-empty';
        empty.textContent = 'No paired devices — tap Pair to add one.';
        list.appendChild(empty);
      } else if (rows.length > 0 && empty) {
        empty.remove();
      }
    }

    function closeDetail() {
      track.classList.remove('detail-open');
      ensureEmpty();
    }
    // standalone pages: footer Done/Cancel resolve back to the list through this
    container._btCloseDetail = closeDetail;

    list.querySelectorAll('.dialog-row-settings-btn').forEach((gear) => {
      gear.addEventListener('click', (e) => {
        e.stopPropagation();
        const row = gear.closest('.dialog-row-item');
        if (!row) return;
        renderDetail(detailView, parseDevice(row), closeDetail);
        // restart stagger entrance for detail rows
        detailView.querySelectorAll('.dialog-row-item, .bt-hero').forEach((el, i) => {
          el.style.animation = 'none';
          void el.offsetWidth;
          el.style.animation = '';
          el.style.animationDelay = `${Math.min(i * 0.04, 0.2)}s`;
        });
        track.classList.add('detail-open');
      });
    });

    // reopening the sheet always lands back on the list
    const trigger = document.getElementById('bluetoothOpenModal');
    if (trigger) trigger.addEventListener('click', () => track.classList.remove('detail-open'));
  });
})();
