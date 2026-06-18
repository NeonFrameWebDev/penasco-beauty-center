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

  /* ── Before & After sliders ──────────────────────────────── */
  function initBeforeAfter() {
    document.querySelectorAll(".ba-card").forEach(card => {
      const after  = card.querySelector(".ba-after");
      const handle = card.querySelector(".ba-handle");
      let active   = false;

      function set(pct) {
        pct = Math.min(95, Math.max(5, pct));
        after.style.clipPath  = `inset(0 ${100 - pct}% 0 0)`;
        handle.style.left     = pct + "%";
        handle.style.transform = "translateX(-50%)";
      }

      function pctFromX(clientX) {
        const r = card.getBoundingClientRect();
        return ((clientX - r.left) / r.width) * 100;
      }

      card.addEventListener("mousedown",  e => { active = true; set(pctFromX(e.clientX)); });
      window.addEventListener("mouseup",  () => { active = false; });
      window.addEventListener("mousemove", e => { if (active) set(pctFromX(e.clientX)); });

      card.addEventListener("touchstart", e => { active = true; set(pctFromX(e.touches[0].clientX)); }, { passive: true });
      window.addEventListener("touchend",  () => { active = false; });
      window.addEventListener("touchmove", e => {
        if (active) { e.preventDefault(); set(pctFromX(e.touches[0].clientX)); }
      }, { passive: false });

      // Animate in to 50% on first intersection
      const io = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          io.disconnect();
          let p = 20, dir = 1;
          const sweep = setInterval(() => {
            p += dir * 1.8;
            if (p >= 80) dir = -1;
            if (p <= 50) { clearInterval(sweep); set(50); return; }
            set(p);
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
