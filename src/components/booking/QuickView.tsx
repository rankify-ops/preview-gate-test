"use client";

import { useEffect, useRef, useState } from "react";
import { fmtRange, nightsBetween, useBooking, useEscape, useLockScroll } from "@/lib/booking";
import { Photo } from "@/components/ui/Photo";
import {
  IconArrow, IconBack, IconCheck, IconClose, IconHeart, IconMinus, IconMoon, IconPlus, IconUsers,
} from "@/components/ui/Icons";
import { guestsLabel, live, placeLine, type Package } from "@/content/site";
import { Calendar } from "./Calendar";

const STEPS = ["Your trip", "Your details", "Payment"];
const OCCASIONS = ["Girls’ weekend", "Birthday", "Hens", "Just because"];
const money = (n: number) => `$${n.toLocaleString("en-AU")}`;

/**
 * Quick view + request-to-book, in one drawer (a bottom sheet on phones).
 * Keyed by package, so opening a different getaway starts a fresh request.
 */
export function QuickView() {
  const b = useBooking();
  const close = () => b.openQuick(null);
  useLockScroll(!!b.quick);
  useEscape(!!b.quick, close);
  if (!b.quick) return null;
  return <Drawer key={b.quick.slug} p={b.quick} onClose={close} />;
}

function Drawer({ p, onClose }: { p: Package; onClose: () => void }) {
  const b = useBooking();
  const minG = p.guests?.[0] ?? 2;
  const maxG = p.guests?.[1] ?? 40;

  const [step, setStep] = useState(0); // 0 overview · 1–3 request · 4 sent
  const [start, setStart] = useState(b.start);
  const [end, setEnd] = useState(b.end);
  const [guests, setGuests] = useState(() => Math.min(maxG, Math.max(minG, b.guests || 6)));
  const [form, setForm] = useState({ name: "", email: "", phone: "", occasion: OCCASIONS[0], notes: "" });
  const [pay, setPay] = useState<"split" | "full">("split");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [demo, setDemo] = useState(false);
  const body = useRef<HTMLDivElement>(null);

  // Braces matter: Chrome's scrollTo now returns a Promise, which React would take as a cleanup.
  useEffect(() => {
    body.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const saved = b.wish.includes(p.slug);
  const nights = nightsBetween(start, end);
  const total = p.priceFrom ? p.priceFrom * guests : 0;
  const emailOk = /^\S+@\S+\.\S+$/.test(form.email);
  const ready =
    step === 0 || step === 3 || (step === 1 && !!start && !!end) || (step === 2 && !!form.name.trim() && emailOk);

  async function submit() {
    setSending(true);
    setError("");
    const key = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;
    if (!key) {
      // Preview build: no form endpoint yet, so say so instead of pretending.
      setDemo(true);
      setSending(false);
      setStep(4);
      return;
    }
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: key,
          subject: `Booking request — ${p.title}`,
          from_name: "Girls Getaways website",
          package: `${p.title}${p.venue ? ` (${p.venue})` : ""} — ${placeLine(p)}`,
          dates: `${fmtRange(start, end)} (${nights} nights)`,
          girls: guests,
          payment: pay === "split" ? "Individual payments" : "One payment",
          ...form,
        }),
      });
      if (!res.ok) throw new Error();
      setStep(4);
    } catch {
      setError("That didn’t send — please try again, or contact the GG team directly.");
    } finally {
      setSending(false);
    }
  }

  const next = () => (step < 3 ? setStep(step + 1) : submit());
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={p.title}>
      <div className="scrim absolute inset-0 bg-ink/45" onClick={onClose} />
      <aside className="drawer absolute inset-x-0 bottom-0 top-[5svh] flex flex-col overflow-hidden rounded-t-[28px] bg-paper shadow-l md:inset-y-0 md:left-auto md:right-0 md:top-0 md:w-[560px] md:rounded-none">
        <div ref={body} className="flex-1 overflow-y-auto overscroll-contain">
          {/* Image header */}
          <div className="plate relative aspect-[16/10]">
            <Photo name={p.img} alt={p.title} sizes="(min-width: 768px) 560px, 100vw" priority />
            <span aria-hidden className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/40 to-transparent" />
            <div className="absolute inset-x-4 top-4 flex justify-between">
              <button type="button" onClick={step > 0 && step < 4 ? () => setStep(step - 1) : onClose} className="heart glass-dark" aria-label={step > 0 && step < 4 ? "Back" : "Close"}>
                {step > 0 && step < 4 ? <IconBack size={18} /> : <IconClose size={18} />}
              </button>
              <div className="flex gap-2">
                <button type="button" className="heart glass-dark" aria-pressed={saved} aria-label="Save" onClick={() => b.toggleWish(p.slug)}>
                  <IconHeart size={18} />
                </button>
                {step > 0 && step < 4 && (
                  <button type="button" onClick={onClose} className="heart glass-dark" aria-label="Close">
                    <IconClose size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 pb-10 pt-7 md:px-9">
            <p className="eyebrow">{placeLine(p)}</p>
            <h2 className="serif mt-2 text-[40px] leading-[1.02] text-ink">{p.title}</h2>
            {p.venue && <p className="mt-1.5 text-[14.5px] text-ink-2">{p.venue}</p>}

            {step === 0 && (
              <div className="load-in">
                <div className="mt-5 flex flex-wrap gap-2">
                  <Meta icon={<IconUsers size={15} />}>{guestsLabel(p)}</Meta>
                  {p.nights && <Meta icon={<IconMoon size={15} />}>{p.nights} nights</Meta>}
                  {p.styles.map((s) => (
                    <Meta key={s}>{s}</Meta>
                  ))}
                </div>
                <p className="lede mt-6">
                  {p.blurb ??
                    "A boutique girls’ getaway with every detail taken care of. The GG team will send the full itinerary and inclusions with your quote."}
                </p>

                <div className="mt-8 rounded-[22px] bg-blush p-6">
                  <p className="eyebrow">Taken care of</p>
                  <ul className="mt-4 space-y-3 text-[14.5px] text-ink">
                    {[
                      "We price up your package for your group",
                      "Every inclusion booked for you",
                      "Individual payment options — no chasing money",
                    ].map((t) => (
                      <li key={t} className="flex gap-3">
                        <IconCheck size={18} className="mt-0.5 flex-none text-clay-deep" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <a href={live(p.path)} className="link-u mt-6 inline-flex items-center gap-2 text-[13.5px] text-ink" target="_blank" rel="noreferrer">
                  Full itinerary on girlsgetaways.com.au <IconArrow size={14} />
                </a>
              </div>
            )}

            {step >= 1 && step <= 3 && (
              <div className="mt-7">
                <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em]">
                  {STEPS.map((s, i) => (
                    <span key={s} className={i + 1 <= step ? "text-ink" : "text-ink-3"}>
                      {i + 1}. {s}
                    </span>
                  ))}
                </div>
                <div className="mt-3 h-[3px] rounded-full bg-rule">
                  <div className="steps-bar h-full rounded-full bg-clay" style={{ width: `${(step / 3) * 100}%` }} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div key="s1" className="load-in mt-8">
                <h3 className="serif text-[28px] text-ink">When are you going?</h3>
                <div className="mt-5">
                  <Calendar start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e); }} months={1} />
                </div>
                <p className="mt-3 text-[13.5px] text-ink-2">
                  {nights ? `${fmtRange(start, end)} · ${nights} night${nights > 1 ? "s" : ""}` : "Choose check-in, then check-out."}
                </p>

                <div className="mt-8 flex items-center justify-between border-t border-rule pt-6">
                  <div>
                    <p className="text-[15px] text-ink">How many girls?</p>
                    <p className="text-[13px] text-ink-3">{p.guests ? `This getaway suits ${guestsLabel(p)}` : "Any group size"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" className="stepper" disabled={guests <= minG} onClick={() => setGuests(guests - 1)} aria-label="Fewer girls">
                      <IconMinus size={16} />
                    </button>
                    <span className="w-7 text-center text-[17px] tabular-nums text-ink">{guests}</span>
                    <button type="button" className="stepper" disabled={guests >= maxG} onClick={() => setGuests(guests + 1)} aria-label="More girls">
                      <IconPlus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div key="s2" className="load-in mt-8 space-y-4">
                <h3 className="serif text-[28px] text-ink">Who’s organising?</h3>
                <Field label="Your name">
                  <input className="field" autoComplete="name" value={form.name} onChange={set("name")} />
                </Field>
                <Field label="Email">
                  <input className="field" type="email" autoComplete="email" value={form.email} onChange={set("email")} />
                </Field>
                <Field label="Mobile (optional)">
                  <input className="field" type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} />
                </Field>
                <Field label="What are we celebrating?">
                  <div className="flex flex-wrap gap-2">
                    {OCCASIONS.map((o) => (
                      <button key={o} type="button" className="chip" aria-pressed={form.occasion === o} onClick={() => setForm({ ...form, occasion: o })}>
                        {o}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Anything else? (optional)">
                  <textarea className="field h-24 py-3" value={form.notes} onChange={set("notes")} placeholder="Dietaries, surprises, the bride’s favourite bubbles…" />
                </Field>
              </div>
            )}

            {step === 3 && (
              <div key="s3" className="load-in mt-8">
                <h3 className="serif text-[28px] text-ink">How would you like to pay?</h3>
                <div className="mt-5 space-y-3">
                  {(
                    [
                      ["split", "Individual payments", "Each girl pays her own share — we send the links and chase them, not you."],
                      ["full", "One payment", "The organiser pays for the whole group in one go."],
                    ] as const
                  ).map(([k, t, d]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setPay(k)}
                      aria-pressed={pay === k}
                      className={`flex w-full gap-4 rounded-[20px] border p-5 text-left transition-colors ${
                        pay === k ? "border-ink bg-sand" : "border-rule hover:border-rule-2"
                      }`}
                    >
                      <span className={`mt-0.5 grid size-5 flex-none place-items-center rounded-full border ${pay === k ? "border-ink bg-ink" : "border-rule-2"}`}>
                        {pay === k && <span className="size-1.5 rounded-full bg-white" />}
                      </span>
                      <span>
                        <span className="block text-[15px] text-ink">{t}</span>
                        <span className="mt-1 block text-[13.5px] leading-relaxed text-ink-2">{d}</span>
                        {k === "split" && total > 0 && (
                          <span className="mt-2 block text-[13px] text-ink">
                            {money(p.priceFrom!)} each · {guests} girls
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-6 space-y-2 rounded-[20px] bg-blush p-5 text-[14px]">
                  <Row k="Getaway" v={p.title} />
                  <Row k="Dates" v={`${fmtRange(start, end)} · ${nights} nights`} />
                  <Row k="Girls" v={String(guests)} />
                  <Row k="Organiser" v={form.name} />
                </div>
                <p className="mt-4 text-[12.5px] leading-relaxed text-ink-3">
                  Nothing is charged yet. The GG team confirms availability and your final price before any payment.
                </p>
                {error && <p className="mt-3 text-[13.5px] text-clay-ink">{error}</p>}
              </div>
            )}

            {step === 4 && (
              <div className="load-in mt-8 text-center">
                <span className="mx-auto grid size-16 place-items-center rounded-full bg-clay text-white">
                  <IconCheck size={28} />
                </span>
                <h3 className="serif mt-5 text-[34px] text-ink">Request sent, {form.name.split(" ")[0] || "babe"}!</h3>
                <p className="lede mx-auto mt-3 max-w-[40ch]">
                  The GG team will check availability for {fmtRange(start, end)} and email your tailored quote to {form.email}.
                </p>
                {demo && (
                  <p className="mx-auto mt-5 max-w-[42ch] rounded-2xl bg-sand px-4 py-3 text-[12.5px] text-ink-3">
                    Preview build — booking requests aren’t connected to an inbox yet, so nothing was sent.
                  </p>
                )}
                <button type="button" onClick={onClose} className="btn btn-ink mt-8">
                  Keep browsing
                </button>
              </div>
            )}
          </div>
        </div>

        {step < 4 && (
          <div className="flex flex-none items-center justify-between gap-4 border-t border-rule bg-white px-6 py-4 pb-[max(16px,env(safe-area-inset-bottom))] md:px-9">
            <div className="min-w-0">
              {p.priceFrom ? (
                <>
                  <p className="text-ink">
                    <span className="serif text-[28px] leading-none">{money(p.priceFrom)}</span>
                    <span className="text-[13px] text-ink-3"> pp</span>
                  </p>
                  <p className="truncate text-[12.5px] text-ink-3">
                    {step > 0 ? `est. ${money(total)} for ${guests} girls` : "From, per person"}
                  </p>
                </>
              ) : (
                <>
                  <p className="whitespace-nowrap text-[15px] text-ink">Price on request</p>
                  <p className="truncate text-[12.5px] text-ink-3">We’ll price it for your group</p>
                </>
              )}
            </div>
            <button type="button" onClick={next} disabled={!ready || sending} className="btn btn-ink flex-none px-5 disabled:cursor-not-allowed disabled:opacity-40 sm:px-[26px]">
              {sending ? "Sending…" : ["Request to book", "Continue", "Continue", "Send request"][step]}
              {!sending && <IconArrow size={16} />}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

function Meta({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-rule px-3 text-[12.5px] text-ink-2">
      {icon}
      {children}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] text-ink-2">{label}</span>
      {children}
    </label>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <p className="flex justify-between gap-4">
      <span className="text-ink-3">{k}</span>
      <span className="truncate text-right text-ink">{v}</span>
    </p>
  );
}
