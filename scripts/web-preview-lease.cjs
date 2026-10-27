const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

function workspaceDir(projectRoot) {
  const root = fs.realpathSync(projectRoot);
  const dir = path.join(root, '.expo');
  fs.mkdirSync(dir, { recursive: true });
  const resolved = fs.realpathSync(dir);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('The web preview state directory must be inside the project.');
  }
  return resolved;
}

function activePreviewPids(dir) {
  const pids = [];
  for (const name of fs.readdirSync(dir)) {
    if (!/^web-preview-\d+-[\da-f-]+\.json$/i.test(name)) continue;
    const file = path.join(dir, name);
    let pid;
    try { pid = JSON.parse(fs.readFileSync(file, 'utf8')).pid; }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (!Number.isInteger(pid) || pid <= 0) throw new Error(`Invalid preview state at ${file}.`);
    try { process.kill(pid, 0); pids.push(pid); }
    catch (error) {
      if (error.code !== 'ESRCH') pids.push(pid);
      else {
        // Marker names contain a unique token, so no later preview can reuse it.
        try { fs.unlinkSync(file); } catch (unlinkError) { if (unlinkError.code !== 'ENOENT') throw unlinkError; }
      }
    }
  }
  return pids;
}

function registerWebPreview(projectRoot) {
  const dir = workspaceDir(projectRoot);
  const exportLock = path.join(dir, 'web-export.lock');
  if (fs.existsSync(exportLock)) throw new Error('A web export is running; start the preview after it finishes.');
  const marker = path.join(dir, `web-preview-${process.pid}-${randomUUID()}.json`);
  fs.writeFileSync(marker, JSON.stringify({ pid: process.pid }), { flag: 'wx' });
  if (fs.existsSync(exportLock)) {
    fs.unlinkSync(marker);
    throw new Error('A web export started concurrently; start the preview after it finishes.');
  }
  const cleanup = () => { try { fs.unlinkSync(marker); } catch (error) { if (error.code !== 'ENOENT') console.warn(`[preview] ${error.message}`); } };
  process.once('exit', cleanup);
  return cleanup;
}

module.exports = { workspaceDir, activePreviewPids, registerWebPreview };
