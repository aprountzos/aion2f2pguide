import React from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {CONTRIBUTE_PATH, findClass, newGuideUrl} from '../classes';
import styles from './styles.module.css';

// The guides players wrote for a class (the pages in docs/11-classes/<id>/ besides its index page), and the
// way to add one: the contribute guide, and a GitHub page with the template already in it.
export default function ClassGuides({id}) {
  const {siteConfig} = useDocusaurusContext();
  const c = findClass(id);
  if (!c) return <p>Unknown class "{id}". Check data/classes.yml.</p>;
  const github = newGuideUrl(siteConfig.customFields, c);
  return (
    <div>
      {c.guides.length === 0 ? (
        <p className={styles.empty}>No {c.name} guide has been written yet. You can be the first.</p>
      ) : (
        <ul className={styles.list}>
          {c.guides.map((g) => (
            <li key={g.url} className={styles.item}>
              <Link to={g.url} className={styles.title}>
                {g.title}
              </Link>
              {g.description && <p className={styles.text}>{g.description}</p>}
              <p className={styles.meta}>
                {g.author && (
                  <>
                    By{' '}
                    <a href={`https://github.com/${g.author}`} rel="noopener noreferrer">
                      {g.author}
                    </a>
                    .{' '}
                  </>
                )}
                {g.updated && `Updated ${g.updated}.`}
              </p>
            </li>
          ))}
        </ul>
      )}
      <aside className={styles.cta}>
        <p className={styles.ctaText}>
          <strong>Know this class well?</strong> Guides are written by players like you. Start from the template, no coding needed.
        </p>
        <p className={styles.actions}>
          <a className="button button--primary" href={github} target="_blank" rel="noopener noreferrer">
            Start a guide on GitHub
          </a>
          <Link className="button button--secondary" to={CONTRIBUTE_PATH}>
            How to contribute a guide
          </Link>
        </p>
      </aside>
    </div>
  );
}
