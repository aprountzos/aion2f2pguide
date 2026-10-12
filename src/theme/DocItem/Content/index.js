import React from 'react';
import Content from '@theme-original/DocItem/Content';
import PageNotices from '@site/src/components/PageNotices';

// Wraps the original page content and puts the "data may be out of date" notice above it.
export default function ContentWrapper(props) {
  return (
    <>
      <PageNotices />
      <Content {...props} />
    </>
  );
}
