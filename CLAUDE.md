# Digitus website

Bilingual (ES/EN) marketing site for **Digitus — Business & Software Solutions**, a registered company in the Dominican Republic.
Server-rendered HTML with HTMX, Rust + Axum on AWS Lambda; static assets on S3; both behind one CloudFront distribution.

The visual and content reference is the concept prototype at https://claude.ai/artifact/Qfs398atCLaF5BncVgZh4K. The prototype was written for planning. When this file and the prototype disagree, this file wins (see "Frontend rules").

## Commands

```bash
make dev      # cargo run → http://127.0.0.1:3000 (contact emails are logged, not sent)
make check    # what CI runs: fmt --check, clippy -D warnings, tests
make build    # cargo lambda build --release --arm64 → target/lambda/digitus/bootstrap
```

Templates and locales are compiled into the binary, so **restart `make dev` after editing `templates/` or `locales/`**. CSS and JS under `static/` are served live. Every server start gets a fresh `?v=` cache-buster.

## Layout

| Path                           | What                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `src/main.rs`                  | Picks the runtime: `lambda_http::run` when `AWS_LAMBDA_RUNTIME_API` is set, otherwise local axum + `ServeDir("/static")` |
| `src/web.rs`                   | Router, handlers, Askama view models, security headers, `x-origin-verify` guard                                          |
| `src/lang.rs`                  | Language detection (cookie → `?lang=` → `CloudFront-Viewer-Country` → `Accept-Language` → `en`)                          |
| `src/i18n.rs`                  | Loads `locales/{es,en}.json` at compile time; `t(lang, key)`                                                             |
| `src/services.rs`              | Service catalog (slug, i18n key, contact-form value)                                                                     |
| `src/contact.rs`               | Form normalization/validation, honeypot, `Mailer` trait (`SesMailer`, `LogMailer`)                                       |
| `templates/`                   | Askama: `base.html`, `index.html`, `message.html` (404/no-JS results), `partials/*` (HTMX fragments)                     |
| `static/`                      | CSS, JS, images, `htmx.min.js` (2.0.4, vendored). Uploaded to S3 under `/static/*`                                       |
| `tests/routes.rs`              | Integration tests through the router with a mock mailer                                                                  |
| `template.yaml`                | SAM: Lambda + Function URL, private S3 + OAC, CloudFront, cache/origin-request policies                                  |
| `.github/workflows/deploy.yml` | PRs: test. Push to `main`: test → `sam deploy` → `s3 sync static` → invalidate                                           |

## Routes

`GET /` → 302 to `/es/` or `/en/` (no-store) · `GET /{lang}/` page · `GET /{lang}` → 308 · `GET /set-lang/{lang}` sets the `lang` cookie (1y) → 303 ·
`GET /{lang}/partials/service/{slug}` modal fragment · `POST /contact` · `/healthz` · `/robots.txt` · `/sitemap.xml` · fallback 404.

## Frontend rules (from the owner)

- **Never mention the implementation stack in user-facing copy or markup**: no Rust, Axum, Askama or HTMX in templates or locales. That planning detail stays out of the frontend. Generic terms like AWS, serverless and Lambda in the stack and services copy are fine. A hook enforces this.
- **No tag/chip lists** on service cards or in the modal. They were removed on purpose.
- **Icons are colorful**, one gradient per service (`.ic.ic-indigo|violet|amber|teal|coral|sky` in `site.css`), not all brand blue. A new icon gets its own color modifier.
- **The header is sticky and near-opaque** (`.site-header`) so the menu stays readable over content.
- Brand: `--blue #5271FF`, `--navy #000937`. Light theme: white/ice-blue glass, navy text. The code window is the only dark element. Fonts: Space Grotesk (display), Inter (body), JetBrains Mono (labels).
- RNC (shown in full in the footer): `1-33-31249-2`.
- Contact address: `info@digitus.do`.

## Conventions

- **All copy lives in `locales/es.json` and `locales/en.json`, and both files must have the same keys.** `i18n::tests::locales_have_same_keys` fails otherwise, and a hook checks it on every edit. Spanish is the primary voice (Dominican/LATAM, uses "tú").
- Templates call `c.t("key")`. Keys built at runtime go through `i18n::get` (see `SvcView`).
- Askama escapes by default. Use `|safe` only for already-rendered sub-templates (`{{ form|safe }}`).
- CSS specificity: base rules like `.svc .ic` are (0,2,0), so modifiers need matching specificity (`.ic.ic-amber`).
- HTMX only swaps 2xx responses, so validation errors return **200** with the re-rendered form. Non-HTMX posts get a full page (`message.html`).
- Images: WebP at `static/img/{name}-{800,1600}.webp`, served with `srcset`. Photos are Unsplash (free commercial license), light, natural daylight, people at work, no location-specific shots.
- Run `make check` before declaring work done.

## AWS / deploy notes

- CloudFront forwards `CloudFront-Viewer-Country`, `Accept-Language`, `HX-*` and the `lang` cookie to Lambda. The cache key contains none of these, which is safe because `/` and `/contact` respond `no-store`.
- **Never forward `Host` to the Lambda Function URL**; it rejects foreign hosts.
- The Function URL uses `AuthType: NONE` and is protected by the `x-origin-verify` secret header, because OAC for Lambda breaks POST bodies.
- SES: `CONTACT_FROM` must be a verified identity. While the account is in the SES sandbox, recipients must be verified too.
- Deploys, `aws` and `sam` commands are outward-facing: ask the owner before running them.
- Domain: **digitus.do**. Its Route 53 hosted zone is in the same AWS account and pointed nowhere before this stack. With `HostedZoneId` set, the stack owns the ACM cert and the apex/www alias records.
- The old static site and its S3 bucket (`digitus.com.do`) were deleted by the owner. This stack is the only deployment.
