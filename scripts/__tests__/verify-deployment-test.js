/** @jest-environment node */
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const DETAIL_PAGES = {
  '/public-facing/api/quantum': {
    title: 'Quantum API | David Grimsley',
    description:
      'General-purpose quantum services for games and applications: simulations, text transformations, gate operations, and more.',
    content: 'General-purpose quantum services',
    types: ['WebAPI', 'ItemList', 'BreadcrumbList'],
  },
  '/public-facing/mcp/mrdj-app-mcp': {
    title: 'mrdj-app-mcp | MCP Server | David Grimsley',
    description:
      'Model Context Protocol server exposing React Native, Expo Router, and full-stack development guides as structured resources.',
    content: 'React Native, Expo Router',
    types: ['SoftwareApplication', 'ItemList', 'BreadcrumbList'],
  },
  '/public-facing/mcp/mrdj-pokemon-mcp': {
    title: 'mrdj-pokemon-mcp | MCP Server | David Grimsley',
    description:
      'MCP server exposing Pokemon strategy guides and PokeAPI-style tools: Pokemon lookup/search, type effectiveness, counter suggestions, and team coverage helpers.',
    content: 'Pokemon strategy guides',
    types: ['SoftwareApplication', 'ItemList', 'BreadcrumbList'],
  },
};

function renderDetailPage(request, detail, loaderData) {
  const origin = `http://${request.headers.host}`;
  const canonical = `${origin}${request.url}`;
  return [
    `<title>${detail.title}</title>`,
    `<meta name="description" content="${detail.description}">`,
    `<link rel="canonical" href="${canonical}">`,
    `<meta property="og:title" content="${detail.title}">`,
    `<meta property="og:url" content="${canonical}">`,
    `<script type="application/ld+json">${JSON.stringify({ '@graph': detail.types.map((type) => ({ '@type': type })) })}</script>`,
    detail.content,
    loaderData,
  ].join(' ');
}

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
      const loaderData = request.url === missingPage ? '' : '__EXPO_ROUTER_LOADER_DATA__';
      const detail = DETAIL_PAGES[request.url];
      response.end(
        detail
          ? renderDetailPage(request, detail, loaderData)
          : `David __djsportfolio_css__ _expo/static/css Quantum API quantum mrdj-app-mcp ${loaderData}`,
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
