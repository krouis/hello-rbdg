/*
  Hello app — app.js
  ──────────────────
  This file is the complete logic for the Hello app.
  It is intentionally verbose and annotated — every pattern used here
  appears in every other RBDG app, so this is the best place to learn
  how the architecture works.

  Structure
  ─────────
  1.  CONFIG       — app-wide constants
  2.  STATE        — everything the app needs to remember
  3.  SCREENS      — DOM references, show/hide logic
  4.  NAVIGATION   — screen history stack, back button
  5.  FOCUS        — D-pad / keyboard movement
  6.  STORAGE      — localStorage read/write
  7.  TOAST        — temporary status messages
  8.  ACTIONS      — what happens when buttons are pressed
  9.  EVENTS       — wiring DOM events to the above
  10. INIT         — boot sequence
*/
(function() {
  'use strict';

  // ── 1. CONFIG ────────────────────────────────────────────────────────
  var CONFIG = {
    appName:    'Hello',
    storageKey: 'rbdg_hello',  // localStorage key; unique per app
  };

  // ── 2. STATE ─────────────────────────────────────────────────────────
  /*
    All mutable app state lives in one object so it is easy to inspect
    and reason about. Never scatter state across individual variables.
  */
  var state = {
    currentScreen: 'home',   // id of the currently visible screen
    screenHistory: [],        // stack for the back button
    data: {
      waveCount: 0,           // persisted to localStorage
    },
  };

  // ── 3. SCREENS ───────────────────────────────────────────────────────
  /*
    We collect all <div class="screen"> elements once at startup.
    After that, show/hide is just toggling class="hidden" — no further
    DOM queries needed.
  */
  var screens = {};

  function collectScreens() {
    document.querySelectorAll('.screen').forEach(function(el) {
      if (el.id) screens[el.id] = el;
    });
  }

  // ── 4. NAVIGATION ────────────────────────────────────────────────────
  /*
    navigateTo() is the single function that switches between screens.
    It:
      • pushes the current screen onto the history stack (for the back btn)
      • hides all screens, reveals the target
      • calls onScreenEnter() so the screen can refresh its data
      • focuses the first interactive element (so D-pad works immediately)
  */
  function navigateTo(screenId, options) {
    options = options || {};
    var addToHistory = options.addToHistory !== false;

    if (addToHistory && state.currentScreen) {
      state.screenHistory.push(state.currentScreen);
    }

    Object.values(screens).forEach(function(s) { s.classList.add('hidden'); });

    if (screens[screenId]) {
      screens[screenId].classList.remove('hidden');
      state.currentScreen = screenId;
      onScreenEnter(screenId);
      focusFirst(screens[screenId]);
    }
  }

  function navigateBack() {
    // Pop the last screen off the history stack and go there.
    if (state.screenHistory.length > 0) {
      navigateTo(state.screenHistory.pop(), { addToHistory: false });
    }
    // If history is empty we are at the root — do nothing.
    // (The user can press ← Menu to return to the launcher.)
  }

  // ── 5. FOCUS ─────────────────────────────────────────────────────────
  /*
    The glasses have no cursor. The user moves focus with the D-pad
    (captouch swipes) or the EMG wristband (thumb pinch + wrist tilt).

    Rules:
      • Every interactive element MUST have class="focusable".
      • Focus wraps around at the top and bottom of each screen.
      • When a screen becomes visible, focus jumps to its first element.
  */
  function focusFirst(container) {
    var el = container.querySelector('.focusable:not([disabled]):not(.hidden)');
    if (el) el.focus();
  }

  function moveFocus(direction) {
    var container = screens[state.currentScreen];
    if (!container) return;

    // Gather only the elements visible and enabled on the current screen.
    var focusables = Array.from(
      container.querySelectorAll('.focusable:not([disabled]):not(.hidden)')
    );
    if (!focusables.length) return;

    var idx = focusables.indexOf(document.activeElement);
    if (idx === -1) { focusFirst(container); return; }

    // Move forward or backward with wrap-around.
    var next;
    if (direction === 'up' || direction === 'left') {
      next = idx > 0 ? idx - 1 : focusables.length - 1;
    } else {
      next = idx < focusables.length - 1 ? idx + 1 : 0;
    }
    focusables[next].focus();

    // Scroll the newly focused element into view if it is inside a
    // scrollable container (handles long lists gracefully).
    var scrollable = focusables[next].closest('.content');
    if (scrollable) {
      focusables[next].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  // ── 6. STORAGE ───────────────────────────────────────────────────────
  /*
    localStorage persists data across page reloads and app restarts.
    We serialise the whole state.data object as JSON in one key.
    Always wrap in try/catch — storage can be disabled or full.
  */
  function loadData() {
    try {
      var raw = localStorage.getItem(CONFIG.storageKey);
      if (raw) Object.assign(state.data, JSON.parse(raw));
    } catch (e) {
      console.warn('[hello] Could not load saved data:', e);
    }
  }

  function saveData() {
    try {
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(state.data));
    } catch (e) {
      console.warn('[hello] Could not save data:', e);
    }
  }

  // ── 7. TOAST ─────────────────────────────────────────────────────────
  /*
    A toast is a brief, non-blocking status message.
    It slides in from the top, stays for 2.5 s, then slides back out.
    Never use toasts for errors that require a response — use a modal.
  */
  function showToast(message, type) {
    var toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    // Reset class so the CSS transition re-triggers even on repeat calls.
    toast.className = 'toast' + (type ? ' ' + type : '');
    toast.offsetHeight; // force reflow — required for the transition to fire
    toast.classList.add('visible');
    setTimeout(function() { toast.classList.remove('visible'); }, 2500);
  }

  // ── 8. ACTIONS ───────────────────────────────────────────────────────
  /*
    All button interactions route through handleAction().
    Buttons declare what they do via data-action="<name>" in the HTML.
    The event listener below reads that attribute and calls handleAction().

    This pattern keeps the HTML readable ("what does this button do?")
    and the JS testable (actions are plain function calls).
  */
  function handleAction(action) {
    switch (action) {
      case 'back':
        navigateBack();
        break;

      case 'wave':
        // Increment the counter, persist it, and confirm with a toast.
        state.data.waveCount = (state.data.waveCount || 0) + 1;
        saveData();
        showToast('Wave #' + state.data.waveCount + ' sent! 👋', 'success');
        break;

      case 'go-about':
        navigateTo('about');
        break;
    }
  }

  /*
    onScreenEnter() runs every time a screen becomes visible.
    Use it to refresh displayed data rather than doing it in handleAction —
    that way the display is always up to date (e.g. after navigating back).
  */
  function onScreenEnter(screenId) {
    if (screenId === 'home') {
      // Update the header badge to show the running wave count.
      var indicator = document.getElementById('status-indicator');
      if (indicator && state.data.waveCount > 0) {
        indicator.textContent = '👋×' + state.data.waveCount;
      }
    }
  }

  // ── 9. EVENTS ────────────────────────────────────────────────────────
  function setupEvents() {
    /*
      Click handler: delegated to the document so we don't need to
      attach a listener to each button individually. Any element with
      data-action anywhere in the DOM will route through handleAction().
    */
    document.addEventListener('click', function(e) {
      var el = e.target.closest('[data-action]');
      if (el) handleAction(el.dataset.action);
    });

    /*
      Keyboard / D-pad handler.
      Arrow keys  →  move focus between .focusable elements
      Enter       →  activate the focused element (same as a click)
      Escape      →  go back (same as the back button)
    */
    document.addEventListener('keydown', function(e) {
      switch (e.key) {
        case 'ArrowUp':    moveFocus('up');    e.preventDefault(); break;
        case 'ArrowDown':  moveFocus('down');  e.preventDefault(); break;
        case 'ArrowLeft':  moveFocus('left');  e.preventDefault(); break;
        case 'ArrowRight': moveFocus('right'); e.preventDefault(); break;
        case 'Enter':
          if (document.activeElement && document.activeElement.classList.contains('focusable')) {
            document.activeElement.click();
          }
          e.preventDefault();
          break;
        case 'Escape':
          navigateBack();
          e.preventDefault();
          break;
      }
    });
  }

  // ── 10. INIT ─────────────────────────────────────────────────────────
  /*
    Boot sequence:
      1. Collect screen references (so show/hide is fast later)
      2. Attach event listeners
      3. Restore persisted data from localStorage
      4. Navigate to the home screen
  */
  function init() {
    collectScreens();
    setupEvents();
    loadData();
    // Small delay lets the browser finish layout before we move focus.
    setTimeout(function() {
      navigateTo('home', { addToHistory: false });
    }, 100);
  }

  // Run init once the DOM is ready.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
