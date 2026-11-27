/* ------------------------------------------------------------
   ARCADE — five local puzzles, local scores, local badges.
   No network, no accounts, no tracking.
   ------------------------------------------------------------ */
(function () {
  'use strict';

  var STORE_KEY = 'priyanshkk.arcade.v1';
  var BADGES = [
    { id: 'first', label: 'FIRST ROUND', title: 'Complete any game' },
    { id: 'clean', label: 'CLEAN SWEEP', title: 'Memory board in 10 moves or fewer' },
    { id: 'daily', label: 'DAILY GRID', title: 'Solve the date-seeded slide puzzle' },
    { id: 'typist', label: 'TYPE RUSH', title: 'Reach 40 WPM in Type Sprint' },
    { id: 'sharp', label: 'SHARP MIND', title: 'Score 6+ in Signal Quiz' },
    { id: 'lightning', label: 'LIGHTNING', title: 'Average under 450 ms in Reflex Grid' }
  ];

  var MEMORY_SYMBOLS = ['⌘', '</>', '{}', 'AI', 'PY', 'TS', '⚡', '◈', '◉', '◇', '↗', '★'];

  var TYPE_WORDS = [
    'python', 'fastapi', 'docker', 'rag', 'cli', 'react', 'typescript', 'github',
    'actions', 'privacy', 'offline', 'vector', 'embedding', 'latency', 'prompt',
    'workflow', 'compose', 'validator', 'opensource', 'static', 'sre',
    'observability', 'carbon', 'finops', 'gsap', 'threejs', 'lenis',
    'glassmorphism', 'terminal', 'automation', 'deterministic', 'groundedness',
    'citations', 'webhook', 'statuspage', 'puzzle', 'arcade', 'memory',
    'reflex', 'sprint', 'renderer', 'pipeline'
  ];

  var QUESTIONS = [
    {
      q: 'Which language powers most of Priyanshu’s CLI tools?',
      options: ['TypeScript', 'Python', 'Rust', 'Go'],
      answer: 1,
      explain: 'Python is the default for the offline-first CLI tools, with stdlib-only designs in several repos.'
    },
    {
      q: 'What does WorkflowGuard lint?',
      options: ['Docker Compose files', '.env files', 'GitHub Actions workflows', 'CSS animations'],
      answer: 2,
      explain: 'WorkflowGuard is an offline GitHub Actions risk linter for pins, tokens, shell injection and pwn-requests.'
    },
    {
      q: 'Which repo validates .env files?',
      options: ['EnvGuard', 'SafePath', 'GitWhisper', 'Carbon Ledger'],
      answer: 0,
      explain: 'EnvGuard catches example drift, placeholders, invalid values and undocumented source usage.'
    },
    {
      q: 'What does RAG stand for?',
      options: ['Rapid API Gateway', 'Retrieval-Augmented Generation', 'Runtime Asset Graph', 'Responsive Auto Grid'],
      answer: 1,
      explain: 'Retrieval-Augmented Generation grounds a model answer in fetched contexts.'
    },
    {
      q: 'Which new tool audits whether a RAG answer is actually grounded?',
      options: ['privacy-lens', 'rag-audit', 'status-sentinel', 'carbon-ledger'],
      answer: 1,
      explain: 'rag-audit checks citation validity, groundedness and context utilization offline.'
    },
    {
      q: 'Which library renders the drivable 3D toy world?',
      options: ['Three.js', 'jQuery', 'D3.js', 'Chart.js'],
      answer: 0,
      explain: 'The playground world is a custom Three.js scene driven by plain JavaScript.'
    },
    {
      q: 'What does privacy-lens scan?',
      options: ['Running processes', 'Saved HTML pages', 'Docker images', 'Git commits'],
      answer: 1,
      explain: 'It statically scans saved HTML for trackers, external references and fingerprinting signals.'
    },
    {
      q: 'What is the point of carbon-ledger?',
      options: ['Styling buttons', 'Estimating cloud/AI energy and CO2e from a CSV', 'Hosting short videos', 'Sorting files'],
      answer: 1,
      explain: 'It turns a workload CSV into a transparent electricity, CO2e and optional cost estimate.'
    }
  ];

  var GAME_META = {
    memory: {
      kicker: 'GAME 01 / 05', title: 'MEMORY MATRIX', label: 'MOVES',
      hint: 'Flip two cards. Find all six pairs in as few moves as you can. Your best board is saved on this device.'
    },
    slide: {
      kicker: 'GAME 02 / 05', title: 'DAILY SLIDE GRID', label: 'MOVES',
      hint: 'Tap a tile next to the empty slot, or use the arrow keys. The daily board is the same for every visitor on a given date.'
    },
    type: {
      kicker: 'GAME 03 / 05', title: 'TYPE SPRINT', label: 'WORDS',
      hint: 'Type the word and press space. You have 30 seconds. Accuracy and WPM are measured locally.'
    },
    quiz: {
      kicker: 'GAME 04 / 05', title: 'SIGNAL QUIZ', label: 'SCORE',
      hint: 'Eight quick questions about the work behind this portfolio. Streak and best score stay on this device.'
    },
    reflex: {
      kicker: 'GAME 05 / 05', title: 'REFLEX GRID', label: 'ROUNDS',
      hint: 'Wait for the green cell, then tap it. Eight rounds, average reaction time, no gadgets needed.'
    }
  };

  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };

  var storageOK = true;
  try {
    window.localStorage.setItem('priyanshkk.arcade.test', '1');
    window.localStorage.removeItem('priyanshkk.arcade.test');
  } catch (error) {
    storageOK = false;
  }

  function defaults() {
    return { plays: 0, visitSeconds: 0, bestStreak: 0, badges: [], best: {} };
  }

  function loadState() {
    var base = defaults();
    if (!storageOK) return base;
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return base;
      var saved = JSON.parse(raw);
      return {
        plays: Math.max(0, Number(saved.plays) || 0),
        visitSeconds: Math.max(0, Number(saved.visitSeconds) || 0),
        bestStreak: Math.max(0, Number(saved.bestStreak) || 0),
        badges: Array.isArray(saved.badges) ? saved.badges : [],
        best: saved.best && typeof saved.best === 'object' ? saved.best : {}
      };
    } catch (error) {
      return base;
    }
  }

  var state = loadState();

  function save() {
    if (!storageOK) return;
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (error) { /* quota or private mode */ }
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function clock(seconds) {
    var total = Math.max(0, Math.floor(seconds));
    var h = Math.floor(total / 3600);
    var m = Math.floor((total % 3600) / 60);
    var s = total % 60;
    return h ? pad(h) + ':' + pad(m) + ':' + pad(s) : pad(m) + ':' + pad(s);
  }

  function shuffle(items, rand) {
    var list = items.slice();
    var random = rand || Math.random;
    for (var i = list.length - 1; i > 0; i -= 1) {
      var j = Math.floor(random() * (i + 1));
      var swap = list[i];
      list[i] = list[j];
      list[j] = swap;
    }
    return list;
  }

  function seededRandom(seed) {
    var value = (Number(seed) >>> 0) || 1;
    return function () {
      value = (value * 1664525 + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function dailySeed() {
    var now = new Date();
    return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  }

  function dayLabel() {
    return new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase();
  }

  var activeGame = 'memory';
  var playCounted = false;
  var timers = [];
  var clockStart = 0;
  var clockTimer = 0;
  var typeTimer = 0;
  var toastTimer = 0;
  var slideMode = 'daily';
  var slideTiles = [];
  var slideBlank = 8;
  var slideMoves = 0;
  var memoryFirst = null;
  var memorySecond = null;
  var memoryLock = false;
  var memoryMatched = 0;
  var memoryMoves = 0;
  var typeCurrent = '';
  var typeWords = 0;
  var typeCorrectChars = 0;
  var typeTotalChars = 0;
  var typeRunning = false;
  var typeStart = 0;
  var quizIndex = 0;
  var quizScore = 0;
  var quizStreak = 0;
  var quizAnswered = false;
  var reflexRound = 0;
  var reflexTimes = [];
  var reflexTarget = -1;
  var reflexRoundStart = 0;
  var reflexWaiting = false;
  var engaged = false;
  var lastTick = Date.now();

  function later(fn, ms) {
    var id = window.setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function clearTimers() {
    timers.forEach(function (id) { window.clearTimeout(id); });
    timers = [];
  }

  function startClock() {
    clockStart = Date.now();
    window.clearInterval(clockTimer);
    clockTimer = window.setInterval(function () {
      $('#gameTimer').textContent = clock((Date.now() - clockStart) / 1000);
    }, 250);
  }

  function stopClock() {
    window.clearInterval(clockTimer);
    clockTimer = 0;
    return clockStart ? Date.now() - clockStart : 0;
  }

  function setTimer(text) { $('#gameTimer').textContent = text; }
  function setMoves(value) { $('#gameMoves').textContent = String(value); }

  function markEngaged() {
    if (!engaged) {
      engaged = true;
      lastTick = Date.now();
    }
  }

  function markPlay() {
    markEngaged();
    if (playCounted) return;
    playCounted = true;
    state.plays += 1;
    save();
    renderStats();
  }

  function renderBadges() {
    var strip = $('#badgeStrip');
    if (!strip) return;
    strip.innerHTML = '';
    BADGES.forEach(function (badge) {
      var chip = document.createElement('span');
      var unlocked = state.badges.indexOf(badge.id) !== -1;
      chip.className = 'badge-chip' + (unlocked ? ' is-unlocked' : '');
      chip.textContent = badge.label;
      chip.title = badge.title;
      strip.appendChild(chip);
    });
  }

  function renderStats() {
    $('#arcadeTime').textContent = clock(state.visitSeconds);
    $('#arcadePlays').textContent = pad(state.plays);
    $('#arcadeStreak').textContent = String(state.bestStreak);
    $('#arcadeBadges').textContent = state.badges.length + '/' + BADGES.length;
    renderBadges();
  }

  function toast(message) {
    var el = $('#arcadeToast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { el.classList.remove('is-visible'); }, 2800);
  }

  function unlockBadge(id) {
    if (state.badges.indexOf(id) !== -1) return;
    var badge = BADGES.filter(function (item) { return item.id === id; })[0];
    if (!badge) return;
    state.badges.push(id);
    save();
    renderStats();
    toast('BADGE UNLOCKED — ' + badge.label);
  }

  function bestText(game) {
    var best = state.best[game];
    if (!best) return '—';
    if (game === 'memory' || game === 'slide') return best.moves + ' MOVES';
    if (game === 'type') return best.wpm + ' WPM';
    if (game === 'quiz') return best.score + '/' + QUESTIONS.length;
    if (game === 'reflex') return best.avg + ' MS';
    return '—';
  }

  function updateBest() { $('#gameBest').textContent = bestText(activeGame); }

  function commitBest(game, candidate, isBetter) {
    var current = state.best[game];
    if (current && !isBetter(candidate, current)) return false;
    state.best[game] = candidate;
    save();
    updateBest();
    return true;
  }

  function showResult(tag, value, note) {
    var box = $('#arcadeResult');
    $('#resultTag').textContent = tag + (note ? ' · ' + note : '');
    $('#resultValue').textContent = value;
    box.hidden = false;
    box.classList.remove('is-pop');
    void box.offsetWidth;
    box.classList.add('is-pop');
  }

  function cleanup() {
    clearTimers();
    window.clearInterval(clockTimer);
    window.clearInterval(typeTimer);
    clockTimer = 0;
    typeTimer = 0;
    clockStart = 0;
    $('#arcadeResult').hidden = true;
    $$('.game-panel').forEach(function (panel) { panel.hidden = true; });
    $$('.arcade__tab').forEach(function (tab) {
      var isActive = tab.getAttribute('data-game') === activeGame;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  /* -------------------- MEMORY -------------------- */
  function initMemory() {
    playCounted = false;
    memoryFirst = null;
    memorySecond = null;
    memoryLock = false;
    memoryMatched = 0;
    memoryMoves = 0;
    setMoves(0);
    setTimer('00:00');
    updateBest();

    var deck = [];
    MEMORY_SYMBOLS.forEach(function (symbol, index) {
      deck.push({ symbol: symbol, pair: index });
      deck.push({ symbol: symbol, pair: index });
    });

    var grid = $('#memoryGrid');
    grid.innerHTML = '';
    shuffle(deck).forEach(function (card) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'memory-card';
      button.setAttribute('data-pair', String(card.pair));
      button.setAttribute('data-symbol', card.symbol);
      button.setAttribute('aria-label', 'Hidden card');

      var front = document.createElement('span');
      front.className = 'memory-card__face memory-card__front';
      front.textContent = '?';
      var back = document.createElement('span');
      back.className = 'memory-card__face memory-card__back';
      back.textContent = card.symbol;
      button.appendChild(front);
      button.appendChild(back);
      grid.appendChild(button);
    });
  }

  function finishMemory() {
    var ms = stopClock();
    var candidate = { moves: memoryMoves, ms: ms };
    var improved = commitBest('memory', candidate, function (a, b) {
      return a.moves < b.moves || (a.moves === b.moves && a.ms < b.ms);
    });
    showResult('MEMORY CLEAR', memoryMoves + ' MOVES · ' + (ms / 1000).toFixed(2) + 'S', improved ? 'NEW BEST' : '');
    unlockBadge('first');
    if (memoryMoves <= 10) unlockBadge('clean');
  }

  function onMemoryClick(event) {
    var card = event.target.closest('.memory-card');
    if (!card || memoryLock || card.classList.contains('is-flipped') || card.classList.contains('is-matched')) return;
    markPlay();
    if (!clockStart) startClock();
    card.classList.add('is-flipped');
    card.setAttribute('aria-label', 'Card ' + card.getAttribute('data-symbol'));

    if (!memoryFirst) {
      memoryFirst = card;
      return;
    }

    memorySecond = card;
    memoryMoves += 1;
    setMoves(memoryMoves);
    memoryLock = true;
    var first = memoryFirst;
    var second = memorySecond;

    if (first.getAttribute('data-pair') === second.getAttribute('data-pair')) {
      later(function () {
        first.classList.add('is-matched');
        second.classList.add('is-matched');
        memoryMatched += 1;
        memoryFirst = null;
        memorySecond = null;
        memoryLock = false;
        if (memoryMatched === MEMORY_SYMBOLS.length) finishMemory();
      }, 360);
    } else {
      later(function () {
        first.classList.remove('is-flipped');
        second.classList.remove('is-flipped');
        first.setAttribute('aria-label', 'Hidden card');
        second.setAttribute('aria-label', 'Hidden card');
        memoryFirst = null;
        memorySecond = null;
        memoryLock = false;
      }, 720);
    }
  }

  /* -------------------- SLIDE -------------------- */
  function slideNeighbors(index) {
    var row = Math.floor(index / 3);
    var col = index % 3;
    var result = [];
    if (row > 0) result.push(index - 3);
    if (row < 2) result.push(index + 3);
    if (col > 0) result.push(index - 1);
    if (col < 2) result.push(index + 1);
    return result;
  }

  function slideSolved(tiles) {
    for (var i = 0; i < 8; i += 1) {
      if (tiles[i] !== i + 1) return false;
    }
    return tiles[8] === 0;
  }

  function makeSlide(seed, random) {
    var tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    var blank = 8;
    var rand = random || Math.random;
    for (var step = 0; step < 160; step += 1) {
      var options = slideNeighbors(blank);
      var pick = options[Math.floor(rand() * options.length)];
      tiles[blank] = tiles[pick];
      tiles[pick] = 0;
      blank = pick;
    }
    if (slideSolved(tiles)) return makeSlide(seed + 1, rand);
    return tiles;
  }

  function renderSlide() {
    var grid = $('#slideGrid');
    grid.innerHTML = '';
    slideTiles.forEach(function (value, index) {
      if (value === 0) {
        var blank = document.createElement('div');
        blank.className = 'slide-blank';
        blank.setAttribute('aria-hidden', 'true');
        grid.appendChild(blank);
        return;
      }
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = String(value);
      button.setAttribute('data-index', String(index));
      button.setAttribute('aria-label', 'Tile ' + value);
      grid.appendChild(button);
    });
  }

  function initSlide(mode) {
    playCounted = false;
    slideMode = mode || 'daily';
    slideMoves = 0;
    var random = slideMode === 'daily' ? seededRandom(dailySeed()) : Math.random;
    slideTiles = makeSlide(dailySeed(), random);
    slideBlank = slideTiles.indexOf(0);
    setMoves(0);
    setTimer('00:00');
    updateBest();
    renderSlide();
    var chip = $('#dailyChip');
    chip.textContent = slideMode === 'daily' ? 'DAILY GRID · ' + dayLabel() : 'RANDOM GRID';
  }

  function moveSlide(index) {
    if (slideNeighbors(slideBlank).indexOf(index) === -1) return;
    markPlay();
    if (!clockStart) startClock();
    slideTiles[slideBlank] = slideTiles[index];
    slideTiles[index] = 0;
    slideBlank = index;
    slideMoves += 1;
    setMoves(slideMoves);
    renderSlide();
    if (slideSolved(slideTiles)) finishSlide();
  }

  function finishSlide() {
    var ms = stopClock();
    var candidate = { moves: slideMoves, ms: ms };
    var improved = commitBest('slide', candidate, function (a, b) {
      return a.moves < b.moves || (a.moves === b.moves && a.ms < b.ms);
    });
    showResult('GRID SOLVED', slideMoves + ' MOVES · ' + (ms / 1000).toFixed(2) + 'S', improved ? 'NEW BEST' : '');
    unlockBadge('first');
    if (slideMode === 'daily') unlockBadge('daily');
  }

  function onSlideClick(event) {
    var tile = event.target.closest('button[data-index]');
    if (!tile) return;
    moveSlide(Number(tile.getAttribute('data-index')));
  }

  function onSlideKey(event) {
    if (activeGame !== 'slide' || $('#panel-slide').hidden) return;
    var deltas = { ArrowUp: -3, ArrowDown: 3, ArrowLeft: -1, ArrowRight: 1 };
    if (!(event.key in deltas)) return;
    var delta = deltas[event.key];
    var target = slideBlank + delta;
    if (target < 0 || target > 8) return;
    if (Math.abs(delta) === 1 && Math.floor(target / 3) !== Math.floor(slideBlank / 3)) return;
    event.preventDefault();
    moveSlide(target);
  }

  /* -------------------- TYPE -------------------- */
  function pickTypeWord() {
    var next = TYPE_WORDS[Math.floor(Math.random() * TYPE_WORDS.length)];
    if (next === typeCurrent) next = TYPE_WORDS[(TYPE_WORDS.indexOf(next) + 7) % TYPE_WORDS.length];
    typeCurrent = next;
    $('#typeWord').textContent = next;
  }

  function updateTypeMeta() {
    var accuracy = typeTotalChars ? Math.round((typeCorrectChars / typeTotalChars) * 100) : 100;
    var minutes = typeStart ? (Date.now() - typeStart) / 60000 : 0;
    var wpm = minutes > 0 ? Math.round((typeCorrectChars / 5) / minutes) : 0;
    $('#typeWords').textContent = String(typeWords);
    $('#typeAccuracy').textContent = accuracy + '%';
    $('#typeWpm').textContent = String(wpm);
  }

  function initType() {
    playCounted = false;
    typeWords = 0;
    typeCorrectChars = 0;
    typeTotalChars = 0;
    typeRunning = false;
    typeStart = 0;
    window.clearInterval(typeTimer);
    typeTimer = 0;
    var input = $('#typeInput');
    input.value = '';
    input.disabled = false;
    input.classList.remove('is-correct', 'is-wrong');
    setMoves(0);
    setTimer('00:30');
    updateBest();
    updateTypeMeta();
    pickTypeWord();
    if (window.matchMedia('(pointer: fine)').matches) {
      later(function () { input.focus({ preventScroll: true }); }, 80);
    }
  }

  function startTypeTimer() {
    if (typeRunning) return;
    typeRunning = true;
    typeStart = Date.now();
    window.clearInterval(typeTimer);
    typeTimer = window.setInterval(function () {
      var left = Math.max(0, 30000 - (Date.now() - typeStart));
      setTimer(clock(Math.ceil(left / 1000)));
      if (left <= 0) finishType();
    }, 100);
  }

  function flashInput(className) {
    var input = $('#typeInput');
    input.classList.add(className);
    later(function () { input.classList.remove(className); }, 240);
  }

  function submitType() {
    var input = $('#typeInput');
    var value = input.value.trim().toLowerCase();
    if (!value) return;
    markPlay();
    typeTotalChars += value.length;
    if (value === typeCurrent.toLowerCase()) {
      typeWords += 1;
      typeCorrectChars += value.length;
      flashInput('is-correct');
      pickTypeWord();
    } else {
      flashInput('is-wrong');
    }
    input.value = '';
    setMoves(typeWords);
    updateTypeMeta();
  }

  function onTypeKeyDown(event) {
    if (activeGame !== 'type' || $('#panel-type').hidden) return;
    if (event.key.length === 1 || event.key === 'Enter' || event.key === ' ') startTypeTimer();
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      submitType();
    }
  }

  function onTypeInput() {
    if (activeGame !== 'type' || $('#panel-type').hidden) return;
    var input = $('#typeInput');
    if (input.value) startTypeTimer();
    if (input.value.trim().toLowerCase() === typeCurrent.toLowerCase()) submitType();
  }

  function finishType() {
    window.clearInterval(typeTimer);
    typeTimer = 0;
    var input = $('#typeInput');
    input.disabled = true;
    var minutes = Math.max((Date.now() - typeStart) / 60000, 1 / 60000);
    var wpm = Math.round((typeCorrectChars / 5) / minutes);
    var accuracy = typeTotalChars ? Math.round((typeCorrectChars / typeTotalChars) * 100) : 0;
    $('#typeWpm').textContent = String(wpm);
    $('#typeAccuracy').textContent = accuracy + '%';
    var candidate = { wpm: wpm, accuracy: accuracy };
    var improved = commitBest('type', candidate, function (a, b) { return a.wpm > b.wpm; });
    showResult('SPRINT COMPLETE', wpm + ' WPM · ' + accuracy + '% ACC', improved ? 'NEW BEST' : '');
    unlockBadge('first');
    if (wpm >= 40) unlockBadge('typist');
  }

  /* -------------------- QUIZ -------------------- */
  function renderQuiz() {
    var item = QUESTIONS[quizIndex];
    quizAnswered = false;
    $('#quizNum').textContent = 'QUESTION ' + pad(quizIndex + 1) + ' / ' + pad(QUESTIONS.length);
    $('#quizQuestion').textContent = item.q;
    $('#quizExplain').textContent = '';
    $('#quizNext').hidden = true;
    $('#quizNext').textContent = quizIndex === QUESTIONS.length - 1 ? 'SEE RESULT →' : 'NEXT →';

    var options = $('#quizOptions');
    options.innerHTML = '';
    item.options.forEach(function (option, index) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = option;
      button.setAttribute('data-option', String(index));
      options.appendChild(button);
    });
    updateBest();
  }

  function initQuiz() {
    playCounted = false;
    quizIndex = 0;
    quizScore = 0;
    quizStreak = 0;
    setMoves(0);
    setTimer('—');
    renderQuiz();
  }

  function onQuizClick(event) {
    var button = event.target.closest('button[data-option]');
    if (!button || quizAnswered) return;
    markPlay();
    quizAnswered = true;
    var picked = Number(button.getAttribute('data-option'));
    var item = QUESTIONS[quizIndex];
    var correct = picked === item.answer;
    if (correct) {
      quizScore += 1;
      quizStreak += 1;
      if (quizStreak > state.bestStreak) {
        state.bestStreak = quizStreak;
        save();
        renderStats();
      }
    } else {
      quizStreak = 0;
    }
    setMoves(quizScore);
    $$('#quizOptions button').forEach(function (option, index) {
      option.disabled = true;
      if (index === item.answer) option.classList.add('is-correct');
      if (index === picked && !correct) option.classList.add('is-wrong');
    });
    $('#quizExplain').textContent = item.explain;
    $('#quizNext').hidden = false;
  }

  function nextQuiz() {
    if (quizIndex < QUESTIONS.length - 1) {
      quizIndex += 1;
      renderQuiz();
      return;
    }
    var candidate = { score: quizScore };
    var improved = commitBest('quiz', candidate, function (a, b) { return a.score > b.score; });
    var percent = Math.round((quizScore / QUESTIONS.length) * 100);
    showResult('SIGNAL CHECK', quizScore + '/' + QUESTIONS.length + ' · ' + percent + '%', improved ? 'NEW BEST' : '');
    unlockBadge('first');
    if (quizScore >= 6) unlockBadge('sharp');
  }

  /* -------------------- REFLEX -------------------- */
  function renderReflex() {
    var grid = $('#reflexGrid');
    grid.innerHTML = '';
    for (var i = 0; i < 9; i += 1) {
      var button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('data-cell', String(i));
      button.setAttribute('aria-label', 'Grid cell ' + (i + 1));
      grid.appendChild(button);
    }
  }

  function initReflex() {
    playCounted = false;
    reflexRound = 0;
    reflexTimes = [];
    reflexTarget = -1;
    reflexWaiting = false;
    renderReflex();
    setMoves(0);
    setTimer('00:00');
    updateBest();
    $('#reflexStatus').textContent = 'Tap START to begin 8 rounds.';
    $('#reflexStart').hidden = false;
  }

  function nextReflexRound() {
    reflexTarget = -1;
    reflexWaiting = true;
    $$('#reflexGrid button').forEach(function (cell) { cell.classList.remove('is-hot'); });
    $('#reflexStatus').textContent = 'ROUND ' + (reflexRound + 1) + ' — wait for the signal…';
    later(function () {
      if (activeGame !== 'reflex') return;
      reflexTarget = Math.floor(Math.random() * 9);
      reflexRoundStart = Date.now();
      reflexWaiting = false;
      var cells = $$('#reflexGrid button');
      if (cells[reflexTarget]) cells[reflexTarget].classList.add('is-hot');
      $('#reflexStatus').textContent = 'ROUND ' + (reflexRound + 1) + ' — TAP NOW';
    }, 500 + Math.random() * 900);
  }

  function startReflex() {
    markPlay();
    reflexRound = 0;
    reflexTimes = [];
    $('#reflexStart').hidden = true;
    nextReflexRound();
  }

  function onReflexClick(event) {
    var cell = event.target.closest('button[data-cell]');
    if (!cell || activeGame !== 'reflex' || reflexTarget === -1) return;
    markPlay();
    var index = Number(cell.getAttribute('data-cell'));
    if (reflexWaiting) {
      $('#reflexStatus').textContent = 'Too early — wait for the glow.';
      return;
    }
    if (index !== reflexTarget) {
      $('#reflexStatus').textContent = 'Wrong cell — try again.';
      return;
    }
    var ms = Date.now() - reflexRoundStart;
    reflexTimes.push(ms);
    cell.classList.remove('is-hot');
    reflexTarget = -1;
    reflexRound += 1;
    setMoves(reflexRound);
    setTimer(clock(ms / 1000));
    $('#reflexStatus').textContent = ms + ' ms — nice.';
    if (reflexRound >= 8) {
      later(finishReflex, 500);
    } else {
      later(nextReflexRound, 650);
    }
  }

  function finishReflex() {
    var total = reflexTimes.reduce(function (sum, value) { return sum + value; }, 0);
    var avg = Math.round(total / 8);
    var candidate = { avg: avg };
    var improved = commitBest('reflex', candidate, function (a, b) { return a.avg < b.avg; });
    showResult('REFLEX CHECK', avg + ' MS AVG', improved ? 'NEW BEST' : '');
    unlockBadge('first');
    if (avg < 450) unlockBadge('lightning');
  }

  /* -------------------- SWITCHING -------------------- */
  function startGame(name) {
    if (!GAME_META[name]) return;
    cleanup();
    activeGame = name;
    var meta = GAME_META[name];
    $('#gameKicker').textContent = meta.kicker;
    $('#gameTitle').textContent = meta.title;
    $('#gameHint').textContent = meta.hint;
    $('#gameMovesLabel').textContent = meta.label;
    setMoves(0);
    setTimer(name === 'type' ? '00:30' : '00:00');
    updateBest();
    $$('.arcade__tab').forEach(function (tab) {
      var isActive = tab.getAttribute('data-game') === name;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    $$('.game-panel').forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-panel') !== name;
    });
    if (name === 'memory') initMemory();
    if (name === 'slide') initSlide(slideMode);
    if (name === 'type') initType();
    if (name === 'quiz') initQuiz();
    if (name === 'reflex') initReflex();
  }

  function restartActive() {
    if (activeGame === 'reflex') {
      initReflex();
      startReflex();
    } else {
      startGame(activeGame);
    }
  }

  function init() {
    if (!$('#arcade')) return;
    renderStats();

    $$('.arcade__tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        markEngaged();
        startGame(tab.getAttribute('data-game'));
      });
    });

    $('#memoryGrid').addEventListener('click', onMemoryClick);
    $('#slideGrid').addEventListener('click', onSlideClick);
    document.addEventListener('keydown', onSlideKey);
    $('#typeInput').addEventListener('keydown', onTypeKeyDown);
    $('#typeInput').addEventListener('input', onTypeInput);
    $('#quizOptions').addEventListener('click', onQuizClick);
    $('#quizNext').addEventListener('click', nextQuiz);
    $('#reflexGrid').addEventListener('click', onReflexClick);
    $('#reflexStart').addEventListener('click', startReflex);

    $$('[data-restart]').forEach(function (button) {
      button.addEventListener('click', function () {
        var mode = button.getAttribute('data-restart');
        if (mode === 'slide-daily') {
          startGame('slide');
          initSlide('daily');
        } else if (mode === 'slide-random') {
          startGame('slide');
          initSlide('random');
        } else {
          markEngaged();
          restartActive();
        }
      });
    });

    $('#resultAgain').addEventListener('click', function () {
      markEngaged();
      restartActive();
    });

    startGame('memory');

    window.setInterval(function () {
      var now = Date.now();
      var delta = Math.floor((now - lastTick) / 1000);
      lastTick = now;
      if (!engaged || document.hidden || delta < 1 || delta > 5) return;
      state.visitSeconds += delta;
      $('#arcadeTime').textContent = clock(state.visitSeconds);
      if (state.visitSeconds % 5 === 0) save();
    }, 1000);

    document.addEventListener('visibilitychange', function () { lastTick = Date.now(); });
    window.addEventListener('pagehide', function () { save(); });

    window.addEventListener('arcade:open', function (event) {
      var game = event && event.detail && event.detail.game;
      if (game && GAME_META[game]) {
        startGame(game);
        var section = $('#arcade');
        if (section && typeof section.scrollIntoView === 'function') {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
