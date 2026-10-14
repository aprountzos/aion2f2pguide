import React, {useEffect, useRef, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import CodeBlock from '@theme/CodeBlock';
import {allClasses, newGuideUrl, templateFor} from '../classes';
import styles from './styles.module.css';

// The class guide template (templates/class-guide.md) in a code block, with a copy button and one
// "start on GitHub" link per class. Shown on the "Write a Class Guide" page, so the template is never out of date.
export default function GuideTemplate() {
  const {siteConfig} = useDocusaurusContext();
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const text = templateFor(null, 'YYYY-MM-DD');
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      /* the text can still be selected in the box */
    }
  };
  return (
    <div>
      <CodeBlock language="markdown" title="templates/class-guide.md">
        {text}
      </CodeBlock>
      <p>
        <button type="button" className="button button--secondary button--sm" onClick={copy}>
          {copied ? 'Copied' : 'Copy the template'}
        </button>
      </p>
      <p className={styles.lead}>Or open GitHub with the template already filled in for your class:</p>
      <ul className={styles.links}>
        {allClasses().map((c) => (
          <li key={c.id}>
            <a href={newGuideUrl(siteConfig.customFields, c)} target="_blank" rel="noopener noreferrer">
              {c.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
