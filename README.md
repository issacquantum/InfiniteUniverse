# InfiniteUniverse

This is my personal educational site. It brings together science, interactive models, music, programming, simulation, games as discipline, and reflective writing.

Public site:

```text
https://issacquantum.github.io/InfiniteUniverse/
```

## How This Project Is Organized

- `index.html`: the main page shell, metadata, fallback text, style links, and app entry script.
- `content/`: the actual English and Spanish writing used by the site.
- `data/`: navigation, section names, asset paths, and the map that tells the site what content exists.
- `scripts/`: site behavior, navigation, reading settings, and interactive model code.
- `styles/`: layout, visual rules, components, and model styling.
- `shaders/`: visual shader files used by some model effects.
- `Assets2/`: PDFs, images, music, videos, icons, and other public media.

## Local Preview

When I want to preview the site from this folder, I can run:

```sh
python3 -m http.server 4175
```

Then I open:

```text
http://localhost:4175/
```

This is only for my computer. The public site is still the GitHub Pages link above.

## When I Add or Change Content

1. Add or edit the English and Spanish content files under `content/site/en/` and `content/site/es/`.
2. If it is a new section or topic, connect it in `data/site-content.js` so the site can display it.
3. Keep the visible section names, IDs, file names, and content paths consistent.
4. Avoid creating two names for the same section.
5. Check both desktop and phone behavior before pushing.

## Knowledge Worlds

- `model-lab`: central page for finding the interactive models.
- `physical-foundations`: classical mechanics, electromagnetism, thermodynamics/statistical mechanics, and mathematical foundations.
- `quantum-foundations`: quantum mechanics, entanglement, quantum information, and quantum computing.
- `matter-life-mind`: quantum field theory, chemistry, biology, and neuroscience of consciousness.
- `spacetime-cosmos`: relativity, black holes, wormholes, and cosmology.
- `intelligence-computation`: artificial intelligence, information theory, programming, and simulations.
- `systems-method`: complex systems and philosophy of science.

## When I Add or Change a Model

Each model should have one clear teaching card before it:

- Model type
- What this shows
- What this does not show
- Equation / principle
- Try changing
- What the model represents, when that helps interpretation

If I add a new model, I need to:

1. Put the model behavior in `scripts/`.
2. Initialize it from `scripts/structured-content.js`.
3. Add model-specific CSS in `styles/` only if the shared styles are not enough.
4. Use exactly one model type: physical model, toy physical model, conceptual model, analogy model, artistic scientific visualization, or speculative conceptual model.
5. Add it to `content/site/en/science/model-lab.html` and `content/site/es/science/model-lab.html` so Model Lab stays complete.

The shared foundation-topic models live in `scripts/foundation-models.js` and `styles/foundation-models.css`.

## Before I Push Changes

- Make sure the public site URL references stay aligned with `https://issacquantum.github.io/InfiniteUniverse/`.
- Update the cache query string when scripts, styles, shaders, or content-loading behavior changes.
- Run syntax and basic validation checks.
- Push both `main` and `gh-pages` after the local version is correct.
