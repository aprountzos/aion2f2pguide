// Structured guide data (data/*.yml): loading, validation, and turning it into tables.
//
// The same data feeds three things:
//   1. the interactive tables on the website (<DataTable id="..." />, src/components/DataTable),
//   2. the Level Finder,
//   3. the Patch History list, written as markdown between <!-- data:begin patches --> and <!-- data:end -->
//      lines in that page (scripts/data.mjs), so the page also reads well on GitHub.

import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import {mapOutsideFences, pageIndex, slugify} from './docs.mjs';

export const NODE_TYPES = ['orichalcum', 'ruby', 'sapphire', 'asvata', 'yggdrasil'];
export const NODE_LABELS = {
  orichalcum: 'Orichalcum',
  ruby: 'Ruby',
  sapphire: 'Sapphire',
  asvata: 'Asvata',
  yggdrasil: 'Yggdrasil',
};
export const FACTIONS = ['asmodian', 'elyos'];
export const FACTION_LABELS = {asmodian: 'Asmodian (Altgard)', elyos: 'Elyos (Verteron)'};

/** Ids of the tables that pages show with <DataTable id="..." />. */
export const TABLE_IDS = [
  'zones-asmodian',
  'zones-elyos',
  'gathering-asmodian',
  'gathering-elyos',
  'leather-asmodian',
  'leather-elyos',
  'milestones',
];
/** Item database (data/items.yml). */
export const ITEM_CATEGORIES = ['material', 'consumable', 'currency', 'equipment'];
export const ITEM_GRADES = ['Common', 'Rare', 'Epic', 'Unique', 'Hero', 'Special'];
export const ITEM_FACTIONS = ['both', 'asmodian', 'elyos'];
const ITEM_FIELDS = ['id', 'name', 'category', 'type', 'grade', 'level', 'itemLevel', 'faction', 'tradable', 'note', 'obtain', 'use', 'pages', 'ref', 'checked'];

/** Questions page (data/questions.yml). */
export const QUESTION_TAGS = ['leveling', 'gathering', 'leather', 'crafting', 'gear', 'economy', 'general'];
const QUESTION_FIELDS = ['id', 'date', 'question', 'answer', 'tags', 'pages', 'by', 'updated'];

/** Which pages use which data file: the PR report (scripts/pr-report.mjs) uses this to list affected pages. */
export const WIDGET_DATA = {
  LevelFinder: ['data/zones.yml', 'data/nodes.yml', 'data/leather.yml', 'data/milestones.yml'],
  ItemDatabase: ['data/items.yml'],
  Questions: ['data/questions.yml'],
};

/** Blocks written as plain markdown between <!-- data:begin ID --> and <!-- data:end --> lines in a page. */
export const BLOCK_IDS = ['patches'];

const SOURCE_OF = {
  'zones-asmodian': 'data/zones.yml',
  'zones-elyos': 'data/zones.yml',
  'gathering-asmodian': 'data/nodes.yml',
  'gathering-elyos': 'data/nodes.yml',
  'leather-asmodian': 'data/leather.yml',
  'leather-elyos': 'data/leather.yml',
  milestones: 'data/milestones.yml',
  patches: 'data/patches.yml',
};
export const sourceOf = (id) => SOURCE_OF[id];

const stripBold = (s) => String(s).replace(/\*\*/g, '');

/** "11–20" -> [11, 20], "18" -> [18, 18], "—" or text -> null. Bold markers are ignored. */
export function parseLevels(text) {
  const m = /^\s*(\d+)\s*(?:[–-]\s*(\d+))?\s*$/.exec(stripBold(text));
  if (!m) return null;
  const a = Number(m[1]);
  const b = m[2] ? Number(m[2]) : a;
  return a <= b ? [a, b] : null;
}

/** "21, 23, 25" or "5 / 6" -> [21, 23, 25]. */
export function parseLevelList(text) {
  return (String(text).match(/\d+/g) || []).map(Number);
}

/** First number in a rate such as "~5.8%" or "**62.2%**". */
export function parseRate(text) {
  const m = /(\d+(?:\.\d+)?)\s*%/.exec(String(text));
  return m ? Number(m[1]) : null;
}

export function loadYaml(file) {
  return YAML.parse(fs.readFileSync(file, 'utf8'));
}

/** Load all data files. Returns {data, errors}. Never throws for bad content. */
export function loadData(root) {
  const errors = [];
  const dir = path.join(root, 'data');
  const read = (name) => {
    const file = path.join(dir, name);
    if (!fs.existsSync(file)) {
      errors.push(`data/${name}: file is missing`);
      return null;
    }
    try {
      return loadYaml(file);
    } catch (e) {
      errors.push(`data/${name}: ${String(e.message).split('\n')[0]}`);
      return null;
    }
  };
  const data = {
    zones: read('zones.yml'),
    nodes: read('nodes.yml'),
    leather: read('leather.yml'),
    milestones: read('milestones.yml'),
    patches: read('patches.yml'),
    items: read('items.yml'),
    questions: read('questions.yml'),
  };
  errors.push(...validate(data, pageIndex(path.join(root, 'docs'))));
  return {data, errors};
}

function validate(d, pages = new Map()) {
  const errs = [];
  const isStr = (v) => typeof v === 'string' && v.trim() !== '';
  const isNum = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

  // zones
  const zoneNames = new Map(); // name -> faction
  for (const f of FACTIONS) {
    const list = d.zones && d.zones[f];
    if (!Array.isArray(list)) {
      if (d.zones) errs.push(`data/zones.yml: needs a list called "${f}"`);
      continue;
    }
    list.forEach((z, i) => {
      const at = `data/zones.yml ${f}[${i + 1}]${z && z.name ? ` "${z.name}"` : ''}`;
      if (!z || !isStr(z.name)) return errs.push(`${at}: "name" is required`);
      if (zoneNames.has(z.name)) errs.push(`${at}: zone name is used twice (names must be unique)`);
      zoneNames.set(z.name, f);
      if (!parseLevels(z.levels)) errs.push(`${at}: "levels" must look like "11–20" or "18" (got ${JSON.stringify(z.levels)})`);
      if (!isNum(z.dungeons)) errs.push(`${at}: "dungeons" must be a number`);
      if (!isNum(z.quests)) errs.push(`${at}: "quests" must be a number`);
    });
  }

  // nodes
  for (const f of FACTIONS) {
    const list = d.nodes && d.nodes[f];
    if (!Array.isArray(list)) {
      if (d.nodes) errs.push(`data/nodes.yml: needs a list called "${f}"`);
      continue;
    }
    const seen = new Set();
    list.forEach((n, i) => {
      const at = `data/nodes.yml ${f}[${i + 1}]${n && n.zone ? ` "${n.zone}"` : ''}`;
      if (!n || !isStr(n.zone)) return errs.push(`${at}: "zone" is required`);
      if (!zoneNames.has(n.zone)) {
        errs.push(`${at}: zone "${n.zone}" is not in data/zones.yml (check the spelling, names are case-sensitive)`);
      } else if (zoneNames.get(n.zone) !== f) {
        errs.push(`${at}: zone "${n.zone}" belongs to ${zoneNames.get(n.zone)} in zones.yml, but is listed under ${f}`);
      }
      if (seen.has(n.zone)) errs.push(`${at}: zone is listed twice`);
      seen.add(n.zone);
      if (!n.nodes || typeof n.nodes !== 'object' || Array.isArray(n.nodes)) {
        errs.push(`${at}: "nodes" must be a mapping such as {orichalcum: 180}`);
      } else {
        for (const [type, count] of Object.entries(n.nodes)) {
          if (!NODE_TYPES.includes(type)) errs.push(`${at}: unknown node type "${type}". Use: ${NODE_TYPES.join(', ')}`);
          else if (count !== null && !isNum(count)) errs.push(`${at}: count of ${type} must be a number (or ~ when unknown)`);
        }
      }
    });
  }

  // leather
  for (const f of FACTIONS) {
    const list = d.leather && d.leather[f];
    if (!Array.isArray(list)) {
      if (d.leather) errs.push(`data/leather.yml: needs a list called "${f}"`);
      continue;
    }
    list.forEach((r, i) => {
      const at = `data/leather.yml ${f}[${i + 1}]${r && r.mob ? ` "${stripBold(r.mob)}"` : ''}`;
      if (!r) return errs.push(`${at}: empty row`);
      if (!isStr(r.mob)) errs.push(`${at}: "mob" is required`);
      if (!isStr(r.level)) errs.push(`${at}: "level" is required (use "—" when unknown)`);
      else if (stripBold(r.level).trim() !== '—' && !parseLevels(r.level)) {
        errs.push(`${at}: "level" must look like "11", "11–16" or "—" (got ${JSON.stringify(r.level)})`);
      }
      if (!isStr(r.where)) errs.push(`${at}: "where" is required`);
      if (!isStr(r.rate)) errs.push(`${at}: "rate" is required (for example "5.8%")`);
    });
  }

  // milestones
  if (d.milestones !== null) {
    if (!Array.isArray(d.milestones)) errs.push('data/milestones.yml: must be a list');
    else {
      d.milestones.forEach((m, i) => {
        const at = `data/milestones.yml [${i + 1}]`;
        if (!m || !isStr(m.level) || parseLevelList(m.level).length === 0) errs.push(`${at}: "level" must contain a number, like "22" or "5 / 6"`);
        if (!m || !isStr(m.text)) errs.push(`${at}: "text" is required`);
      });
    }
  }

  // patches
  if (d.patches !== null) {
    if (!Array.isArray(d.patches)) errs.push('data/patches.yml: must be a list');
    else {
      let prev = '9999-99-99';
      d.patches.forEach((p, i) => {
        const at = `data/patches.yml [${i + 1}]`;
        if (!p || !/^\d{4}-\d{2}-\d{2}$/.test(String(p.date || ''))) errs.push(`${at}: "date" must be written like "2026-10-07" (in quotes)`);
        else {
          if (p.date > prev) errs.push(`${at}: patches must be sorted newest first (${p.date} is after the entry above)`);
          prev = p.date;
        }
        if (!p || !isStr(p.title)) errs.push(`${at}: "title" is required`);
        if (!p || !Array.isArray(p.changes) || p.changes.length === 0) errs.push(`${at}: "changes" must be a list with at least one line`);
      });
    }
  }

  // helpers for the two lists below
  const isSlug = (v) => typeof v === 'string' && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v);
  const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) && !Number.isNaN(Date.parse(String(v)));
  const checkPages = (at, list) => {
    if (list === undefined) return;
    if (!Array.isArray(list) || list.some((n) => !isStr(n))) return errs.push(`${at}: "pages" must be a list of page names, like [Raw Leather]`);
    for (const n of list) if (!pages.has(slugify(n))) errs.push(`${at}: there is no page called "${n}" (use the file name of the page, for example "Raw Leather")`);
  };
  const checkFields = (at, row, allowed) => {
    for (const k of Object.keys(row)) if (!allowed.includes(k)) errs.push(`${at}: unknown field "${k}". Allowed: ${allowed.join(', ')}`);
  };

  // items
  if (d.items !== null) {
    if (!Array.isArray(d.items)) errs.push('data/items.yml: must be a list');
    else {
      const ids = new Set();
      const names = new Set();
      d.items.forEach((it, i) => {
        const at = `data/items.yml [${i + 1}]${it && it.name ? ` "${it.name}"` : ''}`;
        if (!it || typeof it !== 'object') return errs.push(`${at}: empty entry`);
        checkFields(at, it, ITEM_FIELDS);
        if (!isSlug(it.id)) errs.push(`${at}: "id" is required: lowercase letters, digits and hyphens, like "raw-leather"`);
        else if (ids.has(it.id)) errs.push(`${at}: id "${it.id}" is used twice (ids must be unique)`);
        ids.add(it.id);
        if (!isStr(it.name)) errs.push(`${at}: "name" is required`);
        else if (names.has(it.name.toLowerCase())) errs.push(`${at}: the name is used twice`);
        else names.add(it.name.toLowerCase());
        if (!ITEM_CATEGORIES.includes(it.category)) errs.push(`${at}: "category" must be one of ${ITEM_CATEGORIES.join(', ')}`);
        if (it.type !== undefined && !isStr(it.type)) errs.push(`${at}: "type" must be text`);
        if (it.grade !== undefined && !ITEM_GRADES.includes(it.grade)) errs.push(`${at}: "grade" must be one of ${ITEM_GRADES.join(', ')} (leave it out when unknown)`);
        for (const k of ['level', 'itemLevel']) {
          if (it[k] !== undefined && !(Number.isInteger(it[k]) && it[k] >= 1 && it[k] <= 300)) errs.push(`${at}: "${k}" must be a whole number from 1 to 300`);
        }
        if (it.faction !== undefined && !ITEM_FACTIONS.includes(it.faction)) errs.push(`${at}: "faction" must be one of ${ITEM_FACTIONS.join(', ')}`);
        if (it.tradable !== undefined && typeof it.tradable !== 'boolean') errs.push(`${at}: "tradable" must be true or false`);
        for (const k of ['note', 'obtain', 'use']) if (it[k] !== undefined && !isStr(it[k])) errs.push(`${at}: "${k}" must be text`);
        if (!isStr(it.obtain) && !isStr(it.use)) errs.push(`${at}: give "obtain" (where it comes from) or "use" (what it is for)`);
        if (!isStr(it.ref) || !/^https:\/\/\S+$/.test(it.ref)) errs.push(`${at}: "ref" is required: an https:// link to your source`);
        if (!isDate(it.checked)) errs.push(`${at}: "checked" must be a date like "2026-10-10" (in quotes)`);
        checkPages(at, it.pages);
      });
    }
  }

  // questions
  if (d.questions !== null) {
    if (!Array.isArray(d.questions)) errs.push('data/questions.yml: must be a list');
    else {
      const ids = new Set();
      let prev = '9999-99-99';
      d.questions.forEach((q, i) => {
        const at = `data/questions.yml [${i + 1}]${q && q.id ? ` "${q.id}"` : ''}`;
        if (!q || typeof q !== 'object') return errs.push(`${at}: empty entry`);
        checkFields(at, q, QUESTION_FIELDS);
        if (!isSlug(q.id)) errs.push(`${at}: "id" is required: lowercase letters, digits and hyphens`);
        else if (ids.has(q.id)) errs.push(`${at}: id "${q.id}" is used twice (ids must be unique)`);
        ids.add(q.id);
        if (!isDate(q.date)) errs.push(`${at}: "date" must be written like "2026-10-10" (in quotes)`);
        else {
          if (String(q.date) > prev) errs.push(`${at}: sort newest first (${q.date} is after the entry above)`);
          prev = String(q.date);
        }
        if (q.updated !== undefined && !isDate(q.updated)) errs.push(`${at}: "updated" must be a date like "2026-10-10"`);
        if (!isStr(q.question)) errs.push(`${at}: "question" is required`);
        else if (!/\?\s*$/.test(q.question)) errs.push(`${at}: "question" should end with a question mark`);
        if (!isStr(q.answer)) errs.push(`${at}: "answer" is required`);
        if (!Array.isArray(q.tags) || q.tags.length === 0) errs.push(`${at}: "tags" needs at least one of ${QUESTION_TAGS.join(', ')}`);
        else for (const t of q.tags) if (!QUESTION_TAGS.includes(t)) errs.push(`${at}: unknown tag "${t}". Use: ${QUESTION_TAGS.join(', ')}`);
        if (q.by !== undefined && !isStr(q.by)) errs.push(`${at}: "by" must be text`);
        checkPages(at, q.pages);
      });
    }
  }
  return errs;
}

// ---------------------------------------------------------------- text helpers

const label = (_data, _lang, text) => text;
const textFn = () => (s) => s;

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

// ---------------------------------------------------------------- table model

/**
 * Build all tables. Each table:
 *   {id, source, columns:[{label, type}], rows:[{cells:[string], levels:[min,max]|null}], levelFilter, searchOnly}
 * column.type: "text" | "number" | "level" (cell text holds levels) | "zone" (sort by the row's levels)
 */
export function buildTables(data, lang = 'en') {
  const L = (t) => label(data, lang, t);
  const T = textFn(data, lang);
  const tables = {};
  const zoneByName = new Map();
  for (const f of FACTIONS) for (const z of (data.zones && data.zones[f]) || []) zoneByName.set(z.name, {...z, faction: f});

  for (const f of FACTIONS) {
    // zones
    tables[`zones-${f}`] = {
      id: `zones-${f}`,
      source: SOURCE_OF[`zones-${f}`],
      levelFilter: true,
      columns: [
        {label: L('Zone'), type: 'text'},
        {label: L('Levels'), type: 'level'},
        {label: L('Sealed dungeons'), type: 'number'},
        {label: L('Side quests'), type: 'number'},
      ],
      rows: ((data.zones && data.zones[f]) || []).map((z) => ({
        cells: [z.name, z.levels, String(z.dungeons), String(z.quests)],
        levels: parseLevels(z.levels),
      })),
    };

    // gathering
    const rowsIn = (data.nodes && data.nodes[f]) || [];
    const used = NODE_TYPES.filter((t) => rowsIn.some((r) => r.nodes && t in r.nodes));
    const hasNote = rowsIn.some((r) => r.note);
    tables[`gathering-${f}`] = {
      id: `gathering-${f}`,
      source: SOURCE_OF[`gathering-${f}`],
      levelFilter: true,
      columns: [
        {label: L('Zone (level)'), type: 'zone'},
        ...used.map((t) => ({label: NODE_LABELS[t], type: 'number'})),
        ...(hasNote ? [{label: L('Notes'), type: 'text'}] : []),
      ],
      rows: rowsIn.map((r) => {
        const z = zoneByName.get(r.zone) || {};
        const levelText = r.levelText ? T(r.levelText) : z.levels;
        const cells = [`${r.zone} (${levelText})`];
        for (const t of used) {
          if (!r.nodes || !(t in r.nodes)) cells.push('');
          else cells.push(r.nodes[t] === null ? '✓' : `**${r.nodes[t]}**`);
        }
        if (hasNote) cells.push(r.note ? T(r.note) : '');
        return {cells, levels: parseLevels(z.levels || '')};
      }),
    };

    // leather
    const lrows = (data.leather && data.leather[f]) || [];
    tables[`leather-${f}`] = {
      id: `leather-${f}`,
      source: SOURCE_OF[`leather-${f}`],
      levelFilter: true,
      columns: [
        {label: L('Level'), type: 'level'},
        {label: L('Mob'), type: 'text'},
        {label: L('Where'), type: 'text'},
        {label: L('Raw Leather'), type: 'number'},
        {label: f === 'asmodian' ? L('Also drops') : L('Notes'), type: 'text'},
      ],
      rows: lrows.map((r) => ({
        cells: [r.level, T(r.mob), T(r.where), T(r.rate), r.extra ? T(r.extra) : ''],
        levels: parseLevels(r.level),
      })),
    };
  }

  tables.milestones = {
    id: 'milestones',
    source: SOURCE_OF.milestones,
    levelFilter: false,
    columns: [
      {label: L('Level'), type: 'level'},
      {label: L('What unlocks'), type: 'text'},
    ],
    rows: ((data.milestones) || []).map((m) => {
      const nums = parseLevelList(m.level);
      return {cells: [m.level, T(m.text)], levels: nums.length ? [Math.min(...nums), Math.max(...nums)] : null};
    }),
  };
  return tables;
}

/** Page names -> [{label, url}] for the links under an item or an answer. Unknown names are skipped (lint reports them). */
function pageLinks(names, pages) {
  return (names || [])
    .map((n) => pages.get(slugify(n)))
    .filter(Boolean)
    .map((p) => ({label: p.title, url: p.url}));
}

/** Item database for the website (src/generated/items.json). */
export function buildItems(data, pages) {
  return {
    categories: ITEM_CATEGORIES,
    grades: ITEM_GRADES,
    items: (data.items || []).map((it) => ({
      id: it.id,
      name: it.name,
      category: it.category,
      type: it.type || '',
      grade: it.grade || '',
      level: it.level ?? null,
      itemLevel: it.itemLevel ?? null,
      faction: it.faction || 'both',
      tradable: it.tradable ?? null,
      note: it.note || '',
      obtain: it.obtain || '',
      use: it.use || '',
      ref: it.ref,
      checked: String(it.checked),
      links: pageLinks(it.pages, pages),
    })),
  };
}

/** Answer text -> [{type: 'p'|'ol'|'ul', text | items}]. Blank lines separate blocks; "1. a" or "- a" lines make lists. */
export function answerBlocks(text) {
  return String(text)
    .trim()
    .split(/\n\s*\n/)
    .map((chunk) => {
      const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.every((l) => /^\d+\.\s+/.test(l))) return {type: 'ol', items: lines.map((l) => l.replace(/^\d+\.\s+/, ''))};
      if (lines.every((l) => /^[-*]\s+/.test(l))) return {type: 'ul', items: lines.map((l) => l.replace(/^[-*]\s+/, ''))};
      return {type: 'p', text: lines.join(' ')};
    });
}

/** Questions page for the website (src/generated/questions.json). */
export function buildQuestions(data, pages) {
  return {
    tags: QUESTION_TAGS,
    questions: (data.questions || []).map((q) => ({
      id: q.id,
      date: String(q.date),
      updated: q.updated ? String(q.updated) : '',
      question: q.question,
      blocks: answerBlocks(q.answer),
      tags: q.tags,
      by: q.by || '',
      links: pageLinks(q.pages, pages),
    })),
  };
}

export function tableToMarkdown(table) {
  const head = `| ${table.columns.map((c) => cell(c.label)).join(' | ')} |`;
  const sep = `| ${table.columns.map(() => '---').join(' | ')} |`;
  const rows = table.rows.map((r) => `| ${r.cells.map(cell).join(' | ')} |`);
  return [head, sep, ...rows].join('\n');
}

/** linkTo(pageName) -> relative link to that page (see scripts/data.mjs). Without it page names are not linked. */
export function patchesToMarkdown(data, lang = 'en', linkTo = null) {
  const L = (t) => label(data, lang, t);
  const T = textFn(data, lang);
  const out = [];
  for (const p of data.patches || []) {
    out.push(`### ${p.date}: ${T(p.title)}`, '');
    for (const c of p.changes) out.push(`- ${T(c)}`);
    const extra = [];
    if (p.pages && p.pages.length) extra.push(`${L('Pages updated')}: ${p.pages.map((n) => (linkTo ? `[${n}](${linkTo(n)})` : n)).join(', ')}`);
    if (p.source) extra.push(`${L('Source')}: ${p.source}`);
    if (extra.length) out.push('', extra.join('. ') + '.');
    out.push('');
  }
  return out.join('\n').replace(/\n+$/, '');
}

/** Markdown for one block id and language. */
export function renderBlock(id, data, lang = 'en', linkTo = null) {
  if (id === 'patches') return patchesToMarkdown(data, lang, linkTo);
  const t = buildTables(data, lang)[id];
  if (!t) throw new Error(`unknown data block "${id}"`);
  return tableToMarkdown(t);
}

// ---------------------------------------------------------------- blocks inside notes

export const BLOCK_RE = /<!-- data:begin ([a-z0-9-]+)[^>]*-->\n([\s\S]*?)\n<!-- data:end -->/g;

export const beginLine = (id) => `<!-- data:begin ${id} (generated from ${SOURCE_OF[id]}, do not edit between the markers) -->`;

/** Replace the content of every data block in a note. Returns {text, ids, unknown}. */
export function updateBlocks(text, data, lang = 'en', linkTo = null) {
  const ids = [];
  const unknown = [];
  // blocks shown as examples inside ``` code fences are left alone
  const out = mapOutsideFences(text, (chunk) =>
    chunk.replace(BLOCK_RE, (_m, id) => {
      if (!BLOCK_IDS.includes(id)) {
        unknown.push(id);
        return _m;
      }
      ids.push(id);
      return `${beginLine(id)}\n${renderBlock(id, data, lang, linkTo)}\n<!-- data:end -->`;
    }),
  );
  return {text: out, ids, unknown};
}
