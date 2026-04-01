---
name: art-decc0s
description: Load souls from the Art DeCC0s project (MOCA Codex). Extract SOUL.md files and rich character data (biography, ancestry, art preferences, visual assets) from 10,000 unique AI personas. Use when user mentions decc0s, Art DeCC0s, souls, MOCA Codex, or loading AI characters.
user-invocable: true
license: CC0-1.0
compatibility: Requires curl, jq, and internet access to api.decc0s.com
metadata:
  author: "Museum of Crypto Art"
  display-name: "Art DeCC0s"
  emoji: "👤"
  homepage: "https://codex.decc0s.com"
  version: "0.2"
allowed-tools: Bash(curl:*) Bash(jq:*) Bash(mkdir:*) Read Write
---

# Art DeCC0s - Soul Loader

Load character souls from the **MOCA Codex** (Art DeCC0s project) to use as your avatar/persona. Each Art DeCC0 is a unique AI character with rich personality, voice rules, and visual identity. The collection contains **10,000 unique souls**.

The **SOUL.md** file is the widely adopted standard for defining AI character personality and voice — used across agent harnesses like Hermes Agent, OpenClaw, and others. This skill extracts SOUL.md from each decc0's Codex entry.

### Beyond SOUL.md — The Full Codex Entry

Each Art DeCC0's Codex entry is a rich data record that extends far beyond the SOUL.md file. The API returns the full cortex of each character including: biography, ancestry, art style preferences, visual assets (avatar, background, character images), behavioral characteristics (`whatness`), owner provenance, ElizaOS-compatible agent profiles, and versioned personality data. The SOUL.md and IDENTITY.md files are extracted from the `moltbot` field, but the rest of the Codex entry is available for deeper integration. See the [API Reference](references/API-REFERENCE.md) for the complete schema.

---

## Commands

- `/decc0 load` or `/decc0 load rand` — Load a random soul (ID 1-9999)
- `/decc0 load <id>` — Load soul by numeric ID (e.g., `/decc0 load 1337`)
- `/decc0 load <name>` — Load soul by name search (e.g., `/decc0 load Parvata`)
- `/decc0 list [limit]` — List available souls (default: 10)
- `/decc0 search <term>` — Search souls by name or description

---

## Codex Interface

This section explains how agent commands map to API calls. When the user invokes a `/decc0` command, translate it into HTTP requests to the MOCA Codex API.

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  User Command   │ ──▶ │  Agent (You)     │ ──▶ │  MOCA Codex API     │
│  /decc0 load 42 │     │  Parse & Execute │     │  api.decc0s.com     │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
                               │                          │
                               │   1. curl/fetch API      │
                               │   2. Parse JSON response │
                               │   3. Extract files       │
                               │   4. Save to workspace   │
                               ▼                          ▼
                        ┌──────────────────┐     ┌─────────────────────┐
                        │  ./souls/{id}/   │ ◀── │  Response JSON      │
                        │  SOUL.md         │     │  { data: {...} }    │
                        │  IDENTITY.md     │     └─────────────────────┘
                        │  avatar.jpg      │
                        └──────────────────┘
```

### Command-to-API Mapping

| Command | API Call | Purpose |
|---------|----------|---------|
| `/decc0 load` | `GET /items/codex/{random_1-9999}?fields=id,name,moltbot,thumbnail` | Load random soul |
| `/decc0 load 42` | `GET /items/codex/42?fields=id,name,moltbot,thumbnail` | Load soul by ID |
| `/decc0 load Korka` | `GET /items/codex?filter[name][_contains]=Korka&limit=1` | Search by name, take first |
| `/decc0 list` | `GET /items/codex?fields=id,name,description&limit=10` | List souls |
| `/decc0 list 50` | `GET /items/codex?fields=id,name,description&limit=50` | List N souls |
| `/decc0 search curator` | `GET /items/codex?search=curator&fields=id,name,description` | Full-text search (no limit — API is performant) |

### Execution Flow

#### Step 1: Parse Command Arguments

```python
# Pseudocode for command parsing
command = "/decc0 load 42"
parts = command.split()
action = parts[1]  # "load"
arg = parts[2] if len(parts) > 2 else None  # "42"

if arg is None or arg == "rand":
    mode = "random"
elif arg.isdigit():
    mode = "by_id"
    soul_id = int(arg)
else:
    mode = "by_name"
    search_term = arg
```

#### Step 2: Construct API Request

**Base URL**: `https://api.decc0s.com`

```bash
# Random soul (generate ID 1-9999)
SOUL_ID=$((RANDOM % 9999 + 1))
curl -s "https://api.decc0s.com/items/codex/${SOUL_ID}?fields=id,name,moltbot,thumbnail"

# By ID
curl -s "https://api.decc0s.com/items/codex/42?fields=id,name,moltbot,thumbnail"

# By name (search, take first result)
curl -s "https://api.decc0s.com/items/codex?filter[name][_contains]=Korka&fields=id,name,moltbot,thumbnail&limit=1"
```

#### Step 3: Parse Response & Extract Data

The API returns JSON with this structure:

```json
{
  "data": {
    "id": 42,
    "name": ["Korka"],
    "thumbnail": "uuid-string-here",
    "moltbot": {
      "v0.1": {
        "soul": "# SOUL.md — Korka\n\nYou are Korka...",
        "identity": "# IDENTITY.md\n\nName: Korka\nEmoji: 🎭..."
      }
    }
  }
}
```

Extract with `jq`:

```bash
jq -r '.data.id' response.json              # Soul ID
jq -r '.data.name[0]' response.json         # Character name
jq -r '.data.moltbot["v0.1"].soul' response.json     # SOUL.md content
jq -r '.data.moltbot["v0.1"].identity' response.json  # IDENTITY.md content
jq -r '.data.thumbnail' response.json       # Thumbnail UUID for avatar
```

#### Step 4: Save Files to Workspace

```bash
SOUL_ID=42
mkdir -p ./souls/${SOUL_ID}

# Save SOUL.md
curl -s "https://api.decc0s.com/items/codex/${SOUL_ID}" | \
  jq -r '.data.moltbot["v0.1"].soul' > ./souls/${SOUL_ID}/SOUL.md

# Save IDENTITY.md
curl -s "https://api.decc0s.com/items/codex/${SOUL_ID}" | \
  jq -r '.data.moltbot["v0.1"].identity' > ./souls/${SOUL_ID}/IDENTITY.md

# Download avatar (get thumbnail UUID, then fetch asset at 512px preset)
THUMB=$(curl -s "https://api.decc0s.com/items/codex/${SOUL_ID}?fields=thumbnail" | jq -r '.data.thumbnail')
curl -s "https://api.decc0s.com/assets/${THUMB}?key=s512" -o ./souls/${SOUL_ID}/avatar.jpg
```

#### Step 5: Report Results

After saving files, report:

```
Loaded soul #42: Korka

Files saved to ./souls/42/:
  - SOUL.md (personality, voice rules)
  - IDENTITY.md (name, emoji, residence)
  - avatar.jpg (512x512 portrait)

OSP_SOUL_PATH=./souls/42/SOUL.md
OSP_IDENTITY_PATH=./souls/42/IDENTITY.md
OSP_AVATAR_PATH=./souls/42/avatar.jpg
```

### Complete Single-Command Examples

**Load by ID:**
```bash
ID=42 && mkdir -p ./souls/${ID} && \
curl -s "https://api.decc0s.com/items/codex/${ID}" | tee /tmp/soul.json | \
jq -r '.data.moltbot["v0.1"].soul' > ./souls/${ID}/SOUL.md && \
jq -r '.data.moltbot["v0.1"].identity' < /tmp/soul.json > ./souls/${ID}/IDENTITY.md && \
curl -s "https://api.decc0s.com/assets/$(jq -r '.data.thumbnail' < /tmp/soul.json)?key=s512" \
  -o ./souls/${ID}/avatar.jpg && \
echo "Loaded: $(jq -r '.data.name[0]' < /tmp/soul.json) (#${ID})"
```

**Load random:**
```bash
ID=$((RANDOM % 9999 + 1)) && mkdir -p ./souls/${ID} && \
curl -s "https://api.decc0s.com/items/codex/${ID}" | tee /tmp/soul.json | \
jq -r '.data.moltbot["v0.1"].soul' > ./souls/${ID}/SOUL.md && \
jq -r '.data.moltbot["v0.1"].identity' < /tmp/soul.json > ./souls/${ID}/IDENTITY.md && \
curl -s "https://api.decc0s.com/assets/$(jq -r '.data.thumbnail' < /tmp/soul.json)?key=s512" \
  -o ./souls/${ID}/avatar.jpg && \
echo "Loaded: $(jq -r '.data.name[0]' < /tmp/soul.json) (#${ID})"
```

**Search by name:**
```bash
NAME="Korka" && \
RESULT=$(curl -s "https://api.decc0s.com/items/codex?filter[name][_contains]=${NAME}&limit=1") && \
ID=$(echo "$RESULT" | jq -r '.data[0].id') && \
mkdir -p ./souls/${ID} && \
curl -s "https://api.decc0s.com/items/codex/${ID}" | tee /tmp/soul.json | \
jq -r '.data.moltbot["v0.1"].soul' > ./souls/${ID}/SOUL.md && \
jq -r '.data.moltbot["v0.1"].identity' < /tmp/soul.json > ./souls/${ID}/IDENTITY.md && \
curl -s "https://api.decc0s.com/assets/$(jq -r '.data.thumbnail' < /tmp/soul.json)?key=s512" \
  -o ./souls/${ID}/avatar.jpg && \
echo "Loaded: $(jq -r '.data.name[0]' < /tmp/soul.json) (#${ID})"
```

---

## Error Handling

| Scenario | API Response | Agent Action |
|----------|--------------|--------------|
| ID not found | `{"errors": [{"message": "Item not found", "extensions": {"code": "NOT_FOUND"}}]}` | Report "Soul #{id} not found" |
| Name not found | `{"data": []}` (empty array) | Report "No soul found matching '{name}'" |
| Network error | Connection timeout | Retry once, then report error |
| Invalid moltbot | `moltbot` is null | Report "Soul #{id} has no personality data" |
| Bad request | `{"errors": [{"extensions": {"code": "BAD_REQUEST"}}]}` | Check filter syntax |

```bash
# Check for errors
if echo "$RESPONSE" | jq -e '.errors' > /dev/null 2>&1; then
  echo "Error: $(echo "$RESPONSE" | jq -r '.errors[0].message')"
  exit 1
fi

# Check if data exists
if [ "$(echo "$RESPONSE" | jq -r '.data')" = "null" ]; then
  echo "Error: Soul not found"
  exit 1
fi
```

---

## Output Structure

Files are saved to the workspace:

```
./souls/<id>/
├── SOUL.md         # Character personality, voice rules, core truths
├── IDENTITY.md     # Name, emoji, residence, characterization
└── avatar.jpg      # Character avatar (512px)
```

---

## SOUL.md Structure

SOUL.md is the primary file and the widely adopted standard across agent harnesses (Hermes Agent, OpenClaw, etc.) for defining an AI character's personality. Each soul contains:

- **Core Temperament** — Personality adjectives (e.g., "fractured; surreal; paradoxical")
- **Core Truths** — Behavioral guidelines for the AI
- **Boundaries** — Privacy and action constraints
- **Vibe** — Overall character essence
- **Characterization** — Ancestral/background connection
- **Identity & Motivations** — Physical appearance, mental model, preferences
- **Canon Facts & Constraints** — Immutable character facts
- **Voice Rules** — Communication style guidelines
- **Style Exemplars** — Example conversations
- **Continuity** — Memory/persistence notes

## IDENTITY.md Structure

IDENTITY.md is a supplementary metadata file extracted alongside SOUL.md. It provides structured character metadata that can be useful for UI display, agent configuration, or indexing — but is not required for embodying the character. The SOUL.md alone is sufficient for most agent harnesses.

- **Name** — Character name
- **Emoji** — Representative emoji
- **Self-identity** — Gender/persona
- **Residence** — Location
- **Characterization** — Brief description
- **One-line** — Summary

---

## Open Soul Protocol (OSP)

This skill follows the **Open Soul Protocol** for portable soul/identity loading. See [protocol.md](protocol.md) for the full specification.

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

---

## Gotchas

- **Lowercase Ethereum addresses**: Owner addresses **must be lowercase** when filtering. The blockchain is case-insensitive, but Directus requires lowercase for consistent querying. `filter[owner][_eq]=0x614A...` won't match — use `filter[owner][_eq]=0x614a...`.
- **Name field is an array**: The `name` field returns an array (e.g., `["Korka"]`), not a plain string. Use `jq -r '.data.name[0]'` to extract the first name.
- **Moltbot versioning**: Soul/identity data lives under version keys (e.g., `v0.1`). Multiple versions can coexist — always use the latest version key. New versions are added without overwriting previous ones.
- **ID range**: Valid IDs are 1-9999. Requesting an ID outside this range returns a 404.
- **URL-encode special characters**: When using JSON filter syntax in URLs, URL-encode the filter parameter. Use bracket notation for simpler queries.
- **String filters are case-sensitive**: Use `_icontains` instead of `_contains` for case-insensitive substring matching.
- **Apes & Aliens are hidden in the background**: Ape and Alien characters are ultra rare Pixel DeCC0s. Their character type is "Pixel DeCC0" — their true nature (ape, alien) is revealed in the `background_category` field. To find them, filter on `background_category` (e.g., `filter[background_category][_icontains]=alien` or `filter[background_category][_icontains]=ape`).
- **Don't paginate or limit filter queries unnecessarily**: The API performs well. When filtering by traits like character, DNA, background, mood, etc., do NOT add `limit` — fetch all matching results in one call. Adding limits means you'll see partial results, realize there are more, and have to query again, which is slower than just getting everything at once.

---

## Integration

After loading a soul, you can:
1. Use the **SOUL.md** to configure an AI agent's personality (works with Hermes Agent, OpenClaw, and other harnesses)
2. Use the IDENTITY.md for supplementary character metadata (optional — SOUL.md is sufficient for most uses)
3. Use the avatar.jpg as the character's profile image
4. Reference the OSP paths for standardized integration
5. Query the full Codex entry for richer data: biography, ancestry, art preferences, `whatness` traits, `agent_profiles` (ElizaOS-compatible), owner provenance, and additional visual assets

---

## References

For advanced querying and full API details, read these on demand:

- [Query Guide](references/QUERY-GUIDE.md) — Filtering, sorting, pagination, and search using Directus conventions
- [API Reference](references/API-REFERENCE.md) — Complete endpoint documentation, schemas, and asset transformations

## External Resources

- **MOCA Codex Docs**: https://docs.decc0s.com
- **API Reference (OpenAPI)**: https://api.decc0s.com/api-docs/oas
- **LLMs.txt**: https://docs.decc0s.com/llms-full.txt
- **decc0s Website**: https://codex.decc0s.com
- **Museum of Crypto Art**: https://moca.xyz
