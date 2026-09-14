"use client";

import { fmtRange, guestsText, useBooking } from "@/lib/booking";
import { IconSearch } from "@/components/ui/Icons";
import { whereLabel } from "@/content/site";

/** Phones: a floating search pill once the hero search has scrolled away. */
export function MobileBar() {
  const b = useBooking();
  const show = !b.heroVisible && !b.quick && !b.sheet;
  const summary = [whereLabel(b.where) || "Anywhere", fmtRange(b.start, b.end) || "Any week", guestsText(b.guests) || "Add girls"].join(" · ");

  return (
    <div
      className={`fixed inset-x-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-40 transition-all duration-500 md:hidden ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <button
        type="button"
        onClick={() => b.setSheet(true)}
        className="frost flex h-[60px] w-full items-center gap-3 rounded-full border border-rule pl-2 pr-5 text-left shadow-l"
        tabIndex={show ? 0 : -1}
      >
        <span className="grid size-11 flex-none place-items-center rounded-full bg-ink text-white">
          <IconSearch size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium text-ink">Where to, babe?</span>
          <span className="block truncate text-[12px] text-ink-3">{summary}</span>
        </span>
        <span className="text-[12px] tabular-nums text-ink-2">{b.results.length}</span>
      </button>
    </div>
  );
}
