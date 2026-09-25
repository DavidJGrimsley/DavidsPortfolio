const fs = require('node:fs');
const path = require('node:path');
const { assertSsrBuild } = require('../assert-ssr-build.cjs');

let directory;
let manifest;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(__dirname, 'ssr-fixture-'));
  fs.mkdirSync(path.join(directory, '_expo', 'loaders', '(tabs)', 'public-facing', 'api'), { recursive: true });
  fs.mkdirSync(path.join(directory, '_expo', 'loaders', '(tabs)', 'public-facing', 'mcp'), { recursive: true });
  fs.writeFileSync(path.join(directory, '_expo', 'server-render.js'), 'module.exports = {};');
  fs.writeFileSync(
    path.join(directory, '_expo', 'loaders', '(tabs)', 'public-facing', 'api', '[id].js'),
    'module.exports = {};',
  );
  fs.writeFileSync(
    path.join(directory, '_expo', 'loaders', '(tabs)', 'public-facing', 'mcp', '[id].js'),
    'module.exports = {};',
  );
  manifest = {
    rendering: { mode: 'ssr', file: '_expo/server-render.js' },
    htmlRoutes: [
      { file: './(tabs)/public-facing/api/index.tsx', page: '/(tabs)/public-facing/api/index' },
      {
        file: './(tabs)/public-facing/api/[id].tsx',
        page: '/(tabs)/public-facing/api/[id]',
        loader: '_expo/loaders/(tabs)/public-facing/api/[id].js',
      },
      {
        file: './(tabs)/public-facing/api/quantum/[slug].tsx',
        page: '/(tabs)/public-facing/api/quantum/[slug]',
      },
      { file: './(tabs)/public-facing/mcp/index.tsx', page: '/(tabs)/public-facing/mcp/index' },
      {
        file: './(tabs)/public-facing/mcp/[id].tsx',
        page: '/(tabs)/public-facing/mcp/[id]',
        loader: '_expo/loaders/(tabs)/public-facing/mcp/[id].js',
      },
    ],
  };
});

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

function validate() {
  fs.writeFileSync(path.join(directory, '_expo/routes.json'), JSON.stringify(manifest));
  assertSsrBuild(directory);
}

test('accepts a complete SSR export with static and dynamic loader routes', () => {
  expect(validate).not.toThrow();
});

test.each([
  'public-facing/api/index.tsx',
  'public-facing/api/[id].tsx',
  'public-facing/api/quantum/[slug].tsx',
  'public-facing/mcp/index.tsx',
  'public-facing/mcp/[id].tsx',
])('rejects missing page route for %s', (routeMarker) => {
  manifest.htmlRoutes = manifest.htmlRoutes.filter((route) => !route.file.endsWith(routeMarker));
  expect(validate).toThrow(`missing page route for ${routeMarker}`);
});

test('accepts the API dynamic page without a generated loader entry', () => {
  const routeMarker = 'public-facing/api/[id].tsx';
  const route = manifest.htmlRoutes.find((entry) => entry.file.endsWith(routeMarker));
  delete route.loader;
  expect(validate).not.toThrow();
});

test('accepts the MCP dynamic page without a generated loader entry', () => {
  const routeMarker = 'public-facing/mcp/[id].tsx';
  const route = manifest.htmlRoutes.find((entry) => entry.file.endsWith(routeMarker));
  delete route.loader;
  expect(validate).not.toThrow();
});

test('rejects a missing loader module', () => {
  fs.unlinkSync(path.join(directory, '_expo', 'loaders', '(tabs)', 'public-facing', 'api', '[id].js'));
  expect(validate).toThrow('Invalid loader module for public-facing/api/[id].tsx');
});

test('rejects a static export', () => {
  manifest.rendering.mode = 'static';
  expect(validate).toThrow('Expected server rendering');
});

test('rejects a missing SSR renderer module', () => {
  const file = '_expo/server-render.js';
  fs.unlinkSync(path.join(directory, file));
  expect(validate).toThrow();
});
