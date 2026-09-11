/* kite-shell shared module — loaded in order: tiles, modal, sliders, calendar */
/* Standard Quick Settings Tiles Toggle */
    document.querySelectorAll('[data-toggle]').forEach(button => {
      button.addEventListener('click', () => {
        button.classList.toggle('active');
        const subtitle = button.querySelector('.tile-subtitle');
        if (subtitle) {
          subtitle.textContent = button.classList.contains('active') ? 'On' : 'Off';
        }
      });
    });

    /* Dialog Row Active State (Toggles all 4 corners and active styling) */
    document.querySelectorAll('[data-row-toggle]').forEach(row => {
      row.addEventListener('click', () => {
        row.classList.toggle('active');
        const subtitle = row.querySelector('.dialog-row-subtitle');
        if (subtitle) {
          if (row.classList.contains('active')) {
            subtitle.textContent = 'Connected';
          } else {
            subtitle.textContent = 'Saved';
          }
        }
      });
    });

    /* Special Case Dual Tiles (Bluetooth & Quick Share) */
    function initSplitTile(containerId, buttonId) {
      const container = document.getElementById(containerId);
      const btn = document.getElementById(buttonId);
      if (!container || !btn) return;
      const subtitle = container.querySelector('.tile-subtitle');

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        container.classList.toggle('active');
        const isActive = container.classList.contains('active');
        if (subtitle) subtitle.textContent = isActive ? 'On' : 'Off';
      });
    }
    initSplitTile('bluetoothTile', 'bluetoothToggleBtn');
    initSplitTile('quickShareTile', 'quickShareToggleBtn');
