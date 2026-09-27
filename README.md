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
- `assets/portrait-dither.png`, `assets/portrait.jpg` — dithered portrait and the greyscale photo shown on hover.
- `cv.pdf` — add your CV at the repo root so the "cv" link works.

## 3D model credits
Scans of plaster casts from SMK – Statens Museum for Kunst (Royal Cast Collection), released into the
public domain (CC0) via open.smk.dk. Pedestals were cropped and the meshes reduced for the web.
- `assets/models/david.glb` — Head of David, after Michelangelo (KAS2232).
- `assets/models/antinous.glb` — Portrait of Antinous with ivy wreath (DEP454).
- `assets/models/amazon.glb` — Head of an Amazon, Sciarra type (KAS615).
