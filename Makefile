.PHONY: dev test check build deploy

dev:            ## Run locally on http://127.0.0.1:3000 (emails are logged, not sent)
	cargo run

test:
	cargo test

check:          ## What CI runs
	cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test

build:          ## Lambda artifact in target/lambda/digitus/bootstrap
	cargo lambda build --release --arm64

deploy: check build   ## Manual deploy; normally CI does this on push to main
	sam deploy --guided
