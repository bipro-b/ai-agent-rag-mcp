export type DocChunk = {
  id: string;
  docId: string;
  text: string;
  startLine?: number;
  endLine?: number;
};

export type VectorRecord = {
  chunk: DocChunk;
  embedding: number[];
};

export type RagStore = {
  version: number;
  createdAt: string;
  embedModel: string;
  records: VectorRecord[];
};
