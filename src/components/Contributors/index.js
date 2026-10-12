import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import contributors from '@site/src/generated/contributors.json';
import styles from './styles.module.css';

// People who contributed to the repository. The list is fetched from GitHub when the site is built
// (scripts/fetch-contributors.mjs). When it is empty, only a link is shown.
export default function Contributors() {
  const {siteConfig} = useDocusaurusContext();
  const repoUrl = siteConfig.customFields.repoUrl;
  const list = Array.isArray(contributors) ? contributors : [];
  return (
    <div>
      {list.length > 0 && (
        <ul className={styles.grid}>
          {list.map((c) => (
            <li key={c.login} className={styles.item}>
              <a href={c.url} rel="noopener noreferrer">
                <img src={c.avatar} alt="" width="64" height="64" loading="lazy" className={styles.avatar} />
                <span className={styles.name}>{c.login}</span>
              </a>
              <span className={styles.count}>
                {c.contributions} contributions
              </span>
            </li>
          ))}
        </ul>
      )}
      <p>
        <a href={`${repoUrl}/graphs/contributors`}>
          All contributors on GitHub
        </a>
      </p>
    </div>
  );
}
