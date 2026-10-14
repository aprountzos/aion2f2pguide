// Creates a new page from templates/page.md.
//
//   npm run new-page -- "<folder>" "<Page title>" [--position N]
//
// Example:
//   npm run new-page -- "03-gathering/nodes" "Diamond Nodes"
//   npm run new-page -- "11-classes/gladiator" "Leveling 1 to 45"   (a class guide: uses templates/class-guide.md)
// The folder is a folder inside docs/ (see the list printed when it does not exist).

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import {root} from './site-meta.mjs';
import {collectDirs, collectPages, parseFrontmatter, slugify, splitFrontmatter} from './lib/docs.mjs';

const args = process.argv.slice(2);
const posIdx = args.indexOf('--position');
let position = null;
if (posIdx !== -1) {
  position = parseInt(args[posIdx + 1], 10);
  args.splice(posIdx, 2);
}
const [folder, title] = args;

if (!folder || !title) {
  console.error('Usage: npm run new-page -- "<folder>" "<Page title>" [--position N]');
  console.error('Example: npm run new-page -- "03-gathering/nodes" "Diamond Nodes"');
  process.exit(1);
}

const docs = path.join(root, 'docs');
const dir = path.resolve(docs, folder);
if (dir !== docs && !dir.startsWith(docs + path.sep)) {
  console.error('The folder must be inside docs/.');
  process.exit(1);
}
if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
  console.error(`Folder not found: docs/${folder}\nExisting folders:\n  ${collectDirs(docs).join('\n  ')}`);
  process.exit(1);
}
if (/[#^\[\]|\\:*?"<>\/]/.test(title)) {
  console.error('The title cannot contain # ^ [ ] | \\ / : * ? " < >');
  process.exit(1);
}

const slug = slugify(title);
if (!slug) {
  console.error('The title needs letters or digits.');
  process.exit(1);
}
const taken = collectPages(docs).find((p) => path.posix.basename(p.rel).replace(/\.mdx?$/, '') === slug);
if (taken) {
  console.error(`A page with the file name "${slug}" already exists (docs/${taken.rel}). Choose another title.`);
  process.exit(1);
}

if (position === null) {
  const used = fs
    .readdirSync(dir)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => Number(parseFrontmatter(splitFrontmatter(fs.readFileSync(path.join(dir, f), 'utf8')).fm).sidebar_position))
    .filter((n) => Number.isFinite(n));
  position = used.length ? Math.max(...used) + 1 : 1;
}

const rel = (to) => {
  const r = path.relative(dir, path.join(docs, to)).split(path.sep).join('/');
  return r.startsWith('.') ? r : './' + r;
};
const today = new Date().toISOString().slice(0, 10);

// A page in docs/11-classes/<class>/ is a class guide: it uses its own template and needs no sidebar_position.
const classId = (path.relative(docs, dir).split(path.sep).join('/').match(/^11-classes\/([^/]+)$/) || [])[1];
let content;
if (classId) {
  const classes = YAML.parse(fs.readFileSync(path.join(root, 'data', 'classes.yml'), 'utf8')) || [];
  const found = classes.find((c) => c.id === classId);
  if (!found) {
    console.error(`"${classId}" is not a class in data/classes.yml. Classes: ${classes.map((c) => c.id).join(', ')}`);
    process.exit(1);
  }
  content = fs
    .readFileSync(path.join(root, 'templates', 'class-guide.md'), 'utf8')
    .replaceAll('{{DATE}}', today)
    .replaceAll('{{CLASS}}', found.name)
    .replace(/^# .*$/m, `# ${found.name}: ${title}`);
} else {
  content = fs
    .readFileSync(path.join(root, 'templates', 'page.md'), 'utf8')
    .replaceAll('{{DATE}}', today)
    .replaceAll('{{POSITION}}', String(position))
    .replaceAll('{{TITLE}}', title)
    .replaceAll('{{HOME}}', rel('index.mdx'))
    .replaceAll('{{SOURCES}}', rel('09-reference/sources.md'));
}

const dest = path.join(dir, `${slug}.md`);
fs.writeFileSync(dest, content);

console.log(`Created docs/${path.relative(docs, dest).split(path.sep).join('/')}`);
console.log('Next steps:');
console.log(classId ? '  1. Replace every placeholder line (TODO) and set your GitHub name in author:.' : '  1. Write the content (keep numbers exact, add sources to docs/09-reference/sources.md).');
if (!classId) console.log('  2. Link to it from a related page and from the front page (docs/index.mdx) if it is a major topic.');
console.log(`  ${classId ? 2 : 3}. npm run check   (lint + build)`);
