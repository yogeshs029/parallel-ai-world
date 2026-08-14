# Parallel AI World 🌍

**Your worlds. Your people. Your intelligence.**

Parallel AI World allows users to create persistent digital worlds (e.g. Home, Family, School, Company, Business, Study, Game) and populate them with intelligent, character-grounded people.

---

## 🏛️ System Architecture

```
React / Vite (Frontend @ Port 3000)
       ↓  (HTTP / Server-Sent Events)
FastAPI Backend (@ Port 8000)
       ↓  (HTTP API / Streaming)
LLM Provider Abstraction (OllamaProvider)
       ↓
Local Ollama Service (@ Port 11434)
```

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide icons, Vite.
- **Backend API**: Python 3.10+, FastAPI, HTTPX (async streaming), Pydantic v2.
- **Local Intelligence**: Ollama (`mistral:latest`, `llama3.2`, or configurable).

---

## 🚀 Quick Start Guide

### 1. Prerequisites

1. **Node.js**: v18+ and `npm`.
2. **Python**: v3.10+ and `pip`.
3. **Ollama**: Download and install from [ollama.com](https://ollama.com).

### 2. Start Ollama Local Service

```bash
# Pull the default local model
ollama pull mistral

# Start the Ollama daemon (if not already running in background)
ollama serve
```

### 3. Backend Setup & Run (FastAPI)

```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run the FastAPI server on port 8000
python -m uvicorn backend.app.main:app --port 8000 --host 127.0.0.1 --reload
```

- **Swagger Documentation**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check**: [http://127.0.0.1:8000/api/health/llm](http://127.0.0.1:8000/api/health/llm)

### 4. Frontend Setup & Run (Vite)

```bash
# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```

Open [http://localhost:3000/](http://localhost:3000/) in your browser.

---

## ⚙️ Environment Configuration

The backend supports configuration via environment variables or a `.env` file in the root / `backend` folder:

| Variable | Default Value | Description |
|---|---|---|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | URL of the local Ollama daemon |
| `OLLAMA_MODEL` | `mistral:latest` | Default local model to use for character intelligence |
| `BACKEND_PORT` | `8000` | Port for the FastAPI server |
| `BACKEND_HOST` | `0.0.0.0` | Host binding for FastAPI |

---

## 🧠 Person Intelligence Model

Every Person in a World has a configurable intelligence profile:

- **Thinking Style**:
  - `Balanced` — Pragmatic and well-rounded
  - `Analytical` — Methodical and evidence-based
  - `Creative` — Imaginative and unconventional
  - `Practical` — Action-oriented and simple
  - `Detailed` — Deep and exhaustive
- **Communication Style**: `Friendly`, `Professional`, `Direct`, `Warm`, `Concise`, `Detailed`
- **Initiative Level**:
  - `Wait for me` — Direct answers only
  - `Suggest things` — Proactive suggestions
  - `Take initiative` — Anticipates next steps
- **Custom Instructions**: Freeform behavioral guidance (e.g. *"Always explain with TypeScript examples"*).

---

## 🧪 Verification & Health Diagnostics

- **TypeScript Compilation**: `npx tsc --noEmit`
- **ESLint**: `npm run lint`
- **Production Bundle**: `npm run build`
- **LLM Streaming Test**: `python backend/test_chat.py`
