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

- `index.html` loads the app shell, public URL metadata, styles, and module entry point.
- `scripts/app.js` creates the app state and calls the renderer.
- `scripts/structured-content.js` loads structured HTML fragments and initializes models inside the loaded section.
- Science and personal pages live under `content/site/en/` and `content/site/es/`.
- Equation explainer pages live under `content/site/*/science/equations/`.
- The centralized model index lives at `content/site/*/science/model-lab.html`; models still remain embedded in their original science pages.

## Equation Explainers

Equation detail pages use the same reader structure in both languages:

- English: `Equation`, `Literal Reading`, `Common Reading`, `Symbols`, `Meaning of the Equation`.
- Spanish: `Ecuación`, `Lectura Literal`, `Lectura Común`, `Símbolos`, `Significado de la Ecuación`.

The literal reading is for reading the symbols out loud. The common reading is a short shorthand. The meaning section should explain the physical or mathematical idea without repeating the common reading.

Literal readings start directly with the read-aloud wording. They should not repeat labels such as `Read it as:` or `Se lee:` inside the paragraph.

Parentheses in literal readings should be spoken naturally. Use `the quantity ...` or `la cantidad ...` for grouped terms, and use function phrasing such as `H of X` or `H de X` for ordinary function notation. Do not mechanically spell out `open parenthesis`, `close parenthesis`, `paréntesis abierto`, or `paréntesis cerrado` when a clearer spoken form exists.

## Knowledge World Domains

- `physical-foundations`: classical mechanics, electromagnetism, thermodynamics/statistical mechanics, mathematical foundations.
- `quantum-foundations`: quantum mechanics, quantum entanglement, quantum information, quantum computing.
- `matter-life-mind`: quantum field theory, chemistry and molecular structure, biology and life systems, neuroscience of consciousness.
- `spacetime-cosmos`: relativity and spacetime, black holes, wormholes, cosmology and the early universe.
- `intelligence-computation`: artificial intelligence, information theory, programming and algorithms, simulation and models.
- `systems-method`: complex systems and emergence, philosophy of science.
- `model-lab`: central model index.

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

The shared foundation-topic model initializer is `scripts/foundation-models.js`; its shared visual rules are in `styles/foundation-models.css`.

## Deployment

Public site URL: `https://issacquantum.github.io/InfiniteUniverse/`

References in `index.html`, `robots.txt`, and `sitemap.xml` should keep pointing to that URL.
