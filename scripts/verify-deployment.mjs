import { verifyDetailSeoPages } from './verify-detail-seo.mjs';
import fs from 'node:fs';
import path from 'node:path';

const quantumDocsManifest = JSON.parse(
  fs.readFileSync(
    path.resolve(process.cwd(), 'src', 'constants', 'json', 'quantum-integration-docs.json'),
    'utf8',
  ),
);
const QUANTUM_INTEGRATION_DOCS = Array.isArray(quantumDocsManifest.docs)
  ? quantumDocsManifest.docs
  : [];

function parseArgs(argv) {
  const args = {
    intervalMs: 10_000,
    timeoutMs: 8 * 60_000,
    label: 'deployment',
    notBefore: '',
    expectedSha: '',
    siteUrl: '',
    canonicalOrigin: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const nextValue = argv[index + 1];

    switch (token) {
      case '--site-url':
        args.siteUrl = nextValue ?? '';
        index += 1;
        break;
      case '--canonical-origin':
        args.canonicalOrigin = nextValue ?? '';
        index += 1;
        break;
      case '--not-before':
        args.notBefore = nextValue ?? '';
        index += 1;
        break;
      case '--label':
        args.label = nextValue ?? '';
        index += 1;
        break;
      case '--expected-sha':
        args.expectedSha = nextValue ?? '';
        index += 1;
        break;
      case '--interval-ms':
        args.intervalMs = Number(nextValue ?? '');
        index += 1;
        break;
      case '--timeout-ms':
        args.timeoutMs = Number(nextValue ?? '');
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.siteUrl) {
    throw new Error('Missing required argument: --site-url');
  }

  if (!args.notBefore) {
    throw new Error('Missing required argument: --not-before');
  }

  if (!Number.isFinite(args.intervalMs) || args.intervalMs <= 0) {
    throw new Error(`Invalid --interval-ms value: ${args.intervalMs}`);
  }

  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) {
    throw new Error(`Invalid --timeout-ms value: ${args.timeoutMs}`);
  }

  return args;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function resolveUrl(siteUrl, pathname) {
  return new URL(pathname, siteUrl).toString();
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Request timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  return {
    signal: controller.signal,
    dispose() {
      clearTimeout(timeoutId);
    },
  };
}

async function fetchText(url, timeoutMs) {
  const { signal, dispose } = createTimeoutSignal(timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        'cache-control': 'no-cache',
        pragma: 'no-cache',
      },
      signal,
    });

    const body = await response.text();
    return {
      body,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
    };
  } finally {
    dispose();
  }
}

async function fetchBuildMeta(siteUrl, timeoutMs) {
  const candidatePaths = ['/__djsportfolio_build.json', '/dist/client/__djsportfolio_build.json'];
  let lastError = 'build metadata was not reachable from any known marker path';

  for (const pathname of candidatePaths) {
    const buildMetaUrl = resolveUrl(siteUrl, pathname);
    let response;

    try {
      response = await fetchText(buildMetaUrl, timeoutMs);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      continue;
    }

    if (!response.ok) {
      continue;
    }

    try {
      const payload = JSON.parse(response.body);
      return {
        payload,
        response,
        url: buildMetaUrl,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      continue;
    }
  }

  return {
    error: lastError,
    response: null,
    url: candidatePaths.map((pathname) => resolveUrl(siteUrl, pathname)).join(', '),
  };
}

async function fetchHome(siteUrl, timeoutMs) {
  const homeUrl = resolveUrl(siteUrl, '/');
  const response = await fetchText(homeUrl, timeoutMs);
  return {
    response,
    url: homeUrl,
  };
}

async function fetchRequiredPage(siteUrl, pathname, timeoutMs, requirements) {
  const pageUrl = resolveUrl(siteUrl, pathname);
  let response;

  try {
    response = await fetchText(pageUrl, timeoutMs);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      missing: requirements.map((requirement) => requirement.label),
      ok: false,
      response: null,
      url: pageUrl,
    };
  }

  const missing = requirements
    .filter((requirement) => {
      if (requirement.mustNotInclude) {
        return response.body.includes(requirement.text);
      }

      return !response.body.includes(requirement.text);
    })
    .map((requirement) => requirement.label);

  return {
    error: response.ok
      ? undefined
      : `${pathname} returned ${response.status} ${response.statusText}`,
    missing,
    ok: response.ok && missing.length === 0,
    response,
    url: pageUrl,
  };
}

async function fetchJsonEndpoint(siteUrl, pathname, timeoutMs) {
  const endpointUrl = resolveUrl(siteUrl, pathname);
  let response;

  try {
    response = await fetchText(endpointUrl, timeoutMs);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
      ok: false,
      response: null,
      url: endpointUrl,
    };
  }

  if (!response.ok) {
    return {
      error: `${pathname} returned ${response.status} ${response.statusText}`,
      ok: false,
      response,
      url: endpointUrl,
    };
  }

  try {
    JSON.parse(response.body);
  } catch (error) {
    return {
      error: `${pathname} did not return JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
      ok: false,
      response,
      url: endpointUrl,
    };
  }

  return {
    ok: true,
    response,
    url: endpointUrl,
  };
}

async function verifyQuantumDocumentation(siteUrl, timeoutMs) {
  const pages = [
    {
      path: '/public-facing/api/quantum',
      markdownPath: '/public-facing/api/quantum.md',
      title: 'Quantum API',
      markdownTitle: '# Quantum API',
    },
    ...QUANTUM_INTEGRATION_DOCS.map((doc) => ({
      path: doc.path,
      markdownPath: doc.markdownPath,
      title: doc.title,
      markdownTitle: `# ${doc.title}`,
    })),
  ];

  const checks = await Promise.all(
    pages.flatMap((page) => [
      fetchRequiredPage(siteUrl, page.path, timeoutMs, [
        { label: `${page.title} content`, text: page.title },
        { label: `${page.title} Markdown alternate`, text: 'rel="alternate"' },
        { label: `${page.title} Markdown path`, text: page.markdownPath },
        { label: `${page.title} llms describedby`, text: 'rel="describedby"' },
      ]),
      fetchRequiredPage(siteUrl, page.markdownPath, timeoutMs, [
        { label: `${page.title} Markdown title`, text: page.markdownTitle },
      ]),
    ]),
  );

  const unrealMarkdown = checks.find(
    (check) => check.url === resolveUrl(siteUrl, '/public-facing/api/quantum/ue-plugin.md'),
  );
  const unrealHuman = checks.find(
    (check) => check.url === resolveUrl(siteUrl, '/public-facing/api/quantum/ue-plugin'),
  );
  const unrealRequired = unrealMarkdown && unrealMarkdown.response
    ? ['What does', 'Quantum Api Circuit Operation', '## Troubleshooting'].filter(
        (text) => !unrealMarkdown.response.body.includes(text),
      )
    : ['Unreal Markdown content'];

  const failures = checks
    .filter((check) => !check.ok)
    .map((check) => check.error ?? `${check.url} missing: ${check.missing.join(', ')}`);

  if (unrealRequired.length > 0) {
    failures.push(`Unreal Markdown missing: ${unrealRequired.join(', ')}`);
  }

  const unrealRemovedText = unrealHuman && unrealHuman.response
    ? ['Packaging / distribution', 'Portfolio Metadata', 'Start here', 'Back to Quantum API']
      .filter((text) => unrealHuman.response.body.includes(text))
    : ['Unreal human guide'];

  if (unrealRemovedText.length > 0) {
    failures.push(`Unreal human guide includes removed text: ${unrealRemovedText.join(', ')}`);
  }

  return {
    ok: failures.length === 0,
    failures,
  };
}

function formatBuildSummary(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'unavailable';
  }

  const branch = typeof payload.branch === 'string' ? payload.branch : 'unknown';
  const shortSha = typeof payload.shortSha === 'string' ? payload.shortSha : 'unknown';
  const builtAt = typeof payload.builtAt === 'string' ? payload.builtAt : 'unknown';
  const buildNumber =
    typeof payload.buildNumber === 'number' || typeof payload.buildNumber === 'string'
      ? payload.buildNumber
      : 'unknown';

  return `branch=${branch} shortSha=${shortSha} buildNumber=${buildNumber} builtAt=${builtAt}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const notBeforeTime = Date.parse(args.notBefore);
  if (Number.isNaN(notBeforeTime)) {
    throw new Error(`Invalid --not-before timestamp: ${args.notBefore}`);
  }

  const expectedSha = args.expectedSha.trim().toLowerCase();
  const deadline = Date.now() + args.timeoutMs;
  let attempt = 0;
  let lastFailure = 'deployment has not been verified yet';
  const clockSkewMs = 2 * 60_000;

  while (Date.now() <= deadline) {
    attempt += 1;
    const remainingMs = deadline - Date.now();
    const requestTimeoutMs = Math.max(1_000, Math.min(30_000, remainingMs));

    const [
      buildMetaResult,
      cssBootstrapResult,
      homeResult,
      apiIndexResult,
      quantumDetailResult,
      quantumDocumentationResult,
      llmsTxtResult,
      llmsFullTxtResult,
      sitemapResult,
      apiIndexLoaderEndpointResult,
      quantumDetailLoaderEndpointResult,
      mcpIndexResult,
      mcpIndexLoaderEndpointResult,
      detailSeoResult,
    ] =
      await Promise.all([
        fetchBuildMeta(args.siteUrl, requestTimeoutMs),
        fetchRequiredPage(args.siteUrl, '/__djsportfolio_css__', requestTimeoutMs, [
          { label: 'generated stylesheet asset', text: '_expo/static/css' },
        ]),
        fetchHome(args.siteUrl, requestTimeoutMs),
        fetchRequiredPage(args.siteUrl, '/public-facing/api', requestTimeoutMs, [
          { label: 'CSS bootstrap script', text: '__djsportfolio_css__' },
          { label: 'Public API route data', text: 'Quantum API' },
          {
            label: 'loader failure text absent',
            text: 'Failed to load loader data',
            mustNotInclude: true,
          },
        ]),
        fetchRequiredPage(args.siteUrl, '/public-facing/api/quantum', requestTimeoutMs, [
          { label: 'CSS bootstrap script', text: '__djsportfolio_css__' },
          { label: 'Quantum API content', text: 'Quantum API' },
          { label: 'Quantum API route id', text: 'quantum' },
          {
            label: 'loader failure text absent',
            text: 'Failed to load loader data',
            mustNotInclude: true,
          },
        ]),
        verifyQuantumDocumentation(args.siteUrl, requestTimeoutMs),
        fetchRequiredPage(args.siteUrl, '/llms.txt', requestTimeoutMs, [
          { label: 'llms title', text: '# David Grimsley' },
          { label: 'llms portfolio guide', text: '/guides/portfolio.md' },
          { label: 'llms services guide', text: '/guides/services.md' },
          { label: 'llms MCP guide', text: '/guides/mcp.md' },
          { label: 'llms Quantum API markdown link', text: '/public-facing/api/quantum.md' },
          ...QUANTUM_INTEGRATION_DOCS.map((doc) => ({
            label: `llms ${doc.title} markdown link`,
            text: doc.markdownPath,
          })),
          { label: 'llms full link', text: '/llms-full.txt' },
        ]),
        fetchRequiredPage(args.siteUrl, '/llms-full.txt', requestTimeoutMs, [
          { label: 'llms-full title', text: '# David Grimsley Full Agent Context' },
          { label: 'llms-full portfolio', text: '## Portfolio' },
          { label: 'llms-full services', text: '## Services and contact' },
          { label: 'llms-full Quantum docs', text: '/public-facing/api/quantum/ue-plugin.md' },
        ]),
        fetchRequiredPage(args.siteUrl, '/sitemap.xml', requestTimeoutMs, [
          { label: 'sitemap portfolio', text: '/portfolio</loc>' },
          { label: 'sitemap services', text: '/services</loc>' },
          { label: 'sitemap API', text: '/public-facing/api</loc>' },
          ...QUANTUM_INTEGRATION_DOCS.map((doc) => ({
            label: `sitemap ${doc.title} human URL`, text: `${doc.path}</loc>`,
          })),
          { label: 'sitemap Markdown exclusion', text: '.md</loc>', mustNotInclude: true },
          { label: 'sitemap agent index exclusion', text: '/llms.txt</loc>', mustNotInclude: true },
          { label: 'sitemap build-time dates exclusion', text: '<lastmod>', mustNotInclude: true },
        ]),
        fetchJsonEndpoint(
          args.siteUrl,
          '/_expo/loaders/public-facing/api/index',
          requestTimeoutMs,
        ),
        fetchJsonEndpoint(
          args.siteUrl,
          '/_expo/loaders/public-facing/api/quantum',
          requestTimeoutMs,
        ),
        fetchRequiredPage(args.siteUrl, '/public-facing/mcp', requestTimeoutMs, [
          { label: 'CSS bootstrap script', text: '__djsportfolio_css__' },
          { label: 'MCP server route data', text: 'mrdj-app-mcp' },
          {
            label: 'loader failure text absent',
            text: 'Failed to load loader data',
            mustNotInclude: true,
          },
        ]),
        fetchJsonEndpoint(
          args.siteUrl,
          '/_expo/loaders/public-facing/mcp/index',
          requestTimeoutMs,
        ),
        verifyDetailSeoPages(args.siteUrl, requestTimeoutMs, args.canonicalOrigin || args.siteUrl),
      ]);

    const buildPayload = buildMetaResult.payload ?? null;
    const builtAt =
      buildPayload && typeof buildPayload.builtAt === 'string'
        ? Date.parse(buildPayload.builtAt)
        : Number.NaN;
    const payloadSha =
      buildPayload && typeof buildPayload.sha === 'string' ? buildPayload.sha.toLowerCase() : '';
    const payloadShortSha =
      buildPayload && typeof buildPayload.shortSha === 'string'
        ? buildPayload.shortSha.toLowerCase()
        : '';
    const payloadHasKnownSha =
      (payloadSha.length > 0 && payloadSha !== 'unknown') ||
      (payloadShortSha.length > 0 && payloadShortSha !== 'unknown');

    const buildMatchesExpected =
      expectedSha.length > 0 &&
      (payloadSha === expectedSha || payloadShortSha === expectedSha.slice(0, 7));
    const buildFreshByTime =
      Number.isFinite(builtAt) && builtAt >= notBeforeTime - clockSkewMs;
    const verifyingByExpectedSha = expectedSha.length > 0 && payloadHasKnownSha;
    const buildFresh = verifyingByExpectedSha ? buildMatchesExpected : buildFreshByTime;
    const cssBootstrapOk = cssBootstrapResult.ok;
    const homeOk = homeResult.response.ok;
    const apiIndexOk = apiIndexResult.ok;
    const quantumDetailOk = quantumDetailResult.ok;
    const quantumDocumentationOk = quantumDocumentationResult.ok;
    const llmsTxtOk = llmsTxtResult.ok;
    const llmsFullTxtOk = llmsFullTxtResult.ok;
    const sitemapOk = sitemapResult.ok;
    const apiIndexLoaderEndpointOk = apiIndexLoaderEndpointResult.ok;
    const quantumDetailLoaderEndpointOk = quantumDetailLoaderEndpointResult.ok;
    const mcpIndexOk = mcpIndexResult.ok;
    const mcpIndexLoaderEndpointOk = mcpIndexLoaderEndpointResult.ok;
    const detailSeoOk = detailSeoResult.ok;

    console.log(
      `[verify-deployment] ${args.label} attempt ${attempt}: ` +
        `${formatBuildSummary(buildPayload)} ` +
        `verificationMode=${verifyingByExpectedSha ? 'sha' : 'timestamp'} ` +
        `buildFresh=${buildFresh} ` +
        `buildMatchesExpected=${buildMatchesExpected} ` +
        `cssBootstrapStatus=${cssBootstrapResult.response?.status ?? 'unreachable'} ` +
        `cssBootstrapOk=${cssBootstrapOk} ` +
        `homeStatus=${homeResult.response.status} ` +
        `apiIndexStatus=${apiIndexResult.response?.status ?? 'unreachable'} ` +
        `apiIndexLoaderOk=${apiIndexOk} ` +
        `quantumDetailStatus=${quantumDetailResult.response?.status ?? 'unreachable'} ` +
        `quantumDetailLoaderOk=${quantumDetailOk} ` +
        `quantumDocumentationOk=${quantumDocumentationOk} ` +
        `llmsTxtStatus=${llmsTxtResult.response?.status ?? 'unreachable'} ` +
        `llmsTxtOk=${llmsTxtOk} ` +
        `llmsFullTxtStatus=${llmsFullTxtResult.response?.status ?? 'unreachable'} ` +
        `llmsFullTxtOk=${llmsFullTxtOk} ` +
        `sitemapStatus=${sitemapResult.response?.status ?? 'unreachable'} ` +
        `sitemapOk=${sitemapOk} ` +
        `apiIndexLoaderEndpointStatus=${apiIndexLoaderEndpointResult.response?.status ?? 'unreachable'} ` +
        `apiIndexLoaderEndpointOk=${apiIndexLoaderEndpointOk} ` +
        `quantumDetailLoaderEndpointStatus=${quantumDetailLoaderEndpointResult.response?.status ?? 'unreachable'} ` +
        `quantumDetailLoaderEndpointOk=${quantumDetailLoaderEndpointOk} ` +
        `mcpIndexStatus=${mcpIndexResult.response?.status ?? 'unreachable'} ` +
        `mcpIndexLoaderOk=${mcpIndexOk} ` +
        `mcpIndexLoaderEndpointStatus=${mcpIndexLoaderEndpointResult.response?.status ?? 'unreachable'} ` +
        `mcpIndexLoaderEndpointOk=${mcpIndexLoaderEndpointOk} ` +
        `detailSeoOk=${detailSeoOk}`,
    );

    if (
      buildFresh &&
      cssBootstrapOk &&
      homeOk &&
      apiIndexOk &&
      quantumDetailOk &&
      quantumDocumentationOk &&
      llmsTxtOk &&
      llmsFullTxtOk &&
      sitemapOk &&
      apiIndexLoaderEndpointOk &&
      quantumDetailLoaderEndpointOk &&
      mcpIndexOk &&
      mcpIndexLoaderEndpointOk &&
      detailSeoOk
    ) {
      console.log(
        `[verify-deployment] ${args.label} is live at ${args.siteUrl} with a fresh build, healthy SSR detail metadata, and public route loader data.`,
      );
      return;
    }

    const buildError = buildFresh
      ? 'build marker is fresh'
      : (buildMetaResult.error ??
        (verifyingByExpectedSha
          ? `build sha ${buildPayload?.sha ?? buildPayload?.shortSha ?? 'unknown'} does not match expected ${expectedSha}`
          : Number.isFinite(builtAt)
            ? `build timestamp ${buildPayload?.builtAt ?? 'unknown'} is older than ${args.notBefore} (allowing ${clockSkewMs}ms skew)`
            : `build timestamp is missing or invalid in ${buildMetaResult.url}`));
    const homeError = homeOk
      ? 'home page is healthy'
      : `home returned ${homeResult.response.status} ${homeResult.response.statusText}`;
    const cssBootstrapError = cssBootstrapOk
      ? 'CSS bootstrap is healthy'
      : (cssBootstrapResult.error ??
        `CSS bootstrap missing: ${cssBootstrapResult.missing.join(', ')}`);
    const apiIndexError = apiIndexOk
      ? 'public API index loader data is healthy'
      : (apiIndexResult.error ??
        `public API index loader data missing: ${apiIndexResult.missing.join(', ')}`);
    const quantumDetailError = quantumDetailOk
      ? 'Quantum API detail loader data is healthy'
      : (quantumDetailResult.error ??
        `Quantum API detail loader data missing: ${quantumDetailResult.missing.join(', ')}`);
    const quantumDocumentationError = quantumDocumentationOk
      ? 'Quantum API documentation is healthy'
      : `Quantum API documentation failed: ${quantumDocumentationResult.failures.join('; ')}`;
    const llmsTxtError = llmsTxtOk
      ? 'llms.txt is healthy'
      : (llmsTxtResult.error ?? `llms.txt missing: ${llmsTxtResult.missing.join(', ')}`);
    const llmsFullTxtError = llmsFullTxtOk
      ? 'llms-full.txt is healthy'
      : (llmsFullTxtResult.error ??
        `llms-full.txt missing: ${llmsFullTxtResult.missing.join(', ')}`);
    const sitemapError = sitemapOk
      ? 'sitemap includes the Quantum API documentation'
      : (sitemapResult.error ?? `sitemap missing: ${sitemapResult.missing.join(', ')}`);
    const apiIndexLoaderEndpointError = apiIndexLoaderEndpointOk
      ? 'public API index loader endpoint is healthy'
      : (apiIndexLoaderEndpointResult.error ?? 'public API index loader endpoint is unhealthy');
    const quantumDetailLoaderEndpointError = quantumDetailLoaderEndpointOk
      ? 'Quantum API detail loader endpoint is healthy'
      : (quantumDetailLoaderEndpointResult.error ??
        'Quantum API detail loader endpoint is unhealthy');
    const mcpIndexError = mcpIndexOk
      ? 'MCP index loader data is healthy'
      : (mcpIndexResult.error ??
        `MCP index loader data missing: ${mcpIndexResult.missing.join(', ')}`);
    const mcpIndexLoaderEndpointError = mcpIndexLoaderEndpointOk
      ? 'MCP index loader endpoint is healthy'
      : (mcpIndexLoaderEndpointResult.error ?? 'MCP index loader endpoint is unhealthy');
    const detailSeoError = detailSeoOk
      ? 'detail-page SSR SEO is healthy'
      : `detail-page SSR SEO failed: ${detailSeoResult.failures.join(', ')}`;
    lastFailure = `${buildError}; ${cssBootstrapError}; ${homeError}; ${apiIndexError}; ${quantumDetailError}; ${quantumDocumentationError}; ${llmsTxtError}; ${llmsFullTxtError}; ${sitemapError}; ${apiIndexLoaderEndpointError}; ${quantumDetailLoaderEndpointError}; ${mcpIndexError}; ${mcpIndexLoaderEndpointError}; ${detailSeoError}`;

    if (Date.now() + args.intervalMs > deadline) {
      break;
    }

    await sleep(args.intervalMs);
  }

  throw new Error(
    `[verify-deployment] ${args.label} failed verification for ${args.siteUrl}: ${lastFailure}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  // Let pending fetch handles and diagnostic output close before exiting.
  process.exitCode = 1;
});
