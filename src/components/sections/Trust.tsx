import { IconCheck, IconPin, IconSparkle, IconWallet } from "@/components/ui/Icons";

// Each line is a claim the live site already makes.
const items = [
  { icon: IconPin, t: "100+ packages", d: "Boutique getaways Australia-wide" },
  { icon: IconCheck, t: "We book it all", d: "Every inclusion organised for you" },
  { icon: IconWallet, t: "Individual payments", d: "No chasing the group for money" },
  { icon: IconSparkle, t: "Made for girl time", d: "Birthdays, hens & long weekends" },
];

export function Trust() {
  return (
    <section className="border-b border-rule bg-paper">
      <div className="ctr grid grid-cols-2 gap-x-6 gap-y-7 py-9 lg:grid-cols-4 lg:py-11">
        {items.map(({ icon: I, t, d }) => (
          <div key={t} className="flex items-start gap-3.5">
            <span className="grid size-11 flex-none place-items-center rounded-full bg-blush text-clay-ink">
              <I size={19} />
            </span>
            <div>
              <p className="text-[14.5px] font-medium text-ink">{t}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-ink-3">{d}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
