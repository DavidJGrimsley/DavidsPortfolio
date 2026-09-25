import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const origin = process.argv[2];
if (!origin) {
  throw new Error('Usage: node scripts/verify-agent-seo.mjs <site-origin>');
}

const guides = JSON.parse(
  readFileSync(new URL('../src/constants/json/agent-guides.json', import.meta.url), 'utf8'),
).guides;
const piecesRaw = readFileSync(new URL('../src/constants/json/pieces.json', import.meta.url), 'utf8');
const pieces = JSON.parse(piecesRaw.replace(/\\([^"\\/bfnrtu])/g, '$1'));
const site = new URL(origin);

async function get(pathname) {
  const response = await fetch(new URL(pathname, site));
  const body = await response.text();
  assert.equal(response.status, 200, `${pathname} returned ${response.status}`);
  return { response, body };
}

function tags(html, name, attribute, value) {
  return [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))]
    .map(([tag]) => tag)
    .filter((tag) => new RegExp(`${attribute}=["']${value}["']`, 'i').test(tag));
}

const llms = await get('/llms.txt');
const full = await get('/llms-full.txt');
const sitemap = await get('/sitemap.xml');
const robots = await get('/robots.txt');

for (const resource of [llms, full]) {
  assert.match(resource.response.headers.get('x-robots-tag') ?? '', /noindex/i);
}
for (const section of ['Portfolio', 'Services', 'MCP servers', 'Quantum API']) {
  assert.ok(llms.body.includes(section), `llms.txt missing ${section}`);
}
assert.match(robots.body, /Sitemap: https:\/\/davidjgrimsley\.com\/sitemap\.xml/);
assert.doesNotMatch(sitemap.body, /<lastmod>|\.md<\/loc>|llms\.txt<\/loc>|\/pokemon<\/loc>|\/services\/survey<\/loc>/);

for (const guide of guides) {
  const html = await get(guide.path);
  const markdown = await get(guide.markdownPath);
  const canonical = `https://davidjgrimsley.com${guide.path === '/' ? '' : guide.path}`;
  const markdownUrl = new URL(guide.markdownPath, site).toString();
  assert.equal([...html.body.matchAll(/<title\b[^>]*>[\s\S]*?<\/title>/gi)].length, 1, `${guide.path} title`);
  assert.equal(tags(html.body, 'meta', 'name', 'description').length, 1, `${guide.path} description`);
  assert.equal(tags(html.body, 'link', 'rel', 'canonical').length, 1, `${guide.path} canonical`);
  assert.equal(tags(html.body, 'meta', 'property', 'og:image').length, 1, `${guide.path} social image`);
  assert.ok(html.body.includes(`href="${canonical}"`), `${guide.path} canonical target`);
  assert.ok(html.body.includes(`href="${markdownUrl}"`), `${guide.path} Markdown alternate`);
  assert.ok(html.body.includes('rel="describedby"'), `${guide.path} llms link`);
  assert.match(markdown.response.headers.get('content-type') ?? '', /markdown|text\/plain/i);
  assert.match(markdown.response.headers.get('x-robots-tag') ?? '', /noindex/i);
  assert.match(markdown.response.headers.get('link') ?? '', /rel="canonical"/i);
  assert.ok(markdown.body.startsWith('# '), `${guide.markdownPath} heading`);
  assert.ok(llms.body.includes(guide.markdownPath) || full.body.includes(guide.markdownPath), `${guide.markdownPath} discovery`);
  assert.ok(!sitemap.body.includes(`${guide.markdownPath}</loc>`), `${guide.markdownPath} sitemap exclusion`);
}

for (const category of ['mobile-apps', 'website-development', 'game-design', 'software-development']) {
  const project = pieces[category]?.[0];
  if (!project) continue;
  const pathname = `/portfolio/${category}/${encodeURIComponent(project.title)}`;
  const { body } = await get(pathname);
  assert.equal([...body.matchAll(/<title\b[^>]*>[\s\S]*?<\/title>/gi)].length, 1, `${pathname} title`);
  assert.equal(tags(body, 'meta', 'name', 'description').length, 1, `${pathname} description`);
  assert.ok(body.includes(`href="https://davidjgrimsley.com${pathname}"`), `${pathname} canonical`);
}

for (const pathname of ['/pokemon', '/services/survey', '/services/contact', '/public-facing/api/quantum/auth']) {
  const response = await fetch(new URL(pathname, site));
  assert.match(response.headers.get('x-robots-tag') ?? '', /noindex/i, `${pathname} indexing`);
}

const preview = await fetch(new URL('/images/portfolio-social-preview.png', site));
assert.equal(preview.status, 200, 'social preview status');
assert.match(preview.headers.get('content-type') ?? '', /image\/png/i);
console.log(`Agent and SEO smoke passed: ${guides.length} landing pages and guides`);
