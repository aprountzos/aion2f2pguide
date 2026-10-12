<!-- Open this pull request against the `dev` branch (not `main`). Only releases go into main. -->

## What does this change?

<!-- One or two sentences. Which page(s)? Example: "Fixes the Ruby node count for Basfelt Ruins on Gems page." -->

## Where does the information come from?

<!-- Required for any data change (numbers, levels, locations, rates).
     - Checked in game on YYYY-MM-DD (game version/patch: ...)
     - or a link to the source, which you have also added to the Sources page -->

## Type of change

- [ ] Data fix (a number, level, location or rate), title starts with `data:`
- [ ] New page or section (`add:`)
- [ ] Typo or formatting (`fix:`)
- [ ] Contribution docs, README, workflows or code (`docs:` / `feat:`)

## Checklist

- [ ] The pull request targets `dev`
- [ ] I changed source files only (`docs/`, `data/`, `src/`), not generated files (`docs/changelog.md`, `src/generated/`)
- [ ] If I changed `data/patches.yml`, I ran `npm run data` and committed the updated Patch History
- [ ] Component: it has a `widget.json`, uses theme variables (works in dark mode), and I tried it in the browser
- [ ] I set `updated:` to today's date on pages whose data I verified
- [ ] Numbers are exact and level ranges use an en dash, like `10–14`
- [ ] New sources are added to `docs/09-reference/sources.md`
- [ ] If sources disagree, I showed both values in a `:::note` admonition
- [ ] I did not copy text from other sites, and I did not use gold-selling or boosting sites as sources
- [ ] The checks at the bottom of this pull request are green (or I ran `npm run check` locally)

<!-- Thank you for contributing! A maintainer will review this soon. -->
