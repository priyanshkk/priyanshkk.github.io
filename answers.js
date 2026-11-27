/* ------------------------------------------------------------
   INLINE ANSWER ENGINE
   Curated local answers -> on-page retrieval -> honest fallback.
   No API key, no backend, no network request for local answers.
   ------------------------------------------------------------ */
(function () {
  'use strict';

  var form = document.getElementById('webSearchForm');
  var input = document.getElementById('webSearchInput');
  var box = document.getElementById('answerBox');
  if (!form || !input || !box) return;

  var labelEl = document.getElementById('answerLabel');
  var sourceEl = document.getElementById('answerSource');
  var questionEl = document.getElementById('answerQuestion');
  var bodyEl = document.getElementById('answerBody');
  var actionsEl = document.getElementById('answerActions');
  var closeEl = document.getElementById('answerClose');
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hideTimer = 0;
  var corpus = null;

  var URLS = {
    github: 'https://github.com/priyanshkk',
    linkedin: 'https://www.linkedin.com/in/priyanshu-kumar-a195ba271/',
    instagram: 'https://www.instagram.com/priyanshu.k_/',
    facebook: 'https://www.facebook.com/priyanshu.kk.3',
    youtube: 'https://www.youtube.com/@priyanshu.kk.3',
    email: 'mailto:priyanshukumarpk3645736@gmail.com'
  };

  function link(label, href) { return { label: label, href: href }; }

  var INTENTS = [
    {
      id: 'workflowguard',
      terms: ['workflowguard', 'workflow guard', 'actions linter', 'ci linter', 'supply chain linter'],
      title: 'WorkflowGuard',
      lines: [
        'WorkflowGuard is an offline GitHub Actions risk linter. It flags unsafe pins, risky tokens, shell injection and pwn-request patterns before a workflow ships.',
        'It has 24 passing tests across Python 3.10, 3.11 and 3.12, plus a live browser demo and its own GitHub Pages site.'
      ],
      links: [link('OPEN REPO', URLS.github + '/workflowguard'), link('LIVE DEMO', 'https://priyanshkk.github.io/workflowguard/')]
    },
    {
      id: 'rag-audit',
      terms: ['rag-audit', 'rag audit', 'groundedness', 'citation validity', 'context utilization'],
      title: 'RAG Audit',
      lines: [
        'rag-audit checks whether a retrieval-augmented answer is actually supported by its sources: citation validity, groundedness and context utilization.',
        'It is a stdlib-first Python CLI with 19 tests and CI on Python 3.10–3.12.'
      ],
      links: [link('OPEN REPO', URLS.github + '/rag-audit'), link('SEE WORK', '#projects')]
    },
    {
      id: 'rag-concept',
      terms: ['rag', 'retrieval augmented', 'retrieval-augmented', 'stand for', 'grounded generation'],
      pattern: /\brag\b|\bretrieval/i,
      title: 'RAG, in one line',
      lines: [
        'RAG stands for Retrieval-Augmented Generation: fetch relevant context first, then generate an answer grounded in that context.',
        'On this site, rag-audit is the tool that checks whether those citations really support the answer.'
      ],
      links: [link('RAG AUDIT', URLS.github + '/rag-audit'), link('AI / RAG WORK', '#expertise')]
    },
    {
      id: 'privacy-lens',
      terms: ['privacy-lens', 'privacy lens', 'tracker scanner', 'fingerprinting', 'saved html'],
      title: 'Privacy Lens',
      lines: [
        'privacy-lens statically scans saved HTML pages for trackers, external references and fingerprinting signals — without opening a browser or sending pages anywhere.',
        'It ships with 23 tests and runs in CI on Python 3.10, 3.11 and 3.12.'
      ],
      links: [link('OPEN REPO', URLS.github + '/privacy-lens')]
    },
    {
      id: 'status-sentinel',
      terms: ['status-sentinel', 'status sentinel', 'incident diff', 'statuspage', 'uptime alert'],
      title: 'Status Sentinel',
      lines: [
        'status-sentinel watches status pages and turns incident changes into concise diff alerts, so an update is visible without refreshing five tabs.',
        'It is an offline-first Python tool with 35 tests and a documented CLI.'
      ],
      links: [link('OPEN REPO', URLS.github + '/status-sentinel')]
    },
    {
      id: 'carbon-ledger',
      terms: ['carbon-ledger', 'carbon ledger', 'co2', 'co2e', 'energy estimate', 'cloud emissions'],
      title: 'Carbon Ledger',
      lines: [
        'carbon-ledger turns a workload CSV into a transparent electricity, CO2e and optional cost estimate using explicit region and workload assumptions.',
        'It has 19 tests and keeps the math auditable instead of hiding it behind a black box.'
      ],
      links: [link('OPEN REPO', URLS.github + '/carbon-ledger')]
    },
    {
      id: 'runlog-lens',
      terms: ['runlog-lens', 'runlog lens', 'ci log', 'failure cause', 'flaky step', 'slow step'],
      title: 'Runlog Lens',
      lines: [
        'runlog-lens reads saved CI logs offline and labels each finding as CI-caused, code-caused, flaky or unknown, with a dominant cause per run.',
        'It also catches retry signals and slow steps, then emits deterministic Markdown or JSON reports with configurable CI gates. 47 tests, Python 3.10–3.12.'
      ],
      links: [link('OPEN REPO', URLS.github + '/runlog-lens'), link('SEE WORK', '#projects')]
    },
    {
      id: 'envguard',
      terms: ['envguard', 'dotenv', '.env', 'env file', 'environment variable'],
      title: 'EnvGuard',
      lines: [
        'EnvGuard validates .env files against an example file: missing keys, placeholders, invalid values and undocumented sources all get caught locally.',
        'It is part of the privacy-first CLI set on the GitHub profile.'
      ],
      links: [link('OPEN REPO', URLS.github + '/envguard')]
    },
    {
      id: 'composeguard',
      terms: ['composeguard', 'docker compose', 'compose file'],
      title: 'ComposeGuard',
      lines: [
        'ComposeGuard checks Docker Compose files for common configuration risks before they reach a team repo or CI run.',
        'It sits alongside WorkflowGuard and EnvGuard in the developer-tools collection.'
      ],
      links: [link('OPEN REPO', URLS.github + '/composeguard')]
    },
    {
      id: 'gitwhisper',
      terms: ['gitwhisper', 'commit message'],
      title: 'GitWhisper',
      lines: [
        'GitWhisper helps turn a raw diff into a clean, conventional commit message without sending repository contents to a service.',
        'It is one of the original local-first tools on the profile.'
      ],
      links: [link('OPEN REPO', URLS.github + '/gitwhisper')]
    },
    {
      id: 'finpulse',
      terms: ['finpulse', 'finpulse-ai', 'finance dashboard', 'finance ai'],
      title: 'FinPulse AI',
      lines: [
        'FinPulse AI is a finance dashboard project in the portfolio: data views, clean UI and practical AI-assisted analysis rather than a demo screenshot.',
        'It remains pinned on the GitHub profile.'
      ],
      links: [link('OPEN REPO', URLS.github + '/finpulse-ai'), link('ALL WORK', '#projects')]
    },
    {
      id: 'tools',
      terms: ['python cli', 'cli tools', 'offline tools', 'tool list', 'what tools', 'which tools', 'shipped tools'],
      title: 'The tool shelf',
      lines: [
        'The public tools include WorkflowGuard, EnvGuard, ComposeGuard, GitWhisper, runlog-lens, rag-audit, privacy-lens, status-sentinel and carbon-ledger.',
        'Most are Python CLIs with offline-first design, MIT licence, README examples, tests and GitHub Actions CI.'
      ],
      links: [link('ALL REPOS', URLS.github), link('PROJECT CARDS', '#projects')]
    },
    {
      id: 'identity',
      terms: ['who are you', 'about you', 'your name', 'priyanshu kumar', 'what do you do', 'bio'],
      title: 'Priyanshu Kumar',
      lines: [
        'Priyanshu Kumar is an open-source developer from India with a B.Tech in Computer Science, building privacy-first CLIs, AI/RAG systems and tactile web interfaces.',
        'The work here is shipped in public: tested Python tools, honest docs and a static site with no trackers.'
      ],
      links: [link('ABOUT', '#about'), link('GITHUB', URLS.github)]
    },
    {
      id: 'skills',
      terms: ['skills', 'tech stack', 'technology', 'languages', 'python', 'typescript', 'react', 'fastapi', 'three.js', 'gsap'],
      title: 'Stack and skills',
      lines: [
        'The stack is Python and TypeScript at the core, with React, FastAPI, Three.js, GSAP, ScrollTrigger and Lenis on the interface side.',
        'AI / ML and RAG are real parts of the work, alongside security, reliability and open-source documentation.'
      ],
      links: [link('SKILLS', '#skills'), link('EXPERTISE', '#expertise')]
    },
    {
      id: 'projects',
      terms: ['projects', 'work', 'portfolio', 'what have you built', 'repo', 'repos'],
      title: 'Selected work',
      lines: [
        'The portfolio highlights tested developer tools and AI utilities: WorkflowGuard, EnvGuard, runlog-lens, rag-audit, privacy-lens, status-sentinel, carbon-ledger, GitWhisper, ComposeGuard and FinPulse AI.',
        'Each card links to a public repo with a README and CI, not a mockup.'
      ],
      links: [link('OPEN PROJECTS', '#projects'), link('GITHUB', URLS.github)]
    },
    {
      id: 'arcade',
      terms: ['arcade', 'game', 'games', 'puzzle', 'memory matrix', 'slide grid', 'type sprint', 'signal quiz', 'reflex grid', 'play'],
      title: 'Arcade',
      lines: [
        'The arcade has five local puzzles: Memory Matrix, Daily Slide Grid, Type Sprint, Signal Quiz and Reflex Grid.',
        'Scores, streaks, visit time and badges stay in this browser via localStorage — no login, leaderboard or tracker.'
      ],
      links: [link('OPEN ARCADE', '#arcade')],
      games: [
        { id: 'memory', label: 'PLAY MEMORY' },
        { id: 'type', label: 'PLAY TYPE SPRINT' }
      ]
    },
    {
      id: 'videos',
      terms: ['youtube', 'video', 'videos', 'shorts', 'channel', 'priyanshu.kk.3'],
      title: 'Videos',
      lines: [
        'The video section plays three recent shorts inline from @priyanshu.kk.3 — no redirect and no autoplay.',
        'On touch devices the embeds start muted, with an unmute hint, so the page never blasts sound unexpectedly.'
      ],
      links: [link('WATCH INLINE', '#videos'), link('FULL CHANNEL', URLS.youtube)]
    },
    {
      id: 'social',
      terms: ['instagram', 'facebook', 'social', 'linkedin', 'x twitter', 'connect'],
      title: 'Direct social links',
      lines: [
        'Direct links are always visible in the side dock: GitHub, LinkedIn, X, Instagram, Facebook and YouTube.',
        'Instagram is @priyanshu.k_ and Facebook is priyanshu.kk.3 — both open directly from the social cards.'
      ],
      links: [link('SOCIAL SECTION', '#social'), link('INSTAGRAM', URLS.instagram), link('FACEBOOK', URLS.facebook)]
    },
    {
      id: 'contact',
      terms: ['contact', 'email', 'hire', 'collaboration', 'collaborate', 'reach you', 'job', 'opportunity'],
      title: 'Get in touch',
      lines: [
        'Open to collaborations, hackathon teams and interesting open-source work. The fastest route is the email button in the contact section.',
        'Email: priyanshukumarpk3645736@gmail.com'
      ],
      links: [link('OPEN CONTACT', '#contact'), link('SEND EMAIL', URLS.email), link('LINKEDIN', URLS.linkedin)]
    },
    {
      id: 'education',
      terms: ['college', 'university', 'btech', 'b.tech', 'sandip', 'education', 'degree'],
      title: 'Education',
      lines: [
        'Priyanshu is a B.Tech CSE graduate from Sandip University in India.',
        'The structured CS background shows up in the testing, CLI design and reliability work across the repos.'
      ],
      links: [link('ABOUT', '#about')]
    },
    {
      id: 'search-help',
      terms: ['how does search work', 'what can you answer', 'ask a question', 'search help', 'quick find', 'find palette'],
      title: 'How this search works',
      lines: [
        'Type a question above and the answer appears inline: curated local answers first, then matching text from this page, then an honest web/GitHub fallback.',
        'Ctrl or Cmd + K opens Quick Find for fast jumps to sections, repos and games. Prefix a query with / for sections, g for Google or github for GitHub.'
      ],
      links: [link('TRY THE ARCADE', '#arcade')]
    }
  ];

  function compact(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function normalize(value) {
    return compact(value)
      .toLowerCase()
      .replace(/[’‘]/g, "'")
      .replace(/[?!,.:;]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function hasTerm(haystack, term) {
    var needle = normalize(term);
    if (!needle) return false;
    if (needle.indexOf(' ') === -1) {
      return new RegExp('\\b' + escapeRegExp(needle) + '\\b').test(haystack);
    }
    return haystack.indexOf(needle) !== -1;
  }

  function findCurated(raw) {
    var q = normalize(raw);
    var best = null;
    var bestScore = 0;

    INTENTS.forEach(function (intent) {
      var score = 0;
      intent.terms.forEach(function (term) {
        if (!hasTerm(q, term)) return;
        score += normalize(term).indexOf(' ') === -1 ? 2 : 3;
      });
      if (intent.pattern && intent.pattern.test(raw)) score += 2;
      if (score > bestScore) {
        bestScore = score;
        best = intent;
      }
    });

    if (bestScore < 2 || !best) return null;
    return {
      tag: 'INSTANT ANSWER',
      source: 'LOCAL',
      title: best.title,
      lines: best.lines,
      links: best.links || [],
      games: best.games || []
    };
  }

  function sectionOf(node) {
    var section = node && node.closest ? node.closest('main section, main header') : null;
    if (!section) return { id: 'home', label: 'HOME' };
    var heading = section.querySelector('h2, h1');
    return {
      id: section.id || 'home',
      label: heading ? compact(heading.textContent).toUpperCase() : (section.id || 'HOME').toUpperCase()
    };
  }

  function splitText(text) {
    var clean = compact(text);
    if (clean.length <= 300) return [clean];
    return clean.split(/(?:\.\s+|\!\s+|\?\s+)/).map(compact).filter(Boolean);
  }

  function buildCorpus() {
    if (corpus) return corpus;
    var seen = Object.create(null);
    corpus = [];

    document.querySelectorAll('main section, main header').forEach(function (section) {
      var meta = sectionOf(section);
      section.querySelectorAll('h1, h2, h3, h4, p, li, figcaption, canvas[aria-label], img[alt]').forEach(function (node) {
        if (node.closest && node.closest('#answerBox')) return;
        var rawText = node.tagName === 'IMG' ? (node.getAttribute('alt') || '')
          : (node.tagName === 'CANVAS' ? (node.getAttribute('aria-label') || '') : node.textContent);
        splitText(rawText).forEach(function (text) {
          if (text.length < 32 || text.length > 360 || seen[text]) return;
          seen[text] = true;
          corpus.push({ text: text, lower: text.toLowerCase(), section: meta, heading: /^H[1-4]$/.test(node.tagName) });
        });
      });
    });

    return corpus;
  }

  var STOPWORDS = {
    a: 1, an: 1, and: 1, are: 1, about: 1, any: 1, can: 1, do: 1, does: 1, did: 1,
    for: 1, from: 1, find: 1, give: 1, how: 1, i: 1, in: 1, is: 1, it: 1, me: 1,
    my: 1, of: 1, on: 1, or: 1, please: 1, search: 1, show: 1, tell: 1, that: 1,
    the: 1, this: 1, to: 1, was: 1, what: 1, when: 1, where: 1, which: 1, who: 1,
    why: 1, with: 1, you: 1, your: 1
  };

  function stem(word) {
    if (word.length > 4 && /(ing|ed|es)$/.test(word)) return word.replace(/(ing|ed|es)$/, '');
    if (word.length > 4 && /s$/.test(word) && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
    return word;
  }

  function queryTokens(raw) {
    return normalize(raw)
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter(function (word) { return word.length > 2 && !STOPWORDS[word]; });
  }

  function retrieveFromPage(raw) {
    var tokens = queryTokens(raw);
    if (!tokens.length) return null;

    var ranked = buildCorpus().map(function (entry) {
      var score = 0;
      tokens.forEach(function (token) {
        if (new RegExp('\\b' + escapeRegExp(token) + '\\b').test(entry.lower)) {
          score += 3;
          return;
        }
        var root = stem(token);
        if (root !== token && new RegExp('\\b' + escapeRegExp(root) + '\\b').test(entry.lower)) score += 2;
      });
      return { entry: entry, score: score + (entry.heading ? 1 : 0) };
    }).filter(function (item) { return item.score >= 3; })
      .sort(function (a, b) { return b.score - a.score; });

    if (!ranked.length) return null;

    var top = ranked.slice(0, 3);
    var links = [];
    var seenLinks = Object.create(null);
    top.forEach(function (item) {
      var id = item.entry.section.id;
      if (seenLinks[id]) return;
      seenLinks[id] = true;
      links.push(link('OPEN ' + item.entry.section.label, '#' + id));
    });

    return {
      tag: 'PAGE MATCH',
      source: 'PAGE MATCH',
      title: 'From this page',
      lines: top.map(function (item) { return item.entry.text; }),
      links: links,
      games: []
    };
  }

  function scrollToId(id) {
    var target = document.getElementById(id);
    if (!target || typeof target.scrollIntoView !== 'function') return;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    if (window.history && window.history.replaceState) window.history.replaceState(null, '', '#' + id);
  }

  function commandResult(raw) {
    var trimmed = compact(raw);

    if (trimmed.charAt(0) === '/') {
      var token = normalize(trimmed.slice(1)).split(/\s+/)[0];
      var aliases = { work: 'projects', play: 'arcade', games: 'arcade', videos: 'videos', social: 'social' };
      var id = aliases[token] || token;
      if (document.getElementById(id)) {
        scrollToId(id);
        return {
          tag: 'INSTANT ANSWER', source: 'LOCAL', title: 'OPENED ' + id.toUpperCase(),
          lines: ['Jumped to the ' + id + ' section. Ask another question above, or press Ctrl / Cmd + K for Quick Find.'],
          links: [link('BACK TO TOP', '#home')], games: []
        };
      }
    }

    var googleMatch = trimmed.match(/^(?:g|google)\s+(.+)$/i);
    if (googleMatch) {
      var googleUrl = 'https://www.google.com/search?q=' + encodeURIComponent(googleMatch[1]);
      window.open(googleUrl, '_blank', 'noopener,noreferrer');
      return {
        tag: 'FALLBACK', source: 'WEB', title: 'Web search',
        lines: ['Opened Google for “' + googleMatch[1] + '”.', 'This page answers local questions inline; everything else is handed to the web honestly.'],
        links: [link('REOPEN GOOGLE', googleUrl)], games: []
      };
    }

    var githubMatch = trimmed.match(/^(?:github|gh)\s+(.+)$/i);
    if (githubMatch) {
      var githubUrl = 'https://github.com/search?q=' + encodeURIComponent(githubMatch[1] + ' user:priyanshkk') + '&type=repositories';
      window.open(githubUrl, '_blank', 'noopener,noreferrer');
      return {
        tag: 'FALLBACK', source: 'GITHUB', title: 'GitHub search',
        lines: ['Opened GitHub search for “' + githubMatch[1] + '” inside priyanshkk repositories.'],
        links: [link('REOPEN GITHUB', githubUrl), link('PROFILE', URLS.github)], games: []
      };
    }

    return null;
  }

  function fallbackResult(raw) {
    var query = compact(raw);
    var googleUrl = 'https://www.google.com/search?q=' + encodeURIComponent(query);
    var githubUrl = 'https://github.com/search?q=' + encodeURIComponent(query + ' user:priyanshkk') + '&type=repositories';
    return {
      tag: 'FALLBACK',
      source: 'FALLBACK',
      title: 'No local match',
      lines: [
        'I could not find a local answer for “' + query + '” on this page.',
        'Try a shorter question about the projects, tools, skills, videos or games — or use one of the web searches below.'
      ],
      links: [link('SEARCH GOOGLE ↗', googleUrl), link('SEARCH GITHUB ↗', githubUrl), link('OPEN ARCADE', '#arcade')],
      games: []
    };
  }

  function addLink(href, text) {
    var anchor = document.createElement('a');
    anchor.href = href;
    anchor.textContent = text;
    if (href.charAt(0) !== '#') {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    } else {
      anchor.addEventListener('click', function () { scrollToId(href.slice(1)); });
    }
    actionsEl.appendChild(anchor);
  }

  function renderAnswer(result, raw) {
    labelEl.textContent = result.tag || 'INSTANT ANSWER';
    sourceEl.textContent = result.source || 'LOCAL';
    questionEl.textContent = 'Q · ' + compact(raw);
    bodyEl.textContent = '';
    actionsEl.textContent = '';

    bodyEl.appendChild(Object.assign(document.createElement('p'), { textContent: result.title || 'ANSWER' }));
    (result.lines || []).forEach(function (line) {
      var paragraph = document.createElement('p');
      paragraph.textContent = line;
      bodyEl.appendChild(paragraph);
    });

    (result.links || []).forEach(function (item) { addLink(item.href, item.label); });
    (result.games || []).forEach(function (game) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = game.label;
      button.addEventListener('click', function () {
        window.dispatchEvent(new CustomEvent('arcade:open', { detail: { game: game.id } }));
      });
      actionsEl.appendChild(button);
    });

    window.clearTimeout(hideTimer);
    box.hidden = false;
    if (reduced) {
      box.classList.add('is-open');
      return;
    }
    window.requestAnimationFrame(function () { box.classList.add('is-open'); });
  }

  function hide() {
    if (box.hidden) return;
    box.classList.remove('is-open');
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(function () { box.hidden = true; }, reduced ? 0 : 200);
  }

  function ask(raw) {
    var query = compact(raw);
    if (!query) {
      hide();
      input.focus();
      return;
    }
    var result = commandResult(query) || findCurated(query) || retrieveFromPage(query) || fallbackResult(query);
    renderAnswer(result, query);
  }

  if (closeEl) closeEl.addEventListener('click', hide);
  window.addEventListener('answer:ask', function (event) {
    ask(event && event.detail ? event.detail.query : input.value);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !box.hidden) hide();
  });
})();
