"use client";

import { useBooking } from "@/lib/booking";
import { asset } from "@/lib/basePath";
import { Reveal } from "@/components/ui/Reveal";
import { experiences } from "@/content/site";

export function Experiences() {
  const b = useBooking();
  return (
    <section className="sec bg-blush">
      <div className="ctr">
        <div className="text-center">
          <p className="eyebrow">What we do</p>
          <h2 className="h2 mx-auto mt-3 max-w-[18ch]">
            However your girls like to <em className="italic text-clay-deep">unwind</em>
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {experiences.map((e, i) => (
            <Reveal key={e.name} delay={(i % 5) * 70}>
              <button
                type="button"
                onClick={b.goToResults}
                className="group flex w-full flex-col items-center rounded-[24px] bg-paper/70 px-4 py-8 text-center transition-all duration-500 hover:-translate-y-1 hover:bg-white hover:shadow-[var(--shadow)]"
              >
                <span className="size-20 overflow-hidden rounded-full bg-clay transition-transform duration-700 group-hover:rotate-[-8deg]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset(`/img/${e.icon}.png`)} alt="" className="size-full" />
                </span>
                <span className="serif mt-4 text-[22px] leading-tight text-ink">{e.name}</span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
