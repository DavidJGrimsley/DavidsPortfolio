const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_PAGE_ROUTES = [
  'public-facing/api/index.tsx',
  'public-facing/api/[id].tsx',
  'public-facing/api/quantum/[slug].tsx',
  'public-facing/mcp/index.tsx',
  'public-facing/mcp/[id].tsx',
];

const OPTIONAL_LOADER_ROUTES = [
  // Expo SDK 57 may omit these generated loaders. The production server
  // provides runtime loader endpoints; deployment smoke checks verify pages.
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

  function requireLoaderArtifact(file, description) {
    const resolved = requireModulePath(file, description);
    if (fs.existsSync(resolved) && fs.statSync(resolved).isFile() && fs.statSync(resolved).size > 0) {
      return resolved;
    }

    const sourceMap = `${resolved}.map`;
    if (fs.existsSync(sourceMap) && fs.statSync(sourceMap).isFile() && fs.statSync(sourceMap).size > 0) {
      return sourceMap;
    }

    throw new Error(`[SSR build] Invalid ${description}: ${file}`);
  }

  function requireModulePath(file, description) {
    if (typeof file !== 'string' || !file) {
      throw new Error(`[SSR build] Missing ${description} in the generated routes manifest.`);
    }
    const resolved = path.resolve(serverBuildDir, file);
    const relative = path.relative(serverBuildDir, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
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
  for (const routeMarker of OPTIONAL_LOADER_ROUTES) {
    const route = findHtmlRoute(routeMarker);
    if (typeof route?.loader === 'string' && route.loader) {
      requireLoaderArtifact(route.loader, `loader module for ${routeMarker}`);
    }
  }
}

module.exports = { assertSsrBuild };
