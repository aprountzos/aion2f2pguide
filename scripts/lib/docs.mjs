// Shared helpers for reading the pages in docs/.

import fs from 'node:fs';
import path from 'node:path';

/** Admonition types Docusaurus knows: :::tip ... ::: */
export const ADMONITION_TYPES = new Set(['note', 'tip', 'info', 'warning', 'danger', 'caution']);

export const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** "01-basics" -> "basics", "03 Gathering" -> "Gathering" */
export const stripNumberPrefix = (s) => s.replace(/^\d+\s*[-_.]+\s*/, '').replace(/^\d+\s+/, '');

/** "03-gathering/gathering-by-level.mdx" -> "gathering/gathering-by-level" (the Docusaurus doc id) */
export const docId = (rel) =>
  rel
    .replace(/\.mdx?$/, '')
    .split('/')
    .map((seg) => stripNumberPrefix(seg))
    .join('/');

export function splitFrontmatter(text) {
  if (!text.startsWith('---\n')) return {fm: '', body: text, hasFrontmatter: false};
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return {fm: '', body: text, hasFrontmatter: false};
  return {fm: text.slice(4, end), body: text.slice(end + 5), hasFrontmatter: true};
}

/** Minimal "key: value" parser, enough for the frontmatter used in these pages. */
export function parseFrontmatter(fm) {
  const out = {};
  for (const line of fm.split('\n')) {
    const m = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^(["'])(.*)\1$/, '$2');
  }
  return out;
}

export const readPage = (file) => {
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  return {text, ...splitFrontmatter(text)};
};

/**
 * Every .md/.mdx page below a folder. Folders and files starting with "." or "_" are ignored.
 * `skip` lists relative paths to leave out (the generated docs/changelog.md).
 * Returns [{abs, rel, id, parts}] sorted by path. `rel` is relative to `dir`, with "/" separators.
 */
export function collectPages(dir, {skip = []} = {}) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const walk = (d, parts) => {
    const entries = fs.readdirSync(d, {withFileTypes: true}).sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name.startsWith('_')) continue;
      const abs = path.join(d, e.name);
      if (e.isDirectory()) walk(abs, [...parts, e.name]);
      else if (/\.mdx?$/.test(e.name)) {
        const rel = [...parts, e.name].join('/');
        if (skip.includes(rel)) continue;
        out.push({abs, rel, id: docId(rel), parts});
      }
    }
  };
  walk(dir, []);
  return out;
}

/** Folders below a directory (relative paths), ignoring "." and "_" folders. */
export function collectDirs(dir) {
  const out = [];
  const walk = (d, parts) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, {withFileTypes: true})) {
      if (!e.isDirectory() || e.name.startsWith('.') || e.name.startsWith('_')) continue;
      out.push([...parts, e.name].join('/'));
      walk(path.join(d, e.name), [...parts, e.name]);
    }
  };
  walk(dir, []);
  return out;
}

/** Apply fn to the parts of the text that are outside ``` fenced code blocks. */
export function mapOutsideFences(text, fn) {
  const out = [];
  let buf = [];
  let fenced = false;
  const flush = () => {
    if (buf.length) out.push(fn(buf.join('\n')));
    buf = [];
  };
  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      if (!fenced) flush();
      fenced = !fenced;
      out.push(line);
    } else if (fenced) {
      out.push(line);
    } else {
      buf.push(line);
    }
  }
  flush();
  return out.join('\n');
}

/** Apply fn to the text outside fenced code blocks AND outside `inline code` spans. */
export function mapOutsideCode(text, fn) {
  return mapOutsideFences(text, (chunk) =>
    chunk
      .split(/(`[^`\n]*`)/)
      .map((part, i) => (i % 2 ? part : fn(part)))
      .join(''),
  );
}

/** Iterate lines outside fenced code blocks: yields {line, n}. */
export function* proseLines(text) {
  let fenced = false;
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*(```|~~~)/.test(lines[i])) {
      fenced = !fenced;
      continue;
    }
    if (!fenced) yield {line: lines[i], n: i + 1};
  }
}

// ---------------------------------------------------------------- components in .mdx pages

/** A component tag in a page: <LevelFinder />, <DataTable id="x" />. Names start with a capital letter. */
export const JSX_TAG_RE = /<([A-Z][A-Za-z0-9]*)((?:\s+[A-Za-z][A-Za-z0-9-]*(?:\s*=\s*(?:"[^"]*"|\{[^{}]*\}))?)*)\s*\/?>/g;

/** Parse the attributes of a component tag: key="text", key={3}, key={true}, key. Returns {props, error}. */
export function parseJsxProps(attrString) {
  const props = {};
  const re = /([A-Za-z][A-Za-z0-9-]*)(?:\s*=\s*(?:"([^"]*)"|\{\s*([^{}]*?)\s*\}))?/g;
  let m;
  while ((m = re.exec(attrString || ''))) {
    const key = m[1];
    if (key in props) return {props, error: `property "${key}" is given twice`};
    if (m[2] !== undefined) props[key] = m[2];
    else if (m[3] === undefined) props[key] = true;
    else {
      const v = m[3];
      if (/^-?\d+(\.\d+)?$/.test(v)) props[key] = Number(v);
      else if (v === 'true' || v === 'false') props[key] = v === 'true';
      else if (/^(["'])(.*)\1$/.test(v)) props[key] = v.slice(1, -1);
      else return {props, error: `property "${key}": only text, numbers and true/false are allowed (got {${v}})`};
    }
  }
  return {props, error: null};
}
