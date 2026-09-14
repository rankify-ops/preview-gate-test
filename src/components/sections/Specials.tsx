import { asset } from "@/lib/basePath";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { IconArrow } from "@/components/ui/Icons";
import { live } from "@/content/site";

export function Specials() {
  return (
    <section className="bg-paper pb-20 lg:pb-28">
      <div className="ctr grid gap-5 md:grid-cols-2">
        <Reveal>
          <div id="gift" className="relative flex min-h-[460px] flex-col justify-end overflow-hidden rounded-[30px] bg-ink p-8 text-white md:p-10">
            {/* The card itself */}
            <div
              aria-hidden
              className="absolute right-[-30px] top-10 flex aspect-[1.6] w-[300px] rotate-[-8deg] flex-col justify-between rounded-[20px] bg-[linear-gradient(135deg,#f6ece9,#d8b2a8)] p-6 shadow-[0_30px_60px_rgba(0,0,0,.35)] md:right-8"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset("/img/mark-ink.png")} alt="" className="size-12" />
              <span className="flex items-end justify-between text-ink">
                <span className="serif text-[26px] leading-none">Gift card</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Girls Getaways</span>
              </span>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-clay">Gift cards</p>
            <h3 className="serif mt-3 max-w-[14ch] text-[40px] leading-[1.02] text-white">Give the gift of a getaway</h3>
            <p className="mt-3 max-w-[38ch] text-[15px] leading-relaxed text-white/70">
              For the birthday girl, the bride-to-be, or the bestie who deserves a break.
            </p>
            <a href={live("/gift-cards")} className="btn btn-white mt-7 self-start">
              Shop gift cards <IconArrow size={16} />
            </a>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div id="specials" className="group relative flex min-h-[460px] flex-col justify-end overflow-hidden rounded-[30px] p-8 text-white md:p-10">
            <div className="plate plate-zoom absolute inset-0 -z-0">
              <Photo name="pk-sundara" alt="Sundara Beach House, Gerringong" sizes="(min-width: 768px) 50vw, 100vw" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent" />
            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">Secret specials</p>
              <h3 className="serif mt-3 max-w-[14ch] text-[40px] leading-[1.02] text-white">The Sisterhood hears first</h3>
              <p className="mt-3 max-w-[38ch] text-[15px] leading-relaxed text-white/80">
                Exclusive deals on selected getaways, released to GG Sisterhood members.
              </p>
              <a href="#sisterhood" className="btn btn-white mt-7">
                Unlock specials <IconArrow size={16} />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
