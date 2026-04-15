#!/bin/sh
set -eu

# Enable pipefail only on shells that support it.
(set -o pipefail) >/dev/null 2>&1 && set -o pipefail

missing=0
loaded_env_file=''

load_env_file() {
	env_file="$1"
	source_path="$env_file"

	if [ ! -f "$env_file" ]; then
		return 1
	fi

	case "$env_file" in
		/*|./*|../*|*/*)
			source_path="$env_file"
			;;
		*)
			source_path="./$env_file"
			;;
	esac

	echo "Loading environment from $env_file"
	set -a
	. "$source_path"
	set +a
	loaded_env_file="$env_file"
	return 0
}

if [ -n "${PLESK_ENV_FILE-}" ]; then
	if ! load_env_file "$PLESK_ENV_FILE"; then
		echo "Configured PLESK_ENV_FILE was not found: $PLESK_ENV_FILE"
		exit 1
	fi
elif ! load_env_file ".env.plesk"; then
	if ! load_env_file ".env"; then
		echo 'No .env.plesk or .env file found; relying on inherited environment only.'
	fi
fi

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
	echo 'Create or update .env.plesk (or point PLESK_ENV_FILE at the correct file), then redeploy.'
	exit 1
fi

echo 'Build environment summary:'
if [ -n "$loaded_env_file" ]; then
	echo "  loaded_env_file=$loaded_env_file"
else
	echo '  loaded_env_file=(none, inherited environment only)'
fi
echo "  EXPO_PUBLIC_QUANTUM_API_BASE_URL=${EXPO_PUBLIC_QUANTUM_API_BASE_URL-}"
echo "  EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL-}"
echo "  EXPO_PUBLIC_SUPABASE_ANON_KEY=$(mask_prefix "${EXPO_PUBLIC_SUPABASE_ANON_KEY-}")"
echo "  QUANTUM_BACKEND_API_KEY=$(mask_prefix "${QUANTUM_BACKEND_API_KEY-}")"

npm ci --include=dev
npm run build:web:deploy

mkdir -p ../tmp
touch ../tmp/restart.txt

echo "Plesk post-deploy actions completed."
