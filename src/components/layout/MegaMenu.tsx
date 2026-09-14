"use client";

import { useState } from "react";
import { useBooking } from "@/lib/booking";
import { asset } from "@/lib/basePath";
import { Photo } from "@/components/ui/Photo";
import { IconArrow, IconHeart, IconNext, IconSparkle } from "@/components/ui/Icons";
import { styleIcon } from "@/components/booking/SearchParts";
import {
  destBySlug, destinations, experiences, hub, live, packages, packagesIn, placeLine, priceLabel, stateByCode, states, STYLES,
  type StateCode,
} from "@/content/site";

/*
 * GETAWAYS — the Wicked Hens drill-down, four columns deep:
 *   Region (Australia / International) → State → Destination → its packages.
 * Hover walks the tree; click commits: a state or destination filters the
 * results grid, a package opens its quick view.
 */
export function GetawaysMega({ onDone }: { onDone: () => void }) {
  const b = useBooking();
  const [group, setGroup] = useState<"Australia" | "International">("Australia");
  const [st, setSt] = useState<StateCode>("qld");
  const [dest, setDest] = useState<string | null>(null);

  const scope = dest ?? `state:${st}`;
  const list = packagesIn(scope);
  const state = stateByCode[st];
  const scopeName = dest ? destBySlug[dest].name : state.name;

  const go = (w: string) => {
    b.setWhere(w);
    onDone();
    b.goToResults();
  };
  const pickGroup = (g: "Australia" | "International") => {
    setGroup(g);
    setSt(states.find((s) => s.group === g)!.code);
    setDest(null);
  };

  return (
    <div className="grid grid-cols-[140px_215px_190px_minmax(0,1fr)] gap-4 xl:grid-cols-[170px_235px_240px_minmax(0,1fr)] xl:gap-6">
      <div>
        <p className="eyebrow px-3.5 pb-2">Explore</p>
        {(["Australia", "International"] as const).map((g) => (
          <button key={g} type="button" className="drill" data-active={group === g} onMouseEnter={() => pickGroup(g)} onClick={() => pickGroup(g)}>
            {g}
            <IconNext size={15} className="drill-arrow" />
          </button>
        ))}
        <div className="mt-6 space-y-2.5 border-t border-rule px-3.5 pt-5 text-[13.5px]">
          <button type="button" onClick={() => go("")} className="link-u block whitespace-nowrap text-left text-ink">
            Search all getaways
          </button>
          <a href="#specials" onClick={onDone} className="link-u block text-ink">
            Secret specials
          </a>
          <a href="#how" onClick={onDone} className="link-u block text-ink">
            How it works
          </a>
        </div>
      </div>

      <div key={group} className="col-in border-l border-rule pl-4 xl:pl-6">
        <p className="eyebrow px-3.5 pb-2">{group}</p>
        {states
          .filter((s) => s.group === group)
          .map((s) => {
            const n = packagesIn(`state:${s.code}`).length;
            return (
              <button
                key={s.code}
                type="button"
                className="drill"
                data-active={st === s.code}
                onMouseEnter={() => {
                  setSt(s.code);
                  setDest(null);
                }}
                onClick={() => go(`state:${s.code}`)}
              >
                <span>
                  {s.name}
                  {n > 0 && <span className="ml-2 text-[12px] tabular-nums text-ink-3">{n}</span>}
                </span>
                <IconNext size={15} className="drill-arrow" />
              </button>
            );
          })}
      </div>

      <div key={st} className="col-in max-h-[440px] overflow-y-auto border-l border-rule pl-4 xl:pl-6">
        <p className="eyebrow px-3.5 pb-2">{state.name}</p>
        <button type="button" className="drill" data-active={dest === null} onMouseEnter={() => setDest(null)} onClick={() => go(`state:${st}`)}>
          <span className="font-medium">All {state.short} getaways</span>
          <IconArrow size={15} className="drill-arrow" />
        </button>
        {destinations
          .filter((d) => d.state === st)
          .map((d) => {
            const n = packagesIn(d.slug).length;
            return (
              <button key={d.slug} type="button" className="drill" data-active={dest === d.slug} onMouseEnter={() => setDest(d.slug)} onClick={() => go(d.slug)}>
                <span>
                  {d.name}
                  {n > 0 && <span className="ml-2 text-[12px] tabular-nums text-ink-3">{n}</span>}
                </span>
                <IconNext size={15} className="drill-arrow" />
              </button>
            );
          })}
      </div>

      <div key={scope} className="col-in min-w-0 border-l border-rule pl-4 xl:pl-6">
        <div className="flex items-baseline justify-between gap-4">
          <p className="serif text-[30px] leading-none text-ink">{scopeName}</p>
          {list.length > 0 && (
            <button type="button" onClick={() => go(scope)} className="link-u flex-none text-[12.5px] text-ink">
              View all {list.length} →
            </button>
          )}
        </div>
        {list.length ? (
          <ul className="mt-4 grid gap-1 xl:grid-cols-2 xl:gap-x-4">
            {list.slice(0, 4).map((p) => (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => {
                    b.openQuick(p.slug);
                    onDone();
                  }}
                  className="group flex w-full items-center gap-3.5 rounded-2xl p-2 text-left transition-colors hover:bg-sand"
                >
                  <span className="plate plate-zoom block aspect-[4/3] w-24 flex-none rounded-xl">
                    <Photo name={p.img} alt="" sizes="96px" />
                  </span>
                  <span className="min-w-0">
                    <span className="serif block text-[20px] leading-[1.1] text-ink">{p.title}</span>
                    <span className="mt-1 block truncate text-[12.5px] text-ink-3">{p.venue ?? placeLine(p)}</span>
                    <span className="block text-[12.5px] text-ink">{priceLabel(p)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-5 flex h-[260px] flex-col justify-end rounded-[22px] bg-blush p-7">
            <IconSparkle size={22} className="text-clay-deep" />
            <p className="serif mt-3 text-[26px] leading-tight text-ink">Tailor-made {scopeName} getaways</p>
            <p className="mt-2 max-w-[40ch] text-[14px] text-ink-2">
              Tell us who, when and the vibe — the GG team will design and price a trip around your girls.
            </p>
            <a href={live("/contact-us")} className="btn btn-ink btn-sm mt-5 self-start">
              Enquire
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* EXPERIENCES — style filters on the left, the "What we do" tiles, a trending card. */
export function ExperiencesMega({ onDone }: { onDone: () => void }) {
  const b = useBooking();
  const trending = packages.find((p) => p.slug === "luxury-spas-resort-bars")!;
  const pick = (s: (typeof STYLES)[number]) => {
    b.setStyle(s);
    onDone();
    b.goToResults();
  };
  return (
    <div className="grid grid-cols-[230px_minmax(0,1fr)_280px] gap-8">
      <div>
        <p className="eyebrow px-3.5 pb-2">Getaway style</p>
        {STYLES.map((s) => (
          <button key={s} type="button" className="drill" onClick={() => pick(s)}>
            <span className="flex items-center gap-3">
              <span className="size-8 overflow-hidden rounded-full bg-clay">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(`/img/${styleIcon[s]}.png`)} alt="" className="size-full" />
              </span>
              {s}
            </span>
            <IconNext size={15} className="drill-arrow" />
          </button>
        ))}
      </div>
      <div className="border-l border-rule pl-8">
        <p className="eyebrow pb-4">What we do</p>
        <div className="grid grid-cols-5 gap-x-3 gap-y-5">
          {experiences.map((e) => (
            <button
              key={e.name}
              type="button"
              onClick={() => {
                onDone();
                b.goToResults();
              }}
              className="group flex flex-col items-center gap-2.5 text-center"
            >
              <span className="size-16 overflow-hidden rounded-full bg-clay transition-transform duration-500 group-hover:-translate-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(`/img/${e.icon}.png`)} alt="" className="size-full" />
              </span>
              <span className="text-[13px] leading-tight text-ink">{e.name}</span>
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          b.openQuick(trending.slug);
          onDone();
        }}
        className="group plate plate-zoom relative block h-full min-h-[260px] rounded-[22px] text-left"
      >
        <Photo name={trending.img} alt="" sizes="280px" />
        <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
        <span className="absolute inset-x-5 bottom-5 text-white">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/80">Trending now</span>
          <span className="serif mt-1 block text-[24px] leading-tight">{trending.title}</span>
          <span className="mt-1 block text-[12.5px] text-white/80">
            {placeLine(trending)} · {priceLabel(trending)} pp
          </span>
        </span>
      </button>
    </div>
  );
}

/* THE GG HUB */
export function HubMega({ onDone }: { onDone: () => void }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-8">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
        {hub.map((h) => (
          <a key={h.name} href={h.href} onClick={onDone} className="group rounded-2xl p-4 transition-colors hover:bg-blush">
            <span className="serif flex items-center gap-2 text-[24px] leading-none text-ink">
              {h.name}
              <IconArrow size={16} className="-translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </span>
            <span className="mt-1.5 block text-[13.5px] text-ink-3">{h.desc}</span>
          </a>
        ))}
      </div>
      <a href="#sisterhood" onClick={onDone} className="flex flex-col justify-between rounded-[22px] bg-blush p-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/img/mark-ink.png")} alt="" className="size-14" />
        <span>
          <span className="serif block text-[28px] leading-tight text-ink">Join the GG Sisterhood</span>
          <span className="mt-2 block text-[14px] text-ink-2">Exclusive deals, birthday offers &amp; free bubbly.</span>
          <span className="btn btn-ink btn-sm mt-5">Join now</span>
        </span>
      </a>
    </div>
  );
}

/* Saved getaways — the header heart. */
export function WishMenu({ onDone }: { onDone: () => void }) {
  const b = useBooking();
  const saved = packages.filter((p) => b.wish.includes(p.slug));
  return (
    <div className="w-[380px] rounded-[24px] border border-rule bg-paper p-5 text-ink shadow-l">
      <p className="eyebrow">Saved getaways</p>
      {saved.length ? (
        <ul className="mt-3 max-h-[380px] space-y-1 overflow-y-auto">
          {saved.map((p) => (
            <li key={p.slug} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-sand">
              <button
                type="button"
                onClick={() => {
                  b.openQuick(p.slug);
                  onDone();
                }}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span className="plate block h-12 w-16 flex-none rounded-xl">
                  <Photo name={p.img} alt="" sizes="64px" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[14px]">{p.title}</span>
                  <span className="block truncate text-[12px] text-ink-3">{placeLine(p)}</span>
                </span>
              </button>
              <button type="button" className="stepper size-8 border-0 text-clay-deep" aria-label={`Remove ${p.title}`} onClick={() => b.toggleWish(p.slug)}>
                <IconHeart size={16} className="fill-current" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[14px] text-ink-2">Tap the heart on any getaway to save it here — handy for sharing in the group chat.</p>
      )}
    </div>
  );
}
