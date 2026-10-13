import React, {createContext, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {useLocation} from '@docusaurus/router';
import data from '@site/src/generated/data.json';
import {clearTicks, periodFor, useChecks} from '../checks';
import styles from './styles.module.css';

// <Checklist reset="daily"> ... a markdown task list ... </Checklist>
//
//   reset="manual" (default)  the ticks stay until the visitor presses "Clear ticks"
//   reset="daily" / "weekly"  they also clear by themselves at the next reset, when the reset time is
//                             known (data/resets.yml). Until then it behaves like "manual".
//   id                        only needed when one page has several checklists with the same items
//
// A task list on its own (without this wrapper) also keeps its ticks, see ./TaskItem.js.

export const ChecklistContext = createContext(null);
export const useChecklist = () => useContext(ChecklistContext);

const weekdayHint = (kind) => {
  const r = data.resets && data.resets[kind];
  return kind === 'weekly' && r ? `${r.day} ${String(r.hour).padStart(2, '0')}:00 server time` : 'the daily reset';
};

export default function Checklist({reset = 'manual', id = '', children}) {
  const {pathname} = useLocation();
  const [now, setNow] = useState(null); // set in the browser: the build time is not "now"
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const auto = reset === 'daily' || reset === 'weekly';
  const sched = useMemo(
    () => (auto && now !== null ? periodFor(reset, data.resets, now) : {known: false, period: 0, next: null}),
    [auto, reset, now],
  );

  const root = useRef(null);
  const checks = useChecks();
  const [counts, setCounts] = useState({done: 0, total: 0});
  const scope = `${id || reset}`;
  const ctx = useMemo(() => ({scope, period: sched.period, prefix: null}), [scope, sched.period]);

  // progress: count the boxes (the items register their ticks through the shared store)
  useEffect(() => {
    if (!root.current) return;
    const boxes = root.current.querySelectorAll('input[type="checkbox"]');
    setCounts({done: [...boxes].filter((b) => b.checked).length, total: boxes.length});
  }, [checks, sched.period, children]);

  const onClear = () => {
    clearTicks(`${pathname}|${scope}|`);
  };

  return (
    <ChecklistContext.Provider value={ctx}>
      <div className={styles.box} ref={root}>
        <div className={styles.bar}>
          <span className={styles.progress}>
            {counts.total ? `${counts.done} of ${counts.total} done` : ' '}
          </span>
          <button type="button" className={styles.clear} onClick={onClear} disabled={counts.done === 0}>
            Clear ticks
          </button>
        </div>
        {children}
        {auto && (
          <p className={styles.note}>
            {sched.known
              ? `Ticks clear by themselves at ${weekdayHint(reset)}. Next reset: ${sched.next.toLocaleString(undefined, {weekday: 'short', hour: '2-digit', minute: '2-digit'})} your time.`
              : `Ticks do not clear by themselves yet: the reset time zone is not published. Use "Clear ticks" after the reset.`}
          </p>
        )}
      </div>
    </ChecklistContext.Provider>
  );
}
