"use client";

import { useState, type ReactNode } from "react";
import { fmtRange, guestsText, nightsBetween, useBooking, useEscape, useLockScroll } from "@/lib/booking";
import { whereLabel } from "@/content/site";
import { IconClose, IconSearch } from "@/components/ui/Icons";
import { Calendar } from "./Calendar";
import { StylePicker, WhereList, WhoPicker } from "./SearchParts";

type Sec = "where" | "when" | "who" | "style";

/** Full-screen search for phones: one accordion card per question. */
export function MobileSearchSheet() {
  const b = useBooking();
  const [open, setOpen] = useState<Sec>("where");
  const close = () => b.setSheet(false);
  useLockScroll(b.sheet);
  useEscape(b.sheet, close);
  if (!b.sheet) return null;

  const nights = nightsBetween(b.start, b.end);

  const card = (key: Sec, label: string, value: string, empty: string, body: ReactNode) => (
    <section className="rounded-[26px] bg-white shadow-s">
      {open === key ? (
        <div className="p-5">
          <h3 className="serif text-[30px] leading-none text-ink">{label}</h3>
          <div className="mt-5">{body}</div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(key)} className="flex w-full items-center justify-between px-5 py-4 text-left">
          <span className="text-[13.5px] text-ink-3">{label}</span>
          <span className="max-w-[60%] truncate text-[14px] text-ink">{value || empty}</span>
        </button>
      )}
    </section>
  );

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-sand md:hidden" role="dialog" aria-modal="true" aria-label="Plan your getaway">
      <div className="flex h-16 flex-none items-center justify-between px-5">
        <button type="button" onClick={close} className="stepper bg-white" aria-label="Close search">
          <IconClose size={16} />
        </button>
        <p className="eyebrow">Plan your getaway</p>
        <span className="w-9" />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-6">
        {card("where", "Where to?", whereLabel(b.where), "Anywhere", <WhereList onPick={() => setOpen("when")} />)}
        {card(
          "when",
          "When’s the getaway?",
          fmtRange(b.start, b.end),
          "Add dates",
          <>
            <Calendar start={b.start} end={b.end} onChange={b.setDates} months={1} />
            <div className="mt-4 flex items-center justify-between border-t border-rule pt-4 text-[13.5px]">
              <span className="text-ink-2">{nights ? `${nights} night${nights > 1 ? "s" : ""}` : "Pick check-in, then check-out"}</span>
              <button type="button" className="btn btn-ink btn-sm" onClick={() => setOpen("who")}>
                Next
              </button>
            </div>
          </>
        )}
        {card("who", "Who’s coming?", guestsText(b.guests), "Add girls", <WhoPicker />)}
        {card("style", "What’s the vibe?", b.style, "Any style", <StylePicker />)}
      </div>

      <div className="flex flex-none items-center justify-between gap-4 border-t border-rule bg-white px-5 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <button type="button" className="link-u text-[14px] text-ink" onClick={b.reset}>
          Clear all
        </button>
        <button type="button" className="btn btn-ink" onClick={b.goToResults}>
          <IconSearch size={17} /> Show {b.results.length} getaway{b.results.length === 1 ? "" : "s"}
        </button>
      </div>
    </div>
  );
}
