import React from 'react';
import clsx from 'clsx';
import {useLocation} from '@docusaurus/router';
import {hashText, isTicked, setTick, useChecks} from '../checks';
import {useChecklist} from './index';
import styles from './styles.module.css';

// One "- [ ] item" of a markdown list. Used by the "li" entry in src/theme/MDXComponents.js, so every
// task list in the guide is clickable and keeps its ticks in the visitor's browser.

const textOf = (node) => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return node.props ? textOf(node.props.children) : '';
};

const isBox = (c) => React.isValidElement(c) && c.props && c.props.type === 'checkbox';

export default function TaskItem({className, children, ...rest}) {
  const {pathname} = useLocation();
  const ctx = useChecklist();
  const checks = useChecks();
  const list = React.Children.toArray(children);
  const rest2 = list.filter((c) => !isBox(c));
  const text = textOf(rest2).replace(/\s+/g, ' ').trim();
  const scope = ctx ? ctx.scope : 'page';
  const period = ctx ? ctx.period : 0;
  const key = `${pathname}|${scope}|${hashText(text)}`;
  const on = isTicked(checks, key, period);
  return (
    <li className={clsx(className, styles.item, on && styles.done)} {...rest}>
      <label className={styles.label}>
        <input type="checkbox" checked={on} onChange={(e) => setTick(key, period, e.target.checked)} />
        <span>{rest2}</span>
      </label>
    </li>
  );
}
