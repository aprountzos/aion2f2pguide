// One-time setup after you copy this project into your own GitHub repository.
//
//   npm run init -- --user <github-username> --repo <repo-name> --name "Your Name" [--branch main] [--dry-run]
//
// It writes site.config.json and replaces the placeholders
//   your-github-username / your-repo-name / YOUR NAME
// in the README, licenses, contributing docs, package.json, .github/ and docs/.

import fs from 'node:fs';
import path from 'node:path';
import {root} from './site-meta.mjs';

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i === -1 ? undefined : args[i + 1];
};
const dryRun = args.includes('--dry-run');
const user = get('--user');
const repo = get('--repo');
const name = get('--name');
const branch = get('--branch') || 'main';

const usage = () => {
  console.error(
    'Usage: npm run init -- --user <github-username> --repo <repo-name> --name "Your Name" [--branch main] [--dry-run]',
  );
  process.exit(1);
};

if (!user || !repo || !name) usage();
if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(user)) {
  console.error(`"${user}" is not a valid GitHub username (letters, digits and hyphens).`);
  process.exit(1);
}
if (!/^[A-Za-z0-9._-]+$/.test(repo)) {
  console.error(`"${repo}" is not a valid repository name (letters, digits, ".", "_" and "-").`);
  process.exit(1);
}

const REPLACEMENTS = [
  ['your-github-username', user],
  ['your-repo-name', repo],
  ['YOUR NAME', name],
];

const files = [];
const addFile = (rel) => {
  if (fs.existsSync(path.join(root, rel))) files.push(rel);
};
['README.md', 'CONTRIBUTING.md', 'MAINTAINING.md', 'SECURITY.md', 'RELEASING.md', 'CHANGELOG.md', 'giscus.json', 'CODE_OF_CONDUCT.md', 'LICENSE', 'LICENSE-CONTENT.md', 'package.json'].forEach(addFile);

function walk(rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return;
  for (const e of fs.readdirSync(full, {withFileTypes: true})) {
    const r = path.posix.join(rel, e.name);
    if (e.isDirectory()) walk(r);
    else files.push(r);
  }
}
walk('.github');
walk('docs');

let touched = 0;
for (const rel of files) {
  const full = path.join(root, rel);
  const before = fs.readFileSync(full, 'utf8');
  let after = before;
  for (const [from, to] of REPLACEMENTS) after = after.split(from).join(to);
  if (after !== before) {
    touched++;
    console.log(`${dryRun ? 'would update' : 'updated'}  ${rel}`);
    if (!dryRun) fs.writeFileSync(full, after);
  }
}

const cfgPath = path.join(root, 'site.config.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
Object.assign(cfg, {owner: user, repo, author: name, branch});
console.log(`${dryRun ? 'would write' : 'wrote'}    site.config.json`);
if (!dryRun) fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');

console.log(`\n${touched} file(s) ${dryRun ? 'would be ' : ''}updated.`);
console.log(`Site will be published at: https://${user.toLowerCase()}.github.io/${repo}/`);
console.log('\nNext steps (details in MAINTAINING.md):');
console.log(`  git init -b ${branch} && git add . && git commit -m "Initial commit"`);
console.log(`  git remote add origin https://github.com/${user}/${repo}.git && git push -u origin ${branch}`);
console.log('  GitHub: Settings -> Pages -> Source: GitHub Actions');
