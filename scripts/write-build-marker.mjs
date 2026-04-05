import { execSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

function safeGit(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const sha = process.env.GITHUB_SHA || safeGit('git rev-parse HEAD') || 'unknown';
const branch = process.env.GITHUB_REF_NAME || safeGit('git rev-parse --abbrev-ref HEAD') || 'unknown';
const shortSha = sha === 'unknown' ? 'unknown' : sha.slice(0, 7);
const builtAt = new Date().toISOString();

const outputDir = path.join(process.cwd(), 'dist', 'client');
const sequencePath = path.join(process.cwd(), '.plesk-build-seq');
const txtPath = path.join(outputDir, '__djsportfolio_build.txt');
const jsonPath = path.join(outputDir, '__djsportfolio_build.json');
const jsPath = path.join(outputDir, '__djsportfolio_build.js');

async function getNextBuildNumber() {
  try {
    const raw = await readFile(sequencePath, 'utf8');
    const current = Number.parseInt(raw.trim(), 10);
    const next = Number.isFinite(current) && current >= 0 ? current + 1 : 1;
    await writeFile(sequencePath, `${next}\n`, 'utf8');
    return next;
  } catch {
    await writeFile(sequencePath, '1\n', 'utf8');
    return 1;
  }
}

const buildNumber = await getNextBuildNumber();

const metadata = {
  app: 'djsportfolio',
  buildNumber,
  sha,
  shortSha,
  branch,
  builtAt,
};

await mkdir(outputDir, { recursive: true });
await writeFile(txtPath, `${sha}\n`, 'utf8');
await writeFile(jsonPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
await writeFile(
  jsPath,
  `window.__DJS_BUILD_INFO__ = ${JSON.stringify(metadata)};\n`,
  'utf8'
);

console.log(`Wrote build marker: ${txtPath}`);
console.log(`Wrote build metadata: ${jsonPath}`);
console.log(`Wrote build metadata script: ${jsPath}`);
