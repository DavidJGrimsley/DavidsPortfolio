#!/bin/sh
set -eu

# Enable pipefail only on shells that support it.
(set -o pipefail) >/dev/null 2>&1 && set -o pipefail

npm ci --include=dev
npm run build:web:deploy

mkdir -p ../tmp
touch ../tmp/restart.txt

echo "Plesk post-deploy actions completed."
