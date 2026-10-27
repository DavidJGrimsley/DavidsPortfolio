const fs = require('node:fs');
const path = require('node:path');
const { workspaceDir, activePreviewPids } = require('./web-preview-lease.cjs');

// Build outside dist and serialize publishers so a failed or overlapping export
// cannot leave the existing preview with an incomplete renderer or assets.
async function safeWebExport(projectRoot, build, validate) {
  const root = fs.realpathSync(projectRoot);
  const realWorkDir = workspaceDir(root);

  const lockPath = path.join(realWorkDir, 'web-export.lock');
  let lock;
  try {
    lock = fs.openSync(lockPath, 'wx');
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error(`Another web export is running or was interrupted. If no export is active, remove ${lockPath} and retry.`);
    }
    throw error;
  }

  let stage;
  let backup;
  let promoted = false;
  try {
    fs.writeFileSync(lock, `pid=${process.pid}\n`);
    const previews = activePreviewPids(realWorkDir);
    if (previews.length) {
      throw new Error(`A local production preview is running (PID ${previews.join(', ')}). Stop it before building, then restart it after the build finishes.`);
    }
    stage = fs.mkdtempSync(path.join(realWorkDir, 'web-export-'));
    backup = `${stage}-previous`;
    await build(stage);
    await validate(stage);

    const destination = path.join(root, 'dist');
    if (fs.existsSync(destination)) {
      if (fs.lstatSync(destination).isSymbolicLink()) throw new Error('Refusing to replace a symlinked dist directory.');
      fs.renameSync(destination, backup);
    }
    try {
      fs.renameSync(stage, destination);
      promoted = true;
    } catch (error) {
      if (fs.existsSync(backup)) fs.renameSync(backup, destination);
      throw error;
    }
  } finally {
    // These names were created by this invocation under the verified project
    // staging directory; never recursively remove a caller-supplied path.
    if (stage && path.dirname(stage) === realWorkDir && path.basename(stage).startsWith('web-export-')) {
      if (!promoted) fs.rmSync(stage, { recursive: true, force: true });
      if (promoted && backup === `${stage}-previous`) fs.rmSync(backup, { recursive: true, force: true });
    }
    fs.closeSync(lock);
    fs.unlinkSync(lockPath);
  }
}

module.exports = { safeWebExport };
