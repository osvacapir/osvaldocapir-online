(function () {
  'use strict';

  // ===== Menu mobile =====
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');
  const links = document.querySelectorAll('.nav-menu a');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !open);
      menu.classList.toggle('is-open');
      document.body.style.overflow = open ? '' : 'hidden';
    });

    links.forEach(function (link) {
      link.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  // ===== Smooth scroll para âncoras =====
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const id = this.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ===== Reveal ao scroll =====
  const sections = document.querySelectorAll('.section, .hero-inner');
  const observerOptions = { rootMargin: '-50px 0px -80px 0px', threshold: 0.1 };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, observerOptions);

  sections.forEach(function (el) {
    el.classList.add('reveal');
    observer.observe(el);
  });

  // Hero já visível no início
  const heroInner = document.querySelector('.hero-inner');
  if (heroInner) heroInner.classList.add('revealed');

  // ===== Ano no footer =====
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
