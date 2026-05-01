#!/bin/sh
set -eu

# Enable pipefail only on shells that support it.
(set -o pipefail) >/dev/null 2>&1 && set -o pipefail

script_dir="$(CDPATH= cd "$(dirname "$0")" && pwd -P)"
app_root="$(CDPATH= cd "$script_dir/.." && pwd -P)"
cd "$app_root"

missing=0

echo "[plesk-post-deploy] HEAD: $(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
echo "[plesk-post-deploy] Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
echo "[plesk-post-deploy] Node: $(node --version 2>/dev/null || echo unknown)"
echo "[plesk-post-deploy] npm: $(npm --version 2>/dev/null || echo unknown)"
echo "[plesk-post-deploy] Initial pwd: $(pwd)"
echo "[plesk-post-deploy] Script dir: $script_dir"
echo "[plesk-post-deploy] App root: $app_root"
echo "[plesk-post-deploy] server.js present: $([ -f server.js ] && echo yes || echo no)"
echo "[plesk-post-deploy] package.json present: $([ -f package.json ] && echo yes || echo no)"

if [ ! -f "server.js" ] || [ ! -f "package.json" ]; then
	echo "[plesk-post-deploy] Expected server.js and package.json in app root: $app_root" >&2
	echo "[plesk-post-deploy] In Plesk, set Application Root and Git deployment target to httpdocs." >&2
	exit 1
fi

normalize_env_name() {
	case "$1" in
		prod|production|main)
			printf '%s' production
			;;
		stage|staging|test)
			printf '%s' test
			;;
		dev|development|local)
			printf '%s' local
			;;
		*)
			printf '%s' ''
			;;
	esac
}

DEPLOY_BRANCH="${DEPLOY_BRANCH-}"
if [ -z "$DEPLOY_BRANCH" ]; then
	DEPLOY_BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
fi

DEPLOY_ENV="${DEPLOY_ENV-}"
resolved_env="$(normalize_env_name "$DEPLOY_ENV")"
if [ -z "$resolved_env" ]; then
	resolved_env="$(normalize_env_name "$DEPLOY_BRANCH")"
fi

if [ "$resolved_env" = "production" ]; then
	env_candidates=".env.production"
elif [ "$resolved_env" = "test" ]; then
	env_candidates=".env.test"
elif [ "$resolved_env" = "local" ]; then
	env_candidates=".env"
else
	hosted_env_files=""
	for hosted_candidate in .env.production .env.test; do
		if [ -f "$hosted_candidate" ]; then
			hosted_env_files="${hosted_env_files:+$hosted_env_files }$hosted_candidate"
		fi
	done

	case "$hosted_env_files" in
		.env.production)
			resolved_env="production"
			env_candidates=".env.production"
			echo "[plesk-post-deploy] DEPLOY_BRANCH is unknown; inferred production from the single hosted env file."
			;;
		.env.test)
			resolved_env="test"
			env_candidates=".env.test"
			echo "[plesk-post-deploy] DEPLOY_BRANCH is unknown; inferred test from the single hosted env file."
			;;
		'')
			echo "[plesk-post-deploy] Unable to resolve hosted env file in $app_root." >&2
			echo "[plesk-post-deploy] Set DEPLOY_ENV=production|test, set DEPLOY_BRANCH=main|test, or create exactly one of .env.production/.env.test next to server.js." >&2
			exit 1
			;;
		*)
			echo "[plesk-post-deploy] Ambiguous hosted env files in $app_root: $hosted_env_files" >&2
			echo "[plesk-post-deploy] Set DEPLOY_ENV=production or DEPLOY_ENV=test in Plesk deployment actions." >&2
			exit 1
			;;
	esac
fi

env_files=""
for candidate in $env_candidates; do
	if [ -f "$candidate" ]; then
		env_files="${env_files:+$env_files }$candidate"
	fi
done

if [ -z "$env_files" ]; then
	echo "Missing env file in $(pwd). Checked: $env_candidates" >&2
	echo "Use .env.test for the Plesk temp domain and .env.production for production. The file must live next to server.js in httpdocs." >&2
	exit 1
fi

echo "[plesk-post-deploy] Resolved deployment env: ${resolved_env:-unknown}"
echo "[plesk-post-deploy] Loading $env_files"
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
	echo '[plesk-post-deploy] Missing required environment variables. Refusing to install, move dist, or build stale deployment artifacts.' >&2
	exit 1
fi

echo 'Build environment summary:'
echo "  loaded_env_files=${env_files:-none}"
echo "  DEPLOY_ENV=${DEPLOY_ENV:-unknown}"
echo "  DEPLOY_BRANCH=${DEPLOY_BRANCH:-unknown}"
echo "  DEPLOY_COMMIT_SHA=$(mask_prefix "${DEPLOY_COMMIT_SHA-}")"
echo "  EXPO_PUBLIC_SITE_ORIGIN=${EXPO_PUBLIC_SITE_ORIGIN-}"
echo "  EXPO_PUBLIC_QUANTUM_API_BASE_URL=${EXPO_PUBLIC_QUANTUM_API_BASE_URL-}"
echo "  EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL-}"
echo "  EXPO_PUBLIC_SUPABASE_ANON_KEY=$(mask_prefix "${EXPO_PUBLIC_SUPABASE_ANON_KEY-}")"
echo "  QUANTUM_BACKEND_API_KEY=$(mask_prefix "${QUANTUM_BACKEND_API_KEY-}")"

if [ "${POST_DEPLOY_ENV_CHECK_ONLY-}" = "1" ]; then
	echo '[plesk-post-deploy] POST_DEPLOY_ENV_CHECK_ONLY=1; stopping before npm ci, dist changes, build, and restart.'
	exit 0
fi

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

mkdir -p tmp
touch tmp/restart.txt
echo "[plesk-post-deploy] Touched Passenger restart marker: $(pwd)/tmp/restart.txt"

parent_dir="$(dirname "$(pwd)")"
mkdir -p ../tmp
touch ../tmp/restart.txt
echo "[plesk-post-deploy] Touched legacy parent restart marker: $parent_dir/tmp/restart.txt"

echo "[plesk-post-deploy] Plesk post-deploy actions completed."
