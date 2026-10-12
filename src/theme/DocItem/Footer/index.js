import React from 'react';
import Footer from '@theme-original/DocItem/Footer';
import Link from '@docusaurus/Link';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Comments from '@site/src/components/Comments';

// Wraps the original doc footer (edit link, last updated) and adds
//   - "Spotted a mistake?" with a link that opens a prefilled correction issue (`corrections: false` hides it)
//   - the comment box (`comments: false` hides it)
export default function FooterWrapper(props) {
  const {frontMatter, metadata} = useDoc();
  const {siteConfig} = useDocusaurusContext();
  const {repoUrl} = siteConfig.customFields;
  const issue =
    `${repoUrl}/issues/new?template=data-correction.yml` +
    `&title=${encodeURIComponent('Correction: ' + metadata.title)}` +
    `&page=${encodeURIComponent(metadata.permalink)}`;
  return (
    <>
      <Footer {...props} />
      {frontMatter.corrections !== false && (
        <p>
          <em>
            Spotted a mistake or an outdated number? <a href={issue}>Report it</a> or use <strong>Edit this page</strong>{' '}
            above to fix it yourself. See <Link to="/contribute">how to contribute</Link>.
          </em>
        </p>
      )}
      {frontMatter.comments !== false && <BrowserOnly>{() => <Comments />}</BrowserOnly>}
    </>
  );
}
