import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import https from "node:https";
import dotenv from "dotenv";

import { fileURLToPath } from "node:url";

// Resolve paths and load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../../../");
const envLocalPath = path.join(projectRoot, ".env.local");

if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const apiKey = process.env.OPENROUTER_API_KEY || "";

if (!apiKey) {
  console.error("\x1b[31mError: OPENROUTER_API_KEY is not defined in your .env.local file.\x1b[0m");
  process.exit(1);
}

// Help message
function showHelp() {
  console.log(`
\x1b[36mOpenRouter Integration Helper CLI\x1b[0m
Usage:
  ts-node openrouter-helper.ts <command> [options]

Commands:
  \x1b[32mlist\x1b[0m                    List available OpenRouter models sorted by context length.
  \x1b[32mquery <model> <prompt>\x1b[0m  Send a prompt to a specific OpenRouter model.
  \x1b[32mproxy [port]\x1b[0m            Start a local streaming proxy server (default port: 4000).
  \x1b[32mhelp\x1b[0m                    Show this help menu.

Examples:
  \x1b[90mpnpm exec ts-node .agents/skills/openrouter/scripts/openrouter-helper.ts list\x1b[0m
  \x1b[90mpnpm exec ts-node .agents/skills/openrouter/scripts/openrouter-helper.ts query google/gemini-2.5-flash "Hello!"\x1b[0m
  \x1b[90mpnpm exec ts-node .agents/skills/openrouter/scripts/openrouter-helper.ts proxy 4000\x1b[0m
`);
}

// 1. List Command
async function listModels() {
  console.log("Fetching models from OpenRouter...");
  const options = {
    hostname: "openrouter.ai",
    path: "/api/v1/models",
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:4000",
      "X-Title": "Antigravity IDE Helper",
    },
  };

  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const json = JSON.parse(data);
        if (!json.data || !Array.isArray(json.data)) {
          console.error("Invalid response format from OpenRouter:", json);
          return;
        }

        // Sort by context length descending
        const sortedModels = json.data.sort((a: any, b: any) => b.context_length - a.context_length);

        console.log(`\n\x1b[1m${"Model ID".padEnd(50)} ${"Context Window".padEnd(20)} ${"Prompt / Completion Cost (per 1M tokens)"}\x1b[0m`);
        console.log("-".repeat(110));

        // Display top 30 models
        for (const model of sortedModels.slice(0, 30)) {
          const promptCost = (Number(model.pricing?.prompt || 0) * 1_000_000).toFixed(4);
          const completionCost = (Number(model.pricing?.completion || 0) * 1_000_000).toFixed(4);
          const contextLength = model.context_length ? `${(model.context_length / 1000).toFixed(0)}k` : "unknown";
          console.log(`${model.id.padEnd(50)} ${contextLength.padEnd(20)} $${promptCost} / $${completionCost}`);
        }
        console.log(`\n\x1b[32mListed top 30 models of ${sortedModels.length} available models.\x1b[0m`);
      } catch (err: any) {
        console.error("Error parsing model list response:", err.message);
      }
    });
  });

  req.on("error", (err) => {
    console.error("Request failed:", err.message);
  });

  req.end();
}

// 2. Query Command
async function queryModel(modelId: string, prompt: string) {
  console.log(`Querying model \x1b[33m${modelId}\x1b[0m with prompt: "${prompt}"...`);

  const postData = JSON.stringify({
    model: modelId,
    messages: [{ role: "user", content: prompt }],
  });

  const options = {
    hostname: "openrouter.ai",
    path: "/api/v1/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:4000",
      "X-Title": "Antigravity IDE Helper",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      try {
        const json = JSON.parse(data);
        if (json.choices && json.choices[0] && json.choices[0].message) {
          console.log(`\n\x1b[32mResponse from ${modelId}:\x1b[0m`);
          console.log(json.choices[0].message.content);
        } else {
          console.error("No completion response. Full API response:", JSON.stringify(json, null, 2));
        }
      } catch (err: any) {
        console.error("Error parsing response:", err.message);
        console.log("Raw response data:", data);
      }
    });
  });

  req.on("error", (err) => {
    console.error("Request failed:", err.message);
  });

  req.write(postData);
  req.end();
}

// 3. Proxy Server Command (Streaming supported)
function startProxyServer(portStr?: string) {
  const port = portStr ? parseInt(portStr, 10) : 4000;
  if (isNaN(port)) {
    console.error("Invalid port specified");
    process.exit(1);
  }

  const server = http.createServer((clientReq, clientRes) => {
    // Enable CORS
    clientRes.setHeader("Access-Control-Allow-Origin", "*");
    clientRes.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    clientRes.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (clientReq.method === "OPTIONS") {
      clientRes.writeHead(200);
      clientRes.end();
      return;
    }

    // Route only chat completions and models list
    const isChatRoute = clientReq.url?.endsWith("/chat/completions");
    const isModelsRoute = clientReq.url?.endsWith("/models");

    if (!isChatRoute && !isModelsRoute) {
      clientRes.writeHead(404, { "Content-Type": "application/json" });
      clientRes.end(JSON.stringify({ error: "Route not found. This proxy supports /v1/chat/completions and /v1/models" }));
      return;
    }

    if (isModelsRoute && clientReq.method === "GET") {
      // Forward GET models to OpenRouter
      const proxyReq = https.request(
        {
          hostname: "openrouter.ai",
          path: "/api/v1/models",
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "http://localhost:4000",
            "X-Title": "Antigravity IDE Proxy",
          },
        },
        (proxyRes) => {
          clientRes.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
          proxyRes.pipe(clientRes);
        },
      );
      proxyReq.on("error", (err) => {
        clientRes.writeHead(500, { "Content-Type": "application/json" });
        clientRes.end(JSON.stringify({ error: "Proxy connection error", message: err.message }));
      });
      proxyReq.end();
      return;
    }

    if (isChatRoute && clientReq.method === "POST") {
      let bodyData = "";
      clientReq.on("data", (chunk) => {
        bodyData += chunk;
      });

      clientReq.on("end", () => {
        try {
          // Verify valid JSON
          const bodyJson = JSON.parse(bodyData);

          // Prepare options to request OpenRouter
          const postPayload = JSON.stringify(bodyJson);

          const proxyReq = https.request(
            {
              hostname: "openrouter.ai",
              path: "/api/v1/chat/completions",
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:4000",
                "X-Title": "Antigravity IDE Proxy",
                "Content-Length": Buffer.byteLength(postPayload),
              },
            },
            (proxyRes) => {
              clientRes.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
              proxyRes.pipe(clientRes);
            },
          );

          proxyReq.on("error", (err) => {
            console.error("OpenRouter request failed:", err.message);
            clientRes.writeHead(500, { "Content-Type": "application/json" });
            clientRes.end(JSON.stringify({ error: "OpenRouter connection failed", message: err.message }));
          });

          proxyReq.write(postPayload);
          proxyReq.end();
        } catch (err: any) {
          clientRes.writeHead(400, { "Content-Type": "application/json" });
          clientRes.end(JSON.stringify({ error: "Invalid JSON body", message: err.message }));
        }
      });
      return;
    }
  });

  server.listen(port, () => {
    console.log(`\n\x1b[32mOpenRouter Local Streaming Proxy is running at http://localhost:${port}\x1b[0m`);
    console.log(`Routing:`);
    console.log(`  POST http://localhost:${port}/v1/chat/completions -> OpenRouter API`);
    console.log(`  GET  http://localhost:${port}/v1/models           -> OpenRouter API`);
    console.log(`Press Ctrl+C to stop.`);
  });
}

// CLI entrypoint
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  showHelp();
  process.exit(0);
}

switch (command.toLowerCase()) {
  case "list":
    listModels();
    break;
  case "query":
    const model = args[1];
    const prompt = args[2];
    if (!model || !prompt) {
      console.error("\x1b[31mError: Model and Prompt are required for the query command.\x1b[0m");
      showHelp();
      process.exit(1);
    }
    queryModel(model, prompt);
    break;
  case "proxy":
    startProxyServer(args[1]);
    break;
  case "help":
  default:
    showHelp();
    break;
}
