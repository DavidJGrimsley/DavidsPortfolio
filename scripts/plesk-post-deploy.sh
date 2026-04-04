#!/bin/sh
set -eu

# Enable pipefail only on shells that support it.
(set -o pipefail) >/dev/null 2>&1 && set -o pipefail

missing=0

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
	echo 'Aborting deploy build due to missing environment configuration.'
	exit 1
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
