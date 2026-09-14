/*
 * Girls Getaways — content.
 *
 * Every package, venue, price and group size below is taken from the live
 * girlsgetaways.com.au home page (Sept 2026). Where the live site shows no
 * price or group size, the field is left out and the UI says "price on
 * request" rather than inventing one.
 *
 * `styles` is the one field we assigned: the live site has a Style filter
 * (Hens / Classic / Luxury / Winter Wines / Girl's Day) but doesn't expose
 * which package sits in which, so these are best guesses from each package's
 * description. Replace with the real mapping when the package data comes in.
 */

export const site = {
  name: "Girls Getaways",
  url: "https://www.girlsgetaways.com.au",
  live: "https://www.girlsgetaways.com.au",
  instagram: "https://www.instagram.com/girlsgetaways/",
  facebook: "https://www.facebook.com/GirlsGetawaysAu",
};

/** Live-site URL helper — for pages this home-page build doesn't have yet. */
export const live = (path: string) => `${site.live}${path}`;

export type StateCode = "nsw" | "qld" | "vic" | "act" | "sa" | "wa" | "bali";

export type State = {
  code: StateCode;
  short: string;
  name: string;
  group: "Australia" | "International";
  /** Portrait banner from the live site, where one exists. */
  img?: string;
};

export const states: State[] = [
  { code: "nsw", short: "NSW", name: "New South Wales", group: "Australia", img: "state-nsw" },
  { code: "qld", short: "QLD", name: "Queensland", group: "Australia", img: "state-qld" },
  { code: "vic", short: "VIC", name: "Victoria", group: "Australia", img: "state-vic" },
  { code: "act", short: "ACT", name: "Canberra & ACT", group: "Australia", img: "state-act" },
  { code: "sa", short: "SA", name: "South Australia", group: "Australia", img: "state-sa" },
  { code: "wa", short: "WA", name: "Western Australia", group: "Australia" },
  { code: "bali", short: "Bali", name: "Bali", group: "International" },
];

export type Destination = { slug: string; name: string; state: StateCode };

// The Destination filter on the live site, grouped by state.
export const destinations: Destination[] = [
  { slug: "sydney", name: "Sydney", state: "nsw" },
  { slug: "sydney-surrounds", name: "Sydney Surrounds", state: "nsw" },
  { slug: "blue-mountains", name: "Blue Mountains", state: "nsw" },
  { slug: "hunter-valley", name: "Hunter Valley", state: "nsw" },
  { slug: "central-coast", name: "Central Coast", state: "nsw" },
  { slug: "newcastle", name: "Newcastle", state: "nsw" },
  { slug: "port-stephens", name: "Port Stephens", state: "nsw" },
  { slug: "byron-bay", name: "Byron Bay", state: "nsw" },
  { slug: "north-coast", name: "North Coast", state: "nsw" },
  { slug: "mudgee", name: "Mudgee", state: "nsw" },
  { slug: "orange", name: "Orange", state: "nsw" },
  { slug: "southern-highlands", name: "Southern Highlands", state: "nsw" },
  { slug: "south-coast", name: "South Coast", state: "nsw" },
  { slug: "snowy-mountains", name: "Snowy Mountains", state: "nsw" },
  { slug: "brisbane", name: "Brisbane", state: "qld" },
  { slug: "gold-coast", name: "Gold Coast", state: "qld" },
  { slug: "sunshine-coast", name: "Sunshine Coast", state: "qld" },
  { slug: "melbourne", name: "Melbourne", state: "vic" },
  { slug: "mornington-peninsula", name: "Mornington Peninsula", state: "vic" },
  { slug: "great-ocean-road", name: "Great Ocean Road", state: "vic" },
  { slug: "canberra", name: "Canberra", state: "act" },
  { slug: "adelaide-hills", name: "Adelaide Hills", state: "sa" },
];

export const STYLES = ["Hens", "Classic", "Luxury", "Winter Wines", "Girl's Day"] as const;
export type Style = (typeof STYLES)[number];

export type Package = {
  slug: string;
  title: string;
  venue?: string;
  dest: string;
  /** Town within the destination, when the live URL names one. */
  area?: string;
  img: string;
  styles: Style[];
  priceFrom?: number;
  guests?: [number, number];
  nights?: number;
  blurb?: string;
  /** Path on the live site. */
  path: string;
  tag?: "Trending" | "Featured" | "New";
};

export const packages: Package[] = [
  {
    slug: "rooftop-spas-beauty-bars",
    title: "Rooftop Spas & Beauty Bars",
    dest: "brisbane",
    img: "pk-rooftop",
    styles: ["Luxury", "Girl's Day"],
    nights: 2,
    blurb:
      "Two nights in a boutique hotel with a resort-style rooftop spa, pool and city views — a little luxury, a little pampering and a little retail therapy.",
    path: "/package-search/brisbane/rooftop-spas-beauty-bars",
    tag: "Featured",
  },
  {
    slug: "luxury-spas-resort-bars",
    title: "Luxury Spas & Resort Bars",
    dest: "hunter-valley",
    img: "pk-hunter",
    styles: ["Luxury", "Winter Wines"],
    priceFrom: 699,
    guests: [2, 18],
    blurb:
      "A weekend with your besties and wine — escape with the gals and nowhere to be once you get there.",
    path: "/package-search/hunter-valley/luxury-spas-resort-bars",
    tag: "Trending",
  },
  {
    slug: "retro-and-relax",
    title: "Retro & Relax",
    dest: "brisbane",
    img: "pk-retro",
    styles: ["Classic", "Girl's Day"],
    priceFrom: 429,
    guests: [4, 12],
    nights: 2,
    blurb:
      "Two nights in a central apartment, starting with a relaxing pamper treatment before a gin-themed afternoon tea.",
    path: "/package-search/brisbane/retro-and-relax",
    tag: "Trending",
  },
  {
    slug: "around-the-world-in-byron-bay",
    title: "Around the World in Byron Bay",
    dest: "byron-bay",
    img: "pk-byron",
    styles: ["Classic", "Hens"],
    priceFrom: 695,
    guests: [4, 9],
    blurb:
      "World-class beaches, an Asian banquet and a Mediterranean feast — see the world from the comfort of Byron.",
    path: "/package-search/byron-bay/around-the-world-in-byron-bay",
    tag: "Trending",
  },
  {
    slug: "moonlighting-in-mudgee",
    title: "Moonlighting in Mudgee",
    dest: "mudgee",
    img: "pk-mudgee",
    styles: ["Luxury", "Winter Wines", "Hens"],
    priceFrom: 699,
    guests: [6, 12],
    blurb:
      "The full private-retreat experience: sparkling pools, spas, saunas, fire pits and a home cinema, plus a wine tour and gourmet lunch.",
    path: "/package-search/mudgee/moonlighting-in-mudgee",
    tag: "Trending",
  },
  {
    slug: "pamper-in-paradise",
    title: "Pamper in Paradise",
    dest: "sunshine-coast",
    area: "Mooloolaba",
    img: "pk-pamper",
    styles: ["Classic", "Girl's Day"],
    priceFrom: 375,
    guests: [3, 7],
    blurb:
      "Luxury seaside accommodation with no particular place to go — for when relaxing and winding down is exactly what you need.",
    path: "/package-search/sunshine-coast/mooloolaba/pamper-in-paradise",
    tag: "Trending",
  },
  {
    slug: "inner-city-oasis",
    title: "Inner City Oasis",
    venue: "The Calile Hotel",
    dest: "brisbane",
    img: "pk-calile",
    styles: ["Luxury"],
    path: "/package-search/brisbane/inner-city-oasis",
  },
  {
    slug: "poolside-palm-oasis",
    title: "Poolside Palm Oasis",
    venue: "La Belle Vallée",
    dest: "south-coast",
    area: "Kangaroo Valley",
    img: "pk-bellevallee",
    styles: ["Luxury", "Hens"],
    path: "/package-search/kangaroo-valley/poolside-palm-oasis",
  },
  {
    slug: "decadent-detox",
    title: "Decadent Detox",
    venue: "Greenhouse the Bathhouse",
    dest: "gold-coast",
    area: "Burleigh Heads",
    img: "pk-greenhouse",
    styles: ["Girl's Day"],
    path: "/package-search/gold-coast/burleigh-heads/brunch-bubbles-besties",
  },
  {
    slug: "beauties-bars-and-bubbles",
    title: "Beauties, Bars & Bubbles",
    venue: "Pinchy’s Lobster & Champagne Bar",
    dest: "melbourne",
    img: "pk-pinchys",
    styles: ["Hens", "Classic"],
    path: "/package-search/melbourne/beauties-bars-and-bubbles",
  },
  {
    slug: "shorelines-and-grapevines",
    title: "Shorelines & Grapevines",
    venue: "The Palm Co",
    dest: "south-coast",
    area: "Gerringong",
    img: "pk-palmco",
    styles: ["Winter Wines", "Classic"],
    path: "/package-search/gerringong/shorelines-and-grapevines",
  },
  {
    slug: "brunch-bubbles-besties",
    title: "Brunch, Bubbles & Besties",
    venue: "The Tropic",
    dest: "gold-coast",
    area: "Burleigh Heads",
    img: "pk-tropic",
    styles: ["Hens", "Girl's Day"],
    path: "/package-search/gold-coast/burleigh-heads/brunch-bubbles-besties",
  },
  {
    slug: "bayside-bliss",
    title: "Bayside Bliss",
    venue: "Mandala Beach House",
    dest: "south-coast",
    area: "Jervis Bay",
    img: "pk-mandala",
    styles: ["Classic"],
    path: "/package-search/jervis-bay/bayside-bliss",
  },
  {
    slug: "relaxation-retreat",
    title: "Relaxation Retreat",
    venue: "Leisure Inn Spires",
    dest: "blue-mountains",
    img: "pk-spires",
    styles: ["Winter Wines", "Classic"],
    path: "/package-search/blue-mountains/relaxation-retreat",
  },
  {
    slug: "glamour-glow-and-gourmet",
    title: "Glamour, Glow & Gourmet",
    venue: "Sundara Beach House",
    dest: "south-coast",
    area: "Gerringong",
    img: "pk-sundara",
    styles: ["Luxury", "Hens"],
    path: "/package-search/gerringong/glamour-glow-and-gourmet",
  },
  {
    slug: "vincentia-views",
    title: "Vincentia Views",
    venue: "Bethany Beach House",
    dest: "south-coast",
    area: "Jervis Bay",
    img: "pk-bethany",
    styles: ["Classic"],
    path: "/package-search/nsw-south-coast/jervis-bay/vincentia-views",
  },
];

/** The hero slideshow — the live site's home-page carousel, in its order. */
export const heroSlides = [
  "inner-city-oasis",
  "poolside-palm-oasis",
  "decadent-detox",
  "beauties-bars-and-bubbles",
  "shorelines-and-grapevines",
  "brunch-bubbles-besties",
  "bayside-bliss",
  "relaxation-retreat",
  "glamour-glow-and-gourmet",
  "vincentia-views",
];

/** "What we do" — the live site's experience tiles, with its line icons. */
export const experiences = [
  { name: "Wine Weekends", icon: "ico-wine" },
  { name: "Beach Breaks", icon: "ico-beach" },
  { name: "City Escapes", icon: "ico-city" },
  { name: "Foodie Feasts", icon: "ico-foodie" },
  { name: "Spa Retreats", icon: "ico-spa" },
  { name: "Hens Parties", icon: "ico-hens" },
  { name: "Luxury Stays", icon: "ico-luxury" },
  { name: "Pamper Days", icon: "ico-pamper" },
  { name: "High Tea", icon: "ico-hightea" },
  { name: "Country Escapes", icon: "ico-country" },
];

export const hub = [
  { name: "GG Team", desc: "Meet the girls behind every getaway", href: live("/gg-team") },
  { name: "GG Sisterhood", desc: "Members-only deals & free bubbly", href: "#sisterhood" },
  { name: "Secret Specials", desc: "Limited offers for the Sisterhood", href: "#specials" },
  { name: "The GG Diaries", desc: "Guides, stories & getaway inspo", href: live("/the-gg-diaries") },
  { name: "Couples Getaways", desc: "Bring your plus-one this time", href: live("/couples-getaways") },
];

/* ── lookups ────────────────────────────────────────────────────────── */

export const destBySlug = Object.fromEntries(destinations.map((d) => [d.slug, d])) as Record<
  string,
  Destination
>;
export const stateByCode = Object.fromEntries(states.map((s) => [s.code, s])) as Record<StateCode, State>;

export const stateOf = (p: Package) => destBySlug[p.dest].state;

export const packagesIn = (where: string) =>
  where.startsWith("state:")
    ? packages.filter((p) => stateOf(p) === where.slice(6))
    : packages.filter((p) => p.dest === where);

/** "Gold Coast · QLD", or "Jervis Bay · South Coast" when a town is named. */
export function placeLine(p: Package) {
  const d = destBySlug[p.dest];
  return p.area ? `${p.area}, ${d.name}` : `${d.name}, ${stateByCode[d.state].short}`;
}

export function whereLabel(where: string) {
  if (!where) return "";
  if (where.startsWith("state:")) return stateByCode[where.slice(6) as StateCode]?.name ?? "";
  return destBySlug[where]?.name ?? "";
}

export const priceLabel = (p: Package) => (p.priceFrom ? `From $${p.priceFrom}` : "Price on request");
export const guestsLabel = (p: Package) => (p.guests ? `${p.guests[0]}–${p.guests[1]} girls` : "Any group size");
