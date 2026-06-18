/* Penasco Beauty Center -- main.js
 * Handles: loader, scroll reveals, nav scroll, hamburger
 */
(function () {
  "use strict";

  /* ── Loader ──────────────────────────────────────────────── */
  function initLoader() {
    const loader = document.getElementById("loader");
    if (!loader) return;

    const fill = loader.querySelector(".loader-bar-fill");
    if (fill) {
      fill.style.transition = "width 1.1s ease-out";
      requestAnimationFrame(() => {
        fill.style.width = "100%";
      });
    }

    setTimeout(() => {
      loader.style.transition = "opacity 0.35s ease";
      loader.style.opacity = "0";
      document.body.classList.add("page-ready");
      setTimeout(() => {
        loader.style.display = "none";
      }, 360);
    }, 1200);
  }

  /* ── Scroll Reveals ──────────────────────────────────────── */
  function initReveal() {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const reveals = document.querySelectorAll(".reveal");

    if (prefersReduced) {
      reveals.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "none";
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    reveals.forEach((el) => observer.observe(el));
  }

  /* ── Nav scroll behavior ─────────────────────────────────── */
  function initNav() {
    const nav = document.querySelector("nav.site-nav");
    if (!nav) return;
    window.addEventListener("scroll", () => {
      if (window.scrollY > 40) {
        nav.classList.add("nav-scrolled");
      } else {
        nav.classList.remove("nav-scrolled");
      }
    });
  }

  /* ── Hamburger ───────────────────────────────────────────── */
  function initHamburger() {
    const btn = document.querySelector(".nav-hamburger");
    const drawer = document.getElementById("nav-drawer");
    if (!btn || !drawer) return;

    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      drawer.classList.toggle("drawer-open", !open);
      btn.classList.toggle("is-open", !open);
    });

    drawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        btn.setAttribute("aria-expanded", "false");
        drawer.classList.remove("drawer-open");
        btn.classList.remove("is-open");
      });
    });
  }

  /* ── Before & After canvas comb sliders ─────────────────── */
  function initBeforeAfter() {
    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.max(0, a).toFixed(3)})`;
    const rand  = (a, b) => a + Math.random() * (b - a);

    const ROSE    = [184,  92, 114];
    const ROSE_LT = [224, 148, 168];
    const GOLD    = [201, 169, 110];
    const GOLD_LT = [240, 212, 155];
    const WHITE   = [255, 248, 244];

    function rrect(ctx, x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function star4(ctx, x, y, ro, ri, angle) {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const ang = angle + (i * Math.PI) / 4;
        const r   = i % 2 === 0 ? ro : ri;
        i === 0
          ? ctx.moveTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r)
          : ctx.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r);
      }
      ctx.closePath();
    }

    document.querySelectorAll(".ba-card").forEach(card => {
      const after  = card.querySelector(".ba-after");
      const canvas = card.querySelector(".ba-canvas");
      if (!canvas || !canvas.getContext) return;
      const ctx = canvas.getContext("2d");

      let CW = 0, CH = 0, DPR = 1;
      let pct      = 20;
      let dragging = false;
      let sparkles = [];

      function resize() {
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        CW  = canvas.offsetWidth;
        CH  = canvas.offsetHeight;
        canvas.width  = Math.round(CW * DPR);
        canvas.height = Math.round(CH * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      }

      function spawnSparkle(x, y) {
        const cols = [ROSE_LT, GOLD_LT, WHITE];
        sparkles.push({
          x, y,
          vx:   rand(-1.4, 1.4),
          vy:   rand(-2.4, -0.5),
          age:  0,
          life: rand(0.65, 1.55),
          size: rand(1.5, 3.8),
          col:  cols[Math.floor(rand(0, cols.length))],
          rot:  rand(0, Math.PI),
        });
      }

      function drawComb(x, t) {
        const sw  = Math.max(4, CW * 0.013);   // spine width
        const th  = Math.max(2, CH * 0.009);   // tooth height
        const tl  = Math.max(18, CW * 0.060);  // tooth length each side
        const n   = 30;
        const gap = CH / (n + 1);

        // Tight glow behind spine only
        const glow = ctx.createRadialGradient(x, CH / 2, 0, x, CH / 2, sw * 5);
        glow.addColorStop(0, rgba(ROSE, 0.28));
        glow.addColorStop(1, rgba(ROSE, 0));
        ctx.fillStyle = glow;
        ctx.fillRect(x - sw * 5, 0, sw * 10, CH);

        // Spine
        const sg = ctx.createLinearGradient(x - sw / 2, 0, x + sw / 2, 0);
        sg.addColorStop(0,    rgba(ROSE,    0.92));
        sg.addColorStop(0.45, rgba([252, 215, 228], 1.00));
        sg.addColorStop(1,    rgba(ROSE_LT, 0.92));
        ctx.fillStyle = sg;
        rrect(ctx, x - sw / 2, 0, sw, CH, sw / 2);
        ctx.fill();

        // Teeth — symmetric, both sides
        const rate = dragging ? 0.18 : 0.022;
        for (let i = 0; i < n; i++) {
          const ty = gap * (i + 1);

          // Left tooth
          const lg = ctx.createLinearGradient(x - sw / 2, 0, x - sw / 2 - tl, 0);
          lg.addColorStop(0,    rgba(GOLD,    0.92));
          lg.addColorStop(0.55, rgba(GOLD_LT, 0.65));
          lg.addColorStop(1,    rgba(GOLD_LT, 0));
          ctx.fillStyle = lg;
          rrect(ctx, x - sw / 2 - tl, ty - th / 2, tl, th, th / 2);
          ctx.fill();

          // Right tooth
          const rg = ctx.createLinearGradient(x + sw / 2, 0, x + sw / 2 + tl, 0);
          rg.addColorStop(0,    rgba(GOLD,    0.92));
          rg.addColorStop(0.55, rgba(GOLD_LT, 0.65));
          rg.addColorStop(1,    rgba(GOLD_LT, 0));
          ctx.fillStyle = rg;
          rrect(ctx, x + sw / 2, ty - th / 2, tl, th, th / 2);
          ctx.fill();

          // Sparkles from both tooth tips
          if (Math.random() < rate && sparkles.length < 72) {
            const side = Math.random() < 0.5 ? -1 : 1;
            spawnSparkle(
              x + side * (sw / 2 + tl * rand(0.55, 1.05)),
              ty + rand(-th * 2, th * 2)
            );
          }
        }
      }

      function frame(now) {
        const t = now * 0.001;
        ctx.clearRect(0, 0, CW, CH);

        drawComb((pct / 100) * CW, t);

        for (let i = sparkles.length - 1; i >= 0; i--) {
          const s = sparkles[i];
          s.age += 0.016;
          if (s.age >= s.life) { sparkles.splice(i, 1); continue; }
          s.x  += s.vx;
          s.y  += s.vy;
          s.vy += 0.055;
          const prog = s.age / s.life;
          const a    = Math.sin(prog * Math.PI) * 0.90;

          const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 3.4);
          sg.addColorStop(0, rgba(s.col, a * 0.50));
          sg.addColorStop(1, rgba(s.col, 0));
          ctx.fillStyle = sg;
          ctx.fillRect(s.x - s.size * 3.4, s.y - s.size * 3.4, s.size * 6.8, s.size * 6.8);

          ctx.fillStyle = rgba(s.col, a);
          star4(ctx, s.x, s.y, s.size, s.size * 0.28, s.rot + t * 2.4);
          ctx.fill();
        }

        requestAnimationFrame(frame);
      }

      function set(p) {
        pct = Math.min(95, Math.max(5, p));
        after.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      }

      function pctFromX(clientX) {
        const r = card.getBoundingClientRect();
        return ((clientX - r.left) / r.width) * 100;
      }

      card.addEventListener("mousedown",   e => { dragging = true;  set(pctFromX(e.clientX)); });
      window.addEventListener("mouseup",   () => { dragging = false; });
      window.addEventListener("mousemove", e => { if (dragging) set(pctFromX(e.clientX)); });

      card.addEventListener("touchstart",  e => { dragging = true;  set(pctFromX(e.touches[0].clientX)); }, { passive: true });
      window.addEventListener("touchend",  () => { dragging = false; });
      window.addEventListener("touchmove", e => {
        if (dragging) { e.preventDefault(); set(pctFromX(e.touches[0].clientX)); }
      }, { passive: false });

      new ResizeObserver(resize).observe(card);
      resize();
      requestAnimationFrame(frame);

      // Sweep in on scroll
      const io = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          io.disconnect();
          let p = 15, dir = 1;
          const sweep = setInterval(() => {
            p += dir * 2.0;
            set(p);
            if (p >= 82) dir = -1;
            if (p <= 50) { clearInterval(sweep); set(50); }
          }, 16);
        }
      }, { threshold: 0.4 });
      io.observe(card);
    });
  }

  /* ── Salon slideshow ─────────────────────────────────────── */
  function initSlideshow() {
    const ss = document.querySelector(".salon-slideshow");
    if (!ss) return;

    const slides   = ss.querySelectorAll(".ss-slide");
    const dots     = ss.querySelectorAll(".ss-dot");
    const fill     = ss.querySelector(".ss-bar-fill");
    const curEl    = ss.querySelector(".ss-cur");
    const n        = slides.length;
    let cur        = 0;
    let autoTimer  = null;
    const INTERVAL = 4500;

    function go(idx) {
      slides[cur].classList.remove("active");
      dots[cur].classList.remove("active");
      cur = ((idx % n) + n) % n;
      slides[cur].classList.add("active");
      dots[cur].classList.add("active");
      if (curEl) curEl.textContent = cur + 1;
      resetBar();
    }

    function resetBar() {
      if (!fill) return;
      fill.style.transition = "none";
      fill.style.width = "0%";
      requestAnimationFrame(() => requestAnimationFrame(() => {
        fill.style.transition = `width ${INTERVAL}ms linear`;
        fill.style.width = "100%";
      }));
    }

    function startAuto() {
      stopAuto();
      autoTimer = setInterval(() => go(cur + 1), INTERVAL);
      resetBar();
    }

    function stopAuto() {
      clearInterval(autoTimer);
      autoTimer = null;
      if (fill) { fill.style.transition = "none"; }
    }

    ss.querySelector(".ss-prev").addEventListener("click", () => { go(cur - 1); startAuto(); });
    ss.querySelector(".ss-next").addEventListener("click", () => { go(cur + 1); startAuto(); });
    dots.forEach((d, i) => d.addEventListener("click", () => { go(i); startAuto(); }));

    ss.addEventListener("mouseenter", stopAuto);
    ss.addEventListener("mouseleave", startAuto);

    let touchX = 0;
    ss.addEventListener("touchstart", e => { touchX = e.touches[0].clientX; }, { passive: true });
    ss.addEventListener("touchend", e => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) { go(dx < 0 ? cur + 1 : cur - 1); startAuto(); }
    }, { passive: true });

    startAuto();
  }

  /* ── Init ────────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", () => {
    initLoader();
    initNav();
    initReveal();
    initHamburger();
    initBeforeAfter();
    initSlideshow();
  });
})();
