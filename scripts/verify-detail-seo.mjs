import { pathToFileURL } from 'node:url';

export const DETAIL_SEO_CASES = [
  {
    pathname: '/public-facing/api/quantum',
    title: 'Quantum API | David Grimsley',
    description:
      'General-purpose quantum services for games and applications: simulations, text transformations, gate operations, and more.',
    content: 'General-purpose quantum services',
    jsonLdTypes: ['WebAPI', 'ItemList', 'BreadcrumbList'],
  },
  {
    pathname: '/public-facing/mcp/mrdj-app-mcp',
    title: 'mrdj-app-mcp | MCP Server | David Grimsley',
    description:
      'Model Context Protocol server exposing React Native, Expo Router, and full-stack development guides as structured resources.',
    content: 'React Native, Expo Router',
    jsonLdTypes: ['SoftwareApplication', 'ItemList', 'BreadcrumbList'],
  },
  {
    pathname: '/public-facing/mcp/mrdj-pokemon-mcp',
    title: 'mrdj-pokemon-mcp | MCP Server | David Grimsley',
    description:
      'MCP server exposing Pokemon strategy guides and PokeAPI-style tools: Pokemon lookup/search, type effectiveness, counter suggestions, and team coverage helpers.',
    content: 'Pokemon strategy guides',
    jsonLdTypes: ['SoftwareApplication', 'ItemList', 'BreadcrumbList'],
  },
];

function decodeHtml(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

function attributesFor(tag) {
  const attributes = new Map();
  const pattern = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gu;
  let match;

  while ((match = pattern.exec(tag)) !== null) {
    attributes.set(match[1].toLowerCase(), decodeHtml(match[2] ?? match[3] ?? ''));
  }

  return attributes;
}

function findTags(html, tagName) {
  return html.match(new RegExp(`<${tagName}\\b[^>]*>`, 'giu')) ?? [];
}

function findAttributeValues(html, tagName, selectorName, selectorValue, valueName) {
  return findTags(html, tagName)
    .map(attributesFor)
    .filter(
      (attributes) =>
        attributes.get(selectorName)?.toLowerCase() === selectorValue.toLowerCase(),
    )
    .map((attributes) => attributes.get(valueName) ?? '');
}

function collectJsonLdTypes(value, types = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectJsonLdTypes(item, types);
    return types;
  }

  if (!value || typeof value !== 'object') return types;

  const type = value['@type'];
  if (typeof type === 'string') types.add(type);
  if (Array.isArray(type)) {
    for (const item of type) {
      if (typeof item === 'string') types.add(item);
    }
  }

  for (const nested of Object.values(value)) collectJsonLdTypes(nested, types);
  return types;
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

async function fetchHtml(url, timeoutMs) {
  const { signal, dispose } = createTimeoutSignal(timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        'cache-control': 'no-cache',
        pragma: 'no-cache',
      },
      signal,
    });
    return { body: await response.text(), response };
  } finally {
    dispose();
  }
}

export async function verifyDetailSeoPage(siteUrl, specification, timeoutMs = 30_000, canonicalOrigin = siteUrl) {
  const url = new URL(specification.pathname, siteUrl).toString();
  const canonicalUrl = new URL(specification.pathname, canonicalOrigin).toString();
  const failures = [];
  let response;
  let body;

  try {
    ({ body, response } = await fetchHtml(url, timeoutMs));
  } catch (error) {
    return {
      failures: [error instanceof Error ? error.message : String(error)],
      ok: false,
      pathname: specification.pathname,
      status: null,
      url,
    };
  }

  if (!response.ok) failures.push(`returned ${response.status} ${response.statusText}`);

  const titles = [...body.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/giu)].map((match) =>
    decodeHtml(match[1].trim()),
  );
  const descriptions = findAttributeValues(body, 'meta', 'name', 'description', 'content');
  const canonicals = findAttributeValues(body, 'link', 'rel', 'canonical', 'href');
  const openGraphTitles = findAttributeValues(body, 'meta', 'property', 'og:title', 'content');
  const openGraphUrls = findAttributeValues(body, 'meta', 'property', 'og:url', 'content');
  const jsonLdMatches = [
    ...body.matchAll(
      /<script\b[^>]*\btype=(?:"application\/ld\+json"|'application\/ld\+json')[^>]*>([\s\S]*?)<\/script>/giu,
    ),
  ];

  const requireSingleExact = (label, actual, expected) => {
    if (actual.length !== 1 || actual[0] !== expected) {
      failures.push(`${label} expected exactly ${JSON.stringify(expected)}; found ${JSON.stringify(actual)}`);
    }
  };

  requireSingleExact('title', titles, specification.title);
  requireSingleExact('description', descriptions, specification.description);
  requireSingleExact('canonical', canonicals, canonicalUrl);
  requireSingleExact('Open Graph title', openGraphTitles, specification.title);
  requireSingleExact('Open Graph URL', openGraphUrls, canonicalUrl);

  if (!body.includes(specification.content)) {
    failures.push(`missing unique server-rendered content ${JSON.stringify(specification.content)}`);
  }
  if (body.includes('Failed to load loader data')) {
    failures.push('contains loader-failure text');
  }

  if (jsonLdMatches.length !== 1) {
    failures.push(`expected exactly one JSON-LD block; found ${jsonLdMatches.length}`);
  } else {
    try {
      const jsonLd = JSON.parse(jsonLdMatches[0][1]);
      const jsonLdTypes = collectJsonLdTypes(jsonLd);
      for (const type of specification.jsonLdTypes) {
        if (!jsonLdTypes.has(type)) failures.push(`JSON-LD is missing @type ${type}`);
      }
    } catch (error) {
      failures.push(
        `JSON-LD did not parse: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return {
    failures,
    ok: failures.length === 0,
    pathname: specification.pathname,
    status: response.status,
    url,
  };
}

export async function verifyDetailSeoPages(siteUrl, timeoutMs = 30_000, canonicalOrigin = siteUrl) {
  const results = await Promise.all(
    DETAIL_SEO_CASES.map((specification) =>
      verifyDetailSeoPage(siteUrl, specification, timeoutMs, canonicalOrigin),
    ),
  );

  return {
    failures: results.flatMap((result) =>
      result.failures.map((failure) => `${result.pathname}: ${failure}`),
    ),
    ok: results.every((result) => result.ok),
    results,
  };
}

const isDirectInvocation =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectInvocation) {
  const siteUrl = process.argv[2];
  if (!siteUrl) {
    console.error('Usage: node scripts/verify-detail-seo.mjs <site-url>');
    process.exit(2);
  }

  verifyDetailSeoPages(siteUrl, 30_000, process.argv[3] ?? siteUrl)
    .then((verification) => {
      for (const result of verification.results) {
        console.log(
          `[verify-detail-seo] ${result.pathname} status=${result.status ?? 'unreachable'} ok=${result.ok}`,
        );
      }

      if (!verification.ok) {
        throw new Error(verification.failures.join('; '));
      }
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    });
}
