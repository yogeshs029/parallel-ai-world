# Parallel AI World 🌍

**Your worlds. Your people. Your intelligence.**

Parallel AI World allows users to create persistent digital worlds (e.g. Home, Family, School, Company, Business, Study, Game) and populate them with intelligent, character-grounded people.

---

## 🏛️ System & AI Architecture

Parallel AI World uses a decoupled **LLM Provider Abstraction** designed for both zero-setup cloud production and offline local development:

```
                            ┌──────────────────────────────┐
                            │   Browser (Desktop / Mobile) │
                            └──────────────┬───────────────┘
                                           │
                          fetch('/api/chat/stream') [SSE]
                                           │
                    ┌──────────────────────┴──────────────────────┐
                    │                                             │
          [PRODUCTION (Cloudflare)]                      [LOCAL DEVELOPMENT]
                    │                                             │
          Cloudflare Worker (`src/worker/`)             Vite Dev Proxy (:3000)
                    │                                             │
        Cloudflare Workers AI (`env.AI`)               Python FastAPI Backend (:8000)
                    │                                             │
         `@cf/meta/llama-3.1-8b-instruct`               `IntelligenceService` (LLMProvider)
                    │                                             │
                    │                                       `OllamaProvider`
                    │                                             │
                    │                                  Ollama (`localhost:11434`)
                    │                                             │
                    └──────────────────────┬──────────────────────┘
                                           │
                             Streaming Token Responses
                                           ↓
                                        Browser
```

### 1. ☁️ Production Mode (Cloudflare Workers AI)
- **Ollama is NOT required** for end users opening the app on mobile, tablet, or another computer.
- Model inference runs directly on **Cloudflare Workers AI** using `@cf/meta/llama-3.1-8b-instruct`.
- Single-page application assets and AI inference stream from the same Cloudflare Worker edge origin.

### 2. 💻 Local Development Mode (Ollama)
- Uses local Ollama service (`http://localhost:11434`) with `mistral:latest` or any local model.
- Fast iteration without external API consumption.

---

## 🚀 Quick Start Guide

### Local Development Setup

1. **Install Node & Python Dependencies**:
   ```bash
   npm install
   pip install -r backend/requirements.txt
   ```

2. **Start Local Ollama** (Required for local offline development):
   ```bash
   ollama pull mistral
   ollama serve
   ```

3. **Start FastAPI Backend**:
   ```bash
   python -m uvicorn backend.app.main:app --port 8000 --host 127.0.0.1 --reload
   ```

4. **Start Vite Dev Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Production Deployment (Cloudflare)

1. **Build the production SPA**:
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare Workers**:
   ```bash
   npx wrangler deploy
   ```

---

## ⚙️ Environment Configuration

| Variable | Environment | Default Value | Description |
|---|---|---|---|
| `LLM_PROVIDER` | Backend / Worker | `ollama` (dev) / `cloudflare` (prod) | Active LLM inference provider |
| `CLOUDFLARE_AI_MODEL` | Worker / Backend | `@cf/meta/llama-3.1-8b-instruct` | Cloudflare Workers AI model |
| `OLLAMA_BASE_URL` | Local Backend | `http://localhost:11434` | URL of the local Ollama daemon |
| `OLLAMA_MODEL` | Local Backend | `mistral:latest` | Local Ollama model name |
| `BACKEND_PORT` | Local Backend | `8000` | Local FastAPI port |

---

## 🧪 Verification & Diagnostics

- **TypeScript Type Check**: `npx tsc --noEmit`
- **ESLint**: `npm run lint`
- **Production Build**: `npm run build`
- **Cloudflare Worker Dry-Run**: `npx wrangler deploy --dry-run`
- **LLM Provider Unit Tests**: `python backend/test_llm_providers.py`
- **Voice Integration Flow**: `python backend/test_voice_flow.py`
