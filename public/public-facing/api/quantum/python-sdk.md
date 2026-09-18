# Quantum API Python SDK

`quantum-api-sdk` is a synchronous Python client for scripts, command-line tools, service integrations, and backend automation. It uses `httpx` and returns structured `QuantumApiError` failures.

Package version: `0.1.0`

Human guide: `/public-facing/api/quantum/python-sdk`

## Install

```bash
pip install quantum-api-sdk
```

Python 3.11 or later is required.

## Configure and call Health Check

The base URL is the web address the client sends requests to. Pass the mounted Quantum API address with or without `/v1`; the SDK normalizes it.

```python
from quantum_api_sdk import QuantumApiClient, QuantumApiError

with QuantumApiClient(
    base_url="https://davidjgrimsley.com/public-facing/api/quantum"
) as client:
    try:
        health = client.health()
        print(health["status"])
    except QuantumApiError as error:
        print(error.status_code, error.code, error.request_id)
```

## Run Gate example

```python
with QuantumApiClient(
    base_url="https://davidjgrimsley.com/public-facing/api/quantum",
    api_key="your-runtime-api-key",
) as client:
    gate = client.run_gate({
        "gate_type": "rotation",
        "rotation_angle_rad": 1.57079632679,
    })
    print(gate["measurement"])
```

## Auth

- `auto` is the default: health and portfolio are public, key/profile routes use bearer auth, and runtime routes use an API key.
- `api_key` sends `X-API-Key` for protected runtime calls.
- `bearer` sends the signed-in user's token for API-key and IBM-profile management.
- `none` is for public calls such as health.

## IBM profiles and jobs

Create and verify IBM profiles with a bearer token, then pass the saved `ibm_profile` name in backend, transpile, and job requests. Keep IBM profile management and credentials on your backend for a distributed product.

IBM hardware jobs have to wait in a queue before starting; get started at [quantum.cloud.ibm.com](https://quantum.cloud.ibm.com/).

## Useful methods

- Core: `health`, `portfolio`, `echo_types`, `run_gate`, `run_circuit`, `transform_text`
- Runtime: `list_backends`, `transpile`, `import_qasm`, `export_qasm`, `run_qasm`
- Accounts: `list_keys`, `create_key`, `revoke_key`, `rotate_key`, `delete_key`
- IBM: `list_ibm_profiles`, `create_ibm_profile`, `update_ibm_profile`, `verify_ibm_profile`, `delete_ibm_profile`
- Jobs: `submit_circuit_job`, `submit_qasm_job`, `submit_random_job`, `get_circuit_job`, `get_circuit_job_result`, `cancel_circuit_job`

## Troubleshooting

Catch `QuantumApiError` to preserve the normalized error code, HTTP status, request ID, and details. Store API keys in environment variables or server-side secret storage rather than in a distributed client.

## Feedback, contributions, comments, and questions

Questions, corrections, and issue reports are welcome.

- Email: [DavidJGrimsley@gmail.com](mailto:DavidJGrimsley@gmail.com)
- Issues: [github.com/davidjgrimsley/quantum-api/issues](https://github.com/davidjgrimsley/quantum-api/issues)

## Agent version (.md)

This file is the agent-readable Markdown version of the Python SDK guide. For discovery across all public developer docs, start with [`/llms.txt`](/llms.txt).
