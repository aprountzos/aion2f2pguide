---
updated: 2026-10-12
description: "Answer a question from the Questions page."
sidebar_position: 11
comments: false
staleness: false
corrections: false
---
# Answer a Question

Visitors ask questions in the discussion at the bottom of the [Questions](../questions.mdx) page. Anyone with a GitHub account can answer by replying under a question. That is the quickest way to help.

## Add a checked answer to the list
Good answers can also be added to the list at the top of the Questions page, so the next player finds them without asking. That list is one file, `data/questions.yml`.

1. Open `data/questions.yml` and click the pencil (**Edit**).
2. Copy an entry, put your new one **at the top** (the list goes newest first) and change it.
3. Open the pull request against `dev`.

```yaml
- id: where-is-the-best-ore
  date: "2026-10-12"
  question: Where is the best place for Orichalcum ore?
  tags: [gathering]
  answer: |
    **Dredgion Crash Site** has 180 Orichalcum nodes.

    The nearest waypoint is Quai Campsite, about 80 m away.
  pages: [Ore Orichalcum]
```

| Field | Required | What to write |
| --- | --- | --- |
| `id` | yes | Lowercase letters, digits and hyphens. Unique. It is the link to the answer (`/questions#where-is-the-best-ore`) |
| `date` | yes | The day the answer was written or checked, in quotes |
| `question` | yes | The question, ending with `?` |
| `answer` | yes | The answer. A blank line starts a new paragraph. A list is lines starting with `1.` or `-`. `**bold**` and `[text](https://link)` work |
| `tags` | yes | One or more of `leveling`, `gathering`, `leather`, `crafting`, `gear`, `economy`, `general` |
| `pages` | no | Guide pages for "Read more", by file name |
| `by` | no | Your name or `@github-name` |

## Rules
- Answer from the guide's data or from the game, and say which patch if it matters. If the answer is a number, the number must also be on its page.
- Keep it short. A long answer belongs on a guide page, and the answer links to it.
- Nobody's personal information in questions or answers.

Back to [How to Contribute](./how-to-contribute.md)
