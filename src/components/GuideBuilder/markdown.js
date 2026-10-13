// Turns the guide builder form into the Markdown page of a class guide. Pure functions (no React),
// so the output can be tested on its own. The structure matches templates/class-guide.md.

export const PRIORITIES = ['Core', 'Useful', 'Optional'];

/** One line of plain text: no line breaks, no raw HTML. */
const oneLine = (s) =>
  String(s ?? '')
    .replace(/\s+/g, ' ')
    .replace(/</g, '&lt;')
    .trim();

/** A table cell: one line, and the pipe character escaped. */
const cell = (s) => oneLine(s).replace(/\|/g, '\\|');

/** Text area -> list of lines, without bullet marks and empty lines. */
export const lines = (s) =>
  String(s ?? '')
    .split(/\r?\n/)
    .map((l) => oneLine(l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '')))
    .filter(Boolean);

const yamlString = (s) => `"${oneLine(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

const bullets = (list) => list.map((l) => `- ${l}`).join('\n');

export const emptyForm = () => ({
  cls: '',
  summary: '',
  strengths: '',
  weaknesses: '',
  leveling: '',
  skills: [
    {name: '', does: '', level: '', priority: ''},
    {name: '', does: '', level: '', priority: ''},
    {name: '', does: '', level: '', priority: ''},
  ],
  stats: '',
  group: '',
  sources: '',
});

/** What is still missing before the guide can be sent. Returns a list of short sentences. */
export function problems(form) {
  const out = [];
  const summary = oneLine(form.summary);
  if (!summary) out.push('Write the one-sentence summary.');
  else if (summary.length > 200) out.push('Shorten the summary to one sentence (200 characters at most).');
  const skills = (form.skills || []).filter((s) => oneLine(s.name));
  const hasBody =
    lines(form.strengths).length ||
    lines(form.weaknesses).length ||
    lines(form.leveling).length ||
    skills.length ||
    lines(form.stats).length ||
    lines(form.group).length;
  if (!hasBody) out.push('Fill in at least one section (strengths, leveling, skills, stats or group).');
  if (!lines(form.sources).length) out.push('Add at least one source: a link with the date you checked it, or "tested in game on <date>".');
  return out;
}

/**
 * @param form   the form values (see emptyForm)
 * @param cls    the class from data/classes.yml: {id, name, role, weapon}
 * @param opts   {date: 'YYYY-MM-DD', position: number}
 */
export function buildMarkdown(form, cls, {date, position}) {
  const parts = [];
  parts.push(
    ['---', `updated: ${date}`, `description: ${yamlString(form.summary)}`, `sidebar_position: ${position}`, '---'].join('\n'),
  );
  parts.push(`# ${cls.name} Guide`);
  parts.push(oneLine(form.summary));
  const rows = [['Role', cls.role]];
  if (cls.weapon) rows.push(['Weapon', cls.weapon]);
  rows.push(['Checked on', date]);
  parts.push(['| | |', '| --- | --- |', ...rows.map(([k, v]) => `| ${k} | ${cell(v)} |`)].join('\n'));

  const strengths = lines(form.strengths);
  const weaknesses = lines(form.weaknesses);
  if (strengths.length || weaknesses.length) {
    const block = ['## Strengths and weaknesses'];
    if (strengths.length) block.push(`**Strengths**\n\n${bullets(strengths)}`);
    if (weaknesses.length) block.push(`**Weaknesses**\n\n${bullets(weaknesses)}`);
    parts.push(block.join('\n\n'));
  }
  const leveling = lines(form.leveling);
  if (leveling.length) parts.push(`## Leveling 1–45\n\n${bullets(leveling)}`);

  const skills = (form.skills || []).filter((s) => oneLine(s.name));
  if (skills.length) {
    parts.push(
      [
        '## Skills',
        '',
        '| Skill | What it does | Learned at level | Priority |',
        '| --- | --- | --- | --- |',
        ...skills.map((s) => `| ${cell(s.name)} | ${cell(s.does) || '-'} | ${cell(s.level) || '-'} | ${cell(s.priority) || '-'} |`),
      ].join('\n'),
    );
  }
  const stats = lines(form.stats);
  if (stats.length) parts.push(`## Stats and gear\n\n${bullets(stats)}`);
  const group = lines(form.group);
  if (group.length) parts.push(`## In a group\n\n${bullets(group)}`);
  parts.push(`## Sources\n\n${bullets(lines(form.sources))}`);
  parts.push('Back to [Classes](./overview.mdx)');
  return parts.join('\n\n') + '\n';
}
