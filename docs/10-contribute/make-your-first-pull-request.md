---
updated: 2026-10-10
sidebar_position: 2
comments: false
staleness: false
corrections: false
---
# Make Your First Pull Request

A **pull request** (PR) is a proposal to change the guide. You edit a copy, GitHub shows the maintainers exactly what you changed, and they merge it if it looks good. There are two ways to do it.

:::note[Everything goes into the `dev` branch]
New work is collected on `dev` and published together as a numbered version. The **Edit this page** link already sends you there. If you work on your computer, branch from `dev` and open the PR against `dev`. See [Branches and Versions](./branches-and-versions.md).
:::

- **Path A: in your browser.** Best for fixing a number, a typo or one table. No software needed.
- **Path B: on your computer.** Best for several edits, new pages, or checking how the site looks before you submit.

## Path A: edit in the browser

1. Sign in to GitHub.
2. Open the page you want to fix on this site and click **Edit this page** at the bottom. It opens the source file on GitHub.
3. GitHub says you do not have write access and will **fork** the repository for you. A fork is your personal copy. Click the green button to continue.
4. Make your change in the editor. Use the **Preview** tab to check it. Keep the table columns lined up and leave the top of the file (the `---` block) alone, except for `updated:`, which you set to today's date if you verified the page's data.
5. Click **Commit changes...** (top right).
6. Write a short commit message, for example `data: fix Basfelt Ruins Ruby count`. See [commit messages](#commit-messages) below.
7. Choose **Create a new branch** and click **Propose changes**.
8. On the next screen, click **Create pull request**. A form appears with a checklist. Fill it in: what you changed, and **where the information comes from**.
9. Click **Create pull request** again. Done.

Now wait. Within a minute the automatic checks run at the bottom of your PR. A green tick means the content is valid. A red cross means something needs fixing: click **Details** to see which line. A bot also posts a comment on the PR, a **content report** that lists the pages and data rows you changed, the pages that show that data, and any problem with its file and line number. Pull requests from a fork get the same report in the **Summary** of the check instead of a comment.

To change your PR after review comments, open the **Files changed** tab, click the three dots on the file, choose **Edit file**, and commit to the same branch. The PR updates by itself.

## Path B: on your computer

### One-time setup
You need a [GitHub](https://github.com) account, [Git](https://git-scm.com/downloads) and [Node.js](https://nodejs.org) version 20 or newer (22 recommended).

1. **Fork** the repository: open https://github.com/aprountzos/aion2f2pguide and click **Fork** (top right), then **Create fork**.
2. **Clone** your fork (replace `<your-username>` with your GitHub name):
   ```bash
   git clone https://github.com/<your-username>/aion2f2pguide.git
   cd aion2f2pguide
   ```
3. Tell Git where the original repository is, so you can stay up to date:
   ```bash
   git remote add upstream https://github.com/aprountzos/aion2f2pguide.git
   ```
4. Install the dependencies:
   ```bash
   npm install
   ```

### For every change
1. Start from the latest version and make a branch with a short descriptive name:
   ```bash
   git fetch upstream
   git switch -c data/basfelt-ruby-count upstream/dev
   ```
2. Start the live preview. It opens at [http://localhost:3000](http://localhost:3000) and updates when you save:
   ```bash
   npm start
   ```
3. Edit the pages in the `docs/` folder with any text editor (VS Code is a good choice). The numbers behind the big tables are in `data/`: after changing them run `npm run data`.
4. Check your work. This runs the content lint and a full build that fails on any broken link:
   ```bash
   npm run check
   ```
   To see the same content report the bot will post (changed pages and data rows, problems), commit your work and run `npm run pr-report -- --base upstream/dev`.
5. Commit and push:
   ```bash
   git add docs data
   git commit -m "data: fix Basfelt Ruins Ruby count"
   git push -u origin data/basfelt-ruby-count
   ```
6. Open your fork on GitHub. A yellow banner offers **Compare & pull request**. Click it and check that the **base** branch says `dev`, fill in the form, and submit.

Branch names are `<kind>/<short-name>`, using the same kinds as the commit prefixes below: `data/`, `add/` or `feature/` (new pages and sections), `fix/`, `docs/`. The name is only a label for you and the reviewers.

### Staying in sync
If the maintainers merged other changes while your PR was open:
```bash
git fetch upstream
git rebase upstream/dev
git push --force-with-lease
```

## Commit messages
Short, in the imperative, with a prefix that says what kind of change it is:

| Prefix | Use for | Example |
| --- | --- | --- |
| `data:` | A number, level, location or rate | `data: Raw Leather rate for Giant Ore Insectoid` |
| `add:` | A new page or section | `add: Diamond node page` |
| `fix:` | A typo, broken link or formatting | `fix: broken link in Level Finder` |
| `docs:` | The contribution docs, README, workflows | `docs: clarify fork steps` |
| `feat:` | A new feature of the website itself | `feat: add a node count calculator` |

The pull request title follows the same pattern, because it becomes the line in the Changelog page when the change is released.

## What the reviewers look at
- Does it cite a source or say it was checked in game and on which date?
- Are the numbers exact and the level ranges written like `10–14`?
- Did `updated:` change on pages whose data you re-verified?
- One topic per PR, and nothing copied from other sites.

## Common problems
| Problem | Fix |
| --- | --- |
| Check fails with `broken link` | A link such as `[Raw Leather](./raw-leather.md)` points to a file that does not exist, or has the wrong extension (`.md` or `.mdx`). The error shows the folder it looked in |
| Check fails with `table row has N columns` | A row has more or fewer cells than the header row |
| Check fails with `file name ... is also used` | Two pages share a file name. Rename one |
| `npm start` says port 3000 is in use | Close the other server or run `npm start -- --port 3001` |
| Git says `rejected (non-fast-forward)` | Run the steps under *Staying in sync* |
| The checks say the PR must come from dev | You opened it against `main`. Click **Edit** next to the PR title and change the base branch to `dev` |
| Check fails with `generated block out of date` | You changed `data/*.yml` (or the Patch History page). Run `npm run data` and commit the result |

Stuck? Open an issue and describe where you got to. Nobody minds beginner questions.

Back to [How to Contribute](./how-to-contribute.md)
