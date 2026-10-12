// Small helpers for semantic versions and CHANGELOG.md, shared by release.mjs and check-release.mjs.

export const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

export function parseSemver(v) {
  const m = SEMVER.exec(String(v).trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

export function compareSemver(a, b) {
  const x = parseSemver(a);
  const y = parseSemver(b);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  return 0;
}

export function bump(version, kind) {
  const [maj, min, pat] = parseSemver(version);
  if (kind === 'major') return `${maj + 1}.0.0`;
  if (kind === 'minor') return `${maj}.${min + 1}.0`;
  if (kind === 'patch') return `${maj}.${min}.${pat + 1}`;
  return null;
}

const HEADING = /^## \[([^\]]+)\](?:\s*-\s*(\d{4}-\d{2}-\d{2}))?\s*$/;
const REF_LINE = /^\[[^\]]+\]:\s*\S+/;

/** Returns {start, end, version, date, body} for one "## [x]" section, or null. end is exclusive. */
export function findSection(lines, version) {
  const start = lines.findIndex((l) => {
    const m = HEADING.exec(l);
    return m && m[1].toLowerCase() === version.toLowerCase();
  });
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      end = i;
      break;
    }
  }
  const m = HEADING.exec(lines[start]);
  // reference definitions ("[1.0.0]: https://...") at the very end are not part of the section body
  const body = lines
    .slice(start + 1, end)
    .filter((l) => !REF_LINE.test(l))
    .join('\n')
    .trim();
  return {start, end, version: m[1], date: m[2] || null, body};
}
