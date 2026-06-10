#!/bin/bash
FILE=$(jq -r '.tool_input.file_path // empty')
[ -z "$FILE" ] && exit 0
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx|*.css|*.json)
    npx prettier --write "$FILE" 2>/dev/null
    npx eslint --fix "$FILE" 2>/dev/null
    ;;
esac
exit 0