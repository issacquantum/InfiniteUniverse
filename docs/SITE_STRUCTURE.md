# Site Structure

This guide describes the files and conventions behind `https://issacquantum.github.io/InfiniteUniverse/`.

## Folders

- `content/`: page writing and structured HTML fragments.
- `data/`: navigation, section metadata, and asset references.
- `scripts/`: app behavior, navigation, model initialization, and interactive visualizations.
- `styles/`: layout, typography rules, components, and model-specific CSS.
- `shaders/`: GLSL shader files used by visual models.
- `Assets2/`: public media, documents, PDFs, images, and music assets.
- `tools/`: small maintenance scripts, including sitemap generation.

## Content Flow

- `index.html` loads the app shell, public URL metadata, styles, and module entry point.
- `scripts/app.js` creates the app state and calls the renderer.
- `scripts/structured-content.js` loads structured HTML fragments and initializes models inside the loaded section.
- Science and personal pages live under `content/site/en/` and `content/site/es/`.
- Equation explainer pages live under `content/site/*/science/equations/`.
- The centralized model index lives at `content/site/*/science/model-lab.html`; models still remain embedded in their original science pages.

## Bilingual Sections

Personal writing and scientific explanations are HTML content; navigation and rendering are separate infrastructure in `data/` and `scripts/`. English and Spanish fragments use matching relative paths under their language folders. `data/site-content.js` supplies their shared IDs, translated labels, and content paths.

Internal IDs remain stable when a public title changes:

| Internal ID | English title | Spanish title |
| --- | --- | --- |
| `systems-work` | Professional Career | Trayectoria Profesional |
| `practice-worlds` | Favorite Video Games | Videojuegos Favoritos |
| `personal-cosmology` | My Theory | Mi Teoría |

The two languages carry the same facts, chronology, scientific distinctions, equations, and references. Sentence structure can differ where a literal translation would sound unnatural.

## Equation Explainers

Equation detail pages use the same reader structure in both languages:

- English: `Equation`, `Literal Reading`, `Common Reading`, `Symbols`, `Meaning of the Equation`.
- Spanish: `Ecuación`, `Lectura Literal`, `Lectura Común`, `Símbolos`, `Significado de la Ecuación`.

The literal reading is for reading the symbols out loud. The common reading gives the usual shorthand. The meaning section explains the physical or mathematical idea, including its mechanism, consequences, or scope.

Literal readings start directly with the read-aloud wording. The heading makes repeated labels such as `Read it as:` or `Se lee:` unnecessary.

Literal readings use `the quantity ...` or `la cantidad ...` for grouped terms and phrases such as `H of X` or `H de X` for ordinary function notation. Naming opening and closing parentheses is useful only when no clearer spoken form exists.

## Knowledge World Domains

- `physical-foundations`: classical mechanics, electromagnetism, thermodynamics/statistical mechanics, mathematical foundations, fluid mechanics / Navier–Stokes.
- `quantum-foundations`: quantum mechanics, quantum entanglement, quantum information, quantum computing, quantum complexity.
- `matter-life-mind`: quantum field theory, chemistry and molecular structure, biology and life systems, neuroscience of consciousness.
- `spacetime-cosmos`: relativity and spacetime, black holes, wormholes, cosmology and the early universe.
- `intelligence-computation`: artificial intelligence, information theory, programming and algorithms, simulation and models.
- `systems-method`: complex systems and emergence, philosophy of science.
- `model-lab`: central model index.

## Adding A Content Page

1. Add the English and Spanish HTML fragments under the matching `content/site/` paths.
2. Register the page in `data/site-content.js`.
3. Check that the registration points to both language files and uses the same section ID in both languages. Existing IDs remain unchanged when only a title changes.
4. Regenerate `sitemap.xml` with `node tools/generate-sitemap.mjs`.
5. Run syntax checks before publishing.

## Adding A Model

1. Add a focused HTML figure with a single teaching card.
2. Add one model initializer in `scripts/`.
3. Import and call that initializer from `scripts/structured-content.js`.
4. Add a model-specific stylesheet only if existing component styles are not enough.
5. Identify the model type: physical model, toy physical model, conceptual model, analogy model, artistic scientific visualization, or speculative conceptual model.
6. Register the model in the Model Lab page in both English and Spanish.

The shared foundation-topic model initializer is `scripts/foundation-models.js`; its shared visual rules are in `styles/foundation-models.css`.

## Deployment

Public site URL: `https://issacquantum.github.io/InfiniteUniverse/`

`index.html`, `robots.txt`, and `sitemap.xml` use this production URL, including the `/InfiniteUniverse/` path. The project is a static site; local preview and the publishing checklist are documented in `README.md`. Both `main` and `gh-pages` track published changes, with GitHub Pages serving `gh-pages`.

## Science discovery

`data/topic-metadata.js` is the shared source for topic icons, signatures, moods, prerequisites, and related topics. `scripts/routes.js` handles shareable reading state; `scripts/science-reader.js` adds the TOC and related links; `scripts/science-search.js` searches the generated language-specific index.

`science/en/` and `science/es/` contain generated complete public documents. Edit their source fragments, then run `node tools/generate-sitemap.mjs`. The sitemap lists these canonical documents rather than raw fragments. See [Science architecture](SCIENCE_ARCHITECTURE.md) for generation, validation, legacy cosmology, and publishing details.
