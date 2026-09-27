// Shared page behaviour: the ■ marker in the header, the scrolling bands,
// and click-to-enlarge photos.

// ■ follows the section in view. Sections name their nav item with data-nav.
(function () {
  var sections = document.querySelectorAll('[data-nav]');
  if (!sections.length || !('IntersectionObserver' in window)) return;
  var items = document.querySelectorAll('.site-header [data-item]');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var name = e.target.getAttribute('data-nav');
      items.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('data-item') === name); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(function (s) { io.observe(s); });
})();

// Scrolling bands: the track holds two identical halves and slides by -50%,
// so each half must be wider than the screen for a seamless loop.
(function () {
  document.querySelectorAll('.band__track').forEach(function (track) {
    var n = track.children.length / 2;
    var unit = Array.prototype.slice.call(track.children, 0, n)
      .map(function (el) { return el.outerHTML; }).join('');
    var reps = 1;
    while (track.scrollWidth / 2 < window.innerWidth * 1.2 && reps < 10) {
      reps++;
      var half = new Array(reps + 1).join(unit);
      track.innerHTML = half + half;
    }
  });
})();

// Photos: click to widen to two columns, click again to shrink.
(function () {
  document.querySelectorAll('.photo').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });
})();
