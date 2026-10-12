// Single source of truth for repo/site metadata. Used by docusaurus.config.js and the scripts.
//
// Values come from site.config.json. On GitHub Actions the repository name is taken from
// GITHUB_REPOSITORY, so a fork deploys correctly even if site.config.json was never edited.
//
// Optional overrides (environment variables):
//   SITE_URL   full site origin, e.g. https://guide.example.com
//   BASE_URL   path prefix, e.g. / or /my-repo/
// A file static/CNAME (custom domain) switches the site to that domain with baseUrl "/".

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const cfg = JSON.parse(fs.readFileSync(path.join(root, 'site.config.json'), 'utf8'));

const [envOwner, envRepo] = (process.env.GITHUB_REPOSITORY || '').split('/');
const owner = envOwner || cfg.owner;
const repo = envRepo || cfg.repo;
const inActions = process.env.GITHUB_ACTIONS === 'true';
const isUserSite = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;

let url = process.env.SITE_URL || cfg.siteUrl || `https://${owner.toLowerCase()}.github.io`;
let baseUrl =
  process.env.BASE_URL ?? cfg.baseUrl ?? (inActions && !isUserSite ? `/${repo}/` : '/');

const cnamePath = path.join(root, 'static', 'CNAME');
if (fs.existsSync(cnamePath)) {
  const domain = fs.readFileSync(cnamePath, 'utf8').trim();
  if (domain) {
    url = process.env.SITE_URL || `https://${domain}`;
    baseUrl = process.env.BASE_URL ?? '/';
  }
}

if (!baseUrl.startsWith('/')) baseUrl = '/' + baseUrl;
if (!baseUrl.endsWith('/')) baseUrl += '/';
url = url.replace(/\/+$/, '');

// Comments and reactions (giscus). Active only when switched on AND the two ids are filled in.
// repoId / categoryId are specific to one repository, so a fork must set its own (MAINTAINING.md).
const g = cfg.giscus || {};
const giscus = {
  enabled: Boolean(g.enabled && g.repoId && g.categoryId),
  repo: `${owner}/${repo}`,
  repoId: g.repoId || '',
  category: g.category || 'Comments',
  categoryId: g.categoryId || '',
};

export const meta = {
  hasGit: fs.existsSync(path.join(root, '.git')),
  owner,
  repo,
  branch: cfg.branch || 'main', // the live branch (deployed)
  editBranch: cfg.editBranch || 'dev', // where "Edit this page" sends contributors
  staleDays: Number.isInteger(cfg.staleDays) ? cfg.staleDays : 30,
  version: JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version,
  giscus,
  author: cfg.author,
  siteTitle: cfg.siteTitle,
  tagline: cfg.tagline,
  dataChecked: cfg.dataChecked,
  repoUrl: `https://github.com/${owner}/${repo}`,
  url,
  baseUrl,
  siteUrl: url + (baseUrl === '/' ? '' : baseUrl.replace(/\/$/, '')),
};
