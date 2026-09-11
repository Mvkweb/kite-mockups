/* kite-shell shared module — loaded in order: tiles, modal, sliders, calendar */
/* Calendar Widget — nested cleaner, Mon-first, Aug 2026 default to match ref */
    (function initCalendar() {
      const grid = document.getElementById('calGrid');
      const title = document.getElementById('calTitle');
      if (!grid) return;
      let viewY = 2026, viewM = 7; // 0-indexed: 7 = August
      let selectedKey = '2026-7-19';

      const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

      function render() {
        title.textContent = `${monthNames[viewM]} ${viewY}`;
        grid.innerHTML = '';
        // Monday-first offset: JS getDay() 0=Sun -> (day+6)%7
        const first = new Date(viewY, viewM, 1);
        const offset = (first.getDay() + 6) % 7;
        const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
        const daysInPrev = new Date(viewY, viewM, 0).getDate();

        const today = new Date();
        const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

        for (let i = 0; i < 42; i++) {
          const btn = document.createElement('button');
          btn.className = 'cal-day';
          let d, m = viewM, y = viewY, other = false;

          if (i < offset) {
            d = daysInPrev - offset + 1 + i;
            m = viewM - 1; other = true;
            if (m < 0) { m = 11; y--; }
          } else if (i >= offset + daysInMonth) {
            d = i - (offset + daysInMonth) + 1;
            m = viewM + 1; other = true;
            if (m > 11) { m = 0; y++; }
          } else {
            d = i - offset + 1;
          }

          const key = `${y}-${m}-${d}`;
          btn.textContent = d;
          // stable expressive shape per date (s0 = circle, s1-s4 = blobs)
          btn.classList.add('s' + ((d * 5 + m * 3 + y) % 5));
          if (other) btn.classList.add('other');
          if (key === selectedKey) btn.classList.add('selected');
          if (key === todayKey) btn.classList.add('today');

          btn.addEventListener('click', () => {
            selectedKey = key;
            // if tapped other-month day, navigate
            if (other) {
              viewY = y; viewM = m;
            }
            render();
          });
          grid.appendChild(btn);
        }
        // Trim to 6 or 5 rows automatically: hide last row if all other-month
        const cells = [...grid.children];
        const lastRow = cells.slice(35);
        const needs6 = lastRow.some(c => !c.classList.contains('other'));
        lastRow.forEach(c => c.style.display = needs6 ? '' : 'none');
      }

      document.getElementById('calPrev').addEventListener('click', () => {
        viewM--; if (viewM < 0) { viewM = 11; viewY--; } render();
      });
      document.getElementById('calNext').addEventListener('click', () => {
        viewM++; if (viewM > 11) { viewM = 0; viewY++; } render();
      });

      // shell date in header
      const sd = document.getElementById('shellDate');
      if (sd) {
        try {
          sd.textContent = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        } catch (_) {}
      }

      render();
    })();
