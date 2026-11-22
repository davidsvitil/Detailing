/* Expose Designs – interakce (bez knihoven) */

// TODO pro majitele: sem doplnit skutečný e-mail, kam mají chodit poptávky.
// Lepší varianta: napojit formulář na Formspree / Netlify Forms / vlastní backend,
// aby zákazník nemusel mít nastaveného poštovního klienta.
const CONTACT_EMAIL = 'info@expose.cz';

document.documentElement.classList.remove('no-js');

/* ---------- header + sticky CTA ---------- */
const header = document.getElementById('header');
const sticky = document.getElementById('stickyCta');
const contact = document.getElementById('poptavka');
let contactVisible = false;

const onScroll = () => {
  const y = window.scrollY;
  header.classList.toggle('is-scrolled', y > 20);
  sticky.classList.toggle('is-visible', y > window.innerHeight * 0.8 && !contactVisible);
};
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

new IntersectionObserver(([e]) => { contactVisible = e.isIntersecting; onScroll(); }, { threshold: 0.05 })
  .observe(contact);

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
  ].join('\n');
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  note.textContent = 'Díky! Otevírá se ti e-mail s předvyplněnou poptávkou – stačí ho odeslat.';
});

document.getElementById('year').textContent = new Date().getFullYear();
