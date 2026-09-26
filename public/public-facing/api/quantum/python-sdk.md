# Quantum API Python SDK

`quantum-api-sdk` is a synchronous Python client for scripts, command-line tools, service integrations, and backend automation. It uses `httpx` and returns structured `QuantumApiError` failures.

Package version: `0.1.0`

Human guide: `/public-facing/api/quantum/python-sdk`

## Install

```bash
pip install quantum-api-sdk
```

Get the published package on [PyPI](https://pypi.org/project/quantum-api-sdk/). Python 3.11 or later is required.

## Configure and call Health Check

The published SDK requires `base_url` when creating the client. Use the Quantum API address shown below; the SDK adds `/v1` for you.

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

Use an existing key supplied to a trusted script or backend through the process environment.

```python
import os

with QuantumApiClient(
    base_url="https://davidjgrimsley.com/public-facing/api/quantum",
    api_key=os.environ["QUANTUM_API_KEY"],
) as client:
    gate = client.run_gate({
        "gate_type": "rotation",
        "rotation_angle_rad": 1.57079632679,
    })
    print(gate["measurement"])
```

## Auth

- `auto` is the default: health and portfolio are public; protected runtime methods use your supplied API key.
- `api_key` sends `X-API-Key` for protected runtime calls.
- `none` is for public calls such as health.

## IBM profiles and jobs

Use an existing `ibm_profile` name supplied by the API owner, or the account default. Choose an available backend before submitting a job. Poll its status and fetch the result after success; submission alone does not show that hardware ran.

IBM hardware jobs have to wait in a queue before starting; get started at [quantum.cloud.ibm.com](https://quantum.cloud.ibm.com/).

## Useful methods

- Core: `health`, `portfolio`, `echo_types`, `run_gate`, `run_circuit`, `transform_text`
- Runtime: `list_backends`, `transpile`, `import_qasm`, `export_qasm`, `run_qasm`
- Jobs: `submit_circuit_job`, `submit_qasm_job`, `get_circuit_job`, `get_circuit_job_result`, `cancel_circuit_job`

## Troubleshooting

Catch `QuantumApiError` to preserve the normalized error code, HTTP status, request ID, and details. Store API keys in environment variables or server-side secret storage rather than in a distributed client.

## Feedback, contributions, comments, and questions

Questions, corrections, and issue reports are welcome.

- Email: [MrDJ@DavidJGrimsley.com](mailto:MrDJ@DavidJGrimsley.com)
- Issues: [github.com/davidjgrimsley/quantum-api/issues](https://github.com/davidjgrimsley/quantum-api/issues)

## Agent version (.md)

This file is the agent-readable Markdown version of the Python SDK guide. For discovery across all public developer docs, start with [`/llms.txt`](/llms.txt).
