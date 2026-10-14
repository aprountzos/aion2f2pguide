# Changelog

Every published version of the guide and the site. The format follows [Keep a Changelog](https://keepachangelog.com), and versions follow [Semantic Versioning](https://semver.org).

## [Unreleased]

## [0.3.1] - 2026-10-14

Data checked: 2026-10-10

### Added

- Class pages with player-written guides, template and contribute guide; remove guide builder
- Class pages with player-written guides, template and contribute guide; remove guide builder
- Progress checklists, class guides with a guide builder, new logo, 404 page, calmer footer
- Remembered level and faction, page header line, table and callout styling (#10)
- Custom section pages with page descriptions (#5)

### Maintenance

- Remove links to maintainer-only guides (#6)

## [0.3.0] - 2026-10-14

Data checked: 2026-10-10

### Added

- Class pages with player-written guides, template and contribute guide; remove guide builder
- Class pages with player-written guides, template and contribute guide; remove guide builder
- Progress checklists, class guides with a guide builder, new logo, 404 page, calmer footer
- Remembered level and faction, page header line, table and callout styling (#10)
- Custom section pages with page descriptions (#5)

### Maintenance

- Remove links to maintainer-only guides (#6)

## [0.2.0] - 2026-10-13

Data checked: 2026-10-10

### Added

- Progress checklists, class guides with a guide builder, new logo, 404 page, calmer footer
- Remembered level and faction, page header line, table and callout styling (#10)
- Custom section pages with page descriptions (#5)

### Maintenance

- Remove links to maintainer-only guides (#6)

## [0.1.3] - 2026-10-12

Data checked: 2026-10-10

### Added

- Custom section pages with page descriptions (#5)

### Maintenance

- Remove links to maintainer-only guides (#6)

## [0.1.2] - 2026-10-12

Data checked: 2026-10-10

### Added

- New landing page and sidebar (#3)

### Maintenance

- Release script can push and open the release pull request

## [0.1.1] - 2026-10-12

Data checked: 2026-10-10

### Added

- New landing page and sidebar (#3)

## [0.1.0] - 2026-10-12

Data checked: 2026-10-10

### Added

- Turn on comments
- Add item database, questions page and PR report code

### Data updates

- Add items and questions, update README and contributing guide

## [0.0.1] - 2026-10-10

Data checked: 2026-10-10

First version.

### Added

- Guide organized by level: level finder, leveling routes for both factions, milestones 1–45 and the level difference rules.
- Gathering: Essence Extraction, gathering by level and node counts per zone.
- Raw Leather farming by level with drop rates, including the October 7 2026 rate changes.
- Crafting, gear, free-to-play economy and level 45 pages, plus reference pages for sources and the glossary.
- Contribution section: how to contribute, first pull request walkthrough, style guide, adding pages, help wanted and license pages.
- Search, dark mode, "Edit this page" and "report a correction" links on every page.
- Automatic deployment to GitHub Pages, pull request checks and a weekly link check.
- Data layer: the zone, gathering, leather and milestone tables are shown from `data/*.yml`, and the same data powers the Level Finder and the Patch History.
- Level Finder: type your level and faction to see zones, nodes and unlocks. Sortable and filterable tables.
- Patch History page.
- Pages show a warning when their data has not been verified for 30 days, who changed them last, and a Contributors page. A weekly workflow lists the pages to re-verify.
- Components: widgets usable in any `.mdx` page without an import, `npm run new-component`, and a contributor guide for React components.
- Optional comments and reactions with giscus.
- `dev` and `main` branches, release automation and the Branches and Versions page.
- Item Database: search and filter the items the guide uses (category, type, grade, faction, level), sortable, with a shareable link, from `data/items.yml`. Every item has a source link.
- Questions page: a blog-style list of answered questions with search and topics, and a discussion at the bottom where visitors ask new questions and others answer.
- Pull request report: a bot comment with the changed pages and data rows, the pages that show that data and every problem with file and line. `npm run pr-report` runs it locally.

[Unreleased]: https://github.com/aprountzos/aion2f2pguide/compare/v0.3.1...HEAD
[0.3.1]: https://github.com/aprountzos/aion2f2pguide/compare/v0.2.0...v0.3.1
[0.3.0]: https://github.com/aprountzos/aion2f2pguide/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/aprountzos/aion2f2pguide/compare/v0.1.3...v0.2.0
[0.1.3]: https://github.com/aprountzos/aion2f2pguide/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/aprountzos/aion2f2pguide/compare/v0.1.0...v0.1.2
[0.1.1]: https://github.com/aprountzos/aion2f2pguide/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/aprountzos/aion2f2pguide/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/aprountzos/aion2f2pguide/releases/tag/v0.0.1
