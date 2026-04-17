function parseArgs(argv) {
  const args = {
    intervalMs: 10_000,
    timeoutMs: 8 * 60_000,
    label: 'deployment',
    notBefore: '',
    expectedSha: '',
    siteUrl: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const nextValue = argv[index + 1];

    switch (token) {
      case '--site-url':
        args.siteUrl = nextValue ?? '';
        index += 1;
        break;
      case '--not-before':
        args.notBefore = nextValue ?? '';
        index += 1;
        break;
      case '--label':
        args.label = nextValue ?? '';
        index += 1;
        break;
      case '--expected-sha':
        args.expectedSha = nextValue ?? '';
        index += 1;
        break;
      case '--interval-ms':
        args.intervalMs = Number(nextValue ?? '');
        index += 1;
        break;
      case '--timeout-ms':
        args.timeoutMs = Number(nextValue ?? '');
        index += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (!args.siteUrl) {
    throw new Error('Missing required argument: --site-url');
  }

  if (!args.notBefore) {
    throw new Error('Missing required argument: --not-before');
  }

  if (!Number.isFinite(args.intervalMs) || args.intervalMs <= 0) {
    throw new Error(`Invalid --interval-ms value: ${args.intervalMs}`);
  }

  if (!Number.isFinite(args.timeoutMs) || args.timeoutMs <= 0) {
    throw new Error(`Invalid --timeout-ms value: ${args.timeoutMs}`);
  }

  return args;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function resolveUrl(siteUrl, pathname) {
  return new URL(pathname, siteUrl).toString();
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Request timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  return {
    signal: controller.signal,
    dispose() {
      clearTimeout(timeoutId);
    },
  };
}

async function fetchText(url, timeoutMs) {
  const { signal, dispose } = createTimeoutSignal(timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        'cache-control': 'no-cache',
        pragma: 'no-cache',
      },
      signal,
    });

    const body = await response.text();
    return {
      body,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
    };
  } finally {
    dispose();
  }
}

async function fetchBuildMeta(siteUrl, timeoutMs) {
  const candidatePaths = ['/__djsportfolio_build.json', '/dist/client/__djsportfolio_build.json'];
  let lastError = 'build metadata was not reachable from any known marker path';

  for (const pathname of candidatePaths) {
    const buildMetaUrl = resolveUrl(siteUrl, pathname);
    let response;

    try {
      response = await fetchText(buildMetaUrl, timeoutMs);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      continue;
    }

    if (!response.ok) {
      continue;
    }

    try {
      const payload = JSON.parse(response.body);
      return {
        payload,
        response,
        url: buildMetaUrl,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      continue;
    }
  }

  return {
    error: lastError,
    response: null,
    url: candidatePaths.map((pathname) => resolveUrl(siteUrl, pathname)).join(', '),
  };
}

async function fetchHome(siteUrl, timeoutMs) {
  const homeUrl = resolveUrl(siteUrl, '/');
  const response = await fetchText(homeUrl, timeoutMs);
  return {
    response,
    url: homeUrl,
  };
}

function formatBuildSummary(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'unavailable';
  }

  const branch = typeof payload.branch === 'string' ? payload.branch : 'unknown';
  const shortSha = typeof payload.shortSha === 'string' ? payload.shortSha : 'unknown';
  const builtAt = typeof payload.builtAt === 'string' ? payload.builtAt : 'unknown';
  const buildNumber =
    typeof payload.buildNumber === 'number' || typeof payload.buildNumber === 'string'
      ? payload.buildNumber
      : 'unknown';

  return `branch=${branch} shortSha=${shortSha} buildNumber=${buildNumber} builtAt=${builtAt}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const notBeforeTime = Date.parse(args.notBefore);
  if (Number.isNaN(notBeforeTime)) {
    throw new Error(`Invalid --not-before timestamp: ${args.notBefore}`);
  }

  const expectedSha = args.expectedSha.trim().toLowerCase();
  const deadline = Date.now() + args.timeoutMs;
  let attempt = 0;
  let lastFailure = 'deployment has not been verified yet';
  const clockSkewMs = 2 * 60_000;

  while (Date.now() <= deadline) {
    attempt += 1;
    const remainingMs = deadline - Date.now();
    const requestTimeoutMs = Math.max(1_000, Math.min(30_000, remainingMs));

    const [buildMetaResult, homeResult] = await Promise.all([
      fetchBuildMeta(args.siteUrl, requestTimeoutMs),
      fetchHome(args.siteUrl, requestTimeoutMs),
    ]);

    const buildPayload = buildMetaResult.payload ?? null;
    const builtAt =
      buildPayload && typeof buildPayload.builtAt === 'string'
        ? Date.parse(buildPayload.builtAt)
        : Number.NaN;
    const payloadSha =
      buildPayload && typeof buildPayload.sha === 'string' ? buildPayload.sha.toLowerCase() : '';
    const payloadShortSha =
      buildPayload && typeof buildPayload.shortSha === 'string'
        ? buildPayload.shortSha.toLowerCase()
        : '';
    const payloadHasKnownSha =
      (payloadSha.length > 0 && payloadSha !== 'unknown') ||
      (payloadShortSha.length > 0 && payloadShortSha !== 'unknown');

    const buildMatchesExpected =
      expectedSha.length > 0 &&
      (payloadSha === expectedSha || payloadShortSha === expectedSha.slice(0, 7));
    const buildFreshByTime =
      Number.isFinite(builtAt) && builtAt >= notBeforeTime - clockSkewMs;
    const verifyingByExpectedSha = expectedSha.length > 0 && payloadHasKnownSha;
    const buildFresh = verifyingByExpectedSha ? buildMatchesExpected : buildFreshByTime;
    const homeOk = homeResult.response.ok;

    console.log(
      `[verify-deployment] ${args.label} attempt ${attempt}: ` +
        `${formatBuildSummary(buildPayload)} ` +
        `verificationMode=${verifyingByExpectedSha ? 'sha' : 'timestamp'} ` +
        `buildFresh=${buildFresh} ` +
        `buildMatchesExpected=${buildMatchesExpected} ` +
        `homeStatus=${homeResult.response.status}`,
    );

    if (buildFresh && homeOk) {
      console.log(
        `[verify-deployment] ${args.label} is live at ${args.siteUrl} with a fresh build and healthy home page response.`,
      );
      return;
    }

    const buildError =
      buildMetaResult.error ??
      (verifyingByExpectedSha
        ? `build sha ${buildPayload?.sha ?? buildPayload?.shortSha ?? 'unknown'} does not match expected ${expectedSha}`
        : Number.isFinite(builtAt)
          ? `build timestamp ${buildPayload?.builtAt ?? 'unknown'} is older than ${args.notBefore} (allowing ${clockSkewMs}ms skew)`
          : `build timestamp is missing or invalid in ${buildMetaResult.url}`);
    const homeError = homeOk
      ? 'home page is healthy'
      : `home returned ${homeResult.response.status} ${homeResult.response.statusText}`;
    lastFailure = `${buildError}; ${homeError}`;

    if (Date.now() + args.intervalMs > deadline) {
      break;
    }

    await sleep(args.intervalMs);
  }

  throw new Error(
    `[verify-deployment] ${args.label} failed verification for ${args.siteUrl}: ${lastFailure}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
