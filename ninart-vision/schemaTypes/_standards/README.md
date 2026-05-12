# Sanity Schema Standards & Best Practices

## Overview

This directory contains standard definitions, validation rules, and best practices for maintaining consistency between Sanity schemas and frontend GROQ queries.

## Files

- **`fieldStandards.ts`** - Field priority definitions and standard GROQ projections
- **`schemaTemplate.ts`** - Template for creating new schemas
- **`validationRules.ts`** - Reusable validation functions

## Purpose

Prevent mismatches between:
1. Fields defined in Sanity schemas
2. Fields queried in GROQ
3. Fields expected by frontend rendering

## Field Priority System

| Priority | When to Include | Example Fields |
|----------|----------------|----------------|
| **CRITICAL** | Always, in every query | `_id`, `name`, `slug`, `title` |
| **HIGH** | In all user-facing views | `image`, `bio`, `style` |
| **MEDIUM** | In detail views, optional in lists | `year`, `medium`, `description` |
| **LOW** | Only when specifically needed | `price`, `status`, `_createdAt` |

## Usage in Frontend

```typescript
import { GROQ_PROJECTIONS } from '../schemaTypes/_standards/fieldStandards';

// Use standard projection
const query = `
  *[_type == "artist"] | order(name asc){
    ${GROQ_PROJECTIONS.ARTIST_CARD}
  }
`;
```

## Adding New Fields

When adding a field to any schema:

1. ✅ Add to schema file (e.g., `artist.ts`)
2. ✅ Add to `fieldStandards.ts` with priority level
3. ✅ Update relevant `GROQ_PROJECTIONS` 
4. ✅ Update frontend queries
5. ✅ Add validation tests
6. ✅ Update documentation

## Validation

Run validation before deployment:
```bash
npm run validate:sanity
```

See `scripts/validate-sanity-fields.js` for validation logic.
