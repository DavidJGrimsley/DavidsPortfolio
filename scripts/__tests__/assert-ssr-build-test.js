const fs = require('node:fs');
const path = require('node:path');
const { assertSsrBuild } = require('../assert-ssr-build.cjs');

let directory;
let manifest;

beforeEach(() => {
  directory = fs.mkdtempSync(path.join(__dirname, 'ssr-fixture-'));
  fs.mkdirSync(path.join(directory, '_expo'));
  fs.writeFileSync(path.join(directory, 'render.js'), 'module.exports = {};');
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

test.each([0, 1, 2])('rejects missing embedded loader wiring for route %i', (index) => {
  delete manifest.htmlRoutes[index].loader;
  expect(validate).toThrow('Missing loader for /public-facing/');
});

test('rejects an HTML route shadowing a later loader route', () => {
  manifest.htmlRoutes.unshift({ namedRegex: '^/public-facing/api$' });
  expect(validate).toThrow('Missing loader for /public-facing/api');
});

test('rejects a static export', () => {
  manifest.rendering.mode = 'static';
  expect(validate).toThrow('Expected server rendering');
});

test.each(['render.js', 'loader.js'])('rejects a missing %s module', (file) => {
  fs.unlinkSync(path.join(directory, file));
  expect(validate).toThrow();
});
