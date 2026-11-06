import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { readFirstEnvFile } = require('./env-loader.cjs');
const { assertSsrBuild } = require('./assert-ssr-build.cjs');
const { safeWebExport } = require('./safe-web-export.cjs');

const repoRoot = path.resolve(process.cwd());

function runExpoExport(resolvedEnv, outputDir) {
  // Match the development commands: this navigation tree exceeds V8's
  // default 984 KB stack during SSR, before React can recover the render.
  const command = process.execPath;
  const args = ['--stack-size=2048', require.resolve('expo/bin/cli'), 'export', '-p', 'web', '--output-dir', outputDir];

  const child = spawn(command, args, {
    cwd: repoRoot,
    env: resolvedEnv,
    shell: false,
    stdio: 'inherit',
  });

  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Expo export failed (exit ${code ?? 'unknown'}${signal ? `, signal ${signal}` : ''}); Node ${process.version} at ${process.execPath}; project ${repoRoot}.`));
    });
  });
}

const { envFromFile, sourceFiles = [], candidates } = readFirstEnvFile({ cwd: repoRoot });
if (sourceFiles.length > 0) {
  console.log(`[export-web] Loaded ${sourceFiles.join(', ')}`);
} else {
  console.log(`[export-web] No env file found (checked ${candidates.join(', ')}).`);
}

try {
  await safeWebExport(
    repoRoot,
    (stage) => runExpoExport({ ...envFromFile, ...process.env }, stage),
    (stage) => assertSsrBuild(path.join(stage, 'server')),
  );
} catch (error) {
  console.error(`[export-web] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
