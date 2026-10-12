// Lists the pages whose data has not been verified for a while. Used by the weekly "stale pages"
// workflow, which turns the report into a GitHub issue. You can also run it yourself:
//
//   npm run stale                 prints the report
//   npm run stale -- --days 14    use another limit (default: staleDays from site.config.json)
//   npm run stale -- --out report.md
//
// A page is excluded when its frontmatter has "staleness: false" (Home, Contribute and Changelog are).
// The exit code is always 0: a stale page is a reminder, not an error.

import fs from 'node:fs';
import path from 'node:path';
import {meta, root} from './site-meta.mjs';
import {collectPages, parseFrontmatter, splitFrontmatter} from './lib/docs.mjs';

const args = process.argv.slice(2);
const opt = (n) => {
  const i = args.indexOf(n);
  return i === -1 ? undefined : args[i + 1];
};
const days = Number(opt('--days') || meta.staleDays || 30);
const out = opt('--out');
const DAY = 24 * 60 * 60 * 1000;
const today = new Date(process.env.STALE_TODAY || Date.now());
const ageDays = (iso) => Math.floor((today.getTime() - new Date(iso).getTime()) / DAY);

const stale = [];
for (const page of collectPages(path.join(root, 'docs'), {skip: ['changelog.md']})) {
  const fm = parseFrontmatter(splitFrontmatter(fs.readFileSync(page.abs, 'utf8').replace(/\r\n/g, '\n')).fm);
  if (fm.staleness === 'false' || !fm.updated) continue;
  const age = ageDays(fm.updated);
  if (Number.isFinite(age) && age > days) stale.push({rel: page.rel, updated: fm.updated, age});
}
stale.sort((a, b) => b.age - a.age);

const lines = [`Report of ${today.toISOString().slice(0, 10)}. Limit: ${days} days without verification.`, '', '## Pages to verify', ''];
if (!stale.length) lines.push('All pages were verified recently. Nothing to do.');
else {
  lines.push('| Page | Last verified | Days ago |', '| --- | --- | --- |');
  for (const s of stale) lines.push(`| [${s.rel}](${meta.repoUrl}/blob/${meta.editBranch}/docs/${encodeURI(s.rel)}) | ${s.updated} | ${s.age} |`);
  lines.push('', 'Check the numbers in game, fix what changed and set `updated:` to the day you verified it.');
}
lines.push('');
const report = lines.join('\n');
if (out) fs.writeFileSync(out, report);
else process.stdout.write(report);
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `count=${stale.length}\n`);
