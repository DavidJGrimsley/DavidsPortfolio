import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { readFirstEnvFile } = require('./env-loader.cjs');

const repoRoot = path.resolve(process.cwd());

function runExpoExport(resolvedEnv) {
  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'cmd.exe' : 'npx';
  const args = isWindows ? ['/d', '/s', '/c', 'npx expo export -p web'] : ['expo', 'export', '-p', 'web'];

  const child = spawn(command, args, {
    cwd: repoRoot,
    env: resolvedEnv,
    shell: false,
    stdio: 'inherit',
  });

  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 0));
  });
}

const { envFromFile, sourceFiles = [], candidates } = readFirstEnvFile({ cwd: repoRoot });
if (sourceFiles.length > 0) {
  console.log(`[export-web] Loaded ${sourceFiles.join(', ')}`);
} else {
  console.log(`[export-web] No env file found (checked ${candidates.join(', ')}).`);
}

const exitCode = await runExpoExport({
  ...envFromFile,
  ...process.env,
});

if (exitCode !== 0) {
  process.exit(exitCode || 1);
}
