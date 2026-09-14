"use client";

import { useEffect, useRef, useState } from "react";
import { fmtRange, guestsText, useBooking, useEscape } from "@/lib/booking";
import { asset } from "@/lib/basePath";
import { IconChevron, IconHeart, IconMenu, IconSearch, IconSparkle } from "@/components/ui/Icons";
import { whereLabel } from "@/content/site";
import { ExperiencesMega, GetawaysMega, HubMega, WishMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";

type Menu = "getaways" | "experiences" | "hub" | "wish" | null;

export function Header() {
  const b = useBooking();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState<Menu>(null);
  const [mobile, setMobile] = useState(false);
  const closeT = useRef<number | undefined>(undefined);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEscape(!!menu, () => setMenu(null));

  const open = (m: Menu) => {
    window.clearTimeout(closeT.current);
    setMenu(m);
  };
  // A short grace period, so crossing from the button to the panel never drops it.
  const leave = () => {
    window.clearTimeout(closeT.current);
    closeT.current = window.setTimeout(() => setMenu(null), 160);
  };
  const done = () => setMenu(null);

  const solid = scrolled || !!menu || mobile;

  const openSearch = () => {
    setMenu(null);
    if (b.heroVisible) b.setSeg("where");
    else {
      window.scrollTo({ top: 0, behavior: "smooth" });
      window.setTimeout(() => b.setSeg("where"), 550);
    }
  };

  const navBtn = `nav-btn ${solid ? "hover:bg-blush" : "hover:bg-white/15"}`;
  const trigger = (m: Exclude<Menu, null>, label: string) => (
    <button
      type="button"
      className={navBtn}
      aria-expanded={menu === m}
      aria-haspopup="true"
      onMouseEnter={() => open(m)}
      onClick={() => (menu === m ? setMenu(null) : open(m))}
    >
      {label}
      <IconChevron size={14} className="chev" />
    </button>
  );

  const summary = [whereLabel(b.where) || "Anywhere", fmtRange(b.start, b.end) || "Any week", guestsText(b.guests) || "Add girls"].join(" · ");

  return (
    <header className="fixed inset-x-0 top-0 z-50" onMouseLeave={leave} onMouseEnter={() => window.clearTimeout(closeT.current)}>
      {/* Announcement */}
      <div className={`overflow-hidden bg-ink text-white transition-[height] duration-500 ${scrolled ? "h-0" : "h-9"}`}>
        <a
          href="#sisterhood"
          className="ctr flex h-9 items-center justify-center gap-2 text-[10.5px] font-medium uppercase tracking-[0.16em] sm:text-[11px]"
        >
          <IconSparkle size={13} className="flex-none text-clay" />
          <span className="whitespace-nowrap sm:hidden">Join the Sisterhood · free bubbly</span>
          <span className="hidden whitespace-nowrap sm:inline">Join the GG Sisterhood — exclusive deals, birthday offers &amp; free bubbly</span>
          <span className="hidden flex-none underline underline-offset-4 md:inline">Join now</span>
        </a>
      </div>

      <div
        className={`relative transition-[background-color,color,box-shadow] duration-500 ${
          solid ? "frost text-ink shadow-[0_1px_0_var(--rule)]" : "text-white"
        }`}
      >
        <div className="ctr flex h-16 items-center gap-3 lg:h-[76px]">
          <a href="#top" className="flex flex-none items-center gap-3" aria-label="Girls Getaways — home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset(solid ? "/img/mark-ink.png" : "/img/mark-light.png")} alt="" className="size-10 lg:size-11" />
            <span className="serif text-[22px] leading-none tracking-[-0.01em] lg:text-[25px]">Girls Getaways</span>
          </a>

          <nav className="mx-auto hidden items-center gap-0.5 lg:flex" aria-label="Main">
            {trigger("getaways", "Getaways")}
            {trigger("experiences", "Experiences")}
            <a href="#how" className={navBtn} onMouseEnter={leave}>
              How it works
            </a>
            {trigger("hub", "GG Hub")}
            <a href="#gift" className={`${navBtn} hidden xl:inline-flex`} onMouseEnter={leave}>
              Gift cards
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            {/* Compact search: appears once the hero search has scrolled away. */}
            <button
              type="button"
              onClick={openSearch}
              className={`hidden h-11 items-center gap-3 rounded-full border border-rule-2 bg-white pl-5 pr-1.5 text-ink shadow-s transition-all duration-500 xl:flex ${
                b.heroVisible ? "pointer-events-none w-0 overflow-hidden border-0 p-0 opacity-0" : "opacity-100"
              }`}
              aria-label="Edit search"
              tabIndex={b.heroVisible ? -1 : 0}
            >
              <span className="max-w-[260px] truncate text-[13px]">{summary}</span>
              <span className="grid size-8 flex-none place-items-center rounded-full bg-ink text-white">
                <IconSearch size={15} />
              </span>
            </button>

            <button type="button" onClick={openSearch} className={`${navBtn} px-3 ${b.heroVisible ? "" : "xl:hidden"} hidden md:inline-flex`} aria-label="Search getaways">
              <IconSearch size={19} />
            </button>
            <button type="button" onClick={() => b.setSheet(true)} className={`${navBtn} px-3 md:hidden`} aria-label="Search getaways">
              <IconSearch size={19} />
            </button>

            <div className="relative">
              <button
                type="button"
                className={`${navBtn} px-3`}
                aria-label={`Saved getaways (${b.wish.length})`}
                aria-expanded={menu === "wish"}
                onClick={() => (menu === "wish" ? setMenu(null) : open("wish"))}
              >
                <IconHeart size={19} />
                {b.wish.length > 0 && (
                  <span className="absolute right-0.5 top-1.5 grid size-[18px] place-items-center rounded-full bg-clay text-[10px] font-semibold tracking-normal text-white">
                    {b.wish.length}
                  </span>
                )}
              </button>
              {menu === "wish" && (
                <div className="mega absolute right-0 top-full mt-3 max-w-[calc(100vw-40px)]">
                  <WishMenu onDone={done} />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={openSearch}
              className={`btn btn-sm ml-2 hidden hover:bg-clay-deep ${solid ? "bg-ink text-white" : "bg-white text-ink hover:text-white"} ${b.heroVisible ? "xl:inline-flex" : ""}`}
            >
              Plan my getaway
            </button>

            <button type="button" onClick={() => setMobile(true)} className={`${navBtn} px-3 lg:hidden`} aria-label="Open menu">
              <IconMenu size={22} />
            </button>
          </div>
        </div>

        {menu && menu !== "wish" && (
          <div className="mega absolute inset-x-0 top-full hidden border-t border-rule bg-paper text-ink shadow-l lg:block">
            <div className="ctr py-9">
              {menu === "getaways" && <GetawaysMega onDone={done} />}
              {menu === "experiences" && <ExperiencesMega onDone={done} />}
              {menu === "hub" && <HubMega onDone={done} />}
            </div>
          </div>
        )}
      </div>

      {mobile && <MobileMenu onClose={() => setMobile(false)} />}
    </header>
  );
}
