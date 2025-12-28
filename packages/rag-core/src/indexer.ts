import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { chunkMarkdown } from "./chunk.js";
import { embedTexts } from "./embed.js";
import { RagStore } from "./types.js";

const DOCS_DIR = process.env.DOCS_DIR ?? "./data/docs";
const STORE_PATH = process.env.RAG_STORE_PATH ?? "./data/index/rag-store.json";
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-small";

function readAllDocs(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...readAllDocs(p));
    else if (e.isFile() && (p.endsWith(".md") || p.endsWith(".txt"))) files.push(p);
  }
  return files;
}

async function main() {
  const files = readAllDocs(DOCS_DIR);
  if (files.length === 0) throw new Error(`No docs found in ${DOCS_DIR}`);

  const allChunks = [];
  for (const f of files) {
    const docId = path.relative(DOCS_DIR, f).replaceAll("\\", "/");
    const content = fs.readFileSync(f, "utf8");
    allChunks.push(...chunkMarkdown(docId, content));
  }

  const embeddings = await embedTexts(allChunks.map((c) => c.text), EMBED_MODEL);

  const store: RagStore = {
    version: 1,
    createdAt: new Date().toISOString(),
    embedModel: EMBED_MODEL,
    records: allChunks.map((chunk, i) => ({ chunk, embedding: embeddings[i]! }))
  };

  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");

  console.log(`✅ Indexed ${files.length} docs, ${allChunks.length} chunks`);
  console.log(`✅ Store written to ${STORE_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
