import React, {useEffect, useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import data from '@site/src/generated/data.json';
import {inline, overlaps, parseLevels, plain, store} from '../inline';
import styles from './styles.module.css';

// Type a level, pick a faction, and see the zones, gathering nodes, Raw Leather mobs and unlocks
// around it. Everything is computed in the browser from data/*.yml.

const GATHER_FROM = 10; // gathering starts at level 10
const LEATHER_FROM = 15; // Raw Leather is usable from level 15
const CAP = 45;
const KEY = 'aion2.levelfinder';

const FACTIONS = [
  {id: 'elyos', name: 'Elyos', land: 'Verteron'},
  {id: 'asmodian', name: 'Asmodian', land: 'Altgard'},
];

export default function LevelFinder() {
  const [faction, setFaction] = useState('elyos');
  const [level, setLevel] = useState(10);

  useEffect(() => {
    try {
      const saved = JSON.parse(store.get(KEY) || 'null');
      if (saved && FACTIONS.some((f) => f.id === saved.faction)) setFaction(saved.faction);
      if (saved && Number.isInteger(saved.level) && saved.level >= 1 && saved.level <= CAP) setLevel(saved.level);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    store.set(KEY, JSON.stringify({faction, level}));
  }, [faction, level]);

  const result = useMemo(() => {
    const zones = (data.zones[faction] || []).map((z) => ({...z, range: parseLevels(z.levels)}));
    const nodesByZone = new Map((data.nodes[faction] || []).map((n) => [n.zone, n]));
    const withNodes = (z) => ({...z, nodes: nodesByZone.get(z.name)});

    const narrow = zones.filter((z) => z.range && z.range[1] - z.range[0] < 20);
    const wide = zones.filter((z) => z.range && z.range[1] - z.range[0] >= 20);
    const here = narrow.filter((z) => overlaps(z.range, level, level)).map(withNodes);
    const near = narrow
      .filter((z) => !overlaps(z.range, level, level) && overlaps(z.range, level - 4, level + 4))
      .map(withNodes);

    // gathering: best zone per node type among zones within 5 levels
    const best = {};
    for (const z of narrow.filter((z) => overlaps(z.range, level - 5, level + 5)).map(withNodes)) {
      for (const [type, count] of Object.entries((z.nodes && z.nodes.nodes) || {})) {
        if (count === null) {
          if (!best[type]) best[type] = {zone: z.name, count: null, levels: z.levels};
        } else if (!best[type] || best[type].count === null || count > best[type].count) {
          best[type] = {zone: z.name, count, levels: z.levels};
        }
      }
    }

    const leather = (data.leather[faction] || []).map((r) => ({...r, range: parseLevels(r.level)}));
    const leatherNear = leather.filter((r) => overlaps(r.range, level - 10, level + 10));
    const leatherUnknown = leather.filter((r) => !r.range);

    const miles = data.milestones.map((m) => ({...m, nums: (m.level.match(/\d+/g) || []).map(Number)}));
    const reached = miles.filter((m) => Math.min(...m.nums) <= level);
    const recent = reached.slice(-3);
    const next = miles.filter((m) => Math.min(...m.nums) > level).slice(0, 2);

    return {here, near, wide, best, leatherNear, leatherUnknown, recent, next};
  }, [faction, level]);

  const setLevelSafe = (v) => {
    const n = Math.max(1, Math.min(CAP, Math.round(Number(v)) || 1));
    setLevel(n);
  };

  return (
    <div className={styles.finder}>
      <div className={styles.controls}>
        <div className={styles.group} role="group" aria-label="Faction">
          {FACTIONS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`${styles.pill} ${faction === f.id ? styles.active : ''}`}
              aria-pressed={faction === f.id}
              onClick={() => setFaction(f.id)}>
              {f.name} <span className={styles.land}>({f.land})</span>
            </button>
          ))}
        </div>
        <label className={styles.level}>
          <span>
            Your level
          </span>
          <input
            type="number"
            min="1"
            max={CAP}
            value={level}
            onChange={(e) => setLevelSafe(e.target.value)}
            className={styles.number}
          />
          <input
            type="range"
            min="1"
            max={CAP}
            value={level}
            onChange={(e) => setLevelSafe(e.target.value)}
            aria-label="Level"
            className={styles.slider}
          />
        </label>
      </div>

      {level >= CAP && (
        <p className={styles.note}>
          Level 45 is the cap. Monsters scale to 45, so zone level no longer matters: go where nodes and drops are densest.
        </p>
      )}

      <h3>
        Zones for your level
      </h3>
      {result.here.length === 0 && result.near.length === 0 && (
        <p className={styles.muted}>
          No zone listed for this level. You are probably in the intro area.
        </p>
      )}
      {result.here.length > 0 && (
        <ul className={styles.list}>
          {result.here.map((z) => (
            <li key={z.name}>
              <strong>{z.name}</strong> ({z.levels}){' '}
              <span className={styles.muted}>{nodeSummary(z)}</span>
            </li>
          ))}
        </ul>
      )}
      {result.near.length > 0 && (
        <>
          <p className={styles.sub}>
            Within 4 levels
          </p>
          <ul className={styles.list}>
            {result.near.map((z) => (
              <li key={z.name}>
                {z.name} ({z.levels}) <span className={styles.muted}>{nodeSummary(z)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {result.wide.length > 0 && (
        <p className={styles.muted}>
          Hubs and wide-range zones:{' '}
          {result.wide.map((z) => `${z.name} (${z.levels})`).join(', ')}
        </p>
      )}

      <h3>
        Gathering
      </h3>
      {level < GATHER_FROM ? (
        <p className={styles.warn}>
          Gathering unlocks at level 10.
        </p>
      ) : Object.keys(result.best).length === 0 ? (
        <p className={styles.muted}>
          No nodes recorded within 5 levels of your level.
        </p>
      ) : (
        <ul className={styles.list}>
          {data.nodeTypes
            .filter((t) => result.best[t])
            .map((t) => (
              <li key={t}>
                <strong>{data.nodeLabels[t]}</strong>: {result.best[t].zone} ({result.best[t].levels}),{' '}
                {result.best[t].count === null ? 'present' : `${result.best[t].count} nodes`}
              </li>
            ))}
        </ul>
      )}
      <p className={styles.more}>
        <Link to="/gathering/gathering-by-level">
          All gathering spots by level
        </Link>
      </p>

      <h3>Raw Leather</h3>
      {level < LEATHER_FROM && (
        <p className={styles.warn}>
          Raw Leather is usable from level 15. You can stockpile it earlier.
        </p>
      )}
      {result.leatherNear.length === 0 ? (
        <p className={styles.muted}>
          No monster recorded within 10 levels of your level.
        </p>
      ) : (
        <ul className={styles.list}>
          {result.leatherNear.map((r, i) => (
            <li key={i}>
              {inline(r.mob)} ({plain(r.level)}), {r.where}: <strong>{plain(r.rate)}</strong>
            </li>
          ))}
        </ul>
      )}
      {result.leatherUnknown.length > 0 && (
        <p className={styles.muted}>
          Also drops it, level not recorded:{' '}
          {result.leatherUnknown.map((r) => plain(r.mob)).join(', ')}
        </p>
      )}
      <p className={styles.more}>
        <Link to="/leather/leather-farming-by-level">
          All Raw Leather farming by level
        </Link>
      </p>

      <h3>
        Unlocks
      </h3>
      <ul className={styles.list}>
        {result.recent.map((m, i) => (
          <li key={`r${i}`}>
            <span className={styles.muted}>{m.level}:</span> {inline(m.text)}
          </li>
        ))}
        {result.next.map((m, i) => (
          <li key={`n${i}`} className={styles.next}>
            <span className={styles.muted}>
              Next ({m.level}):
            </span>{' '}
            {inline(m.text)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function nodeSummary(z) {
  const nodes = (z.nodes && z.nodes.nodes) || {};
  const parts = Object.entries(nodes).map(([t, c]) => `${t[0].toUpperCase()}${t.slice(1)}${c === null ? '' : ` ${c}`}`);
  return parts.length ? `· ${parts.join(', ')}` : '';
}
