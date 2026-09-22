# Quantum API

This is the agent-readable entry point for the Quantum API. Use the live OpenAPI document for exact current request and response schemas rather than guessing endpoint fields.

Human page: `/public-facing/api/quantum`

Live OpenAPI: `/public-facing/api/quantum/openapi.json`

Live endpoint directory: `/public-facing/api/quantum/v1/portfolio.json`

## Base URL

The base URL is the web address an application sends API requests to:

`https://davidjgrimsley.com/public-facing/api/quantum/v1`

SDKs and engine integrations accept the mounted address with or without `/v1` and normalize it. For direct HTTP calls, use the full base URL above.

## Authentication

- `GET /v1/health` and `GET /v1/portfolio.json` are public.
- Most protected runtime endpoints require `X-API-Key: <quantum-api-key>`.
- `/v1/keys*` and `/v1/ibm/profiles*` require `Authorization: Bearer <signed-in-user-token>`.
- Keep runtime API keys and IBM tokens server-side for distributed applications and games.

## First calls

Health check:

```bash
curl https://davidjgrimsley.com/public-facing/api/quantum/v1/health
```

Gate run with an API key:

```bash
curl -X POST https://davidjgrimsley.com/public-facing/api/quantum/v1/gates/run \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $QUANTUM_API_KEY" \
  -d '{"gate_type":"rotation","rotation_angle_rad":1.57079632679}'
```

## Errors

The API returns normalized errors. Preserve the `request_id` when reporting a failure.

```json
{
  "error": "too_many_requests",
  "message": "Rate limit or quota exceeded.",
  "details": {
    "policy": "key_minute",
    "retry_after_seconds": 15
  },
  "request_id": "request-id"
}
```

## Integration guides

- [Unreal Plugin](/public-facing/api/quantum/ue-plugin.md)
- [TypeScript SDK](/public-facing/api/quantum/typescript-sdk.md)
- [Python SDK](/public-facing/api/quantum/python-sdk.md)
- [Godot Addon](/public-facing/api/quantum/godot-addon.md)
- [Unity Package](/public-facing/api/quantum/unity-package.md)

## Feedback, contributions, comments, and questions

Questions, corrections, and issue reports are welcome.

- Email: [MrDJ@DavidJGrimsley.com](mailto:MrDJ@DavidJGrimsley.com)
- Issues: [github.com/davidjgrimsley/quantum-api/issues](https://github.com/davidjgrimsley/quantum-api/issues)

## Agent version (.md)

This file is the agent-readable Markdown version of the main Quantum API docs. For discovery across all public developer docs, start with [`/llms.txt`](/llms.txt), then follow the relevant guide links.

## Agent workflow

1. Read the relevant integration guide above.
2. Read the live OpenAPI document before writing a request body or response parser.
3. Use `/v1/portfolio.json` when you need the current endpoint list and request-ready mounted paths.
4. Never invent credentials, API keys, IBM profiles, or private service state.
