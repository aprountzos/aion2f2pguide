---
updated: 2026-10-10
sidebar_position: 8
comments: false
staleness: false
corrections: false
---
# Add a React Component

The website is built with [Docusaurus](https://docusaurus.io), so any page can show an interactive **React component**: a calculator, a filter, a map viewer, a checklist. This page explains how to add one, so the site can grow with new features from contributors. You need basic JavaScript and React. For text and numbers you do **not** need a component, see [Add a New Page](./add-a-new-page.md).

## When is a component the right tool?
| You want to... | Use |
| --- | --- |
| Fix a number, add a sentence, add a page | A normal page, see [Add a New Page](./add-a-new-page.md) |
| Add or change rows of a table (zones, nodes, leather, milestones, patches) | The data files in `data/`, they feed the tables and the Level Finder |
| Show something the reader can interact with (filter, calculator, picker, checklist) | **A component, this page** |
| Change colors, spacing or fonts of the whole site | The global stylesheet `src/css/custom.css` |
| Change the page layout, navbar or footer | `docusaurus.config.js` or a theme wrapper in `src/theme/` (see Advanced below) |

## Where things live
| Path | What it is |
| --- | --- |
| `src/components/<Name>/index.js` | The component (default export) |
| `src/components/<Name>/styles.module.css` | Styles of this component only |
| `src/components/<Name>/widget.json` | Makes it usable in pages (no import needed) and declares its properties |
| `src/components/inline.js` | Small helpers: level parsing, `**bold**` rendering, safe `localStorage` |
| `src/css/custom.css` | The **global stylesheet**: color palette (light and dark), table style, admonitions |
| `src/generated/data.json` | The guide data for components (generated, never edit it) |
| `src/theme/` | Wrappers around Docusaurus theme parts (page footer, page notices) and `MDXComponents.js`, which makes the widgets available in pages |

Examples to read first: `LevelFinder` (a full interactive widget), `DataTable` (sorting and filtering) and `Contributors` (a simple one).

## Create a component
```bash
npm run new-component -- DropCalculator "Expected Raw Leather for a number of kills"
```
This creates `src/components/DropCalculator/` with `index.js`, `styles.module.css` and `widget.json`, ready to edit. Then:

1. Write the component in `index.js`.
2. Describe its properties in `widget.json`.
3. Use it in an `.mdx` page.
4. Run `npm start` and look at it, then `npm run check`.

### Use it in a page
Every widget is available in `.mdx` pages **without an import**. Write it where the component should appear:

```mdx
<DropCalculator />
<DropCalculator rate={5.8} title="Raw Leather" showTotal />
```

A page that uses a component must be an `.mdx` file (rename `my-page.md` to `my-page.mdx` and fix the links to it). Properties are written `name="text"`, `name={5.8}` or `name={true}` (just `name` for true). Nothing else is allowed in a property, which keeps pages safe from broken markup. Every property must be declared in `widget.json`, and the lint (`npm run lint`) checks names, types and required properties.

### Declare properties in `widget.json`
```json
{
  "description": "Expected Raw Leather for a number of kills.",
  "props": {
    "rate": {"type": "number", "required": false},
    "title": {"type": "string"},
    "faction": {"type": "string", "values": ["asmodian", "elyos"]},
    "showTotal": {"type": "boolean"}
  }
}
```
`type` is `string`, `number` or `boolean`. `values` limits the allowed values. `required` is optional.

The component receives them as normal React props:

```jsx
export default function DropCalculator({rate = 5.8, title = 'Raw Leather', showTotal = false}) {
  // ...
}
```

In `.mdx` pages the characters `{`, `}` and `<` in normal text must be escaped (`\{`, `\}`, `&lt;`), because MDX reads them as code. The build tells you the line if you forget.

## Rules for components
1. **No new dependencies without discussing it first.** Open an issue. Every package makes the site heavier and adds an update burden. React, Docusaurus and the helpers in `src/components/inline.js` are enough for almost everything.
2. **No network requests** and no tracking or analytics scripts inside components. The site works offline and stays private. Data comes from the guide itself (see below).
3. **Work on the server too.** The site is pre-rendered. Do not touch `window`, `document` or `localStorage` while rendering. Use `useEffect`, or wrap code in `<BrowserOnly>`. For storage use `store.get` and `store.set` from `inline.js`, which never throw.
4. **Use the theme colors**, so dark mode works. Use the Infima variables, never fixed colors: `var(--ifm-color-primary)`, `var(--ifm-background-surface-color)`, `var(--ifm-color-emphasis-300)`, `var(--ifm-font-color-base)`, `var(--ifm-color-warning-darkest)`. Check both light and dark mode.
5. **Be accessible.** Use real `<button>`, `<label>` and `<input>` elements, give inputs labels, and make everything usable with the keyboard. Do not use color alone to carry meaning.
6. **Work on phones.** Check at 360 px wide. Wrap content and let tables scroll horizontally.
7. **Write the texts in English, directly in the component.** The guide is English only.
8. **Keep it small and focused.** One component, one job, one folder. Prefer clear code to clever code, with a short comment on top saying what it does.
9. **Do not hard-code game numbers** in a component. Read them from the data (below), so a patch only changes a data file.
10. Never use `dangerouslySetInnerHTML` or load scripts from other sites.

## Styling
There are two layers:

- **Global stylesheet: `src/css/custom.css`.** Loaded on every page. It defines the color palette in `:root` (light) and `[data-theme='dark']` (dark), the table look inside articles (`.markdown table`) and the admonition boxes. Change it when you want a site-wide change, such as the primary color (`--ifm-color-primary` and its shades). Keep it small. Do not put component styles in it.
- **Component styles: `styles.module.css`.** A CSS module. Class names are local to the component, so they cannot clash. Import it with `import styles from './styles.module.css'` and use `className={styles.box}`.

The full list of theme variables is in the [Docusaurus styling guide](https://docusaurus.io/docs/styling-layout) and the [Infima documentation](https://infima.dev).

## Using the guide's data
`@site/src/generated/data.json` holds the guide's data, generated from `data/*.yml` whenever you run `npm start` or `npm run build`:

```jsx
import data from '@site/src/generated/data.json';

data.zones.elyos;       // [{name, levels: "11–12", dungeons, quests}, ...]
data.nodes.asmodian;    // [{zone, nodes: {orichalcum: 180}, note}, ...]
data.leather.elyos;     // [{level, mob, where, rate, extra}, ...]
data.milestones;        // [{level, text}, ...]
data.tables.en.milestones; // ready-made table model (columns and rows)
```

To add **a new kind of data**, for example item prices:

1. Create `data/items.yml` with a comment on top explaining each field (copy the style of `data/nodes.yml`).
2. Add loading and validation in `scripts/lib/data.mjs` (`loadData` and `validate`), with clear error messages that name the file and row.
3. If it should also be a table in a page, add a table builder next to `buildTables` and its id in `TABLE_IDS` and in `src/components/DataTable/widget.json`, then use `<DataTable id="your-table" />` in an `.mdx` page.
4. Export it to the components in `scripts/prepare-site.mjs` (the `data.json` part).

Ask in an issue first if you are unsure. A maintainer can help with the data scripts.

## Advanced: changing the site itself
- **Navbar, footer, plugins:** `docusaurus.config.js`.
- **Wrap a Docusaurus component** (add something above or below a part of every page): put a file at `src/theme/<Component>/index.js` that imports `@theme-original/<Component>` and renders it with your addition. See `src/theme/DocItem/Footer/index.js` (the comment box) and `src/theme/DocItem/Content/index.js` (the out-of-date notice).
- **A page that is not part of the guide** (a landing page, a tool): add a React page in `src/pages/`. It gets its own address. Prefer a normal page with a widget, which keeps the sidebar and search working.
- **Settings for the maintainer** (repository, comment box): `site.config.json`.

## Before you open the pull request
- [ ] `npm run check` passes (lint plus a full build that fails on broken links)
- [ ] It looks right in light **and** dark mode, on a narrow phone width, and with the keyboard only
- [ ] It works in `npm run build && npm run serve` (the production build), not only in `npm start`
- [ ] No new dependency, no network requests, no hard-coded game numbers
- [ ] The component folder has `widget.json`, and a page actually uses the widget (or the pull request says where it will be used)
- [ ] The pull request is against `dev`, titled `feat: add <what it does>`, with a screenshot or short video of it working

A new component is a *minor* change, so it ships in the next minor version, see [Branches and Versions](./branches-and-versions.md).

Back to [How to Contribute](./how-to-contribute.md)
