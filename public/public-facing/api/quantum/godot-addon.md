# Quantum API Godot Addon

The Quantum API Godot addon is a Godot 4 runtime client with an optional Project Settings helper. It supports health checks, text transforms, gate calls, backend discovery, transpilation, and IBM circuit jobs.

Human guide: `/public-facing/api/quantum/godot-addon`

## Install

Get the full addon from the [Godot Asset Store](https://store.godotengine.org/asset/david-grimsley/quantum-api/) or [Asset Library](https://godotengine.org/asset-library/asset/5008).

1. Install the entire `addons/quantum_api_client/` folder. The runtime script alone omits the optional settings helper.
2. In **Project → Project Settings → Plugins**, enable **Quantum API Client Settings** to expose the fields under **General → Quantum Api**. You can also edit `project.godot` directly.
3. Preload `res://addons/quantum_api_client/quantum_api_client.gd`.
4. Create the client as a child node at runtime and call `apply_project_settings()`.

## Configure project settings

The addon already points to the hosted Quantum API. For a local Health Check, select direct mode; no API address needs to be entered.

```ini
[quantum_api]
backend_proxy_mode=false
direct_api_key=""
default_ibm_profile=""
request_timeout_seconds=10.0
```

This starts with the hosted API for a local Health Check. A protected call needs a developer key supplied at runtime. For a shipped game, switch to backend proxy mode and set `base_url` to your own server, which keeps the upstream key private.

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

For this developer-only direct-mode call, read an existing key from the process environment. Keep `direct_api_key` empty in project files and exported games.

```gdscript
var developer_key := OS.get_environment("QUANTUM_API_KEY")
if developer_key.is_empty():
    push_error("QUANTUM_API_KEY is required for Run Gate")
    return
quantum_api_client.set_api_key(developer_key)
quantum_api_client.run_gate("rotation", func(success: bool, payload: Dictionary) -> void:
    print(success, payload)
, PI / 2.0)
```

## Auth and IBM

- Keep `backend_proxy_mode=true` for a distributed game; your backend holds the upstream API key.
- Direct API-key mode is for a developer-controlled local test. Read a short-lived key from the process environment; never save it in `project.godot` or an exported game.
- `default_ibm_profile` is an optional saved profile name for IBM runtime calls.
- Use an existing IBM profile name for hardware calls. Do not put IBM tokens in an exported game.
- IBM hardware jobs have to wait in a queue before starting; get started at [quantum.cloud.ibm.com](https://quantum.cloud.ibm.com/).

## Available calls

`health_check`, `transform_text`, `run_gate`, `list_backends`, `transpile`, and `submit_circuit_job`. Poll submitted hardware work with `get_circuit_job` and `get_circuit_job_result`.

## Troubleshooting

Start with `health_check` to distinguish a connection issue from a request issue. Before submitting an IBM job, verify the selected profile and backend availability.

## Feedback, contributions, comments, and questions

Questions, corrections, and issue reports are welcome.

- Email: [MrDJ@DavidJGrimsley.com](mailto:MrDJ@DavidJGrimsley.com)
- Issues: [github.com/davidjgrimsley/quantum-api/issues](https://github.com/davidjgrimsley/quantum-api/issues)

## Agent version (.md)

This file is the agent-readable Markdown version of the Godot Addon guide. For discovery across all public developer docs, start with [`/llms.txt`](/llms.txt).
