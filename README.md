# Preview gate test — Girls Getaways copy

A concept rebuild of the [girlsgetaways.com.au](https://www.girlsgetaways.com.au/) home page as a
modern booking web app. Next.js (App Router) + Tailwind v4, **static export**, same stack as
`precision-painting-pro/` so it deploys to GitHub Pages with no server.

```bash
npm install
npm run dev -- --port 3041   # or the "girls-getaways" launch config
node scripts/images.mjs      # re-generate public/img from assets-raw/
```

## What's in it

- **Booking bar** (hero) — Where · When · Who · Style, each with its own popover: grouped
  destination search, a two-month date-range calendar, a guest stepper, style tiles.
  On phones it becomes a full-screen search sheet.
- **Mega menu** modelled on wickedhensnights.com.au: *Getaways → Australia / International →
  State → Destination → its packages*, four columns deep, hover to walk the tree and click
  to filter. Plus *Experiences* and *GG Hub* panels and a saved-getaways (heart) dropdown.
- **Mobile menu** — the same drill-down, one level per screen with Back.
- **Live results grid** — every search, menu click, region card and style chip filters one
  shared store (`src/lib/booking.tsx`); sort, removable filter chips, empty state.
- **Quick view + request-to-book drawer** — dates, girls, organiser details, and the
  *individual payments vs one payment* choice, with a running price estimate.
- Compact search pill in the header (desktop) and a floating search pill (phones) once the
  hero search scrolls away. Wishlist persists in localStorage.

## Real vs. placeholder

Real, from the live site: every package title, venue, image, price, group size and blurb;
the destination list; state banners; the "What we do" icons; the How-it-works copy; the GG
monogram; the Sisterhood copy.

Assumed — **replace when real data arrives**:

- `styles` on each package (the live Style filter doesn't expose its mapping) — `src/content/site.ts`.
- Packages without a price on the live home page show "Price on request".
- The individual-payments card in *How it works* is an illustration, labelled "Example".
- Headings use Cormorant Garamond as a stand-in for their licensed MADE Mirage.

## Not wired yet

- **Booking requests** post to Web3Forms when `NEXT_PUBLIC_WEB3FORMS_KEY` is set; without it the
  drawer says it's a preview and sends nothing.
- **Sisterhood sign-up** only shows a success state — needs their mailing-list endpoint.
- Only 16 packages (the ones on the live home page). The full 100+ catalogue would come from
  their package data / booking system.
- Links to pages this build doesn't have (GG Team, Diaries, gift cards, contact, T&Cs) go to
  the live site.
