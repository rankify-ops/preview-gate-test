"use client";

import { useBooking } from "@/lib/booking";
import { Photo } from "@/components/ui/Photo";
import { IconArrow, IconHeart, IconUsers } from "@/components/ui/Icons";
import { guestsLabel, placeLine, type Package } from "@/content/site";

export function PackageCard({ p }: { p: Package }) {
  const { wish, toggleWish, openQuick } = useBooking();
  const saved = wish.includes(p.slug);

  return (
    <article className="group">
      <div className="plate plate-zoom aspect-[10/11] rounded-[var(--r)]">
        <button type="button" onClick={() => openQuick(p.slug)} className="absolute inset-0 z-0" aria-label={`Quick view: ${p.title}`}>
          <Photo name={p.img} alt={p.venue ? `${p.title} at ${p.venue}` : p.title} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" />
        </button>
        <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/45 to-transparent" />

        {p.tag && (
          <span className="glass-dark pointer-events-none absolute left-4 top-4 rounded-full px-3 py-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white">
            {p.tag}
          </span>
        )}
        <button
          type="button"
          className="heart glass-dark absolute right-3 top-3"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${p.title} from saved` : `Save ${p.title}`}
          onClick={() => toggleWish(p.slug)}
        >
          <IconHeart size={19} />
        </button>

        <span className="pointer-events-none absolute bottom-4 left-4 right-4 flex translate-y-2 items-center justify-between opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="rounded-full bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">Quick view</span>
          <span className="grid size-9 place-items-center rounded-full bg-white text-ink">
            <IconArrow size={16} />
          </span>
        </span>
      </div>

      <div className="mt-4">
        <p className="eyebrow">{placeLine(p)}</p>
        <h3 className="serif mt-1.5 text-[27px] leading-[1.05]">
          <button type="button" onClick={() => openQuick(p.slug)} className="link-u text-left">
            {p.title}
          </button>
        </h3>
        {p.venue && <p className="mt-1 text-[13.5px] text-ink-3">{p.venue}</p>}
        <div className="mt-3.5 flex items-center justify-between border-t border-rule pt-3.5 text-[13px]">
          <span className="flex items-center gap-1.5 text-ink-2">
            <IconUsers size={15} /> {guestsLabel(p)}
          </span>
          {p.priceFrom ? (
            <span className="text-ink">
              <span className="text-ink-3">From </span>
              <span className="font-medium">${p.priceFrom}</span>
              <span className="text-ink-3"> pp</span>
            </span>
          ) : (
            <span className="text-ink-3">Price on request</span>
          )}
        </div>
      </div>
    </article>
  );
}
