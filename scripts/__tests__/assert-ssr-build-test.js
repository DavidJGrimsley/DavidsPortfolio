const fs = require('node:fs');
const path = require('node:path');
const { assertSsrBuild } = require('../assert-ssr-build.cjs');

let directory;
let manifest;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(__dirname, 'ssr-fixture-'));
  fs.mkdirSync(path.join(directory, '_expo'));
  fs.writeFileSync(
    path.join(directory, 'render.js'),
    '__EXPO_ROUTER_LOADER_DATA__ public-facing/api/index.tsx public-facing/api/[id].tsx ' +
      'public-facing/mcp/index.tsx public-facing/mcp/[id].tsx',
  );
  fs.writeFileSync(path.join(directory, 'loader.js'), 'module.exports = {};');
  manifest = {
    rendering: { mode: 'ssr', file: 'render.js' },
    htmlRoutes: [
      { namedRegex: '^/public-facing/api$', loader: 'loader.js' },
      { namedRegex: '^/public-facing/api/([^/]+)$', loader: 'loader.js' },
      { namedRegex: '^/public-facing/mcp$', loader: 'loader.js' },
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
  'public-facing/mcp/index.tsx',
  'public-facing/mcp/[id].tsx',
])('rejects missing embedded loader wiring for %s', (routeMarker) => {
  const rendererPath = path.join(directory, 'render.js');
  fs.writeFileSync(rendererPath, fs.readFileSync(rendererPath, 'utf8').replace(routeMarker, ''));
  expect(validate).toThrow(`missing loader route wiring for ${routeMarker}`);
});

test('rejects a renderer without loader-data wiring', () => {
  const rendererPath = path.join(directory, 'render.js');
  fs.writeFileSync(rendererPath, fs.readFileSync(rendererPath, 'utf8').replace('__EXPO_ROUTER_LOADER_DATA__', ''));
  expect(validate).toThrow('does not contain Expo Router loader-data wiring');
});

test('rejects a static export', () => {
  manifest.rendering.mode = 'static';
  expect(validate).toThrow('Expected server rendering');
});

test('rejects a missing SSR renderer module', () => {
  const file = 'render.js';
  fs.unlinkSync(path.join(directory, file));
  expect(validate).toThrow();
});
