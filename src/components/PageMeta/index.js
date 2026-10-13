import React, {useEffect, useState} from 'react';
import clsx from 'clsx';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import data from '@site/src/generated/data.json';
import styles from './styles.module.css';

// The line under a page's title: "Updated 10 Oct 2026". When the date is older than staleDays
// (site.config.json) it also says that the numbers may have changed. Shown on pages with an
// "updated:" date, unless the page has `staleness: false` in its frontmatter. It is added by the
// "h1" entry in src/theme/MDXComponents.js, so every page gets it without writing anything.

const DAY = 24 * 60 * 60 * 1000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toIso(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : null;
}

const pretty = (iso) => `${Number(iso.slice(8))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;

function useFrontMatter() {
  try {
    return useDoc().frontMatter;
  } catch {
    return null; // not inside a docs page
  }
}

export default function PageMeta() {
  const fm = useFrontMatter();
  const updated = fm && fm.staleness !== false && fm.landing !== true ? toIso(fm.updated) : null;
  const [days, setDays] = useState(null); // computed in the browser: the build date is not today
  useEffect(() => {
    if (updated) setDays(Math.floor((Date.now() - Date.parse(updated)) / DAY));
  }, [updated]);
  if (!updated) return null;
  const stale = days !== null && days > data.staleDays;
  return (
    <p className={clsx(styles.meta, stale && styles.stale)}>
      Updated <time dateTime={updated}>{pretty(updated)}</time>
      {stale && <> ({days} days ago). The game changes every week, so check important numbers in game.</>}
    </p>
  );
}
