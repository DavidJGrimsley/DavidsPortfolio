# Quantum API Godot Addon

The Quantum API Godot addon is a Godot 4 runtime client, not editor tooling. It supports health checks, text transforms, gate calls, backend discovery, transpile, and IBM circuit jobs.

Human guide: `/public-facing/api/quantum/godot-addon`

## Install

1. Copy the addon into your project as `addons/quantum_api_client/`.
2. Preload `res://addons/quantum_api_client/quantum_api_client.gd`.
3. Create the client as a child node at runtime.
4. Call `apply_project_settings()` at startup.

## Configure project settings

The base URL is the web address the addon sends requests to. It accepts the mounted Quantum API address with or without `/v1` and normalizes the final request address.

```ini
[quantum_api]
base_url="https://davidjgrimsley.com/public-facing/api/quantum/v1"
backend_proxy_mode=true
direct_api_key=""
default_ibm_profile=""
```

## First call

```gdscript
const QuantumApiClientScript = preload("res://addons/quantum_api_client/quantum_api_client.gd")
var quantum_api_client: QuantumApiClient

func _ready() -> void:
    quantum_api_client = QuantumApiClientScript.new()
    add_child(quantum_api_client)
    quantum_api_client.apply_project_settings()
    quantum_api_client.health_check(func(success: bool, payload: Dictionary) -> void:
        print(success, payload)
    )
```

## Run Gate example

```gdscript
quantum_api_client.run_gate({
    "gate_type": "rotation",
    "rotation_angle_rad": PI / 2.0,
}, func(success: bool, payload: Dictionary) -> void:
    print(success, payload)
)
```

## Auth and IBM

- Keep `backend_proxy_mode=true` for a distributed game; your backend holds the upstream API key.
- Direct API-key mode is for local development, prototypes, and demos.
- `default_ibm_profile` is an optional saved profile name for IBM runtime calls.
- Manage IBM profiles through the Quantum API account site or your backend. The addon consumes an existing profile name and must not contain IBM tokens.
- IBM hardware jobs have to wait in a queue before starting; get started at [quantum.cloud.ibm.com](https://quantum.cloud.ibm.com/).

## Available calls

`health_check`, `transform_text`, `run_gate`, `list_backends`, `transpile`, and `submit_circuit_job`.

## Troubleshooting

Start with `health_check` to distinguish a connection issue from a request issue. Before submitting an IBM job, verify the selected profile and backend availability.

## Feedback, contributions, comments, and questions

Questions, corrections, and issue reports are welcome.

- Email: [MrDJ@DavidJGrimsley.com](mailto:MrDJ@DavidJGrimsley.com)
- Issues: [github.com/davidjgrimsley/quantum-api/issues](https://github.com/davidjgrimsley/quantum-api/issues)

## Agent version (.md)

This file is the agent-readable Markdown version of the Godot Addon guide. For discovery across all public developer docs, start with [`/llms.txt`](/llms.txt).
