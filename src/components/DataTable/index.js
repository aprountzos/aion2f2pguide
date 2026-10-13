import React, {useEffect, useMemo, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import data from '@site/src/generated/data.json';
import {inline, overlaps, plain} from '../inline';
import {useProfile} from '../profile';
import styles from './styles.module.css';

// A sortable, filterable table. The rows come from data/*.yml (see scripts/lib/data.mjs).
// Filters: free text, and "my level" (shows rows that overlap your level, with a margin).
// "My level" starts from the visitor's saved level (see ../profile.js) and changing it saves it.

const firstNumber = (s) => {
  const m = /-?\d+(?:\.\d+)?/.exec(plain(s));
  return m ? Number(m[0]) : null;
};

function sortValue(col, row, i) {
  const text = row.cells[i];
  if (col.type === 'zone') return row.levels ? row.levels[0] : null;
  if (col.type === 'number' || col.type === 'level') return firstNumber(text);
  const t = plain(text).trim().toLowerCase();
  return t === '' ? null : t;
}

export default function DataTable({id}) {
  const {siteConfig} = useDocusaurusContext();
  const table = data.tables.en[id];
  const [query, setQuery] = useState('');
  const profile = useProfile();
  const [cleared, setCleared] = useState(false); // the visitor emptied the box: show every row
  useEffect(() => setCleared(false), [profile.level]);
  const level = cleared || !profile.hasLevel ? '' : String(profile.level);
  const setLevel = (v) => {
    if (v === '') setCleared(true);
    else {
      setCleared(false);
      profile.set({level: v});
    }
  };
  const mine = profile.hasFaction && id.endsWith(`-${profile.faction}`);
  const [margin, setMargin] = useState(3);
  const [sort, setSort] = useState({col: -1, dir: 1});

  const rows = useMemo(() => {
    if (!table) return [];
    let out = table.rows.map((r, idx) => ({...r, idx}));
    const q = query.trim().toLowerCase();
    if (q) out = out.filter((r) => r.cells.some((c) => plain(c).toLowerCase().includes(q)));
    const L = Number(level);
    if (table.levelFilter && level !== '' && Number.isFinite(L)) {
      // rows with an unknown level stay visible
      out = out.filter((r) => !r.levels || overlaps(r.levels, L - margin, L + margin));
    }
    if (sort.col >= 0) {
      const col = table.columns[sort.col];
      out = [...out].sort((a, b) => {
        const x = sortValue(col, a, sort.col);
        const y = sortValue(col, b, sort.col);
        if (x === null && y === null) return a.idx - b.idx;
        if (x === null) return 1; // empty cells always last
        if (y === null) return -1;
        const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
        return c * sort.dir || a.idx - b.idx;
      });
    }
    return out;
  }, [table, query, level, margin, sort]);

  if (!table) return <p>Unknown table “{id}”.</p>;

  const filtered = query.trim() !== '' || (table.levelFilter && level !== '');
  const editUrl = `${siteConfig.customFields.repoUrl}/edit/${siteConfig.customFields.editBranch}/${table.source}`;

  const toggleSort = (i) =>
    setSort((s) => (s.col !== i ? {col: i, dir: 1} : s.dir === 1 ? {col: i, dir: -1} : {col: -1, dir: 1}));

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={'Filter rows…'}
          aria-label={'Filter rows by text'}
        />
        {table.levelFilter && (
          <>
            <label className={styles.label}>
              My level
              <input
                type="number"
                min="1"
                max="45"
                className={`${styles.input} ${styles.small}`}
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Range
              <select className={styles.input} value={margin} onChange={(e) => setMargin(Number(e.target.value))}>
                {[0, 3, 5, 10].map((m) => (
                  <option key={m} value={m}>
                    {m === 0 ? '±0' : `± ${m}`}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {mine && <span className={styles.mine}>Your faction</span>}
        {(filtered || sort.col >= 0) && (
          <button
            type="button"
            className={styles.reset}
            onClick={() => {
              setQuery('');
              setLevel('');
              setSort({col: -1, dir: 1});
            }}>
            Reset
          </button>
        )}
      </div>

      <div className={styles.scroll}>
        <table>
          <thead>
            <tr>
              {table.columns.map((c, i) => (
                <th
                  key={i}
                  aria-sort={sort.col === i ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                  <button type="button" className={styles.sortButton} onClick={() => toggleSort(i)}>
                    {c.label}
                    <span className={styles.arrow} aria-hidden="true">
                      {sort.col === i ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''}
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.idx}>
                {r.cells.map((c, i) => (
                  <td key={i}>{inline(c)}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={table.columns.length}>
                  No rows match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className={styles.caption}>
        Showing {rows.length} of {table.rows.length} rows.{' '}
        <a href={editUrl}>
          Edit this table's data
        </a>
      </p>
    </div>
  );
}
