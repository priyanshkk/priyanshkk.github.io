/* ============================================================
   PRIYANSHU KK — PREMIUM 3D PORTFOLIO
   Interaction layer: preloader, smooth scroll, GSAP motion,
   Three.js hero + toy world, fluid field, glitch, magnetic UI, utilities.
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
  let threeModulePromise = null;

  // One CDN request shared by the hero and the playground world.
  function loadThree() {
    if (!threeModulePromise) {
      threeModulePromise = import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');
    }
    return threeModulePromise;
  }

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
      const THREE = await loadThree();

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

      // Sci-fi depth layer: drifting star dust + reactive wireframe shards.
      const starCount = window.innerWidth < 700 ? 240 : 560;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        starPositions[i * 3] = (Math.random() - 0.5) * 28;
        starPositions[i * 3 + 1] = (Math.random() - 0.5) * 18;
        starPositions[i * 3 + 2] = -4 - Math.random() * 24;
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: 0xffffff, size: 0.032, transparent: true, opacity: 0.6,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      scene.add(stars);

      const shards = [];
      for (let i = 0; i < 4; i++) {
        const geometry = i % 2
          ? new THREE.TetrahedronGeometry(0.3, 0)
          : new THREE.OctahedronGeometry(0.28, 0);
        const shard = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
          color: i % 2 ? 0x3ee8ff : 0x8b5cf6,
          wireframe: true, transparent: true, opacity: 0.46
        }));
        shard.userData = { radius: 2.9 + i * 0.38, speed: 0.12 + i * 0.035, phase: i * 1.7 };
        shards.push(shard);
        group.add(shard);
      }

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
        stars.rotation.z = time * 0.014;
        stars.position.x += (mx * 0.2 - stars.position.x) * 0.025;
        stars.position.y += (-my * 0.16 - stars.position.y) * 0.025;
        shards.forEach(function (shard) {
          const data = shard.userData;
          const angle = time * data.speed * 6 + data.phase;
          shard.position.set(
            Math.cos(angle) * data.radius,
            Math.sin(angle * 0.72) * 0.92,
            Math.sin(angle) * data.radius * 0.5
          );
          shard.rotation.x = angle;
          shard.rotation.y = -angle * 0.6;
        });
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
     08 · SIGNAL GLITCH (Active Theory-inspired)
     ---------------------------------------------------------- */
  function initGlitch() {
    const title = document.querySelector('.hero__title');
    if (!title || reduced) return;
    const lines = Array.prototype.slice.call(title.querySelectorAll('.line > span'));
    let busy = false;

    function pulse() {
      if (busy) return;
      busy = true;
      lines.forEach(function (line, i) {
        setTimeout(function () {
          line.classList.add('is-glitching');
          setTimeout(function () { line.classList.remove('is-glitching'); }, 320);
        }, i * 85);
      });
      setTimeout(function () { busy = false; }, 620);
    }

    setTimeout(pulse, 520);
    title.addEventListener('pointerenter', pulse);
    let lastScrollPulse = 0;
    window.addEventListener('scroll', function () {
      const now = Date.now();
      if (window.scrollY < 120 && now - lastScrollPulse > 4200) {
        lastScrollPulse = now;
        pulse();
      }
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     09 · TOY WORLD / DRIVE + SMASH ARCHIVE
     Bruno Simon-inspired miniature world, custom-built here.
     ---------------------------------------------------------- */
  async function initToyWorld() {
    const canvas = document.getElementById('worldCanvas');
    const wrap = document.getElementById('worldWrap');
    if (!canvas || !wrap) return;
    const cratesEl = document.getElementById('worldCrates');
    const card = document.getElementById('worldCard');
    const cardTag = document.getElementById('worldCardTag');
    const cardTitle = document.getElementById('worldCardTitle');
    const cardText = document.getElementById('worldCardText');
    const cardLink = document.getElementById('worldCardLink');
    const hint = document.getElementById('worldHint');
    const fallback = document.getElementById('worldFallback');
    const resetBtn = document.getElementById('worldReset');

    try {
      const THREE = await loadThree();

      const renderer = new THREE.WebGLRenderer({
        canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.65));

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x050505, 0.034);
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
      camera.position.set(5.4, 5.1, 7.4);

      scene.add(new THREE.AmbientLight(0xffffff, 0.72));
      const keyLight = new THREE.DirectionalLight(0xd4ff3f, 1.55);
      keyLight.position.set(4, 8, 5);
      scene.add(keyLight);
      const rimLight = new THREE.PointLight(0x3ee8ff, 16, 18);
      rimLight.position.set(-4, 3, -3);
      scene.add(rimLight);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(14, 14),
        new THREE.MeshStandardMaterial({ color: 0x0b0d0b, roughness: 0.88, metalness: 0.12 })
      );
      ground.rotation.x = -Math.PI / 2;
      scene.add(ground);

      const grid = new THREE.GridHelper(14, 28, 0xd4ff3f, 0x223026);
      grid.material.transparent = true;
      grid.material.opacity = 0.19;
      scene.add(grid);

      const border = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(14, 0.02, 14)),
        new THREE.LineBasicMaterial({ color: 0x3ee8ff, transparent: true, opacity: 0.34 })
      );
      border.position.y = 0.01;
      scene.add(border);

      // Low-poly skyline gives the archive a miniature-world read.
      const deco = new THREE.Group();
      const decoMat = new THREE.MeshStandardMaterial({
        color: 0x151a15, emissive: 0x0b1a0b, roughness: 0.7, metalness: 0.25
      });
      for (let i = 0; i < 16; i++) {
        const h = 0.25 + Math.random() * 0.9;
        const block = new THREE.Mesh(new THREE.BoxGeometry(0.35 + Math.random() * 0.4, h, 0.35 + Math.random() * 0.4), decoMat);
        const x = (Math.random() - 0.5) * 12;
        const z = (Math.random() - 0.5) * 12;
        if (Math.abs(x) < 1.2 && Math.abs(z) < 1.2) continue;
        block.position.set(x, h / 2, z);
        deco.add(block);
      }
      scene.add(deco);

      const ramps = [];
      function addRamp(x, z, rot) {
        const ramp = new THREE.Mesh(
          new THREE.BoxGeometry(2.8, 0.12, 1.6),
          new THREE.MeshStandardMaterial({
            color: 0x8b5cf6, emissive: 0x2c1463, roughness: 0.42, metalness: 0.3
          })
        );
        ramp.position.set(x, 0.44, z);
        ramp.rotation.set(-0.27, rot, 0, 'YXZ');
        scene.add(ramp);
        ramps.push({ x: x, z: z, rot: rot, halfX: 1.4, halfZ: 0.9 });
      }
      addRamp(2.7, -1.5, 0);
      addRamp(-2.9, -3.1, Math.PI / 2);

      function rampHeightAt(x, z) {
        let height = 0;
        ramps.forEach(function (r) {
          const dx = x - r.x, dz = z - r.z;
          const c = Math.cos(r.rot), s = Math.sin(r.rot);
          const lx = dx * c + dz * s;
          const lz = -dx * s + dz * c;
          if (Math.abs(lx) < r.halfX && Math.abs(lz) < r.halfZ) {
            const t = Math.max(0, Math.min(1, (r.halfZ - lz) / (r.halfZ * 2)));
            height = Math.max(height, t * 0.62);
          }
        });
        return height;
      }

      const car = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xd4ff3f, emissive: 0x2d3c05, roughness: 0.34, metalness: 0.46
      });
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.34, 1.5), bodyMat);
      body.position.y = 0.3;
      car.add(body);
      const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.3, 0.68),
        new THREE.MeshStandardMaterial({ color: 0x101410, roughness: 0.22, metalness: 0.62 })
      );
      cabin.position.set(0, 0.57, -0.06);
      car.add(cabin);
      const wheelGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.16, 14);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.92 });
      [[-0.52, -0.48], [0.52, -0.48], [-0.52, 0.48], [0.52, 0.48]].forEach(function (w) {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(w[0], 0.19, w[1]);
        wheel.rotation.z = Math.PI / 2;
        car.add(wheel);
      });
      const headlight = new THREE.Mesh(
        new THREE.BoxGeometry(0.66, 0.07, 0.04),
        new THREE.MeshBasicMaterial({ color: 0x3ee8ff })
      );
      headlight.position.set(0, 0.34, -0.77);
      car.add(headlight);
      scene.add(car);

      const crateData = [
        {
          name: 'workflowguard', color: 0xd4ff3f, pos: [-1.7, -1.2],
          text: 'Offline GitHub Actions linter that catches unpinned actions, broad tokens and pwn-requests before they ship.'
        },
        {
          name: 'envguard', color: 0x3ee8ff, pos: [1.6, -2.6],
          text: 'Dotenv validator with example-drift detection, placeholder checks and source-code key audits.'
        },
        {
          name: 'composeguard', color: 0x8b5cf6, pos: [3.3, 0.9],
          text: 'Docker Compose validator for homelabs and CI — secrets, port conflicts and privileged containers.'
        },
        {
          name: 'gitwhisper', color: 0xd4ff3f, pos: [-2.7, 2.1],
          text: 'Privacy-first CLI that catches leaked secrets, writes clean commits and generates PR summaries offline.'
        },
        {
          name: 'finpulse-ai', color: 0x3ee8ff, pos: [0.5, 3.1],
          text: 'Self-hosted invoice and expense tracker with an AI receipt scanner and one-command Docker setup.'
        }
      ];

      const crates = crateData.map(function (data, i) {
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.72, 0.72, 0.72),
          new THREE.MeshStandardMaterial({
            color: data.color, emissive: data.color, emissiveIntensity: 0.14,
            roughness: 0.44, metalness: 0.28
          })
        );
        mesh.position.set(data.pos[0], 0.36, data.pos[1]);
        mesh.rotation.y = i * 0.55;
        mesh.userData = { data: data, alive: true, base: mesh.position.clone(), phase: i * 1.2 };
        scene.add(mesh);
        return mesh;
      });

      const bursts = [];
      function spawnBurst(position, color) {
        if (reduced) return;
        const n = 26;
        const arr = new Float32Array(n * 3);
        const vel = [];
        for (let i = 0; i < n; i++) {
          arr[i * 3] = position.x;
          arr[i * 3 + 1] = position.y;
          arr[i * 3 + 2] = position.z;
          vel.push(new THREE.Vector3(
            (Math.random() - 0.5) * 0.14,
            Math.random() * 0.16 + 0.03,
            (Math.random() - 0.5) * 0.14
          ));
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
        const points = new THREE.Points(geo, new THREE.PointsMaterial({
          color: color, size: 0.09, transparent: true, opacity: 1,
          blending: THREE.AdditiveBlending, depthWrite: false
        }));
        scene.add(points);
        bursts.push({ points: points, vel: vel, life: 1 });
      }

      let smashed = 0;
      function unlock(mesh) {
        mesh.userData.alive = false;
        scene.remove(mesh);
        spawnBurst(mesh.position, mesh.userData.data.color);
        smashed += 1;
        if (cratesEl) cratesEl.textContent = String(smashed).padStart(2, '0') + ' / 05 CRATES';
        const data = mesh.userData.data;
        if (cardTag) cardTag.textContent = 'PROJECT UNLOCKED · ' + String(smashed).padStart(2, '0');
        if (cardTitle) cardTitle.textContent = data.name;
        if (cardText) cardText.textContent = data.text;
        if (cardLink) cardLink.href = 'https://github.com/priyanshkk/' + data.name;
        if (card) {
          card.hidden = false;
          if (hasGSAP && !reduced) {
            gsap.fromTo(card, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out' });
          }
        }
        if (hint) hint.classList.add('is-hidden');
      }

      const keys = Object.create(null);
      const drivingCodes = {
        ArrowUp: 'forward', KeyW: 'forward', ArrowDown: 'back', KeyS: 'back',
        ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump'
      };
      let heading = 0;
      let speed = 0;
      let vy = 0;
      let visible = false;
      let dirty = true;

      function jump() {
        const groundY = rampHeightAt(car.position.x, car.position.z);
        if (Math.abs(car.position.y - groundY) < 0.09) {
          vy = 0.15;
          dirty = true;
        }
      }

      window.addEventListener('keydown', function (e) {
        if (!visible || !(e.code in drivingCodes)) return;
        const tag = document.activeElement && document.activeElement.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        const action = drivingCodes[e.code];
        keys[action] = true;
        dirty = true;
        if (action === 'jump') jump();
      }, { passive: false });

      window.addEventListener('keyup', function (e) {
        const action = drivingCodes[e.code];
        if (action) { keys[action] = false; dirty = true; }
      });

      window.addEventListener('blur', function () {
        Object.keys(keys).forEach(function (k) { keys[k] = false; });
        dirty = true;
      });

      wrap.querySelectorAll('[data-drive]').forEach(function (button) {
        const action = button.getAttribute('data-drive');
        const start = function (e) {
          e.preventDefault();
          keys[action] = true;
          dirty = true;
          if (action === 'jump') jump();
        };
        const stop = function () { keys[action] = false; dirty = true; };
        button.addEventListener('pointerdown', start);
        button.addEventListener('pointerup', stop);
        button.addEventListener('pointercancel', stop);
        button.addEventListener('pointerleave', stop);
      });

      function resetWorld() {
        car.position.set(0, 0, 5);
        heading = 0;
        speed = 0;
        vy = 0;
        smashed = 0;
        dirty = true;
        if (cratesEl) cratesEl.textContent = '00 / 05 CRATES';
        if (card) card.hidden = true;
        if (hint) hint.classList.remove('is-hidden');
        crates.forEach(function (mesh) {
          mesh.userData.alive = true;
          mesh.position.copy(mesh.userData.base);
          scene.add(mesh);
        });
        bursts.forEach(function (burst) {
          scene.remove(burst.points);
          burst.points.geometry.dispose();
          burst.points.material.dispose();
        });
        bursts.length = 0;
      }
      if (resetBtn) resetBtn.addEventListener('click', resetWorld);
      resetWorld();

      function updateCar() {
        if (keys.forward) speed += 0.018;
        else if (keys.back) speed -= 0.014;
        speed *= 0.945;
        speed = Math.max(-0.11, Math.min(0.16, speed));
        const steer = speed >= 0 ? 1 : -1;
        if (keys.left) heading += 0.046 * steer;
        if (keys.right) heading -= 0.046 * steer;

        const dx = Math.sin(heading);
        const dz = -Math.cos(heading);
        car.position.x = Math.max(-6.4, Math.min(6.4, car.position.x + dx * speed));
        car.position.z = Math.max(-6.4, Math.min(6.4, car.position.z + dz * speed));

        const targetY = rampHeightAt(car.position.x, car.position.z);
        vy -= 0.009;
        if (car.position.y + vy <= targetY) {
          car.position.y = targetY;
          vy = 0;
        } else {
          car.position.y += vy;
        }

        const aheadY = rampHeightAt(car.position.x + dx * 0.35, car.position.z + dz * 0.35);
        const pitch = Math.max(-0.22, Math.min(0.22, (aheadY - targetY) * 0.5));
        car.rotation.set(pitch, heading, 0, 'YXZ');
      }

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

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          if (visible) dirty = true;
        }, { threshold: 0.04 });
        io.observe(wrap);
      } else {
        visible = true;
      }

      let time = 0;
      function render() {
        requestAnimationFrame(render);
        if (!visible || document.hidden) return;
        const moving = keys.forward || keys.back || keys.left || keys.right || vy !== 0 || Math.abs(speed) > 0.001;
        if (reduced && !dirty && !moving) return;
        if (!reduced) time += 0.016;

        updateCar();

        crates.forEach(function (mesh) {
          if (!mesh.userData.alive) return;
          if (!reduced) {
            mesh.rotation.y += 0.0035;
            mesh.position.y = mesh.userData.base.y + Math.sin(time * 2 + mesh.userData.phase) * 0.06;
          }
          const ax = mesh.position.x - car.position.x;
          const az = mesh.position.z - car.position.z;
          if (ax * ax + az * az < 0.82 * 0.82 && car.position.y < 1.1) unlock(mesh);
        });

        for (let i = bursts.length - 1; i >= 0; i--) {
          const burst = bursts[i];
          const arr = burst.points.geometry.attributes.position.array;
          for (let j = 0; j < burst.vel.length; j++) {
            burst.vel[j].y -= 0.006;
            arr[j * 3] += burst.vel[j].x;
            arr[j * 3 + 1] += burst.vel[j].y;
            arr[j * 3 + 2] += burst.vel[j].z;
          }
          burst.points.geometry.attributes.position.needsUpdate = true;
          burst.life -= 0.016;
          burst.points.material.opacity = Math.max(0, burst.life);
          if (burst.life <= 0) {
            scene.remove(burst.points);
            burst.points.geometry.dispose();
            burst.points.material.dispose();
            bursts.splice(i, 1);
          }
        }

        if (!reduced) {
          deco.rotation.y = Math.sin(time * 0.16) * 0.05;
          const target = new THREE.Vector3(
            5.2 + car.position.x * 0.32,
            4.9 + car.position.y * 0.24,
            7.2 + car.position.z * 0.32
          );
          camera.position.lerp(target, 0.045);
        }
        camera.lookAt(car.position.x * 0.48, 0.42 + car.position.y * 0.3, car.position.z * 0.48);
        renderer.render(scene, camera);
        dirty = false;
      }
      render();
    } catch (error) {
      console.warn('Toy world unavailable — showing archive links.', error);
      canvas.style.display = 'none';
      if (hint) hint.hidden = true;
      if (resetBtn) resetBtn.hidden = true;
      if (fallback) fallback.hidden = false;
    }
  }

  /* ----------------------------------------------------------
     10 · FLUID FIELD / MOUSE-REACTIVE SOFT BODIES
     Lusion-inspired, rendered with plain canvas math.
     ---------------------------------------------------------- */
  function initFluid() {
    const canvas = document.getElementById('fluidCanvas');
    const wrap = document.getElementById('fluidWrap');
    if (!canvas || !wrap || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    let W = 0, H = 0, visible = true, t = 0;
    const pointer = { x: 0.5, y: 0.5 };
    const blobs = [
      { x: 0.42, y: 0.44, r: 0.3, rgb: '212,255,63', sx: 0.006, sy: 0.004 },
      { x: 0.62, y: 0.52, r: 0.26, rgb: '62,232,255', sx: 0.004, sy: 0.007 },
      { x: 0.52, y: 0.62, r: 0.24, rgb: '139,92,246', sx: 0.007, sy: 0.005 },
      { x: 0.35, y: 0.6, r: 0.2, rgb: '62,232,255', sx: 0.005, sy: 0.006 },
      { x: 0.7, y: 0.38, r: 0.22, rgb: '212,255,63', sx: 0.008, sy: 0.005 }
    ];

    function resize() {
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.floor(W * dpr));
      canvas.height = Math.max(1, Math.floor(H * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(wrap);
    else window.addEventListener('resize', resize);
    resize();

    wrap.addEventListener('pointermove', function (e) {
      const rect = wrap.getBoundingClientRect();
      pointer.x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      pointer.y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0.03 });
      io.observe(wrap);
    }

    function draw() {
      requestAnimationFrame(draw);
      if (!visible || document.hidden || !W || !H) return;
      if (!reduced) t += 0.016;
      ctx.clearRect(0, 0, W, H);

      const base = ctx.createLinearGradient(0, 0, W, H);
      base.addColorStop(0, 'rgba(139,92,246,0.10)');
      base.addColorStop(1, 'rgba(5,5,5,0)');
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = 'screen';
      blobs.forEach(function (blob, i) {
        const targetX = pointer.x + Math.sin(t * blob.sx * 60 + i) * 0.18;
        const targetY = pointer.y + Math.cos(t * blob.sy * 60 + i * 1.4) * 0.16;
        blob.x += (targetX - blob.x) * (reduced ? 1 : 0.045);
        blob.y += (targetY - blob.y) * (reduced ? 1 : 0.045);
        const x = blob.x * W;
        const y = blob.y * H;
        const radius = blob.r * Math.min(W, H) * (1 + Math.sin(t * 1.4 + i) * 0.08);
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
        g.addColorStop(0, 'rgba(' + blob.rgb + ',0.88)');
        g.addColorStop(0.52, 'rgba(' + blob.rgb + ',0.34)');
        g.addColorStop(1, 'rgba(' + blob.rgb + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';

      if (!reduced) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255,255,255,0.055)';
        for (let i = 0; i < 4; i++) {
          const radius = (t * 26 + i * 44) % 190;
          ctx.beginPath();
          ctx.arc(pointer.x * W, pointer.y * H, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    draw();
  }

  /* ----------------------------------------------------------
     11 · CONTACT PARTICLE WAVE (2D canvas, cheap & smooth)
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
     12 · EMAIL COPY + MOTION REEL
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
     13 · INLINE VIDEO + AI PALETTE + LIQUID GLASS
     ---------------------------------------------------------- */
  function initVideoEmbed() {
    const frames = document.querySelectorAll('[data-video]');
    if (!frames.length) return;

    frames.forEach(function (frame) {
      frame.addEventListener('click', function () {
        if (frame.dataset.playing === '1') return;

        // Keep only one YouTube iframe alive at a time — lighter on mobile GPUs.
        frames.forEach(function (other) {
          if (other === frame || other.dataset.playing !== '1') return;
          const old = other.querySelector('iframe');
          if (old) old.parentNode.removeChild(old);
          delete other.dataset.playing;
          other.classList.remove('is-playing');
        });

        const id = frame.dataset.video || '';
        if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return;

        const iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
        iframe.title = frame.dataset.title || 'YouTube video';
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        frame.appendChild(iframe);
        frame.dataset.playing = '1';
        frame.classList.add('is-playing');
      });
    });
  }

  function initAIPalette() {
    const palette = document.getElementById('aiPalette');
    const trigger = document.getElementById('aiTrigger');
    const input = document.getElementById('aiInput');
    const results = document.getElementById('aiResults');
    const scrim = palette ? palette.querySelector('[data-ai-close]') : null;
    if (!palette || !trigger || !input || !results) return;

    const phrases = [
      'Type to search Google, GitHub or this portfolio…',
      'Try /projects, workflowguard or Python…',
      'Jump to a section or search the web…'
    ];
    const sections = [
      { id: 'home', label: 'Home / Hero' },
      { id: 'about', label: 'About / Bio' },
      { id: 'skills', label: 'Skills / Stack' },
      { id: 'projects', label: 'Projects / Work' },
      { id: 'playground', label: 'Playground / 3D Toys' },
      { id: 'expertise', label: 'Expertise / Focus' },
      { id: 'videos', label: 'Videos / Channel' },
      { id: 'contact', label: 'Contact / Hire me' }
    ];
    const repos = [
      { slug: 'workflowguard', label: 'WorkflowGuard — CI lint + security' },
      { slug: 'composeguard', label: 'ComposeGuard — Docker Compose checks' },
      { slug: 'envguard', label: 'EnvGuard — dotenv validator' },
      { slug: 'gitwhisper', label: 'GitWhisper — commit message helper' },
      { slug: 'finpulse-ai', label: 'FinPulse AI — finance dashboard' }
    ];

    let items = [];
    let active = -1;
    let typeTimer = 0;
    let typeToken = 0;
    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function make(icon, title, hint, kind, value) {
      return { icon: icon, title: title, hint: hint, kind: kind, value: value };
    }

    function stopTyping() {
      typeToken += 1;
      clearTimeout(typeTimer);
    }

    function typePlaceholder() {
      if (!palette.classList.contains('is-open') || input.value) return;
      const token = typeToken;
      const phrase = phrases[phraseIndex];

      if (deleting) {
        charIndex -= 1;
        input.placeholder = phrase.slice(0, Math.max(charIndex, 0));
        if (charIndex <= 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % phrases.length;
          charIndex = 0;
        }
      } else {
        charIndex += 1;
        input.placeholder = phrase.slice(0, charIndex);
        if (charIndex >= phrase.length) {
          deleting = true;
          if (token === typeToken) typeTimer = setTimeout(typePlaceholder, 1400);
          return;
        }
      }
      if (token === typeToken) typeTimer = setTimeout(typePlaceholder, deleting ? 24 : 38);
    }

    function startTyping() {
      stopTyping();
      if (reduced) {
        input.placeholder = phrases[0];
        return;
      }
      deleting = false;
      charIndex = 0;
      input.placeholder = '';
      typeTimer = setTimeout(typePlaceholder, 320);
    }

    function buildResults() {
      const raw = input.value.trim();
      const sectionMode = raw.charAt(0) === '/';
      const query = raw.replace(/^\//, '').replace(/^(?:g|github)\s+/i, '').trim();
      const needle = query.toLowerCase();
      const list = [];

      if (!query) {
        list.push(make('G', 'Search Google…', 'WEB', 'google', ''));
        list.push(make('GH', 'Search GitHub / priyanshkk', 'REPOS', 'github', ''));
        ['projects', 'playground', 'videos', 'contact'].forEach(function (id) {
          const section = sections.filter(function (s) { return s.id === id; })[0];
          if (section) list.push(make('↗', section.label, 'SECTION', 'section', section.id));
        });
        return list;
      }

      const matchingSections = sections.filter(function (s) {
        return !needle || s.label.toLowerCase().indexOf(needle) !== -1 || s.id.indexOf(needle) !== -1;
      });
      const matchingRepos = repos.filter(function (r) {
        return !sectionMode && (r.slug.indexOf(needle) !== -1 || r.label.toLowerCase().indexOf(needle) !== -1);
      });

      if (sectionMode) {
        matchingSections.forEach(function (s) {
          list.push(make('↗', s.label, 'SECTION', 'section', s.id));
        });
      } else {
        list.push(make('G', 'Google: “' + query + '”', 'WEB', 'google', query));
        list.push(make('GH', 'GitHub: “' + query + '”', 'REPOS', 'github', query));
        matchingRepos.forEach(function (r) {
          list.push(make('GH', r.label, 'REPO', 'repo', r.slug));
        });
        matchingSections.forEach(function (s) {
          list.push(make('↗', s.label, 'SECTION', 'section', s.id));
        });
      }

      if (!list.length) list.push(make('↗', 'No local match — search Google', 'WEB', 'google', query));
      return list;
    }

    function addNode(parent, tag, className, text) {
      const node = document.createElement(tag);
      if (className) node.className = className;
      if (text !== undefined) node.textContent = text;
      parent.appendChild(node);
      return node;
    }

    function render() {
      items = buildResults();
      active = items.length ? 0 : -1;
      results.textContent = '';

      items.forEach(function (item, index) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'ai-result' + (index === active ? ' is-active' : '');
        button.setAttribute('role', 'option');
        button.setAttribute('aria-selected', String(index === active));
        addNode(button, 'span', 'ai-result__icon', item.icon);
        addNode(button, 'span', 'ai-result__title', item.title);
        addNode(button, 'span', 'ai-result__hint', item.hint);
        addNode(button, 'span', 'ai-result__arrow', '↗');
        button.addEventListener('pointerenter', function () { setActive(index); });
        button.addEventListener('click', function () { run(item); });
        results.appendChild(button);
      });
    }

    function setActive(index) {
      if (!items.length) return;
      active = (index + items.length) % items.length;
      const nodes = results.querySelectorAll('.ai-result');
      nodes.forEach(function (node, i) {
        const on = i === active;
        node.classList.toggle('is-active', on);
        node.setAttribute('aria-selected', String(on));
      });
      const current = nodes[active];
      if (current && typeof current.scrollIntoView === 'function') current.scrollIntoView({ block: 'nearest' });
    }

    function close(restoreFocus) {
      if (!palette.classList.contains('is-open')) return;
      palette.classList.remove('is-open');
      palette.setAttribute('aria-hidden', 'true');
      stopTyping();
      input.placeholder = phrases[0];
      if (restoreFocus !== false && trigger && document.contains(trigger)) {
        trigger.focus({ preventScroll: true });
      }
    }

    function open() {
      palette.classList.add('is-open');
      palette.setAttribute('aria-hidden', 'false');
      input.value = '';
      active = -1;
      render();
      function focusInput() {
        try { input.focus({ preventScroll: true }); } catch (error) { input.focus(); }
      }
      focusInput();
      setTimeout(focusInput, 40);
      startTyping();
    }

    function run(item) {
      if (!item) return;
      const query = (item.value || '').trim();

      if (item.kind === 'section') {
        const target = document.getElementById(item.value);
        close(false);
        if (!target) return;
        const top = target.getBoundingClientRect().top + window.scrollY - 96;
        if (lenis && typeof lenis.scrollTo === 'function') {
          lenis.scrollTo(target, { offset: -96 });
        } else {
          window.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
        }
        if (window.history && history.replaceState) history.replaceState(null, '', '#' + item.value);
        return;
      }

      let url;
      if (item.kind === 'repo') {
        url = 'https://github.com/priyanshkk/' + query;
      } else if (item.kind === 'github') {
        const githubQuery = query ? query + ' user:priyanshkk' : 'user:priyanshkk';
        url = 'https://github.com/search?q=' + encodeURIComponent(githubQuery) + '&type=repositories';
      } else {
        url = 'https://www.google.com/search?q=' + encodeURIComponent(query || 'Priyanshu Kumar priyanshkk');
      }
      close();
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    trigger.addEventListener('click', open);
    if (scrim) scrim.addEventListener('click', function () { close(); });

    input.addEventListener('input', function () {
      stopTyping();
      input.placeholder = 'Search Google, GitHub or this portfolio…';
      render();
    });

    document.addEventListener('keydown', function (e) {
      const isOpen = palette.classList.contains('is-open');
      const key = (e.key || '').toLowerCase();

      if ((e.metaKey || e.ctrlKey) && key === 'k') {
        e.preventDefault();
        if (isOpen) close(); else open();
        return;
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActive(active + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActive(active - 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        run(items[active >= 0 ? active : 0]);
      } else if (e.key === 'Tab') {
        const focusables = palette.querySelectorAll('input, button');
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  function initGlass3D() {
    if (!finePointer || reduced) return;
    document.querySelectorAll('.glass-3d').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;
        el.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        el.style.setProperty('--ry', ((px - 0.5) * 4).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - py) * 4).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--mx', '50%');
        el.style.setProperty('--my', '0%');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ----------------------------------------------------------
     14 · SAFETY + BOOT
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
    initVideoEmbed();
    initAIPalette();
    initGlass3D();
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
      initGlitch();
      initHero3D();
      initToyWorld();
      initFluid();
      initWave();
    });
    window.addEventListener('load', function () {
      if (hasST) ScrollTrigger.refresh();
    });
  }

  boot();
})();
