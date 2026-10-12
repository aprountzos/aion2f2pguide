// Content report for a pull request: what the change touches and whether the content is valid.
//
//   npm run pr-report -- --base dev                 compare your work with dev (commit first, or leave it uncommitted)
//   node scripts/pr-report.mjs --base <sha> --head <sha> --out pr-report.md --annotations   (used by the workflow)
//
// The report lists
//   - the changed files by area,
//   - for every changed data file: rows added, removed and changed (field by field),
//   - the pages that show that data,
//   - the lint result with file:line for every problem (the same checks as `npm run lint`),
//   - hints (a page was edited but its `updated:` date was not, a date in the future, ...).
// It never fails: it is a report. The "build" check is what blocks a merge.
//
// Options
//   --base REF      what to compare with (default: dev)
//   --head REF      the changed version. Left out: your working folder, including uncommitted files
//   --out FILE      write the markdown to a file (default: print it)
//   --annotations   also print GitHub workflow commands (::error file=...::) so problems show on the changed lines

import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import YAML from 'yaml';
import {root} from './site-meta.mjs';
import {WIDGET_DATA, sourceOf, TABLE_IDS} from './lib/data.mjs';
import {collectPages, pageUrl, parseFrontmatter, splitFrontmatter} from './lib/docs.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(n);
  return i === -1 ? d : args[i + 1];
};
const base = opt('--base', 'dev');
const head = opt('--head');
const outFile = opt('--out');
const annotate = args.includes('--annotations');

// ---------------------------------------------------------------- git helpers

function git(a, {allowFail = false} = {}) {
  const r = spawnSync('git', a, {cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024});
  if (r.status !== 0) {
    if (allowFail) return null;
    throw new Error(`git ${a.join(' ')} failed: ${(r.stderr || '').trim()}`);
  }
  return r.stdout;
}

function finish(markdown) {
  if (markdown.length > 60000) markdown = markdown.slice(0, 60000) + '\n\n…the report was shortened.\n';
  if (outFile) fs.writeFileSync(outFile, markdown);
  else process.stdout.write(markdown);
  process.exit(0);
}

if (git(['rev-parse', '--git-dir'], {allowFail: true}) === null) {
  finish('<!-- pr-report -->\n## Content report\n\nThis folder is not a git repository, so there is nothing to compare. Run `git init` first, or use the report on a pull request.\n');
}
const mergeBase = (git(['merge-base', base, head || 'HEAD'], {allowFail: true}) || '').trim();
if (!mergeBase) {
  finish(`<!-- pr-report -->\n## Content report\n\nCould not find the branch \`${base}\`. Try \`--base upstream/dev\` or \`--base origin/dev\`.\n`);
}

const readBase = (file) => git(['show', `${mergeBase}:${file}`], {allowFail: true});
const readHead = (file) => {
  if (head) return git(['show', `${head}:${file}`], {allowFail: true});
  const abs = path.join(root, file);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
};

// ---------------------------------------------------------------- changed files

const changes = []; // {status: 'A'|'M'|'D', file}
const diff = git(['diff', '--name-status', '-M', mergeBase, ...(head ? [head] : [])]) || '';
for (const line of diff.split('\n').filter(Boolean)) {
  const [st, a, b] = line.split('\t');
  if (st.startsWith('R')) {
    changes.push({status: 'D', file: a});
    changes.push({status: 'A', file: b});
  } else changes.push({status: st[0], file: a});
}
if (!head) {
  for (const f of (git(['ls-files', '--others', '--exclude-standard']) || '').split('\n').filter(Boolean)) changes.push({status: 'A', file: f});
}
changes.sort((x, y) => x.file.localeCompare(y.file));

const area = (f) => {
  if (/^docs\/.+\.mdx?$/.test(f) && f !== 'docs/changelog.md') return 'Pages';
  if (/^docs\//.test(f)) return 'Page settings';
  if (/^data\/.+\.ya?ml$/.test(f)) return 'Data';
  if (/^src\//.test(f)) return 'Website code';
  if (/^(scripts|templates)\//.test(f)) return 'Scripts';
  if (/^\.github\//.test(f)) return 'GitHub settings';
  if (/^static\//.test(f)) return 'Images and static files';
  return 'Other files';
};
const byArea = new Map();
for (const c of changes) {
  const a = area(c.file);
  if (!byArea.has(a)) byArea.set(a, []);
  byArea.get(a).push(c);
}
const mark = {A: 'new', M: 'changed', D: 'deleted'};

// ---------------------------------------------------------------- data diff

const KEY = {
  'data/zones.yml': (r) => r.name,
  'data/nodes.yml': (r) => r.zone,
  'data/leather.yml': (r) => String(r.mob).replace(/\*\*/g, ''),
  'data/milestones.yml': (r) => String(r.level),
  'data/patches.yml': (r) => r.date,
  'data/items.yml': (r) => r.id,
  'data/questions.yml': (r) => r.id,
};

function rowsOf(file, text) {
  const out = new Map();
  if (text === null || text === undefined) return out;
  let doc;
  try {
    doc = YAML.parse(text);
  } catch {
    return out;
  }
  const keyOf = KEY[file] || ((r) => JSON.stringify(r).slice(0, 40));
  const add = (group, list) => {
    if (!Array.isArray(list)) return;
    const seen = new Map();
    for (const r of list) {
      if (!r || typeof r !== 'object') continue;
      let k = `${group}${keyOf(r)}`;
      const n = (seen.get(k) || 0) + 1;
      seen.set(k, n);
      if (n > 1) k += ` #${n}`;
      out.set(k, r);
    }
  };
  if (Array.isArray(doc)) add('', doc);
  else if (doc && typeof doc === 'object') for (const [g, list] of Object.entries(doc)) add(`${g}: `, list);
  return out;
}

const show = (v) => {
  const s = typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);
  return s.length > 70 ? s.slice(0, 67) + '…' : s;
};

function dataDiff(file) {
  const before = rowsOf(file, readBase(file));
  const after = rowsOf(file, readHead(file));
  const lines = [];
  let added = 0;
  let removed = 0;
  let changed = 0;
  for (const [k, r] of after) {
    if (!before.has(k)) {
      added++;
      lines.push(`- ➕ **${k}**`);
      continue;
    }
    const o = before.get(k);
    const fields = [...new Set([...Object.keys(o), ...Object.keys(r)])].filter((f) => JSON.stringify(o[f]) !== JSON.stringify(r[f]));
    if (fields.length) {
      changed++;
      lines.push(`- ✏️ **${k}**: ` + fields.map((f) => `\`${f}\` ${o[f] === undefined ? '(new)' : show(o[f])} → ${r[f] === undefined ? '(removed)' : show(r[f])}`).join('; '));
    }
  }
  for (const k of before.keys()) {
    if (!after.has(k)) {
      removed++;
      lines.push(`- ➖ **${k}**`);
    }
  }
  return {added, removed, changed, lines};
}

// ---------------------------------------------------------------- which pages show which data

const pages = collectPages(path.join(root, 'docs'), {skip: ['changelog.md']}).map((p) => {
  const text = fs.readFileSync(p.abs, 'utf8').replace(/\r\n/g, '\n');
  const fm = parseFrontmatter(splitFrontmatter(text).fm);
  const uses = new Set();
  for (const m of text.matchAll(/<DataTable\s+id="([a-z0-9-]+)"/g)) {
    const src = TABLE_IDS.includes(m[1]) ? sourceOf(m[1]) : null;
    if (src) uses.add(src);
  }
  for (const w of Object.keys(WIDGET_DATA)) if (new RegExp(`<${w}[\\s/>]`).test(text)) for (const f of WIDGET_DATA[w]) uses.add(f);
  if (/<!-- data:begin patches/.test(text)) uses.add('data/patches.yml');
  return {rel: `docs/${p.rel}`, updated: fm.updated || '', url: pageUrl(p.rel, fm.slug), uses};
});

// ---------------------------------------------------------------- lint

const lint = spawnSync('node', ['scripts/lint-docs.mjs'], {cwd: root, encoding: 'utf8'});
const problems = [];
for (const raw of `${lint.stdout}\n${lint.stderr}`.split('\n')) {
  const m = /^(error|warning)\s+(\S+?)(?::(\d+))?\s{2}(.*)$/.exec(raw);
  if (!m) continue;
  let [, level, file, line, msg] = m;
  const d = /^(data\/[a-z0-9-]+\.ya?ml)\b/.exec(msg);
  if (file === 'data' && d) {
    file = d[1];
    msg = msg.slice(d[1].length).trim();
  }
  problems.push({level, file, line: line ? Number(line) : 0, msg});
}
const lintCrashed = lint.status !== 0 && problems.filter((p) => p.level === 'error').length === 0;
const errors = problems.filter((p) => p.level === 'error');
const warnings = problems.filter((p) => p.level === 'warning');
const changedFiles = new Set(changes.map((c) => c.file));

// ---------------------------------------------------------------- hints

const hints = [];
const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
for (const c of changes) {
  if (area(c.file) !== 'Pages' || c.status === 'D') continue;
  const now = readHead(c.file);
  if (now === null) continue;
  const {fm: fmNow, body: bodyNow} = splitFrontmatter(now.replace(/\r\n/g, '\n'));
  const upNow = parseFrontmatter(fmNow).updated;
  if (upNow && upNow > tomorrow) hints.push(`\`${c.file}\`: \`updated: ${upNow}\` is in the future.`);
  if (c.status === 'M') {
    const was = readBase(c.file);
    if (was === null) continue;
    const {fm: fmWas, body: bodyWas} = splitFrontmatter(was.replace(/\r\n/g, '\n'));
    if (bodyWas !== bodyNow && parseFrontmatter(fmWas).updated === upNow) {
      hints.push(`\`${c.file}\`: the text changed but \`updated: ${upNow}\` did not. If you verified the data, set it to today (${today}). If it was only a typo, ignore this.`);
    }
  }
}
const dataChanged = changes.filter((c) => area(c.file) === 'Data');
if (dataChanged.some((c) => /(zones|nodes|leather|milestones|patches)\.yml$/.test(c.file)) && !changedFiles.has('site.config.json')) {
  hints.push('Game data changed. If you re-verified it, a maintainer can set `dataChecked` in `site.config.json` when releasing.');
}
if (changes.some((c) => c.file.startsWith('data/') && c.status !== 'D') && !changes.some((c) => c.file.startsWith('docs/'))) {
  hints.push('Only data files changed. The pages that show this data keep their old "last verified" date, see the list above.');
}

// ---------------------------------------------------------------- write the report

const out = ['<!-- pr-report -->', '## Content report', ''];
const sha = head ? head.slice(0, 7) : 'your working folder';
if (lintCrashed) {
  out.push(`❌ The content check could not run. Run \`npm run lint\` to see why.`, '');
} else if (errors.length) {
  out.push(`❌ **${errors.length} problem${errors.length === 1 ? '' : 's'} to fix** before this can be merged${warnings.length ? `, and ${warnings.length} warning${warnings.length === 1 ? '' : 's'}` : ''}. (${sha} compared with \`${base}\`)`, '');
} else {
  out.push(`✅ **The content is valid**${warnings.length ? `, with ${warnings.length} warning${warnings.length === 1 ? '' : 's'}` : ''}. (${sha} compared with \`${base}\`)`, '');
}

if (!changes.length) out.push('No changed files found.', '');
else {
  out.push('### What changed', '', '| Area | Files |', '| --- | --- |');
  for (const [a, list] of byArea) out.push(`| ${a} | ${list.map((c) => `\`${c.file}\` (${mark[c.status] || c.status})`).join('<br>')} |`);
  out.push('');
}

for (const c of dataChanged) {
  out.push(`### Data: \`${c.file}\``, '');
  if (c.status === 'D') {
    out.push('The file was deleted.', '');
    continue;
  }
  const d = dataDiff(c.file);
  out.push(`${d.added} added, ${d.changed} changed, ${d.removed} removed.`, '');
  out.push(...d.lines.slice(0, 40));
  if (d.lines.length > 40) out.push(`- …and ${d.lines.length - 40} more`);
  out.push('');
  const shown = pages.filter((p) => p.uses.has(c.file));
  if (shown.length) {
    out.push('Shown on: ' + shown.map((p) => `\`${p.rel}\`${p.updated ? ` (verified ${p.updated})` : ''}${changedFiles.has(p.rel) ? '' : ''}`).join(', '), '');
  } else out.push('No page shows this file yet.', '');
}

if (errors.length || warnings.length) {
  out.push('### Problems', '');
  for (const p of [...errors, ...warnings].sort((x, y) => Number(changedFiles.has(y.file)) - Number(changedFiles.has(x.file)))) {
    out.push(`- ${p.level === 'error' ? '❌' : '⚠️'} \`${p.file}${p.line ? `:${p.line}` : ''}\` ${p.msg}${changedFiles.has(p.file) ? '' : ' _(in a file this change did not touch)_'}`);
  }
  out.push('');
}

if (hints.length) {
  out.push('### Hints', '', ...hints.map((h) => `- ${h}`), '');
}

out.push('<sub>This report is made by `scripts/pr-report.mjs`. Run it yourself with `npm run pr-report -- --base dev`. It only reports, the **build** check decides whether the pull request can be merged.</sub>', '');

if (annotate) {
  const esc = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
  for (const p of problems) {
    const where = fs.existsSync(path.join(root, p.file)) ? `file=${p.file}${p.line ? `,line=${p.line}` : ''}` : '';
    console.log(`::${p.level === 'error' ? 'error' : 'warning'} ${where}::${esc(p.msg)}`);
  }
}
finish(out.join('\n'));
