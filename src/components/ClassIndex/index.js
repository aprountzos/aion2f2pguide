import React from 'react';
import Link from '@docusaurus/Link';
import {inline} from '../inline';
import {allClasses} from '../classes';
import styles from './styles.module.css';

// The class list: role and weapon from data/classes.yml, the link to the class page
// (docs/11-classes/<id>/index.mdx) and how many guides players wrote for it.
export default function ClassIndex() {
  const list = allClasses();
  return (
    <div className={styles.grid}>
      {list.map((c) => {
        const n = c.guides.length;
        return (
          <article key={c.id} className={styles.card} id={c.id}>
            <h3 className={styles.name}>{c.url ? <Link to={c.url}>{c.name}</Link> : c.name}</h3>
            <p className={styles.role}>{c.role}</p>
            <p className={styles.weapon}>
              <span className={styles.label}>Weapon</span> {c.weapon}
            </p>
            {c.note && <p className={styles.note}>{c.note}</p>}
            <p className={styles.action}>
              {c.url ? (
                <Link to={c.url}>{n === 0 ? 'No guides yet' : n === 1 ? '1 guide' : `${n} guides`}</Link>
              ) : (
                <span className={styles.none}>No page yet</span>
              )}
            </p>
            {c.source && <p className={styles.source}>Source: {inline(c.source)}</p>}
          </article>
        );
      })}
    </div>
  );
}
