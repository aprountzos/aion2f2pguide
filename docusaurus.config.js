// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';
import {meta} from './scripts/site-meta.mjs';

// Repo, URL and baseUrl come from site.config.json (and GITHUB_REPOSITORY on GitHub Actions).
// See scripts/site-meta.mjs and MAINTAINING.md.

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: meta.siteTitle,
  tagline: meta.tagline,
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: meta.url,
  baseUrl: meta.baseUrl,
  trailingSlash: false, // recommended for GitHub Pages

  organizationName: meta.owner,
  projectName: meta.repo,

  customFields: {
    giscus: meta.giscus,
    repoUrl: meta.repoUrl,
    editBranch: meta.editBranch,
    version: meta.version,
    dataChecked: meta.dataChecked,
  },

  onBrokenLinks: 'throw',

  markdown: {
    // .md pages are plain CommonMark (< and { need no escaping). Pages that use components are .mdx
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/', // docs-only site, no /docs prefix
          sidebarPath: './sidebars.js',
          // The home page (docs/index.mdx) is a full-width landing page: keep it out of the sidebar
          // (and out of the previous/next links of the pages around it).
          async sidebarItemsGenerator({defaultSidebarItemsGenerator, ...args}) {
            const items = await defaultSidebarItemsGenerator(args);
            return items.filter((item) => !(item.type === 'doc' && item.id === 'index'));
          },
          // "Edit this page" opens the page (docs/...) on the dev branch, where pull requests go.
          editUrl: `${meta.repoUrl}/edit/${meta.editBranch}/`,
          // who changed a page last (from git; needs the full history, so only when .git exists)
          showLastUpdateTime: meta.hasGit,
          showLastUpdateAuthor: meta.hasGit,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      /** @type {import('@easyops-cn/docusaurus-search-local').PluginOptions} */
      ({
        hashed: true,
        docsRouteBasePath: '/',
        indexBlog: false,
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.png',
      colorMode: {
        defaultMode: 'dark',
        respectPrefersColorScheme: true,
      },
      docs: {
        sidebar: {
          autoCollapseCategories: true,
        },
      },
      navbar: {
        title: meta.siteTitle,
        logo: {
          alt: meta.siteTitle,
          src: 'img/logo.svg',
          srcDark: 'img/logo-dark.svg',
        },
        items: [
          {to: '/leveling/level-finder', label: 'Level Finder', position: 'left'},
          {to: '/gathering/gathering-by-level', label: 'Gathering', position: 'left'},
          {to: '/leather/leather-farming-by-level', label: 'Leather', position: 'left'},
          {to: '/reference/item-database', label: 'Items', position: 'left'},
          {to: '/questions', label: 'Questions', position: 'left'},
          {type: 'custom-profile', position: 'right'},
          {to: '/contribute', label: 'Contribute', position: 'right'},
          {href: meta.repoUrl, label: 'GitHub', position: 'right'},
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Guide',
            items: [
              {label: 'Level Finder', to: '/leveling/level-finder'},
              {label: 'Daily and weekly checklist', to: '/basics/daily-and-weekly-checklist'},
              {label: 'Classes', to: '/classes/overview'},
              {label: 'Sources', to: '/reference/sources'},
            ],
          },
          {
            title: 'Contribute',
            items: [
              {label: 'How to contribute', to: '/contribute'},
              {label: 'Report an error', href: `${meta.repoUrl}/issues/new?template=data-correction.yml`},
              {label: 'Write a class guide', to: '/contribute/write-a-class-guide'},
              {label: 'Help Wanted', to: '/contribute/help-wanted'},
            ],
          },
          {
            title: 'Project',
            items: [
              {label: 'Changelog', to: '/changelog'},
              {label: `Version ${meta.version}, data checked ${meta.dataChecked}`, to: '/changelog'},
              {label: 'GitHub', href: meta.repoUrl},
              {label: 'License and credits', to: '/contribute/license-and-credits'},
              {label: 'Code of Conduct', href: `${meta.repoUrl}/blob/${meta.branch}/CODE_OF_CONDUCT.md`},
            ],
          },
        ],
        copyright:
          `Unofficial fan guide, not affiliated with NCSOFT. Guide text under CC BY 4.0. ` +
          `Data comes from community sources, so confirm important numbers in game. ` +
          `Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
