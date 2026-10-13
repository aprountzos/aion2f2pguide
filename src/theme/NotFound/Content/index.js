import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

// The 404 page: says what happened, and offers the places people look for most.
// The "Report" link opens a site-bug issue with the address that failed.
const WHERE = [
  {to: '/leveling/level-finder', label: 'Level Finder', text: 'What to do at your level'},
  {to: '/gathering/gathering-by-level', label: 'Gathering by level', text: 'Nodes for each level range'},
  {to: '/leather/leather-farming-by-level', label: 'Leather farming', text: 'Where to farm Raw Leather'},
  {to: '/classes/overview', label: 'Classes', text: 'A guide for each class'},
  {to: '/reference/item-database', label: 'Items', text: 'The item database'},
  {to: '/questions', label: 'Questions', text: 'Ask or answer a question'},
];

export default function NotFoundContent({className}) {
  const {siteConfig} = useDocusaurusContext();
  const {pathname} = useLocation();
  const report = `${siteConfig.customFields.repoUrl}/issues/new?template=site-bug.yml&title=${encodeURIComponent(`Broken link: ${pathname}`)}`;
  return (
    <main className={clsx('container margin-vert--xl', className)}>
      <div className={styles.box}>
        <Heading as="h1" className={styles.title}>
          This page does not exist
        </Heading>
        <p className={styles.lead}>
          The address may be mistyped, or the page was moved or renamed. Use the search box at the top, or start from one of these:
        </p>
        <ul className={styles.list}>
          {WHERE.map((w) => (
            <li key={w.to}>
              <Link to={w.to} className={styles.card}>
                <span className={styles.label}>{w.label}</span>
                <span className={styles.text}>{w.text}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className={styles.foot}>
          <Link to="/">Back to the home page</Link>. Followed a link from this site?{' '}
          <a href={report} rel="noopener noreferrer">
            Report the broken link
          </a>
          .
        </p>
      </div>
    </main>
  );
}
