/*
  Quiz app — app.js
  ─────────────────
  A simple trivia quiz about building apps for Meta Display Glasses.
  Three screens: start → question (repeated) → result.

  Concepts demonstrated
  ─────────────────────
  • Multi-screen navigation with a history stack      (see NAVIGATION)
  • Dynamic rendering — reusing DOM elements           (see renderQuestion)
  • Stateful UI — disabling elements after interaction (see selectAnswer)
  • Auto-focus after state change                      (see selectAnswer)
*/
(function() {
  'use strict';

  // ── Questions ─────────────────────────────────────────────────────────
  /*
    All questions are hardcoded here.
    In a real app you would fetch them from an API (see /connect-api),
    but keeping them inline makes this tutorial self-contained and
    runnable offline.

    Each question has:
      q       — the question string
      options — array of 4 answer strings
      correct — index into options[] of the right answer
  */
  var QUESTIONS = [
    {
      q: 'What is the viewport size of Meta Display Glasses?',
      options: ['480 × 480 dp', '600 × 600 dp', '720 × 720 dp', '1080 × 1080 dp'],
      correct: 1,
    },
    {
      q: 'On an additive waveguide display, which colour is fully transparent?',
      options: ['White (#fff)', 'Gray (#888)', 'Black (#000)', 'Navy (#001)'],
      correct: 2,
    },
    {
      q: 'Which device translates thumb pinch gestures into D-pad events?',
      options: ['Captouch temple pad', 'EMG wristband', 'Trackball', 'Gyroscope'],
      correct: 1,
    },
    {
      q: 'What is the maximum JavaScript bundle size target for glasses apps?',
      options: ['100 KB gzipped', '250 KB gzipped', '500 KB gzipped', '1 MB gzipped'],
      correct: 2,
    },
    {
      q: 'Which CSS property creates elevation / glow effects on an additive display?',
      options: ['box-shadow', 'filter: blur()', 'mix-blend-mode: plus-lighter', 'opacity: 0.9'],
      correct: 2,
    },
  ];

  // ── State ─────────────────────────────────────────────────────────────
  var state = {
    currentScreen:  'start',
    screenHistory:  [],
    questionIndex:  0,      // which question is currently shown (0-based)
    score:          0,      // number of correct answers so far
    answered:       false,  // has the user picked an answer for the current question?
  };

  // ── Screens ───────────────────────────────────────────────────────────
  var screens = {};

  function collectScreens() {
    document.querySelectorAll('.screen').forEach(function(el) {
      if (el.id) screens[el.id] = el;
    });
  }

  // ── Navigation ────────────────────────────────────────────────────────
  function navigateTo(screenId) {
    // The quiz has a linear flow (start → question → result) so we don't
    // need a full history stack. We keep it for structural consistency
    // with the other apps in the collection.
    Object.values(screens).forEach(function(s) { s.classList.add('hidden'); });

    if (screens[screenId]) {
      screens[screenId].classList.remove('hidden');
      state.currentScreen = screenId;
      onScreenEnter(screenId);
      focusFirst(screens[screenId]);
    }
  }

  // ── Focus ─────────────────────────────────────────────────────────────
  function focusFirst(container) {
    var el = container.querySelector('.focusable:not([disabled]):not(.hidden)');
    if (el) el.focus();
  }

  function moveFocus(direction) {
    var container = screens[state.currentScreen];
    if (!container) return;

    var focusables = Array.from(
      container.querySelectorAll('.focusable:not([disabled]):not(.hidden)')
    );
    if (!focusables.length) return;

    var idx = focusables.indexOf(document.activeElement);
    if (idx === -1) { focusFirst(container); return; }

    var next;
    if (direction === 'up' || direction === 'left') {
      next = idx > 0 ? idx - 1 : focusables.length - 1;
    } else {
      next = idx < focusables.length - 1 ? idx + 1 : 0;
    }
    focusables[next].focus();
  }

  // ── Screen lifecycle ──────────────────────────────────────────────────
  /*
    onScreenEnter() is called every time a screen becomes visible.
    Rendering is done here (not in navigateTo) so the screen always
    shows fresh data, including when returning via the back button.
  */
  function onScreenEnter(screenId) {
    if (screenId === 'question') renderQuestion();
    if (screenId === 'result')   renderResult();
  }

  // ── Quiz logic ────────────────────────────────────────────────────────
  function startQuiz() {
    state.questionIndex = 0;
    state.score         = 0;
    state.answered      = false;
    navigateTo('question');
  }

  function renderQuestion() {
    var q = QUESTIONS[state.questionIndex];
    state.answered = false;

    // Progress indicator: "Question 2 / 5"
    document.getElementById('progress').textContent =
      'Question ' + (state.questionIndex + 1) + ' / ' + QUESTIONS.length;

    document.getElementById('question-text').textContent = q.q;

    // Re-use the same four <button> elements for every question.
    // Reset them to a clean state before filling in the new options.
    var labels = ['A', 'B', 'C', 'D'];
    document.querySelectorAll('.answer-btn').forEach(function(btn, i) {
      btn.textContent  = labels[i] + '.  ' + q.options[i];
      btn.className    = 'answer-btn focusable';  // clear correct/wrong classes
      btn.disabled     = false;
      btn.dataset.answer = i;
    });

    // Hide the Next button until an answer is selected.
    var nextBtn = document.getElementById('next-btn');
    nextBtn.classList.add('hidden');
    nextBtn.classList.remove('focusable');
  }

  function selectAnswer(answerIndex) {
    // Guard: ignore extra keypresses after the first selection.
    if (state.answered) return;
    state.answered = true;

    var correct   = QUESTIONS[state.questionIndex].correct;
    var isCorrect = (answerIndex === correct);
    if (isCorrect) state.score++;

    // Visually reveal which answer was right and which was wrong.
    // Disable all buttons so the user can't change their answer.
    document.querySelectorAll('.answer-btn').forEach(function(btn, i) {
      btn.disabled = true;
      if (i === correct)                    btn.classList.add('correct');
      if (i === answerIndex && !isCorrect)  btn.classList.add('wrong');
    });

    // Show the Next button and immediately focus it.
    // This means the user only needs one more Enter press to advance.
    var nextBtn = document.getElementById('next-btn');
    nextBtn.classList.remove('hidden');
    nextBtn.classList.add('focusable');
    nextBtn.focus();
  }

  function nextQuestion() {
    state.questionIndex++;
    if (state.questionIndex >= QUESTIONS.length) {
      navigateTo('result');
    } else {
      navigateTo('question');
    }
  }

  function renderResult() {
    var total = QUESTIONS.length;
    var pct   = Math.round((state.score / total) * 100);

    document.getElementById('result-score').textContent =
      state.score + ' / ' + total;

    // Vary the feedback based on performance.
    var emoji, label;
    if (pct === 100)      { emoji = '🏆'; label = 'Perfect score!'; }
    else if (pct >= 60)   { emoji = '👍'; label = 'Well done!'; }
    else                  { emoji = '📚'; label = 'Keep studying!'; }

    document.getElementById('result-emoji').textContent = emoji;
    document.getElementById('result-label').textContent = label;
  }

  // ── Actions ───────────────────────────────────────────────────────────
  function handleAction(action, element) {
    switch (action) {
      case 'start-quiz':
        startQuiz();
        break;
      case 'select-answer':
        // data-answer is a string attribute; parseInt converts it to a number.
        selectAnswer(parseInt(element.dataset.answer, 10));
        break;
      case 'next-question':
        nextQuestion();
        break;
      case 'restart':
        startQuiz();
        break;
    }
  }

  // ── Events ────────────────────────────────────────────────────────────
  function setupEvents() {
    document.addEventListener('click', function(e) {
      var el = e.target.closest('[data-action]');
      if (el) handleAction(el.dataset.action, el);
    });

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
          // From start screen, Escape goes back to the launcher menu.
          if (state.currentScreen === 'start') {
            window.location.href = '../../index.html';
          }
          e.preventDefault();
          break;
      }
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────
  function init() {
    collectScreens();
    setupEvents();
    navigateTo('start');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
