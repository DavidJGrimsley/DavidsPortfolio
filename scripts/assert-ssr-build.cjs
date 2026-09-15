const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_PAGE_ROUTES = [
  'public-facing/api/index.tsx',
  'public-facing/api/[id].tsx',
  'public-facing/mcp/index.tsx',
  'public-facing/mcp/[id].tsx',
];

const REQUIRED_LOADER_ROUTES = [
  'public-facing/api/[id].tsx',
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
    let stats;
    if (
      relative.startsWith('..') ||
      path.isAbsolute(relative) ||
      !fs.existsSync(resolved) ||
      !(stats = fs.statSync(resolved)).isFile() ||
      stats.size === 0
    ) {
      throw new Error(`[SSR build] Invalid ${description}: ${file}`);
    }
    return resolved;
  }

  function routeFile(route) {
    return typeof route?.file === 'string'
      ? route.file.replaceAll('\\', '/').replace(/^\.\//, '')
      : '';
  }

  function findHtmlRoute(routeMarker) {
    return manifest.htmlRoutes?.find((route) => routeFile(route).endsWith(routeMarker));
  }

  if (manifest.rendering?.mode !== 'ssr') {
    throw new Error('[SSR build] Expected server rendering; refusing a build without page loader data.');
  }
  requireModule(manifest.rendering.file, 'SSR renderer');

  for (const routeMarker of REQUIRED_PAGE_ROUTES) {
    if (!findHtmlRoute(routeMarker)) {
      throw new Error(`[SSR build] Generated routes manifest is missing page route for ${routeMarker}.`);
    }
  }
  for (const routeMarker of REQUIRED_LOADER_ROUTES) {
    const route = findHtmlRoute(routeMarker);
    if (typeof route?.loader !== 'string' || !route.loader) {
      throw new Error(`[SSR build] Generated routes manifest is missing loader for ${routeMarker}.`);
    }
    requireModule(route.loader, `loader module for ${routeMarker}`);
  }
}

module.exports = { assertSsrBuild };
