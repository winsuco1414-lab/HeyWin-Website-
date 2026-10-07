/* HeyWin — site interactions */
(() => {
  'use strict';

  // ---- Edit these before launch ------------------------------------------
  // The Calendly link lives in each [data-book] link's href in the HTML, and social links are in the footer HTML.
  const CONFIG = {
    email: 'heywinfieldfunnels@gmail.com',
    portfolioUrl: 'https://my-portfolio-website-omega-sand.vercel.app/',
  };
  // ---------------------------------------------------------------------------

  window.heywinReady = true;

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Booking buttons ---------- */
  // Each [data-book] link points at Calendly in the HTML, so it works without JS (opens in a new tab).
  // With JS, Calendly's popup files load on the first click instead of on page load.
  let calendlyReady;
  const loadCalendly = () => {
    if (calendlyReady) return calendlyReady;
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://assets.calendly.com/assets/external/widget.css';
    document.head.appendChild(css);
    calendlyReady = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://assets.calendly.com/assets/external/widget.js';
      s.async = true;
      s.onload = () => (window.Calendly ? resolve(window.Calendly) : reject(new Error('Calendly missing')));
      s.onerror = reject;
      setTimeout(() => reject(new Error('Calendly timed out')), 5000);
      document.head.appendChild(s);
    });
    return calendlyReady;
  };

  $$('[data-book]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'book_call_click', { cta_location: btn.dataset.book || 'unknown' });
      }
      // Let Ctrl/Cmd/Shift-clicks open Calendly in a new tab or window as normal.
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      const url = btn.href;
      // If the popup can't load (blocked or offline), go to the Calendly page instead.
      loadCalendly()
        .then((Calendly) => Calendly.initPopupWidget({ url }))
        .catch(() => { window.location.href = url; });
    });
  });

  /* ---------- Portfolio ---------- */
  $$('[data-portfolio]').forEach((a) => { a.href = CONFIG.portfolioUrl; });

  /* ---------- Lead form (Netlify Forms) ---------- */
  // Sends in the background so visitors stay on the page. Without JS, the form still posts to Netlify normally.
  const form = $('[data-lead-form]');
  if (form) {
    const btn = $('button[type="submit"]', form);
    const status = $('[data-lead-status]', form);
    const label = btn.textContent;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      btn.disabled = true;
      btn.textContent = 'Sending…';
      status.textContent = '';
      status.classList.remove('is-success');
      try {
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(new FormData(form)).toString(),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // Count the sign-up as a lead in Google Analytics (no personal details are sent)
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'generate_lead', {
            form_name: 'lead',
            service: form.service.value,
            timeline: form.timeline.value || 'not given',
          });
        }
        form.reset();
        status.classList.add('is-success');
        status.textContent = "Thanks, I've got your details. I'll get back to you by email soon.";
      } catch (err) {
        status.textContent = `Sorry, that didn't send. Please try again, or email me at ${CONFIG.email}.`;
      } finally {
        btn.disabled = false;
        btn.textContent = label;
      }
    });
  }

  /* ---------- Header border on scroll ---------- */
  const header = $('[data-header]');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Subtle fade-ins ---------- */
  const fades = $$('[data-fade]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
    fades.forEach((el) => io.observe(el));
  } else {
    fades.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Mobile sticky CTA (hidden over the hero, lead form and final CTA) ---------- */
  const bar = $('[data-mobile-cta]');
  if (bar && 'IntersectionObserver' in window) {
    const link = $('a', bar);
    const watched = new Map([[$('.hero'), true], [$('#contact'), false], [$('.final'), false], [$('.footer'), false]]);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => watched.set(e.target, e.isIntersecting));
      const show = [...watched.values()].every((v) => !v);
      bar.classList.toggle('is-visible', show);
      bar.setAttribute('aria-hidden', String(!show));
      if (show) link.removeAttribute('tabindex'); else link.setAttribute('tabindex', '-1');
    });
    watched.forEach((_, el) => el && io.observe(el));
  }
})();
