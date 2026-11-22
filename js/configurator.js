/* Expose Designs – konfigurátor helmy (živý SVG náhled) */
(() => {
  const root = document.getElementById('konfigurator');
  if (!root) return;

  const COLORS = {
    white:  { name: 'Bílá',          hex: '#f2f0eb' },
    black:  { name: 'Černá',         hex: '#141516' },
    red:    { name: 'Závodní červená', hex: '#d9191f' },
    teal:   { name: 'Tyrkysová',     hex: '#24c3d3' },
    petrol: { name: 'Petrolejová',   hex: '#0f5e63' },
    yellow: { name: 'Žlutá',         hex: '#f5c518' },
    orange: { name: 'Oranžová',      hex: '#f26a1b' },
    blue:   { name: 'Modrá',         hex: '#1d4ed8' },
    nardo:  { name: 'Nardo šedá',    hex: '#8b8d8f' },
    purple: { name: 'Fialová',       hex: '#6d28d9' },
    lime:   { name: 'Limetková',     hex: '#8ad12f' },
    pink:   { name: 'Růžová',        hex: '#ec4899' },
  };

  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
    return .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
  };
  const contrast = (h) => (lum(h) > .35 ? '#141516' : '#f2f0eb');

  // vzory – a = barva motivu, b = základ, c = kontrastní barva k základu
  const PATTERNS = {
    stripes: { name: 'Pruhy', svg: (a) => `
      <path fill="${a}" d="M40 300 C180 150 360 70 660 90 L660 135 C380 115 220 190 70 340 Z"/>
      <path fill="${a}" d="M70 360 C210 210 380 140 660 160 L660 182 C390 162 240 232 92 380 Z"/>` },
    flames: { name: 'Plameny', svg: (a, b, c) => `
      <path fill="${a}" stroke="${c}" stroke-width="3" stroke-opacity=".5" d="M640 420 L640 170 C590 160 540 168 500 182 C530 190 545 200 540 212 C490 200 440 206 400 222 C430 230 440 240 432 250 C380 240 320 248 270 268 C300 276 308 288 298 296 C250 290 200 300 160 318 C190 326 196 338 186 346 C160 344 130 350 100 362 L100 420 Z"/>` },
    bolt: { name: 'Blesk', svg: (a, b, c) => `
      <polygon fill="${c}" opacity=".35" points="96,282 286,217 261,257 456,187 431,234 626,162 626,192 438,264 461,220 268,288 291,250 96,312"/>
      <polygon fill="${a}" points="90,270 280,205 255,245 450,175 425,222 620,150 620,180 432,252 455,208 262,276 285,238 90,300"/>` },
    geo: { name: 'Geometrie', svg: (a, b, c) => `
      <polygon fill="${a}" points="100,370 250,170 330,380"/>
      <polygon fill="${a}" points="290,40 500,60 380,190"/>
      <polygon fill="${c}" opacity=".85" points="240,250 430,215 350,360"/>
      <polygon fill="${a}" opacity=".75" points="430,300 600,240 620,420 470,420"/>
      <path stroke="${c}" stroke-width="4" fill="none" d="M120 200 L300 120 L360 300 L600 170"/>` },
    waves: { name: 'Vlny', svg: (a, b, c) => `
      <path fill="none" stroke="${a}" stroke-width="30" stroke-linecap="round" d="M60 320 C170 250 250 330 360 260 S540 220 660 170"/>
      <path fill="none" stroke="${a}" stroke-width="12" stroke-linecap="round" d="M60 372 C170 302 250 382 360 312 S540 272 660 222"/>
      <path fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" d="M60 272 C170 202 250 282 360 212 S540 172 660 122"/>` },
    checker: { name: 'Šachovnice', svg: (a, b, c) => `
      <path fill="url(#hChecker)" d="M90 200 C200 150 330 110 470 100 L480 160 C340 168 220 210 110 268 Z"/>
      <path fill="none" stroke="${a}" stroke-width="8" d="M90 200 C200 150 330 110 470 100"/>
      <path fill="none" stroke="${a}" stroke-width="8" d="M110 268 C220 210 340 168 480 160"/>` },
    split: { name: 'Dvoubarevná', svg: (a, b, c) => `
      <polygon fill="${a}" points="0,480 0,300 640,190 640,480"/>
      <path stroke="${c}" stroke-width="7" d="M0 292 L640 182"/>` },
    none: { name: 'Čistá', svg: () => '' },
  };

  const FINISH = { gloss: 'Lesk', matte: 'Mat', metal: 'Metalíza' };
  const VISOR = { iridium: 'Iridium', gold: 'Zlaté', smoke: 'Kouřové', clear: 'Čiré' };

  const DEFAULT = { base: 'red', accent: 'white', pattern: 'stripes', finish: 'gloss', visor: 'iridium', num: '95' };
  const state = { ...DEFAULT };

  const $ = (id) => document.getElementById(id);
  const svg = $('helmet');
  const els = {
    base: $('hBase'), pattern: $('hPattern'), num: $('hNum'), flake: $('hFlakeL'), shade: $('hShadeL'),
    gloss: $('hGloss'), visor: $('hVisor'), glow: $('glow'), summary: $('summary'), numInput: $('numInput'),
  };
  const checkerA = svg.querySelectorAll('.pc-a');
  const checkerB = svg.querySelector('.pc-b');

  /* ---------- UI ---------- */
  const buildSwatches = (key) => {
    const wrap = root.querySelector(`.swatches[data-key="${key}"]`);
    wrap.innerHTML = Object.entries(COLORS).map(([id, c]) =>
      `<button type="button" role="radio" class="swatch" data-val="${id}" style="--c:${c.hex}" aria-label="${c.name}" title="${c.name}"></button>`).join('');
  };
  const buildSeg = (key, map) => {
    const wrap = root.querySelector(`.seg[data-key="${key}"]`);
    wrap.innerHTML = Object.entries(map).map(([id, v]) =>
      `<button type="button" role="radio" data-val="${id}">${typeof v === 'string' ? v : v.name}</button>`).join('');
  };
  buildSwatches('base'); buildSwatches('accent');
  buildSeg('pattern', PATTERNS); buildSeg('finish', FINISH); buildSeg('visor', VISOR);

  root.querySelectorAll('[data-key]').forEach((group) => {
    group.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-val]');
      if (!btn) return;
      state[group.dataset.key] = btn.dataset.val;
      render(true);
    });
  });
  els.numInput.addEventListener('input', () => {
    state.num = els.numInput.value.toUpperCase().replace(/[^0-9A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ#]/g, '').slice(0, 3);
    render(false);
  });

  /* ---------- render ---------- */
  let popT;
  function render(pop, user = true) {
    const b = COLORS[state.base].hex;
    let a = COLORS[state.accent].hex;
    const c = contrast(b);
    if (state.accent === state.base) a = c; // motiv musí být vidět

    els.base.style.fill = b;
    els.pattern.innerHTML = PATTERNS[state.pattern].svg(a, b, c);
    checkerA.forEach((r) => r.setAttribute('fill', a));
    checkerB.setAttribute('fill', c === '#141516' ? '#141516' : '#f2f0eb');

    const numFill = state.pattern === 'none' || state.pattern === 'split' ? a : (lum(a) > .35 ? a : c);
    els.num.textContent = state.num || '';
    els.num.style.fill = numFill;
    els.num.setAttribute('stroke', lum(numFill) > .35 ? '#141516' : '#f2f0eb');
    els.num.setAttribute('stroke-width', '5');
    els.num.setAttribute('paint-order', 'stroke');
    els.num.setAttribute('stroke-opacity', '.55');

    // finiš
    const g = els.base.parentNode;
    g.style.filter = state.finish === 'matte' ? 'saturate(.82) brightness(.96)' : '';
    els.gloss.style.opacity = state.finish === 'matte' ? 0 : state.finish === 'metal' ? .7 : 1;
    els.flake.style.opacity = state.finish === 'metal' ? .32 : 0;
    els.shade.style.opacity = state.finish === 'matte' ? .75 : 1;

    els.visor.setAttribute('fill', `url(#v-${state.visor})`);
    els.visor.setAttribute('opacity', state.visor === 'clear' ? 1 : .94);
    els.glow.style.background = `radial-gradient(closest-side, ${b}66, transparent 70%)`;

    // aktivní tlačítka
    root.querySelectorAll('[data-key]').forEach((group) => {
      group.querySelectorAll('button[data-val]').forEach((btn) => {
        const on = state[group.dataset.key] === btn.dataset.val;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-checked', on);
      });
    });
    $('lblBase').textContent = `– ${COLORS[state.base].name}`;
    $('lblAccent').textContent = `– ${COLORS[state.accent].name}`;
    if (document.activeElement !== els.numInput) els.numInput.value = state.num;

    els.summary.textContent = describe();
    if (user) history.replaceState(null, '', `#konfigurator?${encode()}`);

    if (pop) {
      svg.classList.remove('pop'); void svg.getBoundingClientRect(); svg.classList.add('pop');
      clearTimeout(popT); popT = setTimeout(() => svg.classList.remove('pop'), 500);
    }
  }

  const describe = () => {
    const p = PATTERNS[state.pattern].name;
    const motif = state.pattern === 'none' ? 'bez motivu' : `motiv ${p.toLowerCase()} (${COLORS[state.accent].name.toLowerCase()})`;
    return `${COLORS[state.base].name} · ${motif} · ${FINISH[state.finish].toLowerCase()} · plexi ${VISOR[state.visor].toLowerCase()}${state.num ? ` · „${state.num}“` : ''}`;
  };
  const encode = () => new URLSearchParams({ b: state.base, a: state.accent, p: state.pattern, f: state.finish, v: state.visor, n: state.num }).toString();
  const decode = () => {
    const h = location.hash;
    if (!h.startsWith('#konfigurator?')) return false;
    const q = new URLSearchParams(h.split('?')[1]);
    const pick = (k, map, key) => { const v = q.get(k); if (v && map[v]) state[key] = v; };
    pick('b', COLORS, 'base'); pick('a', COLORS, 'accent'); pick('p', PATTERNS, 'pattern');
    pick('f', FINISH, 'finish'); pick('v', VISOR, 'visor');
    if (q.has('n')) state.num = q.get('n').slice(0, 3);
    return true;
  };

  /* ---------- akce ---------- */
  $('randomBtn').addEventListener('click', () => {
    const r = (o) => { const k = Object.keys(o); return k[Math.floor(Math.random() * k.length)]; };
    state.base = r(COLORS);
    do { state.accent = r(COLORS); } while (state.accent === state.base);
    state.pattern = r(PATTERNS); state.finish = r(FINISH); state.visor = r(VISOR);
    state.num = String(Math.floor(Math.random() * 99) + 1);
    render(true);
  });

  $('shareBtn').addEventListener('click', async (e) => {
    const url = `${location.origin}${location.pathname}#konfigurator?${encode()}`;
    const btn = e.currentTarget;
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ title: 'Můj návrh helmy – Expose Designs', url });
      else { await navigator.clipboard.writeText(url); btn.lastChild.textContent = ' Zkopírováno!'; setTimeout(() => { btn.lastChild.textContent = ' Zkopírovat odkaz'; }, 1800); }
    } catch (_) { /* zrušeno */ }
  });

  // náhled návrhu do formuláře
  const toImg = () => {
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.removeAttribute('class');
    clone.querySelector('title')?.remove();
    // inline styly z JS (fill/opacity/filter) jsou součástí klonu
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  };
  window.exposeDesign = {
    attach() {
      $('formDesign').hidden = false;
      $('formThumb').innerHTML = `<img src="${toImg()}" alt="Náhled návrhu helmy">`;
      $('formDesignText').textContent = describe();
      $('navrhField').value = `${describe()}\nOdkaz na návrh: ${location.origin}${location.pathname}#konfigurator?${encode()}`;
      const co = document.querySelector('input[name="co"][value="Helma na zakázku"]');
      if (co) co.checked = true;
    },
    detach() { $('formDesign').hidden = true; $('navrhField').value = ''; },
  };
  $('sendDesign').addEventListener('click', () => window.exposeDesign.attach());
  $('formDesignRemove').addEventListener('click', () => window.exposeDesign.detach());

  /* ---------- 3D náklon náhledu ---------- */
  const stage = $('stage');
  if (matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      svg.style.transform = `perspective(900px) rotateY(${x * 16}deg) rotateX(${-y * 10}deg) translateZ(0)`;
    });
    stage.addEventListener('pointerleave', () => { svg.style.transform = ''; });
  }

  const fromLink = decode();
  render(false, false);
  if (fromLink) setTimeout(() => root.scrollIntoView({ behavior: 'smooth' }), 300);
})();
