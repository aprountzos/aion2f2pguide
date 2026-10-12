import React, {useEffect, useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import {inline, plain} from '../inline';
import styles from './styles.module.css';

// Item database. The items come from data/items.yml (see scripts/lib/data.mjs), turned into
// src/generated/items.json by `npm run prepare-site`. The JSON is loaded when the widget appears,
// so a big list does not slow down the other pages.
//
// Props (all optional): category="material" and type="Herb" start the filters on that value.
// The filters are also written to the address (?q=...&category=...), so a view can be shared.

const PAGE = 30;
const CATEGORY_LABELS = {material: 'Materials', consumable: 'Consumables', currency: 'Currencies', equipment: 'Equipment'};
const FACTION_LABELS = {both: 'Both factions', asmodian: 'Asmodian', elyos: 'Elyos'};
const PARAMS = ['q', 'category', 'type', 'grade', 'faction', 'level'];

const host = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'source';
  }
};

export default function ItemDatabase({category = '', type = ''}) {
  const [db, setDb] = useState(null);
  const [f, setF] = useState({q: '', category, type, grade: '', faction: '', level: ''});
  const [sort, setSort] = useState({col: 'name', dir: 1});
  const [shown, setShown] = useState(PAGE);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let live = true;
    import('@site/src/generated/items.json').then((m) => live && setDb(m.default || m));
    return () => {
      live = false;
    };
  }, []);

  // read the filters from the address once (client only)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setF((old) => {
      const next = {...old};
      for (const k of PARAMS) if (sp.has(k)) next[k] = sp.get(k);
      return next;
    });
    setReady(true);
  }, []);

  // write them back, without adding history entries
  useEffect(() => {
    if (!ready) return;
    try {
      const sp = new URLSearchParams(window.location.search);
      for (const k of PARAMS) {
        if (f[k] && !((k === 'category' && f[k] === category) || (k === 'type' && f[k] === type))) sp.set(k, f[k]);
        else sp.delete(k);
      }
      const qs = sp.toString();
      window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash);
    } catch {
      /* ignore */
    }
  }, [f, ready, category, type]);

  const set = (k, v) => {
    setF((old) => ({...old, [k]: v, ...(k === 'category' ? {type: ''} : {})}));
    setShown(PAGE);
  };

  const items = db ? db.items : [];
  const types = useMemo(() => {
    const t = new Set();
    for (const it of items) if (it.type && (!f.category || it.category === f.category)) t.add(it.type);
    return [...t].sort((a, b) => a.localeCompare(b));
  }, [items, f.category]);

  const rows = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const L = Number(f.level);
    const gradeIdx = (g) => (db ? db.grades.indexOf(g) : -1);
    let out = items.filter((it) => {
      if (f.category && it.category !== f.category) return false;
      if (f.type && it.type !== f.type) return false;
      if (f.grade && it.grade !== f.grade) return false;
      if (f.faction && it.faction !== 'both' && it.faction !== f.faction) return false;
      if (f.level !== '' && Number.isFinite(L) && it.level !== null && it.level > L) return false;
      if (q) {
        const hay = [it.name, it.type, it.grade, it.obtain, it.use, it.note].map(plain).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const val = (it) => {
      if (sort.col === 'name') return it.name.toLowerCase();
      if (sort.col === 'category') return it.category + ' ' + it.type.toLowerCase();
      if (sort.col === 'grade') return it.grade ? gradeIdx(it.grade) : null;
      if (sort.col === 'level') return it.level;
      return null;
    };
    out = [...out].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      if (x === null && y === null) return a.name.localeCompare(b.name);
      if (x === null) return 1; // unknown values always last
      if (y === null) return -1;
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
      return c * sort.dir || a.name.localeCompare(b.name);
    });
    return out;
  }, [items, db, f, sort]);

  const filtered = Object.entries(f).some(([k, v]) => v && !((k === 'category' && v === category) || (k === 'type' && v === type)));
  const reset = () => {
    setF({q: '', category, type, grade: '', faction: '', level: ''});
    setShown(PAGE);
  };
  const toggleSort = (col) => setSort((s) => (s.col !== col ? {col, dir: 1} : {col, dir: -s.dir}));
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (!db) return <p className={styles.loading}>Loading items…</p>;

  const head = (col, label) => (
    <th aria-sort={sort.col === col ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className={styles.sortButton} onClick={() => toggleSort(col)}>
        {label}
        <span aria-hidden="true">{sort.col === col ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}</span>
      </button>
    </th>
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <input
          type="search"
          className={`${styles.input} ${styles.search}`}
          value={f.q}
          onChange={(e) => set('q', e.target.value)}
          placeholder="Search name, source or use…"
          aria-label="Search items"
        />
        <label className={styles.label}>
          Category
          <select className={styles.input} value={f.category} onChange={(e) => set('category', e.target.value)}>
            <option value="">All</option>
            {db.categories.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c] || c}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.label}>
          Type
          <select className={styles.input} value={f.type} onChange={(e) => set('type', e.target.value)}>
            <option value="">All</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.label}>
          Grade
          <select className={styles.input} value={f.grade} onChange={(e) => set('grade', e.target.value)}>
            <option value="">All</option>
            {db.grades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.label}>
          Faction
          <select className={styles.input} value={f.faction} onChange={(e) => set('faction', e.target.value)}>
            <option value="">All</option>
            <option value="asmodian">Asmodian</option>
            <option value="elyos">Elyos</option>
          </select>
        </label>
        <label className={styles.label}>
          My level
          <input
            type="number"
            min="1"
            max="100"
            className={`${styles.input} ${styles.small}`}
            value={f.level}
            onChange={(e) => set('level', e.target.value)}
          />
        </label>
        {filtered && (
          <button type="button" className={styles.link} onClick={reset}>
            Reset
          </button>
        )}
        <button type="button" className={styles.link} onClick={copyLink}>
          {copied ? 'Link copied' : 'Copy link to this view'}
        </button>
      </div>

      <div className={styles.scroll}>
        <table>
          <thead>
            <tr>
              {head('name', 'Item')}
              {head('category', 'Category')}
              {head('grade', 'Grade')}
              {head('level', 'Level')}
              <th>Where it comes from</th>
              <th>Used for</th>
              <th>More</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, shown).map((it) => (
              <tr key={it.id} id={it.id}>
                <td>
                  <strong>{it.name}</strong>
                  {it.itemLevel !== null && <div className={styles.sub}>Item level {it.itemLevel}</div>}
                  {it.faction !== 'both' && <div className={styles.sub}>{FACTION_LABELS[it.faction]}</div>}
                  {it.tradable === false && <div className={styles.sub}>Not tradable</div>}
                  {it.note && <div className={styles.sub}>{inline(it.note)}</div>}
                </td>
                <td>
                  {CATEGORY_LABELS[it.category] || it.category}
                  {it.type && <div className={styles.sub}>{it.type}</div>}
                </td>
                <td>{it.grade ? <span className={`${styles.grade} ${styles['g' + it.grade]}`}>{it.grade}</span> : '—'}</td>
                <td>{it.level !== null ? it.level : '—'}</td>
                <td>{it.obtain ? inline(it.obtain) : '—'}</td>
                <td>{it.use ? inline(it.use) : '—'}</td>
                <td className={styles.more}>
                  <a href={it.ref} rel="noopener noreferrer" title={`Checked ${it.checked}`}>
                    {host(it.ref)}
                  </a>
                  {it.links.map((l) => (
                    <div key={l.url}>
                      <Link to={l.url}>{l.label}</Link>
                    </div>
                  ))}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7}>No items match. Try fewer filters. The list is a starter set, see below how to add an item.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className={styles.caption}>
        Showing {Math.min(shown, rows.length)} of {rows.length} items{filtered ? ` (${items.length} in total)` : ''}.
        {rows.length > shown && (
          <>
            {' '}
            <button type="button" className={styles.link} onClick={() => setShown((n) => n + PAGE)}>
              Show {Math.min(PAGE, rows.length - shown)} more
            </button>
          </>
        )}
      </p>
    </div>
  );
}
