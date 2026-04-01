# Query Guide

Master the query capabilities of the MOCA Codex API using Directus conventions. This covers filtering, sorting, searching, pagination, and field selection.

---

## Query Parameters Overview

| Parameter | Description | Example |
|-----------|-------------|---------|
| `fields` | Select specific fields | `?fields=id,name` |
| `filter` | Apply filter conditions | `?filter[name][_eq]=Korka` |
| `sort` | Order results | `?sort=-timestamp_created` |
| `limit` | Maximum results | `?limit=25` |
| `offset` | Skip results (pagination) | `?offset=50` |
| `page` | Page number (alternative to offset) | `?page=2` |
| `search` | Full-text search | `?search=curator` |
| `meta` | Include metadata | `?meta=*` |

---

## Field Selection

Use the `fields` parameter to request only the data you need.

```bash
# Basic field selection
GET /items/codex?fields=id,name,description

# Nested fields (dot notation)
GET /items/codex?fields=id,name,moltbot.v0.1.soul

# All fields (omit parameter)
GET /items/codex
```

Always specify only the fields you need to reduce response size and improve performance.

---

## Filtering

Filter results using Directus filter syntax. Two notations are supported:

**Bracket notation:**
```
?filter[field][operator]=value
```

**JSON format:**
```
?filter={"field":{"operator":"value"}}
```

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
| `_contains` | Contains substring (case-sensitive) | `filter[name][_contains]=ork` |
| `_icontains` | Contains substring (case-insensitive) | `filter[name][_icontains]=ork` |
| `_ncontains` | Doesn't contain | `filter[name][_ncontains]=test` |
| `_starts_with` | Starts with | `filter[name][_starts_with]=Ko` |
| `_nstarts_with` | Doesn't start with | `filter[name][_nstarts_with]=Ko` |
| `_ends_with` | Ends with | `filter[name][_ends_with]=ka` |
| `_nends_with` | Doesn't end with | `filter[name][_nends_with]=ka` |
| `_between` | Between values | `filter[id][_between]=10,50` |
| `_nbetween` | Not between | `filter[id][_nbetween]=10,50` |
| `_empty` | Is empty (null, empty string, or empty array) | `filter[tags][_empty]=true` |
| `_nempty` | Is not empty | `filter[tags][_nempty]=true` |

### Filter Examples

```bash
# Exact name match
GET /items/codex?filter[name][_eq]=Korka

# Contains substring (case-sensitive)
GET /items/codex?filter[description][_contains]=curator

# Contains substring (case-insensitive)
GET /items/codex?filter[name][_icontains]=korka

# Greater than
GET /items/codex?filter[id][_gt]=100

# Not null
GET /items/codex?filter[ancestor][_nnull]=true

# Between range
GET /items/codex?filter[id][_between]=100,200

# By owner wallet (MUST be lowercase)
GET /items/codex?filter[owner][_eq]=0x614a61a3b7f2fd8750acaad63b2a0cfe8b8524f1
```

---

## Logical Operators

Combine multiple conditions using logical operators.

### AND Operator

All conditions must be true:

```bash
GET /items/codex?filter={"_and":[{"id":{"_gte":1}},{"name":{"_nnull":true}}]}
```

### OR Operator

At least one condition must be true:

```bash
GET /items/codex?filter={"_or":[{"name":{"_eq":"Korka"}},{"name":{"_eq":"Aria"}}]}
```

### Complex Nesting

Combine AND and OR:

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

Use JSON syntax when you need `_or` operators or nested logic. Use bracket notation for simple AND conditions (multiple bracket filters are implicitly ANDed).

---

## Sorting

```bash
# Ascending order
GET /items/codex?sort=name

# Descending order (prefix with -)
GET /items/codex?sort=-timestamp_created

# Multiple sort fields (comma-separated)
GET /items/codex?sort=-timestamp_created,name
```

Fields are sorted in the order specified. If no sort is specified, results are sorted by `id` ascending.

---

## Pagination

Control result set size using `limit` and `offset`, or `limit` and `page`.

### Offset-based

```bash
# First page (items 1-10)
GET /items/codex?limit=10&offset=0

# Second page (items 11-20)
GET /items/codex?limit=10&offset=10
```

### Page-based

```bash
# Page 1
GET /items/codex?limit=10&page=1

# Page 2
GET /items/codex?limit=10&page=2
```

### With Metadata

Include `meta=*` to get total counts for pagination:

```bash
GET /items/codex?limit=10&offset=0&meta=*
```

Response:
```json
{
  "data": [...],
  "meta": {
    "filter_count": 42,
    "total_count": 10000
  }
}
```

Pagination calculation: `Total Pages = ceil(total_count / limit)`

---

## Full-Text Search

Search across multiple text fields simultaneously:

```bash
GET /items/codex?search=curator
```

Combine search with filters for refined results:

```bash
GET /items/codex?search=art&filter[id][_gte]=10&fields=id,name,description&limit=10
```

Use `search` for discovery and `filter` for precise queries.

---

## Combining Parameters

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

## Best Practices

### Do
- Use field selection to minimize response size
- Include `meta=*` when building pagination UI
- Use specific filters instead of fetching all data
- Use **lowercase** for Ethereum addresses
- URL-encode special characters in filter values
- Use bracket notation for simple filters, JSON for complex logic

### Don't
- Fetch all fields when you only need a few
- Use high limits without pagination
- Forget to URL-encode special characters
- Use case-sensitive matching for wallet addresses
- Use `_contains` for owner address matching (use `_eq` for exact match)
