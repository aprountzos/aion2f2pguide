import React from 'react';
import {PageMetadata} from '@docusaurus/theme-common';
import {useAllDocsData, useCurrentSidebarCategory, useDocById} from '@docusaurus/plugin-content-docs/client';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';
import DocPaginator from '@theme/DocPaginator';
import DocVersionBanner from '@theme/DocVersionBanner';
import DocBreadcrumbs from '@theme/DocBreadcrumbs';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

// The page of a section ("Gathering", "Leather", ...): replaces Docusaurus's grid of cards.
// The intro is "link.description" in the folder's _category_.json, the one-liner under every page is
// its "description:" frontmatter. Nothing to edit here when pages are added.

const countPages = (item) => (item.type === 'category' ? item.items.reduce((n, i) => n + countPages(i), 0) : 1);

function Row({item}) {
  const isCategory = item.type === 'category';
  const all = Object.values(useAllDocsData()).flatMap((d) => d.versions.flatMap((v) => v.docs));
  // a link row has its doc id; a category that links to a page (like a class page) is matched by its address
  const docId = item.type === 'link' ? item.docId : all.find((d) => d.path === item.href && !d.id.startsWith('/'))?.id;
  const doc = useDocById(docId ?? undefined);
  const href = item.href;
  if (!href) return null;
  const description = isCategory ? item.description || doc?.description : doc?.description;
  return (
    <li className={styles.row}>
      <Link to={href} className={styles.rowLink}>
        {item.label}
      </Link>
      {isCategory && countPages(item) > 0 && <span className={styles.count}>{countPages(item)} {countPages(item) === 1 ? 'page' : 'pages'}</span>}
      {description && <p className={styles.rowText}>{description}</p>}
    </li>
  );
}

function Content({categoryGeneratedIndex}) {
  const category = useCurrentSidebarCategory();
  return (
    <div className={styles.section}>
      <DocVersionBanner />
      <DocBreadcrumbs />
      <header className={styles.head}>
        <Heading as="h1" className={styles.title}>
          {categoryGeneratedIndex.title}
        </Heading>
        {categoryGeneratedIndex.description && <p className={styles.lead}>{categoryGeneratedIndex.description}</p>}
      </header>
      <ul className={styles.list}>
        {category.items.map((item, i) => (
          <Row key={i} item={item} />
        ))}
      </ul>
      <footer className={styles.foot}>
        <DocPaginator previous={categoryGeneratedIndex.navigation.previous} next={categoryGeneratedIndex.navigation.next} />
      </footer>
    </div>
  );
}

export default function DocCategoryGeneratedIndexPage(props) {
  const {categoryGeneratedIndex} = props;
  return (
    <>
      <PageMetadata
        title={categoryGeneratedIndex.title}
        description={categoryGeneratedIndex.description}
        keywords={categoryGeneratedIndex.keywords}
        image={useBaseUrl(categoryGeneratedIndex.image)}
      />
      <Content {...props} />
    </>
  );
}
