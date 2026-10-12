// Prepares a release on the dev (or a hotfix/*) branch:
//   - works out the next version (patch / minor / major / exact x.y.z)
//   - writes the new section in CHANGELOG.md (from the Unreleased notes, or from commit titles)
//   - bumps the version in package.json and package-lock.json
//   - commits "release: vX.Y.Z"
// It never tags. Tagging and the GitHub Release happen automatically after the release pull request
// (dev -> main) is merged. With --push it also pushes the branch and opens that pull request
// (needs the GitHub CLI `gh`; without it the script prints the link). See RELEASING.md.
//
//   npm run release -- patch|minor|major|x.y.z [--push] [--dry-run] [--date YYYY-MM-DD] [--data-checked YYYY-MM-DD]

import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {root, meta} from './site-meta.mjs';
import {bump, compareSemver, findSection, parseSemver} from './lib/changelog.mjs';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const dry = args.includes('--dry-run');
const push = args.includes('--push');
const kind = args.find((a, i) => !a.startsWith('--') && !['--date', '--data-checked'].includes(args[i - 1]));
const today = new Date().toISOString().slice(0, 10);
const date = flag('--date') || today;
const dataChecked = flag('--data-checked');

const fail = (msg) => {
  console.error(`release: ${msg}`);
  process.exit(1);
};
const git = (...a) => execFileSync('git', a, {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();

if (!kind) {
  fail('Usage: npm run release -- patch|minor|major|x.y.z [--push] [--dry-run] [--date YYYY-MM-DD] [--data-checked YYYY-MM-DD]');
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) fail('--date must look like 2026-10-10');
if (dataChecked && !/^\d{4}-\d{2}-\d{2}$/.test(dataChecked)) fail('--data-checked must look like 2026-10-10');

// --- where are we?
const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
if (branch !== 'dev' && !branch.startsWith('hotfix/')) {
  const msg = `releases are prepared on the "dev" branch (or a "hotfix/..." branch), you are on "${branch}".`;
  if (dry) console.warn(`warning: ${msg}`);
  else fail(msg);
}
if (git('status', '--porcelain')) {
  const msg = 'the working tree has uncommitted changes. Commit or stash them first.';
  if (dry) console.warn(`warning: ${msg}`);
  else fail(msg);
}

// --- next version
const pkgPath = path.join(root, 'package.json');
const pkgText = fs.readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(pkgText);
const current = pkg.version;
if (!parseSemver(current)) fail(`package.json version "${current}" is not x.y.z`);
const next = parseSemver(kind) ? kind : bump(current, kind);
if (!next) fail(`"${kind}" is not patch, minor, major or an exact version like 0.1.0`);
if (compareSemver(next, current) <= 0) fail(`the new version ${next} must be higher than the current ${current}`);

// --- previous release (latest v* tag by version number)
const tags = git('tag', '--list', 'v[0-9]*', '--sort=-v:refname').split('\n').filter(Boolean);
if (tags.includes(`v${next}`)) fail(`tag v${next} already exists`);
const prevTag = tags[0];
if (!prevTag) console.warn('note: no release tag found (first release, or tags not fetched: git fetch --tags).');

// --- changelog section
const clPath = path.join(root, 'CHANGELOG.md');
if (!fs.existsSync(clPath)) fail('CHANGELOG.md is missing.');
const clLines = fs.readFileSync(clPath, 'utf8').replace(/\r\n/g, '\n').split('\n');
const unreleased = findSection(clLines, 'Unreleased');
if (!unreleased) fail('CHANGELOG.md needs a "## [Unreleased]" heading.');
if (findSection(clLines, next)) fail(`CHANGELOG.md already has a section for ${next}.`);

const GROUPS = [
  ['Added', ['add', 'feat']],
  ['Data updates', ['data']],
  ['Fixed', ['fix']],
  ['Maintenance', ['docs', 'chore', 'ci', 'deps', 'refactor', 'style', 'build']],
];

function generate() {
  const range = prevTag ? [`${prevTag}..HEAD`] : ['HEAD'];
  const subjects = git('log', ...range, '--no-merges', '--pretty=format:%s')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s && !/^release:/i.test(s) && !/^merge\b/i.test(s));
  const buckets = new Map(GROUPS.map(([title]) => [title, []]));
  buckets.set('Other', []);
  for (const s of subjects) {
    const m = /^([a-z]+)(?:\([^)]*\))?!?:\s*(.+)$/i.exec(s);
    const prefix = m ? m[1].toLowerCase() : '';
    const text = (m ? m[2] : s).replace(/^./, (c) => c.toUpperCase());
    const group = GROUPS.find(([, prefixes]) => prefixes.includes(prefix));
    buckets.get(group ? group[0] : 'Other').push(`- ${text}`);
  }
  const out = [];
  for (const [title, items] of buckets) if (items.length) out.push(`### ${title}\n\n${items.join('\n')}`);
  return out.join('\n\n');
}

let body = unreleased.body;
let source = 'the Unreleased notes in CHANGELOG.md';
if (!body) {
  body = generate();
  source = prevTag ? `commit titles since ${prevTag}` : 'all commit titles';
}
if (!body) fail('nothing to release: no Unreleased notes and no commits since the last release.');

const checked = dataChecked || meta.dataChecked;
const section = `## [${next}] - ${date}\n\nData checked: ${checked}\n\n${body.trim()}\n`;

// --- assemble the new CHANGELOG
const before = clLines.slice(0, unreleased.start + 1);
const after = clLines.slice(unreleased.end);
let refs = [];
const keep = [];
for (const l of after) (/^\[[^\]]+\]:\s*\S+/.test(l) ? refs : keep).push(l);
refs = refs.filter((l) => !/^\[Unreleased\]:/i.test(l));
const compare = prevTag ? `${meta.repoUrl}/compare/${prevTag}...v${next}` : `${meta.repoUrl}/releases/tag/v${next}`;
const newRefs = [`[Unreleased]: ${meta.repoUrl}/compare/v${next}...HEAD`, `[${next}]: ${compare}`, ...refs];
const newChangelog =
  [...before, '', ...section.split('\n'), ...keep].join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s+$/, '') +
  '\n\n' +
  newRefs.join('\n') +
  '\n';

console.log(`release: ${current} -> ${next} (${kind}) on ${branch}, notes from ${source}\n`);
console.log(section);

if (dry) {
  console.log('release: dry run, nothing was written.');
  process.exit(0);
}

// --- write files
fs.writeFileSync(clPath, newChangelog);
fs.writeFileSync(pkgPath, pkgText.replace(/("version":\s*")[^"]+(")/, `$1${next}$2`));
const lockPath = path.join(root, 'package-lock.json');
const touched = ['package.json', 'package-lock.json', 'CHANGELOG.md'];
if (fs.existsSync(lockPath)) {
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  lock.version = next;
  if (lock.packages && lock.packages['']) lock.packages[''].version = next;
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n');
}
if (dataChecked) {
  const cfgPath = path.join(root, 'site.config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  cfg.dataChecked = dataChecked;
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
  touched.push('site.config.json');
}

git('add', ...touched);
git('commit', '-m', `release: v${next}`);

console.log(`release: committed "release: v${next}".`);

if (!push) {
  console.log(`Next steps (details in RELEASING.md):`);
  console.log(`  1. Read CHANGELOG.md and edit the wording if you like (git commit --amend).`);
  console.log(`  2. git push origin ${branch}`);
  console.log(`  3. Open a pull request ${branch} -> main titled "Release v${next}" and merge it with "Create a merge commit".`);
  console.log(`     (with the GitHub CLI: gh pr create --base main --head ${branch} --title "Release v${next}" --fill)`);
  console.log(`  4. The site deploys and the tag v${next} + GitHub Release are created automatically.`);
  console.log(`Next time, add --push to do steps 2 and 3 in one go.`);
  process.exit(0);
}

// --- --push: push the branch and open the release pull request
try {
  execFileSync('git', ['push', 'origin', branch], {cwd: root, stdio: 'inherit'});
} catch {
  fail(
    `the release commit is made, but pushing "${branch}" failed. If GitHub says the branch is protected ` +
      `(repository rule violations), add yourself to the Bypass list of the "${branch === 'dev' ? 'dev' : 'branch'}" ruleset ` +
      `(MAINTAINING.md, 1.8) and run: git push origin ${branch}`,
  );
}
const title = `Release v${next}`;
try {
  execFileSync('gh', ['pr', 'create', '--base', 'main', '--head', branch, '--title', title, '--fill'], {cwd: root, stdio: 'inherit'});
  console.log(`release: pull request opened. Merge it with "Create a merge commit" once build and policy are green.`);
} catch {
  console.log(`release: pushed. Open the pull request in the browser (or install the GitHub CLI):`);
  console.log(`  ${meta.repoUrl}/compare/main...${branch}?expand=1   (title "${title}")`);
  console.log(`Merge it with "Create a merge commit". The site deploys and v${next} is tagged automatically.`);
}
