# InfiniteUniverse

InfiniteUniverse is my personal archive and a public educational site. It brings together my science notes, interactive models, music, programming work, simulations, games, and longer writing. This documentation explains how the site works and how to continue maintaining it.

Live site:

```text
https://issacquantum.github.io/InfiniteUniverse/
```

## Structure

- `index.html` - main shell for the site.
- `content/` - English and Spanish page content.
- `data/` - navigation, section data, and asset references.
- `scripts/` - app behavior, navigation, reading settings, and models.
- `styles/` - layout, visual system, components, and model styles.
- `shaders/` - shader files used by visual effects.
- `Assets2/` - images, PDFs, videos, music, icons, and other media.

## Local Preview

From the project folder:

```sh
python3 -m http.server 4175 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4175/
```

That address is only for local testing on my machine. Binding to `127.0.0.1` keeps the preview server limited to this computer instead of exposing the project folder to other devices on the network.

## Bilingual Content

Most page text lives in:

```text
content/site/en/
content/site/es/
```

`data/site-content.js` connects each section to its content files and navigation labels. A new HTML fragment becomes available through the navigation once it is registered there.

English and Spanish pages share a section ID and matching content paths. Their prose follows the same facts and structure, with natural wording in each language. Visible titles can change without renaming internal IDs or files: `systems-work`, for example, is displayed as Professional Career / Trayectoria Profesional. The registration in `data/site-content.js` records that relationship.

After adding, renaming, or removing content HTML files, regenerate the sitemap:

```sh
node tools/generate-sitemap.mjs
```

## Science Areas

- `physical-foundations` - mechanics, electromagnetism, thermodynamics, mathematical foundations, and fluid mechanics / Navier–Stokes.
- `quantum-foundations` - quantum mechanics, entanglement, quantum information, quantum computing, and quantum complexity.
- `matter-life-mind` - quantum field theory, chemistry, biology, and neuroscience.
- `spacetime-cosmos` - relativity, black holes, wormholes, and cosmology.
- `intelligence-computation` - AI, information theory, programming, and simulations.
- `systems-method` - complex systems and philosophy of science.
- `model-lab` - model index.

## Equation Explainers

Equation pages live in:

```text
content/site/en/science/equations/
content/site/es/science/equations/
```

Each equation page follows this order:

- equation;
- literal reading;
- common reading;
- symbols;
- meaning of the equation.

The literal reading is how the equation is read out loud. The common reading is the short physics shorthand. The meaning section explains the physical or mathematical idea, including what the shorthand leaves unstated.

Literal readings begin with the read-aloud wording. The heading provides the context, so repeated lead-ins such as `Read it as:` or `Se lee:` are unnecessary.

Grouped terms are read as `the quantity ...` / `la cantidad ...`; ordinary function notation uses phrases such as `H of X` / `H de X`. Naming each opening and closing parenthesis is reserved for expressions that cannot be read clearly another way.

## Interactive Models

Interactive models appear in the sections they explain. `model-lab` indexes those models rather than duplicating them.

The model structure consists of:

- short teaching card before the model;
- one clear model type;
- script in `scripts/`;
- styling in `styles/` only if needed;
- initialization from `scripts/structured-content.js`;
- matching entry in the English and Spanish Model Lab pages.

The shared foundation models use:

```text
scripts/foundation-models.js
styles/foundation-models.css
```

## Before Pushing

- Check the site locally.
- Check desktop and phone behavior.
- Check the production URL references in `index.html`, `robots.txt`, and `sitemap.xml`.
- Update the affected cache query strings when scripts, styles, shaders, or content-loading behavior changes. Content fragments have a separate version in `scripts/content-cache.js`.
- Publish verified changes to `main` and fast-forward `gh-pages` to the same commit, then push both branches. GitHub Pages publishes from `gh-pages`.
- Check the deployed pages and assets at the production URL.

The detailed content and model conventions are in `docs/SITE_STRUCTURE.md`.

## Science navigation and static pages

The science reader includes a compact heading-based table of contents, related topics, and shareable hash URLs. Complete static science documents live under `science/`; their sources remain under `content/`.

Generate the public pages and sitemap with `node tools/generate-sitemap.mjs`, then run `node tools/check-site-integrity.mjs`. Content and navigation conventions are documented in [Science architecture](docs/SCIENCE_ARCHITECTURE.md).
