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

  /* ── Init ────────────────────────────────────────────────── */
  document.addEventListener("DOMContentLoaded", () => {
    initLoader();
    initNav();
    initReveal();
    initHamburger();
  });
})();
