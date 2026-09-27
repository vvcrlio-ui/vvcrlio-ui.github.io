// Rotating classical bust drawn in characters behind the page.
//
// Rendering follows the background on maximiliankaspar.com: three.js
// AsciiEffect over a MeshNormalMaterial, character set " .:-=+*1#%@0$!*",
// resolution 0.2 (0.25 on phones), a turntable spin of 0.12 rad/s and a
// one-second bottom-up reveal.
//
// Motion follows David Černý's Head of Franz Kafka in Prague: the head is
// cut into horizontal layers that turn independently, break the face apart
// in a pattern, then swing back into line. One model is picked per visit.
import * as THREE from 'three';
import { AsciiEffect } from 'three/addons/effects/AsciiEffect.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Public-domain (CC0) scans of plaster casts, SMK – Statens Museum for Kunst,
// Copenhagen; cropped, oriented and reduced to ~38k faces for the web.
const MODELS = [
  { file: 'assets/models/david.glb', credit: 'Head of David after Michelangelo, 3D scan: SMK, public domain' },
  { file: 'assets/models/antinous.glb', credit: 'Antinous with ivy wreath, 3D scan: SMK, public domain' },
  { file: 'assets/models/amazon.glb', credit: 'Head of an Amazon, 3D scan: SMK, public domain' }
];
const CHARS = ' .:-=+*1#%@0$!*';
const SPEED = 0.12;      // rad/s, whole head
const REVEAL = 1;        // s
const LAYERS = 28;       // the Prague head has 42 steel layers

// One choreography cycle, in seconds: face held, layers turn out one after
// another, pause, layers turn back. STAGGER spreads the start times top→bottom.
const HOLD = 4, MOVE = 3.2, STAY = 1.4, STAGGER = 1.1;
const CYCLE = HOLD + MOVE + STAY + MOVE;

// Where each layer i (0 = bottom) of n turns to; r() is a per-cycle random.
const PATTERNS = [
  (i, n) => Math.sin((i / n) * Math.PI * 2) * Math.PI * 0.85,   // wave
  (i) => (i % 2 ? 1 : -1) * Math.PI * 0.7,                      // alternate
  (i, n) => (i / n) * Math.PI * 2,                              // twist
  (i, n, r) => (r() * 2 - 1) * Math.PI                          // scatter
];

const holder = document.querySelector('.ascii');
const phone = window.matchMedia('(max-width: 767px)').matches;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (holder) {
  try { start(); } catch (e) { /* no WebGL: keep the plain background */ }
}

// Split a mesh into horizontal layers by triangle centre height.
function sliceGeometry(source, n) {
  if (!source.attributes.normal) source.computeVertexNormals();
  const g = source.index ? source.toNonIndexed() : source;
  // Read through getX/Y/Z so interleaved or quantized attributes work too.
  const flat = (a) => {
    const f = new Float32Array(a.count * 3);
    for (let v = 0; v < a.count; v++) { f[v * 3] = a.getX(v); f[v * 3 + 1] = a.getY(v); f[v * 3 + 2] = a.getZ(v); }
    return f;
  };
  const pos = flat(g.attributes.position);
  const nor = flat(g.attributes.normal);
  g.computeBoundingBox();
  const minY = g.boundingBox.min.y, span = g.boundingBox.max.y - minY || 1;

  const tris = pos.length / 9;
  const layerOf = new Uint16Array(tris);
  const counts = new Uint32Array(n);
  for (let t = 0; t < tris; t++) {
    const cy = (pos[t * 9 + 1] + pos[t * 9 + 4] + pos[t * 9 + 7]) / 3;
    const k = Math.min(n - 1, Math.floor(((cy - minY) / span) * n));
    layerOf[t] = k;
    counts[k]++;
  }
  const out = [], fill = new Uint32Array(n);
  for (let k = 0; k < n; k++) {
    out.push({ p: new Float32Array(counts[k] * 9), n: new Float32Array(counts[k] * 9) });
  }
  for (let t = 0; t < tris; t++) {
    const k = layerOf[t], o = fill[k] * 9;
    out[k].p.set(pos.subarray(t * 9, t * 9 + 9), o);
    out[k].n.set(nor.subarray(t * 9, t * 9 + 9), o);
    fill[k]++;
  }
  return out.map((b) => {
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(b.p, 3));
    lg.setAttribute('normal', new THREE.BufferAttribute(b.n, 3));
    return lg;
  });
}

function ease(x) {
  x = Math.min(1, Math.max(0, x));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function seeded(seed) {
  return function () {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// Load a model file and hand back its first mesh geometry.
// (Kept separate so a build can swap how files are fetched.)
function loadGeometry(file, done) {
  new GLTFLoader().load(file, (gltf) => {
    let geometry = null;
    gltf.scene.traverse((o) => { if (o.isMesh && !geometry) geometry = o.geometry.clone(); });
    if (geometry) done(geometry);
  });
}

function start() {
  const renderer = new THREE.WebGLRenderer();
  renderer.setClearColor(0xffffff);
  renderer.localClippingEnabled = true;

  const effect = new AsciiEffect(renderer, CHARS, { invert: false, resolution: phone ? 0.25 : 0.2 });
  holder.appendChild(effect.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const clip = new THREE.Plane(new THREE.Vector3(0, -1, 0), -1);
  const material = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide, clippingPlanes: [clip] });
  const head = new THREE.Group();
  head.rotation.y = 0.35;
  head.position.y = 0.16;          // sit high, above the name
  scene.add(head);

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    effect.setSize(window.innerWidth, window.innerHeight);
  }
  resize();
  window.addEventListener('resize', resize);

  const model = MODELS[Math.floor(Math.random() * MODELS.length)];
  const credit = document.querySelector('[data-model-credit]');
  if (credit) credit.textContent = model.credit;

  loadGeometry(model.file, (geometry) => {
    geometry.center();
    geometry.computeBoundingSphere();
    head.scale.setScalar(0.98 / geometry.boundingSphere.radius);
    const layers = sliceGeometry(geometry, LAYERS).map((lg) => {
      const m = new THREE.Mesh(lg, material);
      head.add(m);
      return m;
    });
    run(layers);
  });

  function run(layers) {
    if (reduceMotion) {
      material.clippingPlanes = [];
      effect.render(scene, camera);
      return;
    }
    const n = layers.length;
    let last = performance.now();
    const t0 = last;
    let cycle = -1, targets = [];

    function frame(now) {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;

      head.rotation.y += SPEED * dt;

      // Reveal from the bottom up during the first second.
      const p = Math.min(1, t / REVEAL);
      clip.constant = -1 + 2 * p;
      if (p >= 1 && material.clippingPlanes.length) material.clippingPlanes = [];

      // Kafka-style layer choreography.
      const c = Math.floor(t / CYCLE);
      if (c !== cycle) {
        cycle = c;
        const pattern = PATTERNS[c % PATTERNS.length];
        const r = seeded(c * 7919 + 1);
        targets = layers.map((_, i) => pattern(i, n, r));
      }
      const tc = t - c * CYCLE;
      const span = MOVE - STAGGER;
      for (let i = 0; i < n; i++) {
        const lag = ((n - 1 - i) / (n - 1)) * STAGGER;   // top layer leads
        let k = 0;
        if (tc < HOLD) k = 0;
        else if (tc < HOLD + MOVE) k = ease((tc - HOLD - lag) / span);
        else if (tc < HOLD + MOVE + STAY) k = 1;
        else k = 1 - ease((tc - HOLD - MOVE - STAY - lag) / span);
        layers[i].rotation.y = targets[i] * k;
      }

      effect.render(scene, camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // Full strength over the intro, faint behind the text below it.
  // Pages without an intro (data-ascii="dim") keep it faint throughout.
  const dim = document.body.dataset.ascii === 'dim';
  function fade() {
    const q = dim ? 1 : Math.min(1, window.scrollY / (window.innerHeight * 0.8));
    holder.style.opacity = String(1 - q * 0.75);
  }
  fade();
  window.addEventListener('scroll', fade, { passive: true });
}
