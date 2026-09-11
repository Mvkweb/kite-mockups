/* kite-shell shared module — loaded in order: tiles, modal, sliders, calendar */
/* Slider Engine */
    function createSmoothSlider(wrapperId, initialVal, onValueChange) {
      const wrap = document.getElementById(wrapperId);
      if (!wrap) return { setVal(){}, getVal: () => initialVal, rerender(){} };
      const filled = wrap.querySelector('.slider-filled');
      if (!filled) return { setVal(){}, getVal: () => initialVal, rerender(){} };
      let isDragging = false;
      let val = initialVal;

      function render(ratio) {
        val = Math.max(0, Math.min(1, ratio));
        const usableWidth = wrap.offsetWidth - 8;
        const widthPx = Math.round(usableWidth * val);

        filled.style.width = `${widthPx}px`;

        if (val === 0) {
          wrap.setAttribute('data-pos', '0');
        } else if (val === 1) {
          wrap.setAttribute('data-pos', '1');
        } else {
          wrap.removeAttribute('data-pos');
        }

        if (onValueChange) onValueChange(val);
      }

      function handlePointer(e) {
        const rect = wrap.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const relativeX = clientX - rect.left;
        render(relativeX / rect.width);
      }

      wrap.addEventListener('pointerdown', (e) => {
        isDragging = true;
        wrap.classList.add('active');
        wrap.setPointerCapture(e.pointerId);
        handlePointer(e);
      });

      wrap.addEventListener('pointermove', (e) => {
        if (isDragging) handlePointer(e);
      });

      const endPointer = (e) => {
        if (isDragging) {
          isDragging = false;
          wrap.classList.remove('active');
          try { wrap.releasePointerCapture(e.pointerId); } catch (_) {}
        }
      };

      wrap.addEventListener('pointerup', endPointer);
      wrap.addEventListener('pointercancel', endPointer);

      window.addEventListener('resize', () => render(val));
      window.addEventListener('orientationchange', () => setTimeout(() => render(val), 50));
      // Initial render can run before layout/fonts are ready (esp. on refresh),
      // so re-render once layout settles.
      render(val);
      requestAnimationFrame(() => render(val));

      return {
        setVal: (newVal) => render(newVal),
        getVal: () => val,
        rerender: () => render(val)
      };
    }

    const brightnessSlider = createSmoothSlider('brightnessSlider', 0.66, (val) => {
      const icon = document.getElementById('brightnessIcon');
      if (val < 0.3) {
        icon.textContent = 'brightness_low';
      } else if (val < 0.7) {
        icon.textContent = 'brightness_6';
      } else {
        icon.textContent = 'brightness_high';
      }
    });

    const volumeSlider = createSmoothSlider('volumeSlider', 0.45, (val) => {
      const filledIcon = document.getElementById('volumeIconFilled');
      const remainingIcon = document.getElementById('volumeIconRemaining');

      if (val === 0) {
        filledIcon.style.display = 'none';
        remainingIcon.style.display = 'inline-block';
      } else {
        filledIcon.style.display = 'inline-block';
        remainingIcon.style.display = 'none';
        filledIcon.textContent = val < 0.5 ? 'volume_down' : 'volume_up';
      }
    });

    // Re-render sliders once everything (fonts, layout, restore) settles.
    // This makes refresh identical to fresh open.
    function rerenderAllSliders() {
      try { brightnessSlider.rerender(); } catch (_) {}
      try { volumeSlider.rerender(); } catch (_) {}
    }
    window.addEventListener('load', rerenderAllSliders);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => rerenderAllSliders()).catch(() => {});
    }
    setTimeout(rerenderAllSliders, 100);
