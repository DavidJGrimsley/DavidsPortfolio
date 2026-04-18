import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd());
const publicDir = path.join(repoRoot, 'public');
const distDir = path.join(repoRoot, 'dist');

const SITE_URL =
  process.env.EXPO_PUBLIC_SITE_ORIGIN?.trim() ||
  process.env.EXPO_PUBLIC_SITE_URL?.trim() ||
  'https://davidjgrimsley.com';

function joinUrl(base, pathname) {
  const trimmedBase = base.replace(/\/$/, '');
  const trimmedPath = pathname === '/' ? '' : pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${trimmedBase}${trimmedPath}`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    // Some content JSON (especially embedded code examples) may contain non-standard escape
    // sequences like \` or \$ which are invalid in strict JSON. These escapes aren't needed
    // for JSON strings, so we can safely relax them for sitemap generation.
    const relaxed = raw.replace(/\\([^"\\/bfnrtu])/g, '$1');
    return JSON.parse(relaxed);
  }
}

function buildUrlset(urlEntries) {
  const now = new Date().toISOString();

  const items = urlEntries
    .filter((u) => u && u.loc)
    .map((u) => {
      const loc = escapeXml(u.loc);
      const lastmod = escapeXml(u.lastmod || now);
      const changefreq = u.changefreq ? `<changefreq>${escapeXml(u.changefreq)}</changefreq>` : '';
      const priority = typeof u.priority === 'number' ? `<priority>${u.priority.toFixed(1)}</priority>` : '';
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n${changefreq ? `    ${changefreq}\n` : ''}${priority ? `    ${priority}\n` : ''}  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

function uniqueByLoc(entries) {
  const seen = new Set();
  const out = [];
  for (const e of entries) {
    if (!e?.loc) continue;
    if (seen.has(e.loc)) continue;
    seen.add(e.loc);
    out.push(e);
  }
  return out;
}

function normalizePathname(p) {
  if (!p.startsWith('/')) return `/${p}`;
  return p;
}

function encodePathname(pathname) {
  const normalized = normalizePathname(pathname);
  return normalized
    .split('/')
    .map((segment, index) => (index === 0 ? '' : encodeURIComponent(segment)))
    .join('/');
}

function main() {
  // Static routes (group folders like (tabs) are NOT part of the URL)
  const staticRoutes = [
    { path: '/', changefreq: 'weekly', priority: 1.0 },
    { path: '/contact', changefreq: 'monthly', priority: 0.7 },
    { path: '/services', changefreq: 'weekly', priority: 0.9 },
    { path: '/services/learn', changefreq: 'monthly', priority: 0.6 },
    { path: '/services/survey', changefreq: 'monthly', priority: 0.4 },

    { path: '/pokemon', changefreq: 'monthly', priority: 0.4 },

    { path: '/portfolio', changefreq: 'weekly', priority: 0.8 },

    { path: '/public-facing', changefreq: 'weekly', priority: 0.7 },

    { path: '/public-facing/api', changefreq: 'weekly', priority: 0.8 },
    { path: '/public-facing/api/quantum', changefreq: 'weekly', priority: 0.7 },

    { path: '/public-facing/mcp', changefreq: 'weekly', priority: 0.8 },
    { path: '/public-facing/mcp/mrdj-app-mcp', changefreq: 'monthly', priority: 0.6 },
    { path: '/public-facing/mcp/mrdj-pokemon-mcp', changefreq: 'monthly', priority: 0.6 },

    { path: '/public-facing/production', changefreq: 'monthly', priority: 0.5 },

    // Portfolio category indexes
    { path: '/portfolio/mobile-apps', changefreq: 'monthly', priority: 0.7 },
    { path: '/portfolio/game-design', changefreq: 'monthly', priority: 0.7 },
    { path: '/portfolio/website-development', changefreq: 'monthly', priority: 0.7 },
    { path: '/portfolio/software-development', changefreq: 'monthly', priority: 0.7 },
  ];

  // Dynamic portfolio piece routes from pieces.json
  const piecesPath = path.join(repoRoot, 'src', 'constants', 'json', 'pieces.json');
  const pieces = readJson(piecesPath);

  const portfolioRoutes = [];
  const portfolioCategories = [
    'mobile-apps',
    'game-design',
    'website-development',
    'software-development',
  ];

  for (const category of portfolioCategories) {
    const list = Array.isArray(pieces?.[category]) ? pieces[category] : [];
    for (const item of list) {
      if (!item?.title) continue;
      portfolioRoutes.push({
        path: `/portfolio/${category}/${item.title}`,
        changefreq: 'yearly',
        priority: 0.4,
      });
    }
  }

  // Intake form routes from intakeForms.ts keys
  const intakeFormsPath = path.join(repoRoot, 'src', 'constants', 'intakeForms.ts');
  const intakeFile = fs.readFileSync(intakeFormsPath, 'utf8');
  const intakeKeyRegex = /'([a-z0-9-]+)'\s*:\s*\{/g;
  const intakeKeys = new Set();
  for (const match of intakeFile.matchAll(intakeKeyRegex)) {
    if (match?.[1]) intakeKeys.add(match[1]);
  }

  const intakeRoutes = Array.from(intakeKeys).map((key) => ({
    path: `/services/${key}`,
    changefreq: 'monthly',
    priority: 0.5,
  }));

  const allRoutes = [...staticRoutes, ...portfolioRoutes, ...intakeRoutes]
    .map((r) => ({
      loc: joinUrl(SITE_URL, encodePathname(r.path)),
      changefreq: r.changefreq,
      priority: r.priority,
    }));

  const sitemapXml = buildUrlset(uniqueByLoc(allRoutes));

  ensureDir(publicDir);
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8');

  // If a web export exists, also copy into dist/ so it deploys with the build
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml, 'utf8');
  }

  // Minimal robots.txt (do not overwrite if user maintains a custom one)
  const robotsPath = path.join(publicDir, 'robots.txt');
  if (!fs.existsSync(robotsPath)) {
    const robots = `User-agent: *\nAllow: /\n\nSitemap: ${joinUrl(SITE_URL, '/sitemap.xml')}\n`;
    fs.writeFileSync(robotsPath, robots, 'utf8');
  }

  console.log(`Generated sitemap with ${uniqueByLoc(allRoutes).length} URLs`);
}

main();
