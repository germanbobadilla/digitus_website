#!/usr/bin/env bash
# PostToolUse(Edit|Write): format edited Rust files.
f=$(jq -r '.tool_input.file_path // empty')
[[ "$f" == *.rs && -f "$f" ]] || exit 0
rustfmt --edition 2024 "$f" 2>&1 >/dev/null || { echo "rustfmt failed on $f" >&2; exit 2; }
exit 0
