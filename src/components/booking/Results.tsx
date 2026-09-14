"use client";

import { fmtRange, guestsText, useBooking, type Sort } from "@/lib/booking";
import { IconChevron, IconClose } from "@/components/ui/Icons";
import { live, STYLES, whereLabel } from "@/content/site";
import { PackageCard } from "./PackageCard";

export function Results() {
  const b = useBooking();

  const active = [
    b.where && { label: whereLabel(b.where), clear: () => b.setWhere("") },
    b.start && { label: fmtRange(b.start, b.end), clear: () => b.setDates(null, null) },
    b.guests && { label: guestsText(b.guests), clear: () => b.setGuests(0) },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  // Re-keys the grid so cards stagger in again whenever the filter changes.
  const sig = [b.where, b.style, b.guests, b.sort].join("|");

  return (
    <section id="getaways" className="sec bg-paper">
      <div className="ctr">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Book your getaway</p>
            <h2 className="h2 mt-3">
              Find your <em className="italic text-clay-deep">getaway</em>
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-[13.5px] text-ink-2" aria-live="polite">
              <span className="font-medium text-ink">{b.results.length}</span> getaway{b.results.length === 1 ? "" : "s"}
              {b.where && ` in ${whereLabel(b.where)}`}
            </p>
            <label className="relative">
              <span className="sr-only">Sort by</span>
              <select
                value={b.sort}
                onChange={(e) => b.setSort(e.target.value as Sort)}
                className="h-10 appearance-none rounded-full border border-rule-2 bg-white pl-4 pr-10 text-[13px] text-ink"
              >
                <option value="rec">Recommended</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>
              <IconChevron size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-2" />
            </label>
          </div>
        </div>

        <div className="-mx-5 mt-8 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:mx-0 md:px-0">
          {(["", ...STYLES] as const).map((s) => (
            <button key={s || "all"} type="button" className="chip" aria-pressed={b.style === s} onClick={() => b.setStyle(s)}>
              {s || "All getaways"}
            </button>
          ))}
        </div>

        {active.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {active.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={a.clear}
                className="inline-flex h-8 items-center gap-2 rounded-full bg-blush pl-3.5 pr-2.5 text-[12.5px] text-ink transition-colors hover:bg-clay-tint"
              >
                {a.label} <IconClose size={13} />
              </button>
            ))}
            <button type="button" onClick={b.reset} className="link-u ml-2 text-[12.5px] text-ink-2">
              Clear all
            </button>
          </div>
        )}

        {b.results.length ? (
          <div key={sig} className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {b.results.map((p, i) => (
              <div key={p.slug} className="load-in" style={{ "--d": `${Math.min(i, 8) * 55}ms` } as React.CSSProperties}>
                <PackageCard p={p} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-[28px] bg-blush px-6 py-16 text-center">
            <p className="eyebrow">Nothing matches — yet</p>
            <p className="serif mx-auto mt-3 max-w-[22ch] text-[34px] leading-[1.05] text-ink">
              We’ll design one around your girls
            </p>
            <p className="lede mx-auto mt-4 max-w-[48ch]">
              We create boutique trips all over Australia. Tell the GG team where, when and who — we’ll build and price it for you.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={b.reset} className="btn btn-line">
                Clear filters
              </button>
              <a href={live("/contact-us")} className="btn btn-ink">
                Ask the GG team
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
