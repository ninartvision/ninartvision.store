/**
 * Modal markup verifier — CI / post-minify guard
 *
 * WHY: <motion.div> is NOT valid HTML. Safari/iOS may treat it as an unknown
 * custom element (broken layout, odd parsing, no guarantee of div semantics).
 * Use standard <div> only. Animations belong in CSS (see css/nv-gallery-modal.css).
 *
 * Run: npm run verify:modal
 * Called automatically at end of npm run build:js (see scripts/minify-js.mjs).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Invalid patterns — must never appear in shipped modal bundles. */
const FORBIDDEN_RULES = [
  {
    id: 'INVALID_TAG_OPEN',
    label: '<motion.div> opening tag (unknown custom element)',
    re: /<motion\.div\b/gi,
  },
  {
    id: 'INVALID_TAG_CLOSE',
    label: '</motion.div> closing tag',
    re: /<\/motion\.div>/gi,
  },
  {
    id: 'INVALID_CREATE_ELEMENT',
    label: "createElement('motion.div')",
    re: /createElement\(\s*['"]motion\.div['"]\s*\)/gi,
  },
];

/** Required mount root in nv-gallery-modal bundles (valid HTML). */
const REQUIRED_MODAL_ROOT = '<div class="product-modal"';

const TARGETS = [
  { rel: 'js/nv-gallery-modal.js', requireRoot: true },
  { rel: 'js/nv-gallery-modal.min.js', requireRoot: true },
  { rel: 'script.js', requireRoot: false },
  { rel: 'script.min.js', requireRoot: false },
];

/** Strip comments so docs mentioning forbidden patterns do not false-fail CI. */
function stripJsComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

function countMatches(text, re) {
  const flags = re.flags.includes('g') ? re.flags : re.flags + 'g';
  const globalRe = new RegExp(re.source, flags);
  return [...text.matchAll(globalRe)].length;
}

function extractModalHtmlLiteral(source) {
  const m = source.match(/const\s+MODAL_HTML\s*=\s*"((?:\\.|[^"\\])*)"/);
  return m ? m[1].replace(/\\"/g, '"') : '';
}

function rel(p) {
  return path.relative(root, p).replace(/\\/g, '/');
}

console.log('');
console.log('Ninart Vision — modal markup verification');
console.log('─'.repeat(52));
console.log('Forbidden: <motion.div> tags and createElement("motion.div")');
console.log('Required:  <div class="product-modal"> in gallery-modal bundles');
console.log('');

const fileResults = [];
let totalForbidden = 0;
let failed = false;

for (const { rel: fileRel, requireRoot } of TARGETS) {
  const abs = path.join(root, fileRel);
  const row = {
    file: fileRel,
    exists: fs.existsSync(abs),
    forbidden: 0,
    rules: [],
    rootOk: null,
  };

  if (!row.exists) {
    console.warn(`  SKIP  ${fileRel} (file not found)`);
    fileResults.push(row);
    failed = true;
    continue;
  }

  const raw = fs.readFileSync(abs, 'utf8');
  const text = stripJsComments(raw);

  for (const rule of FORBIDDEN_RULES) {
    const n = countMatches(text, rule.re);
    if (n > 0) {
      row.forbidden += n;
      row.rules.push({ id: rule.id, label: rule.label, count: n });
      totalForbidden += n;
    }
  }

  if (requireRoot) {
    if (fileRel.endsWith('.min.js')) {
      row.rootOk = raw.includes(REQUIRED_MODAL_ROOT);
    } else {
      const mountHtml = extractModalHtmlLiteral(raw);
      row.rootOk =
        mountHtml.startsWith(REQUIRED_MODAL_ROOT) || raw.includes(REQUIRED_MODAL_ROOT);
    }
    if (!row.rootOk) failed = true;
  }

  if (row.forbidden > 0) failed = true;

  const status =
    !row.exists ? 'SKIP' : row.forbidden > 0 || row.rootOk === false ? 'FAIL' : 'PASS';

  console.log(`  ${status.padEnd(5)} ${fileRel}`);
  if (row.forbidden > 0) {
    for (const r of row.rules) {
      console.log(`         └─ ${r.id}: ${r.count}× ${r.label}`);
    }
  }
  if (requireRoot) {
    console.log(
      row.rootOk
        ? `         └─ root: found valid "${REQUIRED_MODAL_ROOT}"`
        : `         └─ root: MISSING valid "${REQUIRED_MODAL_ROOT}"`
    );
  } else if (row.forbidden === 0) {
    console.log('         └─ (no modal mount string expected in this bundle)');
  }

  fileResults.push(row);
}

console.log('');
console.log('─'.repeat(52));
console.log(`Files checked:        ${TARGETS.length}`);
console.log(`Forbidden matches:    ${totalForbidden}`);
console.log(
  `Required root checks: ${fileResults.filter(r => r.rootOk === true).length} passed, ` +
    `${fileResults.filter(r => r.rootOk === false).length} failed`
);

if (failed) {
  console.log('');
  console.error('RESULT: FAIL — invalid modal markup must be fixed before deploy.');
  console.error('        Use <div> only. Re-run: npm run build:js');
  process.exit(1);
}

console.log('');
console.log('RESULT: PASS — all modal bundles use valid HTML (<div>), zero motion.div.');
console.log('');
