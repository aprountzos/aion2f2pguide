import React from 'react';
import styles from './styles.module.css';

// __NAME__: __DESCRIPTION__
//
// Use it in an .mdx page (no import needed):   <__NAME__ />
// Properties are declared in widget.json and passed like:   <__NAME__ title="Hello" />
// Guide: docs/10-contribute/add-a-react-component.md (also on the website under Contribute).

export default function __NAME__({title = 'Hello'}) {
  return (
    <section className={styles.box}>
      <h3 className={styles.title}>{title}</h3>
      <p>This is the __NAME__ component.</p>
    </section>
  );
}
