// Checks the pages in ./docs before they are built into the site.
//
//   node scripts/lint-docs.mjs [--strict]
//
// Errors fail the run (exit 1). Warnings are printed and only fail with --strict.
// Run it with:  npm run lint

import fs from 'node:fs';
import path from 'node:path';
import {root} from './site-meta.mjs';
import {
  ADMONITION_TYPES,
  JSX_TAG_RE,
  collectPages,
  mapOutsideCode,
  parseFrontmatter,
  parseJsxProps,
  proseLines,
  splitFrontmatter,
} from './lib/docs.mjs';
import {runData} from './data.mjs';
import {checkWidgetProps, listWidgets} from './lib/widgets.mjs';

const WIDGETS = listWidgets();
const strict = process.argv.includes('--strict');
const DOCS = path.join(root, 'docs');

// class ids from data/classes.yml (a class guide page is docs/11-classes/<id>.md)
const CLASS_IDS = new Set(
  [...(fs.existsSync(path.join(root, 'data', 'classes.yml')) ? fs.readFileSync(path.join(root, 'data', 'classes.yml'), 'utf8') : '').matchAll(/^- id:\s*([a-z0-9-]+)/gm)].map((m) => m[1]),
);

const errors = [];
const warnings = [];
const err = (file, line, msg) => errors.push(`${file}${line ? `:${line}` : ''}  ${msg}`);
const warn = (file, line, msg) => warnings.push(`${file}${line ? `:${line}` : ''}  ${msg}`);

if (!fs.existsSync(DOCS)) {
  console.error('lint: the docs/ folder is missing. The pages of the guide live there.');
  process.exit(1);
}

const pages = collectPages(DOCS, {skip: ['changelog.md']}); // changelog.md is generated from CHANGELOG.md
const byRel = new Map(pages.map((p) => [p.rel, p]));
const byBase = new Map();
for (const p of pages) {
  const base = path.posix.basename(p.rel).replace(/\.mdx?$/, '');
  if (byBase.has(base)) err(`docs/${p.rel}`, 0, `the file name "${base}" is also used by docs/${byBase.get(base)}. File names must be unique`);
  else byBase.set(base, p.rel);
}

// column count of a markdown table row, ignoring escaped pipes
const cols = (row) =>
  row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/).length;

const positions = new Map(); // folder -> Map(position -> file)

function lintPage({abs, rel, parts}) {
  const file = `docs/${rel}`;
  const isMdx = rel.endsWith('.mdx');
  const text = fs.readFileSync(abs, 'utf8').replace(/\r\n/g, '\n');
  const {fm, body, hasFrontmatter} = splitFrontmatter(text);
  const fmLines = hasFrontmatter ? fm.split('\n').length + 2 : 0;
  const isHome = rel === 'index.md' || rel === 'index.mdx';

  // --- file name: lowercase, digits, hyphens (it becomes the address of the page)
  for (const seg of rel.split('/')) {
    if (!/^[a-z0-9][a-z0-9._-]*$/.test(seg)) {
      err(file, 0, `"${seg}" is not a good file or folder name. Use lowercase letters, digits and hyphens, like "gathering-by-level.md"`);
    }
  }

  // --- class guides: named after a class, and no unfinished template lines left
  if (rel.startsWith('11-classes/') && rel !== '11-classes/overview.mdx') {
    const id = path.posix.basename(rel).replace(/\.mdx?$/, '');
    if (!CLASS_IDS.has(id)) err(file, 0, `"${id}" is not a class in data/classes.yml. A class guide is named after its class, like "gladiator.md"`);
    text.split('\n').forEach((l, i) => {
      if (/\bTODO\b/.test(l)) err(file, i + 1, 'unfinished template line (TODO). Fill it in or remove the line');
    });
  }

  // --- frontmatter
  if (!hasFrontmatter) {
    err(file, 1, 'missing frontmatter (--- ... ---). Copy templates/page.md');
  } else {
    const data = parseFrontmatter(fm);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.updated || '') || Number.isNaN(Date.parse(data.updated))) {
      err(file, 1, 'frontmatter needs "updated: YYYY-MM-DD" (the date you last verified the data)');
    }
    for (const flag of ['comments', 'staleness', 'corrections', 'qa', 'landing']) {
      if (data[flag] !== undefined && !/^(true|false)$/.test(data[flag])) err(file, 1, `"${flag}" must be true or false`);
    }
    if (parts.length > 0 && !data.description) {
      warn(file, 1, 'add a one-sentence "description:" to the frontmatter. It is shown on the section page and in search results');
    }
    if (!/^-?\d+$/.test(data.sidebar_position || '')) {
      err(file, 1, 'frontmatter needs an integer "sidebar_position" (order inside its folder)');
    } else if (!isHome) {
      const folder = parts.join('/');
      if (!positions.has(folder)) positions.set(folder, new Map());
      const seen = positions.get(folder);
      const pos = Number(data.sidebar_position);
      if (seen.has(pos)) warn(file, 1, `sidebar_position ${pos} is also used by ${seen.get(pos)}; the order will be ambiguous`);
      seen.set(pos, path.posix.basename(rel));
    }
  }

  // --- first heading
  const firstContent = body.split('\n').findIndex((l) => l.trim() !== '' && !/^import\s/.test(l));
  if (firstContent === -1 || !/^#\s+\S/.test(body.split('\n')[firstContent])) {
    err(file, fmLines + firstContent + 1, 'the first line of content must be a "# Title" heading');
  }

  const imported = new Set([...body.matchAll(/^import\s+(?:\{([^}]*)\}|([A-Za-z0-9_$]+))/gm)].flatMap((m) => (m[1] || m[2]).split(',').map((s) => s.trim())));
  let h1Count = 0;
  let tableHeaderCols = null;
  let openAdmonitions = 0;
  let openLine = 0;

  for (const {line, n} of proseLines(body)) {
    const ln = n + fmLines;
    const scan = line.replace(/`[^`]*`/g, ''); // ignore `inline code`

    if (/^#\s+\S/.test(line)) h1Count++;

    // admonitions
    const adm = scan.match(/^:::(\w+)?/);
    if (adm) {
      if (adm[1]) {
        if (!ADMONITION_TYPES.has(adm[1])) err(file, ln, `unknown admonition type ":::${adm[1]}". Use: note, tip, info, warning, danger`);
        openAdmonitions++;
        openLine = ln;
      } else if (openAdmonitions > 0) openAdmonitions--;
      else err(file, ln, 'closing ":::" without an opening ":::tip" (or note, info, warning, danger)');
    }

    // links
    for (const m of scan.matchAll(/\]\(([^)\s]+)\)/g)) {
      const target = m[1];
      if (/^(https?:|mailto:|#|\/|pathname:)/.test(target)) continue;
      const [pathPart] = target.split('#');
      if (!/\.mdx?$/.test(pathPart)) continue;
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(rel), pathPart));
      if (!byRel.has(resolved) && resolved !== 'changelog.md') {
        const alt = byRel.has(resolved.replace(/\.md$/, '.mdx')) ? `${pathPart}x` : byRel.has(resolved.replace(/\.mdx$/, '.md')) ? pathPart.replace(/\.mdx$/, '.md') : null;
        err(file, ln, `broken link ${target}: there is no docs/${resolved}.${alt ? ` Did you mean ${alt}? (the extension must match the file)` : ''}`);
      }
    }
    if (/\bhttp:\/\/(?!localhost)/.test(scan)) err(file, ln, 'use https:// links (found http://)');

    // components: only in .mdx, with the props their widget.json declares
    for (const m of scan.matchAll(JSX_TAG_RE)) {
      const name = m[1];
      if (imported.has(name)) continue;
      if (!isMdx) {
        err(file, ln, `<${name} /> only works in .mdx pages. Rename the file to .mdx (and update links to it)`);
        continue;
      }
      const {props, error} = parseJsxProps(m[2]);
      if (error) err(file, ln, `<${name}>: ${error}`);
      for (const msg of checkWidgetProps(name, props, WIDGETS)) err(file, ln, msg);
    }

    if (/\b(TODO|FIXME|XXX)\b/.test(line)) warn(file, ln, 'unfinished marker (TODO/FIXME/XXX)');

    // tables: every row must have the same number of columns as its header
    if (/^\s*\|/.test(line)) {
      const count = cols(line);
      if (tableHeaderCols === null) tableHeaderCols = count;
      else if (count !== tableHeaderCols) err(file, ln, `table row has ${count} columns but the header has ${tableHeaderCols}`);
    } else {
      tableHeaderCols = null;
    }
  }

  if (openAdmonitions > 0) err(file, openLine, 'an admonition ":::" is never closed');
  if (h1Count > 1) err(file, 0, `has ${h1Count} "# " headings; use one H1 and "##" for sections`);
  if (isMdx && !/<[A-Z]/.test(mapOutsideCode(body, (c) => c)) && !/^import\s/m.test(body)) {
    warn(file, 0, 'this .mdx page uses no component. A plain .md file is simpler (and < { } need no escaping)');
  }

  // data blocks must be closed
  let begins = 0;
  let ends = 0;
  mapOutsideCode(text, (chunk) => {
    begins += (chunk.match(/<!-- data:begin /g) || []).length;
    ends += (chunk.match(/<!-- data:end -->/g) || []).length;
    return chunk;
  });
  if (begins !== ends) err(file, 0, `data blocks: ${begins} "data:begin" but ${ends} "data:end" lines`);
}

for (const page of pages) lintPage(page);

// structured data (data/*.yml) and the blocks generated from it
const dataResult = runData({check: true});
for (const e of dataResult.errors) err('data', 0, e);
for (const o of dataResult.outdated) {
  err(o.rel, 0, `generated block(s) ${o.ids.join(', ')} out of date. Edit the data in data/*.yml and run: npm run data`);
}

if (!byRel.has('index.mdx') && !byRel.has('index.md')) err('docs', 0, 'missing the front page docs/index.md (or index.mdx)');

for (const w of warnings) console.warn(`warning  ${w}`);
for (const e of errors) console.error(`error    ${e}`);

const summary = `lint: ${pages.length} pages, ${errors.length} error(s), ${warnings.length} warning(s)`;
if (errors.length || (strict && warnings.length)) {
  console.error(summary);
  process.exit(1);
}
console.log(summary);
