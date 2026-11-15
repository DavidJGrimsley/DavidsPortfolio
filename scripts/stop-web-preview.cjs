const path = require('node:path');
const { workspaceDir, activePreviewPids } = require('./web-preview-lease.cjs');

const STOP_TIMEOUT_MS = 2000;
const KILL_TIMEOUT_MS = 500;
const POLL_INTERVAL_MS = 50;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sendSignal(pid, signal) {
  try {
    process.kill(pid, signal);
    return true;
  } catch (error) {
    if (error.code === 'ESRCH') return false;
    throw error;
  }
}

async function waitForExit(dir, targetPids, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let remaining = activePreviewPids(dir).filter(pid => targetPids.includes(pid));
  while (remaining.length && Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    remaining = activePreviewPids(dir).filter(pid => targetPids.includes(pid));
  }
  return remaining;
}

/**
 * Stops active local production preview servers registered in `.expo`.
 * Returns the PIDs initially targeted and any PIDs still alive afterward.
 */
async function stopWebPreviews(projectRoot = path.resolve(__dirname, '..')) {
  const dir = workspaceDir(projectRoot);
  const pids = activePreviewPids(dir);
  if (!pids.length) return { stopped: [], remaining: [] };

  for (const pid of pids) {
    sendSignal(pid, 'SIGTERM');
  }

  let remaining = await waitForExit(dir, pids, STOP_TIMEOUT_MS);
  if (remaining.length) {
    for (const pid of remaining) {
      sendSignal(pid, 'SIGKILL');
    }
    remaining = await waitForExit(dir, pids, KILL_TIMEOUT_MS);
  }

  const remainingSet = new Set(remaining);
  return {
    stopped: pids.filter(pid => !remainingSet.has(pid)),
    remaining,
  };
}

if (require.main === module) {
  stopWebPreviews()
    .then(({ stopped, remaining }) => {
      if (!stopped.length && !remaining.length) {
        console.log('[stop-preview] No active local production preview found.');
        return;
      }
      if (stopped.length) {
        console.log(`[stop-preview] Stopped local production preview (PID ${stopped.join(', ')}).`);
      }
      if (remaining.length) {
        console.error(`[stop-preview] Failed to stop preview process (PID ${remaining.join(', ')}).`);
        process.exitCode = 1;
      }
    })
    .catch(error => {
      console.error(`[stop-preview] ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = { stopWebPreviews };
