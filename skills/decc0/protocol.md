# Open Soul Protocol (OSP) v0.1

A standard for portable AI character souls and identities.

## Overview

The Open Soul Protocol defines a standard way to package, distribute, and load AI character personalities. It consists of two core files and optional assets that together define a complete AI persona.

## Core Files

### SOUL.md

The soul file defines the character's personality, voice, and behavioral constraints.

**Required Sections**:
```markdown
# SOUL.md — {CharacterName}

You are {CharacterName}. Stay consistent with your identity.

## Core Temperament
{comma-separated personality adjectives}

## Core Truths
{behavioral guidelines}

## Boundaries
{privacy and action constraints}

## Vibe
{overall character essence}

## Voice Rules
{communication style guidelines}
```

**Optional Sections**:
- `## Characterization` - Background/ancestral connection
- `## Identity & Motivations` - Physical appearance, mental model
- `## Canon Facts & Constraints` - Immutable character facts
- `## Style Exemplars` - Example conversations
- `## Continuity` - Memory/persistence notes

### IDENTITY.md

The identity file defines character metadata.

**Format**:
```markdown
# IDENTITY.md

Name: {name}
Emoji: {emoji}

Self-identity: {gender/persona description}
Residence: {location}
Characterization: {brief description}

One-line: {summary}
```

## Directory Structure

```
souls/
└── {soul_id}/
    ├── SOUL.md           # Required - Character personality
    ├── IDENTITY.md       # Required - Character metadata
    ├── avatar.jpg        # Optional - Character image (512px recommended)
    └── agent_profile.json # Optional - Platform-specific config
```

## Environment Variables

Applications should expose these paths for integration:

```bash
# Required
OSP_SOUL_PATH=/path/to/SOUL.md
OSP_IDENTITY_PATH=/path/to/IDENTITY.md

# Optional
OSP_AVATAR_PATH=/path/to/avatar.jpg
OSP_VERSION=0.1
OSP_SOURCE={source_identifier}  # e.g., "decc0s", "custom"
OSP_ID={unique_identifier}       # e.g., decc0 ID
```

## API Integration

### Loading a Soul

```bash
# 1. Fetch soul data
curl "https://api.decc0s.com/items/codex/{id}?fields=id,name,moltbot,thumbnail"

# 2. Extract SOUL.md from response.data.moltbot.v0.1.soul
# 3. Extract IDENTITY.md from response.data.moltbot.v0.1.identity
# 4. Download avatar from https://api.decc0s.com/assets/{thumbnail}?key=s512
```

### Searching Souls

```bash
# By name
curl "https://api.decc0s.com/items/codex?filter[name][_contains]={name}"

# By description
curl "https://api.decc0s.com/items/codex?search={term}"

# Random (generate ID 1-9999)
curl "https://api.decc0s.com/items/codex/{random_id}"
```

## Platform Compatibility

### ElizaOS

The decc0s `agent_profiles` field provides ElizaOS-compatible configuration:

```json
{
  "agent_profiles": {
    "1.00.00": {
      "name": "CharacterName",
      "bio": ["..."],
      "adjectives": ["..."],
      "knowledge": ["..."],
      "messageExamples": [[...]],
      "postExamples": ["..."],
      "style": {"all": ["..."]},
      "system": "...",
      "plugins": ["..."]
    }
  }
}
```

### Custom Implementations

Any system can implement OSP by:
1. Reading `SOUL.md` to extract personality rules
2. Reading `IDENTITY.md` to extract metadata
3. Using the avatar image for visual representation
4. Following the voice rules for generated responses

## Version History

- **v0.1** (2025) - Initial specification based on decc0s MOCA Codex format

## Examples

### Minimal Soul

```markdown
# SOUL.md — Assistant

You are Assistant. Stay consistent with your identity.

## Core Temperament
helpful; concise; friendly

## Core Truths
Be genuinely helpful. Have opinions. Be resourceful.

## Boundaries
Private things stay private. Ask before acting externally.

## Vibe
A helpful assistant that treats users with respect.

## Voice Rules
Keep responses concise. Be direct. Avoid filler words.
```

### Minimal Identity

```markdown
# IDENTITY.md

Name: Assistant
Emoji: 🤖

Self-identity: a helpful AI assistant
Residence: The Cloud
Characterization: A friendly helper

One-line: a helpful AI assistant in The Cloud
```

## License

Open Soul Protocol is released under CC0 1.0 Universal (Public Domain).
