# API Reference

Complete endpoint documentation for the MOCA Codex API.

**Base URL**: `https://api.decc0s.com`

Built on [Directus](https://docs.directus.io/reference/query.html), an open-source headless CMS. All filtering, querying, and data operations follow Directus conventions.

Each Art DeCC0's Codex entry is a rich data record — far more than just a SOUL.md file. The full entry includes biography, ancestry, art style preferences, behavioral characteristics, visual assets, owner provenance, ElizaOS-compatible agent profiles, and versioned personality data. The SOUL.md (extracted from `moltbot`) is the most commonly used artifact, but the entire Codex entry is queryable.

---

## Endpoints

### Codex Operations

| Endpoint | Description |
|----------|-------------|
| `GET /items/codex` | List all codex items (supports `fields`, `limit`, `offset`, `page`, `filter`, `search`, `sort`, `meta`) |
| `GET /items/codex/{id}` | Get a specific codex item by ID (supports `fields`, `meta`) |

### File Operations

| Endpoint | Description |
|----------|-------------|
| `GET /files` | List files with metadata (supports `fields`, `limit`, `offset`, `sort`, `filter`, `search`, `meta`) |
| `GET /files/{id}` | Get file metadata by UUID |

### Asset Operations

| Endpoint | Description |
|----------|-------------|
| `GET /assets/{id}` | Get file content (original) |
| `GET /assets/{id}?key={preset}` | Get file with preset transformation |
| `GET /assets/{id}?width=W&height=H` | Get file with custom transformation |

---

## Codex Item Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Unique incremental identifier (1-9999) |
| `name` | array | Entity name(s) — returns as array, e.g. `["Korka"]` |
| `ancestor` | string | Ancestral or origin information |
| `description` | string | Brief description |
| `biography` | string | Detailed biographical information |
| `whatness` | array | Array of characteristics or roles (e.g., `["curator", "philosopher"]`) |
| `artstyle_loved` | string | Favorite art style |
| `artstyle_liked` | string | Liked art style |
| `artstyle_disliked` | string | Disliked art style |
| `owner` | string | Ethereum wallet address (always lowercase) |
| `moltbot` | object | Versioned soul and identity data (see below) |
| `thumbnail` | string (UUID) | Avatar image file ID |
| `thumbnail_background` | string (UUID) | Background image file ID |
| `thumbnail_character` | string (UUID) | Character image file ID |
| `background_category` | string | Background art category |
| `background_texture` | string | Background texture type |
| `agent_profiles` | object | ElizaOS-compatible agent configuration |
| `timestamp_created` | datetime | Creation timestamp |
| `timestamp_updated` | datetime | Last update timestamp |

---

## Moltbot Data

The `moltbot` field contains versioned personality and identity data used by AI agents to embody the character's voice and persona.

### Structure

```json
{
  "v0.1": {
    "soul": "# SOUL.md — EntityName\n\nYou are EntityName...",
    "identity": "# IDENTITY.md\n\nName: EntityName\n..."
  }
}
```

### Version Keys

Each version key (e.g., `v0.1`, `v0.2`) contains:

| Field | Type | Description |
|-------|------|-------------|
| `soul` | string | Full SOUL.md content — character personality, voice rules, and behavior |
| `identity` | string | Full IDENTITY.md content — name, emoji, residence, and characterization |

Multiple versions can coexist. New versions are added without overwriting previous ones, allowing for character evolution tracking.

### Example

```bash
curl -s "https://api.decc0s.com/items/codex/1?fields=id,name,moltbot"
```

```json
{
  "data": {
    "id": 1,
    "name": ["Parvata"],
    "moltbot": {
      "v0.1": {
        "soul": "# SOUL.md — Parvata\n\nYou are Parvata. Stay consistent with your identity.\n\n## Core Temperament\nfractured; surreal; paradoxical...",
        "identity": "# IDENTITY.md\n\nName: Parvata\nEmoji: 🌊\n\nSelf-identity: a male person\nResidence: Cairo, Cairo Governorate, Egypt..."
      }
    }
  }
}
```

---

## File Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (UUID) | Unique identifier |
| `storage` | string | Storage location identifier |
| `filename_disk` | string | Name of the file on disk |
| `filename_download` | string | Name used when downloading |
| `title` | string | User-defined title |
| `type` | string | MIME type (e.g., `image/jpeg`) |
| `folder` | string | Folder identifier |
| `uploaded_by` | string | User who uploaded the file |
| `created_on` | datetime | Upload timestamp |
| `modified_on` | datetime | Last modification timestamp |
| `filesize` | integer | File size in bytes |
| `width` | integer | Image width in pixels |
| `height` | integer | Image height in pixels |
| `duration` | integer | Duration for audio/video in seconds |
| `description` | string | File description |
| `location` | string | Geographic location |
| `tags` | array | Array of tags |
| `metadata` | object | Extracted metadata (Exif, IPTC, ICC) |
| `focal_point_x` | number | Focal point X coordinate |
| `focal_point_y` | number | Focal point Y coordinate |

---

## Asset Transformations

### Presets

Pre-configured presets for quick resizing (maintains aspect ratio):

| Preset | Width | Use Case |
|--------|-------|----------|
| `s128` | 128px | Thumbnails, avatars |
| `s256` | 256px | Small previews |
| `s512` | 512px | Medium previews, cards |
| `s1024` | 1024px | Large images, hero sections |

```bash
# 512px avatar
GET /assets/{uuid}?key=s512

# 128px thumbnail
GET /assets/{uuid}?key=s128
```

### Custom Transformations

| Parameter | Type | Description |
|-----------|------|-------------|
| `width` | integer | Target width in pixels |
| `height` | integer | Target height in pixels |
| `quality` | integer | Compression quality (1-100) |
| `fit` | string | How image fits dimensions (see below) |
| `format` | string | Output format: `jpeg`, `png`, `webp`, `avif`, `tiff` |
| `withoutEnlargement` | boolean | Don't upscale small images |

#### Fit Modes

| Mode | Description |
|------|-------------|
| `cover` | Crop to fill exact dimensions (default) |
| `contain` | Fit within dimensions, may letterbox |
| `inside` | Like contain, but never upscale |
| `outside` | Like cover, but never downscale |

```bash
# Custom size with format conversion
GET /assets/{uuid}?width=800&height=600&fit=cover&format=webp&quality=80

# Square thumbnail
GET /assets/{uuid}?width=200&height=200&fit=cover
```

### Sharp Transformations

Advanced image processing using the Sharp library via the `transforms` parameter (JSON array of operations):

| Operation | Arguments | Description |
|-----------|-----------|-------------|
| `rotate` | `degrees` | Rotate image (90, 180, 270) |
| `blur` | `sigma` | Gaussian blur (0.3-1000) |
| `sharpen` | `sigma?`, `flat?`, `jagged?` | Sharpen image |
| `flip` | — | Flip vertically |
| `flop` | — | Flip horizontally |
| `grayscale` | — | Convert to grayscale |
| `negate` | — | Invert colors |
| `normalize` | — | Enhance contrast |
| `gamma` | `gamma` | Adjust gamma (1.0-3.0) |
| `tint` | `{r,g,b}` | Apply color tint |

```bash
# Rotate 90 degrees
GET /assets/{uuid}?transforms=[["rotate",90]]

# Grayscale + sharpen
GET /assets/{uuid}?transforms=[["grayscale"],["sharpen"]]

# Combine with standard parameters
GET /assets/{uuid}?width=800&format=webp&transforms=[["grayscale"],["sharpen"]]
```

Transformations are applied in the order specified.

---

## Common Queries

### Codex

| Use Case | Example |
|----------|---------|
| List items | `GET /items/codex?fields=id,name&limit=10` |
| Get by ID | `GET /items/codex/1` |
| Filter by name | `GET /items/codex?filter[name][_contains]=Korka` |
| Filter by owner | `GET /items/codex?filter[owner][_eq]=0x...` (lowercase!) |
| Full-text search | `GET /items/codex?search=curator` |
| Sort by date | `GET /items/codex?sort=-timestamp_created` |
| Paginate | `GET /items/codex?limit=10&offset=20&meta=*` |
| Non-null ancestor | `GET /items/codex?filter[ancestor][_nnull]=true` |
| ID range | `GET /items/codex?filter[id][_between]=100,200` |

### Files

| Use Case | Example |
|----------|---------|
| List files | `GET /files?fields=id,title,type&limit=10` |
| Images only | `GET /files?filter[type][_starts_with]=image/` |
| Recent uploads | `GET /files?sort=-created_on&limit=5` |
| Get metadata | `GET /files/{uuid}` |
| Filter by date | `GET /files?filter[created_on][_gte]=2024-01-01` |

### Assets

| Use Case | Example |
|----------|---------|
| Original | `GET /assets/{uuid}` |
| Preset resize | `GET /assets/{uuid}?key=s512` |
| Custom size | `GET /assets/{uuid}?width=800&height=600` |
| Format conversion | `GET /assets/{uuid}?format=webp&quality=80` |
| Rotate | `GET /assets/{uuid}?transforms=[["rotate",90]]` |

---

## Response Structure

### Success

```json
{
  "data": { ... },
  "meta": {
    "filter_count": 42,
    "total_count": 10000
  }
}
```

List endpoints return `data` as an array; single-item endpoints return `data` as an object.

### Errors

```json
{
  "errors": [
    {
      "message": "Item not found",
      "extensions": {
        "code": "NOT_FOUND"
      }
    }
  ]
}
```

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `BAD_REQUEST` | Invalid query parameters or filter syntax |
| 403 | `FORBIDDEN` | Access denied |
| 404 | `NOT_FOUND` | Requested resource doesn't exist |

---

## Complete Soul Fetch Example

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

# 5. Get first 100 souls with pagination metadata
curl -s "https://api.decc0s.com/items/codex?fields=id,name&limit=100&meta=*"

# 6. Random soul
RANDOM_ID=$((RANDOM % 9999 + 1))
curl -s "https://api.decc0s.com/items/codex/${RANDOM_ID}?fields=id,name,moltbot,thumbnail"
```
