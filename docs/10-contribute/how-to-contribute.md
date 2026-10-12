---
updated: 2026-10-10
sidebar_position: 1
slug: /contribute
comments: false
staleness: false
corrections: false
---
# How to Contribute

This guide is community-maintained. Aion 2 gets patches every week, and one person cannot keep every number current, so **corrections and additions from players are the most valuable thing you can give**. You do not need to know how to code.

## Pick your path

| I want to... | Do this | Effort |
| --- | --- | --- |
| Report a wrong or outdated number | Open a [correction issue](https://github.com/aprountzos/aion2f2pguide/issues/new?template=data-correction.yml) | 2 minutes |
| Fix a typo or number myself | Click **Edit this page** at the bottom of any page, then follow [Make Your First Pull Request](./make-your-first-pull-request.md) (browser only, no tools) | 5 minutes |
| Add a whole new page or section | [Add a New Page](./add-a-new-page.md) | 30+ minutes |
| Suggest a topic I would like covered | Open a [content request](https://github.com/aprountzos/aion2f2pguide/issues/new?template=new-content.yml) | 2 minutes |
| Help with the open questions | See [Help Wanted](./help-wanted.md) | varies |
| Report a broken link or a site bug | Open a [site bug report](https://github.com/aprountzos/aion2f2pguide/issues/new?template=site-bug.yml) | 2 minutes |

You need a free [GitHub](https://github.com) account for everything above.

## What makes a good contribution
- **Verified.** You checked it in game, or you can point to a source with a date. In-game always beats a guide site.
- **Small and focused.** One fix or one topic per pull request. Small changes are reviewed in minutes.
- **Dated.** Update the `updated:` date at the top of the page when you re-verify its data.
- **Sourced.** New data goes into the [Sources](../09-reference/sources.md) page with a link.

## Ground rules
1. Be kind. Everyone who contributes follows the [Code of Conduct](https://github.com/aprountzos/aion2f2pguide/blob/main/CODE_OF_CONDUCT.md).
2. **No gold-selling, boosting or "buy Kina" sites** as sources or links, and no ads or referral links.
3. **Do not paste text from other sites.** Facts (numbers, locations, levels) are fine. Write them in your own words and tables, and cite the source.
4. If two sources disagree, show both and say which is which. See the [Style Guide](./style-guide.md).
5. Your contribution is published under the licenses in [License and Credits](./license-and-credits.md).

## Where things live
| Folder | What is in it |
| --- | --- |
| `01-basics` | Glossary, free-to-play notes, daily and weekly checklist |
| `02-leveling` | Level Finder, milestones, routes, level difference |
| `03-gathering` | Gathering rules, by level, node pages |
| `04-leather` | Raw Leather rates and farming by level |
| `05-crafting`, `06-gear`, `07-economy`, `08-level-45` | Topic pages |
| `09-reference` | Zone levels, checklist, **Sources** |
| `10-contribute` | These pages |

All of them live in the `docs/` folder of the [repository](https://github.com/aprountzos/aion2f2pguide). Each page on the site has an **Edit this page** link that opens its source file (a plain Markdown file). The numbers behind the big tables are in the `data/` folder. Pull requests always go to the `dev` branch.

## What happens after you open a pull request
1. Automatic checks run (a content lint and a full build that fails on broken links).
2. A maintainer reviews your change. They may ask for a source or a small tweak.
3. When approved it is merged into the `dev` branch. It goes live with the next numbered version, which the maintainer publishes after collecting a few changes or after a game patch. See [Branches and Versions](./branches-and-versions.md).

Thank you for helping other players.
