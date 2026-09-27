// Rotating 3D shape drawn with characters, used as the page background.
// Inspired by the ASCII background on maximiliankaspar.com; this is an
// independent, dependency-free renderer: a tube is swept along a torus-knot
// curve, sampled, rotated, projected with a z-buffer and shaded by
// picking a character from RAMP by brightness (like the classic donut.c).
(function () {
  var pre = document.querySelector('.ascii');
  if (!pre) return;

  var RAMP = ' .:-=+*#%@';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Shapes cycled through: torus knots (p, q) and a plain torus (1, 0).
  var SHAPES = [
    { p: 2, q: 3, tube: 0.55 },
    { p: 3, q: 5, tube: 0.42 },
    { p: 1, q: 0, tube: 1.1 }
  ];
  var SHAPE_SECONDS = 14;
  var K2 = 10;                         // camera distance
  var LIGHT = norm([0.4, 0.7, -0.6]);

  var cols, rows, cw, ch, scale, chars, zbuf;

  function norm(v) {
    var l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }

  function curve(s, t) {
    var r = Math.cos(s.q * t) + 2;
    return [r * Math.cos(s.p * t), r * Math.sin(s.p * t), -Math.sin(s.q * t)];
  }

  function measure() {
    var probe = document.createElement('span');
    probe.textContent = 'MMMMMMMMMM';
    pre.textContent = '';
    pre.appendChild(probe);
    cw = probe.getBoundingClientRect().width / 10;
    ch = parseFloat(getComputedStyle(pre).lineHeight);
    pre.removeChild(probe);
    cols = Math.ceil(window.innerWidth / cw);
    rows = Math.ceil(window.innerHeight / ch);
    chars = new Array(cols * rows);
    zbuf = new Float32Array(cols * rows);
    // Shape radius ~3.6 units should fill ~40% of the shorter screen side.
    scale = 0.4 * Math.min(window.innerWidth, window.innerHeight * 1.3) * K2 / 3.6;
  }

  function render(time) {
    var s = SHAPES[Math.floor(time / SHAPE_SECONDS) % SHAPES.length];
    var a = time * 0.35, b = time * 0.22;
    var ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);

    chars.fill(' ');
    zbuf.fill(0);

    var NT = 1500, NV = 44, eps = 1e-3;
    for (var i = 0; i < NT; i++) {
      var t = (i / NT) * Math.PI * 2;
      var c = curve(s, t);
      var c1 = curve(s, t + eps), c0 = curve(s, t - eps);
      var T = norm([c1[0] - c0[0], c1[1] - c0[1], c1[2] - c0[2]]);
      var N = norm(cross(T, Math.abs(T[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1]));
      var B = cross(T, N);

      for (var j = 0; j < NV; j++) {
        var v = (j / NV) * Math.PI * 2, cv = Math.cos(v), sv = Math.sin(v);
        var nx = N[0] * cv + B[0] * sv, ny = N[1] * cv + B[1] * sv, nz = N[2] * cv + B[2] * sv;
        var x = c[0] + s.tube * nx, y = c[1] + s.tube * ny, z = c[2] + s.tube * nz;

        // rotate around X by a, then around Y by b (same for the normal)
        var y1 = y * ca - z * sa, z1 = y * sa + z * ca;
        var x2 = x * cb + z1 * sb, z2 = -x * sb + z1 * cb;
        var ny1 = ny * ca - nz * sa, nz1 = ny * sa + nz * ca;
        var nx2 = nx * cb + nz1 * sb, nz2 = -nx * sb + nz1 * cb;

        var ooz = 1 / (z2 + K2);
        var col = Math.floor(cols / 2 + (scale * x2 * ooz) / cw);
        var row = Math.floor(rows / 2 - (scale * y1 * ooz) / ch);
        if (col < 0 || col >= cols || row < 0 || row >= rows) continue;

        var k = row * cols + col;
        if (ooz <= zbuf[k]) continue;
        zbuf[k] = ooz;
        var L = nx2 * LIGHT[0] + ny1 * LIGHT[1] + nz2 * LIGHT[2];
        chars[k] = RAMP[1 + Math.floor(Math.max(0, L) * (RAMP.length - 2) + 0.5)];
      }
    }

    var out = '';
    for (var r = 0; r < rows; r++) out += chars.slice(r * cols, (r + 1) * cols).join('') + '\n';
    pre.textContent = out;
  }

  // Fully visible over the intro, faint behind the text below it.
  function fade() {
    var p = Math.min(1, window.scrollY / (window.innerHeight * 0.8));
    pre.style.opacity = String(1 - p * 0.8);
  }

  var last = 0, start = performance.now();
  function loop(now) {
    if (now - last > 33) {           // ~30 fps is plenty for text
      last = now;
      render((now - start) / 1000);
    }
    requestAnimationFrame(loop);
  }

  measure();
  fade();
  window.addEventListener('scroll', fade, { passive: true });
  window.addEventListener('resize', function () { measure(); render(2); });

  if (reduceMotion) render(2);
  else requestAnimationFrame(loop);
})();
