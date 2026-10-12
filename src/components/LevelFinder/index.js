import React, {useEffect, useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import data from '@site/src/generated/data.json';
import {inline, plain} from '../inline';
import {CAP, FACTIONS, GATHER_FROM, LEATHER_FROM, computeFinder, readSaved, saveChoice} from '../finder';
import styles from './styles.module.css';

// Type a level, pick a faction, and see the zones, gathering nodes, Raw Leather mobs and unlocks
// around it. Everything is computed in the browser from data/*.yml.

export default function LevelFinder() {
  const [faction, setFaction] = useState('elyos');
  const [level, setLevel] = useState(10);

  useEffect(() => {
    const saved = readSaved();
    if (saved && saved.faction) setFaction(saved.faction);
    if (saved && saved.level) setLevel(saved.level);
  }, []);
  useEffect(() => {
    saveChoice(faction, level);
  }, [faction, level]);

  const result = useMemo(() => computeFinder(data, faction, level), [faction, level]);

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
