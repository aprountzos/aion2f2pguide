import {useSyncExternalStore} from 'react';
import {store} from './inline';

// Ticks of the checklists, remembered in this browser (localStorage).
//   key    = page + text of the item, so reordering a list keeps the ticks
//   period = which daily / weekly period the tick belongs to (0 for lists that never reset),
//            so a tick from last week is simply not counted this week.

const KEY = 'aion2.checks';
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const WEEK = 7 * DAY;
const DAY_INDEX = {Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6};

let state = {};
let loaded = false;
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

function read() {
  try {
    const v = JSON.parse(store.get(KEY) || '{}');
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

function getSnapshot() {
  if (!loaded) {
    state = read();
    loaded = true;
  }
  return state;
}
const getServerSnapshot = () => EMPTY;
const EMPTY = {};

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (e) => {
    if (e.key === KEY || e.key === null) {
      state = read();
      emit();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function commit(next) {
  state = next;
  store.set(KEY, JSON.stringify(state));
  emit();
}

export const useChecks = () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export function setTick(key, period, on) {
  const next = {...getSnapshot()};
  if (on) next[key] = period;
  else delete next[key];
  commit(next);
}

/** Remove every tick whose key starts with the prefix (one checklist). */
export function clearTicks(prefix) {
  const next = {};
  for (const [k, v] of Object.entries(getSnapshot())) if (!k.startsWith(prefix)) next[k] = v;
  commit(next);
}

export const isTicked = (checks, key, period) => checks[key] !== undefined && checks[key] === period;

/** Short stable id for a text (the checklist item). */
export function hashText(text) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/**
 * The reset schedule is known only when hour and utc_offset are both set in data/resets.yml.
 * Returns {known, period, next} for kind "daily" | "weekly" (period changes at every reset).
 */
export function periodFor(kind, resets, now = Date.now()) {
  const r = resets && resets[kind];
  if (!r || r.hour === null || r.hour === undefined || r.utc_offset === null || r.utc_offset === undefined) {
    return {known: false, period: 0, next: null};
  }
  const len = kind === 'daily' ? DAY : WEEK;
  // a reset instant, in UTC milliseconds since 1970-01-01 (a Thursday)
  let anchor = (r.hour - r.utc_offset) * HOUR;
  if (kind === 'weekly') anchor += ((DAY_INDEX[r.day] - 4 + 7) % 7) * DAY;
  const period = Math.floor((now - anchor) / len);
  return {known: true, period: period + 1, next: new Date(anchor + (period + 1) * len)};
}
