/* kite-shell shared module — Bottom Sheet factory.
   Slides up from panel bottom, drag to dismiss. One shared backdrop,
   only one sheet open at a time. Add sheets by markup + one line below. */
(function initSheets() {
  const openSheets = new Set();

  function createSheet({ sheetId, triggerId, handleId }) {
    const sheet = document.getElementById(sheetId);
    const trigger = triggerId ? document.getElementById(triggerId) : null;
    const backdrop = document.getElementById('modalBackdrop');
    if (!sheet || !backdrop) return null;

    const handle = handleId ? document.getElementById(handleId) : null;
    const headerRow = sheet.querySelector('.modal-header-row');
    const cancelBtn = sheet.querySelector('[data-sheet-cancel]');
    const doneBtn = sheet.querySelector('[data-sheet-done]');

    function open() {
      openSheets.forEach((other) => { if (other !== api) other.close(); });
      sheet.style.transform = '';
      sheet.classList.add('open');
      backdrop.classList.add('open');
      openSheets.add(api);
    }

    function close() {
      sheet.classList.remove('open', 'dragging');
      sheet.style.transform = '';
      openSheets.delete(api);
      if (openSheets.size === 0) backdrop.classList.remove('open');
    }

    function isOpen() {
      return sheet.classList.contains('open');
    }

    const api = { open, close, isOpen, sheet };

    if (trigger) trigger.addEventListener('click', open);
    backdrop.addEventListener('click', close);
    if (cancelBtn) cancelBtn.addEventListener('click', close);
    if (doneBtn) doneBtn.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) close();
    });

    /* drag-to-dismiss: grab handle (or header), pull down, release to close */
    const dragSources = [handle, headerRow].filter(Boolean);
    let dragging = false;
    let startY = 0;
    let dy = 0;
    let lastY = 0;
    let lastT = 0;
    let velocity = 0;

    dragSources.forEach((src) => {
      src.addEventListener('pointerdown', (e) => {
        if (!isOpen()) return;
        dragging = true;
        startY = e.clientY;
        lastY = e.clientY;
        lastT = performance.now();
        dy = 0;
        velocity = 0;
        sheet.classList.add('dragging');
        try { src.setPointerCapture(e.pointerId); } catch (_) {}
      });

      src.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        dy = Math.max(0, e.clientY - startY);
        const now = performance.now();
        const dt = Math.max(1, now - lastT);
        velocity = (e.clientY - lastY) / dt;
        lastY = e.clientY;
        lastT = now;
        sheet.style.transform = `translateY(${dy}px)`;
      });

      const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        sheet.classList.remove('dragging');
        if (dy > 110 || velocity > 0.55) {
          close();
        } else {
          sheet.style.transform = ''; // snap back via transition
        }
        dy = 0;
        velocity = 0;
      };

      src.addEventListener('pointerup', endDrag);
      src.addEventListener('pointercancel', endDrag);
    });

    return api;
  }

  createSheet({ sheetId: 'morphWrapper', triggerId: 'bluetoothOpenModal', handleId: 'sheetHandle' });
  createSheet({ sheetId: 'quickShareWrapper', triggerId: 'quickShareOpenModal', handleId: 'qsHandle' });
})();
