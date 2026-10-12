---
updated: 2026-10-10
description: "Short rules so every page reads the same and every number can be checked."
sidebar_position: 3
comments: false
staleness: false
corrections: false
---
# Style Guide

Short rules so every page reads the same and every number can be checked.

## Principles
1. **Accurate over complete.** A missing value is better than a guessed one.
2. **Organized by level.** Players ask "what do I do at my level", so give level ranges wherever zones, mobs or nodes appear.
3. **Scannable.** Tables for data, short sentences for advice, no walls of text.
4. **Show the source.** Every number can be traced through the [Sources](../09-reference/sources.md) page.

## Page structure
Every page is a Markdown file in `docs/` with frontmatter (including a one-sentence `description:`, which is shown on the section page), one `#` title, then `##` sections. Use `.md`. Only a page that shows a component (for example the Level Finder) is `.mdx`, see [Add a React Component](./add-a-react-component.md).

```markdown
---
updated: 2026-10-10
description: One sentence about the page, shown on the section page and in search results.
sidebar_position: 3
---
# Page Title

Short intro: what the page covers and which game version or date the data is from.

## Section
...

Back to [Home](../index.mdx)
```

| Frontmatter field | Meaning |
| --- | --- |
| `updated` | The date you last **verified the data on this page** (`YYYY-MM-DD`). Required |
| `sidebar_position` | Order inside the folder, lowest first. Required |
| `sidebar_label` | Optional shorter name for the sidebar |
| `comments`, `staleness`, `corrections` | Optional. `false` hides the comment box, the "out of date" warning or the "spotted a mistake" line on that page |

## File names
- The file name is the address of the page: `raw-leather.md` is shown at `/leather/raw-leather`. Use **lowercase letters, digits and hyphens** only, as in `gathering-by-level.md`.
- File names must be **unique** across the whole of `docs/`. The lint checks this.
- Folders are numbered (`04-leather`). The number sets the order in the sidebar and is not part of the address.
- The title is the first `#` heading, in Title Case. Avoid renaming or moving a page, because every link to it breaks (the lint tells you which).

## Game terms
| Write | Not |
| --- | --- |
| Kina (and Quna, the premium currency) | Kinah, Kina/Quna mixed up |
| Odyle (the material) and Odyle Energy (the resource) | Odyle for both |
| Asmodian, Elyos | Asmo, Ely |
| Verteron, Altgard, Eltnen, Morheim | abbreviations |
| Zone and mob names as spelled in game | nicknames |

## Numbers
- Level ranges use an en dash: `10–14`. A single level is `22`.
- Node and spawn counts are the exact number shown on the map you cite. Do not round.
- Percentages keep the precision of the source: `5.8%`, `0.65%`.
- Say **before/after** when a patch changed a value, and give the patch date.
- Distances are approximate and marked with `~`: `~110 m`.
- Level first: when a table lists zones, put the level range next to the zone name, like `Dredgion Crash Site (11–20)`.

## Tables
- One header row, then the separator `| --- | --- |`, then data rows. Every row has the same number of columns (the lint checks this).
- Bold the best option in a row (`**180**`) instead of writing "best".
- Empty cells are fine. Do not write "N/A" or "?".

## Links
- Between pages use a **relative link to the file**, with its extension: `[Level Finder](../02-leveling/level-finder.mdx)` from another folder, or `[Raw Leather](./raw-leather.md)` in the same folder. The extension must match the file (`.md` or `.mdx`). The lint and the build fail on a broken link.
- External links use `https://`.
- End pages with a `Back to [Home](../index.mdx)` line (the number of `../` depends on the folder).

## Callouts
Use admonitions, they become colored boxes on the website. Each one starts with `:::type[Title]` and ends with `:::` on its own line.

```markdown
:::tip[Short title]
A shortcut or recommendation.
:::

:::warning[Short title]
Something that can waste the reader's time or resources.
:::

:::note[Conflicting info]
Where two sources disagree, show both values.
:::
```

Types: `note`, `tip`, `info`, `warning`, `danger`. Use them sparingly, a page with five callouts has none.

## Conflicting information
When sources disagree, **do not pick silently**.
1. Put the better-supported value in the table.
2. Add a `:::note[Conflicting info]` callout that names the other value and who reports it.
3. If you checked in game, say so with the date. That settles it.

## Sources policy
Good, in order of preference:
1. What you verified **in game** (state the date and game version).
2. Official patch notes and announcements.
3. Established wikis and interactive maps with node and drop data.
4. Reputable guide sites with specific numbers.

Do **not** use or link:
- Gold-selling, boosting or account-selling sites, or their forum posts, even if the numbers look right. They are the main source of wrong advice.
- Anonymous forum posts with no numbers.
- Anything that needs a login or paywall to verify.

When you add a new source, add it to the matching section of [Sources](../09-reference/sources.md) with a title and link. Paraphrase, never copy text. Facts and numbers are fine to use, sentences are not.

## Images
There are no images in the guide yet. If you think a screenshot or map would help, open an issue to discuss it first so we can decide how to store them.

## Quick checklist before you submit
- [ ] `updated:` is today's date on every page whose data I verified
- [ ] Numbers are exact, level ranges use `–`
- [ ] New sources are in [Sources](../09-reference/sources.md)
- [ ] Conflicts are shown in a callout
- [ ] `npm run check` passes (or the automatic checks on the PR are green)

Back to [How to Contribute](./how-to-contribute.md)
