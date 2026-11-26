(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Typed hero headline ---------- */
  const typed = document.getElementById("typed");
  const phrases = [
    "Priyanshu Kumar",
    "an open-source builder",
    "a privacy-first developer",
  ];
  if (typed && !reducedMotion) {
    let phraseIndex = 0;
    let charIndex = phrases[0].length;
    let deleting = true;

    const tick = () => {
      const current = phrases[phraseIndex];
      charIndex += deleting ? -1 : 1;
      typed.textContent = current.slice(0, charIndex);

      if (!deleting && charIndex === current.length) {
        deleting = true;
        window.setTimeout(tick, 1900);
        return;
      }
      if (deleting && charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        window.setTimeout(tick, 350);
        return;
      }
      window.setTimeout(tick, deleting ? 45 : 85);
    };
    window.setTimeout(tick, 2200);
  }

  /* ---------- Scroll progress + active nav ---------- */
  const progress = document.getElementById("progress");
  const sections = Array.from(document.querySelectorAll("section[id], header[id]"));
  const navLinks = Array.from(document.querySelectorAll(".nav-links a"));

  const onScroll = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const ratio = max > 0 ? doc.scrollTop / max : 0;
    if (progress) progress.style.width = `${ratio * 100}%`;

    const midpoint = doc.scrollTop + window.innerHeight * 0.35;
    let activeId = "home";
    for (const section of sections) {
      if (section.offsetTop <= midpoint) activeId = section.id;
    }
    for (const link of navLinks) {
      link.classList.toggle("active", link.getAttribute("href") === `#${activeId}`);
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navLinks");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const open = navMenu.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    navMenu.addEventListener("click", (event) => {
      if (event.target instanceof Element && event.target.closest("a")) {
        navMenu.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Reveal on scroll, skill bars, counters ---------- */
  const revealItems = document.querySelectorAll(".reveal");
  const skillItems = document.querySelectorAll(".skill");
  const counters = document.querySelectorAll("[data-count]");

  const animateCounter = (el) => {
    const target = Number(el.dataset.count || 0);
    const suffix = el.dataset.suffix || "";
    const duration = 1200;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      el.textContent = `${Math.round(target * eased)}${suffix}`;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          el.classList.add("visible");

          if (el.classList.contains("skill")) {
            const level = Number(el.dataset.level || 0);
            const fill = el.querySelector(".skill-fill");
            if (fill) {
              fill.style.setProperty("--level", `${level}%`);
              fill.style.width = reducedMotion ? `${level}%` : `${level}%`;
            }
          }
          for (const counter of el.querySelectorAll("[data-count]")) animateCounter(counter);
          if (el.matches("[data-count]")) animateCounter(el);
          obs.unobserve(el);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" },
    );
    revealItems.forEach((el) => observer.observe(el));
    skillItems.forEach((el) => observer.observe(el));
  } else {
    revealItems.forEach((el) => el.classList.add("visible"));
    skillItems.forEach((el) => {
      const fill = el.querySelector(".skill-fill");
      if (fill) fill.style.width = `${el.dataset.level || 0}%`;
    });
    counters.forEach((el) => {
      el.textContent = `${el.dataset.count || 0}${el.dataset.suffix || ""}`;
    });
  }

  /* ---------- Project card tilt ---------- */
  if (!reducedMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".project").forEach((card) => {
      card.addEventListener("mousemove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg) translateY(-4px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ---------- Copy email ---------- */
  const copyButton = document.getElementById("copyEmail");
  const toast = document.getElementById("toast");
  const email = "priyanshukumarpk3645736@gmail.com";
  let toastTimer;

  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(email);
      } catch {
        const helper = document.createElement("textarea");
        helper.value = email;
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        helper.remove();
      }
      if (toast) {
        toast.classList.add("show");
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2200);
      }
    });
  }

  /* ---------- Particle field ---------- */
  const canvas = document.getElementById("particles");
  if (canvas && !reducedMotion) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      let width = 0;
      let height = 0;
      let particles = [];
      const pointer = { x: -1000, y: -1000 };
      const count = Math.min(70, Math.max(24, Math.floor(window.innerWidth / 22)));

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        particles = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.28,
          vy: (Math.random() - 0.5) * 0.28,
          r: Math.random() * 1.4 + 0.5,
        }));
      };

      const draw = () => {
        ctx.clearRect(0, 0, width, height);
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0 || p.x > width) p.vx *= -1;
          if (p.y < 0 || p.y > height) p.vy *= -1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(57,255,20,0.35)";
          ctx.fill();

          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.strokeStyle = `rgba(34,211,238,${0.16 * (1 - dist / 120)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        requestAnimationFrame(draw);
      };

      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", (event) => {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
      });
      window.addEventListener("pointerleave", () => {
        pointer.x = -1000;
        pointer.y = -1000;
      });
      resize();
      requestAnimationFrame(draw);
    }
  }

  /* ---------- Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
