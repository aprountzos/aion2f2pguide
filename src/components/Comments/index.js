import React from 'react';
import Giscus from '@giscus/react';
import {useColorMode} from '@docusaurus/theme-common';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

// Comments and reactions (thumbs up/down etc.) powered by giscus, which stores everything in
// GitHub Discussions of this repository. Configured in site.config.json ("giscus"), see MAINTAINING.md.
// Renders nothing in production until giscus is configured. Turn off per note with `comments: false`.
export default function Comments() {
  const {siteConfig} = useDocusaurusContext();
  const {colorMode} = useColorMode();
  const g = siteConfig.customFields.giscus;
  const repoUrl = siteConfig.customFields.repoUrl;

  if (!g || !g.enabled) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className={styles.placeholder}>
          Comments are not configured yet. Set <code>giscus</code> in <code>site.config.json</code>{' '}
          (see MAINTAINING.md). This box is only shown in the dev server.
        </div>
      );
    }
    return null;
  }

  return (
    <section className={styles.comments} aria-label="Comments and reactions">
      <h2 className={styles.title}>Reactions and comments</h2>
      <p className={styles.note}>
        Was this page useful? React with 👍 or 👎 below. Comments are discussion, not sources: for a
        wrong number please <a href={`${repoUrl}/issues/new?template=data-correction.yml`}>report a
        correction</a> or use <strong>Edit this page</strong>. Comments load from giscus.app and
        need a free GitHub account.
      </p>
      <Giscus
        repo={g.repo}
        repoId={g.repoId}
        category={g.category}
        categoryId={g.categoryId}
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={colorMode === 'dark' ? 'dark' : 'light'}
        lang="en"
        loading="lazy"
      />
    </section>
  );
}
