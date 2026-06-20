---
name: OpenRouter Integration
description: Enables model query, model selection, and proxying capabilities via OpenRouter for the Antigravity assistant.
---

# OpenRouter Workspace Integration

This workspace skill provides the capability to communicate with OpenRouter's 600+ models. It includes model listing, direct querying, and a streaming proxy server.

## Configurations

The integration loads the OpenRouter API Key from your `.env.local` file at the root of this project:
```bash
OPENROUTER_API_KEY="your-api-key-here"
```

## Available Operations

The integration helper is written in TypeScript and can be run via:
```bash
pnpm exec ts-node .agents/skills/openrouter/scripts/openrouter-helper.ts <command>
```

### 1. List Available Models
To get the top 30 models from OpenRouter sorted by their context length:
```bash
pnpm exec ts-node .agents/skills/openrouter/scripts/openrouter-helper.ts list
```

### 2. Query a Model Directly
To send a prompt to any OpenRouter model:
```bash
pnpm exec ts-node .agents/skills/openrouter/scripts/openrouter-helper.ts query <model_id> "<prompt>"
```
Example:
```bash
pnpm exec ts-node .agents/skills/openrouter/scripts/openrouter-helper.ts query google/gemini-2.5-flash "Write a hello world script in Python."
```

### 3. Start the Local Streaming Proxy
To run a local proxy that translates OpenAI-like requests to OpenRouter (useful for connecting other IDEs or clients to OpenRouter):
```bash
pnpm exec ts-node .agents/skills/openrouter/scripts/openrouter-helper.ts proxy [port]
```
- **Default Port**: `4000`
- **Proxy Endpoint**: `http://localhost:4000/v1/chat/completions` (OpenAI format)
- **Model Endpoint**: `http://localhost:4000/v1/models` (Returns models list)

To connect an IDE/Client extension:
1. Set the API Base URL to `http://localhost:4000/v1`
2. Set the API Key to anything (since the proxy handles authorization internally using the key in `.env.local`)
3. Choose any model ID supported by OpenRouter (e.g. `anthropic/claude-3.5-sonnet`, `meta-llama/llama-3-70b-instruct`).
