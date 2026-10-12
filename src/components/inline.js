import React from 'react';

/** Renders the little bit of markdown that data cells use: **bold**. */
export function inline(text) {
  const parts = String(text ?? '').split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    /^\*\*[^*]+\*\*$/.test(p) ? <strong key={i}>{p.slice(2, -2)}</strong> : <React.Fragment key={i}>{p}</React.Fragment>,
  );
}

export const plain = (text) => String(text ?? '').replace(/\*\*/g, '');

/** "11–20" -> [11, 20]; "18" -> [18, 18]; anything else -> null */
export function parseLevels(text) {
  const m = /^\s*(\d+)\s*(?:[–-]\s*(\d+))?\s*$/.exec(plain(text));
  if (!m) return null;
  const a = Number(m[1]);
  const b = m[2] ? Number(m[2]) : a;
  return a <= b ? [a, b] : null;
}

export function overlaps(levels, lo, hi) {
  return Boolean(levels) && levels[0] <= hi && levels[1] >= lo;
}

/** localStorage that never throws (private windows, blocked storage). */
export const store = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
};
