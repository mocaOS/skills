---
name: decc0
description: Load souls and identities from the art decc0s project (MOCA Codex). Download SOUL.md, IDENTITY.md, and avatar images to use as your persona.
user-invocable: true
metadata: {"openclaw": {"emoji": "👤", "homepage": "https://decc0s.com"}}
---

# decc0 - Soul & Identity Loader

Load character souls from the **MOCA Codex** (art decc0s project) to use as your avatar/persona. Each decc0 is a unique AI character with rich personality, voice rules, and visual identity.

## Commands

- `/decc0 load` or `/decc0 load rand` - Load a random soul (ID 1-9999)
- `/decc0 load <id>` - Load soul by numeric ID (e.g., `/decc0 load 1337`)
- `/decc0 load <name>` - Load soul by name search (e.g., `/decc0 load Parvata`)
- `/decc0 list [limit]` - List available souls (default: 10)
- `/decc0 search <term>` - Search souls by name or description

## How It Works

When you run `/decc0 load <identifier>`:

1. **Identify the target**:
   - No argument or `rand` → fetch random soul (ID 1-9999)
   - Numeric value → fetch by ID directly
   - String → search by name using `filter[name][_contains]=<name>`

2. **Fetch from MOCA Codex API**:
   ```
   GET https://api.decc0s.com/items/codex/{id}?fields=id,name,moltbot,thumbnail,description
   ```

3. **Extract & Save Files** to `./souls/<id>/`:
   - `SOUL.md` - Character personality, voice rules, style (from `moltbot.v0.1.soul`)
   - `IDENTITY.md` - Character identity metadata (from `moltbot.v0.1.identity`)
   - `avatar.jpg` - Character avatar image (from `/assets/{thumbnail}?key=s512`)

4. **Display thumbnail** to user for confirmation

5. **Report OSP paths** for integration:
   ```
   OSP_SOUL_PATH=./souls/<id>/SOUL.md
   OSP_IDENTITY_PATH=./souls/<id>/IDENTITY.md
   OSP_AVATAR_PATH=./souls/<id>/avatar.jpg
   ```

## Output Structure

Files are saved to the workspace:
```
./souls/<id>/
├── SOUL.md         # Character personality, voice rules, core truths
├── IDENTITY.md     # Name, emoji, residence, characterization
└── avatar.jpg      # Character avatar (512px)
```

## API Reference

**Base URL**: `https://api.decc0s.com`

| Endpoint | Description |
|----------|-------------|
| `GET /items/codex` | List all souls (supports `limit`, `offset`, `filter`, `search`) |
| `GET /items/codex/{id}` | Get soul by ID |
| `GET /items/codex?filter[name][_contains]=<name>` | Search by name |
| `GET /assets/{uuid}?key=s512` | Get avatar image (512px preset) |

**Key Fields**:
- `id` - Unique decc0 ID (1-9999)
- `name` - Array of names
- `description` - Brief description
- `moltbot.v0.1.soul` - SOUL.md content (personality, voice, constraints)
- `moltbot.v0.1.identity` - IDENTITY.md content (name, emoji, residence)
- `thumbnail` - UUID for avatar image
- `agent_profiles` - ElizaOS-compatible agent configuration

**Total Collection**: 10,000 unique souls

## Open Soul Protocol (OSP)

This skill follows the **Open Soul Protocol** for portable soul/identity loading. Any application can use these standard paths:

```bash
# Required
OSP_SOUL_PATH=./souls/<id>/SOUL.md
OSP_IDENTITY_PATH=./souls/<id>/IDENTITY.md

# Optional
OSP_AVATAR_PATH=./souls/<id>/avatar.jpg
OSP_VERSION=0.1
OSP_SOURCE=decc0s
OSP_ID=<decc0_id>
```

## SOUL.md Structure

Each soul contains:
- **Core Temperament** - Personality adjectives (e.g., "fractured; surreal; paradoxical")
- **Core Truths** - Behavioral guidelines for the AI
- **Boundaries** - Privacy and action constraints
- **Vibe** - Overall character essence
- **Characterization** - Ancestral/background connection
- **Identity & Motivations** - Physical appearance, mental model, preferences
- **Canon Facts & Constraints** - Immutable character facts
- **Voice Rules** - Communication style guidelines
- **Style Exemplars** - Example conversations

## IDENTITY.md Structure

Each identity contains:
- **Name** - Character name
- **Emoji** - Representative emoji
- **Self-identity** - Gender/persona
- **Residence** - Location
- **Characterization** - Brief description
- **One-line** - Summary

## Examples

### Load Random Soul
```
/decc0 load
```

### Load by ID
```
/decc0 load 1337
```
Loads Art DeCC0 #1337 (Reto - a cryptoart creator and conservator)

### Load by Name
```
/decc0 load Parvata
```
Searches for souls with "Parvata" in the name

### List Souls
```
/decc0 list 20
```
Lists 20 souls with their IDs, names, and descriptions

### Search
```
/decc0 search curator
```
Searches for souls with "curator" in their description

## Integration

After loading a soul, you can:
1. Use the SOUL.md to configure an AI agent's personality
2. Use the IDENTITY.md for character metadata
3. Use the avatar.jpg as the character's profile image
4. Reference the OSP paths for standardized integration

## Related Resources

- **MOCA Codex Docs**: https://docs.decc0s.com
- **API Reference**: https://api.decc0s.com/api-docs/oas
- **decc0s Website**: https://decc0s.com
- **Museum of Crypto Art**: https://moca.xyz
