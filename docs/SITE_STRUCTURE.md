# Site Structure

This file documents the project layout for `https://issacquantum.github.io/InfiniteUniverse/`.

## Folders

- `content/`: page writing and structured HTML fragments.
- `data/`: navigation, section metadata, and asset references.
- `scripts/`: app behavior, navigation, model initialization, and interactive visualizations.
- `styles/`: layout, typography rules, components, and model-specific CSS.
- `shaders/`: GLSL shader files used by visual models.
- `Assets2/`: public media, documents, PDFs, images, and music assets.

## Content Flow

- `index.html` loads the app shell, canonical metadata, styles, and module entry point.
- `scripts/app.js` creates the app state and calls the renderer.
- `scripts/structured-content.js` loads structured HTML fragments and initializes models inside the loaded section.
- Science and personal pages live under `content/site/en/` and `content/site/es/`.
- Equation explainer pages live under `content/site/*/science/equations/`.
- The centralized model index lives at `content/site/*/science/model-lab.html`; models still remain embedded in their original science pages.

## Adding A Content Page

1. Add the English and Spanish HTML fragments under the matching `content/site/` paths.
2. Register the page in `data/site-content.js`.
3. Keep section IDs, file paths, and visible labels aligned.
4. Run syntax checks before publishing.

## Adding A Model

1. Add a focused HTML figure with a single teaching card.
2. Add one model initializer in `scripts/`.
3. Import and call that initializer from `scripts/structured-content.js`.
4. Add a model-specific stylesheet only if existing component styles are not enough.
5. Keep model labels clear: physical model, toy physical model, conceptual model, analogy model, artistic scientific visualization, or speculative conceptual model.
6. Register the model in the Model Lab page in both English and Spanish.

## Deployment

Canonical public URL: `https://issacquantum.github.io/InfiniteUniverse/`

References in `index.html`, `robots.txt`, and `sitemap.xml` should keep pointing to that URL.
