import React, {useEffect, useMemo, useRef, useState} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import classes from '@site/src/generated/classes.json';
import {store} from '../inline';
import {PRIORITIES, buildMarkdown, emptyForm, problems} from './markdown';
import styles from './styles.module.css';

// A form that turns a player's notes into a class guide page (docs/11-classes/<class>.md), written with the
// template in templates/class-guide.md. The page can be copied, downloaded, or created on GitHub in one click
// (GitHub opens a new-file page with the text filled in; for people without write access it makes a fork and a
// pull request). Nothing is sent anywhere by this page. The draft is kept in this browser.

const DRAFT_KEY = 'aion2.guide-draft';
const URL_LIMIT = 7000; // GitHub rejects very long addresses; above this the text is copied instead

const today = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

function Area({label, hint, value, onChange, rows = 4, placeholder}) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {hint && <span className={styles.hint}>{hint}</span>}
      <textarea rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

export default function GuideBuilder() {
  const {siteConfig} = useDocusaurusContext();
  const {repoUrl, editBranch} = siteConfig.customFields;
  const {search} = useLocation();
  const list = Array.isArray(classes) ? classes : [];
  const [form, setForm] = useState(emptyForm);
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);

  // Load the draft, and the class from ?class=<id> (the "Write it" link on the class list).
  useEffect(() => {
    let saved = null;
    try {
      saved = JSON.parse(store.get(DRAFT_KEY) || 'null');
    } catch {
      saved = null;
    }
    const base = {...emptyForm(), ...(saved && typeof saved === 'object' ? saved : {})};
    if (!Array.isArray(base.skills) || !base.skills.length) base.skills = emptyForm().skills;
    const wanted = new URLSearchParams(search).get('class');
    if (wanted && list.some((c) => c.id === wanted)) base.cls = wanted;
    if (!list.some((c) => c.id === base.cls)) {
      base.cls = (list.find((c) => !c.guide) || list[0] || {}).id || '';
    }
    setForm(base);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready) store.set(DRAFT_KEY, JSON.stringify(form));
  }, [form, ready]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const set = (patch) => setForm((f) => ({...f, ...patch}));
  const setSkill = (i, patch) => setForm((f) => ({...f, skills: f.skills.map((s, j) => (j === i ? {...s, ...patch} : s))}));
  const addSkill = () => setForm((f) => ({...f, skills: [...f.skills, {name: '', does: '', level: '', priority: ''}]}));
  const removeSkill = (i) =>
    setForm((f) => ({...f, skills: f.skills.length > 1 ? f.skills.filter((_, j) => j !== i) : f.skills}));

  const index = list.findIndex((c) => c.id === form.cls);
  const cls = list[index];
  const missing = useMemo(() => problems(form), [form]);
  const exists = Boolean(cls && cls.guide);
  const canSend = Boolean(cls) && missing.length === 0 && !exists;
  const markdown = useMemo(
    () => (cls ? buildMarkdown(form, cls, {date: today(), position: index + 2}) : ''),
    [form, cls, index],
  );
  const filename = cls ? `docs/11-classes/${cls.id}.md` : '';
  const githubBase = `${repoUrl}/new/${editBranch}?filename=${encodeURIComponent(filename)}`;
  const fullUrl = `${githubBase}&value=${encodeURIComponent(markdown)}`;
  const tooLong = fullUrl.length > URL_LIMIT;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2500);
      return true;
    } catch {
      return false;
    }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([markdown], {type: 'text/markdown;charset=utf-8'}));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cls.id}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const reset = () => {
    if (window.confirm('Clear the whole form? This cannot be undone.')) setForm({...emptyForm(), cls: form.cls});
  };

  if (!list.length) return <p>The class list is empty.</p>;

  return (
    <div className={styles.builder}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="gb-class">
          Class
        </label>
        <select id="gb-class" className={styles.select} value={form.cls} onChange={(e) => set({cls: e.target.value})}>
          {list.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.guide ? ' (has a guide)' : ''}
            </option>
          ))}
        </select>
        {exists && (
          <p className={styles.warn} role="status">
            The {cls.name} guide already exists. To improve it, open <Link to={cls.guide}>the guide</Link> and use <strong>Edit this page</strong> at the
            bottom. Creating the file again would overwrite it.
          </p>
        )}
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Summary</span>
        <span className={styles.hint}>One sentence: what this class does and who the guide is for. Shown on the class list and in search.</span>
        <input type="text" value={form.summary} maxLength={220} onChange={(e) => set({summary: e.target.value})} />
      </label>

      <div className={styles.two}>
        <Area label="Strengths" hint="One per line." value={form.strengths} onChange={(v) => set({strengths: v})} />
        <Area label="Weaknesses" hint="One per line." value={form.weaknesses} onChange={(v) => set({weaknesses: v})} />
      </div>

      <Area
        label="Leveling 1–45"
        hint='One tip per line. Use level ranges, for example "1–10: ...".'
        value={form.leveling}
        onChange={(v) => set({leveling: v})}
        rows={5}
      />

      <fieldset className={styles.skills}>
        <legend className={styles.label}>Skills</legend>
        <span className={styles.hint}>Skip the rows you do not need.</span>
        {form.skills.map((s, i) => (
          <div key={i} className={styles.skillRow}>
            <input type="text" aria-label={`Skill ${i + 1} name`} placeholder="Skill" value={s.name} onChange={(e) => setSkill(i, {name: e.target.value})} />
            <input
              type="text"
              aria-label={`Skill ${i + 1}: what it does`}
              placeholder="What it does"
              value={s.does}
              onChange={(e) => setSkill(i, {does: e.target.value})}
            />
            <input
              type="text"
              aria-label={`Skill ${i + 1}: learned at level`}
              placeholder="Level"
              value={s.level}
              onChange={(e) => setSkill(i, {level: e.target.value})}
            />
            <select aria-label={`Skill ${i + 1}: priority`} value={s.priority} onChange={(e) => setSkill(i, {priority: e.target.value})}>
              <option value="">Priority</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button type="button" className={styles.link} onClick={() => removeSkill(i)} aria-label={`Remove skill ${i + 1}`}>
              Remove
            </button>
          </div>
        ))}
        <button type="button" className={styles.link} onClick={addSkill}>
          Add a skill
        </button>
      </fieldset>

      <Area
        label="Stats and gear"
        hint="One per line. What to look for, and what a free-to-play player can get."
        value={form.stats}
        onChange={(v) => set({stats: v})}
      />
      <Area label="In a group" hint="One per line. What the class does in a party, dungeon or raid." value={form.group} onChange={(v) => set({group: v})} />
      <Area
        label="Sources"
        hint='One per line: a link and the date you checked it, or "tested in game on 2026-10-13". Use [title](https://link) for links.'
        value={form.sources}
        onChange={(v) => set({sources: v})}
        rows={3}
      />

      <section className={styles.out} aria-labelledby="gb-out">
        <h3 id="gb-out" className={styles.outTitle}>
          Your page
        </h3>
        {missing.length > 0 ? (
          <ul className={styles.missing}>
            {missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.ok}>
            Ready. The file will be <code>{filename}</code>.
          </p>
        )}
        <div className={styles.actions}>
          {tooLong ? (
            <a
              className={clsx('button button--primary', !canSend && styles.disabled)}
              href={canSend ? githubBase : undefined}
              aria-disabled={!canSend}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!canSend) e.preventDefault();
                else copy();
              }}>
              Copy, then create on GitHub
            </a>
          ) : (
            <a
              className={clsx('button button--primary', !canSend && styles.disabled)}
              href={canSend ? fullUrl : undefined}
              aria-disabled={!canSend}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => !canSend && e.preventDefault()}>
              Create on GitHub
            </a>
          )}
          <button type="button" className="button button--secondary" onClick={copy} disabled={!cls}>
            {copied ? 'Copied' : 'Copy Markdown'}
          </button>
          <button type="button" className="button button--secondary" onClick={download} disabled={!cls}>
            Download .md
          </button>
          <button type="button" className={styles.link} onClick={reset}>
            Clear form
          </button>
        </div>
        {tooLong && canSend && (
          <p className={styles.hint}>
            The page is too long to carry in a link. The button copies it first. On the GitHub page that opens, paste it into the editor
            (Ctrl+V).
          </p>
        )}
        <details className={styles.preview}>
          <summary>Preview the Markdown</summary>
          <pre>{markdown}</pre>
        </details>
      </section>
    </div>
  );
}
