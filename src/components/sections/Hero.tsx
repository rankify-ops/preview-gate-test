"use client";

import { useEffect, useRef, useState } from "react";
import { fmtRange, guestsText, useBooking } from "@/lib/booking";
import { Photo } from "@/components/ui/Photo";
import { IconArrow, IconSearch } from "@/components/ui/Icons";
import { SearchBar } from "@/components/booking/SearchBar";
import { heroSlides, packages, whereLabel } from "@/content/site";

const slides = heroSlides.map((s) => packages.find((p) => p.slug === s)!);
const HOLD = 6000;

export function Hero() {
  const b = useBooking();
  const [i, setI] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const { setHeroVisible } = b;

  useEffect(() => {
    const t = window.setTimeout(() => setI((n) => (n + 1) % slides.length), HOLD);
    return () => window.clearTimeout(t);
  }, [i]);

  // The header's compact search and the phone search pill appear once this
  // bar has scrolled out from under the header.
  useEffect(() => {
    const el = searchRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setHeroVisible(e.isIntersecting), { rootMargin: "-80px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [setHeroVisible]);

  const slide = slides[i];
  const summary = [whereLabel(b.where) || "Anywhere", fmtRange(b.start, b.end) || "Any week", guestsText(b.guests) || "Add girls"].join(" · ");

  return (
    <section id="top" className="relative isolate flex h-[100svh] max-h-[1000px] min-h-[660px] flex-col justify-end">
      <div className="absolute inset-0 -z-10 overflow-hidden bg-ink">
        {slides.map((s, n) => (
          <div key={s.slug} className="hero-slide" data-on={n === i}>
            <Photo name={s.img} alt={s.venue ? `${s.title} at ${s.venue}` : s.title} priority={n === 0} className="size-full object-cover" />
          </div>
        ))}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(35,31,32,.42)_0%,rgba(35,31,32,.05)_30%,rgba(35,31,32,.1)_52%,rgba(35,31,32,.66)_100%)]" />
      </div>

      <div className="ctr relative z-20 pb-6 md:pb-10">
        <p className="load-in text-[11px] font-semibold uppercase tracking-[0.24em] text-white/85">
          Girls’ weekends · Hens · Birthdays
        </p>
        <h1 className="display load-in mt-4 max-w-[12.5ch] text-white" style={{ "--d": "120ms" } as React.CSSProperties}>
          Effortless getaways with your <em className="italic">best girls.</em>
        </h1>
        <p className="load-in mt-5 max-w-[44ch] text-[16px] leading-relaxed text-white/85 md:text-[17px]" style={{ "--d": "240ms" } as React.CSSProperties}>
          Boutique trips across Australia that give you the chance to escape, indulge and relax — every detail booked for you.
        </p>

        <div ref={searchRef} className="load-in mt-8 md:mt-10" style={{ "--d": "360ms" } as React.CSSProperties}>
          <SearchBar dir="up" />
          <button
            type="button"
            onClick={() => b.setSheet(true)}
            className="flex h-[64px] w-full items-center gap-3 rounded-full bg-white pl-2 pr-5 text-left shadow-l md:hidden"
          >
            <span className="grid size-12 flex-none place-items-center rounded-full bg-ink text-white">
              <IconSearch size={19} />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-medium text-ink">Where to, babe?</span>
              <span className="block truncate text-[12.5px] text-ink-3">{summary}</span>
            </span>
          </button>
        </div>

        <div className="mt-6 flex items-center justify-between gap-6 md:mt-8">
          <button
            type="button"
            onClick={() => b.openQuick(slide.slug)}
            className="glass-dark group flex min-w-0 items-center gap-3 rounded-full py-1.5 pl-4 pr-1.5 text-left text-white"
          >
            <span className="min-w-0 truncate text-[12.5px]">
              <span className="text-white/70">Now showing · </span>
              {slide.title}
              {slide.venue && <span className="hidden text-white/70 sm:inline">, {slide.venue}</span>}
            </span>
            <span className="grid size-8 flex-none place-items-center rounded-full bg-white text-ink transition-transform group-hover:translate-x-0.5">
              <IconArrow size={14} />
            </span>
          </button>

          <div className="hidden items-center gap-1.5 md:flex" role="tablist" aria-label="Featured getaways">
            {slides.map((s, n) => (
              <button
                key={s.slug}
                type="button"
                role="tab"
                aria-selected={n === i}
                aria-label={s.title}
                onClick={() => setI(n)}
                className={`relative h-[3px] overflow-hidden rounded-full bg-white/35 transition-all duration-500 ${n === i ? "w-10" : "w-4 hover:bg-white/60"}`}
              >
                {n === i && <span key={i} className="bar-prog absolute inset-0 bg-white" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
