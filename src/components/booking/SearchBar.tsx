"use client";

import { useEffect, useRef } from "react";
import { fmtRange, guestsText, nightsBetween, useBooking, useEscape, type Seg } from "@/lib/booking";
import { whereLabel } from "@/content/site";
import { IconSearch } from "@/components/ui/Icons";
import { Calendar } from "./Calendar";
import { StylePicker, WhereList, WhoPicker } from "./SearchParts";

/**
 * The desktop booking bar: Where · When · Who · Style → Search.
 *
 * `dir="up"` opens the popovers above the bar — the hero pins the bar to its
 * bottom edge, where a popover opening downward would fall below the fold.
 */
export function SearchBar({ dir = "down" }: { dir?: "up" | "down" }) {
  const b = useBooking();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!b.seg) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) b.setSeg(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [b]);
  useEscape(!!b.seg, () => b.setSeg(null));

  const toggle = (s: Seg) => b.setSeg(b.seg === s ? null : s);
  const nights = nightsBetween(b.start, b.end);
  const place = dir === "up" ? "bottom-full mb-3" : "top-full mt-3";
  const popCls = `pop absolute ${place} z-30 max-h-[min(520px,62vh)] overflow-y-auto overscroll-contain rounded-[28px] bg-white p-6 shadow-l`;

  const segs: { key: Exclude<Seg, null>; label: string; value: string; empty: string; grow: string }[] = [
    { key: "where", label: "Where", value: whereLabel(b.where), empty: "Search destinations", grow: "flex-[1.35]" },
    { key: "when", label: "When", value: fmtRange(b.start, b.end), empty: "Add dates", grow: "flex-1" },
    { key: "who", label: "Who", value: guestsText(b.guests), empty: "Add girls", grow: "flex-1" },
    { key: "style", label: "Style", value: b.style, empty: "Any style", grow: "flex-1" },
  ];

  return (
    <div ref={ref} className="relative hidden md:block">
      <div
        role="search"
        className={`flex h-[74px] items-center rounded-full p-1.5 shadow-l transition-colors ${b.seg ? "bg-sand" : "bg-white"}`}
      >
        {segs.map((s, i) => (
          <div key={s.key} className={`relative flex h-full min-w-0 items-center ${s.grow}`}>
            {i > 0 && (
              <span
                aria-hidden
                className={`h-8 w-px flex-none bg-rule transition-opacity ${
                  b.seg === s.key || b.seg === segs[i - 1].key ? "opacity-0" : ""
                }`}
              />
            )}
            <button
              type="button"
              className="seg w-full"
              data-open={b.seg === s.key}
              aria-expanded={b.seg === s.key}
              onClick={() => toggle(s.key)}
            >
              <span className="seg-label">{s.label}</span>
              <span className="seg-value" data-empty={!s.value}>
                {s.value || s.empty}
              </span>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={b.goToResults}
          className="btn btn-ink ml-1 h-[60px] flex-none px-6"
          aria-label="Search getaways"
        >
          <IconSearch size={18} />
          <span className="hidden lg:inline">Search</span>
        </button>
      </div>

      {b.seg === "where" && (
        <div className={`${popCls} left-0 w-[min(780px,100%)]`}>
          <WhereList onPick={() => b.setSeg("when")} />
        </div>
      )}

      {b.seg === "when" && (
        <div className={`${popCls} left-1/2 w-[min(720px,100%)] -translate-x-1/2`}>
          <Calendar start={b.start} end={b.end} onChange={b.setDates} months={2} />
          <div className="mt-5 flex items-center justify-between border-t border-rule pt-4">
            <p className="text-[13.5px] text-ink-2">
              {nights ? `${nights} night${nights > 1 ? "s" : ""} · ${fmtRange(b.start, b.end)}` : "Most getaways run Friday to Sunday"}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" className="link-u text-[13px] text-ink" onClick={() => b.setDates(null, null)}>
                Clear
              </button>
              <button type="button" className="btn btn-ink btn-sm ml-3" onClick={() => b.setSeg("who")}>
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {b.seg === "who" && (
        <div className={`${popCls} right-[22%] w-[400px]`}>
          <WhoPicker />
        </div>
      )}

      {b.seg === "style" && (
        <div className={`${popCls} right-0 w-[440px]`}>
          <StylePicker onPick={b.goToResults} />
        </div>
      )}
    </div>
  );
}
