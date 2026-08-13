#!/usr/bin/env bash
#
# Regenerates the self-hosted web fonts in public/fonts/ and src/fonts.css.
#
# The app deliberately makes no third-party requests: loading fonts from
# fonts.googleapis.com would disclose every user's IP address to Google, which
# the privacy policy would then have to declare. Run this only when the font
# families or weights change, and commit the result.
#
# Usage: ./scripts/update-fonts.sh

set -euo pipefail

cd "$(dirname "$0")/.."

# Keep in sync with the typography settings in src/styles.scss.
TEXT_CSS_URL="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=Roboto:wght@300;400;500&display=swap"
ICON_CSS_URL="https://fonts.googleapis.com/icon?family=Material+Icons"

# Google serves woff2 only to browsers that advertise support; a default curl
# user agent gets the far larger truetype files instead.
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"

work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

curl -sSf -H "User-Agent: $UA" "$TEXT_CSS_URL" -o "$work/text.css"
curl -sSf -H "User-Agent: $UA" "$ICON_CSS_URL" -o "$work/icons.css"

mkdir -p "$work/woff2"
grep -hoE 'https://[^)]*\.woff2' "$work"/text.css "$work"/icons.css \
  | sort -u \
  | xargs -P 16 -I{} curl -sSf -O --output-dir "$work/woff2" {}

rm -rf public/fonts
mkdir -p public/fonts
mv "$work"/woff2/*.woff2 public/fonts/

{
  echo "/* Self-hosted web fonts. Generated from the Google Fonts CSS API;"
  echo "   see scripts/update-fonts.sh. Self-hosting keeps user IP addresses"
  echo "   from reaching Google, which the privacy policy relies on. */"
  echo
  cat "$work/text.css" "$work/icons.css"
} | sed -E 's#url\(https://fonts\.gstatic\.com/s/[^)]*/([^/)]+\.woff2)\)#url(/fonts/\1)#g' \
  > src/fonts.css

if grep -q 'fonts\.gstatic\.com\|fonts\.googleapis\.com' src/fonts.css; then
  echo "error: src/fonts.css still references Google; the rewrite failed" >&2
  exit 1
fi

echo "Wrote src/fonts.css and $(ls public/fonts | wc -l | tr -d ' ') font files ($(du -sh public/fonts | cut -f1))."
