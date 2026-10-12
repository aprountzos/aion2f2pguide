import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

// <SiteValue name="dataChecked" /> prints a value from site.config.json (the "data checked" date, the version...).
// It is a text-only component, so it can be used inside a sentence or in bold.
export default function SiteValue({name}) {
  const {siteConfig} = useDocusaurusContext();
  const values = {
    dataChecked: siteConfig.customFields.dataChecked,
    version: siteConfig.customFields.version,
    siteTitle: siteConfig.title,
  };
  return <>{values[name] ?? ''}</>;
}
