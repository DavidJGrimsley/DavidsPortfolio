const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_LOADER_PAGES = [
  '/public-facing/api',
  '/public-facing/api/quantum',
  '/public-facing/mcp',
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

  for (const pathname of REQUIRED_LOADER_PAGES) {
    // Match the first HTML route just as expo-server does. A later route with a
    // loader cannot repair an earlier matching route that omits its loader.
    const route = manifest.htmlRoutes?.find((entry) => new RegExp(entry.namedRegex).test(pathname));
    requireModule(route?.loader, `loader for ${pathname}`);
  }
}

module.exports = { assertSsrBuild };
