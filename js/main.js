/* Expose Designs – interakce (bez knihoven) */

// TODO pro majitele: sem doplnit skutečný e-mail, kam mají chodit poptávky.
// Lepší varianta: napojit formulář na Formspree / Netlify Forms / vlastní backend,
// aby zákazník nemusel mít nastaveného poštovního klienta.
const CONTACT_EMAIL = 'info@expose.cz';

document.documentElement.classList.remove('no-js');

/* ---------- header + sticky CTA ---------- */
const header = document.getElementById('header');
const progress = document.getElementById('progress');
const sticky = document.getElementById('stickyCta');
const hideZones = ['poptavka', 'konfigurator'].map((id) => document.getElementById(id)).filter(Boolean);
const inZone = new Set();
let contactVisible = false;

const onScroll = () => {
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 20);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  sticky.classList.toggle('is-visible', y > window.innerHeight * 0.8 && !contactVisible);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const zoneIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => (e.isIntersecting ? inZone.add(e.target) : inZone.delete(e.target)));
  contactVisible = inZone.size > 0; onScroll();
}, { threshold: 0.05 });
hideZones.forEach((z) => zoneIO.observe(z));

/* ---------- mobile menu ---------- */
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
const setMenu = (open) => {
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
  nav.classList.toggle('is-open', open);
  header.classList.toggle('menu-open', open);
};
burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 60}ms`;
  io.observe(el);
});

/* ---------- předvyplnění služby z karet ---------- */
document.querySelectorAll('[data-service]').forEach((el) => {
  el.addEventListener('click', () => {
    const r = document.querySelector(`input[name="co"][value="${el.dataset.service}"]`);
    if (r) r.checked = true;
  });
});

/* ---------- gallery filter ---------- */
const filters = document.querySelectorAll('.filter');
const items = document.querySelectorAll('#gallery figure');
filters.forEach((btn) => btn.addEventListener('click', () => {
  filters.forEach((b) => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-selected', b === btn); });
  const f = btn.dataset.filter;
  items.forEach((it) => it.classList.toggle('is-hidden', f !== 'all' && it.dataset.cat !== f));
}));

/* ---------- lightbox ---------- */
const lb = document.getElementById('lightbox');
const lbImg = lb.querySelector('img');
let idx = 0;
const visible = () => [...items].filter((it) => !it.classList.contains('is-hidden'));
const show = (i) => {
  const list = visible();
  idx = (i + list.length) % list.length;
  const img = list[idx].querySelector('img');
  lbImg.src = img.src; lbImg.alt = img.alt;
};
items.forEach((it) => it.addEventListener('click', () => {
  show(visible().indexOf(it));
  lb.hidden = false; document.body.style.overflow = 'hidden';
  lb.querySelector('.lightbox__close').focus();
}));
const closeLb = () => { lb.hidden = true; document.body.style.overflow = ''; };
lb.querySelector('.lightbox__close').addEventListener('click', closeLb);
lb.querySelector('.lightbox__prev').addEventListener('click', () => show(idx - 1));
lb.querySelector('.lightbox__next').addEventListener('click', () => show(idx + 1));
lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
document.addEventListener('keydown', (e) => {
  if (lb.hidden) return;
  if (e.key === 'Escape') closeLb();
  if (e.key === 'ArrowLeft') show(idx - 1);
  if (e.key === 'ArrowRight') show(idx + 1);
});

/* ---------- form ---------- */
const form = document.getElementById('form');
const note = document.getElementById('formNote');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const d = new FormData(form);
  const name = form.jmeno, email = form.email;
  [name, email].forEach((f) => f.classList.toggle('is-invalid', !f.checkValidity()));
  if (!name.checkValidity() || !email.checkValidity() || !form.gdpr.checked) {
    note.textContent = 'Vyplň prosím jméno, platný e-mail a potvrď souhlas.';
    note.classList.add('is-error');
    return;
  }
  note.classList.remove('is-error');
  const subject = `Poptávka: ${d.get('co')} – ${d.get('jmeno')}`;
  const body = [
    `Co: ${d.get('co')}`,
    `Styl: ${d.get('styl')}`,
    '',
    `Nápad:\n${d.get('napad') || '-'}`,
    '',
    `Jméno: ${d.get('jmeno')}`,
    `E-mail: ${d.get('email')}`,
    `Telefon: ${d.get('telefon') || '-'}`,
    ...(d.get('navrh') ? ['', 'Návrh z konfigurátoru:', d.get('navrh')] : []),
  ].join('\n');
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  note.textContent = 'Díky! Otevírá se ti e-mail s předvyplněnou poptávkou – stačí ho odeslat.';
});

document.getElementById('year').textContent = new Date().getFullYear();

/* ==========================================================
   Interaktivní vrstva
   ========================================================== */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;

/* ---------- hero: nadpis po písmenech ---------- */
const title = document.querySelector('[data-split]');
if (title) {
  let i = 0;
  const split = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((word) => {
          if (!word.trim()) { if (word) frag.append(' '); return; }
          const w = document.createElement('span'); w.className = 'word';
          [...word].forEach((ch) => {
            const c = document.createElement('span'); c.className = 'char'; c.textContent = ch;
            c.style.setProperty('--i', i++); w.append(c);
          });
          frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) split(n);
    });
  };
  split(title);
  requestAnimationFrame(() => title.classList.add('is-split'));
}

/* ---------- 3D náklon fotky v hero ---------- */
const tilt = document.querySelector('[data-tilt]');
if (tilt && fine && !reduce) {
  const media = tilt.parentElement;
  media.addEventListener('pointermove', (e) => {
    const r = media.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    tilt.style.transform = `perspective(1000px) rotateY(${x * 14}deg) rotateX(${-y * 10}deg) rotate(2deg)`;
    tilt.style.setProperty('--gx', `${(x + .5) * 100}%`);
    tilt.style.setProperty('--gy', `${(y + .5) * 100}%`);
  });
  media.addEventListener('pointerleave', () => { tilt.style.transform = ''; });
}

/* ---------- magnetická tlačítka ---------- */
if (fine && !reduce) {
  document.querySelectorAll('.btn--accent, .btn--lg').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}

/* ---------- vlastní kurzor ---------- */
const cursor = document.getElementById('cursor');
if (fine && !reduce && cursor) {
  document.body.classList.add('has-cursor');
  let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
  addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; cursor.classList.add('is-on'); });
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
  const loop = () => {
    cx += (tx - cx) * .2; cy += (ty - cy) * .2;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(loop);
  };
  loop();
  const hov = (sel, cls) => document.querySelectorAll(sel).forEach((el) => {
    el.addEventListener('pointerenter', () => cursor.classList.add(cls));
    el.addEventListener('pointerleave', () => cursor.classList.remove(cls));
  });
  hov('#gallery figure, .story__media img', 'is-view');
  hov('a, button, input, textarea, label, summary', 'is-link');
}

/* ---------- proces: sticky stepper ---------- */
const procSteps = document.querySelectorAll('.proc__step');
const procImgs = document.querySelectorAll('.proc__media img');
const procNow = document.getElementById('procNow');
const procIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const n = e.target.dataset.step;
    procSteps.forEach((s) => s.classList.toggle('is-active', s.dataset.step === n));
    procImgs.forEach((im) => im.classList.toggle('is-active', im.dataset.step === n));
    procNow.textContent = String(+n + 1).padStart(2, '0');
  });
}, { rootMargin: '-45% 0px -45% 0px' });
procSteps.forEach((s) => procIO.observe(s));

/* ---------- scrubber výroby ---------- */
const range = document.getElementById('scrubRange');
if (range) {
  const imgs = document.querySelectorAll('.scrub__frame img');
  const labels = document.querySelectorAll('.scrub__labels button');
  const hint = document.querySelector('.scrub__hint');
  const upd = () => {
    const v = +range.value;
    imgs.forEach((im, i) => { im.style.opacity = Math.max(0, 1 - Math.abs(v - i)); im.style.transform = `scale(${1.06 - Math.max(0, 1 - Math.abs(v - i)) * .06})`; });
    labels.forEach((l, i) => l.classList.toggle('is-active', Math.round(v) === i));
    range.style.setProperty('--p', `${(v / 3) * 100}%`);
  };
  range.addEventListener('input', () => { hint.classList.add('is-gone'); upd(); });
  labels.forEach((l) => l.addEventListener('click', () => {
    hint.classList.add('is-gone');
    const from = +range.value, to = +l.dataset.v, t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 500), e = 1 - (1 - k) ** 3;
      range.value = from + (to - from) * e; upd();
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }));
  upd();
  // jemná automatická ukázka, když se scrubber poprvé objeví
  if (!reduce) {
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return; o.disconnect();
      let t0;
      const demo = (t) => {
        if (hint.classList.contains('is-gone')) return;
        t0 ??= t; const k = Math.min(1, (t - t0) / 3200);
        range.value = 3 * (k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2); upd();
        if (k < 1) requestAnimationFrame(demo);
      };
      setTimeout(() => requestAnimationFrame(demo), 400);
    }, { threshold: .6 }).observe(document.getElementById('scrub'));
  }
}

/* ---------- marquee reaguje na scroll ---------- */
const track = document.querySelector('.marquee__track');
if (track && !reduce && track.getAnimations) {
  let lastY = scrollY, rate = 1, target = 1;
  addEventListener('scroll', () => {
    const dy = scrollY - lastY; lastY = scrollY;
    target = Math.max(-6, Math.min(6, (dy >= 0 ? 1 : -1) * (1 + Math.abs(dy) * .15)));
  }, { passive: true });
  const tick = () => {
    rate += (target - rate) * .08; target += ((target > 0 ? 1 : -1) - target) * .05;
    track.getAnimations().forEach((a) => { a.playbackRate = rate; });
    requestAnimationFrame(tick);
  };
  tick();
}

/* ---------- lightbox: swipe na mobilu ---------- */
let sx = null;
lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
lb.addEventListener('touchend', (e) => {
  if (sx === null) return;
  const dx = e.changedTouches[0].clientX - sx;
  if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
  sx = null;
});
