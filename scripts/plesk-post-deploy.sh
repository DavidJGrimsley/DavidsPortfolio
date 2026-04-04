#!/usr/bin/env bash
set -euo pipefail

npm ci --include=dev
npm run build:web:deploy

mkdir -p ../tmp
touch ../tmp/restart.txt

echo "Plesk post-deploy actions completed."
