// Prepares the generated files the site needs. Runs automatically before `npm start` and `npm run build`.
//
//   node scripts/prepare-site.mjs
//
// The pages themselves are NOT generated: docs/ is the source. This script only writes
//   - docs/changelog.md          from CHANGELOG.md (git-ignored)
//   - src/generated/data.json       tables and lists for the website components (git-ignored)
//   - src/generated/items.json      the item database (<ItemDatabase />)
//   - src/generated/questions.json  the answered questions (<Questions />)
//   - src/generated/sections.json   the directory on the home page (<Home />), read from the docs/ folders

import fs from 'node:fs';
import path from 'node:path';
import {meta, root} from './site-meta.mjs';
import {NODE_LABELS, NODE_TYPES, buildItems, buildQuestions, buildTables, loadData} from './lib/data.mjs';
import {buildSections, pageIndex} from './lib/docs.mjs';

const DOCS = path.join(root, 'docs');
const GENERATED = path.join(root, 'src', 'generated');

if (!fs.existsSync(DOCS)) {
  console.error('prepare-site: the docs/ folder is missing. The pages of the guide live there.');
  process.exit(1);
}
const {data, errors} = loadData(root);
if (errors.length) {
  for (const e of errors) console.error(`prepare-site: ${e}`);
  console.error('prepare-site: fix the data files first (npm run lint shows the same errors).');
  process.exit(1);
}

// ---- changelog page (generated from CHANGELOG.md, so the file is git-ignored)
const changelogPath = path.join(root, 'CHANGELOG.md');
if (fs.existsSync(changelogPath)) {
  const text = fs
    .readFileSync(changelogPath, 'utf8')
    .replace(/\r\n/g, '\n')
    .replace(/\]\((RELEASING|CONTRIBUTING|MAINTAINING)\.md\)/g, `](${meta.repoUrl}/blob/${meta.branch}/$1.md)`);
  fs.writeFileSync(
    path.join(DOCS, 'changelog.md'),
    `---\nslug: /changelog\nsidebar_position: 99\nsidebar_label: Changelog\ncomments: false\nstaleness: false\ncorrections: false\ncustom_edit_url: null\n---\n${text}`,
  );
}

// ---- data for the website components
fs.mkdirSync(GENERATED, {recursive: true});
fs.writeFileSync(
  path.join(GENERATED, 'data.json'),
  JSON.stringify({
    staleDays: meta.staleDays,
    nodeTypes: NODE_TYPES,
    nodeLabels: NODE_LABELS,
    zones: data.zones,
    nodes: data.nodes,
    leather: data.leather,
    milestones: data.milestones,
    patches: (data.patches || []).slice(0, 3),
    tables: {en: buildTables(data, 'en')},
  }) + '\n',
);
const pages = pageIndex(DOCS);
fs.writeFileSync(path.join(GENERATED, 'items.json'), JSON.stringify(buildItems(data, pages)) + '\n');
fs.writeFileSync(path.join(GENERATED, 'questions.json'), JSON.stringify(buildQuestions(data, pages)) + '\n');
fs.writeFileSync(path.join(GENERATED, 'sections.json'), JSON.stringify(buildSections(DOCS)) + '\n');
if (!fs.existsSync(path.join(GENERATED, 'contributors.json'))) {
  fs.writeFileSync(path.join(GENERATED, 'contributors.json'), '[]\n');
}
console.log('prepare-site: ok');
