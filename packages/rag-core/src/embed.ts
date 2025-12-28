import OpenAI from "openai";

export async function embedTexts(texts: string[], model: string): Promise<number[][]> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const out: number[][] = [];
  const batchSize = 64;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const res = await client.embeddings.create({ model, input: batch });
    for (const item of res.data) out.push(item.embedding as number[]);
  }

  return out;
}
