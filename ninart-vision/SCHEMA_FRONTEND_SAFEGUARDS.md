# Schema-to-Frontend Workflow Safeguards

## Problem Statement

**Issue:** Schema fields exist in Sanity but are missing from frontend GROQ queries, causing:
- Silent failures (undefined/null in frontend)
- Missing content on production
- Inconsistent data display
- Difficult debugging

## Multi-Layer Safeguard System

### Layer 1: Schema Documentation (Inline Comments)

**Location:** Schema files (`artist.ts`, `artwork.ts`)

**Implementation:** Add frontend priority comments to each field

```typescript
defineField({
  name: 'bio',
  title: 'About',
  type: 'text',
  description: 'Artist biography',
  
  // ✅ SAFEGUARD: Frontend developers see this comment
  // FRONTEND: HIGH - Include in detail views and artist cards with bio toggle
  // FRONTEND QUERY: bio (no special projection needed)
})
```

**Benefit:** Developers know at a glance which fields to include in queries

---

### Layer 2: Field Standards Registry

**Location:** `schemaTypes/_standards/fieldStandards.ts`

**Implementation:** Centralized field requirements and standard projections

```typescript
export const ARTIST_FIELDS = {
  bio: { 
    priority: FIELD_PRIORITY.HIGH,
    description: 'Include in detail views and artist cards'
  },
}

export const GROQ_PROJECTIONS = {
  ARTIST_CARD_WITH_BIO: `
    _id,
    name,
    bio,  // ✅ SAFEGUARD: Standard projection includes all fields
    ...
  `,
}
```

**Benefit:** Single source of truth for what fields exist and when to use them

---

### Layer 3: Automated Validation Script

**Location:** `scripts/validate-sanity-fields.js`

**Implementation:** Pre-deployment validation that fails if fields are missing

```javascript
// ✅ SAFEGUARD: Catches missing fields before deployment

const ARTIST_FIELDS = ['_id', 'name', 'slug', 'bio', 'style', 'image'];

function validateQuery(query, expectedFields) {
  const fieldsInQuery = extractFieldsFromQuery(query);
  const missing = expectedFields.filter(f => !fieldsInQuery.includes(f));
  
  if (missing.length > 0) {
    console.error('❌ Missing fields:', missing);
    process.exit(1);  // Fails deployment
  }
}
```

**Trigger:** 
```json
{
  "scripts": {
    "predeploy": "npm run validate:sanity",
    "precommit": "npm run validate:sanity"
  }
}
```

**Benefit:** Automatic checks prevent forgetting fields

---

### Layer 4: Runtime Field Validation

**Location:** Frontend code (`artist-shop.js`, etc.)

**Implementation:** Defensive checks that log warnings when fields are missing

```javascript
// ✅ SAFEGUARD: Runtime validation catches issues in production

const EXPECTED_FIELDS = ['_id', 'name', 'slug', 'bio', 'style', 'image'];

function validateArtistData(artist) {
  EXPECTED_FIELDS.forEach(field => {
    if (!(field in artist)) {
      console.error(`❌ Missing field: ${field}`);
      // Also send to error tracking service (Sentry, etc.)
    } else if (!artist[field]) {
      console.warn(`⚠️ Empty field: ${field}`);
    }
  });
}

// Run on every data fetch
const artists = await fetchArtists(query);
if (artists[0]) {
  validateArtistData(artists[0]);
}
```

**Benefit:** Immediate feedback when queries are incomplete

---

### Layer 5: TypeScript Type Safety (Optional)

**Location:** `types/sanity.ts`

**Implementation:** TypeScript interfaces that must match schema

```typescript
// ✅ SAFEGUARD: TypeScript prevents accessing undefined fields

interface Artist {
  _id: string;
  name: string;
  slug: string;
  bio?: string;        // Optional in schema
  style?: string;      // Optional in schema
  image?: SanityImage;
  featured: boolean;
}

// TypeScript error if you try to access nonexistent field
const displayName = artist.invalidField; // ❌ Error
```

**Benefit:** Compile-time errors for field mismatches

---

### Layer 6: Sanity Studio Warnings (Custom Input)

**Location:** Schema field components

**Implementation:** Custom input component that warns editors

```typescript
defineField({
  name: 'bio',
  type: 'text',
  components: {
    input: (props) => {
      const hasBio = props.value && props.value.trim().length > 0;
      
      return (
        <Stack space={2}>
          <TextArea {...props} />
          {!hasBio && (
            <Card tone="caution" padding={3}>
              <Text size={1}>
                ⚠️ Bio is recommended for better artist representation
              </Text>
            </Card>
          )}
        </Stack>
      );
    }
  }
})
```

**Benefit:** Editors know which optional fields are important

---

### Layer 7: Monitoring & Alerts

**Location:** Error tracking service (Sentry, LogRocket, etc.)

**Implementation:** Track field validation errors in production

```javascript
// ✅ SAFEGUARD: Production monitoring catches issues

function validateArtistData(artist) {
  EXPECTED_FIELDS.forEach(field => {
    if (!(field in artist)) {
      // Log to error tracking
      Sentry.captureException(new Error(`Missing field: ${field}`), {
        extra: {
          artistId: artist._id,
          availableFields: Object.keys(artist),
        }
      });
    }
  });
}
```

**Benefit:** Proactive notification of production issues

---

## Complete Workflow

### When Adding a New Field

```
1. UPDATE SCHEMA
   ├─ Add field to schema file (e.g., artist.ts)
   ├─ Add description
   ├─ Add frontend priority comment
   └─ Add query example comment

2. UPDATE STANDARDS
   ├─ Add to fieldStandards.ts
   ├─ Set priority level
   └─ Update GROQ_PROJECTIONS

3. UPDATE VALIDATION
   ├─ Add to validation script's EXPECTED_FIELDS
   └─ Add to runtime validation

4. UPDATE QUERIES
   ├─ Update all GROQ queries in frontend
   └─ Use standard projections from fieldStandards.ts

5. UPDATE TYPES (if using TypeScript)
   └─ Add to relevant interfaces

6. TEST
   ├─ Run validation: npm run validate:sanity
   ├─ Test in Sanity Vision
   ├─ Test in frontend (populated)
   └─ Test in frontend (empty/null)

7. DEPLOY
   ├─ Deploy schema: npx sanity schema deploy
   ├─ Deploy frontend
   └─ Monitor error logs
```

---

## Prevention Matrix

| Layer | When It Catches Issues | False Positive Risk |
|-------|------------------------|---------------------|
| **Schema Comments** | Development (manual review) | None |
| **Field Standards** | Development (reference check) | None |
| **Validation Script** | Pre-commit, Pre-deploy | Low (may flag intentional omissions) |
| **Runtime Validation** | Development, Production | Medium (optional fields) |
| **TypeScript** | Development (compile time) | Low |
| **Studio Warnings** | Content creation | None |
| **Monitoring** | Production | Low |

---

## Quick Reference Card

Print this and keep it visible:

```
╔════════════════════════════════════════════════════════╗
║          ADDING A NEW SANITY FIELD?                    ║
╠════════════════════════════════════════════════════════╣
║ 1. ✅ Add to schema with description                   ║
║ 2. ✅ Add FRONTEND priority comment                    ║
║ 3. ✅ Add to fieldStandards.ts                         ║
║ 4. ✅ Update GROQ_PROJECTIONS                          ║
║ 5. ✅ Add to validation script                         ║
║ 6. ✅ Update ALL frontend queries                      ║
║ 7. ✅ Run: npm run validate:sanity                     ║
║ 8. ✅ Test in Vision & Frontend                        ║
║ 9. ✅ Deploy schema: npx sanity schema deploy          ║
║                                                        ║
║ FORGOT A STEP? Run validation to check!               ║
╚════════════════════════════════════════════════════════╝
```

---

## Emergency Recovery

**If a field exists in schema but is missing from frontend:**

```bash
# 1. Identify the field
# Check schema file for field definition

# 2. Check validation script
node scripts/validate-sanity-fields.js
# Will show which queries are missing the field

# 3. Update queries
# Add field to all identified queries

# 4. Update standards
# Add to fieldStandards.ts if not present

# 5. Test immediately
# Run validation again to confirm fix

# 6. Deploy
# Push changes to fix production
```

---

## Maintenance

**Monthly:**
- Review validation script output
- Check error logs for field-related issues
- Update fieldStandards.ts if new patterns emerge

**After each field addition:**
- Run full validation suite
- Check all query uses of new field type
- Update documentation

**Before major releases:**
- Audit all schemas vs all queries
- Verify TypeScript types match schemas
- Review error monitoring data

---

## Success Metrics

Track these to measure safeguard effectiveness:

- **Field Coverage %**: Fields in queries / Fields in schema
- **Validation Failures**: How often pre-deploy checks catch issues
- **Production Errors**: Field-related errors in monitoring
- **Time to Fix**: Time from field addition to full frontend integration

**Target:** 100% field coverage, 0 production field errors

---

## Summary

**The safeguard system works through redundancy:**

1. 📝 **Documentation** guides developers
2. 📋 **Standards** provide templates
3. ✅ **Validation** prevents mistakes
4. 🛡️ **Runtime checks** catch edge cases
5. 🎯 **TypeScript** enforces contracts
6. ⚠️ **Warnings** educate editors
7. 📊 **Monitoring** tracks production

**No single layer is perfect, but together they create a robust system that prevents schema-frontend mismatches.**
