# digitus.do

Bilingual (ES/EN) website for Digitus — Business & Software Solutions.
Rust + Axum + Askama + HTMX on AWS Lambda, static assets on S3, served through CloudFront.

```bash
make dev     # http://127.0.0.1:3000
make check   # fmt + clippy + tests
make build   # Lambda artifact (needs cargo-lambda)
```

Deploys run from GitHub Actions on push to `main`. See [CLAUDE.md](CLAUDE.md) for architecture and conventions, and [.claude/skills/deploy/SKILL.md](.claude/skills/deploy/SKILL.md) for AWS setup.
