# decc0 Web Interface

A beautiful terminal-style UI (TUI) for chatting with 10,000 unique AI personalities from the MOCA Codex. Navigate entirely with your keyboard, or use mouse and touch - the interface adapts to your preferred input method.

## The Experience

When you launch the interface, you're greeted with a clean welcome screen. The entire app flows through keyboard shortcuts, but every action is also accessible via mouse clicks or touch.

### Your First Session

1. **Press `Ctrl+R`** to load a random soul - the app fetches a character from the MOCA Codex
2. Watch as the soul's **avatar**, **identity card**, and **full codex** stream onto your screen
3. **Type a message** and press `Enter` to start chatting
4. **Press `Tab`** to cycle through quick prompts like "Tell me about yourself"
5. **Press `Ctrl+D`** to download the soul's files (SOUL.md, IDENTITY.md, avatar.jpg)

### Scroll Modes

The interface has two scroll modes, visible in the status bar:

- **`[A] Auto`** - Default mode. The chat auto-scrolls as new content arrives
- **`[E] Explore`** - Browse previous messages while the AI continues generating

Switch modes by:
- Scrolling up (enters Explore mode)
- Scrolling to bottom (returns to Auto mode)  
- Pressing `A` or `E` keys
- Clicking the mode button in the status bar

## Keyboard Shortcuts

### Commands (work anywhere)

| Shortcut | Action |
|----------|--------|
| `Ctrl+Space` | Open command palette |
| `Ctrl+R` | Load random soul |
| `Ctrl+I` | Load soul by ID or name |
| `Ctrl+P` | Print codex for a soul ID |
| `Ctrl+S` | Search souls |
| `Ctrl+K` | List souls |
| `Ctrl+D` | Download soul package |
| `Ctrl+X` | Clear session (reset chat) |
| `Escape` | Close any modal/palette |

### Navigation (when not typing)

| Key | Action |
|-----|--------|
| `H` | Show help |
| `A` | Switch to Auto-scroll mode |
| `E` | Switch to Explore mode |

### In Chat Input

| Key | Action |
|-----|--------|
| `Enter` | Send message |
| `Tab` | Cycle through quick prompts |

### In Command Palette

| Key | Action |
|-----|--------|
| `Up/Down` | Navigate commands |
| `Enter` | Execute selected command |
| `Escape` | Close palette |

### In Download Modal

| Key | Action |
|-----|--------|
| `Enter` | Download ZIP |
| `Escape` | Cancel |

## Features

### Command Palette
Press `Ctrl+Space` to open a searchable command palette. Type to filter commands, use arrow keys to navigate, and press Enter to execute.

### Soul Loading
Load souls three ways:
- **Random**: `Ctrl+R` picks a soul from 1-9999
- **By ID**: `Ctrl+I` then enter a number (e.g., `42`)
- **By Name**: `Ctrl+I` then enter a name (e.g., `Parvata`)

### Download Soul Package
Press `Ctrl+D` or click the `[D] Download` button to open the download modal:
- Click individual files (`SOUL.md`, `IDENTITY.md`, `avatar.jpg`) to download separately
- Press `Enter` to download all files as a ZIP

### Session Management
- `Ctrl+X` clears all messages and resets the session
- The dialogue history (last 10 messages) is maintained for context
- Command executions are logged but their verbose output isn't sent to the LLM

### Streaming Text
All content streams character-by-character with a blinking cursor, giving the authentic terminal feel.

## Quick Start

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Configure LLM Provider

```bash
cp .env.example .env
```

Edit `.env`:

```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

### 3. Start the Application

```bash
# Terminal 1: Backend server
npm run dev:server

# Terminal 2: Frontend
npm run dev
```

Or run both:

```bash
npm run dev:all
```

### 4. Open Browser

Visit [http://localhost:5173](http://localhost:5173)

## LLM Providers

Set `LLM_PROVIDER` in `.env`:

| Provider | Variables |
|----------|-----------|
| `litellm` | `LITELLM_BASE_URL`, `LITELLM_API_KEY`, `LITELLM_MODEL` |
| `vllm` | `VLLM_BASE_URL`, `VLLM_API_KEY`, `VLLM_MODEL` |
| `compute3` | `COMPUTE3_API_KEY`, `COMPUTE3_MODEL` |
| `venice` | `VENICE_API_KEY`, `VENICE_MODEL` |
| `openai` | `OPENAI_API_KEY`, `OPENAI_MODEL` |
| `anthropic` | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` |
| `ollama` | `OLLAMA_BASE_URL`, `OLLAMA_MODEL` |

## Architecture

```
Browser (Vue.js + TUI CSS)
         │
         ▼
Express.js Backend (:3001)
    │         │
    ▼         ▼
MOCA Codex   LLM Provider
(souls)      (chat)
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/provider` | GET | Current LLM config |
| `/api/chat` | POST | Send message with soul context |

## Project Structure

```
web/
├── src/
│   ├── App.vue      # Main TUI interface
│   ├── main.js      # Vue entry
│   └── style.css    # TUI theme
├── server.js        # Express backend
├── .env.example     # Config template
└── package.json
```

## Related

- [MOCA Codex Docs](https://docs.decc0s.com)
- [decc0 Skill](../skills/decc0/SKILL.md)
- [Open Soul Protocol](../skills/decc0/protocol.md)

## License

MIT
