"use client";

import { useRef } from "react";
import { useBooking } from "@/lib/booking";
import { Photo } from "@/components/ui/Photo";
import { IconArrow, IconNext, IconPrev } from "@/components/ui/Icons";
import { packagesIn, states } from "@/content/site";

export function Regions() {
  const b = useBooking();
  const rail = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => rail.current?.scrollBy({ left: d * 320, behavior: "smooth" });
  const go = (code: string) => {
    b.setWhere(`state:${code}`);
    b.goToResults();
  };

  return (
    <section className="sec overflow-hidden bg-sand">
      <div className="ctr flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Our regions</p>
          <h2 className="h2 mt-3 max-w-[16ch]">
            Where are the girls <em className="italic text-clay-deep">escaping</em> to?
          </h2>
        </div>
        <div className="hidden gap-2 md:flex">
          <button type="button" className="stepper size-12 bg-white" onClick={() => scroll(-1)} aria-label="Scroll regions left">
            <IconPrev size={18} />
          </button>
          <button type="button" className="stepper size-12 bg-white" onClick={() => scroll(1)} aria-label="Scroll regions right">
            <IconNext size={18} />
          </button>
        </div>
      </div>

      <div
        ref={rail}
        className="rail mt-10"
        // Align the first card with the container edge on wide screens.
        style={{ paddingInline: "max(20px, calc((100vw - 1280px) / 2 + 32px))", scrollPaddingInline: "max(20px, calc((100vw - 1280px) / 2 + 32px))" }}
      >
        {states.map((s) => {
          const n = packagesIn(`state:${s.code}`).length;
          return (
            <button key={s.code} type="button" onClick={() => go(s.code)} className="group w-[68vw] max-w-[290px] text-left sm:w-[270px]">
              <span className="plate plate-zoom relative block aspect-[3/4] rounded-[var(--r)]">
                {s.img ? (
                  <Photo name={s.img} alt={s.name} sizes="290px" />
                ) : (
                  // No banner on the live site for these two — set the name in the
                  // same white serif their state banners use.
                  <span className="grid size-full place-items-center bg-[linear-gradient(160deg,#efe2dc,#dcc3bb)]">
                    <span className="serif text-[64px] leading-none text-white">{s.short}</span>
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/40 to-transparent" />
                <span className="absolute inset-x-4 bottom-4 flex items-center justify-between text-white">
                  <span className="text-[12px] font-medium uppercase tracking-[0.16em]">{n ? `${n} getaway${n > 1 ? "s" : ""}` : "Tailor-made"}</span>
                  <span className="grid size-9 place-items-center rounded-full bg-white/90 text-ink transition-transform duration-500 group-hover:translate-x-0.5">
                    <IconArrow size={15} />
                  </span>
                </span>
              </span>
              <span className="mt-3 block text-[15px] text-ink">{s.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
