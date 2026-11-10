---
name: add-service
description: Add, remove or rename a service offered on the Digitus site, including its card, detail modal and contact-form option.
---

# Add a service

A service shows up in three places: its card in `templates/index.html`, the HTMX modal (`/{lang}/partials/service/{slug}`), and the contact form's "Service of interest" select. All three are driven by `src/services.rs`.

1. **Catalog**: add a `Service { slug, key, form_value }` to `SERVICES` in `src/services.rs`.
   - `slug`: URL-safe English, e.g. `data-analytics`.
   - `key`: short i18n prefix, e.g. `data`.
   - `form_value`: the value stored in the contact email.
2. **Copy** (use the add-copy skill): `svc.{key}.t` (title), `svc.{key}.d` (one-sentence description), and `svc.{key}.x1..x3` (three "what's included" bullets), in both locales.
3. **Card**: in `templates/index.html`, add a field to `IndexTpl` (`src/web.rs`), build it with `SvcView::new(lang, services::by_key("data"))`, and copy an existing `<article class="svc glass reveal">` block:
   - Icon: a 24×24 stroke SVG inside `<div class="ic ic-COLOR">`. Pick a color modifier not used by a neighboring card. To add a new one, define `.ic.ic-NAME{--c1;--c2;--glow}` in `static/css/site.css` (keep the `.ic.` prefix for specificity).
   - Use `{% call more(field) %}{% endcall %}` for the "View details" button.
   - **No tag/chip lists.** The owner removed them.
4. Re-balance the grid: `.services` is 3 columns, `.feature` spans 2, `.wide` spans all.
5. Add a route test in `tests/routes.rs` for the new modal slug. Then run `make check` and check visually with `make dev`.
