import {useSyncExternalStore} from 'react';
import {CAP, FACTIONS} from './finder';
import {store} from './inline';

// "My level and faction": chosen once (home page, Level Finder, a table, or the chip in the navbar) and
// remembered in this browser (localStorage), so every widget can start from it.
//
//   const {faction, level, hasFaction, hasLevel, set, clear} = useProfile();
//   set({level: 23});  set({faction: 'elyos'});  clear();
//
// `faction` and `level` always have a value to show (Elyos, 10 until the visitor chooses);
// `hasFaction` / `hasLevel` say whether the visitor really chose it. A widget should only filter or
// pre-fill when the matching `has...` is true.

const KEY = 'aion2.profile';
const DEFAULT = {faction: 'elyos', level: 10, hasFaction: false, hasLevel: false};

let state = DEFAULT;
let loaded = false;
const listeners = new Set();

const clampLevel = (v) => Math.max(1, Math.min(CAP, Math.round(Number(v)) || 1));

function read() {
  try {
    const saved = JSON.parse(store.get(KEY) || 'null') || {};
    const hasFaction = FACTIONS.some((f) => f.id === saved.faction);
    const hasLevel = Number.isInteger(saved.level) && saved.level >= 1 && saved.level <= CAP;
    return {
      faction: hasFaction ? saved.faction : DEFAULT.faction,
      level: hasLevel ? saved.level : DEFAULT.level,
      hasFaction,
      hasLevel,
    };
  } catch {
    return DEFAULT;
  }
}

function write() {
  const saved = {};
  if (state.hasFaction) saved.faction = state.faction;
  if (state.hasLevel) saved.level = state.level;
  store.set(KEY, Object.keys(saved).length ? JSON.stringify(saved) : '');
}

const emit = () => listeners.forEach((l) => l());

function getSnapshot() {
  if (!loaded) {
    state = read();
    loaded = true;
  }
  return state;
}

const getServerSnapshot = () => DEFAULT;

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (e) => {
    if (e.key === KEY || e.key === null) {
      state = read();
      emit();
    }
  };
  window.addEventListener('storage', onStorage); // another tab changed it
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function setProfile(patch) {
  const cur = getSnapshot();
  const next = {...cur};
  if (patch.faction !== undefined && FACTIONS.some((f) => f.id === patch.faction)) {
    next.faction = patch.faction;
    next.hasFaction = true;
  }
  if (patch.level !== undefined) {
    next.level = clampLevel(patch.level);
    next.hasLevel = true;
  }
  state = next;
  write();
  emit();
}

export function clearProfile() {
  state = DEFAULT;
  write();
  emit();
}

export function useProfile() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {...s, set: setProfile, clear: clearProfile};
}
