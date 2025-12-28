import fs from "node:fs";
import OpenAI from "openai";
import { z } from "zod";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

type RagStore = {
  version: number;
  createdAt: string;
  embedModel: string;
  records: { chunk: any; embedding: number[] }[];
};

function loadStore(): RagStore {
  const storePath = process.env.RAG_STORE_PATH ?? "./data/index/rag-store.json";
  const raw = fs.readFileSync(storePath, "utf8");
  return JSON.parse(raw);
}

function dot(a: number[], b: number[]) { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * (b[i] ?? 0); return s; }
function norm(a: number[]) { return Math.sqrt(dot(a, a)); }
function cosine(a: number[], b: number[]) { const d = dot(a, b); const n = norm(a) * norm(b); return n === 0 ? 0 : d / n; }

function topK(store: RagStore, q: number[], k: number) {
  const scored = store.records.map((rec) => ({ score: cosine(q, rec.embedding), rec }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

async function embedQuery(text: string, model: string) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const res = await client.embeddings.create({ model, input: text });
  return res.data[0]!.embedding as number[];
}

async function llmAnswer(question: string, contexts: { docId: string; text: string; range?: string }[]) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini";

  const ctx = contexts
    .map((c, i) => `[#${i + 1}] ${c.docId}${c.range ? ` (${c.range})` : ""}\n${c.text}`)
    .join("\n\n");

  const prompt = `You are a support agent. Answer ONLY using the context. If the answer is not in context, say "I don't know".
Return:
- answer
- "Sources:" with citations [#]

Context:
${ctx}

Question: ${question}
`;

  const r = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2
  });

  return r.choices[0]?.message?.content ?? "";
}

async function main() {
  const store = loadStore();
  const server = new McpServer({ name: "mcp-rag-server", version: "1.0.0" });

  // IMPORTANT: this SDK version expects (name, uri, callback)
  server.resource(
    "kb-info",
    "kb://info",
    async () => ({
      contents: [
        {
          uri: "kb://info",
          mimeType: "application/json",
          text: JSON.stringify(
            { storeCreatedAt: store.createdAt, embedModel: store.embedModel, chunks: store.records.length },
            null,
            2
          )
        }
      ]
    })
  );

  server.tool(
    "rag.search",
    "Search indexed docs and return top chunks.",
    { query: z.string().min(1), topK: z.number().int().min(1).max(20).default(6) },
    async ({ query, topK: k }) => {
      const qEmb = await embedQuery(query, store.embedModel);
      const hits = topK(store, qEmb, k).map((h, idx) => ({
        rank: idx + 1,
        score: Number(h.score.toFixed(4)),
        docId: h.rec.chunk.docId,
        range: h.rec.chunk.startLine && h.rec.chunk.endLine ? `L${h.rec.chunk.startLine}-L${h.rec.chunk.endLine}` : undefined,
        text: h.rec.chunk.text
      }));

      return { content: [{ type: "text", text: JSON.stringify({ query, hits }, null, 2) }] };
    }
  );

  server.tool(
    "rag.answer",
    "Answer using RAG + citations.",
    { question: z.string().min(1), topK: z.number().int().min(1).max(20).default(6) },
    async ({ question, topK: k }) => {
      const qEmb = await embedQuery(question, store.embedModel);
      const hits = topK(store, qEmb, k).map((h) => ({
        docId: h.rec.chunk.docId,
        range: h.rec.chunk.startLine && h.rec.chunk.endLine ? `L${h.rec.chunk.startLine}-L${h.rec.chunk.endLine}` : undefined,
        text: h.rec.chunk.text,
        score: h.score
      }));

      const answer = await llmAnswer(
        question,
        hits.map((h) => ({ docId: h.docId, text: h.text, range: h.range }))
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                question,
                answer,
                sources: hits.map((h, i) => ({
                  citation: `[#${i + 1}]`,
                  docId: h.docId,
                  range: h.range,
                  score: Number(h.score.toFixed(4))
                }))
              },
              null,
              2
            )
          }
        ]
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ MCP RAG Server running (stdio)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
