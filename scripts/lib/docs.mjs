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

// ---------------------------------------------------------------- page lookup by name

/** The site address of a page ("/gathering/nodes/ore-orichalcum"), from its file path and frontmatter. */
export function pageUrl(rel, slug) {
  let id = docId(rel);
  if (id === 'index') id = '';
  else if (id.endsWith('/index')) id = id.slice(0, -'/index'.length);
  if (slug) {
    if (slug.startsWith('/')) return slug;
    const dir = id.includes('/') ? id.slice(0, id.lastIndexOf('/')) : '';
    return '/' + [dir, slug].filter(Boolean).join('/');
  }
  return '/' + id;
}

/**
 * Pages by name: Map(slugified file name -> {rel, url, title}). Data files refer to pages by file name
 * ("Raw Leather" or "raw-leather"), see `pages:` in data/items.yml and data/questions.yml.
 */
export function pageIndex(dir) {
  const index = new Map();
  for (const p of collectPages(dir, {skip: ['changelog.md']})) {
    const {fm, body} = readPage(p.abs);
    const title = (body.match(/^#\s+(.+?)\s*$/m) || [])[1] || p.rel;
    const entry = {rel: p.rel, url: pageUrl(p.rel, parseFrontmatter(fm).slug), title};
    index.set(slugify(path.posix.basename(p.rel).replace(/\.mdx?$/, '')), entry);
  }
  return index;
}

// ---------------------------------------------------------------- the home page directory

/**
 * The sections of the guide for the home page, read from docs/: one section per numbered folder
 * (docs/03-gathering/), its label and description from _category_.json, its pages in sidebar order.
 * New pages and folders show up on the home page without editing it.
 */
export function buildSections(dir) {
  const readJson = (file) => {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return {};
    }
  };
  const order = (a, b) => a.position - b.position || a.title.localeCompare(b.title);
  const sections = [];
  for (const e of fs.readdirSync(dir, {withFileTypes: true})) {
    if (!e.isDirectory() || e.name.startsWith('.') || e.name.startsWith('_') || !/^\d+[-_ ]/.test(e.name)) continue;
    const folder = path.join(dir, e.name);
    const cat = readJson(path.join(folder, '_category_.json'));
    const pages = [];
    const groups = [];
    for (const f of fs.readdirSync(folder, {withFileTypes: true})) {
      if (f.name.startsWith('.') || f.name.startsWith('_')) continue;
      if (f.isFile() && /\.mdx?$/.test(f.name)) {
        const rel = `${e.name}/${f.name}`;
        const {fm, body} = readPage(path.join(folder, f.name));
        const front = parseFrontmatter(fm);
        pages.push({
          title: front.sidebar_label || (body.match(/^#\s+(.+?)\s*$/m) || [])[1] || f.name,
          url: pageUrl(rel, front.slug),
          position: Number.isFinite(Number(front.sidebar_position)) ? Number(front.sidebar_position) : 999,
        });
      } else if (f.isDirectory() && !f.name.startsWith('_')) {
        const sub = readJson(path.join(folder, f.name, '_category_.json'));
        const count = collectPages(path.join(folder, f.name)).length;
        if (count) {
          groups.push({
            title: sub.label || stripNumberPrefix(f.name),
            url: sub.link && sub.link.slug ? sub.link.slug : null,
            count,
            position: typeof sub.position === 'number' ? sub.position : 999,
          });
        }
      }
    }
    if (!pages.length && !groups.length) continue;
    pages.sort(order);
    groups.sort(order);
    const strip = ({title, url, count}) => (count ? {title, url, count} : {title, url});
    sections.push({
      title: cat.label || stripNumberPrefix(e.name),
      description: (cat.link && cat.link.description) || '',
      url: (cat.link && cat.link.slug) || (pages[0] && pages[0].url) || '/',
      position: typeof cat.position === 'number' ? cat.position : Number(e.name.match(/^\d+/)[0]),
      pages: pages.map(strip),
      groups: groups.map(strip),
    });
  }
  sections.sort(order);
  return sections.map(({position, ...rest}) => rest);
}
