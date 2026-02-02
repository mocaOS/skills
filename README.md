# Skills

A collection of skills for AI agents, starting with the **decc0** skill for loading souls from the MOCA Codex.

## What are Skills?

Skills are instruction packages that teach AI agents how to perform specific tasks. Each skill is a directory containing a `SKILL.md` file with YAML frontmatter and detailed instructions.

This repository follows the [AgentSkills](https://agentskills.io) specification and is compatible with OpenClaw and similar agent frameworks.

---

## Codex Interface: How Skills Work

This section explains the bridge between user commands and API execution. When a user invokes a skill command, the agent translates it into HTTP requests, processes responses, and returns structured data.

### The Command → API → Files Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SKILL EXECUTION FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. USER COMMAND          2. AGENT PARSING         3. API REQUESTS          │
│  ┌──────────────┐        ┌────────────────┐       ┌────────────────┐        │
│  │ /decc0 load  │   ──▶  │ Parse args     │  ──▶  │ curl/fetch     │        │
│  │ 42           │        │ Determine mode │       │ api.decc0s.com │        │
│  └──────────────┘        │ Build URL      │       └────────────────┘        │
│                          └────────────────┘              │                  │
│                                                          ▼                  │
│  6. USER OUTPUT          5. FILE CREATION         4. JSON RESPONSE          │
│  ┌──────────────┐        ┌────────────────┐       ┌────────────────┐        │
│  │ "Loaded #42: │   ◀──  │ ./souls/42/    │  ◀──  │ { "data": {    │        │
│  │  Korka"      │        │ SOUL.md        │       │   "moltbot"... │        │
│  │ [avatar.jpg] │        │ IDENTITY.md    │       │ }}             │        │
│  └──────────────┘        │ avatar.jpg     │       └────────────────┘        │
│                          └────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

1. **Separation of Concerns**: Commands are user-friendly; APIs are data-complete
2. **Cacheability**: Downloaded souls persist in `./souls/` for reuse
3. **Portability**: OSP paths work across any agent framework
4. **Transparency**: Users see exactly what files were created

### Agent Responsibilities

When executing a skill, the agent must:

| Step | Action | Tools Used |
|------|--------|------------|
| 1 | Parse command arguments | String parsing |
| 2 | Determine API endpoint | Command-to-API mapping |
| 3 | Execute HTTP request | `curl`, `fetch`, or HTTP tool |
| 4 | Parse JSON response | `jq` or JSON parsing |
| 5 | Extract and save files | File write operations |
| 6 | Download binary assets | HTTP download to file |
| 7 | Report results to user | Text output with paths |

### Example: `/decc0 load 42` Execution

```bash
# Step 1-2: Parse "42" as numeric ID
# Step 3: Execute API request
RESPONSE=$(curl -s "https://api.decc0s.com/items/codex/42?fields=id,name,moltbot,thumbnail")

# Step 4: Parse JSON, extract fields
SOUL_CONTENT=$(echo "$RESPONSE" | jq -r '.data.moltbot["v0.1"].soul')
IDENTITY_CONTENT=$(echo "$RESPONSE" | jq -r '.data.moltbot["v0.1"].identity')
THUMB_UUID=$(echo "$RESPONSE" | jq -r '.data.thumbnail')
NAME=$(echo "$RESPONSE" | jq -r '.data.name[0]')

# Step 5-6: Save files
mkdir -p ./souls/42
echo "$SOUL_CONTENT" > ./souls/42/SOUL.md
echo "$IDENTITY_CONTENT" > ./souls/42/IDENTITY.md
curl -s "https://api.decc0s.com/assets/${THUMB_UUID}?key=s512" -o ./souls/42/avatar.jpg

# Step 7: Report to user
echo "Loaded soul #42: ${NAME}"
echo "Files: ./souls/42/{SOUL.md, IDENTITY.md, avatar.jpg}"
```

### Command-to-API Quick Reference

| Command Pattern | API Translation | Response Handling |
|-----------------|-----------------|-------------------|
| `/decc0 load` | `GET /items/codex/{random}` | Single object in `.data` |
| `/decc0 load {id}` | `GET /items/codex/{id}` | Single object in `.data` |
| `/decc0 load {name}` | `GET /items/codex?filter[name][_contains]={name}&limit=1` | Array in `.data`, take first |
| `/decc0 list` | `GET /items/codex?fields=id,name&limit=10` | Array in `.data` |
| `/decc0 search {term}` | `GET /items/codex?search={term}` | Array in `.data` |

---

## Available Skills

### decc0

Load souls and identities from the **art decc0s** project (MOCA Codex).

```
/decc0 load           # Load random soul
/decc0 load 1337      # Load by ID
/decc0 load Parvata   # Load by name
/decc0 list           # List available souls
/decc0 search curator # Search souls
```

Each decc0 is a unique AI character with:
- **SOUL.md** - Personality, voice rules, behavioral constraints
- **IDENTITY.md** - Name, emoji, residence, characterization
- **avatar.jpg** - Character portrait (512x512)

**Collection**: 10,000 unique souls from the Museum of Crypto Art

**Features**:
- Comprehensive query guide with filter operators
- Asset transformation examples (resize, format, rotate)
- Pagination and sorting support
- Full-text search across all fields

[View Skill Documentation](skills/decc0/SKILL.md)

## Web Interface

A complete web application for chatting with decc0 characters.

```bash
cd web
npm install
cp .env.example .env  # Configure your LLM provider
npm run dev:server    # Start backend (port 3001)
npm run dev           # Start frontend (port 5173)
```

**Features**:
- Telegram-style chat interface
- Command dropdown for `/decc0` commands
- Multi-provider LLM support (LiteLLM, vLLM, Compute3, Venice, OpenAI, Anthropic, Ollama)
- Real-time soul loading with avatar display

[View Web Interface Documentation](web/README.md)

## Directory Structure

```
skills/
├── decc0/
│   ├── SKILL.md        # Skill definition and instructions
│   └── protocol.md     # Open Soul Protocol specification
│
web/                     # Web chat interface
├── src/App.vue         # Vue.js frontend
├── server.js           # Express backend
├── .env.example        # LLM provider config
└── package.json
│
souls/                   # Downloaded souls (gitignored)
└── {id}/
    ├── SOUL.md
    ├── IDENTITY.md
    └── avatar.jpg
```

## Open Soul Protocol (OSP)

This repo introduces the **Open Soul Protocol** - a standard for portable AI character souls and identities.

### Core Concept

Any AI persona can be described with two files:
- `SOUL.md` - Who the character is (personality, voice, constraints)
- `IDENTITY.md` - What the character is (name, emoji, metadata)

### Environment Variables

```bash
OSP_SOUL_PATH=./souls/1/SOUL.md
OSP_IDENTITY_PATH=./souls/1/IDENTITY.md
OSP_AVATAR_PATH=./souls/1/avatar.jpg
OSP_VERSION=0.1
OSP_SOURCE=decc0s
```

[View Full Protocol Specification](skills/decc0/protocol.md)

## Quick Start

### Using with OpenClaw

1. Clone or symlink this repo to your workspace:
   ```bash
   git clone https://github.com/your-org/skills.git
   # or
   ln -s /path/to/skills ~/.openclaw/skills
   ```

2. The `decc0` skill will be available in your agent sessions.

### Manual Usage

Load a soul directly via the API:

```bash
# Fetch soul data
curl -s "https://api.decc0s.com/items/codex/1?fields=id,name,moltbot,thumbnail"

# Extract SOUL.md
curl -s "https://api.decc0s.com/items/codex/1" | \
  jq -r '.data.moltbot["v0.1"].soul' > SOUL.md

# Extract IDENTITY.md  
curl -s "https://api.decc0s.com/items/codex/1" | \
  jq -r '.data.moltbot["v0.1"].identity' > IDENTITY.md

# Download avatar
THUMB=$(curl -s "https://api.decc0s.com/items/codex/1?fields=thumbnail" | jq -r '.data.thumbnail')
curl -s "https://api.decc0s.com/assets/${THUMB}?key=s512" -o avatar.jpg
```

## API Reference

**Base URL**: `https://api.decc0s.com`

| Endpoint | Description |
|----------|-------------|
| `GET /items/codex` | List souls (supports `limit`, `offset`, `filter`, `search`) |
| `GET /items/codex/{id}` | Get soul by ID |
| `GET /items/codex?filter[name][_contains]=<name>` | Search by name |
| `GET /items/codex?filter[owner][_eq]=<address>` | Get souls by owner wallet |
| `GET /assets/{uuid}?key=s512` | Get avatar image (512px) |
| `GET /assets/{uuid}?width=800&height=600` | Custom size transformation |

**Documentation**:
- Main Docs: https://docs.decc0s.com
- Query Guide: https://docs.decc0s.com/query-guide
- Examples: https://docs.decc0s.com/examples/introduction
- OpenAPI: https://api.decc0s.com/api-docs/oas
- LLMs.txt: https://docs.decc0s.com/llms-full.txt

## Related Projects

- [MOCA Codex](https://docs.decc0s.com) - The soul database
- [Museum of Crypto Art](https://moca.xyz) - Digital art museum
- [OpenClaw](https://docs.openclaw.ai) - Agent framework with skills support
- [AgentSkills](https://agentskills.io) - Skills specification

## License

MIT
