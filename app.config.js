const DEFAULT_SITE_ORIGIN = 'https://davidjgrimsley.com';

function resolveSiteOrigin() {
  const explicitOrigin = process.env.EXPO_PUBLIC_SITE_ORIGIN?.trim();
  const explicitSiteUrl = process.env.EXPO_PUBLIC_SITE_URL?.trim();

  return explicitOrigin || explicitSiteUrl || DEFAULT_SITE_ORIGIN;
}

function withExpoRouterOrigin(plugins, origin) {
  return (plugins || []).map((plugin) => {
    if (plugin === 'expo-router') {
      return ['expo-router', { origin }];
    }

    if (!Array.isArray(plugin) || plugin[0] !== 'expo-router') {
      return plugin;
    }

    const [name, options = {}] = plugin;
    return [name, { ...options, origin }];
  });
}

module.exports = ({ config }) => ({
  ...config,
  plugins: withExpoRouterOrigin(config.plugins, resolveSiteOrigin()),
});
