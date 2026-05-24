# InfiniteUniverse

Personal educational site for science, music, programming, simulation, games as discipline, and reflective writing.

Canonical public URL: `https://issacquantum.github.io/InfiniteUniverse/`

## Project Layout

- `index.html`: app shell, metadata, static fallback, style links, and module entry.
- `content/`: structured English and Spanish page fragments.
- `data/`: navigation, section metadata, site assets, and content references.
- `scripts/`: application behavior, navigation, reading settings, and interactive models.
- `styles/`: visual system, layout, components, and model-specific styles.
- `shaders/`: shader assets for visual models.
- `Assets2/`: public media, PDFs, images, music, and document assets.

## Local Testing

Run a static server from the repository root:

```sh
python3 -m http.server 4175
```

Then open:

```text
http://localhost:4175/
```

## Adding Content

1. Add the English and Spanish HTML fragments under `content/site/en/` and `content/site/es/`.
2. Register the new section or topic in `data/site-content.js`.
3. Keep visible labels, IDs, file names, and content paths aligned.
4. Avoid adding duplicate public labels for the same section.

## Knowledge Worlds

- `model-lab`: centralized discovery page for interactive models.
- `physical-foundations`: classical mechanics, electromagnetism, thermodynamics/statistical mechanics, and mathematical foundations.
- `quantum-foundations`: quantum mechanics, entanglement, quantum information, and quantum computing.
- `matter-life-mind`: quantum field theory, chemistry, biology, and neuroscience of consciousness.
- `spacetime-cosmos`: relativity, black holes, wormholes, and cosmology.
- `intelligence-computation`: artificial intelligence, information theory, programming, and simulations.
- `systems-method`: complex systems and philosophy of science.

## Adding Interactive Models

1. Add one teaching card before the model:
   - Model type
   - What this shows
   - What this does not show
   - Equation / principle
   - Try changing
   - What the model represents, when needed for interpretation
2. Add one model script under `scripts/`.
3. Import and initialize the model from `scripts/structured-content.js`.
4. Add a focused stylesheet under `styles/` only when shared styles are not enough.
5. Label each model with exactly one type: physical model, toy physical model, conceptual model, analogy model, artistic scientific visualization, or speculative conceptual model.
6. Add the model to `content/site/*/science/model-lab.html` so the central Model Lab stays complete.

## Deployment Notes

- Canonical site references belong in `index.html`, `robots.txt`, and `sitemap.xml`.
- The canonical deployment is GitHub Pages at `https://issacquantum.github.io/InfiniteUniverse/`.
- Bump the cache query string when changing scripts, styles, shaders, or content-loading behavior.
