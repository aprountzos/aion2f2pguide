import {overlaps, parseLevels} from './inline';

// The level / faction lookup shared by <LevelFinder /> and the home page (the visitor's choice itself
// lives in ./profile.js). Pure function: give it the
// generated data (src/generated/data.json), a faction id and a level; get back what is near that level.

export const GATHER_FROM = 10; // gathering starts at level 10
export const LEATHER_FROM = 15; // Raw Leather is usable from level 15
export const CAP = 45;

export const FACTIONS = [
  {id: 'elyos', name: 'Elyos', land: 'Verteron'},
  {id: 'asmodian', name: 'Asmodian', land: 'Altgard'},
];

export function computeFinder(data, faction, level) {
  const zones = (data.zones[faction] || []).map((z) => ({...z, range: parseLevels(z.levels)}));
  const nodesByZone = new Map((data.nodes[faction] || []).map((n) => [n.zone, n]));
  const withNodes = (z) => ({...z, nodes: nodesByZone.get(z.name)});

  const narrow = zones.filter((z) => z.range && z.range[1] - z.range[0] < 20);
  const wide = zones.filter((z) => z.range && z.range[1] - z.range[0] >= 20);
  const here = narrow.filter((z) => overlaps(z.range, level, level)).map(withNodes);
  const near = narrow
    .filter((z) => !overlaps(z.range, level, level) && overlaps(z.range, level - 4, level + 4))
    .map(withNodes);

  // gathering: best zone per node type among zones within 5 levels
  const best = {};
  for (const z of narrow.filter((z) => overlaps(z.range, level - 5, level + 5)).map(withNodes)) {
    for (const [type, count] of Object.entries((z.nodes && z.nodes.nodes) || {})) {
      if (count === null) {
        if (!best[type]) best[type] = {zone: z.name, count: null, levels: z.levels};
      } else if (!best[type] || best[type].count === null || count > best[type].count) {
        best[type] = {zone: z.name, count, levels: z.levels};
      }
    }
  }

  const leather = (data.leather[faction] || []).map((r) => ({...r, range: parseLevels(r.level)}));
  const leatherNear = leather.filter((r) => overlaps(r.range, level - 10, level + 10));
  const leatherUnknown = leather.filter((r) => !r.range);

  const miles = data.milestones.map((m) => ({...m, nums: (m.level.match(/\d+/g) || []).map(Number)}));
  const reached = miles.filter((m) => Math.min(...m.nums) <= level);
  const recent = reached.slice(-3);
  const next = miles.filter((m) => Math.min(...m.nums) > level).slice(0, 2);

  return {here, near, wide, best, leatherNear, leatherUnknown, recent, next};
}
