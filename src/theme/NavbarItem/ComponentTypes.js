import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import ProfileChip from '@site/src/components/ProfileChip';

// Adds the navbar item type "custom-profile" (the "Elyos · 23" chip), used in docusaurus.config.js.
export default {
  ...ComponentTypes,
  'custom-profile': ProfileChip,
};
