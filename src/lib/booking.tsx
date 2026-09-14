"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode,
} from "react";
import { packages, stateOf, type Package, type Style } from "@/content/site";

/*
 * One store for the whole booking flow. The hero search bar, the compact pill
 * in the header, the mobile search sheet, the mega menu and the results grid
 * all read and write the same selection, so picking "Gold Coast" in the menu
 * shows up in the search bar and filters the grid in one move.
 */

export type Seg = "where" | "when" | "who" | "style" | null;
export type Sort = "rec" | "low" | "high";

type Booking = {
  where: string;
  setWhere: (w: string) => void;
  start: Date | null;
  end: Date | null;
  setDates: (s: Date | null, e: Date | null) => void;
  guests: number;
  setGuests: (n: number) => void;
  style: Style | "";
  setStyle: (s: Style | "") => void;
  sort: Sort;
  setSort: (s: Sort) => void;
  reset: () => void;
  results: Package[];

  /** Which segment of the desktop search bar has its popover open. */
  seg: Seg;
  setSeg: (s: Seg) => void;
  /** The full-screen mobile search sheet. */
  sheet: boolean;
  setSheet: (o: boolean) => void;
  /** Whether the hero search bar is on screen — drives the header pill. */
  heroVisible: boolean;
  setHeroVisible: (v: boolean) => void;

  wish: string[];
  toggleWish: (slug: string) => void;

  quick: Package | null;
  openQuick: (slug: string | null) => void;

  goToResults: () => void;
};

const BookingContext = createContext<Booking | null>(null);

/*
 * Wishlist store: localStorage, with an in-memory copy for when storage throws
 * (private mode, blocked site data) — hearts then still work, just don't persist.
 */
let memWish = "[]";
const wishSubs = new Set<() => void>();
function readWish() {
  try {
    return localStorage.getItem("gg-wish") ?? memWish;
  } catch {
    return memWish;
  }
}
function writeWish(v: string) {
  memWish = v;
  try {
    localStorage.setItem("gg-wish", v);
  } catch {}
  wishSubs.forEach((f) => f());
}
function subscribeWish(f: () => void) {
  wishSubs.add(f);
  return () => {
    wishSubs.delete(f);
  };
}
function parseWish(raw: string): string[] {
  try {
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [where, setWhere] = useState("");
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [guests, setGuests] = useState(0);
  const [style, setStyle] = useState<Style | "">("");
  const [sort, setSort] = useState<Sort>("rec");
  const [seg, setSeg] = useState<Seg>(null);
  const [sheet, setSheet] = useState(false);
  const [heroVisible, setHeroVisible] = useState(true);
  const [quickSlug, setQuickSlug] = useState<string | null>(null);

  // The server renders an empty wishlist; the browser's saved one takes over on hydration.
  const wishRaw = useSyncExternalStore(subscribeWish, readWish, () => "[]");
  const wish = useMemo(() => parseWish(wishRaw), [wishRaw]);

  const toggleWish = useCallback((slug: string) => {
    const w = parseWish(readWish());
    writeWish(JSON.stringify(w.includes(slug) ? w.filter((s) => s !== slug) : [...w, slug]));
  }, []);

  const setDates = useCallback((s: Date | null, e: Date | null) => {
    setStart(s);
    setEnd(e);
  }, []);

  const reset = useCallback(() => {
    setWhere("");
    setStart(null);
    setEnd(null);
    setGuests(0);
    setStyle("");
    setSort("rec");
  }, []);

  const results = useMemo(() => {
    const list = packages.filter((p) => {
      if (where) {
        if (where.startsWith("state:") ? stateOf(p) !== where.slice(6) : p.dest !== where) return false;
      }
      if (style && !p.styles.includes(style)) return false;
      if (guests && p.guests && (guests < p.guests[0] || guests > p.guests[1])) return false;
      return true;
    });
    if (sort === "rec") return list;
    // Unpriced packages always sort last — "price on request" isn't cheap.
    const price = (p: Package) => p.priceFrom ?? (sort === "low" ? Infinity : -Infinity);
    return [...list].sort((a, b) => (sort === "low" ? price(a) - price(b) : price(b) - price(a)));
  }, [where, style, guests, sort]);

  const goToResults = useCallback(() => {
    setSeg(null);
    setSheet(false);
    requestAnimationFrame(() => document.getElementById("getaways")?.scrollIntoView({ behavior: "smooth" }));
  }, []);

  const quick = useMemo(() => packages.find((p) => p.slug === quickSlug) ?? null, [quickSlug]);

  const value: Booking = {
    where, setWhere, start, end, setDates, guests, setGuests, style, setStyle, sort, setSort, reset, results,
    seg, setSeg, sheet, setSheet, heroVisible, setHeroVisible,
    wish, toggleWish, quick, openQuick: setQuickSlug, goToResults,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside <BookingProvider>");
  return ctx;
}

/* ── helpers ────────────────────────────────────────────────────────── */

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDay(d: Date) {
  return `${d.getDate()} ${MON[d.getMonth()]}`;
}

export function fmtRange(s: Date | null, e: Date | null) {
  if (!s) return "";
  if (!e) return `${fmtDay(s)} – ?`;
  return s.getMonth() === e.getMonth()
    ? `${s.getDate()}–${e.getDate()} ${MON[e.getMonth()]}`
    : `${fmtDay(s)} – ${fmtDay(e)}`;
}

export const nightsBetween = (s: Date | null, e: Date | null) =>
  s && e ? Math.round((e.getTime() - s.getTime()) / 86_400_000) : 0;

export const guestsText = (n: number) => (n ? `${n} girl${n === 1 ? "" : "s"}` : "");

/** Locks page scroll while a sheet, drawer or menu is open. */
export function useLockScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [active]);
}

/** Closes something on Escape. */
export function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onEscape();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [active, onEscape]);
}
