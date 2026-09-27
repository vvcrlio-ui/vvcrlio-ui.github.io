# vvcrlio-ui.github.io
Personal website of Xiang Wan (万翔) — <https://vvcrlio-ui.github.io/>

Plain HTML + CSS + a little JavaScript. No build step, no dependencies.

```
index.html            all page content
404.html              not-found page
assets/css/style.css  design (colours, type, layout)
assets/js/main.js     optional enhancements (character field, nav highlight, BibTeX copy)
assets/img/favicon.svg
assets/cv.pdf         ← add your CV here
.nojekyll             serve files as-is (skip Jekyll)
```

## Editing content

Everything lives in `index.html`. Placeholders are written in `[square brackets]`
and each block starts with a `TODO` comment. Search for `[` and `TODO` to find
them all.

- **Publications**: copy one `<li class="pub">…</li>` block per paper, under the
  right `<h3 class="year">`. Wrap your own name in `<span class="me">`.
  Mark shared first authorship with `*`. The BibTeX sits in a `<details>`
  block; the script turns it into a toggle with a copy button.
- **News / Education / Service**: one `<li class="row">` per line, date first.
- **Projects**: one `<li class="project">` per project.
- **CV**: put the PDF at `assets/cv.pdf` (it is linked from the nav, intro and contact).
- **Email**: replace `you@university.edu` (appears twice).

## Design notes

- Off-white paper (`#f3f2ec`), near-black ink, a 24px graph-paper grid at ~4.5% opacity.
- Archivo for text, IBM Plex Mono for dates and metadata, Silkscreen (pixel)
  only for short labels such as section numbers and years.
- Bauhaus red / yellow / blue appear only as small markers; links underline,
  keyboard focus is a 3px blue outline.
- The character field next to the intro is decorative (`aria-hidden`), only
  animates while the pointer moves, stops when off-screen, and stays still
  under `prefers-reduced-motion`.
- No horizontal scrolling, no scroll hijacking, nothing only reachable by hover.
  Colours are tuned for WCAG AA contrast. Also prints cleanly.

Colours, font sizes and spacing are CSS variables at the top of `style.css`.

## Preview locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

## Deploy (GitHub Pages)

This is a user site repository, so it is served at `https://vvcrlio-ui.github.io/`.
In **Settings → Pages**, set *Source* to **Deploy from a branch**, branch `main`,
folder `/ (root)`. Every push to `main` then publishes automatically.
