---
name: decc0
description: Load souls and identities from the art decc0s project (MOCA Codex). Download SOUL.md, IDENTITY.md, and avatar images to use as your persona.
user-invocable: true
metadata: {"openclaw": {"emoji": "👤", "homepage": "https://decc0s.com"}}
---

# decc0 - Soul & Identity Loader

Load character souls from the **MOCA Codex** (art decc0s project) to use as your avatar/persona. Each decc0 is a unique AI character with rich personality, voice rules, and visual identity.

---

## Codex Interface

This section explains how agent commands map to API calls. When the user invokes a `/decc0` command, the agent must translate it into the appropriate HTTP requests to the MOCA Codex API.

### Architecture Overview

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

Each command translates to specific API calls. The agent executes these using bash `curl` or equivalent HTTP tools.

| Command | API Call(s) | Purpose |
|---------|-------------|---------|
| `/decc0 load` | `GET /items/codex/{random_1-9999}?fields=id,name,moltbot,thumbnail` | Load random soul |
| `/decc0 load 42` | `GET /items/codex/42?fields=id,name,moltbot,thumbnail` | Load soul by ID |
| `/decc0 load Korka` | `GET /items/codex?filter[name][_contains]=Korka&limit=1` | Search by name, take first |
| `/decc0 list` | `GET /items/codex?fields=id,name,description&limit=10` | List souls |
| `/decc0 list 50` | `GET /items/codex?fields=id,name,description&limit=50` | List N souls |
| `/decc0 search curator` | `GET /items/codex?search=curator&fields=id,name,description` | Full-text search |

### Execution Flow

When the agent receives a `/decc0` command, follow this execution pattern:

#### Step 1: Parse Command Arguments

```python
# Pseudocode for command parsing
command = "/decc0 load 42"
parts = command.split()
action = parts[1]  # "load"
arg = parts[2] if len(parts) > 2 else None  # "42"

# Determine argument type
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
# Get soul ID
jq -r '.data.id' response.json

# Get character name
jq -r '.data.name[0]' response.json

# Get SOUL.md content
jq -r '.data.moltbot["v0.1"].soul' response.json

# Get IDENTITY.md content
jq -r '.data.moltbot["v0.1"].identity' response.json

# Get thumbnail UUID for avatar
jq -r '.data.thumbnail' response.json
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

# Download avatar (get thumbnail UUID, then fetch asset)
THUMB=$(curl -s "https://api.decc0s.com/items/codex/${SOUL_ID}?fields=thumbnail" | jq -r '.data.thumbnail')
curl -s "https://api.decc0s.com/assets/${THUMB}?key=s512" -o ./souls/${SOUL_ID}/avatar.jpg
```

#### Step 5: Report Results to User

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

**Load by ID (all in one):**
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

### Error Handling

| Scenario | API Response | Agent Action |
|----------|--------------|--------------|
| ID not found | `{"errors": [...]}` or empty data | Report "Soul #{id} not found" |
| Name not found | `{"data": []}` (empty array) | Report "No soul found matching '{name}'" |
| Network error | Connection timeout | Retry once, then report error |
| Invalid moltbot | `moltbot` is null | Report "Soul #{id} has no personality data" |

Check for errors:
```bash
# Check if response has errors
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

---

## Query Guide

Master the powerful query capabilities of the MOCA Codex API using Directus conventions.

### Query Parameters Overview

| Parameter | Description | Example |
|-----------|-------------|---------|
| `fields` | Select specific fields | `?fields=id,name` |
| `filter` | Apply filter conditions | `?filter[name][_eq]=Korka` |
| `sort` | Order results | `?sort=-created_on` |
| `limit` | Maximum results | `?limit=25` |
| `offset` | Skip results (pagination) | `?offset=50` |
| `search` | Full-text search | `?search=curator` |
| `meta` | Include metadata | `?meta=*` |

### Field Selection

Use the `fields` parameter to request only the data you need:

```bash
# Basic field selection
GET /items/codex?fields=id,name,description

# Nested fields (dot notation)
GET /items/codex?fields=id,name,moltbot.v0.1.soul

# All fields (omit parameter)
GET /items/codex
```

**Performance Tip**: Always specify only the fields you need to reduce response size.

### Filter Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `_eq` | Equals | `filter[name][_eq]=Korka` |
| `_neq` | Not equals | `filter[name][_neq]=Korka` |
| `_lt` | Less than | `filter[id][_lt]=100` |
| `_lte` | Less than or equal | `filter[id][_lte]=100` |
| `_gt` | Greater than | `filter[id][_gt]=50` |
| `_gte` | Greater than or equal | `filter[id][_gte]=50` |
| `_in` | In array | `filter[id][_in]=1,2,3` |
| `_nin` | Not in array | `filter[id][_nin]=1,2,3` |
| `_null` | Is null | `filter[ancestor][_null]=true` |
| `_nnull` | Is not null | `filter[ancestor][_nnull]=true` |
| `_contains` | Contains substring | `filter[name][_contains]=ork` |
| `_ncontains` | Doesn't contain | `filter[name][_ncontains]=test` |
| `_starts_with` | Starts with | `filter[name][_starts_with]=Ko` |
| `_ends_with` | Ends with | `filter[name][_ends_with]=ka` |
| `_between` | Between values | `filter[id][_between]=10,50` |
| `_empty` | Is empty | `filter[tags][_empty]=true` |
| `_nempty` | Is not empty | `filter[tags][_nempty]=true` |

### Logical Operators

**AND Operator** - All conditions must be true:
```bash
GET /items/codex?filter={"_and":[{"id":{"_gte":1}},{"name":{"_nnull":true}}]}
```

**OR Operator** - At least one condition must be true:
```bash
GET /items/codex?filter={"_or":[{"name":{"_eq":"Korka"}},{"name":{"_eq":"Aria"}}]}
```

**Complex Nesting**:
```json
{
  "_and": [
    { "owner": { "_eq": "0x614a..." } },
    {
      "_or": [
        { "id": { "_lt": 100 } },
        { "id": { "_gt": 200 } }
      ]
    }
  ]
}
```

### Sorting

```bash
# Ascending order
GET /items/codex?sort=name

# Descending order (prefix with -)
GET /items/codex?sort=-timestamp_created

# Multiple sort fields
GET /items/codex?sort=-timestamp_created,name
```

### Pagination

```bash
# First page (items 1-10)
GET /items/codex?limit=10&offset=0

# Second page (items 11-20)
GET /items/codex?limit=10&offset=10

# With metadata for pagination UI
GET /items/codex?limit=10&offset=0&meta=*
```

Response with metadata:
```json
{
  "data": [...],
  "meta": {
    "filter_count": 42,
    "total_count": 10000
  }
}
```

### Full-Text Search

```bash
GET /items/codex?search=curator
```

### Combining Parameters

```bash
GET /items/codex?fields=id,name,description&filter[ancestor][_nnull]=true&sort=-timestamp_created&limit=10&offset=0&meta=*
```

This query:
- Returns only `id`, `name`, and `description` fields
- Filters for items with non-null ancestors
- Sorts by creation date (newest first)
- Returns first 10 results
- Includes metadata

---

## API Examples

### Common Codex Queries

| Use Case | Example |
|----------|---------|
| List items | `GET /items/codex?fields=id,name&limit=10` |
| Get by ID | `GET /items/codex/1` |
| Filter by owner | `GET /items/codex?filter[owner][_eq]=0x...` |
| Search | `GET /items/codex?search=curator` |
| Sort by date | `GET /items/codex?sort=-timestamp_created` |
| Paginate | `GET /items/codex?limit=10&offset=20&meta=*` |

### Asset Transformations

| Use Case | Example |
|----------|---------|
| Preset resize (512px) | `GET /assets/{id}?key=s512` |
| Custom size | `GET /assets/{id}?width=800&height=600` |
| Format conversion | `GET /assets/{id}?format=webp&quality=80` |
| Rotate image | `GET /assets/{id}?transforms=[["rotate",90]]` |

### Filter Examples

**Get soul by exact name:**
```bash
GET /items/codex?filter[name][_eq]=Korka
```

**Get souls with description containing "curator":**
```bash
GET /items/codex?filter[description][_contains]=curator
```

**Get souls with ID greater than 100:**
```bash
GET /items/codex?filter[id][_gt]=100
```

**Get souls with non-null ancestor:**
```bash
GET /items/codex?filter[ancestor][_nnull]=true
```

**Get souls by owner wallet:**
```bash
GET /items/codex?filter[owner][_eq]=0x614a61d616cdceee66edf5c773b35e71723154f5
```

**Important**: Always use **lowercase** for Ethereum addresses.

### Complete Soul Fetch Example

```bash
# 1. Fetch soul data with specific fields
curl -s "https://api.decc0s.com/items/codex/1?fields=id,name,moltbot,thumbnail,description"

# 2. Extract SOUL.md content
curl -s "https://api.decc0s.com/items/codex/1" | jq -r '.data.moltbot["v0.1"].soul'

# 3. Extract IDENTITY.md content
curl -s "https://api.decc0s.com/items/codex/1" | jq -r '.data.moltbot["v0.1"].identity'

# 4. Download avatar (512px preset)
THUMB=$(curl -s "https://api.decc0s.com/items/codex/1?fields=thumbnail" | jq -r '.data.thumbnail')
curl -s "https://api.decc0s.com/assets/${THUMB}?key=s512" -o avatar.jpg
```

### Random Soul Selection

```bash
# Generate random ID between 1-9999
RANDOM_ID=$((RANDOM % 9999 + 1))
curl -s "https://api.decc0s.com/items/codex/${RANDOM_ID}?fields=id,name,moltbot,thumbnail"
```

### Batch Operations

```bash
# Get first 100 souls with pagination metadata
curl -s "https://api.decc0s.com/items/codex?fields=id,name&limit=100&meta=*"

# Get souls 101-200
curl -s "https://api.decc0s.com/items/codex?fields=id,name&limit=100&offset=100"
```

---

## API Reference

**Base URL**: `https://api.decc0s.com`

| Endpoint | Description |
|----------|-------------|
| `GET /items/codex` | List all souls (supports `limit`, `offset`, `filter`, `search`) |
| `GET /items/codex/{id}` | Get soul by ID |
| `GET /items/codex?filter[name][_contains]=<name>` | Search by name |
| `GET /items/codex?filter[owner][_eq]=<address>` | Get souls by owner wallet |
| `GET /assets/{uuid}` | Get asset (original) |
| `GET /assets/{uuid}?key=s512` | Get avatar image (512px preset) |
| `GET /files/{uuid}` | Get file metadata |

**Key Fields**:
- `id` - Unique decc0 ID (1-9999)
- `name` - Array of names
- `description` - Brief description
- `biography` - Detailed character biography
- `ancestor` - Ancestral archetype
- `owner` - Ethereum wallet address (lowercase)
- `moltbot.v0.1.soul` - SOUL.md content (personality, voice, constraints)
- `moltbot.v0.1.identity` - IDENTITY.md content (name, emoji, residence)
- `thumbnail` - UUID for avatar image
- `thumbnail_background` - UUID for background image
- `thumbnail_character` - UUID for character image
- `agent_profiles` - ElizaOS-compatible agent configuration
- `artstyle_loved` - Favorite art style
- `artstyle_liked` - Liked art style
- `artstyle_disliked` - Disliked art style
- `background_category` - Background art category
- `background_texture` - Background texture type

**Total Collection**: 10,000 unique souls

---

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

---

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
- **Continuity** - Memory/persistence notes

## IDENTITY.md Structure

Each identity contains:
- **Name** - Character name
- **Emoji** - Representative emoji
- **Self-identity** - Gender/persona
- **Residence** - Location
- **Characterization** - Brief description
- **One-line** - Summary

---

## Command Examples

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

---

## Integration

After loading a soul, you can:
1. Use the SOUL.md to configure an AI agent's personality
2. Use the IDENTITY.md for character metadata
3. Use the avatar.jpg as the character's profile image
4. Reference the OSP paths for standardized integration

---

## Best Practices

### Do
- Use field selection to minimize response size
- Include `meta=*` when building pagination UI
- Use specific filters instead of fetching all data
- Use **lowercase** for Ethereum addresses
- URL-encode special characters in filter values

### Don't
- Fetch all fields when you only need a few
- Use high limits without pagination
- Forget to URL-encode special characters
- Use case-sensitive matching for wallet addresses

---

## Related Resources

- **MOCA Codex Docs**: https://docs.decc0s.com
- **Query Guide**: https://docs.decc0s.com/query-guide
- **API Examples**: https://docs.decc0s.com/examples/introduction
- **API Reference (OpenAPI)**: https://api.decc0s.com/api-docs/oas
- **LLMs.txt**: https://docs.decc0s.com/llms-full.txt
- **decc0s Website**: https://decc0s.com
- **Museum of Crypto Art**: https://moca.xyz
