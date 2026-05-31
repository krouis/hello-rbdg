/*
  Launcher — app.js
  ─────────────────
  The launcher is a single-screen app grid. Its only job is to move
  focus between tiles so the D-pad works, and to let Enter follow links.

  No framework, no build step — plain ES5 so it runs in any WebView.
*/
(function() {
  'use strict';

  // ── Focus helpers ────────────────────────────────────────────────────
  /*
    The glasses have no cursor. Focus is everything.
    These two functions implement D-pad navigation across any set of
    elements that carry class="focusable".
  */

  function getAllFocusables() {
    // Collect every visible, enabled focusable element on the page.
    return Array.from(document.querySelectorAll('.focusable:not([disabled]):not(.hidden)'));
  }

  function moveFocus(direction) {
    var all = getAllFocusables();
    var idx = all.indexOf(document.activeElement);

    // If nothing is focused yet, start at the first element.
    if (idx === -1) { if (all[0]) all[0].focus(); return; }

    // Move forward or backward, wrapping around at both ends.
    var next;
    if (direction === 'up' || direction === 'left') {
      next = idx > 0 ? idx - 1 : all.length - 1;
    } else {
      next = idx < all.length - 1 ? idx + 1 : 0;
    }
    all[next].focus();
  }

  // ── Keyboard / D-pad events ──────────────────────────────────────────
  /*
    The EMG wristband translates gestures into keyboard events:
      Swipe forward/back  →  ArrowDown / ArrowUp
      Lateral swipe       →  ArrowRight / ArrowLeft
      Pinch               →  Enter
      Double pinch        →  Escape

    We intercept these keys and map them to focus movement.
    preventDefault() stops the browser from scrolling on arrow keys.
  */
  document.addEventListener('keydown', function(e) {
    switch (e.key) {
      case 'ArrowUp':    moveFocus('up');    e.preventDefault(); break;
      case 'ArrowDown':  moveFocus('down');  e.preventDefault(); break;
      case 'ArrowLeft':  moveFocus('left');  e.preventDefault(); break;
      case 'ArrowRight': moveFocus('right'); e.preventDefault(); break;
      case 'Enter':
        // Click the focused element. For <a> tiles this follows the href.
        if (document.activeElement && document.activeElement.classList.contains('focusable')) {
          document.activeElement.click();
        }
        e.preventDefault();
        break;
    }
  });

  // ── Boot ─────────────────────────────────────────────────────────────
  // Focus the first tile as soon as the page is ready.
  window.addEventListener('load', function() {
    var first = document.querySelector('.focusable');
    if (first) first.focus();
  });

})();
