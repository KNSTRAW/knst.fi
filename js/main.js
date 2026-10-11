/* KNST — interactions. Vanilla JS, no dependencies. */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const LOAD_MAX = 100;

  /* ------------------------------------------------------------------ toast */
  const toastEl = $('#toast');
  let toastT;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-on'), 2200);
  };

  /* ---------------------------------------------------------------- loader */
  const loader = $('#loader');
  const loaderNum = $('#loaderNum');
  const loaderBar = $('#loaderBar');
  let started = false;

  function startSite() {
    if (started) return;
    started = true;
    loader.classList.add('is-done');
    document.body.classList.remove('is-loading');
    setTimeout(() => loader.classList.add('is-gone'), 1000);
    initReveal();
    scrambleAll();
    setTimeout(glitchLogo, 1100);
  }

  function runLoader() {
    if (reduce) { loaderNum.textContent = '100'; return startSite(); }
    const dur = 1100;
    const t0 = performance.now();
    const tick = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      loaderNum.textContent = String(Math.round(e * LOAD_MAX)).padStart(3, '0');
      loaderBar.style.transform = `scaleX(${e})`;
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(startSite, 220);
    };
    requestAnimationFrame(tick);
    setTimeout(startSite, 4000); // failsafe
  }

  /* ---------------------------------------------------------------- reveal */
  function initReveal() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    $$('.reveal').forEach((el) => {
      const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
      el.style.setProperty('--d', Math.min(sibs.indexOf(el) * 90, 450) + 'ms');
      io.observe(el);
    });

    // count-ups
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        countUp(en.target);
        cio.unobserve(en.target);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach((el) => cio.observe(el));
  }

  function countUp(el) {
    const end = +el.dataset.count;
    const suffix = el.dataset.suffix || '';
    const fmt = el.dataset.format ? (n) => n.toLocaleString('en-US') : (n) => String(n);
    if (reduce) { el.textContent = fmt(end) + suffix; return; }
    const dur = 1600, t0 = performance.now();
    const step = (now) => {
      const p = clamp((now - t0) / dur, 0, 1);
      const e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(end * e)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ------------------------------------------------------- scramble text */
  const GLYPHS = '█▓▒░/\\<>#%&01';
  function scramble(el) {
    if (reduce) return;
    const final = el.dataset.text || (el.dataset.text = el.textContent);
    let frame = 0;
    clearInterval(el._sc);
    el._sc = setInterval(() => {
      el.textContent = [...final].map((ch, i) =>
        ch === ' ' ? ' ' : i < frame / 2 ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
      ).join('');
      if (++frame > final.length * 2) { clearInterval(el._sc); el.textContent = final; }
    }, 32);
  }
  function scrambleAll() {
    $$('[data-scramble]').forEach((el) => {
      el.dataset.text = el.textContent;
      scramble(el);
      el.addEventListener('mouseenter', () => scramble(el));
    });
  }

  /* --------------------------------------------------------------- glitch */
  const logo = $('#glitchLogo');
  function glitchLogo() {
    if (reduce) return;
    logo.classList.remove('is-glitching');
    void logo.offsetWidth;
    logo.classList.add('is-glitching');
    setTimeout(() => logo.classList.remove('is-glitching'), 420);
  }
  logo.addEventListener('mouseenter', glitchLogo);
  setInterval(() => { if (!document.hidden && scrollY < innerHeight) glitchLogo(); }, 5200);

  $$('[data-glitch]').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      if (reduce) return;
      el.classList.remove('is-glitching'); void el.offsetWidth;
      el.classList.add('is-glitching');
      setTimeout(() => el.classList.remove('is-glitching'), 360);
    });
  });

  /* ------------------------------------------------------------------ nav */
  const nav = $('#nav');
  const progress = $('#progress');
  const toTop = $('#toTop');
  let lastY = 0, ticking = false;

  function onScroll() {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('is-stuck', y > 40);
    nav.classList.toggle('is-hidden', y > 500 && y > lastY + 4 && !navLinks.classList.contains('is-open'));
    if (y < lastY - 4) nav.classList.remove('is-hidden');
    toTop.classList.toggle('is-on', y > innerHeight * 1.2);
    // banner parallax
    if (!reduce) $$('[data-parallax]').forEach((im) => {
      const r = im.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
      im.style.transform = `translateY(${clamp(p, -1, 1) * -7}%)`;
    });
    // hero parallax
    if (!reduce && y < innerHeight * 1.2) heroMedia.style.setProperty('--sy', (y * 0.18) + 'px');
    lastY = y;
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  const heroMedia = $('#heroMedia');

  // burger
  const burger = $('#burger');
  const navLinks = $('#navLinks');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', open);
    navLinks.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', navLinks).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // active section
  const links = $$('a[href^="#"]', navLinks);
  const sio = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => sio.observe(s));

  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* ------------------------------------------- cursor + magnetic + tilt */
  if (finePointer && !reduce) {
    // magnetic
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * 0.28;
        const y = (e.clientY - (r.top + r.height / 2)) * 0.34;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    // tilt
    $$('[data-tilt]').forEach((el) => {
      el.style.transition = 'transform .2s ease-out, opacity .9s var(--ease)';
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateY(${px * 9}deg) rotateX(${-py * 9}deg) scale(1.015)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });

    // hero mouse parallax
    const hero = $('#top');
    hero.addEventListener('pointermove', (e) => {
      const px = e.clientX / innerWidth - 0.5, py = e.clientY / innerHeight - 0.5;
      heroMedia.style.setProperty('--mx', (px * -24) + 'px');
      heroMedia.style.setProperty('--my', (py * -16) + 'px');
    });
  }
  // compose parallax vars
  heroMedia.style.transform = 'translate3d(var(--mx, 0), calc(var(--my, 0px) + var(--sy, 0px)), 0)';
  heroMedia.style.transition = 'transform .5s ease-out';

  /* --------------------------------------------------------------- player */
  $('#loadPlayer').addEventListener('click', () => {
    const wrap = $('#player');
    const f = document.createElement('iframe');
    f.src = 'https://open.spotify.com/embed/artist/11ZaQj5yKwRFUZCRKyRfLe?utm_source=generator&theme=0';
    f.title = 'KNST on Spotify';
    f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    f.loading = 'lazy';
    wrap.appendChild(f);
    $('#playerIdle').remove();
  });

  /* ------------------------------------------------------------- lightbox */
  const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  $$('.tile[data-full]').forEach((t) => t.addEventListener('click', () => {
    lbImg.src = t.dataset.full;
    lbImg.alt = $('img', t).alt;
    lbCap.textContent = t.dataset.cap || '';
    lb.showModal();
  }));
  $('#lbClose').addEventListener('click', () => lb.close());
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });

  /* ----------------------------------------------------------------- mail */
  $('#copyMail').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const addr = 'bookings@knst.fi';
    try { await navigator.clipboard.writeText(addr); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = addr; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch {}
      ta.remove();
    }
    btn.classList.add('is-ok');
    const label = btn.firstElementChild, old = label.textContent;
    label.textContent = 'Copied!';
    toast('Copied · ' + addr);
    setTimeout(() => { btn.classList.remove('is-ok'); label.textContent = old; }, 1800);
  });

  $('#year').textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------- go */
  onScroll();
  runLoader();
})();
