import React, {useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {CAP, FACTIONS} from '../finder';
import {useProfile} from '../profile';
import styles from './styles.module.css';

// The navbar chip for "my level and faction" (registered as the navbar item type "custom-profile" in
// src/theme/NavbarItem/ComponentTypes.js). It shows the saved choice ("Elyos · 23") and opens a small
// panel to change it. In the mobile menu the controls are shown directly.

function Controls({onDone}) {
  const {faction, level, hasFaction, hasLevel, set, clear} = useProfile();
  const any = hasFaction || hasLevel;
  return (
    <div className={styles.controls}>
      <div className={styles.group} role="group" aria-label="Faction">
        {FACTIONS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={clsx(styles.pill, hasFaction && faction === f.id && styles.on)}
            aria-pressed={hasFaction && faction === f.id}
            onClick={() => set({faction: f.id})}>
            {f.name}
          </button>
        ))}
      </div>
      <label className={styles.levelRow}>
        <span>Level</span>
        <input
          type="number"
          min="1"
          max={CAP}
          inputMode="numeric"
          className={styles.number}
          value={hasLevel ? level : ''}
          placeholder="1–45"
          onChange={(e) => (e.target.value === '' ? null : set({level: e.target.value}))}
        />
        <input
          type="range"
          min="1"
          max={CAP}
          className={styles.slider}
          value={level}
          aria-label="Level"
          onChange={(e) => set({level: e.target.value})}
        />
      </label>
      <p className={styles.hint}>Saved in this browser. Tables and finders start from it.</p>
      <div className={styles.actions}>
        <Link to="/leveling/level-finder" onClick={onDone}>
          Open the Level Finder
        </Link>
        {any && (
          <button type="button" className={styles.clear} onClick={clear}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfileChip({mobile}) {
  const {faction, level, hasFaction, hasLevel} = useProfile();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const root = useRef(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : root.current && !root.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  if (mobile) {
    return (
      <li className={styles.mobile}>
        <p className={styles.mobileTitle}>Your character</p>
        <Controls />
      </li>
    );
  }

  const name = FACTIONS.find((f) => f.id === faction).name;
  const label = !mounted || !(hasFaction || hasLevel)
    ? 'Set your level'
    : [hasFaction ? name : null, hasLevel ? (hasFaction ? level : `Level ${level}`) : null].filter(Boolean).join(' · ');

  return (
    <div className={styles.root} ref={root}>
      <button
        type="button"
        className={clsx(styles.chip, mounted && (hasFaction || hasLevel) && styles.set, mounted && styles.ready)}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}>
        {label}
      </button>
      {open && (
        <div className={styles.panel} role="dialog" aria-label="Your level and faction">
          <Controls onDone={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
