#!/usr/bin/env bash
# PostToolUse(Edit|Write): guard locales and templates.
#  - locales/*.json must be valid JSON and es/en must have identical keys
#  - user-facing files must not mention the implementation stack (owner's rule)
f=$(jq -r '.tool_input.file_path // empty')
root="${CLAUDE_PROJECT_DIR:-$(pwd)}"
case "$f" in
  */locales/*.json)
    for l in es en; do
      jq empty "$root/locales/$l.json" 2>/dev/null || { echo "locales/$l.json is not valid JSON" >&2; exit 2; }
    done
    diff_out=$(diff <(jq -r 'keys[]' "$root/locales/es.json") <(jq -r 'keys[]' "$root/locales/en.json"))
    if [[ -n "$diff_out" ]]; then
      echo "locales/es.json and locales/en.json keys differ (< only es, > only en):" >&2
      echo "$diff_out" >&2
      exit 2
    fi
    ;;
esac
case "$f" in
  */templates/*.html|*/locales/*.json)
    hits=$(grep -nE '\b(Rust|Axum|Askama|cargo)\b|\bHTMX\b' "$f" | grep -v 'htmx.min.js' || true)
    if [[ -n "$hits" ]]; then
      echo "Frontend must not mention the implementation stack (Rust/Axum/Askama/HTMX). Found in $f:" >&2
      echo "$hits" >&2
      exit 2
    fi
    ;;
esac
exit 0
