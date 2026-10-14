import classes from '@site/src/generated/classes.json';
import templates from '@site/src/generated/templates.json';

// Helpers for the class widgets (ClassIndex, ClassPage, ClassGuides, GuideTemplate).

export const allClasses = () => (Array.isArray(classes) ? classes : []);
export const findClass = (id) => allClasses().find((c) => c.id === id) || null;

const pad = (n) => String(n).padStart(2, '0');
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** The guide template (templates/class-guide.md) with the class name and date filled in. */
export const templateFor = (cls, date = today()) =>
  String(templates.classGuide || '')
    .replaceAll('{{DATE}}', date)
    .replaceAll('{{CLASS}}', cls ? cls.name : '{{CLASS}}');

/** GitHub page for a new file with the template already in it (people without write access get a fork and a pull request). */
export function newGuideUrl({repoUrl, editBranch}, cls) {
  const filename = `docs/11-classes/${cls.id}/my-guide.md`;
  return `${repoUrl}/new/${editBranch}?filename=${encodeURIComponent(filename)}&value=${encodeURIComponent(templateFor(cls))}`;
}

export const CONTRIBUTE_PATH = '/contribute/write-a-class-guide';
