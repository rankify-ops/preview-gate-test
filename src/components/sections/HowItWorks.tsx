import { Reveal } from "@/components/ui/Reveal";
import { IconCheck } from "@/components/ui/Icons";

// The live site's three steps, in its words.
const steps = [
  {
    t: "Choose your dream girls getaway",
    d: "Select from over one hundred packages across Australia specially designed for birthdays, hens or just quality girl time.",
  },
  {
    t: "Allow us to organise the details",
    d: "We’ll price up your package, book your inclusions and offer individual payment options to save you the hassle of chasing money.",
  },
  {
    t: "Take off on your hassle-free escape",
    d: "Enjoy the bliss of having all of the finer details taken care of and relax with your girl group from the moment you arrive.",
  },
];

// Illustrative only — shows what individual payments look like to the organiser.
const girls = [
  { n: "You", s: "Paid" },
  { n: "Jess", s: "Paid" },
  { n: "Mia", s: "Paid" },
  { n: "Chloe", s: "Paid" },
  { n: "Sophie", s: "Reminder sent" },
  { n: "Ella", s: "Due Fri" },
];

export function HowItWorks() {
  return (
    <section id="how" className="sec bg-paper">
      <div className="ctr grid items-center gap-14 lg:grid-cols-[1fr_minmax(0,480px)] lg:gap-20">
        <div>
          <p className="eyebrow">How it works</p>
          <h2 className="h2 mt-3 max-w-[15ch]">
            You bring the girls. <em className="italic text-clay-deep">We do the rest.</em>
          </h2>
          <ol className="mt-12 space-y-9">
            {steps.map((s, i) => (
              <Reveal key={s.t} delay={i * 90}>
                <li className="grid grid-cols-[56px_1fr] gap-4">
                  <span className="serif text-[44px] leading-none text-clay">0{i + 1}</span>
                  <div className="border-b border-rule pb-8">
                    <h3 className="serif text-[27px] leading-tight">{s.t}</h3>
                    <p className="lede mt-2 max-w-[52ch] text-[15px]">{s.d}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal>
          <div className="relative">
            <div aria-hidden className="absolute -inset-6 -z-10 rounded-[40px] bg-blush" />
            <div className="rounded-[28px] bg-white p-6 shadow-l md:p-8">
              <div className="flex items-center justify-between">
                <p className="eyebrow">Individual payments</p>
                <span className="rounded-full bg-sand px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">Example</span>
              </div>
              <p className="serif mt-4 text-[28px] leading-tight text-ink">Luxury Spas &amp; Resort Bars</p>
              <p className="text-[13.5px] text-ink-3">Hunter Valley · 6 girls · $699 each</p>

              <div className="mt-6 flex items-end justify-between">
                <p className="text-[13px] text-ink-2">
                  <span className="serif text-[34px] leading-none text-ink">4</span> of 6 paid
                </p>
                <p className="text-[13px] text-ink-3">$2,796 / $4,194</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-blush">
                <div className="h-full w-2/3 rounded-full bg-clay" />
              </div>

              <ul className="mt-6 divide-y divide-rule">
                {girls.map((g) => {
                  const paid = g.s === "Paid";
                  return (
                    <li key={g.n} className="flex items-center justify-between py-3">
                      <span className="flex items-center gap-3">
                        <span className={`grid size-9 place-items-center rounded-full text-[12px] font-medium ${paid ? "bg-clay-tint text-clay-ink" : "bg-sand text-ink-3"}`}>
                          {g.n[0]}
                        </span>
                        <span className="text-[14.5px] text-ink">{g.n}</span>
                      </span>
                      <span className={`flex items-center gap-1.5 text-[12.5px] ${paid ? "text-ink" : "text-ink-3"}`}>
                        {paid && <IconCheck size={15} className="text-clay-deep" />}
                        {g.s}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
