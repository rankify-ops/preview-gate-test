import { asset } from "@/lib/basePath";
import { IconFacebook, IconInstagram } from "@/components/ui/Icons";
import { hub, live, site, states, STYLES } from "@/content/site";

// The live site's state landing pages.
const statePath: Record<string, string> = {
  nsw: "/nsw", qld: "/qld", vic: "/victoria", act: "/act", sa: "/south-australia", wa: "/western-australia", bali: "/bali",
};

export function Footer() {
  const cols = [
    { title: "Getaways", links: states.map((s) => ({ label: s.name, href: live(statePath[s.code]) })) },
    { title: "Styles", links: STYLES.map((s) => ({ label: s, href: "#getaways" })) },
    { title: "The GG Hub", links: hub.map((h) => ({ label: h.name, href: h.href })) },
    {
      title: "Help",
      links: [
        { label: "How it works", href: "#how" },
        { label: "Contact us", href: live("/contact-us") },
        { label: "Gift cards", href: live("/gift-cards") },
        { label: "Booking terms", href: live("/booking-terms-and-conditions") },
      ],
    },
  ];

  return (
    <footer className="overflow-hidden bg-ink text-white/70">
      <div className="ctr grid gap-12 pb-12 pt-20 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/img/mark-light.png")} alt="" className="size-14" />
          <p className="serif mt-5 max-w-[16ch] text-[30px] leading-[1.08] text-white">Effortless getaways with your best girls.</p>
          <div className="mt-6 flex gap-2">
            <a href={site.instagram} className="grid size-11 place-items-center rounded-full border border-white/20 text-white transition-colors hover:bg-white hover:text-ink" aria-label="Instagram">
              <IconInstagram size={18} />
            </a>
            <a href={site.facebook} className="grid size-11 place-items-center rounded-full border border-white/20 text-white transition-colors hover:bg-white hover:text-ink" aria-label="Facebook">
              <IconFacebook size={18} />
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:col-span-4">
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-clay">{c.title}</p>
              <ul className="mt-5 space-y-3 text-[14px]">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="link-u transition-colors hover:text-white">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <p aria-hidden className="serif -mb-[0.22em] select-none whitespace-nowrap text-center text-[19vw] leading-none text-white/[0.06]">
        Girls Getaways
      </p>

      <div className="border-t border-white/10">
        <div className="ctr flex flex-col gap-2 py-6 text-[12.5px] sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Girls Getaways</p>
          <p className="flex gap-4">
            <a href={live("/booking-terms-and-conditions")} className="link-u hover:text-white">
              Booking Terms &amp; Conditions
            </a>
            <span>Privacy Policy</span>
            <span>Website Terms</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
