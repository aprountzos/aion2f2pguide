---
updated: 2026-10-10
sidebar_position: 7
comments: false
staleness: false
corrections: false
---
# Branches and Versions

This page explains where your change goes after you submit it and how it reaches the live site. Contributors only need the first section.

## What you need to know
- **Open your pull request against `dev`.** The **Edit this page** link on every page already does this.
- Name your branch `<kind>/<short-name>`, for example `data/basfelt-ruby-count`, `add/diamond-nodes`, `fix/level-finder-link`.
- Do not touch the version number or the Changelog. The maintainer does that when publishing.
- After your pull request is merged, your change waits on `dev` and goes live with the next numbered version. This is usually within a few days, and right after a game patch.

## The branches
| Branch | What it is |
| --- | --- |
| `main` | **The live site.** Whatever is on `main` is published. It only changes when a version is released |
| `dev` | **Collecting area.** Every accepted pull request is merged here first, so changes can be checked together before they go live |
| `data/...`, `add/...`, `feature/...`, `fix/...`, `docs/...` | Short-lived branches, one per change. They are deleted after merging |
| `hotfix/...` | An urgent fix to the live site, such as a badly wrong number. It is branched from `main` and released straight away |

A branch name like `feature/diamond-nodes` is only a naming convention. There is no branch called just `feature`.

## Versions
The guide has numbered versions, written `MAJOR.MINOR.PATCH`, starting at `0.0.1`.

| Number goes up when | Example |
| --- | --- |
| **PATCH** (`0.0.1` to `0.0.2`) | Data updates after a game patch, corrected numbers, typos, small fixes |
| **MINOR** (`0.0.2` to `0.1.0`) | New pages or sections, or a new feature of the site |
| **MAJOR** (`0.x` to `1.0.0`) | The guide covers every level range and is considered complete, or a restructure that changes many page addresses |

Each published version has a **tag** such as `v0.1.0` and a GitHub Release with its notes. The full list is on the Changelog page of this site.

## How a change travels
1. You open a pull request into `dev` and the automatic checks run.
2. A maintainer reviews it and merges it into `dev`.
3. When enough has collected, or a game patch has been processed, the maintainer prepares a release: the version is raised and the Changelog is written from the titles of the merged pull requests. That is why the **title of your pull request matters**: write it like `data: fix Basfelt Ruins Ruby count`.
4. The release is merged from `dev` into `main`. The site is rebuilt and published, and the tag and the GitHub Release are created automatically.

Back to [How to Contribute](./how-to-contribute.md)
