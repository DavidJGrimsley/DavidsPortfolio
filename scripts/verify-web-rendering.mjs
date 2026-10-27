import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { assertWebRendering } = require('./assert-web-rendering.cjs');
const origin = process.argv[2] ?? 'http://localhost:8081';
const pieces = JSON.parse(fs.readFileSync(new URL('../src/constants/json/pieces.json', import.meta.url), 'utf8'));
const featured = Object.values(pieces).flat().find(piece => piece.isFeatured);
const pages = [
  ['/', featured?.displayTitle || featured?.title],
  ...Object.entries(pieces).flatMap(([category, entries]) => entries.map(piece => [
    `/portfolio/${category}/${encodeURIComponent(piece.title)}`,
    piece.displayTitle || piece.title,
  ])),
];

let failures = 0;
for (const [pathname, expectedText] of pages) {
  try {
    const response = await fetch(new URL(pathname, origin), { signal: AbortSignal.timeout(60_000) });
    const html = await response.text();
    if (!response.ok) {
      const missingModule = html.match(/Requiring unknown module[^\n<]{0,160}/)?.[0];
      throw new Error(`${pathname}: HTTP ${response.status}${missingModule ? `: ${missingModule}` : ''}`);
    }
    assertWebRendering(html, pathname, expectedText);
    console.log(`[verify-web] PASS ${pathname}`);
  } catch (error) {
    failures += 1;
    console.error(`[verify-web] FAIL ${error.message}`);
  }
}
if (failures) process.exitCode = 1;
else console.log(`[verify-web] All ${pages.length} pages contain server-rendered content without client-rendering fallbacks.`);
