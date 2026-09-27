// Rotating 3D scan drawn in characters behind the page.
// Same technique and settings as the background on maximiliankaspar.com:
// three.js AsciiEffect over a MeshNormalMaterial, character set
// " .:-=+*1#%@0$!*", resolution 0.2 (0.25 on phones), a turntable spin of
// 0.12 rad/s (0.002 rad per frame at 60 fps, ~52 s per turn) and a one-second
// bottom-up reveal. One model is picked at random on each visit.
import * as THREE from 'three';
import { AsciiEffect } from 'three/addons/effects/AsciiEffect.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';

const MODELS = [
  { file: 'assets/models/nefertiti.glb', credit: 'Nefertiti bust scan by Fraunhofer IGD (CC BY-NC)' },
  { file: 'assets/models/lee-perry-smith.glb', credit: 'Head scan by Lee Perry-Smith / Infinite Realities (CC BY 3.0)' },
  { file: 'assets/models/lucy.ply', credit: 'Lucy, Stanford 3D Scanning Repository' }
];
const CHARS = ' .:-=+*1#%@0$!*';
const SPEED = 0.12;      // rad/s
const REVEAL = 1;        // s

const holder = document.querySelector('.ascii');
const phone = window.matchMedia('(max-width: 767px)').matches;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (holder) {
  try { start(); } catch (e) { /* no WebGL: keep the plain background */ }
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
  const turntable = new THREE.Group();
  turntable.rotation.y = 0.6;
  scene.add(turntable);

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

  const onGeometry = (geometry) => {
    if (!geometry.attributes.normal) geometry.computeVertexNormals();
    geometry.center();
    geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial({ clippingPlanes: [clip] }));
    mesh.scale.setScalar(0.98 / geometry.boundingSphere.radius);
    turntable.add(mesh);
    run(mesh);
  };

  if (model.file.endsWith('.ply')) {
    new PLYLoader().load(model.file, onGeometry);
  } else {
    new GLTFLoader().load(model.file, (gltf) => {
      let geometry = null;
      gltf.scene.traverse((o) => { if (o.isMesh && !geometry) geometry = o.geometry.clone(); });
      if (geometry) onGeometry(geometry);
    });
  }

  function run(mesh) {
    if (reduceMotion) {
      mesh.material.clippingPlanes = [];
      effect.render(scene, camera);
      return;
    }
    let last = performance.now();
    const t0 = last;
    function frame(now) {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      turntable.rotation.y += SPEED * dt;
      const p = Math.min(1, (now - t0) / 1000 / REVEAL);
      clip.constant = -1 + 2 * p;   // sweep the cut from bottom to top
      if (p >= 1 && mesh.material.clippingPlanes.length) mesh.material.clippingPlanes = [];
      effect.render(scene, camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // Full strength over the intro, faint behind the text below it.
  // Pages without an intro (data-ascii="dim") keep it faint throughout.
  const dim = document.body.dataset.ascii === 'dim';
  function fade() {
    const p = dim ? 1 : Math.min(1, window.scrollY / (window.innerHeight * 0.8));
    holder.style.opacity = String(1 - p * 0.75);
  }
  fade();
  window.addEventListener('scroll', fade, { passive: true });
}
