# Aion 2 F2P Guide

[![Deploy](https://github.com/aprountzos/aion2f2pguide/actions/workflows/deploy.yml/badge.svg)](https://github.com/aprountzos/aion2f2pguide/actions/workflows/deploy.yml)
[![Release](https://img.shields.io/github/v/release/aprountzos/aion2f2pguide?include_prereleases&label=version)](https://github.com/aprountzos/aion2f2pguide/releases)
[![Code: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)
[![Content: CC BY 4.0](https://img.shields.io/badge/content-CC%20BY%204.0-lightgrey.svg)](LICENSE-CONTENT.md)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A community-maintained, **free-to-play** guide for **Aion 2** (Global): gathering node spots, Raw Leather farming and drop rates, leveling routes, crafting, gear and the F2P economy, all **organized by level** so you can see what to do at your level.

**Read it:** https://aprountzos.github.io/aion2f2pguide/

> Unofficial fan project, not affiliated with NCSOFT. Data is compiled from community sources and changes with every weekly patch, so please confirm important numbers in game. Found something wrong? [Report it](https://github.com/aprountzos/aion2f2pguide/issues/new?template=data-correction.yml) or fix it yourself, see below.

## Contribute

You do not need to code. The fastest way to help:

1. Open any page on the site and click **Edit this page** at the bottom.
2. Fix the text or number, and say where the information comes from.
3. Submit it as a pull request **into the `dev` branch** (the link does this for you). Step-by-step: [CONTRIBUTING.md](CONTRIBUTING.md) or the [contribution guide on the site](https://aprountzos.github.io/aion2f2pguide/contribute).

Other ways: [report a wrong number](https://github.com/aprountzos/aion2f2pguide/issues/new?template=data-correction.yml), [suggest a topic](https://github.com/aprountzos/aion2f2pguide/issues/new?template=new-content.yml), or pick something from the [Help Wanted](https://aprountzos.github.io/aion2f2pguide/contribute/help-wanted) list.

Other ways to contribute: [add an item](https://aprountzos.github.io/aion2f2pguide/contribute/add-an-item), [answer a question](https://aprountzos.github.io/aion2f2pguide/contribute/answer-a-question), [build a widget](https://aprountzos.github.io/aion2f2pguide/contribute/add-a-react-component) for the site.

## Branches and versions

- **`dev`** is the default branch. Every pull request goes here and changes collect on it.
- **`main`** is the live site. It only receives numbered releases from `dev`.
- Branch names: `data/...`, `add/...` (or `feature/...`), `fix/...`, `docs/...`, and `hotfix/...` for urgent fixes to the live site.
- Versions are `MAJOR.MINOR.PATCH`, starting at **0.0.1**. Each release is tagged `vX.Y.Z`, has a GitHub Release and an entry in [CHANGELOG.md](CHANGELOG.md) (also shown as the Changelog page on the site).

Maintainers: the full routine is in [RELEASING.md](RELEASING.md).

## How this repository works

The guide is a folder of plain Markdown pages, published with **[Docusaurus](https://docusaurus.io)** to **GitHub Pages**.

```
docs/               <- the guide: edit these pages (folders become the sidebar)
  index.mdx         <- front page
  01-basics/ ... 10-contribute/
data/               <- numbers behind the tables (YAML): zones, nodes, leather, milestones, patches, items, questions
CHANGELOG.md        <- every released version, written by `npm run release`
scripts/            <- lint, new-page, new-component, data, release and init scripts
templates/          <- templates for new pages and components
src/components/     <- React widgets (LevelFinder, DataTable, ItemDatabase, Questions ...), each with a widget.json
src/css/custom.css  <- the global stylesheet
site.config.json    <- repo owner/name, author, "data checked" date
.github/            <- CI/CD workflows, issue forms, PR template, Dependabot
docusaurus.config.js, sidebars.js, static/   <- site configuration and look
```

`docs/` is the source: what you write there is what is published. Pages are `.md`; a page that shows a component (a table from the data, the Level Finder) is `.mdx`. The big tables are not typed by hand: they are shown from `data/*.yml`, so the same numbers feed the tables and the Level Finder. `docs/changelog.md` and `src/generated/` are created on every start or build and are not committed.

## Run it locally

You need [Node.js](https://nodejs.org) 20 or newer (22 recommended; `.nvmrc` is included).

```bash
npm install
npm start          # live preview at http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm start` | Dev server with live reload |
| `npm run lint` | Checks the pages: frontmatter, links, tables, admonitions, components |
| `npm run build` | Production build into `build/`. Fails on any broken link |
| `npm run check` | `lint` + `build`. Run this before opening a pull request |
| `npm run serve` | Serves the production build (includes search, which dev mode lacks) |
| `npm run new-page -- "03-gathering" "My Page"` | Creates a page from the template |
| `npm run data` | Regenerates the Patch History list from `data/patches.yml` (`lint` fails if it is out of date) |
| `npm run new-component -- MyWidget` | Scaffolds a React widget (`src/components/MyWidget/`) |
| `npm run stale` | Lists pages not verified for 30 days |
| `npm run pr-report -- --base dev` | The report the bot posts on pull requests: changed pages and data rows, problems with file and line |
| `npm run release -- patch\|minor\|major` | Maintainer: prepare a new version on `dev` (see [RELEASING.md](RELEASING.md)) |
| `npm run init -- --user ... --repo ... --name "..."` | One-time setup for a new repository (see [MAINTAINING.md](MAINTAINING.md)) |

## Deployment

Pushing to `main` (a release) runs `.github/workflows/deploy.yml`, which lints, builds and publishes the site to GitHub Pages, and `.github/workflows/release.yml`, which tags the version and publishes the GitHub Release. Pull requests run `.github/workflows/ci.yml` (lint, build with a downloadable preview, branch rules). A weekly job checks all links. Details, including the one-time GitHub setup, are in [MAINTAINING.md](MAINTAINING.md).

## Documentation for this repo

| File | For |
| --- | --- |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Anyone who wants to contribute |
| [GITHUB-SETUP.md](GITHUB-SETUP.md) | The maintainer: first upload to GitHub, step by step |
| [MAINTAINING.md](MAINTAINING.md) | The maintainer: setup, deploy, reviewing PRs, patch-day routine, troubleshooting |
| [RELEASING.md](RELEASING.md) | The maintainer: branches, versions, publishing a release, hotfixes |
| [CHANGELOG.md](CHANGELOG.md) | What changed in each version |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | How we treat each other |
| [SECURITY.md](SECURITY.md) | Reporting a problem privately |

## Comments

Each guide page can show 👍 👎 reactions and comments through [giscus](https://giscus.app) (GitHub Discussions). It is off until a maintainer sets it up (MAINTAINING.md, 1.10). A comment is not a correction: use a [correction issue](https://github.com/aprountzos/aion2f2pguide/issues/new?template=data-correction.yml) or a pull request for data.

## License

- **Guide content** (`docs/` and the published text): [CC BY 4.0](LICENSE-CONTENT.md). Share and adapt with credit.
- **Code** (scripts, configuration, workflows): [MIT](LICENSE).

AION 2 and related marks are trademarks of their owners (NC / NCSOFT). No game assets are included in this repository.
