import { execSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
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
const txtPath = path.join(outputDir, '__djsportfolio_build.txt');
const jsonPath = path.join(outputDir, '__djsportfolio_build.json');

const metadata = {
  app: 'djsportfolio',
  sha,
  shortSha,
  branch,
  builtAt,
};

await mkdir(outputDir, { recursive: true });
await writeFile(txtPath, `${sha}\n`, 'utf8');
await writeFile(jsonPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');

console.log(`Wrote build marker: ${txtPath}`);
console.log(`Wrote build metadata: ${jsonPath}`);
