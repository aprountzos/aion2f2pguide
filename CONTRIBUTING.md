# Contributing

Thank you for helping keep this guide accurate. Aion 2 changes every week, and corrections from players who checked in game are the most valuable thing you can send. **You do not need to know how to code.**

By taking part you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to help

| I want to... | Do this |
| --- | --- |
| Report a wrong or outdated number | [Open a correction issue](https://github.com/aprountzos/aion2f2pguide/issues/new?template=data-correction.yml) |
| Fix a typo or a number myself | Click **Edit this page** on the site, then follow *Quick start: in your browser* below |
| Add a page or a section | Read the [Style Guide](https://aprountzos.github.io/aion2f2pguide/contribute/style-guide) and [Add a New Page](https://aprountzos.github.io/aion2f2pguide/contribute/add-a-new-page) |
| Suggest a topic | [Open a content request](https://github.com/aprountzos/aion2f2pguide/issues/new?template=new-content.yml) |
| Answer an open question | See [Help Wanted](https://aprountzos.github.io/aion2f2pguide/contribute/help-wanted) |
| Build a new interactive widget | Read [Add a React Component](https://aprountzos.github.io/aion2f2pguide/contribute/add-a-react-component) |
| Report a site bug | [Open a bug report](https://github.com/aprountzos/aion2f2pguide/issues/new?template=site-bug.yml) |

## Where your pull request goes

**Always open it against the `dev` branch**, not `main`. `main` is the live site and only receives numbered releases. Accepted changes collect on `dev` and are published together as the next version (see [RELEASING.md](RELEASING.md) and the [Branches and Versions](https://aprountzos.github.io/aion2f2pguide/contribute/branches-and-versions) page). You never need to change the version number or the changelog.

## Ground rules

1. **Verify.** Check it in game or cite a dated source. In-game beats any guide site.
2. **Cite.** Add new sources to `docs/09-reference/sources.md`.
3. **No gold-selling, boosting or account-selling sites** as sources or links, and no ads or referral links.
4. **Do not copy text** from other sites. Facts and numbers are fine, in your own words and tables.
5. **One topic per pull request.** Small changes are reviewed quickly.
6. **Show conflicts.** If sources disagree, show both values in a `:::note` admonition instead of picking silently.
7. Contributions are released under the project licenses: [CC BY 4.0](LICENSE-CONTENT.md) for text, [MIT](LICENSE) for code. Only submit your own work.

## Quick start: in your browser (no software)

1. Sign in to GitHub and open the page on the site. Click **Edit this page** at the bottom. It opens the file on the `dev` branch.
2. GitHub offers to **fork** the repository (your personal copy). Accept.
3. Edit the text. Use the **Preview** tab to check it. Set `updated:` at the top to today's date if you verified the page's data.
4. Click **Commit changes...**, write a short message such as `data: fix Basfelt Ruins Ruby count`, choose **Create a new branch**, then **Propose changes**.
5. Click **Create pull request**. Check that the base branch says **`dev`**, fill in the checklist (**especially where the information comes from**) and submit.
6. Wait for the automatic checks (green tick) and a review. If changes are requested, edit the same branch and the pull request updates itself.

## On your computer

Needs [Git](https://git-scm.com/downloads) and [Node.js](https://nodejs.org) 20+.

```bash
# 1. Fork the repo on GitHub (button top right), then:
git clone https://github.com/<your-username>/aion2f2pguide.git
cd aion2f2pguide
git remote add upstream https://github.com/aprountzos/aion2f2pguide.git
npm install

# 2. For each change
git fetch upstream
git switch -c data/basfelt-ruby-count upstream/dev
npm start                      # live preview at http://localhost:3000

# 3. Edit pages in docs/ (any editor)
npm run check                  # lint + build, fails on broken links

# 4. Send it
git add docs data src
git commit -m "data: fix Basfelt Ruins Ruby count"
git push -u origin data/basfelt-ruby-count
# then click "Compare & pull request" on your fork on GitHub and make sure the base branch is dev
```

Edit these folders only:

| Folder | What |
| --- | --- |
| `docs/` | The guide pages (Markdown). Each page has an **Edit this page** link on the site |
| `data/` | The numbers behind the big tables. After editing, run `npm run data` if the Patch History changed |
| `src/components/` | Interactive widgets (React). Create one with `npm run new-component -- Name` |

`docs/changelog.md` and `src/generated/` are created on every start or build and never committed. Colors and global styling are in `src/css/custom.css`.

To add a new page: `npm run new-page -- "03-gathering/nodes" "Diamond Nodes"`.

If `dev` moved while your pull request was open:

```bash
git fetch upstream
git rebase upstream/dev
git push --force-with-lease
```

Branch names are `<kind>/<short-name>`: `data/...`, `add/...` (or `feature/...`), `fix/...`, `docs/...`.

## Commit and pull request titles

Short, imperative, with a prefix. The pull request title becomes the line in the changelog, so it matters most:

| Prefix | Use for |
| --- | --- |
| `data:` | A number, level, location or rate |
| `add:` | A new page or section |
| `fix:` | A typo, broken link or formatting |
| `docs:` | Contribution docs, README, workflows |
| `feat:` | A new feature of the website itself, for example a new component |

## What happens next

1. **Automatic checks** run: `npm run lint` (frontmatter, links, tables) and a full build that fails on broken links. A preview of the site is attached to the run.
2. A maintainer **reviews** it. They may ask for a source or a small change.
3. Approved pull requests are **squash-merged into `dev`**. The change goes live with the next numbered version, which the maintainer publishes after collecting a few changes or after a game patch.

## Style in one minute

- Level ranges use an en dash: `10–14`. Put the level next to every zone name.
- Exact numbers from the source, no rounding. Mark approximate distances with `~`.
- Game terms as in game: Kina, Quna, Odyle (material) vs Odyle Energy, Asmodian, Elyos.
- Tables have the same columns in every row. Callouts: `:::tip`, `:::warning`, `:::note` (closed with `:::`).
- Link pages with a relative link to the file: `[Level Finder](../02-leveling/level-finder.mdx)`. File names are lowercase with hyphens and unique.

Full rules: [Style Guide](https://aprountzos.github.io/aion2f2pguide/contribute/style-guide).

## Questions

Open an issue and say where you got stuck. Beginner questions are welcome.
