# Quantum API Unity Package

The Quantum API Unity package is a Unity 2021.3+ runtime helper for gameplay code. It uses `UnityWebRequest` behind coroutine and Task entry points, with structured API errors.

Package version: `0.1.0`

Human guide: `/public-facing/api/quantum/unity-package`

## Install

1. Copy `sdk/unity` into your Unity project's `Packages` directory, or add it by local path in Unity Package Manager.
2. Create `QuantumApiClient` with the Quantum API address.
3. Keep `BackendProxyMode = true` for a distributed build.

## Configure

The base URL is the web address the package sends requests to. It accepts the mounted Quantum API address with or without `/v1` and normalizes it before sending requests.

```csharp
using QuantumApi.Unity;

var client = new QuantumApiClient(new QuantumApiClientOptions
{
    BaseUrl = "https://davidjgrimsley.com/public-facing/api/quantum",
    BackendProxyMode = true,
    TimeoutSeconds = 15,
});
```

## First call

```csharp
private async void Start()
{
    var health = await client.HealthAsync();
    Debug.Log($"Quantum API status: {health.status}");
}
```

## Run Gate example

```csharp
StartCoroutine(client.RunGateCoroutine(
    new GateRunRequest
    {
        gate_type = "rotation",
        rotation_angle_rad = Mathf.PI / 2f,
    },
    response => Debug.Log($"Measurement: {response.measurement}"),
    error => Debug.LogWarning(error.Message)
));
```

## Auth and IBM

- Backend proxy mode is the default for shipped builds. Your backend holds the upstream API key.
- Direct API-key mode is for local development, demos, and prototypes. Protected runtime calls send `X-API-Key`.
- The package currently wraps gameplay endpoints. Manage IBM profiles through your backend, then submit work with the selected profile name.
- IBM hardware jobs have to wait in a queue before starting; get started at [quantum.cloud.ibm.com](https://quantum.cloud.ibm.com/).
- Do not put an API key or IBM token in a distributed Unity build.

## Available calls

- `GET /v1/health`
- `GET /v1/echo-types`
- `POST /v1/gates/run`
- `POST /v1/text/transform`

## Troubleshooting

Call `HealthAsync` first to confirm the API address is reachable. Smoke-test the package inside a Unity project before relying on it in a release.

## Feedback, contributions, comments, and questions

Questions, corrections, and issue reports are welcome.

- Email: [DavidJGrimsley@gmail.com](mailto:DavidJGrimsley@gmail.com)
- Issues: [github.com/davidjgrimsley/quantum-api/issues](https://github.com/davidjgrimsley/quantum-api/issues)

## Agent version (.md)

This file is the agent-readable Markdown version of the Unity Package guide. For discovery across all public developer docs, start with [`/llms.txt`](/llms.txt).
