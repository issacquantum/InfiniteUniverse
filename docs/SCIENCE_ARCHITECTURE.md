# Science content and navigation

The source baseline for this expansion is `18b442f405d497022f37f9f5aa33dba5b633423f`. Its scientific corrections remain in the source pages. Personal pages and assets are outside this expansion.

## Content and metadata

`data/site-content.js` registers domains, topics, branches, and detail pages. `data/topic-metadata.js` supplies each topic's navigation icon, signature, mood, prerequisites, and related topics. Relationships use language-independent IDs; titles come from the bilingual registry. Shared equations can appear in several topic branches, but one equation ID must always identify the same source file.

Probability and Statistics and Mathematical Analysis and Differential Equations are separate topics within Physical Foundations. The latter bridges the existing mathematical overview and the function-space assumptions used in fluid mechanics. Equation explanations use the existing five-part structure.

Biology's evolution, cellular organization, and measurement sections have been consolidated. Chemistry's bonding and kinetics sections now keep the definitions, equations, and concrete examples together. Repeated copies of the Spanish scientific caveats were removed while keeping each correction once. Model limitations and glossary definitions can repeat a concept intentionally at the point of use.

## Reading and URLs

`#/en/science/probability-statistics` opens a topic. The Spanish counterpart starts with `#/es/`. Optional `branch` and `detail` parameters identify an equation. A `from` parameter records a legacy detail origin when needed. Personal and domain routes use their own path segments. Invalid IDs cannot select arbitrary source files.

`scripts/routes.js` validates routes and connects the existing state store to browser history. History entries retain reader positions and equation return targets. Directly opened equations return to their parent topic when no more specific origin was supplied. Language switching continues to use the existing bilingual position restoration.

The compact table of contents is generated from H2/H3 headings on pages with at least six headings. Explicit source IDs take precedence; otherwise heading order supplies deterministic IDs. TOC links retain the route and a heading parameter. A later editorial reordering should preserve explicit IDs for externally linked headings.

## Public static documents

`tools/generate-science-pages.mjs` creates complete documents under `science/en/` and `science/es/`. These are generated copies, not a second editing source. Each document has a title, description, canonical URL, alternate-language link, and a link back to its interactive reading context. Equation links lead to complete documents. Model descriptions remain readable; interactive model controls belong to the main reader.

`tools/generate-sitemap.mjs` invokes this generation and writes the sitemap from the public-document inventory. Raw content fragments and personal material are not newly exposed as independent indexed pages. `robots.txt` continues to point to the root sitemap. There are no server-side routes or backend requirements.

## Legacy cosmology

The legacy renderer stays in place. It extracts whole pages, individual contributor sections, and custom introductions; it also rewrites equation and return links. Migrating it now would combine a content migration with navigation changes and risk losing section boundaries or return positions. The static generator respects those extraction boundaries without changing the interactive content architecture. Existing missing legacy images are omitted from generated documents, as unavailable images are not useful static illustrations; source files remain intact.

## Performance and publishing

Prewarming schedules a bounded set of current-language destinations: the current topic, neighboring topics, and up to three nearby equations. Requests run during idle time, stop scheduling when context changes, and are skipped for data-saving or 2G connections. The existing document/request caches prevent duplicate fetches.

Run from the repository root:

```sh
node tools/generate-sitemap.mjs
node tools/check-site-integrity.mjs
node tools/test-science-navigation.mjs
node tools/test-reader-position.mjs
node tools/test-mobile-performance.mjs
node tools/test-targeted-prewarm.mjs
```

The integrity checker covers bilingual source registration, orphan files, IDs, equation targets, metadata, related targets, internal paths, Model Lab destinations, generated documents, and sitemap parity. Shared equation references are allowed; duplicate IDs within a branch are errors. Browser checks still matter for focus, scrolling, Back/Forward, translated content, and phone layouts.

Publishing keeps the existing workflow: commit verified sources and generated documents on `main`, then fast-forward GitHub `main` and `gh-pages` to the same commit. No force push is needed.

## Source review

New contextual links point to the original Shor, Grover, Kohn–Sham, and Jarzynski works; the probability topic links Bayes and Neyman–Pearson. Newton’s original text is linked through Oxford’s Newton Project, Maxwell through the Smithsonian, and Kolmogorov through the University of St Andrews. Existing Navier–Stokes primary-paper links and collaboration references remain in place. Added URLs were checked on 16 September 2026; the Royal Society endpoint for the Neyman–Pearson DOI blocks automated retrieval with HTTP 403, while the DOI and bibliographic identity are independently indexed.
