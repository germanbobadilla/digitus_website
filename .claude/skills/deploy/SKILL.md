---
name: deploy
description: Deploy the Digitus site to AWS (Lambda + S3 + CloudFront via SAM), or check whether it's ready to deploy. Use for first-time setup, manual deploys, domain cutover or troubleshooting CI deploys.
---

# Deploy

Normal path: push to `main`, and `.github/workflows/deploy.yml` runs tests, `sam deploy`, `aws s3 sync static`, and a CloudFront invalidation. Manual deploys are for first-time setup or emergencies.

**Deploys are outward-facing. Confirm with the owner before running `sam deploy`, `aws …` or `git push`.**

## Preflight (safe to run)
```bash
make check                       # fmt, clippy -D warnings, tests
cargo lambda build --release --arm64
sam validate --lint
```
`cargo lambda` comes from `pip install cargo-lambda` or `brew install cargo-lambda/tap/cargo-lambda`. It bundles zig for cross-compiling.

## GitHub configuration the workflow expects
- Secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `ORIGIN_VERIFY_SECRET` (random string, at least 16 characters, e.g. `openssl rand -hex 24`).
- Variables: `SITE_URL` (`https://digitus.do`), `DOMAIN_NAME` (default `digitus.do`), `HOSTED_ZONE_ID` (Route 53 zone of digitus.do; empty = cloudfront.net only), `CONTACT_FROM` (e.g. `Digitus Web <web@digitus.do>`), `CONTACT_FROM_ADDRESS` (bare address), `CONTACT_TO`.
- A `production` environment. Optionally add required reviewers to it.

## First deploy
1. SES (us-east-1): verify the `digitus.do` domain identity. It's in Route 53, so enable Easy DKIM and let SES publish the records. If the account is in the SES sandbox, verify `CONTACT_TO` too, or request production access.
2. Optionally, the first time: deploy with `HOSTED_ZONE_ID` empty and test on the `DistributionDomain` output. Check: `/` redirects by country, `/es/` and `/en/` render, `/static/css/site.css` loads, the contact form delivers.
3. Go live: set `HOSTED_ZONE_ID`. The stack issues the ACM cert (DNS-validated in the zone, a few minutes), attaches `digitus.do` and `www.digitus.do` to CloudFront, and creates the A/AAAA alias records.
   The domain currently points nowhere, so there's no cutover. The legacy `digitus.com.do` distribution `E1X8PSUZIPUQPI` is unaffected.

## Troubleshooting
- 403 "forbidden" from Lambda: the `x-origin-verify` header doesn't match `ORIGIN_VERIFY_SECRET`.
- 403 from the Function URL itself: `Host` is being forwarded. The origin request policy must whitelist headers and must not include Host.
- The language never switches: the `lang` cookie isn't in the origin request policy, or `/` got cached (the app must send `no-store`).
- Contact errors: check CloudWatch `/aws/lambda/<stack>-web` for SES `MessageRejected` (unverified identity or sandbox).
