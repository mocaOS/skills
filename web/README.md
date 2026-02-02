# decc0 Web Interface

Interactive web interface for the decc0 Soul & Identity Loader. Chat with 10,000 unique AI characters from the MOCA Codex.

## Features

- **Telegram-style chat interface** - Clean, modern messaging UI
- **Command dropdown** - Easy access to `/decc0` commands
- **Soul loader** - Load random souls, by ID, or search by name
- **Live LLM integration** - Connect to any OpenAI-compatible API
- **Multi-provider support** - LiteLLM, vLLM, Compute3, Venice, OpenAI, Anthropic, Ollama

## Quick Start

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Configure LLM Provider

Copy the environment example and configure your provider:

```bash
cp .env.example .env
```

Edit `.env` to set your preferred LLM provider:

```bash
# Choose your provider
LLM_PROVIDER=openai

# Add your API key
OPENAI_API_KEY=sk-...
```

### 3. Start the Application

**Development mode** (with hot reload):

```bash
# Terminal 1: Start the backend server
npm run dev:server

# Terminal 2: Start the frontend
npm run dev
```

Or run both together:

```bash
npm run dev:all
```

**Production mode**:

```bash
npm run build
npm start
```

### 4. Open in Browser

Visit [http://localhost:5173](http://localhost:5173) to start chatting!

## LLM Provider Configuration

The web interface supports multiple LLM providers. Set `LLM_PROVIDER` in your `.env` file:

### LiteLLM (Recommended)

Universal LLM proxy that supports 100+ providers.

```bash
LLM_PROVIDER=litellm
LITELLM_BASE_URL=http://localhost:4000
LITELLM_API_KEY=your-key
LITELLM_MODEL=gpt-3.5-turbo
```

### vLLM

Self-hosted inference server.

```bash
LLM_PROVIDER=vllm
VLLM_BASE_URL=http://localhost:8000
VLLM_MODEL=meta-llama/Llama-2-7b-chat-hf
```

### Compute3

GPU cloud with LLM API.

```bash
LLM_PROVIDER=compute3
COMPUTE3_API_KEY=your-key
COMPUTE3_MODEL=deepseek-v3.1
```

### Venice

Privacy-focused AI.

```bash
LLM_PROVIDER=venice
VENICE_API_KEY=your-key
VENICE_MODEL=llama-3.3-70b
```

### OpenAI

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### Anthropic

```bash
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-haiku-20240307
```

### Ollama (Local)

```bash
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

## Commands

The interface supports these commands (also available via dropdown):

| Command | Description |
|---------|-------------|
| `/decc0 load` | Load a random soul |
| `/decc0 load 42` | Load soul by ID |
| `/decc0 load Parvata` | Load soul by name |
| `/decc0 list` | List available souls |
| `/decc0 search curator` | Search souls |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Vue.js + Tailwind CSS Frontend            │    │
│  │                 (localhost:5173)                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js Backend                        │
│                     (localhost:3001)                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  /api/chat    → LLM Provider (OpenAI-compatible)    │    │
│  │  /api/health  → Health check                         │    │
│  │  /api/provider → Current provider info               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│    MOCA Codex API       │     │     LLM Provider        │
│  api.decc0s.com         │     │  (OpenAI/Anthropic/     │
│                         │     │   LiteLLM/vLLM/etc)     │
│  - Load souls           │     │                         │
│  - Search/filter        │     │  - Chat completions     │
│  - Get avatars          │     │  - Streaming support    │
└─────────────────────────┘     └─────────────────────────┘
```

## API Endpoints

### Backend Server (localhost:3001)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check with provider info |
| `/api/provider` | GET | Current LLM provider configuration |
| `/api/chat` | POST | Send message to LLM with soul context |

### Chat Request

```bash
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello! Who are you?",
    "soul": "# SOUL.md — Parvata\n\nYou are Parvata...",
    "identity": "# IDENTITY.md\n\nName: Parvata\nEmoji: 🌊",
    "history": []
  }'
```

## Development

### Project Structure

```
web/
├── src/
│   ├── App.vue          # Main chat interface
│   ├── main.js          # Vue app entry
│   └── style.css        # Tailwind + custom styles
├── server.js            # Express backend
├── .env.example         # Environment template
├── tailwind.config.js   # Tailwind configuration
├── vite.config.js       # Vite configuration
└── package.json
```

### Building for Production

```bash
# Build frontend
npm run build

# The built files are in ./dist
# Serve with any static file server

# Start backend
npm start
```

## Related

- [MOCA Codex Docs](https://docs.decc0s.com) - Soul database documentation
- [decc0 Skill](../skills/decc0/SKILL.md) - Agent skill definition
- [Open Soul Protocol](../skills/decc0/protocol.md) - OSP specification

## License

MIT
