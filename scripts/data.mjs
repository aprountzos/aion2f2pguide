// Writes the generated blocks into the pages (between the <!-- data:begin ID --> and <!-- data:end --> lines).
// Today that is the list on the Patch History page. The big tables are not written into the pages: they are
// shown with <DataTable id="..." /> straight from the data.
//
//   npm run data             update the blocks in docs/
//   npm run data -- --check  only check; exit 1 when a block is out of date (used by npm run lint)
//
// The blocks come from data/*.yml. Edit those files, never the generated text.

import fs from 'node:fs';
import path from 'node:path';
import {root} from './site-meta.mjs';
import {loadData, updateBlocks} from './lib/data.mjs';
import {collectPages, slugify} from './lib/docs.mjs';

export const DOCS = path.join(root, 'docs');

/** Pages that can contain generated blocks. */
export function pageFiles() {
  return collectPages(DOCS, {skip: ['changelog.md']}).map((p) => ({
    file: p.abs,
    rel: path.relative(root, p.abs).split(path.sep).join('/'),
    treeRel: p.rel,
    lang: 'en',
  }));
}

/** linkTo(pageName) for a page at treeRel: a relative link to the page with that name ("Raw Leather"). */
function makeLinker(treeRel) {
  const byName = new Map(collectPages(DOCS, {skip: ['changelog.md']}).map((p) => [slugify(path.posix.basename(p.rel).replace(/\.mdx?$/, '')), p.rel]));
  return (name) => {
    const target = byName.get(slugify(name));
    if (!target) throw new Error(`there is no page called "${name}" (use the page title, for example "Raw Leather")`);
    const rel = path.posix.relative(path.posix.dirname(treeRel), target);
    return rel.startsWith('.') ? rel : './' + rel;
  };
}

/** Returns {errors, outdated:[{rel, ids}], updated:[rel]} and writes files unless check is true. */
export function runData({check = false} = {}) {
  const {data, errors} = loadData(root);
  const outdated = [];
  const updated = [];
  const problems = [...errors];
  if (errors.length) return {errors: problems, outdated, updated};
  for (const {file, rel, treeRel, lang} of pageFiles()) {
    const before = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    if (!before.includes('<!-- data:begin')) continue; // quick skip
    let result;
    try {
      result = updateBlocks(before, data, lang, makeLinker(treeRel));
    } catch (e) {
      problems.push(`${rel}: ${e.message}`);
      continue;
    }
    for (const id of result.unknown) problems.push(`${rel}: unknown data block "${id}"`);
    if (result.text !== before) {
      outdated.push({rel, ids: result.ids});
      if (!check) {
        fs.writeFileSync(file, result.text);
        updated.push(rel);
      }
    }
  }
  return {errors: problems, outdated, updated};
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes('--check');
  const {errors, outdated, updated} = runData({check});
  for (const e of errors) console.error(`error  ${e}`);
  if (errors.length) process.exit(1);
  if (check) {
    for (const o of outdated) console.error(`error  ${o.rel}: generated block out of date. Run: npm run data`);
    if (outdated.length) process.exit(1);
    console.log('data: blocks are up to date');
  } else {
    console.log(updated.length ? `data: updated ${updated.join(', ')}` : 'data: nothing to update');
  }
}
