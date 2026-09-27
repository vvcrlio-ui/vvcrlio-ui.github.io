# vvcrlio-ui.github.io
Personal website of Xiang WAN (万翔).

A plain HTML + CSS academic homepage (no build step), served by GitHub Pages.

- `index.html` — home: intro, about, news, publications, experience, contact. Replace every `[placeholder]`.
- `others.html` — travel and photography. Put photos in `assets/photos/` and point each `<img src>` at them;
  copy an `<article class="trip">` block per trip, or a `<button class="photo">` per photo.
- `style.css` — design (colours, fonts and spacing are tokens in `:root` at the top).
- `site.js` — header ■ marker, scrolling bands, click-to-enlarge photos.
- `ascii.js` — the rotating character background (three.js AsciiEffect). The head is cut into horizontal layers that turn
  apart and back into line, after David Černý's Head of Franz Kafka in Prague. One model is picked at random per visit.
- `assets/portrait.svg` — placeholder photo; replace with your own.
- `cv.pdf` — add your CV at the repo root so the "cv" link works.

## 3D model credits
- `assets/models/nefertiti.glb` — 3D scan of a copy of the Nefertiti bust, Fraunhofer IGD, CC BY-NC.
- `assets/models/lee-perry-smith.glb` — head scan by Lee Perry-Smith / Infinite Realities, CC BY 3.0.

Both come from the three.js examples. The site credits the model on show in its footer.
