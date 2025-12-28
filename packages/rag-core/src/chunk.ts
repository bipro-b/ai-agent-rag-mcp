import crypto from "node:crypto";
import { DocChunk } from "./types.js";

export function chunkMarkdown(docId: string, content: string, maxChars = 900, overlap = 150): DocChunk[] {
  const lines = content.split(/\r?\n/);
  const chunks: DocChunk[] = [];

  let buf: string[] = [];
  let bufLen = 0;
  let startLine = 1;

  const pushChunk = (endLine: number) => {
    const text = buf.join("\n").trim();
    if (!text) return;

    const id = crypto.createHash("sha1").update(`${docId}:${startLine}:${endLine}:${text}`).digest("hex");
    chunks.push({ id, docId, text, startLine, endLine });

    const tail = text.slice(Math.max(0, text.length - overlap));
    buf = [tail];
    bufLen = tail.length;
    startLine = endLine;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    buf.push(line);
    bufLen += line.length + 1;

    if (bufLen >= maxChars) pushChunk(i + 1);
  }

  pushChunk(lines.length);
  return chunks;
}
