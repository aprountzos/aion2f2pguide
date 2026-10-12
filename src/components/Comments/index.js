import React from 'react';
import Giscus from '@giscus/react';
import {useColorMode} from '@docusaurus/theme-common';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

// Comments and reactions (thumbs up/down etc.) powered by giscus, which stores everything in
// GitHub Discussions of this repository. Configured in site.config.json ("giscus"), see MAINTAINING.md.
// Renders nothing in production until giscus is configured. Turn off per page with `comments: false`.
// `qa` (frontmatter `qa: true`, used by the Questions page) shows it as a place to ask questions: every
// new comment is a question and the replies under it are the answers.
export default function Comments({qa = false}) {
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
    <section id={qa ? 'discussion' : undefined} className={styles.comments} aria-label={qa ? 'Ask a question' : 'Comments and reactions'}>
      <h2 className={styles.title}>{qa ? 'Ask a question' : 'Reactions and comments'}</h2>
      {qa ? (
        <p className={styles.note}>
          Write your question as a new comment. Anyone can answer by replying under it, and you can react with 👍. Search the
          answers above first. Good, checked answers are added to the list above. You need a free GitHub account; the discussion
          loads from giscus.app.
        </p>
      ) : (
        <p className={styles.note}>
          Was this page useful? React with 👍 or 👎 below. Comments are discussion, not sources: for a
          wrong number please <a href={`${repoUrl}/issues/new?template=data-correction.yml`}>report a
          correction</a> or use <strong>Edit this page</strong>. Comments load from giscus.app and
          need a free GitHub account.
        </p>
      )}
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
