# Quantum API TypeScript SDK

`@mr.dj2u/quantum-api` is a typed client for browser, Expo, and Node.js apps. It handles API addresses and request headers so you can focus on runtime calls and jobs. The protected-call examples below run in a trusted Node.js environment.

Package version: `0.1.2`

Human guide: `/public-facing/api/quantum/typescript-sdk`

## Install

```bash
npm install "@mr.dj2u/quantum-api"
```

Get the published package on [npm](https://www.npmjs.com/package/@mr.dj2u/quantum-api). It supports ESM and CommonJS. Use a runtime with `fetch`, such as Node.js 18 or later, or supply your own fetch implementation.

## Configure

The published SDK requires `baseUrl` when creating the client. Use the Quantum API address shown below; the SDK adds `/v1` for you.

```ts
import { QuantumApiClient } from "@mr.dj2u/quantum-api";

const client = new QuantumApiClient({
  baseUrl: "https://davidjgrimsley.com/public-facing/api/quantum",
});
```

This client can make public calls such as Health Check. For protected calls in trusted server code, also pass a server-only API key. In a public app, use your backend proxy so the key stays server-side.

## First call

```ts
const health = await client.health();
console.log(health.status, health.runtime_mode);
```

`health` is public. Use it before an authenticated runtime call.

## Run Gate example

```ts
const gate = await client.runGate({
  gate_type: "rotation",
  rotation_angle_rad: Math.PI / 2,
});

console.log(gate.measurement);
```

## Auth

- `health` and `portfolio` are public.
- Runtime methods use `X-API-Key`; pass `apiKey` when creating the client.
- Use a per-call auth override only when that request intentionally needs different credentials.

## IBM profiles and jobs

Use an IBM profile already configured for your API key, or the account default. Choose an available IBM backend, submit a circuit job, then poll its status and fetch the result after success. Submission alone does not mean hardware ran.

IBM hardware jobs have to wait in a queue before starting; get started at [quantum.cloud.ibm.com](https://quantum.cloud.ibm.com/).

```ts
const trustedClient = new QuantumApiClient({
  baseUrl: "https://davidjgrimsley.com/public-facing/api/quantum",
  apiKey: serverSecrets.quantumApiKey,
});

const job = await trustedClient.submitCircuitJob({
  provider: "ibm",
  backend_name: "YOUR_AVAILABLE_IBM_BACKEND",
  ibm_profile: "YOUR_EXISTING_PROFILE",
  shots: 1024,
  circuit: { num_qubits: 1, operations: [{ gate: "h", target: 0 }] },
});
```

Keep API keys and IBM tokens server-side when distributing an application.

## Useful methods

- Core: `health`, `portfolio`, `echoTypes`, `runGate`, `runCircuit`, `transformText`
- Runtime: `listBackends`, `transpile`, `importQasm`, `exportQasm`
- Jobs: `submitCircuitJob`, `getCircuitJob`, `getCircuitJobResult`, `cancelCircuitJob`

## Troubleshooting

Catch `QuantumApiError` and inspect `status`, `code`, `requestId`, and `details`. A 401 on a protected runtime call usually means the supplied API key or backend proxy needs attention.

## Feedback, contributions, comments, and questions

Questions, corrections, and issue reports are welcome.

- Email: [MrDJ@DavidJGrimsley.com](mailto:MrDJ@DavidJGrimsley.com)
- Issues: [github.com/davidjgrimsley/quantum-api/issues](https://github.com/davidjgrimsley/quantum-api/issues)

## Agent version (.md)

This file is the agent-readable Markdown version of the TypeScript SDK guide. For discovery across all public developer docs, start with [`/llms.txt`](/llms.txt).
