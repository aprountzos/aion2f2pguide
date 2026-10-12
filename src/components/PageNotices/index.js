import React from 'react';
import Admonition from '@theme/Admonition';
import BrowserOnly from '@docusaurus/BrowserOnly';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import data from '@site/src/generated/data.json';

// Notice shown above a page when the data on it has not been verified for a while:
// the frontmatter "updated" date is older than staleDays (site.config.json).
// A page turns it off with `staleness: false`.

const DAY = 24 * 60 * 60 * 1000;

function asDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const iso = (d) => d.toISOString().slice(0, 10);

function Stale({updated}) {
  const date = asDate(updated);
  if (!date) return null;
  const days = Math.floor((Date.now() - date.getTime()) / DAY);
  if (days <= data.staleDays) return null;
  return (
    <Admonition type="warning" title="This page may be out of date">
      The data on this page was last checked on {iso(date)} ({days} days ago). The game changes every week, so check
      important numbers in game. If you have checked them recently, please use "Edit this page" to update the page.
    </Admonition>
  );
}

export default function PageNotices() {
  const {frontMatter} = useDoc();
  if (frontMatter.staleness === false || !frontMatter.updated) return null;
  return <BrowserOnly>{() => <Stale updated={frontMatter.updated} />}</BrowserOnly>;
}
