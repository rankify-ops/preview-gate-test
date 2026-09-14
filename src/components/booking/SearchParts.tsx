"use client";

import { useState } from "react";
import { useBooking } from "@/lib/booking";
import { asset } from "@/lib/basePath";
import { IconMinus, IconPlus, IconSearch, IconSparkle } from "@/components/ui/Icons";
import { destinations, packagesIn, states, STYLES, type Style } from "@/content/site";

/*
 * The panels behind each search segment. Shared by the desktop bar's popovers
 * and the mobile search sheet, so the two can never drift apart.
 */

export const styleIcon: Record<Style, string> = {
  Hens: "ico-hens",
  Classic: "ico-city",
  Luxury: "ico-luxury",
  "Winter Wines": "ico-wine",
  "Girl's Day": "ico-pamper",
};

export function WhereList({ onPick }: { onPick?: () => void }) {
  const { where, setWhere } = useBooking();
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();

  const groups = states
    .map((s) => ({ s, ds: destinations.filter((d) => d.state === s.code && d.name.toLowerCase().includes(needle)) }))
    .filter((g) => !needle || g.ds.length || g.s.name.toLowerCase().includes(needle));

  const choose = (w: string) => {
    setWhere(w);
    onPick?.();
  };

  return (
    <div>
      <label className="relative block">
        <span className="sr-only">Search destinations</span>
        <IconSearch size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search destinations — try “Hunter”"
          className="field pl-11"
        />
      </label>

      <button
        type="button"
        onClick={() => choose("")}
        className="mt-3 flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors hover:bg-sand"
      >
        <span className="grid size-11 place-items-center rounded-xl bg-blush text-clay-ink">
          <IconSparkle size={18} />
        </span>
        <span>
          <span className="block text-[14.5px] text-ink">Anywhere</span>
          <span className="block text-[12.5px] text-ink-3">I’m flexible — show me everything</span>
        </span>
        {!where && <span className="ml-auto text-[11px] font-semibold uppercase tracking-[0.16em] text-clay-ink">Selected</span>}
      </button>

      <div className="mt-4 gap-6 sm:columns-2 lg:columns-3">
        {groups.map(({ s, ds }) => (
          <div key={s.code} className="mb-5 break-inside-avoid">
            <button
              type="button"
              onClick={() => choose(`state:${s.code}`)}
              className={`eyebrow flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-sand ${
                where === `state:${s.code}` ? "bg-blush" : ""
              }`}
            >
              {s.name}
              <span className="text-[10px] tracking-[0.12em] text-ink-3">All</span>
            </button>
            <ul className="mt-1">
              {ds.map((d) => {
                const n = packagesIn(d.slug).length;
                return (
                  <li key={d.slug}>
                    <button
                      type="button"
                      onClick={() => choose(d.slug)}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-[7px] text-left text-[14px] text-ink transition-colors hover:bg-sand ${
                        where === d.slug ? "bg-blush" : ""
                      }`}
                    >
                      {d.name}
                      {n > 0 && <span className="text-[12px] tabular-nums text-ink-3">{n}</span>}
                    </button>
                  </li>
                );
              })}
              {!ds.length && !needle && (
                <li className="px-2 py-1 text-[13px] text-ink-3">Tailor-made on request</li>
              )}
            </ul>
          </div>
        ))}
        {!groups.length && <p className="text-[14px] text-ink-3">No destinations match “{q}”.</p>}
      </div>
    </div>
  );
}

export function WhoPicker() {
  const { guests, setGuests } = useBooking();
  return (
    <div>
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="text-[15px] text-ink">Girls</p>
          <p className="text-[13px] text-ink-3">Including the birthday girl or bride</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="stepper"
            disabled={guests <= 0}
            onClick={() => setGuests(guests <= 2 ? 0 : guests - 1)}
            aria-label="Fewer girls"
          >
            <IconMinus size={16} />
          </button>
          <span className="w-7 text-center text-[17px] tabular-nums text-ink" aria-live="polite">
            {guests || "–"}
          </span>
          <button
            type="button"
            className="stepper"
            disabled={guests >= 40}
            onClick={() => setGuests(guests ? guests + 1 : 2)}
            aria-label="More girls"
          >
            <IconPlus size={16} />
          </button>
        </div>
      </div>
      <p className="eyebrow mt-6">Quick pick</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {[2, 4, 6, 8, 10, 12, 16, 20].map((n) => (
          <button key={n} type="button" className="chip min-w-12 justify-center" aria-pressed={guests === n} onClick={() => setGuests(n)}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StylePicker({ onPick }: { onPick?: () => void }) {
  const { style, setStyle } = useBooking();
  const opts: (Style | "")[] = ["", ...STYLES];
  return (
    <div className="grid grid-cols-2 gap-2">
      {opts.map((s) => {
        const on = style === s;
        return (
          <button
            key={s || "any"}
            type="button"
            aria-pressed={on}
            onClick={() => {
              setStyle(s);
              onPick?.();
            }}
            className={`flex items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors ${
              on ? "border-ink bg-sand" : "border-rule hover:border-rule-2 hover:bg-sand"
            }`}
          >
            <span className="grid size-11 flex-none place-items-center overflow-hidden rounded-full bg-clay text-white">
              {s ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset(`/img/${styleIcon[s]}.png`)} alt="" className="size-full" />
              ) : (
                <IconSparkle size={18} />
              )}
            </span>
            <span className="text-[14px] text-ink">{s || "Any style"}</span>
          </button>
        );
      })}
    </div>
  );
}
