import React, {useMemo, useState} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import data from '@site/src/generated/questions.json';
import {inline, plain} from '../inline';
import styles from './styles.module.css';

// Answered questions, newest first, like a small blog. The entries come from data/questions.yml.
// New questions are asked in the discussion at the bottom of the page (giscus, see Comments), or,
// when comments are not set up, in the GitHub Discussions of the repository.
//
// Prop: tag="leather" starts with that tag selected.

const TAG_LABELS = {
  leveling: 'Leveling',
  gathering: 'Gathering',
  leather: 'Leather',
  crafting: 'Crafting',
  gear: 'Gear',
  economy: 'Economy',
  general: 'General',
};

export default function Questions({tag = ''}) {
  const {siteConfig} = useDocusaurusContext();
  const {giscus, repoUrl} = siteConfig.customFields;
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(tag);

  const used = useMemo(() => data.tags.filter((t) => data.questions.some((q) => q.tags.includes(t))), []);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.questions.filter((x) => {
      if (active && !x.tags.includes(active)) return false;
      if (!q) return true;
      const text = [x.question, ...x.blocks.flatMap((b) => (b.type === 'p' ? [b.text] : b.items))].map(plain).join(' ').toLowerCase();
      return text.includes(q);
    });
  }, [query, active]);

  const askLink = giscus && giscus.enabled ? '#discussion' : `${repoUrl}/discussions/new/choose`;

  return (
    <div className={styles.wrap}>
      <div className={styles.ask}>
        <div>
          <strong>Have a question that is not answered here?</strong>
          <div className={styles.askText}>
            Ask it in the discussion at the bottom of this page. Anyone can answer by replying, and good answers are added to this list.
          </div>
        </div>
        <a className="button button--primary" href={askLink}>
          Ask a question
        </a>
      </div>

      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the answers…"
          aria-label="Search the answered questions"
        />
        <div className={styles.tags} role="group" aria-label="Filter by topic">
          <button type="button" className={styles.tag} aria-pressed={active === ''} onClick={() => setActive('')}>
            All
          </button>
          {used.map((t) => (
            <button key={t} type="button" className={styles.tag} aria-pressed={active === t} onClick={() => setActive(active === t ? '' : t)}>
              {TAG_LABELS[t] || t}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.count}>
        {list.length} of {data.questions.length} answered questions
      </p>

      {list.map((q) => (
        <article key={q.id} id={q.id} className={styles.post}>
          <h2 className={styles.question}>
            <a href={`#${q.id}`}>
              {q.question}
            </a>
          </h2>
          <div className={styles.meta}>
            <time dateTime={q.date}>{q.date}</time>
            {q.updated && <span> · updated {q.updated}</span>}
            {q.by && <span> · answered by {q.by}</span>}
            {q.tags.map((t) => (
              <span key={t} className={styles.chip}>
                {TAG_LABELS[t] || t}
              </span>
            ))}
          </div>
          {q.blocks.map((b, i) =>
            b.type === 'p' ? (
              <p key={i}>{inline(b.text)}</p>
            ) : b.type === 'ol' ? (
              <ol key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it)}</li>
                ))}
              </ol>
            ) : (
              <ul key={i}>
                {b.items.map((it, j) => (
                  <li key={j}>{inline(it)}</li>
                ))}
              </ul>
            ),
          )}
          {q.links.length > 0 && (
            <p className={styles.more}>
              Read more:{' '}
              {q.links.map((l, i) => (
                <React.Fragment key={l.url}>
                  {i > 0 && ' · '}
                  <Link to={l.url}>{l.label}</Link>
                </React.Fragment>
              ))}
            </p>
          )}
        </article>
      ))}
      {list.length === 0 && <p>No answers match. Ask your question in the discussion below.</p>}
    </div>
  );
}
