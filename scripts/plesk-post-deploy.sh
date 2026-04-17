#!/bin/sh
set -eu

# Enable pipefail only on shells that support it.
(set -o pipefail) >/dev/null 2>&1 && set -o pipefail

cd "$(dirname "$0")/.."

missing=0

if [ ! -f ".env.plesk" ]; then
	echo "Missing required .env.plesk file in $(pwd)" >&2
	exit 1
fi

echo "[plesk-post-deploy] HEAD: $(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
echo "[plesk-post-deploy] Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
echo "[plesk-post-deploy] Node: $(node --version 2>/dev/null || echo unknown)"
echo "[plesk-post-deploy] npm: $(npm --version 2>/dev/null || echo unknown)"
echo "[plesk-post-deploy] Loading .env.plesk"
set -a
. "./.env.plesk"
set +a

DEPLOY_COMMIT_SHA="${DEPLOY_COMMIT_SHA-}"
if [ -z "$DEPLOY_COMMIT_SHA" ]; then
	DEPLOY_COMMIT_SHA="$(git rev-parse HEAD 2>/dev/null || true)"
fi

DEPLOY_BRANCH="${DEPLOY_BRANCH-}"
if [ -z "$DEPLOY_BRANCH" ]; then
	DEPLOY_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
fi

export DEPLOY_COMMIT_SHA DEPLOY_BRANCH

if [ -z "${EXPO_PUBLIC_SUPABASE_ANON_KEY-}" ] && [ -n "${EXPO_PUBLIC_SUPABASE_KEY-}" ]; then
	EXPO_PUBLIC_SUPABASE_ANON_KEY="${EXPO_PUBLIC_SUPABASE_KEY}"
	export EXPO_PUBLIC_SUPABASE_ANON_KEY
	echo 'Mapped EXPO_PUBLIC_SUPABASE_KEY -> EXPO_PUBLIC_SUPABASE_ANON_KEY'
fi

require_env_var() {
	var_name="$1"
	eval "var_value=\${$var_name-}"
	if [ -z "$var_value" ]; then
		echo "Missing required environment variable: $var_name"
		missing=1
	fi
}

mask_prefix() {
	value="$1"
	if [ -z "$value" ]; then
		printf '%s' '(empty)'
		return
	fi

	prefix=$(printf '%s' "$value" | cut -c1-10)
	printf '%s***' "$prefix"
}

require_env_var EXPO_PUBLIC_SUPABASE_URL
require_env_var EXPO_PUBLIC_SUPABASE_ANON_KEY
require_env_var EXPO_PUBLIC_QUANTUM_API_BASE_URL
require_env_var QUANTUM_BACKEND_API_KEY

if [ "$missing" -ne 0 ]; then
	echo 'Aborting deploy build due to missing required environment variables.'
	echo 'Create or update .env.plesk, then redeploy.'
	exit 1
fi

echo 'Build environment summary:'
echo '  loaded_env_file=.env.plesk'
echo "  DEPLOY_BRANCH=${DEPLOY_BRANCH:-unknown}"
echo "  DEPLOY_COMMIT_SHA=$(mask_prefix "${DEPLOY_COMMIT_SHA-}")"
echo "  EXPO_PUBLIC_QUANTUM_API_BASE_URL=${EXPO_PUBLIC_QUANTUM_API_BASE_URL-}"
echo "  EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL-}"
echo "  EXPO_PUBLIC_SUPABASE_ANON_KEY=$(mask_prefix "${EXPO_PUBLIC_SUPABASE_ANON_KEY-}")"
echo "  QUANTUM_BACKEND_API_KEY=$(mask_prefix "${QUANTUM_BACKEND_API_KEY-}")"

if [ -d "dist" ]; then
	echo "[plesk-post-deploy] Existing dist ownership:"
	ls -ld dist || true

	if [ -w "dist" ]; then
		echo "[plesk-post-deploy] Removing writable dist"
		rm -rf dist
	else
		stale_dist="dist.stale.$(date +%Y%m%d%H%M%S)"
		echo "[plesk-post-deploy] dist is not writable; attempting to move it aside to $stale_dist"
		if mv dist "$stale_dist"; then
			echo "[plesk-post-deploy] Moved stale dist to $stale_dist"
		else
			echo "[plesk-post-deploy] Failed to move non-writable dist. Fix ownership, for example:" >&2
			echo "[plesk-post-deploy]   sudo chown -R \$(stat -c '%U:%G' .) dist" >&2
			exit 1
		fi
	fi
fi

echo '[plesk-post-deploy] Installing dependencies'
npm ci --include=dev

echo '[plesk-post-deploy] Building web output'
npm run build:web:deploy

mkdir -p ../tmp
touch ../tmp/restart.txt

echo "[plesk-post-deploy] Plesk post-deploy actions completed."
