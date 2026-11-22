/* Expose Designs – realistický 3D náhled helmy (three.js, PBR materiály)
   Vzory se kreslí ve stejném 2D „bočním“ prostoru 640×480 jako SVG verze
   a na helmu se promítají z boku (UV = poloha x/y), takže sedí přesně. */
import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const stage = document.getElementById('stage');
const svgFallback = document.getElementById('helmet');

function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (_) { return false; }
}

if (stage && webglOK()) init();

function init() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- renderer / scéna ---------- */
  const wrap = document.createElement('div');
  wrap.className = 'helmet3d';
  wrap.innerHTML = '<span class="helmet3d__hint mono">↻ Otáčej tažením</span>';
  svgFallback.after(wrap);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  wrap.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  const camera = new THREE.PerspectiveCamera(30, 4 / 3, 0.1, 50);
  camera.position.set(1.15, 0.55, 4.6);

  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(2, 4, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fe8f0, 1.1);
  rim.position.set(-3, 1.5, -2);
  scene.add(rim);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.minPolarAngle = Math.PI * 0.28;
  controls.maxPolarAngle = Math.PI * 0.62;
  controls.autoRotate = !reduce;
  controls.autoRotateSpeed = 0.6;
  controls.target.set(0, 0.02, 0);
  renderer.domElement.style.touchAction = 'pan-y'; // svislý swipe dál scrolluje stránku
  const stopAuto = () => {
    controls.autoRotate = false;
    wrap.classList.add('is-touched');
    clearTimeout(stopAuto.t);
    if (!reduce) stopAuto.t = setTimeout(() => { controls.autoRotate = true; }, 6000);
  };
  controls.addEventListener('start', stopAuto);

  /* ---------- geometrie skořepiny ---------- */
  const geo = new THREE.SphereGeometry(1, 160, 120);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    let { x, y, z } = v;
    // protáhnout dopředu/dozadu, zúžit do stran
    x *= 1.1; z *= 0.86; y *= 1.0;
    // bradová část: spodek předku vystupuje dopředu, dolů a je užší
    if (x > 0 && y < 0.05) {
      const t = Math.min(1, (0.05 - y) / 0.75);
      const k = (t * t * (3 - 2 * t)) * Math.pow(x / 1.1, 1.5);
      x += 0.46 * k;
      y -= 0.2 * k;
      z *= 1 - 0.22 * k;
    }
    // temeno trochu plošší, boky rovnější
    if (y > 0.6) y = 0.6 + (y - 0.6) * 0.88;
    z *= 1 + 0.06 * (1 - Math.abs(y));
    // zadní spoiler – jemné vytažení vzadu nahoře
    if (x < -0.6 && y > 0.1) x -= 0.05 * ((-x - 0.6) / 0.53) * (y / 1);
    // spodní řez (krk), vpředu níž než vzadu
    const yb = -0.6 - 0.2 * Math.max(-1, Math.min(1, x / 1.2));
    if (y < yb) {
      const d = yb - y;
      y = yb - d * 0.06;
      const s = 1 - Math.min(0.35, d * 0.5);
      x *= s; z *= s;
    }
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const W = bb.max.x - bb.min.x, H = bb.max.y - bb.min.y;

  // UV = boční projekce (u = zepředu dozadu, v = výška)
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - bb.min.x) / W, (pos.getY(i) - bb.min.y) / H);
  }
  uv.needsUpdate = true;

  // rozdělit trojúhelníky na pravou (z>0) a levou stranu – každá má vlastní texturu (čitelné číslo)
  const idx = geo.index.array;
  const right = [], left = [];
  for (let t = 0; t < idx.length; t += 3) {
    const zc = pos.getZ(idx[t]) + pos.getZ(idx[t + 1]) + pos.getZ(idx[t + 2]);
    (zc >= 0 ? right : left).push(idx[t], idx[t + 1], idx[t + 2]);
  }
  geo.setIndex([...right, ...left]);
  geo.clearGroups();
  geo.addGroup(0, right.length, 0);
  geo.addGroup(right.length, left.length, 1);

  // spodní obrys v UV (pro gumový lem)
  const BINS = 96, raw = new Array(BINS).fill(1);
  for (let i = 0; i < pos.count; i++) {
    const b = Math.min(BINS - 1, Math.floor(uv.getX(i) * BINS));
    raw[b] = Math.min(raw[b], uv.getY(i));
  }
  const bottom = raw.map((_, i) => { // vyhlazení
    let s = 0, n = 0;
    for (let k = -4; k <= 4; k++) { const j = i + k; if (j >= 0 && j < BINS) { s += raw[j]; n++; } }
    return s / n;
  });

  /* ---------- 2D prostor vzorů → UV ---------- */
  // obrys helmy v SVG prostoru: x 100…590, y 45…400
  const PX0 = 100, PX1 = 590, PY0 = 45, PY1 = 400;
  const TEX_W = 2048, TEX_H = 1536;
  const toTex = (ctx) => {
    ctx.setTransform(TEX_W / (PX1 - PX0), 0, 0, TEX_H / (PY1 - PY0), -PX0 * TEX_W / (PX1 - PX0), -PY0 * TEX_H / (PY1 - PY0));
  };
  const VISOR = new Path2D('M350 140 C428 112 530 124 582 182 C596 206 600 236 600 262 L600 272 L414 278 C372 272 346 242 346 204 Z');
  const EYEPORT = new Path2D('M360 150 C432 128 522 138 576 188 C596 212 600 236 600 256 L420 266 C384 260 358 236 354 206 Z');

  const mkCanvas = () => { const c = document.createElement('canvas'); c.width = TEX_W; c.height = TEX_H; return c; };
  const paintR = mkCanvas(), paintL = mkCanvas();
  const texR = new THREE.CanvasTexture(paintR), texL = new THREE.CanvasTexture(paintL);
  [texR, texL].forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.flipY = true; t.anisotropy = 8; });

  // alpha maska plexi a gumového lemu (statické)
  const visorMask = mkCanvas();
  { const c = visorMask.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, TEX_W, TEX_H); toTex(c); c.fillStyle = '#fff'; c.fill(VISOR); }
  const trimMask = mkCanvas();
  {
    const c = trimMask.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, TEX_W, TEX_H); c.fillStyle = '#fff';
    c.beginPath();
    for (let b = 0; b < BINS; b++) c.lineTo((b + .5) / BINS * TEX_W, (1 - bottom[b] - 0.075) * TEX_H);
    for (let b = BINS - 1; b >= 0; b--) c.lineTo((b + .5) / BINS * TEX_W, TEX_H);
    c.closePath(); c.fill();
  }
  const visorTex = new THREE.CanvasTexture(visorMask), trimTex = new THREE.CanvasTexture(trimMask);

  /* ---------- materiály ---------- */
  const paintMat = (map) => new THREE.MeshPhysicalMaterial({ map, roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.04 });
  const shellR = paintMat(texR), shellL = paintMat(texL);
  const shell = new THREE.Mesh(geo, [shellR, shellL]);

  const visorMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e3a8a, metalness: 0.9, roughness: 0.04, alphaMap: visorTex, transparent: true, alphaTest: 0.5,
    iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [250, 900], clearcoat: 1, side: THREE.FrontSide,
  });
  const visor = new THREE.Mesh(geo, visorMat);
  visor.scale.setScalar(1.022);

  const trim = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x0d0e0f, roughness: 0.85, alphaMap: trimTex, alphaTest: 0.5 }));
  trim.scale.setScalar(1.008);

  // čep plexi + větrací otvory
  const dark = new THREE.MeshStandardMaterial({ color: 0x141516, roughness: 0.5, metalness: 0.3 });
  const pivotGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.03, 40);
  const toWorld = (px, py) => [PX0 === 0 ? 0 : bb.min.x + ((px - PX0) / (PX1 - PX0)) * W, bb.max.y - ((py - PY0) / (PY1 - PY0)) * H];
  const [pvx, pvy] = toWorld(352, 232);
  const surfaceZ = (x, y) => { // najdi z povrchu v bodě (x,y) – nejbližší vrchol
    let best = 0, bd = 1e9;
    for (let i = 0; i < pos.count; i += 3) {
      const dz = pos.getZ(i); if (dz <= 0) continue;
      const d = (pos.getX(i) - x) ** 2 + (pos.getY(i) - y) ** 2;
      if (d < bd) { bd = d; best = dz; }
    }
    return best;
  };
  const pz = surfaceZ(pvx, pvy) * 1.022;
  [1, -1].forEach((side) => {
    const p = new THREE.Mesh(pivotGeo, dark);
    p.rotation.x = Math.PI / 2; p.position.set(pvx, pvy, side * (pz + 0.01));
    shell.add(p);
  });
  const ventGeo = new THREE.BoxGeometry(0.16, 0.035, 0.12);
  const topY = bb.max.y;
  const vent = new THREE.Mesh(ventGeo, dark); vent.position.set(0.15, topY - 0.005, 0); vent.rotation.z = -0.12; shell.add(vent);
  // zadní spoiler
  const spoilerShape = new THREE.Shape();
  spoilerShape.moveTo(0, 0); spoilerShape.quadraticCurveTo(-0.16, 0.05, -0.26, -0.02); spoilerShape.lineTo(-0.2, -0.09); spoilerShape.quadraticCurveTo(-0.1, -0.05, 0.02, -0.07); spoilerShape.closePath();
  const spoiler = new THREE.Mesh(new THREE.ExtrudeGeometry(spoilerShape, { depth: 0.42, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 }), dark);
  spoiler.position.set(bb.min.x + 0.42, 0.56, -0.21);
  spoiler.rotation.z = -0.55;
  shell.add(spoiler);

  const group = new THREE.Group();
  group.add(shell, visor, trim);
  group.rotation.y = -0.15;
  scene.add(group);

  // stín pod helmou
  const sh = document.createElement('canvas'); sh.width = sh.height = 256;
  { const c = sh.getContext('2d'); const g = c.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); }
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sh), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = bb.min.y - 0.02;
  scene.add(shadow);

  /* ---------- malování textury ---------- */
  const VISORS = {
    iridium: { color: 0x1e3a8a, metalness: 0.9, roughness: 0.04, iridescence: 1, opacity: 1 },
    gold: { color: 0xb7791f, metalness: 1, roughness: 0.05, iridescence: 0.7, opacity: 1 },
    smoke: { color: 0x121314, metalness: 0.35, roughness: 0.04, iridescence: 0, opacity: 1 },
    clear: { color: 0xcfe7ef, metalness: 0, roughness: 0.02, iridescence: 0, opacity: 0.28 },
  };

  let job = 0;
  async function paint(d) {
    const my = ++job;
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(d.svg)}`;
    try { await img.decode(); } catch (_) { return; }
    if (document.fonts?.ready) await document.fonts.ready;
    if (my !== job) return;

    [[paintR, false], [paintL, true]].forEach(([cv, mirror]) => {
      const c = cv.getContext('2d');
      c.setTransform(1, 0, 0, 1, 0, 0);
      toTex(c);
      c.drawImage(img, 0, 0, 640, 480);
      // vnitřek pod plexi + gumové těsnění kolem plexi
      c.fillStyle = '#0b0c0d'; c.fill(EYEPORT);
      c.lineWidth = 9; c.strokeStyle = '#0d0e0f'; c.stroke(VISOR);
      // boční větrací mřížka na bradě
      c.fillStyle = '#121314';
      [[528, 300], [522, 316], [514, 332]].forEach(([vx, vy]) => {
        c.save(); c.translate(vx, vy); c.rotate(-0.22);
        c.beginPath(); c.roundRect(0, 0, 36, 7, 3.5); c.fill(); c.restore();
      });
      // číslo
      if (d.num) {
        c.save();
        c.translate(236, 276);
        if (mirror) c.scale(-1, 1);
        c.font = `italic 900 84px Archivo, "Arial Black", sans-serif`;
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.lineJoin = 'round'; c.lineWidth = 8; c.strokeStyle = d.numStroke; c.globalAlpha = .6;
        c.strokeText(d.num, 0, 0);
        c.globalAlpha = 1; c.fillStyle = d.numFill; c.fillText(d.num, 0, 0);
        c.restore();
      }
      // logo X
      c.save(); c.translate(262, 334); if (mirror) c.scale(-1, 1);
      c.fillStyle = '#0b0c0d'; c.beginPath(); c.arc(0, 0, 12, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#24c3d3'; c.font = '900 16px Archivo, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('X', 0, 1);
      c.restore();
    });
    texR.needsUpdate = true; texL.needsUpdate = true;

    const f = d.finish;
    [shellR, shellL].forEach((m) => {
      m.roughness = f === 'matte' ? 0.78 : f === 'metal' ? 0.32 : 0.26;
      m.metalness = f === 'metal' ? 0.62 : 0.04;
      m.clearcoat = f === 'matte' ? 0 : 1;
      m.clearcoatRoughness = f === 'metal' ? 0.08 : 0.03;
      m.sheen = f === 'matte' ? 0.4 : 0;
      m.needsUpdate = true;
    });
    const vz = VISORS[d.visor] || VISORS.iridium;
    visorMat.color.setHex(vz.color);
    visorMat.metalness = vz.metalness; visorMat.roughness = vz.roughness;
    visorMat.iridescence = vz.iridescence; visorMat.opacity = vz.opacity;
    visorMat.alphaTest = vz.opacity < 1 ? 0 : 0.5;
    visorMat.depthWrite = vz.opacity >= 1;
    visorMat.needsUpdate = true;
    wrap.classList.add('is-ready');
    stage.classList.add('has-3d');
    pulse = 1;
  }

  document.addEventListener('helmet:change', (e) => paint(e.detail));
  const first = window.exposeHelmetPaint?.();
  if (first) paint(first);

  /* ---------- velikost + smyčka ---------- */
  const resize = () => {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(wrap);
  resize();

  let visible = true, pulse = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(wrap);
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const dt = clock.getDelta();
    if (pulse > 0) { pulse = Math.max(0, pulse - dt * 2.5); group.scale.setScalar(1 + Math.sin(pulse * Math.PI) * 0.03); }
    controls.update();
    renderer.render(scene, camera);
  });

  window.exposeHelmet3d = {
    snapshot() {
      try { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); } catch (_) { return null; }
    },
  };
}
