/* HeyWin — site interactions */
(() => {
  'use strict';

  // ---- Edit these before launch ------------------------------------------
  const CONFIG = {
    // Your Calendly event link. While empty, every "Book" button opens an email to you instead.
    calendlyUrl: 'https://calendly.com/heywinfieldfunnels/new-meeting',
    email: 'heywinfieldfunnels@gmail.com',
    portfolioUrl: 'https://my-portfolio-website-omega-sand.vercel.app/',
    // Paste full profile URLs. Leave '' to hide that icon.
    socials: {
      instagram: 'https://www.instagram.com/heywin_business/',
      facebook: 'https://www.facebook.com/profile.php?id=61574369100452',
      linkedin: 'https://www.linkedin.com/in/winfield-macabato-985412297/',
      tiktok: '',
      youtube: '',
    },
  };
  // ---------------------------------------------------------------------------

  window.heywinReady = true;

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Booking buttons ---------- */
  const mailtoHref = `mailto:${CONFIG.email}?subject=${encodeURIComponent('Discovery call request')}&body=${encodeURIComponent("Hi Win,\n\nI'd like to book a free discovery call.\n\nMy business: \nWhat I need help with: \nBest days/times for me: \n")}`;

  $$('[data-book]').forEach((btn) => {
    if (!CONFIG.calendlyUrl) {
      btn.href = mailtoHref;
      return;
    }
    btn.href = CONFIG.calendlyUrl;
    btn.target = '_blank';
    btn.rel = 'noopener';
    btn.addEventListener('click', (e) => {
      // Open as a popup on the page when Calendly's widget has loaded; otherwise the link opens in a new tab.
      if (window.Calendly && typeof window.Calendly.initPopupWidget === 'function') {
        e.preventDefault();
        window.Calendly.initPopupWidget({ url: CONFIG.calendlyUrl });
      }
    });
  });

  /* ---------- Portfolio + socials ---------- */
  $$('[data-portfolio]').forEach((a) => { a.href = CONFIG.portfolioUrl; });

  $$('[data-social]').forEach((a) => {
    const url = CONFIG.socials[a.dataset.social];
    if (url) {
      a.href = url;
      a.closest('li').hidden = false;
    }
  });

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
