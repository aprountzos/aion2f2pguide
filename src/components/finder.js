import {overlaps, parseLevels, store} from './inline';

// The level / faction lookup shared by <LevelFinder /> and the home page. Pure function: give it the
// generated data (src/generated/data.json), a faction id and a level; get back what is near that level.

export const GATHER_FROM = 10; // gathering starts at level 10
export const LEATHER_FROM = 15; // Raw Leather is usable from level 15
export const CAP = 45;
export const KEY = 'aion2.levelfinder'; // localStorage key, so both finders remember the same choice

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

/** The faction and level the visitor chose last time, or null. */
export function readSaved() {
  try {
    const saved = JSON.parse(store.get(KEY) || 'null');
    if (!saved) return null;
    const out = {};
    if (FACTIONS.some((f) => f.id === saved.faction)) out.faction = saved.faction;
    if (Number.isInteger(saved.level) && saved.level >= 1 && saved.level <= CAP) out.level = saved.level;
    return out;
  } catch {
    return null;
  }
}

export function saveChoice(faction, level) {
  store.set(KEY, JSON.stringify({faction, level}));
}
