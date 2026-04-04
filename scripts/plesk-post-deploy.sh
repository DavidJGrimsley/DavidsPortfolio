#!/bin/sh
set -eu

# Enable pipefail only on shells that support it.
(set -o pipefail) >/dev/null 2>&1 && set -o pipefail

missing=0

load_env_file() {
	file_path="$1"
	if [ -f "$file_path" ]; then
		echo "Loading env values from ${file_path}"
		set -a
		# shellcheck disable=SC1090
		. "$file_path"
		set +a
	fi
}

# Plesk Git hooks do not always receive Node.js GUI env values.
# Source project env files when available.
load_env_file .env
load_env_file .env.production
load_env_file .env.plesk

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
require_env_var QUANTUM_PROXY_UPSTREAM_BASE_URL
require_env_var QUANTUM_BACKEND_API_KEY

if [ "$missing" -ne 0 ]; then
	echo 'Warning: one or more env variables are missing. Continuing build with in-app defaults where available.'
fi

echo 'Build environment summary:'
echo "  EXPO_PUBLIC_QUANTUM_API_BASE_URL=${EXPO_PUBLIC_QUANTUM_API_BASE_URL}"
echo "  QUANTUM_PROXY_UPSTREAM_BASE_URL=${QUANTUM_PROXY_UPSTREAM_BASE_URL}"
echo "  EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL}"
echo "  EXPO_PUBLIC_SUPABASE_ANON_KEY=$(mask_prefix "${EXPO_PUBLIC_SUPABASE_ANON_KEY}")"
echo "  QUANTUM_BACKEND_API_KEY=$(mask_prefix "${QUANTUM_BACKEND_API_KEY}")"

npm ci --include=dev
npm run build:web:deploy

mkdir -p ../tmp
touch ../tmp/restart.txt

echo "Plesk post-deploy actions completed."
