#!/bin/sh
set -eu

# Enable pipefail only on shells that support it.
(set -o pipefail) >/dev/null 2>&1 && set -o pipefail

cd "$(dirname "$0")/.."

missing=0

echo "[plesk-post-deploy] HEAD: $(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
echo "[plesk-post-deploy] Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
echo "[plesk-post-deploy] Node: $(node --version 2>/dev/null || echo unknown)"
echo "[plesk-post-deploy] npm: $(npm --version 2>/dev/null || echo unknown)"

DEPLOY_BRANCH="${DEPLOY_BRANCH-}"
if [ -z "$DEPLOY_BRANCH" ]; then
	DEPLOY_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
fi

case "$DEPLOY_BRANCH" in
	test)
		if [ -f ".env.test" ]; then
			env_candidates=".env.test"
		else
			env_candidates=".env .env.plesk"
		fi
		;;
	main)
		if [ -f ".env.production" ]; then
			env_candidates=".env.production"
		else
			env_candidates=".env .env.plesk"
		fi
		;;
	*)
		env_candidates=".env"
		;;
esac

env_files=""
for candidate in $env_candidates; do
	if [ -f "$candidate" ]; then
		env_files="${env_files:+$env_files }$candidate"
	fi
done

if [ -z "$env_files" ]; then
	echo "Missing env file in $(pwd). Checked: $env_candidates" >&2
	echo "Use .env for local, .env.test for the Plesk temp domain, and .env.production for production." >&2
fi

env_file="${env_files##* }"
if [ -z "$env_file" ]; then
	env_file="(none)"
	echo "[plesk-post-deploy] Continuing without a server-local env file."
elif [ "$env_file" = ".env.plesk" ]; then
	echo "[plesk-post-deploy] Loading legacy .env.plesk fallback. Prefer .env.test for staging and .env.production for production."
else
	echo "[plesk-post-deploy] Loading $env_files"
fi
set -a
for env_source in $env_files; do
	. "./$env_source"
done
set +a

DEPLOY_COMMIT_SHA="${DEPLOY_COMMIT_SHA-}"
if [ -z "$DEPLOY_COMMIT_SHA" ]; then
	DEPLOY_COMMIT_SHA="$(git rev-parse HEAD 2>/dev/null || true)"
fi

export DEPLOY_COMMIT_SHA DEPLOY_BRANCH

if [ -z "${EXPO_PUBLIC_SUPABASE_ANON_KEY-}" ] && [ -n "${EXPO_PUBLIC_SUPABASE_KEY-}" ]; then
	EXPO_PUBLIC_SUPABASE_ANON_KEY="${EXPO_PUBLIC_SUPABASE_KEY}"
	export EXPO_PUBLIC_SUPABASE_ANON_KEY
	echo 'Mapped EXPO_PUBLIC_SUPABASE_KEY -> EXPO_PUBLIC_SUPABASE_ANON_KEY'
fi

if [ -z "${EXPO_PUBLIC_SITE_ORIGIN-}" ]; then
	case "$DEPLOY_BRANCH" in
		test)
			EXPO_PUBLIC_SITE_ORIGIN="https://quizzical-hofstadter.108-175-12-95.plesk.page"
			export EXPO_PUBLIC_SITE_ORIGIN
			echo "Defaulted EXPO_PUBLIC_SITE_ORIGIN for test deploy to $EXPO_PUBLIC_SITE_ORIGIN"
			;;
		main)
			EXPO_PUBLIC_SITE_ORIGIN="https://davidjgrimsley.com"
			export EXPO_PUBLIC_SITE_ORIGIN
			echo "Defaulted EXPO_PUBLIC_SITE_ORIGIN for production deploy to $EXPO_PUBLIC_SITE_ORIGIN"
			;;
	esac
fi

if [ -z "${EXPO_PUBLIC_QUANTUM_API_BASE_URL-}" ]; then
	EXPO_PUBLIC_QUANTUM_API_BASE_URL="https://davidjgrimsley.com/public-facing/api/quantum/v1"
	export EXPO_PUBLIC_QUANTUM_API_BASE_URL
	echo "Defaulted EXPO_PUBLIC_QUANTUM_API_BASE_URL to $EXPO_PUBLIC_QUANTUM_API_BASE_URL"
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
require_env_var EXPO_PUBLIC_SITE_ORIGIN
require_env_var EXPO_PUBLIC_QUANTUM_API_BASE_URL
require_env_var QUANTUM_BACKEND_API_KEY

if [ "$missing" -ne 0 ]; then
	echo 'Continuing deploy build despite missing environment variables. Create or update the server-local env file before testing auth/runtime features.'
fi

echo 'Build environment summary:'
echo "  loaded_env_files=${env_files:-none}"
echo "  DEPLOY_BRANCH=${DEPLOY_BRANCH:-unknown}"
echo "  DEPLOY_COMMIT_SHA=$(mask_prefix "${DEPLOY_COMMIT_SHA-}")"
echo "  EXPO_PUBLIC_SITE_ORIGIN=${EXPO_PUBLIC_SITE_ORIGIN-}"
echo "  EXPO_PUBLIC_QUANTUM_API_BASE_URL=${EXPO_PUBLIC_QUANTUM_API_BASE_URL-}"
echo "  EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL-}"
echo "  EXPO_PUBLIC_SUPABASE_ANON_KEY=$(mask_prefix "${EXPO_PUBLIC_SUPABASE_ANON_KEY-}")"
echo "  QUANTUM_BACKEND_API_KEY=$(mask_prefix "${QUANTUM_BACKEND_API_KEY-}")"

previous_dist=""
if [ -d "dist" ]; then
	echo "[plesk-post-deploy] Existing dist ownership:"
	ls -ld dist || true

	if [ -w "dist" ]; then
		previous_dist="dist.previous.$(date +%Y%m%d%H%M%S)"
		echo "[plesk-post-deploy] Moving existing writable dist aside to $previous_dist"
		mv dist "$previous_dist"
	else
		stale_dist="dist.stale.$(date +%Y%m%d%H%M%S)"
		echo "[plesk-post-deploy] dist is not writable; attempting to move it aside to $stale_dist"
		if mv dist "$stale_dist"; then
			echo "[plesk-post-deploy] Moved stale dist to $stale_dist"
			previous_dist="$stale_dist"
		else
			echo "[plesk-post-deploy] Failed to move non-writable dist. Fix ownership, for example:" >&2
			echo "[plesk-post-deploy]   sudo chown -R \$(stat -c '%U:%G' .) dist" >&2
			exit 1
		fi
	fi
fi

echo '[plesk-post-deploy] Installing dependencies'
if ! npm ci --include=dev; then
	echo '[plesk-post-deploy] npm ci failed.' >&2
	if [ -n "$previous_dist" ] && [ -d "$previous_dist" ]; then
		rm -rf dist
		mv "$previous_dist" dist
		echo "[plesk-post-deploy] Restored previous dist from $previous_dist"
	fi
	exit 1
fi

echo '[plesk-post-deploy] Building web output'
if ! npm run build:web:deploy; then
	echo '[plesk-post-deploy] build failed.' >&2
	if [ -n "$previous_dist" ] && [ -d "$previous_dist" ]; then
		rm -rf dist
		mv "$previous_dist" dist
		echo "[plesk-post-deploy] Restored previous dist from $previous_dist"
	fi
	exit 1
fi

if [ -n "$previous_dist" ] && [ -d "$previous_dist" ]; then
	rm -rf "$previous_dist"
fi

mkdir -p ../tmp
touch ../tmp/restart.txt

echo "[plesk-post-deploy] Plesk post-deploy actions completed."
