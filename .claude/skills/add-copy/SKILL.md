---
name: add-copy
description: Add or change any user-facing text on the Digitus site (headings, paragraphs, buttons, form labels, errors, alt text) in both Spanish and English. Use whenever copy is added, reworded or translated.
---

# Add or change site copy

All copy lives in `locales/es.json` and `locales/en.json`. Templates never contain literal user-facing text.

1. Pick a dotted key that follows the section prefix already in use: `nav.*`, `hero.*`, `svc.*`, `ai.*`, `sec.*`, `rd.*`, `why.*`, `stack.*`, `ct.*`, `f.*` (form), `ft.*` (footer), `img.*` (captions), `modal.*`, `nf.*` (404), `meta.*`.
2. Add the key to **both** files, in the same position, so they stay diffable. Write the Spanish first: Dominican/LATAM, "tú", warm and direct. Then write natural English rather than a literal translation.
3. In the template, use `{{ c.t("your.key") }}`. If the key is built at runtime, resolve it with `i18n::get` in Rust (see `SvcView` in `src/web.rs`).
4. Never mention the implementation stack (Rust, Axum, Askama, HTMX). The `check-frontend` hook blocks it.
5. Restart `make dev`: locales are compiled in. Then run `make check`. `locales_have_same_keys` and `no_empty_values` must pass.

Don't put HTML in locale values. Askama escapes them. If a string needs emphasis markup, split it into two keys (see `hero.h1a` / `hero.h1b`).
