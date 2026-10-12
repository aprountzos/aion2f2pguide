import React, {useEffect, useMemo, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import data from '@site/src/generated/data.json';
import sections from '@site/src/generated/sections.json';
import {inline, plain} from '../inline';
import {CAP, FACTIONS, GATHER_FROM, LEATHER_FROM, computeFinder, readSaved, saveChoice} from '../finder';
import styles from './styles.module.css';

// The home page (docs/index.mdx). The top part is a one-sentence level finder: the answer changes
// as the visitor edits "I'm an Elyos at level 23". The rest is built from the docs/ folders
// (src/generated/sections.json) and data/patches.yml, so it never needs editing when pages are added.

const MAX_LINKS = 5; // page links shown per section before "and N more"
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDate = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : iso;
};

export default function Home() {
  return (
    <div className={styles.home}>
      <Hero />
      <Contents />
      <LatestPatch />
      <Contribute />
    </div>
  );
}

function Hero() {
  const {siteConfig} = useDocusaurusContext();
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

  const r = useMemo(() => computeFinder(data, faction, level), [faction, level]);
  const setLevelSafe = (v) => setLevel(Math.max(1, Math.min(CAP, Math.round(Number(v)) || 1)));

  const zones = (r.here.length ? r.here : r.near).slice(0, 2);
  const nodeTypes = data.nodeTypes.filter((t) => r.best[t]).slice(0, 4);
  const leather = r.leatherNear.slice(0, 3);
  const upcoming = r.next[0];

  return (
    <section className={clsx(styles.hero, styles[faction])}>
      <div className={styles.glowElyos} aria-hidden="true" />
      <div className={styles.glowAsmodian} aria-hidden="true" />
      <div className={styles.heroInner}>
        <div className={styles.sentence}>
          <span>I’m an</span>
          <span className={styles.factions} role="group" aria-label="Faction">
            {FACTIONS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={clsx(styles.faction, styles[`faction_${f.id}`], faction === f.id && styles.on)}
                aria-pressed={faction === f.id}
                title={`${f.name} start in ${f.land}`}
                onClick={() => setFaction(f.id)}>
                {f.name}
              </button>
            ))}
          </span>
          <label className={styles.levelLabel}>
            at level
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max={CAP}
              value={level}
              onChange={(e) => setLevelSafe(e.target.value)}
              className={styles.levelInput}
              aria-label="Your level"
            />
          </label>
        </div>
        <input
          type="range"
          min="1"
          max={CAP}
          value={level}
          onChange={(e) => setLevelSafe(e.target.value)}
          className={styles.slider}
          aria-label="Your level"
        />

        <div className={styles.answers} aria-live="polite">
          <div className={styles.answer}>
            <h2>Hunt in</h2>
            {level >= CAP ? (
              <p>Level {CAP} is the cap. Monsters scale to {CAP}, so go where nodes and drops are densest.</p>
            ) : zones.length ? (
              <ul>
                {zones.map((z) => (
                  <li key={z.name}>
                    <strong>{z.name}</strong> <span className={styles.dim}>levels {z.levels}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No zone is listed for this level. You are probably in the intro area.</p>
            )}
          </div>

          <div className={styles.answer}>
            <h2>Gather</h2>
            {level < GATHER_FROM ? (
              <p>Gathering unlocks at level {GATHER_FROM}.</p>
            ) : nodeTypes.length ? (
              <ul>
                {nodeTypes.map((t) => (
                  <li key={t}>
                    <strong>{data.nodeLabels[t]}</strong> <span className={styles.dim}>{r.best[t].zone}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No nodes recorded near this level.</p>
            )}
          </div>

          <div className={styles.answer}>
            <h2>Raw Leather</h2>
            {level < LEATHER_FROM && <p>Usable from level {LEATHER_FROM}. You can stockpile it earlier.</p>}
            {leather.length ? (
              <ul>
                {leather.map((m, i) => (
                  <li key={i}>
                    <strong>{plain(m.mob)}</strong> <span className={styles.dim}>{plain(m.rate)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              level >= LEATHER_FROM && <p>No monster recorded within 10 levels.</p>
            )}
          </div>

          <div className={styles.answer}>
            <h2>Next unlock</h2>
            {upcoming ? (
              <p>
                <strong>Level {upcoming.level}</strong> {inline(upcoming.text)}
              </p>
            ) : (
              <p>You have reached every milestone in the guide.</p>
            )}
          </div>
        </div>

        <p className={styles.more}>
          <Link to="/leveling/level-finder">Full level finder</Link>
          <Link to="/gathering/gathering-by-level">Gathering by level</Link>
          <Link to="/leather/leather-farming-by-level">Leather by level</Link>
        </p>
        <p className={styles.fine}>
          A free-to-play guide for Aion 2 (Global), organized by level. Data checked{' '}
          {formatDate(siteConfig.customFields.dataChecked)}. <Link to="/reference/sources">Sources and known conflicts</Link>.
        </p>
      </div>
    </section>
  );
}

function Contents() {
  return (
    <section className={styles.contents}>
      <div className={styles.wrap}>
        <h2 className={styles.sectionTitle}>What is in the guide</h2>
        <div className={styles.rows}>
          {sections.map((s) => {
            const shown = s.pages.slice(0, MAX_LINKS);
            const hidden = s.pages.length - shown.length;
            return (
              <div className={styles.row} key={s.title}>
                <div className={styles.rowHead}>
                  <h3>
                    <Link to={s.url}>{s.title}</Link>
                  </h3>
                  {s.description && <p>{s.description}</p>}
                </div>
                <ul className={styles.rowLinks}>
                  {shown.map((p) => (
                    <li key={p.url}>
                      <Link to={p.url}>{p.title}</Link>
                    </li>
                  ))}
                  {s.groups.map((g) => (
                    <li key={g.title}>
                      {g.url ? <Link to={g.url}>{g.title}</Link> : g.title}{' '}
                      <span className={styles.dim}>{g.count} pages</span>
                    </li>
                  ))}
                  {hidden > 0 && (
                    <li>
                      <Link to={s.url} className={styles.dim}>
                        and {hidden} more
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LatestPatch() {
  const patch = (data.patches || [])[0];
  if (!patch) return null;
  const change = (patch.changes || [])[0];
  return (
    <section className={styles.patch}>
      <div className={clsx(styles.wrap, styles.patchInner)}>
        <div>
          <h2 className={styles.patchTitle}>Latest game patch</h2>
          <p className={styles.patchDate}>{formatDate(patch.date)}</p>
        </div>
        <div>
          <p className={styles.patchHead}>{patch.title}</p>
          {change && <p className={styles.patchText}>{inline(change)}</p>}
          <Link to="/reference/patch-history">Everything that changed</Link>
        </div>
      </div>
    </section>
  );
}

function Contribute() {
  const {siteConfig} = useDocusaurusContext();
  const repo = siteConfig.customFields.repoUrl;
  return (
    <section className={styles.contribute}>
      <div className={styles.wrap}>
        <h2 className={styles.sectionTitle}>Written by players, checked by players</h2>
        <p className={styles.lead}>
          Numbers change with every game patch. If something here is wrong or missing, tell us or fix it yourself. You do
          not need to know how to code.
        </p>
        <div className={styles.ways}>
          <div>
            <h3>Found a mistake?</h3>
            <p>
              <a href={`${repo}/issues/new?template=data-correction.yml`} rel="noopener noreferrer">
                Report it on GitHub
              </a>{' '}
              or follow <Link to="/contribute/make-your-first-pull-request">the step-by-step fix guide</Link>.
            </p>
          </div>
          <div>
            <h3>Stuck on something?</h3>
            <p>
              <Link to="/questions">Read the short answers</Link>, or ask your own question and let the community reply.
            </p>
          </div>
          <div>
            <h3>Know an item that is missing?</h3>
            <p>
              <Link to="/contribute/add-an-item">Add it to the item database</Link> with a few lines of text.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
