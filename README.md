# Skills

A collection of skills for AI agents, starting with the **decc0** skill for loading souls from the MOCA Codex.

## What are Skills?

Skills are instruction packages that teach AI agents how to perform specific tasks. Each skill is a directory containing a `SKILL.md` file with YAML frontmatter and detailed instructions.

This repository follows the [AgentSkills](https://agentskills.io) specification and is compatible with OpenClaw and similar agent frameworks.

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

[View Skill Documentation](skills/decc0/SKILL.md)

## Directory Structure

```
skills/
├── decc0/
│   ├── SKILL.md        # Skill definition and instructions
│   └── protocol.md     # Open Soul Protocol specification
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
| `GET /assets/{uuid}?key=s512` | Get avatar image (512px) |

**Documentation**: https://docs.decc0s.com

## Related Projects

- [MOCA Codex](https://docs.decc0s.com) - The soul database
- [Museum of Crypto Art](https://moca.xyz) - Digital art museum
- [OpenClaw](https://docs.openclaw.ai) - Agent framework with skills support
- [AgentSkills](https://agentskills.io) - Skills specification

## License

MIT
