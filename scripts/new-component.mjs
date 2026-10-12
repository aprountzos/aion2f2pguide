// Creates a new React component that pages can use as a widget.
//
//   npm run new-component -- MyComponent "What it does"
//
// It copies templates/component/ to src/components/MyComponent/. Then use it in an .mdx page, without an import:
//   <MyComponent />
// Guide: "Add a React Component" in the Contribute section of the site (docs/10-contribute).

import fs from 'node:fs';
import path from 'node:path';
import {root} from './site-meta.mjs';

const [name, ...rest] = process.argv.slice(2);
const description = rest.join(' ').replace(/"/g, "'").trim() || 'Describe what this component shows.';

if (!name || !/^[A-Z][A-Za-z0-9]*$/.test(name)) {
  console.error('Usage: npm run new-component -- MyComponent "What it does"');
  console.error('The name starts with a capital letter and has only letters and digits (PascalCase).');
  process.exit(1);
}
const dest = path.join(root, 'src', 'components', name);
if (fs.existsSync(dest)) {
  console.error(`new-component: src/components/${name} already exists.`);
  process.exit(1);
}
const src = path.join(root, 'templates', 'component');
fs.mkdirSync(dest, {recursive: true});
const id = name.replace(/^./, (c) => c.toLowerCase());
for (const f of fs.readdirSync(src)) {
  const text = fs
    .readFileSync(path.join(src, f), 'utf8')
    .replace(/__NAME__/g, name)
    .replace(/__ID__/g, id)
    .replace(/__DESCRIPTION__/g, description);
  fs.writeFileSync(path.join(dest, f), text);
}
console.log(`Created src/components/${name}/ (index.js, styles.module.css, widget.json)`);
console.log('Next steps:');
console.log(`  1. Edit src/components/${name}/index.js`);
console.log(`  2. Use it in an .mdx page:  <${name} />   (a page that uses a component must be named .mdx)`);
console.log('  3. npm start, then npm run check');
console.log('  Guide: Contribute -> Add a React Component');
