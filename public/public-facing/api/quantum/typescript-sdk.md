# Quantum API TypeScript SDK

`@mr.dj2u/quantum-api` is a TypeScript client for Node.js applications. It provides named methods for Quantum API runtime calls, account setup, IBM profiles, and jobs.

Package version: `0.1.2`

Human guide: `/public-facing/api/quantum/typescript-sdk`

## Install

```bash
npm install "@mr.dj2u/quantum-api"
```

Use Node.js 18 or later. The package supports ESM and CommonJS consumers.

## Configure

The base URL is the web address the SDK sends requests to. Pass the mounted Quantum API address with or without `/v1`; the SDK normalizes it.

```ts
import { QuantumApiClient } from "@mr.dj2u/quantum-api";

const runtimeApiKey = "<your-runtime-api-key>";
const client = new QuantumApiClient({
  baseUrl: "https://davidjgrimsley.com/public-facing/api/quantum",
  apiKey: runtimeApiKey,
});
```

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
- Key management and IBM profile methods use the signed-in user's bearer token.
- Use a per-call auth override only when that request intentionally needs different credentials.

## IBM profiles and jobs

Use bearer-authenticated profile methods to create and verify an IBM profile. Submit a circuit, QASM, or random job using that saved profile name.

IBM hardware jobs have to wait in a queue before starting; get started at [quantum.cloud.ibm.com](https://quantum.cloud.ibm.com/).

```ts
const job = await client.submitCircuitJob({
  provider: "ibm",
  backend_name: "ibm_brisbane",
  ibm_profile: "my-profile",
  shots: 1024,
  circuit: { num_qubits: 1, operations: [{ gate: "h", target: 0 }] },
});
```

Keep API keys and IBM tokens server-side when distributing an application.

## Useful methods

- Core: `health`, `portfolio`, `echoTypes`, `runGate`, `runCircuit`, `transformText`
- Runtime: `listBackends`, `transpile`, `importQasm`, `exportQasm`, `runQasm`
- Accounts: `listKeys`, `createKey`, `revokeKey`, `rotateKey`, `deleteKey`
- IBM: `listIbmProfiles`, `createIbmProfile`, `updateIbmProfile`, `verifyIbmProfile`, `deleteIbmProfile`
- Jobs: `submitCircuitJob`, `submitQasmJob`, `submitRandomJob`, `getCircuitJob`, `getCircuitJobResult`, `cancelCircuitJob`

## Troubleshooting

Catch `QuantumApiError` and inspect `statusCode`, `code`, `requestId`, and `details`. A 401 on a runtime call usually means the API key is absent or invalid; a 401 on a profile or key-management call usually means the bearer token is absent or invalid.

## Feedback, contributions, comments, and questions

Questions, corrections, and issue reports are welcome.

- Email: [MrDJ@DavidJGrimsley.com](mailto:MrDJ@DavidJGrimsley.com)
- Issues: [github.com/davidjgrimsley/quantum-api/issues](https://github.com/davidjgrimsley/quantum-api/issues)

## Agent version (.md)

This file is the agent-readable Markdown version of the TypeScript SDK guide. For discovery across all public developer docs, start with [`/llms.txt`](/llms.txt).
