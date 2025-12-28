import readline from "node:readline";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
  // IMPORTANT:
  // In your MCP SDK version, StdioClientTransport spawns the server itself.
  // It does NOT accept stdin/stdout streams.
  const transport = new StdioClientTransport({
    command: "node",
    args: ["--env-file=../../.env", "../../servers/mcp-rag-server/dist/server.js"],
  });

  const client = new Client({ name: "agent-cli", version: "1.0.0" });
  await client.connect(transport);

  console.log("✅ Agent connected to MCP server (stdio)");
  console.log("✅ Ask something. Type 'exit' to quit.\n");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const ask = () =>
    rl.question("> ", async (q) => {
      const input = q.trim();
      if (input.toLowerCase() === "exit") {
        rl.close();
        await client.close();
        return;
      }

      const result = await client.callTool({
        name: "rag.answer",
        arguments: { question: input, topK: 6 },
      });

      // MCP SDK typing in your version is too generic ({}), so safely parse.
      const content = (result as any)?.content;
      const textItem = Array.isArray(content)
        ? content.find((c: any) => c?.type === "text")
        : null;

      const text = textItem?.text ?? JSON.stringify(result, null, 2);

      console.log("\n" + text + "\n");
      ask();
    });

  ask();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
