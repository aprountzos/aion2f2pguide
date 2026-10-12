---
updated: 2026-10-12
sidebar_position: 10
comments: false
staleness: false
corrections: false
---
# Add an Item

The [Item Database](../09-reference/item-database.mdx) is filled from one file, `data/items.yml`. An item is one entry in that file. You do not need to write any code.

:::tip[Only add what you can source]
Every entry needs a **source link** and the **date you checked it**. If you do not know a value (the grade, the level), leave the line out instead of guessing. An unknown value shows as a dash.
:::

## Steps
1. Open `data/items.yml` on GitHub and click the pencil (**Edit**). Or edit the file on your computer, see [Make Your First Pull Request](./make-your-first-pull-request.md).
2. Copy an existing entry at the end of the file and change it. Keep a blank line between entries.
3. Run `npm run check` (computer) or wait for the automatic checks (browser). The check tells you the line of any mistake.
4. Open the pull request against `dev`. A bot comment shows what your change touches.

## An entry
```yaml
- id: strong-leather
  name: Strong Leather
  category: material
  type: Leather
  obtain: "Armorsmithing: 2 Raw Leather make 1 Strong Leather."
  use: "Base material for armor."
  pages: [Strong Leather Crafting]
  ref: https://wikily.gg/aion-2/crafting
  checked: "2026-10-10"
```

## The fields
| Field | Required | What to write |
| --- | --- | --- |
| `id` | yes | Lowercase letters, digits and hyphens. Unique. It is also the link to the row (`#strong-leather`) |
| `name` | yes | The item name exactly as in game |
| `category` | yes | `material`, `consumable`, `currency` or `equipment` |
| `obtain` / `use` | one of them | Where it comes from, what it is for. One or two short sentences. `**bold**` works |
| `ref` | yes | An `https://` link to your source |
| `checked` | yes | The day you checked it, in quotes: `"2026-10-10"` |
| `type` | no | Free text such as `Ore`, `Herb`, `Gloves`. The Type filter lists what is used |
| `grade` | no | `Common`, `Rare`, `Epic`, `Unique`, `Hero` or `Special` |
| `level` | no | The level needed to use or gather it (whole number) |
| `itemLevel` | no | The item level, for equipment |
| `faction` | no | `asmodian` or `elyos`. Leave out when both can use it |
| `tradable` | no | `true` or `false` |
| `note` | no | One short extra line under the name |
| `pages` | no | Guide pages to link to, by file name, like `[Raw Leather]` |

## Rules
- Facts only (names, numbers, levels). Do not copy descriptions or whole tables from other sites, and do not import a full item list from a database site: their lists are their own work.
- Item names are unique. If the item exists, edit its entry instead.
- Prices change every day and are not stored here.

Back to [How to Contribute](./how-to-contribute.md)
