"use client";

import { useState } from "react";
import { asset } from "@/lib/basePath";
import { IconArrow, IconCheck } from "@/components/ui/Icons";
import { live } from "@/content/site";

export function Sisterhood() {
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");

  return (
    <section id="sisterhood" className="sec relative overflow-hidden bg-blush">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset("/img/mark-ink.png")} alt="" aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-[420px] opacity-[0.05]" />
      <div className="ctr relative text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/img/mark-ink.png")} alt="" className="mx-auto size-16" />
        <h2 className="h2 mx-auto mt-6 max-w-[16ch]">
          Join the GG <em className="italic text-clay-deep">Sisterhood</em>
        </h2>
        <p className="lede mx-auto mt-4 max-w-[40ch]">Receive exclusive deals, birthday offers &amp; free bubbly!</p>

        {done ? (
          <div className="load-in mx-auto mt-9 flex max-w-[520px] items-center justify-center gap-3 rounded-full bg-white px-6 py-4 text-[15px] text-ink shadow-s">
            <IconCheck size={19} className="text-clay-deep" /> Welcome to the Sisterhood{name ? `, ${name.split(" ")[0]}` : ""}!
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setDone(true);
            }}
            className="mx-auto mt-9 flex max-w-[620px] flex-col gap-2 rounded-[30px] bg-white p-2 shadow-s sm:flex-row sm:rounded-full"
          >
            <label className="sr-only" htmlFor="ss-name">First name</label>
            <input id="ss-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="First name" autoComplete="given-name" className="h-12 flex-1 rounded-full bg-transparent px-5 text-[15px] text-ink outline-none placeholder:text-ink-3" />
            <span aria-hidden className="hidden w-px self-stretch bg-rule sm:block" />
            <label className="sr-only" htmlFor="ss-email">Email</label>
            <input id="ss-email" required type="email" placeholder="Email address" autoComplete="email" className="h-12 flex-[1.4] rounded-full bg-transparent px-5 text-[15px] text-ink outline-none placeholder:text-ink-3" />
            <button type="submit" className="btn btn-ink h-12">
              Join now <IconArrow size={15} />
            </button>
          </form>
        )}

        <p className="mt-8 text-[14px] text-ink-2">
          Have a question for the GG Team?{" "}
          <a href={live("/contact-us")} className="text-ink underline underline-offset-4">
            Get in touch
          </a>
        </p>
      </div>
    </section>
  );
}
