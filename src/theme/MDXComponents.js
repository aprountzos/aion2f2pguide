import React from 'react';
import Heading from '@theme/Heading';
import MDXComponents from '@theme-original/MDXComponents';
import PageMeta from '../components/PageMeta';

// Makes every widget available in .mdx pages without an import: <LevelFinder />, <DataTable id="..." />.
// A widget is a folder src/components/<Name>/ with an index.js and a widget.json. Create one with:
//   npm run new-component -- Name
// (webpack's require.context finds the folders, so there is no list to keep up to date)
const metas = require.context('../components', true, /^\.\/[A-Z][A-Za-z0-9]*\/widget\.json$/);
const modules = require.context('../components', true, /^\.\/[A-Z][A-Za-z0-9]*\/index\.js$/);

const widgets = {};
for (const key of metas.keys()) {
  const name = key.split('/')[1];
  widgets[name] = modules(`./${name}/index.js`).default;
}

// The page title (the "# Title" of a page) is followed by the "Updated ..." line.
const H1 = (props) => (
  <>
    <Heading as="h1" {...props} />
    <PageMeta />
  </>
);

export default {...MDXComponents, h1: H1, ...widgets};
