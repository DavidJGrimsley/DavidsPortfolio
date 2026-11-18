const crypto = require('node:crypto');

class SimulatorError extends Error {
  constructor(code, message, { isUncertain = false, isDefinitive = false } = {}) {
    super(message);
    this.name = 'SimulatorError';
    this.code = code;
    this.isUncertain = isUncertain;
    this.isDefinitive = isDefinitive;
  }
}

function previewConnection(remoteConfig) {
  try {
    const url = new URL(remoteConfig?.previewApiUrl);
    if (url.protocol !== 'https:' || url.username || url.password) return {};
    const token = remoteConfig.webPreviewToken || url.searchParams.get('token');
    url.search = '';
    url.hash = '';
    return { previewApiUrl: url.toString().replace(/\/$/, ''), webPreviewToken: token || null };
  } catch { return {}; }
}

/**
 * Base contract for simulator preview providers.
 * All providers (real EAS, simulated fallback, test fakes) implement this interface.
 */
class BaseSimulatorProvider {
  constructor(name = 'base') {
    this.name = name;
    this.hasDeterministicExpiry = false;
  }

  async isAvailable() {
    return { available: false, reason: 'not_implemented' };
  }

  /**
   * @param {Object} options
   * @param {string} options.platform 'android'
   * @param {string} options.projectId 'pet-show-and-tell'
   * @param {number} options.maxDurationMinutes Max session duration in minutes (1-60)
   * @param {string} [options.frameAncestor] Allowed embedding origin for CSP frame-ancestors
   * @returns {Promise<{ providerSessionId: string, webPreviewUrl: string, expiresAt?: string }>}
   */
  async startSession(_options) {
    throw new SimulatorError('not_implemented', 'startSession is not implemented');
  }

  /**
   * @param {string} _providerSessionId
   * @returns {Promise<{ ok: boolean, reason?: string, stopped?: boolean, isAuthoritative?: boolean }>}
   */
  async stopSession(_providerSessionId) {
    return { ok: true };
  }

  /**
   * @param {string} _providerSessionId
   * @returns {Promise<{ running: boolean, status?: string, previewApiUrl?: string, webPreviewToken?: string, webPreviewUrl?: string, ended?: boolean, absent?: boolean, unknown?: boolean } | null>}
   */
  async inspectSession(_providerSessionId) {
    return null;
  }
}

/**
 * Real Expo EAS Simulator provider — DISABLED BY DEFAULT.
 * Never calls paid/live EAS CLI or endpoints without explicit operator authorization.
 */
class DisabledEasSimulatorProvider extends BaseSimulatorProvider {
  constructor({ enabled = false, expoToken = null, projectId = null, easCliPath = 'eas' } = {}) {
    super('eas');
    this.enabled = Boolean(enabled && expoToken);
    this.expoToken = expoToken;
    this.projectId = projectId;
    this.easCliPath = easCliPath;
    this.hasDeterministicExpiry = false;
  }

  async isAvailable() {
    if (!this.enabled) {
      return {
        available: false,
        reason: 'provider_disabled',
        message:
          'EAS Android Simulator is disabled by default. Live previews require an authenticated Expo account, ' +
          'project linkage, build profile with simulator support, and explicit operator enablement.',
        docs: 'https://docs.expo.dev/eas/simulators/reference/rest-api/',
      };
    }
    return { available: false, reason: 'unverified_credentials' };
  }

  async startSession() {
    throw new SimulatorError(
      'provider_disabled',
      'Live EAS Simulator execution is disabled. No live simulator or account linkage is authorized.',
      { isDefinitive: true }
    );
  }

  async stopSession() {
    return { ok: false, reason: 'provider_disabled', isDefinitive: true };
  }

  async inspectSession() {
    return { running: false, status: 'absent', absent: true };
  }
}

/**
 * Real Expo REST API provider for remote Android cloud emulator sessions.
 * Communicates with https://api.expo.dev/v2/device-run-sessions using Bearer EXPO_TOKEN.
 *
 * Implements:
 * - Server-side hardcoding/allowlisting of project (00ff11f9-a771-44bb-a352-ba497bfea0c7 / pet-show-and-tell)
 * - Server-side hardcoding/allowlisting of artifact (buildId or applicationArchiveUrl)
 * - Strict 5-minute absolute duration cap
 * - Explicit operator-configured exact origin for corsOrigins and frameAncestors (no wildcard '*')
 * - Asynchronous session creation handling (queued/starting -> in-progress)
 * - Fail-closed error handling with no blind retry on ambiguous create
 * - Bearer token isolation: preview token returned only in authenticated JSON payloads to session owner
 */
class ExpoRestSimulatorProvider extends BaseSimulatorProvider {
  constructor({
    enabled = false,
    expoToken = null,
    projectId = '00ff11f9-a771-44bb-a352-ba497bfea0c7',
    buildId = null,
    applicationArchiveUrl = null,
    allowedOrigin = null,
    apiBaseUrl = 'https://api.expo.dev',
    fetchImpl = null,
  } = {}) {
    super('eas');
    this.enabled = Boolean(enabled && expoToken);
    this.expoToken = expoToken;
    this.projectId = projectId;
    this.buildId = buildId;
    this.applicationArchiveUrl = applicationArchiveUrl;
    this.allowedOrigin = allowedOrigin;
    this.apiBaseUrl = fetchImpl ? apiBaseUrl : 'https://api.expo.dev';
    this.fetch = fetchImpl || globalThis.fetch;
    this.hasDeterministicExpiry = false;
  }

  async isAvailable() {
    if (!this.enabled || !this.expoToken) {
      return {
        available: false,
        reason: 'provider_disabled',
        message:
          'EAS Android Simulator is disabled. Live previews require an authenticated EXPO_TOKEN, ' +
          'project linkage, build profile with simulator support, and explicit operator authorization.',
        docs: 'https://docs.expo.dev/eas/simulators/reference/rest-api/',
      };
    }
    let origin;
    try { origin = new URL(this.allowedOrigin); } catch { return { available: false, reason: 'invalid_origin' }; }
    if (origin.origin !== this.allowedOrigin || !['https:', 'http:'].includes(origin.protocol) ||
        (origin.protocol === 'http:' && !['localhost', '127.0.0.1'].includes(origin.hostname))) {
      return { available: false, reason: 'invalid_origin' };
    }
    if (Boolean(this.buildId) === Boolean(this.applicationArchiveUrl)) {
      return { available: false, reason: 'missing_or_ambiguous_android_artifact' };
    }
    if (this.applicationArchiveUrl) {
      try { if (new URL(this.applicationArchiveUrl).protocol !== 'https:') throw new Error(); }
      catch { return { available: false, reason: 'invalid_android_artifact' }; }
    }
    return {
      available: true,
      provider: 'eas',
      projectId: this.projectId,
      allowedOrigin: this.allowedOrigin,
    };
  }

  async startSession({
    platform = 'android',
    projectId = 'pet-show-and-tell',
    maxDurationMinutes = 5,
    frameAncestor = null,
  } = {}) {
    if (!(await this.isAvailable()).available) {
      throw new SimulatorError(
        'provider_disabled',
        'Live EAS Simulator execution is disabled. No live simulator or account linkage is authorized.',
        { isDefinitive: true }
      );
    }

    if (platform !== 'android') {
      throw new SimulatorError('invalid_platform', 'Only Android platform is supported by this provider.', {
        isDefinitive: true,
      });
    }

    // Server-side allowlist project ID / slug
    const allowedProjects = [this.projectId, 'pet-show-and-tell', '00ff11f9-a771-44bb-a352-ba497bfea0c7'];
    if (!allowedProjects.includes(projectId)) {
      throw new SimulatorError('invalid_project', `Project "${projectId}" is not allowlisted for preview sessions.`, {
        isDefinitive: true,
      });
    }

    // Strict 5-minute absolute cap
    const clampedMinutes = Math.min(5, Math.max(1, Math.floor(Number(maxDurationMinutes) || 5)));

    // Use explicit operator-configured exact origin, never wildcard '*'
    const originToUse = this.allowedOrigin;
    const corsOrigins = [originToUse];
    const frameAncestors = [originToUse];

    const requestBody = {
      appId: this.projectId,
      platform: 'android',
      type: 'agent-device',
      name: 'pet-show-and-tell-preview',
      maxDurationMinutes: clampedMinutes,
      corsOrigins,
      frameAncestors,
    };

    if (this.buildId) {
      requestBody.buildId = this.buildId;
    } else if (this.applicationArchiveUrl) {
      requestBody.applicationArchiveUrl = this.applicationArchiveUrl;
    }

    let res;
    try {
      res = await this.fetch(`${this.apiBaseUrl}/v2/device-run-sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.expoToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
    } catch {
      // Ambiguous create: network error or timeout. Must NOT blindly retry!
      throw new SimulatorError('uncertain_start', 'Failed to reach Expo API during session start. Ambiguous create.', {
        isUncertain: true,
        isDefinitive: false,
      });
    }

    if (!res.ok) {
      const isDefinitive = res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404;
      const code = res.status === 401 || res.status === 403 ? 'provider_unauthorized' : 'provider_error';
      throw new SimulatorError(code, `Expo API returned HTTP ${res.status}`, {
        isDefinitive,
        isUncertain: !isDefinitive,
      });
    }

    let json;
    try {
      json = await res.json();
    } catch {
      throw new SimulatorError('malformed_provider_response', 'Non-JSON response from Expo API.', {
        isUncertain: true,
        isDefinitive: false,
      });
    }

    const sessionData = json?.data || json;
    if (!sessionData || !sessionData.id || typeof sessionData.id !== 'string') {
      throw new SimulatorError('malformed_provider_response', 'Malformed session object returned from Expo API.', {
        isUncertain: true,
        isDefinitive: false,
      });
    }

    const providerSessionId = sessionData.id;
    const remoteConfig = sessionData.remoteConfig || {};
    const webPreviewUrl = null;
    const { webPreviewToken, previewApiUrl } = previewConnection(remoteConfig);
    const status = sessionData.status || 'starting';
    const expiresAt = sessionData.expiresAt || new Date(Date.now() + clampedMinutes * 60_000).toISOString();

    return {
      providerSessionId,
      webPreviewUrl,
      previewApiUrl,
      webPreviewToken,
      expiresAt,
      status,
      // Resolve connection details through an owner-authenticated status request.
      pending: true,
    };
  }

  async stopSession(providerSessionId) {
    if (!this.enabled || !providerSessionId) {
      return { ok: false, reason: 'provider_disabled' };
    }

    try {
      const res = await this.fetch(
        `${this.apiBaseUrl}/v2/device-run-sessions/${encodeURIComponent(providerSessionId)}/stop`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.expoToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      if (res.ok) {
        const json = await res.json();
        const data = json?.data || json;
        if (data?.id === providerSessionId && ['stopped', 'errored'].includes(data.status))
          return { ok: true, stopped: true, isAuthoritative: true };
      }
      return { ok: false, reason: `stop_returned_http_${res.status}` };
    } catch {
      return { ok: false, reason: 'stop_network_error' };
    }
  }

  async inspectSession(providerSessionId) {
    if (!this.enabled || !providerSessionId) {
      return { unknown: true };
    }

    try {
      const res = await this.fetch(
        `${this.apiBaseUrl}/v2/device-run-sessions/${encodeURIComponent(providerSessionId)}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.expoToken}`,
            Accept: 'application/json',
          },
        }
      );

      if (!res.ok) {
        return { unknown: true };
      }

      const json = await res.json();
      const sessionData = json?.data || json;
      if (!sessionData || sessionData.id !== providerSessionId) return { unknown: true };

      const status = sessionData.status;
      if (status === 'in-progress') {
        const remoteConfig = sessionData.remoteConfig || {};
        return {
          running: true,
          status: 'active',
          ...previewConnection(remoteConfig),
          webPreviewUrl: null,
          expiresAt: sessionData.expiresAt,
        };
      }
      if (['stopped', 'errored'].includes(status)) {
        return {
          running: false,
          status: status === 'error' ? 'failed' : status,
          ended: true,
        };
      }
      if (['new', 'queued', 'starting'].includes(status)) {
        return {
          running: true,
          status: 'starting',
          pending: true,
        };
      }
      return { unknown: true };
    } catch {
      return { unknown: true };
    }
  }
}

/**
 * Labeled simulated fallback provider.
 * Implements full session lifecycle without contacting external services or incurring costs.
 * Emits labeled preview payloads explicitly marked as SIMULATED FALLBACK.
 */
class SimulatedSimulatorProvider extends BaseSimulatorProvider {
  constructor({ simulatedPreviewBase = '/iSquared/simulator/preview' } = {}) {
    super('simulated');
    this.simulatedPreviewBase = simulatedPreviewBase;
    this.activeSimulatedSessions = new Map();
    this.hasDeterministicExpiry = true;
  }

  async isAvailable() {
    return {
      available: true,
      simulated: true,
      label: 'Simulated Fallback Provider (No Paid EAS Infrastructure Required)',
    };
  }

  async startSession({ platform = 'android', projectId = 'pet-show-and-tell', maxDurationMinutes = 5, frameAncestor = '*' } = {}) {
    const providerSessionId = `sim_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + maxDurationMinutes * 60_000).toISOString();

    const webPreviewUrl = `${this.simulatedPreviewBase}?session=${encodeURIComponent(providerSessionId)}&platform=${encodeURIComponent(platform)}&project=${encodeURIComponent(projectId)}&simulated=true&ancestor=${encodeURIComponent(frameAncestor)}`;

    this.activeSimulatedSessions.set(providerSessionId, {
      providerSessionId,
      platform,
      projectId,
      createdAt: new Date().toISOString(),
      expiresAt,
      stopped: false,
    });

    return {
      providerSessionId,
      webPreviewUrl,
      expiresAt,
      simulated: true,
    };
  }

  async stopSession(providerSessionId) {
    const session = this.activeSimulatedSessions.get(providerSessionId);
    if (session) {
      session.stopped = true;
      session.endedAt = new Date().toISOString();
      const elapsed = Math.max(1, Math.round((Date.now() - Date.parse(session.createdAt)) / 1000));
      session.usedSeconds = elapsed;
    }
    return { ok: true, stopped: true, isAuthoritative: true, usedSeconds: session?.usedSeconds };
  }

  async inspectSession(providerSessionId) {
    const session = this.activeSimulatedSessions.get(providerSessionId);
    if (!session) {
      return { running: false, status: 'not_found', absent: true, simulated: true };
    }
    if (session.stopped) {
      return { running: false, status: 'stopped', ended: true, simulated: true, usedSeconds: session.usedSeconds };
    }
    if (Date.parse(session.expiresAt) <= Date.now()) {
      session.stopped = true;
      return { running: false, status: 'expired', ended: true, simulated: true };
    }
    return { running: true, status: 'active', simulated: true, expiresAt: session.expiresAt };
  }
}

/**
 * Creates the provider matching the application configuration.
 */
function createSimulatorProvider(config = {}) {
  const providerType = String(
    config.provider || config.simulator?.provider || 'disabled'
  ).toLowerCase();

  if (providerType === 'simulated') {
    return new SimulatedSimulatorProvider();
  }
  if (providerType === 'eas' || providerType === 'expo-rest') {
    const expoToken = config.expoToken || process.env.EXPO_TOKEN || null;
    return new ExpoRestSimulatorProvider({
      enabled: Boolean(expoToken),
      expoToken,
      projectId:
        config.simulator?.projectId ||
        process.env.EXPO_PROJECT_ID ||
        '00ff11f9-a771-44bb-a352-ba497bfea0c7',
      buildId: config.simulator?.buildId || process.env.EXPO_BUILD_ID || null,
      applicationArchiveUrl:
        config.simulator?.applicationArchiveUrl ||
        process.env.EXPO_APPLICATION_ARCHIVE_URL ||
        null,
      allowedOrigin:
        config.simulator?.allowedOrigin ||
        (Array.isArray(config.simulator?.allowedOrigins) && config.simulator?.allowedOrigins[0]) ||
        config.siteOrigin ||
        process.env.ISQUARED_SIMULATOR_ALLOWED_ORIGIN || null,
      fetchImpl: config.fetchImpl || null,
    });
  }
  return new DisabledEasSimulatorProvider({
    enabled: false,
  });
}

module.exports = {
  BaseSimulatorProvider,
  DisabledEasSimulatorProvider,
  ExpoRestSimulatorProvider,
  SimulatedSimulatorProvider,
  SimulatorError,
  createSimulatorProvider,
};
