/* Xiang Wan — homepage scripts. Everything here is an enhancement:
   the page is fully usable with JavaScript disabled. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ------------------------------------------------------------------
     1. Character field: the letters of the name on a grid, each one
        turning to face the pointer. Idle when nothing moves.
     ------------------------------------------------------------------ */
  function initField() {
    var canvas = document.querySelector(".field__canvas");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");

    var GLYPHS = ["X", "I", "A", "N", "G", "W", "A", "N", "万", "翔"];
    var CELL = 26;
    var cells = [];
    var w = 0, h = 0, dpr = 1;
    var pointer = null;       // {x, y} in canvas coordinates, or null
    var running = false;
    var visible = true;
    var ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#141414";

    function idleAngle(c) {
      // A calm, static field: a slow swirl around the panel's centre.
      var dx = c.x - w * 0.5, dy = c.y - h * 0.55;
      return Math.atan2(dy, dx) + Math.PI * 0.5 + Math.hypot(dx, dy) * 0.004;
    }

    function layout() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      if (!w || !h) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      var cols = Math.max(1, Math.floor(w / CELL));
      var rows = Math.max(1, Math.floor(h / CELL));
      var ox = (w - cols * CELL) / 2 + CELL / 2;
      var oy = (h - rows * CELL) / 2 + CELL / 2;
      var old = cells;
      cells = [];
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var i = r * cols + c;
          var cell = { x: ox + c * CELL, y: oy + r * CELL, ch: GLYPHS[i % GLYPHS.length], a: 0, t: 0, k: 0 };
          cell.a = old[i] ? old[i].a : idleAngle(cell);
          cells.push(cell);
        }
      }
      draw();
    }

    function shortest(from, to) {
      var d = (to - from) % (Math.PI * 2);
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      return d;
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = ink;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = '500 14px "IBM Plex Mono", "PingFang SC", "Noto Sans SC", monospace';
      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        ctx.globalAlpha = 0.2 + c.k * 0.55;
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.a);
        ctx.fillText(c.ch, 0, 0);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    function step() {
      var moving = false;
      var reach = Math.max(w, h) * 0.45;
      for (var i = 0; i < cells.length; i++) {
        var c = cells[i];
        var target, closeness = 0;
        if (pointer) {
          var dx = pointer.x - c.x, dy = pointer.y - c.y;
          // glyph's top faces the pointer
          target = Math.atan2(dy, dx) + Math.PI * 0.5;
          closeness = Math.max(0, 1 - Math.hypot(dx, dy) / reach);
        } else {
          target = idleAngle(c);
        }
        var d = shortest(c.a, target);
        var dk = closeness - c.k;
        c.a += d * 0.12;
        c.k += dk * 0.12;
        if (Math.abs(d) > 0.002 || Math.abs(dk) > 0.002) moving = true;
      }
      draw();
      if (moving && visible) {
        requestAnimationFrame(step);
      } else {
        running = false;
      }
    }

    function kick() {
      if (reduceMotion.matches || running || !visible) return;
      running = true;
      requestAnimationFrame(step);
    }

    function onMove(e) {
      var rect = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      kick();
    }
    function onLeave() {
      pointer = null;
      kick();
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) kick();
      }).observe(canvas);
    }

    if ("ResizeObserver" in window) {
      new ResizeObserver(layout).observe(canvas);
    } else {
      window.addEventListener("resize", layout);
    }

    layout();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(draw);
    }
  }

  /* ------------------------------------------------------------------
     2. Mark the nav link of the section currently being read.
     ------------------------------------------------------------------ */
  function initNav() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.site-nav a[href^="#"]'));
    if (!links.length) return;
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var sections = Object.keys(byId)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    var current = null;
    function set(id) {
      if (id === current) return;
      current = id;
      links.forEach(function (a) { a.removeAttribute("aria-current"); });
      if (id && byId[id]) byId[id].setAttribute("aria-current", "true");
    }

    function update() {
      ticking = false;
      // The last section whose top has passed the reading line wins;
      // at the very bottom of the page, the last section wins.
      var line = window.innerHeight * 0.35;
      var active = null;
      sections.forEach(function (s) {
        if (s.getBoundingClientRect().top <= line) active = s.id;
      });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        active = sections[sections.length - 1].id;
      }
      set(active);
    }
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ------------------------------------------------------------------
     3. BibTeX: turn each <details> into a toggle button + panel with a
        copy button (keeps the link row from jumping when opened).
     ------------------------------------------------------------------ */
  function initBib() {
    var n = 0;
    document.querySelectorAll("details.bib").forEach(function (det) {
      var pre = det.querySelector("pre");
      if (!pre) return;
      var id = "bib-" + (++n);

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bib-toggle";
      btn.textContent = "BibTeX";
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-controls", id);

      var panel = document.createElement("div");
      panel.className = "bib-panel";
      panel.id = id;
      panel.hidden = true;
      panel.appendChild(pre);

      if (navigator.clipboard && window.isSecureContext) {
        var copy = document.createElement("button");
        copy.type = "button";
        copy.className = "copy-btn";
        copy.textContent = "Copy";
        copy.addEventListener("click", function () {
          navigator.clipboard.writeText(pre.textContent.trim()).then(function () {
            copy.textContent = "Copied";
            setTimeout(function () { copy.textContent = "Copy"; }, 1600);
          });
        });
        panel.appendChild(copy);
      }

      btn.addEventListener("click", function () {
        var open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!open));
        panel.hidden = open;
      });

      var row = det.parentNode;
      row.replaceChild(btn, det);
      row.parentNode.insertBefore(panel, row.nextSibling);
    });
  }

  initField();
  initNav();
  initBib();
})();
