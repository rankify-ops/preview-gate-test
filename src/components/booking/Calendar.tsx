"use client";

import { useState } from "react";
import { IconNext, IconPrev } from "@/components/ui/Icons";

const DOW = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const sod = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const same = (a: Date | null, b: Date | null) => !!a && !!b && a.getTime() === b.getTime();

/**
 * Date-range picker. First tap sets check-in, second sets check-out; tapping
 * on or before check-in starts again. While only check-in is set, hovering
 * previews the range so the nights are visible before committing.
 */
export function Calendar({
  start,
  end,
  onChange,
  months = 2,
}: {
  start: Date | null;
  end: Date | null;
  onChange: (s: Date | null, e: Date | null) => void;
  months?: 1 | 2;
}) {
  const today = sod(new Date());
  const [view, setView] = useState(() => {
    const b = start ?? today;
    return new Date(b.getFullYear(), b.getMonth(), 1);
  });
  const [hover, setHover] = useState<Date | null>(null);

  const atFirst = view.getFullYear() === today.getFullYear() && view.getMonth() === today.getMonth();
  const tail = end ?? (start && hover && hover > start ? hover : null);

  function pick(d: Date) {
    if (!start || end || d <= start) onChange(d, null);
    else onChange(start, d);
  }

  const shift = (n: number) => setView((v) => new Date(v.getFullYear(), v.getMonth() + n, 1));

  return (
    <div className="relative select-none" onMouseLeave={() => setHover(null)}>
      <button
        type="button"
        onClick={() => shift(-1)}
        disabled={atFirst}
        className="stepper absolute left-0 top-0 z-10"
        aria-label="Previous month"
      >
        <IconPrev size={16} />
      </button>
      <button type="button" onClick={() => shift(1)} className="stepper absolute right-0 top-0 z-10" aria-label="Next month">
        <IconNext size={16} />
      </button>

      <div className="grid gap-10" style={{ gridTemplateColumns: `repeat(${months}, minmax(0, 1fr))` }}>
        {Array.from({ length: months }, (_, k) => {
          const m = new Date(view.getFullYear(), view.getMonth() + k, 1);
          const offset = (m.getDay() + 6) % 7;
          const count = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
          return (
            <div key={k}>
              <p className="flex h-9 items-center justify-center text-[15px] font-medium text-ink">
                {MONTHS[m.getMonth()]} {m.getFullYear()}
              </p>
              <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-medium tracking-wider text-ink-3">
                {DOW.map((d) => (
                  <span key={d} className="py-1.5">
                    {d}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: offset }, (_, i) => (
                  <span key={`e${i}`} />
                ))}
                {Array.from({ length: count }, (_, i) => {
                  const d = new Date(m.getFullYear(), m.getMonth(), i + 1);
                  const inRange = !!(start && tail && d > start && d < tail);
                  const edge = same(d, start) ? (tail ? "start" : "solo") : same(d, tail) ? "end" : undefined;
                  return (
                    <button
                      key={i}
                      type="button"
                      className="cal-day"
                      disabled={d < today}
                      data-range={inRange ? "true" : undefined}
                      data-edge={edge}
                      aria-pressed={!!edge}
                      aria-label={d.toDateString()}
                      onClick={() => pick(d)}
                      onMouseEnter={() => setHover(d)}
                    >
                      <span>{i + 1}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
