/** @jest-environment node */
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

test.each([
  ['/public-facing/api'],
  ['/public-facing/api/quantum'],
  ['/public-facing/mcp'],
])('rejects healthy endpoints when %s omits embedded loader data', async (missingPage) => {
  const builtAt = new Date().toISOString();
  const server = http.createServer((request, response) => {
    if (request.url === '/__djsportfolio_build.json') {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ builtAt }));
    } else if (request.url.startsWith('/_expo/loaders/')) {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ healthy: true }));
    } else {
      response.setHeader('Content-Type', 'text/html');
      response.end(
        'David __djsportfolio_css__ _expo/static/css Quantum API quantum mrdj-app-mcp ' +
          (request.url === missingPage ? '' : '__EXPO_ROUTER_LOADER_DATA__')
      );
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  try {
    const result = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [
        path.join(__dirname, '../verify-deployment.mjs'),
        '--site-url', `http://127.0.0.1:${server.address().port}`,
        '--not-before', builtAt,
        '--timeout-ms', '1000',
        '--interval-ms', '1000',
      ]);
      let output = '';
      child.stdout.on('data', (chunk) => { output += chunk; });
      child.stderr.on('data', (chunk) => { output += chunk; });
      child.once('error', reject);
      child.once('exit', (code) => resolve({ code, output }));
    });
    expect(result.code).toBe(1);
    expect(result.output).toContain('loader data missing: Expo Router loader data');
    expect(result.output).toContain('apiIndexLoaderEndpointOk=true');
    expect(result.output).toContain('quantumDetailLoaderEndpointOk=true');
    expect(result.output).toContain('mcpIndexLoaderEndpointOk=true');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
