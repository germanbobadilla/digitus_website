---
name: add-image
description: Add or replace a photo on the Digitus site, producing the WebP sizes and srcset markup the templates expect.
---

# Add or replace a photo

Style: light, natural daylight, real people at work (teams, classrooms, offices, small businesses). No location-specific landmarks. Sources must allow commercial use without attribution (Unsplash License).

1. Download both sizes as WebP straight from the Unsplash CDN, which does the conversion:
   ```bash
   id=1509062522246-3755977927d7; name=sector-education
   for w in 1600 800; do
     curl -sSfL "https://images.unsplash.com/photo-$id?auto=format&fit=crop&w=$w&q=72&fm=webp" -o "static/img/$name-$w.webp"
   done
   ```
   Check the file afterwards (`file static/img/$name-800.webp`) and look at it. Unsplash `/photos/{slug}/download` links can 404.
2. In the template, use the `pic` macro in `templates/index.html`:
   `{% call pic("name", "<sizes attr>", false) %}{% endcall %}`. Pass `true` only for the above-the-fold hero, which gets `fetchpriority=high` instead of lazy loading.
3. Photos sit in `.media` containers with a caption chip `<div class="ph"><span>{{ c.t("img.key") }}</span></div>`. Add the caption via the add-copy skill. `alt=""` is intentional because the visible caption describes the photo.
4. Keep each 1600w file under ~400 KB. Lower `q=` if it's heavier.
