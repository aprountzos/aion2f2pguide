import React from 'react';
import {inline} from '../inline';
import {findClass} from '../classes';
import styles from './styles.module.css';

// The facts of a class (data/classes.yml) at the top of its page: role, weapon, source and the date they were checked.
export default function ClassPage({id}) {
  const c = findClass(id);
  if (!c) return <p className={styles.missing}>Unknown class "{id}". Check data/classes.yml.</p>;
  const rows = [
    ['Role', c.role],
    ['Weapon', c.weapon],
    c.note && ['Note', c.note],
    c.source && ['Source', inline(c.source)],
    c.checked && ['Checked on', c.checked],
  ].filter((r) => r && r[1]);
  return (
    <dl className={styles.facts}>
      {rows.map(([k, v]) => (
        <div key={k} className={styles.row}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
