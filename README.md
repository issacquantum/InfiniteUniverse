# InfiniteUniverse

Personal site for my science notes, interactive models, music, programming work, simulations, games, and longer writing.

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

## Content Notes

Most page text lives in:

```text
content/site/en/
content/site/es/
```

When adding a new section, the content file is not enough by itself. The section also has to be connected in `data/site-content.js`, otherwise the navigation will not know it exists.

Names should stay consistent across visible labels, section IDs, file names, and content paths. If one section has multiple names in different files, it becomes harder to maintain and easier to break.

After adding, renaming, or removing content HTML files, regenerate the sitemap:

```sh
node tools/generate-sitemap.mjs
```

## Science Areas

- `physical-foundations` - mechanics, electromagnetism, thermodynamics, and mathematical foundations.
- `quantum-foundations` - quantum mechanics, entanglement, quantum information, and quantum computing.
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

Each equation page should keep the same order:

- literal reading;
- common reading;
- symbols;
- meaning of the equation.

The literal reading is how the equation is read out loud. The common reading is the short physics shorthand. The meaning section should explain the idea in plain language and should not repeat the common reading.

Literal readings should start directly with the read-aloud wording. Do not add repeated lead-ins such as `Read it as:` or `Se lee:` because the section title already provides that context.

When an equation contains parentheses, write the literal reading in natural spoken form. Use wording like `the quantity ...` / `la cantidad ...` for grouped terms, and use function phrasing like `H of X` / `H de X` when the parentheses are ordinary function notation. Avoid spelling out `open parenthesis`, `close parenthesis`, `paréntesis abierto`, or `paréntesis cerrado` unless there is no clearer way to read the expression.

## Model Notes

Interactive models should stay tied to the section where they belong. `model-lab` is only a place to find them faster.

For new models, keep the same pattern:

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
- Keep the GitHub Pages URL references aligned with the live site URL.
- Update the cache query string when scripts, styles, shaders, or content-loading behavior changes.
- Push both `main` and `gh-pages`.
