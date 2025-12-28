
---

# AI Agentic RAG System (MCP-Powered)

An industry-grade **Autonomous AI Agent** built using the **Model Context Protocol (MCP)** and **Retrieval-Augmented Generation (RAG)**. This project demonstrates a production-ready architecture for connecting LLMs to private enterprise data with high precision and deterministic tool-calling.

## 🚀 Key Features

* **Autonomous Agent Loop**: Implements the **ReAct (Reason + Act)** pattern. The agent doesn't just chat; it interprets goals, chooses tools, executes steps, and iterates based on results.


* **Standardized Tooling (MCP)**: Uses the **Model Context Protocol** to decouple the AI brain from the tools it uses. This ensures interoperability, strong schema validation (Zod), and easy tool discovery.


* **Production RAG Pipeline**: A complete ingestion-to-query pipeline featuring:
* 
**Deterministic Chunking**: 900-character chunks with 150-character overlap for optimal context retention.


* 
**Vector Embeddings**: Powered by OpenAI's `text-embedding-3-small`.


* 
**Cosine Similarity Search**: High-performance mathematical retrieval for finding semantically relevant documentation.




* 
**Context Grounding**: Strict system prompting ensures the agent answers **ONLY** using provided context and includes citations, preventing hallucinations.



## 🏗️ Architecture

The system is organized into a modular monorepo using **NPM Workspaces**:

```text
[cite_start]├── apps/agent-cli          # The "Brain" - CLI Agent that manages the MCP client loop [cite: 2]
├── packages/rag-core       # The "Indexer" - Handles chunking, embedding, and vector storage
├── servers/mcp-rag-server  # The "Librarian" - MCP Server providing RAG tools via stdio
└── data/docs               # Source documentation (Markdown/Text)

```

The Data Pipeline 

1. **Ingestion**: Markdown files are parsed and chunked.
2. **Indexing**: Chunks are converted to vectors and stored in a local JSON vector store.
3. **Retrieval**: At runtime, user queries are embedded and compared against the store.
4. **Augmentation**: Top-K relevant chunks are injected into the LLM prompt.

## 🛠️ Tech Stack

* **Language**: TypeScript (NodeNext)
* **AI Models**: OpenAI GPT-4o-mini (Chat) & text-embedding-3-small (Embeddings)
* 
**Protocol**: @modelcontextprotocol/sdk 


* 
**Validation**: Zod (Schema-validated tool calls) 



## 🚦 Getting Started

### Prerequisites

* Node.js (v22+)
* OpenAI API Key

### Installation

```bash
# Install dependencies for all workspaces
npm install

# Build the project
npm run build

```

### Running the System

1. **Index your documents**:
```bash
npm run index:docs

```


2. **Start the Agent**:
```bash
npm run dev

```



## 🧠 Why This Matters (Interview Highlights)

* 
**Hallucination Defense**: By using **Context Grounding**, this system forces the model to say "I don't know" if information is missing from the RAG store.


* 
**MCP vs. REST**: This project uses MCP because it provides **built-in discovery** and **type-safe tool ecosystems**, making it superior for AI-first applications compared to traditional REST.


* 
**Agent Autonomy**: Unlike a simple chatbot, this agent can be expanded to a **Multi-Tool Agent**, choosing between inventory lookups, case management, or knowledge base searches.



---
