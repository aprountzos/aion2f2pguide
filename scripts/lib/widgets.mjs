// Widgets are React components in src/components/<Name>/ that pages (.mdx) can use directly, without an import:
//   <Name prop="text" count={3} flag />
// A folder is a widget when it has a widget.json next to index.js:
//   {"description": "...", "props": {"faction": {"type": "string", "required": false}}}
// Create one with: npm run new-component -- Name "What it does"

import fs from 'node:fs';
import path from 'node:path';
import {root} from '../site-meta.mjs';

export function listWidgets() {
  const dir = path.join(root, 'src', 'components');
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    if (!e.isDirectory()) continue;
    const meta = path.join(dir, e.name, 'widget.json');
    if (!fs.existsSync(meta) || !fs.existsSync(path.join(dir, e.name, 'index.js'))) continue;
    try {
      const j = JSON.parse(fs.readFileSync(meta, 'utf8'));
      out[e.name] = {description: j.description || '', props: j.props || {}};
    } catch (err) {
      out[e.name] = {description: '', props: {}, error: `src/components/${e.name}/widget.json is not valid JSON: ${err.message}`};
    }
  }
  return out;
}

/** Problems with the props given to a widget, as a list of messages. */
export function checkWidgetProps(name, props, widgets = listWidgets()) {
  const w = widgets[name];
  if (!w) return [`unknown widget "${name}". Available: ${Object.keys(widgets).join(', ') || 'none'}`];
  const errs = [];
  if (w.error) errs.push(w.error);
  for (const [key, value] of Object.entries(props)) {
    const def = w.props[key];
    if (!def) {
      errs.push(`widget ${name} has no property "${key}". It accepts: ${Object.keys(w.props).join(', ') || 'no properties'}`);
      continue;
    }
    const type = typeof value;
    if (type !== def.type) errs.push(`widget ${name}: property "${key}" must be a ${def.type}`);
    else if (def.values && !def.values.includes(value)) errs.push(`widget ${name}: property "${key}" must be one of ${def.values.join(', ')}`);
  }
  for (const [key, def] of Object.entries(w.props)) {
    if (def.required && !(key in props)) errs.push(`widget ${name}: property "${key}" is required`);
  }
  return errs;
}
