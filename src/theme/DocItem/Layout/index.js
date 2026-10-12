import React from 'react';
import Layout from '@theme-original/DocItem/Layout';
import {HtmlClassNameProvider} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import MDXContent from '@theme/MDXContent';

// A page with "landing: true" in its frontmatter (the home page) is shown full width, without
// breadcrumbs, table of contents, comments or previous/next links. Every other page is unchanged.
export default function LayoutWrapper(props) {
  const {frontMatter} = useDoc();
  if (frontMatter.landing === true) {
    return (
      <HtmlClassNameProvider className="landing-page">
        <div className="landing">
          <MDXContent>{props.children}</MDXContent>
        </div>
      </HtmlClassNameProvider>
    );
  }
  return <Layout {...props} />;
}
