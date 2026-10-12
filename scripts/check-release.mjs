// Checks that a pull request into main is a proper release (used by CI), and prints release notes.
//
//   node scripts/check-release.mjs --base origin/main   package.json version is valid, higher than on
//                                                       main, not tagged yet, and CHANGELOG.md has a
//                                                       dated, non-empty section for it
//   node scripts/check-release.mjs --notes [x.y.z]      print that CHANGELOG section (used to publish
//                                                       the GitHub Release); defaults to package.json

import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {root} from './site-meta.mjs';
import {compareSemver, findSection, parseSemver} from './lib/changelog.mjs';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};
const git = (...a) => execFileSync('git', a, {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
const fail = (msg) => {
  console.error(`check-release: ${msg}`);
  process.exit(1);
};

const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
const lines = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8').replace(/\r\n/g, '\n').split('\n');

if (args.includes('--notes')) {
  const wanted = args[args.indexOf('--notes') + 1];
  const v = wanted && !wanted.startsWith('--') ? wanted : version;
  const sec = findSection(lines, v);
  if (!sec || !sec.body) fail(`CHANGELOG.md has no notes for ${v}.`);
  console.log(sec.body);
  process.exit(0);
}

if (!parseSemver(version)) fail(`package.json version "${version}" is not x.y.z.`);

const sec = findSection(lines, version);
if (!sec) fail(`CHANGELOG.md has no "## [${version}] - YYYY-MM-DD" section. Run: npm run release -- patch|minor|major`);
if (!sec.date) fail(`the CHANGELOG.md section for ${version} needs a date: "## [${version}] - YYYY-MM-DD".`);
if (!sec.body) fail(`the CHANGELOG.md section for ${version} is empty.`);

const base = flag('--base');
if (base) {
  let baseVersion;
  try {
    baseVersion = JSON.parse(git('show', `${base}:package.json`)).version;
  } catch {
    fail(`could not read package.json from ${base}. Fetch it first: git fetch origin main`);
  }
  if (compareSemver(version, baseVersion) <= 0) {
    fail(
      `version ${version} is not higher than ${baseVersion} on ${base}. ` +
        'A pull request into main is a release: run "npm run release -- patch|minor|major" on dev first.',
    );
  }
  if (git('tag', '--list', `v${version}`)) fail(`tag v${version} already exists.`);
}

console.log(`check-release: OK, version ${version} (${sec.date})`);
