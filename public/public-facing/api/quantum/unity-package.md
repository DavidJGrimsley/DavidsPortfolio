# Quantum API Unity Package

The Quantum API Unity package is a Unity 2021.3+ gameplay helper. Add `QuantumApiManager` to a scene, configure the connection in the Inspector, then use its shared client for coroutine or Task calls.

Package version: `1.1.0`

Human guide: `/public-facing/api/quantum/unity-package`

## Install

Download and extract the [Unity v1.1.0 package archive](https://github.com/DavidJGrimsley/quantum-api/releases/tag/quantumapi-unity-v1.1.0).

1. In Unity Package Manager, choose **Add package from disk** and select `com.quantumapi.runtime/package.json` from the extracted archive. For repository source, select `sdk/unity/package.json` instead.
2. Add `QuantumApiManager` to one GameObject in your first scene. Set its connection fields before Play Mode.
3. In Play Mode, use the manager's **Check Health** context-menu action and read Unity's Console.

## Configure

In the manager Inspector, choose **Direct API Key** and enter an existing key for a local test. Direct mode uses the hosted Quantum API address. For a distributed game, enable **Backend Proxy Mode** and enter your own proxy URL. That server must expose the compatible API and hold the upstream key.

The Inspector masks the key, but a key saved in a scene or distributed build can be extracted. Leave it empty in committed scenes.

## First call

```csharp
using QuantumApi.Unity;
using UnityEngine;

public class QuantumApiFirstCall : MonoBehaviour
{
    private async void Start()
    {
        var client = QuantumApiManager.Instance.Client;
        var health = await client.HealthAsync();
        Debug.Log($"Quantum API status: {health.status}");
    }
}
```

Health Check is public. A healthy response confirms connectivity; it does not confirm that a protected call or IBM hardware is ready.

## Run Gate example

Use this inside a MonoBehaviour method after the manager is active.

```csharp
StartCoroutine(QuantumApiManager.Instance.Client.RunGateCoroutine(
    new GateRunRequest
    {
        gate_type = "rotation",
        sendRotationAngle = true,
        rotation_angle_rad = Mathf.PI / 2f,
    },
    response => Debug.Log($"Measurement: {response.measurement}"),
    error => Debug.LogWarning(error.Message)
));
```

## Generate a local random integer

Use this inside an async method in the same scene.

```csharp
var random = await QuantumApiManager.Instance.Client.RandomIntAsync(0, 1);
Debug.Log($"Coin flip: {random.value} ({random.source})");
```

Both bounds are included. The result comes from the local simulator or a classical fallback. It is neither an IBM hardware job nor a cryptographic randomness guarantee.

## Auth and IBM

- Backend proxy mode is for shipped builds. The client sends no API key or bearer header; your backend holds the upstream key.
- Direct API-key mode is for local development and demos. Protected calls send `X-API-Key` to the hosted API.
- Use an existing IBM profile name and available backend, or set their defaults on `QuantumApiManager`.
- IBM hardware jobs have to wait in a queue before starting; get started at [quantum.cloud.ibm.com](https://quantum.cloud.ibm.com/).
- Do not put an API key or IBM token in a distributed Unity build.

For an IBM random hardware job, call `SubmitRandomJobAsync` with `provider = "ibm"`, an available `backend_name`, and an existing `ibm_profile`. Keep the returned `job_id`, poll `GetJobAsync`, then call `GetJobResultAsync` after status becomes `succeeded`. Handle `failed` and `cancelled` states without fetching a result.

## Available calls

- `HealthAsync`, `GetEchoTypesAsync`, `RunGateAsync`, `TransformTextAsync`
- `RandomIntAsync` for simulator or fallback integers
- `SubmitRandomJobAsync`, `GetJobAsync`, `GetJobResultAsync`, `CancelJobAsync` for IBM job flows

## Troubleshooting

Use the manager's **Check Health** action in Play Mode and read Unity's Console before debugging a protected call. If it fails, check the selected auth mode, key or proxy URL, and whether the proxy provides upstream authentication. IBM jobs may queue; keep gameplay responsive while polling.

## Feedback, contributions, comments, and questions

Questions, corrections, and issue reports are welcome.

- Email: [MrDJ@DavidJGrimsley.com](mailto:MrDJ@DavidJGrimsley.com)
- Issues: [github.com/davidjgrimsley/quantum-api/issues](https://github.com/davidjgrimsley/quantum-api/issues)

## Agent version (.md)

This file is the agent-readable Markdown version of the Unity Package guide. For discovery across all public developer docs, start with [`/llms.txt`](/llms.txt).
