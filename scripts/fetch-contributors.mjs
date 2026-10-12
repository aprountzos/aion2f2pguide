// Fetches the contributors of the repository from GitHub into src/generated/contributors.json.
// Used by the Contributors page. Never fails the build: when GitHub cannot be reached (offline,
// rate limit, private repository) the file stays as it is, or becomes an empty list.
//
//   node scripts/fetch-contributors.mjs
// In GitHub Actions the workflow passes GITHUB_TOKEN so the request is not rate limited.

import fs from 'node:fs';
import path from 'node:path';
import {meta, root} from './site-meta.mjs';

const file = path.join(root, 'src', 'generated', 'contributors.json');
fs.mkdirSync(path.dirname(file), {recursive: true});
if (!fs.existsSync(file)) fs.writeFileSync(file, '[]\n');

if (process.env.SKIP_CONTRIBUTORS === '1') process.exit(0);
if (/your-github-username/.test(meta.owner)) {
  console.log('contributors: repository not set up yet, skipped');
  process.exit(0);
}

try {
  const headers = {Accept: 'application/vnd.github+json', 'User-Agent': 'aion2-guide-build'};
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${meta.owner}/${meta.repo}/contributors?per_page=100`, {
    headers,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
  const list = (await res.json())
    .filter((c) => c.type === 'User' && !/\[bot\]$/.test(c.login))
    .map((c) => ({login: c.login, url: c.html_url, avatar: `${c.avatar_url}${c.avatar_url.includes('?') ? '&' : '?'}s=128`, contributions: c.contributions}));
  fs.writeFileSync(file, JSON.stringify(list, null, 2) + '\n');
  console.log(`contributors: ${list.length} fetched`);
} catch (e) {
  console.log(`contributors: not updated (${e.message})`);
}
