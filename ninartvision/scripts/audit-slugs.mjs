/**
 * audit-slugs.mjs
 *
 * Reads every artwork from Sanity, finds duplicate / malformed slugs,
 * and prints a report with suggested fixes.
 *
 * Usage:
 *   node scripts/audit-slugs.mjs             # report only
 *   node scripts/audit-slugs.mjs --fix       # auto-patch UNAMBIGUOUS fixes in Sanity
 *   node scripts/audit-slugs.mjs --dry-run   # show what --fix would do, without writing
 *
 * The script NEVER overwrites a slug that is already correct.
 * Collision resolution for AMBIGUOUS cases always requires a human decision:
 * the script prints suggestions and exits without patching.
 *
 * Requires: SANITY_TOKEN env var (Editor or Write role).
 *   set SANITY_TOKEN=sk-...
 *
 * Node 18+ (native fetch).
 */

/* ── Config ─────────────────────────────────────────────────────────────── */
const PROJECT_ID  = '8t5h923j';
const DATASET     = 'production';
const API_VERSION = '2025-02-05';
const TOKEN       = process.env.SANITY_TOKEN;

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function generateSlug(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/['"«»\u201c\u201d\u2018\u2019\u201e\u201f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g,  '-')
    .replace(/^-+|-+$/g, '');
}

/** Append a meaningful descriptor to make a slug unique */
function suggestAlternatives(artwork, existingSlugs) {
  const base = generateSlug(artwork.title || '');

  const candidates = [
    artwork.medium     && `${base}-${generateSlug(artwork.medium)}`,
    artwork.category   && `${base}-${generateSlug(artwork.category)}`,
    artwork.year       && `${base}-${artwork.year}`,
    artwork.dimensions && `${base}-${generateSlug(artwork.dimensions.split('x')[0].trim())}cm`,
    `${base}-original`,
    `${base}-painting`,
  ].filter(Boolean).filter(s => s !== base && !existingSlugs.has(s));

  return [...new Set(candidates)].slice(0, 4);
}

/** Sanitize an existing slug (trim whitespace / trailing hyphens) */
function sanitize(slug) {
  return String(slug || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g,  '-')
    .replace(/^-+|-+$/g, '');
}

/* ── Sanity API ──────────────────────────────────────────────────────────── */

function apiUrl(path) {
  return `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/${path}`;
}

async function sanityFetch(query, params = {}) {
  const qs  = new URLSearchParams({query, ...Object.fromEntries(
    Object.entries(params).map(([k, v]) => [`$${k}`, JSON.stringify(v)])
  )});
  const res = await fetch(`https://${PROJECT_ID}.apicdn.sanity.io/v${API_VERSION}/data/query/${DATASET}?${qs}`);
  if (!res.ok) throw new Error(`Fetch error ${res.status}: ${res.statusText}`);
  return (await res.json()).result;
}

async function patchSlug(docId, newSlug, dryRun) {
  const url  = apiUrl(`data/mutate/${DATASET}`);
  const body = JSON.stringify({
    mutations: [{
      patch: {
        id:  docId,
        set: { 'slug.current': newSlug },
      }
    }]
  });

  if (dryRun) {
    console.log(`    [dry-run] PATCH ${docId} → slug.current = "${newSlug}"`);
    return;
  }
  if (!TOKEN) throw new Error('SANITY_TOKEN env var is required for --fix mode');

  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Patch failed (${res.status}): ${err}`);
  }
}

/* ── Main ───────────────────────────────────────────────────────────────── */

async function main() {
  const args   = process.argv.slice(2);
  const fix    = args.includes('--fix');
  const dryRun = args.includes('--dry-run');

  if (fix && !TOKEN && !dryRun) {
    console.error('\n❌  Set SANITY_TOKEN env var before using --fix');
    console.error('   Windows:  $env:SANITY_TOKEN = "sk-..."');
    console.error('   macOS:    export SANITY_TOKEN="sk-..."');
    process.exit(1);
  }

  console.log('⏳  Fetching artworks from Sanity…');

  const artworks = await sanityFetch(`
    *[_type == "artwork"] | order(coalesce(order,999) asc, _createdAt asc) {
      _id,
      title,
      "slug": slug.current,
      medium,
      category,
      year,
      dimensions,
      status
    }
  `);

  console.log(`    Found ${artworks.length} artworks\n`);

  /* ── Pass 1: detect malformed slugs (whitespace / trailing hyphens) ─── */
  const malformed = artworks.filter(a => {
    const clean = sanitize(a.slug || '');
    return a.slug !== clean;
  });

  /* ── Pass 2: collect sanitized slug → artworks map ─────────────────── */
  const slugMap = new Map(); // sanitized slug → [artwork, …]
  for (const a of artworks) {
    const key = sanitize(a.slug || '') || generateSlug(a.title || '');
    if (!slugMap.has(key)) slugMap.set(key, []);
    slugMap.get(key).push(a);
  }

  const collisions = [...slugMap.entries()].filter(([, list]) => list.length > 1);

  /* ── Report: malformed ──────────────────────────────────────────────── */
  if (malformed.length) {
    console.log(`━━━ MALFORMED SLUGS (${malformed.length}) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log('These slugs have trailing/leading whitespace or hyphens.\n');
    for (const a of malformed) {
      const fixed = sanitize(a.slug);
      console.log(`  "${a.title}"`);
      console.log(`    current : "${a.slug}"`);
      console.log(`    fix     : "${fixed}"`);
      console.log(`    id      : ${a._id}\n`);
    }
    if (fix || dryRun) {
      // Check the fixed slug won't collide with an existing clean one
      const allSlugs = new Set(artworks.map(a => sanitize(a.slug || '')));
      for (const a of malformed) {
        const fixed = sanitize(a.slug);
        if (allSlugs.has(fixed) && artworks.find(x => sanitize(x.slug) === fixed && x._id !== a._id)) {
          console.warn(`    ⚠ Cannot auto-fix "${a.slug}" → "${fixed}" — would collide. Fix manually.`);
          continue;
        }
        console.log(`  Patching "${a.title}" (${a._id}) → "${fixed}"`);
        await patchSlug(a._id, fixed, dryRun);
      }
      console.log('');
    }
  } else {
    console.log('✓  No malformed slugs\n');
  }

  /* ── Report: collisions ─────────────────────────────────────────────── */
  if (collisions.length) {
    console.log(`━━━ SLUG COLLISIONS (${collisions.length} groups) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log('These artworks share the same slug. Each needs a UNIQUE slug in Sanity Studio.');
    console.log('Suggested alternatives are shown below — pick the most descriptive one.\n');

    const usedSlugs = new Set(artworks.map(a => sanitize(a.slug || '')));

    let hasAmbiguous = false;

    for (const [slug, list] of collisions) {
      console.log(`  Slug: "${slug}" — shared by ${list.length} artworks:`);
      for (const a of list) {
        const alts = suggestAlternatives(a, usedSlugs);
        console.log(`\n    • "${a.title}" (${a.status || '—'})`);
        console.log(`      Current slug : "${a.slug}"`);
        console.log(`      _id          : ${a._id}`);
        if (alts.length) {
          console.log(`      Suggestions  :`);
          alts.forEach(s => console.log(`        → ${s}`));
        } else {
          console.log(`      Suggestions  : (none — add medium, category, or year in Sanity)`);
        }
      }
      console.log('');
      hasAmbiguous = true;
    }

    if (hasAmbiguous) {
      console.log('ℹ  Fix these in Sanity Studio, then re-run: node scripts/audit-slugs.mjs');
      console.log('   The slug field now validates uniqueness in real-time — just save & publish.\n');
    }
  } else {
    console.log('✓  No slug collisions\n');
  }

  /* ── Summary ─────────────────────────────────────────────────────────── */
  const issues = malformed.length + collisions.length;
  if (issues === 0) {
    console.log('🎉  All slugs are clean and unique. Run the generator:\n');
    console.log('      npm run generate-products:clean\n');
  } else {
    console.log(`⚠   ${issues} issue(s) found. Resolve them, then re-run this audit.`);
    process.exit(2);   // non-zero so CI pipelines can detect slug problems
  }
}

main().catch(err => {
  console.error('\n❌', err.message || err);
  process.exit(1);
});
