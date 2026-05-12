/**
 * fix-slug-collisions.mjs
 *
 * Patches exactly the 7 colliding / malformed slugs identified by the audit.
 * Each patch is chosen based on the artwork's actual year, dimensions, or
 * medium — no random suffixes.
 *
 * Usage:
 *   $env:SANITY_TOKEN = "sk-..."
 *   node scripts/fix-slug-collisions.mjs           # apply patches
 *   node scripts/fix-slug-collisions.mjs --dry-run  # preview only
 */

const PROJECT_ID  = '8t5h923j';
const DATASET     = 'production';
const API_VERSION = '2025-02-05';
const TOKEN       = process.env.SANITY_TOKEN;
const DRY_RUN     = process.argv.includes('--dry-run');

// ── The 7 exact patches ──────────────────────────────────────────────────────
//
//  Each entry: { id, from, to, reason }
//  "id" is the full Sanity document _id (no drafts. prefix — we patch both)
//
const PATCHES = [
  {
    id:     'b80777cd-2b68-4912-86f0-5af0aa674721',
    from:   'forest-',
    to:     'forest-2',
    reason: 'Duplicate "forest" (Oil on canvas, 2024, 50×60cm) — both identical, second gets -2',
  },
  {
    id:     '986bc9aa-b442-45d5-8920-9d9938f0a102',
    from:   'jvari-monastery-',
    to:     'jvari-monastery-large',
    reason: 'Jvari Monastery 60×80cm (larger) vs existing 30×40cm',
  },
  {
    id:     '2d2ccfd8-4740-4398-8344-d3238fcee4fc',
    from:   'naturmort-',
    to:     'naturmort-1999',
    reason: 'Naturmort 1999 (60×75cm) — distinguished from 1994 version',
  },
  {
    id:     '15ee6920-37d5-44c4-8667-39b51acf1fbd',
    from:   'sea-',
    to:     'sea-2023',
    reason: 'Sea 2023 oil on canvas — distinguished from 2024 acrylic version',
  },
  {
    id:     '16e8ebf3-3733-40d2-bd39-d3f020a4f495',
    from:   'theatre-',
    to:     'theatre-pastel',
    reason: 'Theatre pastel on paper — distinguished from unlabeled medium version',
  },
  {
    id:     '484c5eec-4964-4e7e-8f35-e526171ab830',
    from:   'old-village-house ',    // trailing space
    to:     'old-village-house',
    reason: 'Malformed slug with trailing space — trimmed',
  },
];

// ── Sanity write API ──────────────────────────────────────────────────────────

async function patchSlug(docId, newSlug) {
  // Patch both published and draft versions in one call
  const mutations = [
    { patch: { id: docId,                  set: { 'slug.current': newSlug } } },
    { patch: { id: `drafts.${docId}`,      set: { 'slug.current': newSlug } } },
  ];

  const res = await fetch(
    `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/mutate/${DATASET}`,
    {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        Authorization:   `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ mutations }),
    }
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Patch failed (${res.status}): ${txt}`);
  }
  return res.json();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!DRY_RUN && !TOKEN) {
    console.error('\n❌  SANITY_TOKEN env var is required.');
    console.error('   Windows PowerShell:  $env:SANITY_TOKEN = "sk-..."');
    console.error('   Then re-run:         node scripts/fix-slug-collisions.mjs\n');
    process.exit(1);
  }

  console.log(`\n${DRY_RUN ? '[DRY-RUN] ' : ''}Applying ${PATCHES.length} slug patches…\n`);

  let ok = 0;
  let failed = 0;

  for (const p of PATCHES) {
    const arrow = `"${p.from}" → "${p.to}"`;
    console.log(`  ${arrow}`);
    console.log(`    ${p.reason}`);

    if (DRY_RUN) {
      console.log(`    [dry-run] would PATCH ${p.id}\n`);
      ok++;
      continue;
    }

    try {
      await patchSlug(p.id, p.to);
      console.log(`    ✓ Patched ${p.id}\n`);
      ok++;
    } catch (err) {
      console.error(`    ✗ FAILED: ${err.message}\n`);
      failed++;
    }
  }

  console.log(`━━━ Done. ${ok} patched, ${failed} failed ━━━`);

  if (!DRY_RUN && failed === 0) {
    console.log('\nNext steps:');
    console.log('  1. node scripts/audit-slugs.mjs          ← verify clean');
    console.log('  2. npm run generate-products:clean        ← rebuild pages');
    console.log('  3. git add -A && git commit && git push   ← deploy\n');
  }

  if (failed > 0) process.exit(1);
}

main().catch(err => { console.error('\n❌', err.message); process.exit(1); });
