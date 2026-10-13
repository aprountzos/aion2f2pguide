import React from 'react';
import Link from '@docusaurus/Link';
import classes from '@site/src/generated/classes.json';
import {inline} from '../inline';
import styles from './styles.module.css';

// The class list: role and weapon from data/classes.yml, and a link to the guide when a page exists in
// docs/11-classes/<id>.md (scripts/lib/data.mjs, buildClasses). Classes without a guide link to the guide builder.
export default function ClassIndex() {
  const list = Array.isArray(classes) ? classes : [];
  return (
    <div className={styles.grid}>
      {list.map((c) => (
        <article key={c.id} className={styles.card} id={c.id}>
          <h3 className={styles.name}>{c.guide ? <Link to={c.guide}>{c.name}</Link> : c.name}</h3>
          <p className={styles.role}>{c.role}</p>
          <p className={styles.weapon}>
            <span className={styles.label}>Weapon</span> {c.weapon}
          </p>
          {c.note && <p className={styles.note}>{c.note}</p>}
          <p className={styles.action}>
            {c.guide ? (
              <Link to={c.guide}>Read the {c.name} guide</Link>
            ) : (
              <>
                <span className={styles.none}>No guide yet.</span>{' '}
                <Link to={`/contribute/write-a-class-guide?class=${c.id}`}>Write it</Link>
              </>
            )}
          </p>
          {c.source && <p className={styles.source}>Source: {inline(c.source)}</p>}
        </article>
      ))}
    </div>
  );
}
