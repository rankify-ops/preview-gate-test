"use client";

import { useState } from "react";
import { useBooking, useEscape, useLockScroll } from "@/lib/booking";
import { asset } from "@/lib/basePath";
import { Photo } from "@/components/ui/Photo";
import { IconArrow, IconBack, IconClose, IconFacebook, IconInstagram, IconNext } from "@/components/ui/Icons";
import {
  destBySlug, destinations, experiences, hub, live, packagesIn, priceLabel, site, stateByCode, states, STYLES,
  type StateCode,
} from "@/content/site";

/*
 * Phone menu — the same drill-down as the desktop mega menu, one level per
 * screen: Getaways › Australia › Queensland › Gold Coast › packages.
 * `path` is the stack of choices; Back pops it.
 */
export function MobileMenu({ onClose }: { onClose: () => void }) {
  const b = useBooking();
  // Mounted only while open, so every open starts back at the top level.
  const [path, setPath] = useState<string[]>([]);
  const [dir, setDir] = useState<1 | -1>(1);
  useLockScroll(true);
  useEscape(true, onClose);

  const push = (k: string) => {
    setDir(1);
    setPath([...path, k]);
  };
  const pop = () => {
    setDir(-1);
    setPath(path.slice(0, -1));
  };
  const go = (w: string) => {
    b.setWhere(w);
    onClose();
    b.goToResults();
  };

  const [root, a, c, d] = path;
  let title = "Menu";
  let body: React.ReactNode;

  if (!root) {
    body = (
      <>
        <Row label="Getaways" sub="By region, state & destination" drill onClick={() => push("getaways")} />
        <Row label="Experiences" sub="Hens, wine weekends, spa retreats…" drill onClick={() => push("experiences")} />
        <Row label="How it works" href="#how" />
        <Row label="The GG Hub" sub="Sisterhood, specials & the Diaries" drill onClick={() => push("hub")} />
        <Row label="Gift cards" href="#gift" />
      </>
    );
  } else if (root === "getaways" && !a) {
    title = "Getaways";
    body = (
      <>
        <Row label="Australia" drill onClick={() => push("Australia")} />
        <Row label="International" sub="Bali" drill onClick={() => push("International")} />
        <Row label="Search all getaways" onClick={() => go("")} />
      </>
    );
  } else if (root === "getaways" && a && !c) {
    title = a;
    body = states
      .filter((s) => s.group === a)
      .map((s) => {
        const n = packagesIn(`state:${s.code}`).length;
        return <Row key={s.code} label={s.name} sub={n ? `${n} getaway${n > 1 ? "s" : ""}` : "Tailor-made on request"} drill onClick={() => push(s.code)} />;
      });
  } else if (root === "getaways" && c && !d) {
    const s = stateByCode[c as StateCode];
    title = s.name;
    body = (
      <>
        <Row label={`All ${s.short} getaways`} onClick={() => go(`state:${s.code}`)} />
        {destinations
          .filter((x) => x.state === s.code)
          .map((x) => {
            const n = packagesIn(x.slug).length;
            return <Row key={x.slug} label={x.name} sub={n ? `${n} getaway${n > 1 ? "s" : ""}` : undefined} drill onClick={() => push(x.slug)} />;
          })}
      </>
    );
  } else if (root === "getaways" && d) {
    const dest = destBySlug[d];
    const list = packagesIn(d);
    title = dest.name;
    body = (
      <>
        {list.length ? (
          <div className="space-y-3 pt-4">
            {list.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => {
                  b.openQuick(p.slug);
                  onClose();
                }}
                className="flex w-full items-center gap-4 text-left"
              >
                <span className="plate block h-16 w-24 flex-none rounded-xl">
                  <Photo name={p.img} alt="" sizes="96px" />
                </span>
                <span className="min-w-0">
                  <span className="serif block text-[21px] leading-tight text-ink">{p.title}</span>
                  <span className="block truncate text-[12.5px] text-ink-3">
                    {p.venue ?? dest.name} · {priceLabel(p)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="pt-5 text-[15px] text-ink-2">
            No set packages here yet — the GG team can tailor-make a {dest.name} getaway for your group.
          </p>
        )}
        <button type="button" onClick={() => go(d)} className="btn btn-line mt-6 w-full">
          View all {dest.name} getaways
        </button>
      </>
    );
  } else if (root === "experiences") {
    title = "Experiences";
    body = (
      <>
        <p className="eyebrow pt-5">Getaway style</p>
        {STYLES.map((s) => (
          <Row
            key={s}
            label={s}
            onClick={() => {
              b.setStyle(s);
              onClose();
              b.goToResults();
            }}
          />
        ))}
        <p className="eyebrow pt-8">What we do</p>
        <div className="mt-4 grid grid-cols-3 gap-x-3 gap-y-5">
          {experiences.map((e) => (
            <button
              key={e.name}
              type="button"
              onClick={() => {
                onClose();
                b.goToResults();
              }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <span className="size-16 overflow-hidden rounded-full bg-clay">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset(`/img/${e.icon}.png`)} alt="" className="size-full" />
              </span>
              <span className="text-[12.5px] leading-tight text-ink">{e.name}</span>
            </button>
          ))}
        </div>
      </>
    );
  } else if (root === "hub") {
    title = "The GG Hub";
    body = hub.map((h) => <Row key={h.name} label={h.name} sub={h.desc} href={h.href} />);
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-paper text-ink lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="flex h-16 flex-none items-center justify-between border-b border-rule px-5">
        {path.length ? (
          <button type="button" onClick={pop} className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.14em]">
            <IconBack size={18} /> Back
          </button>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset("/img/mark-ink.png")} alt="Girls Getaways" className="size-10" />
        )}
        <button type="button" onClick={onClose} className="stepper" aria-label="Close menu">
          <IconClose size={16} />
        </button>
      </div>

      {/* Any in-page link inside closes the menu on its way to the section. */}
      <div className="flex-1 overflow-y-auto px-5 pb-8" onClick={(e) => (e.target as HTMLElement).closest("a") && onClose()}>
        <div key={path.join("/")} className={dir > 0 ? "slide-r" : "slide-l"}>
          <p className="serif pb-2 pt-6 text-[40px] leading-none">{title}</p>
          {body}
        </div>
      </div>

      <div className="flex flex-none items-center gap-3 border-t border-rule px-5 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => {
            onClose();
            b.setSheet(true);
          }}
          className="btn btn-ink flex-1"
        >
          Plan my getaway
        </button>
        <a href={site.instagram} className="stepper size-12" aria-label="Instagram">
          <IconInstagram size={18} />
        </a>
        <a href={site.facebook} className="stepper size-12" aria-label="Facebook">
          <IconFacebook size={18} />
        </a>
      </div>
      <span className="sr-only">
        <a href={live("/contact-us")}>Contact us</a>
      </span>
    </div>
  );
}

function Row({
  label, sub, onClick, href, drill = false,
}: { label: string; sub?: string; onClick?: () => void; href?: string; drill?: boolean }) {
  const inner = (
    <>
      <span>
        <span className="block text-[17px] text-ink">{label}</span>
        {sub && <span className="block text-[13px] text-ink-3">{sub}</span>}
      </span>
      {drill ? <IconNext size={18} className="text-ink-3" /> : <IconArrow size={16} className="text-ink-3" />}
    </>
  );
  const cls = "flex w-full items-center justify-between border-b border-rule py-4 text-left";
  return href ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
