const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_LOADER_ROUTES = [
  'public-facing/api/index.tsx',
  'public-facing/api/[id].tsx',
  'public-facing/mcp/index.tsx',
  'public-facing/mcp/[id].tsx',
];

function assertSsrBuild(serverBuildDir) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(serverBuildDir, '_expo/routes.json'), 'utf8')
  );

  function requireModule(file, description) {
    if (typeof file !== 'string' || !file) {
      throw new Error(`[SSR build] Missing ${description} in the generated routes manifest.`);
    }
    const resolved = path.resolve(serverBuildDir, file);
    const relative = path.relative(serverBuildDir, resolved);
    if (
      relative.startsWith('..') ||
      path.isAbsolute(relative) ||
      !fs.existsSync(resolved) ||
      !fs.statSync(resolved).isFile()
    ) {
      throw new Error(`[SSR build] Invalid ${description}: ${file}`);
    }
  }

  if (manifest.rendering?.mode !== 'ssr') {
    throw new Error('[SSR build] Expected server rendering; refusing a build without page loader data.');
  }
  requireModule(manifest.rendering.file, 'SSR renderer');

  const rendererPath = path.resolve(serverBuildDir, manifest.rendering.file);
  const rendererSource = fs.readFileSync(rendererPath, 'utf8');
  if (!rendererSource.includes('__EXPO_ROUTER_LOADER_DATA__')) {
    throw new Error('[SSR build] SSR renderer does not contain Expo Router loader-data wiring.');
  }

  for (const routeMarker of REQUIRED_LOADER_ROUTES) {
    if (!rendererSource.includes(routeMarker)) {
      throw new Error(`[SSR build] SSR renderer is missing loader route wiring for ${routeMarker}.`);
    }
  }
}

module.exports = { assertSsrBuild };
