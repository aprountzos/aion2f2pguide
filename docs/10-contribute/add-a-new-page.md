---
updated: 2026-10-11
description: "Create a new page and put it in the right place."
sidebar_position: 4
comments: false
staleness: false
corrections: false
---
# Add a New Page

Read the [Style Guide](./style-guide.md) first, and set up as in [Make Your First Pull Request](./make-your-first-pull-request.md) (Path B).

## 1. Pick the folder
Choose the folder where a reader would look for it. Pages live in the `docs/` folder.

| Folder | Put pages about... |
| --- | --- |
| `01-basics` | Terms, free-to-play rules, resets |
| `02-leveling` | Routes, level milestones, anything level-by-level |
| `03-gathering` | Gathering rules; `nodes/` for one page per node type |
| `04-leather` | Leather and monster-drop farming |
| `05-crafting`, `06-gear`, `07-economy`, `08-level-45` | Matching topics |
| `09-reference` | Raw tables and data used by other pages |

If nothing fits, open an issue before creating a new folder. Folders are numbered (`11-pets`) and the number sets the order in the sidebar.

## 2. Create the page
The easy way, from the project folder:

```bash
npm run new-page -- "03-gathering/nodes" "Diamond Nodes"
```

This creates `docs/03-gathering/nodes/diamond-nodes.md` from `templates/page.md`, fills in the title and today's date, and picks the next `sidebar_position` in that folder. You can also create the file by hand: copy `templates/page.md`, and use lowercase letters and hyphens in the file name.

## 3. Write it
- Start with one or two sentences on what the page covers and which game version the data is from.
- Put data in tables, with a level range wherever one exists.
- Link to related pages with a relative link to the file, for example `[Gathering by Level](../03-gathering/gathering-by-level.mdx)`. The extension must match the file.
- Add your sources to [Sources](../09-reference/sources.md).
- Use `.md` for normal pages. A page that shows a component (a table from the data, the Level Finder) is `.mdx`. In `.mdx` pages write `\{`, `\}` and `&lt;` for the characters `{`, `}` and `<` in normal text.
- **Big tables come from data.** Zones, gathering nodes, leather rates and milestones are stored in `data/*.yml` and shown with `<DataTable id="gathering-asmodian" />` in an `.mdx` page (see `docs/03-gathering/gathering-by-level.mdx`). To change a number there, edit the data file, not the page. The list of patches on the Patch History page is also generated from the data: edit `data/patches.yml` and run `npm run data`. A small table in a new page can simply be a normal Markdown table.
- **Interactive parts.** To build a new one, see [Add a React Component](./add-a-react-component.md).

## 4. Make it findable
- Add a link to it from the page it belongs to. A node page, for example, is listed in [Gathering Overview](../03-gathering/gathering-overview.md).
- If it is a major topic, add it to the front page, [Home](../index.mdx).
- If readers looking up by level would want it, add it to [Level Finder](../02-leveling/level-finder.mdx).

## 5. Check
```bash
npm run check
```
This runs the lint (frontmatter, links, tables, components) and a full production build. Fix anything it reports, then open your pull request.

## 6. Send it
- Work on a branch created from `dev`, named `add/<page-name>`, for example `add/diamond-nodes`.
- Open the pull request **against `dev`** with a title like `add: Diamond nodes page`.
- A new page counts as a *minor* change, so it appears in the next minor version. You do not need to edit the Changelog. See [Branches and Versions](./branches-and-versions.md).

## Renaming or moving a page
Renaming or moving a file changes its address and breaks every link to it. The lint lists them all. Move pages only when needed and say so in the PR description.

Back to [How to Contribute](./how-to-contribute.md)
