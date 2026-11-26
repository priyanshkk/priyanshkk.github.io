/* ============================================================
   PRIYANSHU KK — PREMIUM 3D PORTFOLIO
   Interaction layer: preloader, smooth scroll, GSAP motion,
   Three.js hero, particle wave, magnetic UI, utilities.
   Every module degrades gracefully if a CDN is unavailable.
   ============================================================ */

(function () {
  'use strict';

  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';

  if (hasST) gsap.registerPlugin(ScrollTrigger);
  if (reduced || !hasGSAP) root.classList.add('no-motion');

  const EMAIL = 'priyanshukumarpk3645736@gmail.com';
  let lenis = null;

  /* ----------------------------------------------------------
     01 · PRELOADER (0 → 100 with curtain reveal)
     ---------------------------------------------------------- */
  function runPreloader(done) {
    const pre = document.getElementById('preloader');
    if (!pre || reduced || !hasGSAP) {
      if (pre) pre.remove();
      done();
      return;
    }

    const count = document.getElementById('loadCount');
    const bar = document.getElementById('loadBar');
    const status = document.getElementById('loadStatus');
    const stages = [
      'Booting the experience…',
      'Compiling shaders…',
      'Loading assets…',
      'Waking the interface…',
      'Ready.'
    ];

    const duration = 1250;
    const start = performance.now();

    function frame(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(eased * 100);

      if (count) count.textContent = String(value).padStart(3, '0');
      if (bar) bar.style.width = value + '%';
      if (status) status.textContent = stages[Math.min(stages.length - 1, Math.floor((value / 100) * stages.length))];

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        pre.dataset.done = '1';
        gsap.to(pre, {
          yPercent: -100,
          duration: 1.05,
          ease: 'expo.inOut',
          onComplete: function () {
            if (pre.parentNode) pre.parentNode.removeChild(pre);
            if (hasST) ScrollTrigger.refresh();
          }
        });
        done();
      }
    }
    requestAnimationFrame(frame);
  }

  function heroIntro() {
    if (!hasGSAP || reduced) {
      root.classList.add('no-motion');
      return;
    }
    const tl = gsap.timeline({ delay: 0.32 });
    tl.to('.hero__title .line > span', {
      yPercent: 0,
      duration: 1.05,
      stagger: 0.09,
      ease: 'expo.out'
    });
    const fades = [].slice.call(document.querySelectorAll('.hero [data-fade]'));
    if (fades.length) {
      tl.fromTo(fades, { y: 26, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 0.85,
        stagger: 0.07,
        ease: 'power3.out'
      }, '-=0.72');
    }
  }

  /* ----------------------------------------------------------
     02 · SMOOTH SCROLL + SCROLLTRIGGER MOTION
     ---------------------------------------------------------- */
  function initSmoothScroll() {
    if (window.Lenis && !reduced) {
      lenis = new Lenis({
        duration: 1.15,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5
      });
      if (hasST) lenis.on('scroll', ScrollTrigger.update);
      if (hasGSAP) {
        gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        gsap.ticker.lagSmoothing(0);
      } else {
        const raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
    }

    // Anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (event) {
        const id = link.getAttribute('href').slice(1);
        const target = id && document.getElementById(id);
        if (!target) return;
        event.preventDefault();
        closeMenu();
        if (lenis) {
          lenis.scrollTo(target, { offset: -80, duration: 1.25 });
        } else {
          target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        }
      });
    });
  }

  function initScrollEffects() {
    // Progress bar + nav background
    const progress = document.getElementById('progress');
    const nav = document.getElementById('nav');
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = max > 0 ? window.scrollY / max : 0;
        if (progress) progress.style.width = (ratio * 100).toFixed(2) + '%';
        if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 40);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Active nav link
    const links = [].slice.call(document.querySelectorAll('.nav__links a'));
    const sections = links
      .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
      .filter(Boolean);
    if ('IntersectionObserver' in window && sections.length) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
          });
        });
      }, { rootMargin: '-38% 0px -56% 0px' });
      sections.forEach(function (section) { observer.observe(section); });
    }

    if (!hasST || reduced) return;

    // Section headings
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      gsap.from(el, {
        y: 42,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    // Generic fade-ins (hero fades are handled by the intro timeline)
    document.querySelectorAll('[data-fade]').forEach(function (el) {
      if (el.closest('.hero')) return;
      gsap.fromTo(el, { y: 24, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });

    // Contact headline reveal
    gsap.to('.contact__title .line > span', {
      yPercent: 0,
      duration: 1.15,
      stagger: 0.12,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.contact__title', start: 'top 85%', once: true }
    });

    // Stat counters
    document.querySelectorAll('[data-count]').forEach(function (el) {
      const end = parseFloat(el.getAttribute('data-count')) || 0;
      const suffix = el.getAttribute('data-suffix') || '';
      const counter = { value: 0 };
      gsap.to(counter, {
        value: end,
        duration: 1.7,
        ease: 'power2.out',
        snap: { value: 1 },
        onUpdate: function () { el.textContent = Math.round(counter.value) + suffix; },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });

    // Horizontal project archive on desktop; native scroll-snap on mobile
    const track = document.getElementById('projectTrack');
    if (track) {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 901px)', function () {
        const distance = function () {
          return Math.max(0, track.scrollWidth - window.innerWidth + 40);
        };
        const tween = gsap.to(track, {
          x: function () { return -distance(); },
          ease: 'none',
          scrollTrigger: {
            trigger: '.projects',
            start: 'top top',
            end: function () { return '+=' + distance(); },
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true
          }
        });
        return function () { tween.kill(); gsap.set(track, { clearProps: 'transform' }); };
      });

      // Subtle card-depth parallax inside the horizontal section
      gsap.utils.toArray('.project').forEach(function (card, index) {
        gsap.to(card, {
          y: index % 2 === 0 ? -12 : 12,
          ease: 'none',
          scrollTrigger: {
            trigger: '.projects',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1
          }
        });
      });
    }

    // Ambient mesh drift
    gsap.to('.ambient__mesh--one', { x: 60, y: 40, duration: 18, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.ambient__mesh--two', { x: -50, y: -30, duration: 22, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to('.ambient__mesh--three', { x: 40, y: -40, duration: 20, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }

  /* ----------------------------------------------------------
     03 · NAVIGATION MENU
     ---------------------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  function closeMenu() {
    if (!navLinks || !navToggle) return;
    navLinks.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      const open = !navLinks.classList.contains('is-open');
      navLinks.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ----------------------------------------------------------
     04 · MAGNETIC CURSOR + MAGNETIC ELEMENTS
     ---------------------------------------------------------- */
  function initCursor() {
    if (!finePointer || reduced) return;
    const cursor = document.getElementById('cursor');
    const label = document.getElementById('cursorLabel');
    if (!cursor) return;

    let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
    let cx = tx, cy = ty;

    window.addEventListener('pointermove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
      cursor.style.opacity = '1';
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cursor.style.opacity = '0'; });

    (function loop() {
      cx += (tx - cx) * 0.19;
      cy += (ty - cy) * 0.19;
      cursor.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)';
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll('[data-cursor]').forEach(function (el) {
      el.addEventListener('pointerenter', function () {
        if (label) label.textContent = el.getAttribute('data-cursor') || 'VIEW';
        cursor.classList.add('is-active');
      });
      el.addEventListener('pointerleave', function () {
        cursor.classList.remove('is-active');
        if (label) label.textContent = '';
      });
    });

    document.querySelectorAll('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        const rect = el.getBoundingClientRect();
        const dx = (e.clientX - rect.left - rect.width / 2) * 0.26;
        const dy = (e.clientY - rect.top - rect.height / 2) * 0.26;
        el.style.transform = 'translate3d(' + dx + 'px,' + dy + 'px,0)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ----------------------------------------------------------
     05 · 3D CARD TILT
     ---------------------------------------------------------- */
  function initTilt() {
    if (!finePointer || reduced) return;
    document.querySelectorAll('.tilt').forEach(function (el) {
      const isPortrait = el.classList.contains('hero__portrait');
      const base = isPortrait ? 'translateY(-50%) ' : '';
      let frame = 0, rx = 0, ry = 0;
      el.addEventListener('pointermove', function (e) {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        rx = -py * 8;
        ry = px * 8;
        if (frame) return;
        frame = requestAnimationFrame(function () {
          el.style.transform = base + 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-4px)';
          frame = 0;
        });
      });
      el.addEventListener('pointerleave', function () {
        el.style.transform = isPortrait ? 'translateY(-50%)' : '';
      });
    });
  }

  /* ----------------------------------------------------------
     06 · EXPERTISE HOVER PREVIEW
     ---------------------------------------------------------- */
  function initExpertise() {
    const list = document.getElementById('expList');
    const preview = document.getElementById('expPreview');
    const image = document.getElementById('expPreviewImg');
    if (!list || !preview || !image || !finePointer || reduced) return;

    const container = list.closest('.container');
    const rows = [].slice.call(list.querySelectorAll('.exp-row'));

    rows.forEach(function (row) {
      row.addEventListener('pointerenter', function () {
        const src = row.getAttribute('data-preview');
        if (src && image.getAttribute('src') !== src) image.setAttribute('src', src);
        preview.classList.add('is-visible');
        rows.forEach(function (other) { other.classList.toggle('is-dim', other !== row); });
      });
      row.addEventListener('pointerleave', function () {
        preview.classList.remove('is-visible');
        rows.forEach(function (other) { other.classList.remove('is-dim'); });
      });
      row.addEventListener('pointermove', function (e) {
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const halfW = preview.offsetWidth / 2;
        const halfH = preview.offsetHeight / 2;
        const x = Math.min(Math.max(e.clientX - rect.left, halfW), rect.width - halfW);
        const y = Math.min(Math.max(e.clientY - rect.top, halfH), rect.height - halfH);
        preview.style.left = x + 'px';
        preview.style.top = y + 'px';
      });
    });
  }

  /* ----------------------------------------------------------
     07 · THREE.JS INTERACTIVE HERO
     ---------------------------------------------------------- */
  async function initHero3D() {
    const canvas = document.getElementById('heroCanvas');
    const wrap = document.getElementById('heroVisual');
    if (!canvas || !wrap) return;

    try {
      const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');

      const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.35 : 1.8));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 6.6);

      const group = new THREE.Group();
      scene.add(group);

      // Outer wireframe shell
      const shell = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.58, 1),
        new THREE.MeshBasicMaterial({ color: 0xd4ff3f, wireframe: true, transparent: true, opacity: 0.32 })
      );
      group.add(shell);

      // Inner crystalline core
      const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.02, 0),
        new THREE.MeshBasicMaterial({ color: 0x8b5cf6, wireframe: true, transparent: true, opacity: 0.5 })
      );
      group.add(core);

      // Soft additive glow
      group.add(new THREE.Mesh(
        new THREE.SphereGeometry(0.92, 32, 32),
        new THREE.MeshBasicMaterial({
          color: 0x8b5cf6, transparent: true, opacity: 0.08,
          blending: THREE.AdditiveBlending, depthWrite: false
        })
      ));

      // Orbital rings
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xd4ff3f, transparent: true, opacity: 0.34 });
      const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.18, 0.008, 6, 160), ringMat);
      ringA.rotation.x = 1.15;
      group.add(ringA);
      const ringB = new THREE.Mesh(
        new THREE.TorusGeometry(2.55, 0.006, 6, 160),
        new THREE.MeshBasicMaterial({ color: 0x3ee8ff, transparent: true, opacity: 0.25 })
      );
      ringB.rotation.y = 0.9;
      group.add(ringB);

      // Particle halo
      const count = window.innerWidth < 700 ? 320 : 620;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 1.9 + Math.random() * 1.35;
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);
      }
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const halo = new THREE.Points(particleGeo, new THREE.PointsMaterial({
        color: 0x3ee8ff, size: 0.022, transparent: true, opacity: 0.72,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      group.add(halo);

      let mx = 0, my = 0, scrollSpin = 0;
      window.addEventListener('pointermove', function (e) {
        mx = (e.clientX / window.innerWidth - 0.5) * 2;
        my = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
      window.addEventListener('scroll', function () {
        scrollSpin = window.scrollY * 0.0006;
      }, { passive: true });

      function resize() {
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      }
      if ('ResizeObserver' in window) new ResizeObserver(resize).observe(wrap);
      else window.addEventListener('resize', resize);
      resize();

      let visible = true;
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
        }, { threshold: 0.01 });
        io.observe(wrap);
      }

      let time = 0;
      function render() {
        requestAnimationFrame(render);
        if (!visible || document.hidden) return;
        time += 0.0035;
        shell.rotation.y = time * 1.05 + mx * 0.3 + scrollSpin;
        shell.rotation.x = Math.sin(time * 0.7) * 0.16 - my * 0.2;
        core.rotation.y = -time * 1.5 + mx * 0.4;
        core.rotation.z = time * 0.5;
        ringA.rotation.z = time * 0.34;
        ringB.rotation.y = -time * 0.26;
        halo.rotation.y = time * 0.12;
        group.rotation.y += (mx * 0.22 + scrollSpin * 0.4 - group.rotation.y) * 0.05;
        group.rotation.x += (my * 0.12 - group.rotation.x) * 0.05;
        camera.position.x += (mx * 0.34 - camera.position.x) * 0.04;
        camera.position.y += (-my * 0.22 - camera.position.y) * 0.04;
        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
      }

      document.body.classList.add('three-ready');
      if (reduced) {
        renderer.render(scene, camera);
      } else {
        render();
      }
    } catch (error) {
      // WebGL unavailable or CDN blocked: CSS orb fallback stays visible.
      console.warn('Hero 3D unavailable — using CSS fallback.', error);
    }
  }

  /* ----------------------------------------------------------
     08 · CONTACT PARTICLE WAVE (2D canvas, cheap & smooth)
     ---------------------------------------------------------- */
  function initWave() {
    const canvas = document.getElementById('waveCanvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const section = canvas.closest('.contact');
    if (!ctx || !section) return;
    if (reduced) {
      initWaveStatic();
      return;
    }

    let W = 0, H = 0;
    function resize() {
      W = section.clientWidth;
      H = section.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      canvas.width = Math.max(1, Math.floor(W * dpr));
      canvas.height = Math.max(1, Math.floor(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(section);
    else window.addEventListener('resize', resize);
    resize();

    const cols = 27, rows = 11;
    let mx = -2, my = -2, t = 0, visible = true;

    window.addEventListener('pointermove', function (e) {
      const rect = section.getBoundingClientRect();
      mx = (e.clientX - rect.left) / rect.width;
      my = (e.clientY - rect.top) / rect.height;
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0.02 });
      io.observe(section);
    }

    function line(a, b) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = 'rgba(212,255,63,' + Math.min(0.42, (a.alpha + b.alpha) / 2) + ')';
      ctx.stroke();
    }

    function draw() {
      requestAnimationFrame(draw);
      if (!visible || document.hidden || !W || !H) return;
      t += 0.012;
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1;

      const grid = [];
      for (let j = 0; j < rows; j++) {
        grid[j] = [];
        for (let i = 0; i < cols; i++) {
          const nx = i / (cols - 1);
          const ny = j / (rows - 1);
          const baseY = H * 0.56 + (ny - 0.5) * H * 0.52;
          const wave = Math.sin(nx * 7 + t) * 17 * Math.cos(ny * 4 - t * 0.7)
            + Math.sin(ny * 9 - t * 1.1) * 9;
          const dx = nx - mx, dy = ny - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const push = Math.max(0, 1 - dist * 5) * 38;
          grid[j][i] = {
            x: nx * W,
            y: baseY + wave - push,
            alpha: 0.05 + Math.max(0, 1 - Math.abs(ny - 0.5) * 1.6) * 0.12 + Math.max(0, 1 - dist * 4) * 0.22
          };
        }
      }
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const p = grid[j][i];
          if (i < cols - 1) line(p, grid[j][i + 1]);
          if (j < rows - 1) line(p, grid[j + 1][i]);
        }
      }
    }

    draw();
  }

  // Static wave frame for reduced-motion users.
  function initWaveStatic() {
    const canvas = document.getElementById('waveCanvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const section = canvas.closest('.contact');
    if (!ctx || !section) return;
    const W = section.clientWidth, H = section.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    const cols = 27, rows = 11, t = 0.8;
    for (let j = 0; j < rows; j++) {
      ctx.beginPath();
      for (let i = 0; i < cols; i++) {
        const nx = i / (cols - 1), ny = j / (rows - 1);
        const y = H * 0.56 + (ny - 0.5) * H * 0.52
          + Math.sin(nx * 7 + t) * 17 * Math.cos(ny * 4 - t * 0.7);
        if (i === 0) ctx.moveTo(nx * W, y); else ctx.lineTo(nx * W, y);
      }
      ctx.strokeStyle = 'rgba(212,255,63,0.10)';
      ctx.stroke();
    }
  }

  /* ----------------------------------------------------------
     09 · EMAIL COPY + MOTION REEL
     ---------------------------------------------------------- */
  let toastTimer = 0;
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2400);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      throw new Error('clipboard unavailable');
    } catch (error) {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.top = '-1000px';
      document.body.appendChild(field);
      field.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(field);
      return ok;
    }
  }

  function initEmail() {
    const button = document.getElementById('copyEmail');
    if (!button) return;
    button.addEventListener('click', async function () {
      const ok = await copyText(EMAIL);
      showToast(ok ? '✓ Email copied to clipboard' : 'Copy failed — select the address manually');
    });
  }

  function initReel() {
    const reel = document.getElementById('reel');
    if (!reel || !('IntersectionObserver' in window) || reduced) return;
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const play = reel.play();
          if (play && typeof play.catch === 'function') play.catch(function () {});
        } else {
          reel.pause();
        }
      });
    }, { threshold: 0.35 });
    io.observe(reel);
  }

  /* ----------------------------------------------------------
     10 · SAFETY + BOOT
     ---------------------------------------------------------- */
  function safetyNet() {
    setTimeout(function () {
      const pre = document.getElementById('preloader');
      if (pre && !pre.dataset.done) {
        root.classList.add('no-motion');
        pre.remove();
        if (hasST) ScrollTrigger.refresh();
      }
    }, 6500);
  }

  function boot() {
    safetyNet();
    // Normalise the CSS percentage offset into GSAP's yPercent so intro tweens land at 0.
    if (hasGSAP && !reduced) {
      gsap.set('.hero__title .line > span, .contact__title .line > span', { yPercent: 108, y: 0 });
    }
    runPreloader(function () {
      heroIntro();
      initSmoothScroll();
      initScrollEffects();
      initCursor();
      initTilt();
      initExpertise();
      initEmail();
      initReel();
      initHero3D();
      initWave();
    });
    window.addEventListener('load', function () {
      if (hasST) ScrollTrigger.refresh();
    });
  }

  boot();
})();
