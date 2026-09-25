# Quantum API Unreal Plugin

`QuantumApi` is a UE 5.8 Win64 Runtime plugin for the Quantum API `/v1` contract. It gives Blueprints asynchronous nodes for simulations, random helpers, QASM tools, and IBM hardware jobs. UEFN is unsupported.

Plugin version: `0.3.0-beta`

Human guide: `/public-facing/api/quantum/ue-plugin`

## What this plugin is

Copy the project plugin into an Unreal project, enable it, configure authentication, then call Blueprint async actions. Start with `Health Check`, then `Run Gate` and `Generate Random Int` before trying circuits or IBM jobs.

- White execution pins decide when a request starts.
- Request pins are the values you fill in before sending a request.
- `Options` is an optional per-call auth or proxy override. Leave it empty for normal project settings.
- `On Success` returns a response and `On Error` returns a safe `FQuantumApiError`.

## Install

Download and extract the [UE 5.8 Win64 beta release](https://github.com/DavidJGrimsley/quantum-api/releases/tag/quantumapi-unreal-v0.3.0-beta-ue5.8).

1. Copy the extracted `QuantumApi` folder to `<YourProject>/Plugins/QuantumApi`.
2. Open the project and enable **Quantum API** in the Plugin Browser if Unreal asks. Build only if Unreal says compilation is needed.
3. Open **Project Settings → Quantum API** and choose an authentication mode.

## Configure

In **Project Settings → Quantum API**, choose **Direct API Key** for a local test using an existing key. Direct mode always calls the hosted Quantum API address. For a shipped game, choose **Backend Proxy** and enter your own **Backend Proxy URL**. That server must expose the compatible API and keep the upstream key private. A blank proxy URL fails before a request is sent. There is no editable direct-mode Base URL.

## First Blueprint call: Health Check

Use `Health Check` first. It confirms that the service is reachable and needs no request body.

- `Options`: leave empty unless testing a one-off bearer token, API key, or custom proxy header.
- `On Success`: read `status`, `service`, `version`, `runtime_mode`, and `qiskit_available`.
- `On Error`: route `FQuantumApiError` to UI or logs without freezing gameplay.

## Run Gate example

For a first `Run Gate` rotation:

- `GateType`: `rotation`
- `bSendRotationAngle`: `true`
- `RotationAngleRad`: `1.57079632679` (`PI / 2`)

Read `Measurement` on success. It is usually `0` or `1`.

## Generate Random Int example

`Generate Random Int` sends `POST /v1/random` with inclusive signed 32-bit bounds.

- `Min`: `0`
- `Max`: `1`

Read `Value` and `Source`. `Source` may be `qiskit-simulator` or `classical-fallback`; neither is a cryptographic-randomness guarantee.

## Run Circuit explained pin-by-pin

“What does ‘array of Quantum Api Circuit Operation’ mean?”

It means a list of gate steps. A struct is a bundle of fields. An array is a list. A `Quantum Api Circuit Operation` is one instruction, such as applying an `h` gate to qubit `0`.

`Run Circuit` says: create this many qubits, run this ordered list of gates, then sample the circuit this many times.

- `Request Circuit Num Qubits`: the number of qubits, or wires. Start with `1`.
- `Request Circuit Operations`: the ordered list of gate steps. Start with one operation: `Gate = h`, `Target = 0`.
- `Request Shots`: samples to take. Start with `1024`.
- `Request Include Statevector`: advanced simulator output. Leave unchecked at first.
- `Request Send Seed`: sends a deterministic simulator seed. Leave unchecked at first.
- `Request Seed`: only matters when `Request Send Seed` is checked.
- `Options`: optional auth or proxy overrides. Leave empty for normal project settings.

Each operation has:

- `Gate`: for example `h`, `x`, `rx`, `ry`, `rz`, or `cx`.
- `Target`: the qubit index the gate acts on. The first qubit is `0`.
- `Theta`: used with rotation gates such as `rx`, `ry`, and `rz`.
- `Control`: used with controlled gates such as `cx`.

Tiny first circuit:

- `Num Qubits`: `1`
- `Operations`: one operation with `Gate = h` and `Target = 0`
- `Shots`: `1024`
- `Include Statevector`: unchecked
- `Send Seed`: unchecked

## IBM hardware jobs

The plugin submits jobs by IBM profile name. IBM tokens and instances stay on the Quantum API service, not inside the game. You can set **Default IBM Hardware Backend** in Project Settings; an explicit backend on a request takes priority.

1. Set **Default IBM Profile Name** in Project Settings, or use the request's `IbmProfile`.
2. Use `List Backends` with `Provider = ibm` to choose a backend.
3. Submit `Submit Random Job`, `Submit Circuit Job`, or `Submit QASM Job`.
4. Poll `Get Job Status`, then read `Get Job Result` or call `Cancel Job`.

IBM hardware jobs have to wait in a queue before starting; get started at [quantum.cloud.ibm.com](https://quantum.cloud.ibm.com/). Hardware availability, account access, queue time, and usage limits apply.

## Auth modes: Direct API Key vs Backend Proxy

`Backend Proxy`:

- Recommended for shipped games.
- Your backend keeps the upstream API key server-side.
- The plugin can send bearer or custom headers when your proxy needs them.

`Direct API Key (Development Only)`:

- For local development, demos, and game jams.
- Sends `X-API-Key` from Project Settings or a request's `Options`. The Project Settings field is masked, but project files do not keep it secret.
- Do not ship a client with a real upstream key.

## All Blueprint nodes

Typed success payloads:

- `Health Check`
- `Run Gate`
- `Transform Text`
- `Generate Random Int`

Named JSON-result async actions:

- `Get Echo Types`
- `Run Circuit`
- `List Backends`
- `Transpile`
- `Import QASM`
- `Export QASM`
- `Run QASM`
- `Submit Circuit Job`
- `Submit QASM Job`
- `Submit Random Job`
- `Get Job Status`
- `Get Job Result`
- `Cancel Job`

Advanced operations through one `Call Advanced JSON` node (these are allowlisted request types, not separate nodes):

- `Grover Search`, `Amplitude Estimation`, `Phase Estimation`, `Time Evolution`
- `QAOA`, `VQE`, `MaxCut`, `Knapsack`, `Traveling Salesperson`
- `State Tomography`, `Randomized Benchmarking`, `Quantum Volume`, `T1`, `T2 Ramsey`
- `Portfolio Optimization`, `Portfolio Diversification`
- `Kernel Classifier`, `VQC Classifier`, `QSVR Regressor`
- `Ground State Energy`, `Fermionic Mapping Preview`

## Troubleshooting

- Run `Health Check` first when a node errors immediately. In proxy mode, confirm the Backend Proxy URL is set and reachable.
- If `Run Circuit` feels confusing, use `Run Gate`, then `Generate Random Int`, then return to one `h` operation targeting qubit `0`.
- If IBM hardware does not run, check the profile name, backend availability, account access, queue time, and service-side IBM configuration.
- GET health, backend, and job reads retry limited transient failures. POSTs and cancellation do not retry automatically.

## Feedback, contributions, comments, and questions

Questions, corrections, and issue reports are welcome.

- Email: [MrDJ@DavidJGrimsley.com](mailto:MrDJ@DavidJGrimsley.com)
- Issues: [github.com/davidjgrimsley/quantum-api/issues](https://github.com/davidjgrimsley/quantum-api/issues)

## Agent version (.md)

This file is the agent-readable Markdown version of the Unreal Plugin guide. For discovery across all public developer docs, start with [`/llms.txt`](/llms.txt).
