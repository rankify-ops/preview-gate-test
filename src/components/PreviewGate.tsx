"use client";

/*
 * PreviewGate — the shared 24-hour home-page preview lock.
 * Canonical copy lives in rankify-previews/client/PreviewGate.tsx; each site
 * gets a verbatim copy at src/components/PreviewGate.tsx. Edit the canonical
 * one and re-copy, so every site stays identical.
 *
 * Client URL (/):          blurred lock → intro → email → page + countdown pill.
 * Staff URL (staffPath/):  never locked, shows a status bar with Reset / Set client.
 *
 * State lives in the rankify-previews Vercel backend, so the clock is shared by
 * everyone who opens the URL. Styles are a plain <style> string on purpose: it
 * bypasses each site's Tailwind/Lightning CSS pipeline (which strips
 * backdrop-filter) and keeps the gate looking the same on every site.
 *
 * A site with its own fixed bottom bar sets --pg-bottom-offset (e.g. 76px under
 * the breakpoint where that bar shows) so the pill and popup sit above it.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const API = "https://rankify-previews.vercel.app/api/preview";
// Lives on the rankify.com.au checkout server, which holds the Stripe key and
// the webhook that records the payment in the CRM.
const CHECKOUT_API = "https://rankify-com-au.vercel.app/api/preview-checkout";

type State = "loading" | "error" | "unconfigured" | "ready" | "active" | "expired" | "paid";

type Status = {
  state: State;
  hours?: number;
  startedAt?: string;
  expiresAt?: string;
  now?: string;
  paidAt?: string;
  record?: {
    paidAt?: string | null;
    email: string;
    label: string | null;
    hours: number;
    startedAt: string | null;
    expiresAt: string | null;
    startedFrom: string | null;
  };
};

type Props = {
  /** Backend slug, e.g. "girls-getaways". */
  site: string;
  /** Unlocked staff route, without basePath, e.g. "/staff-k7x2". */
  staffPath: string;
  /** Business name shown in the popup. */
  clientName: string;
  /** Optional button on the expired screen. */
  expiredCta?: { label: string; href: string };
};

export function PreviewGate({ site, staffPath, clientName, expiredCta }: Props) {
  const pathname = usePathname() || "/";
  const isStaff = pathname.replace(/\/$/, "").endsWith(staffPath.replace(/\/$/, ""));

  const [status, setStatus] = useState<Status>({ state: "loading" });
  // Server clock minus local clock, so a wrong laptop clock can't stretch the timer.
  const skew = useRef(0);

  const apply = useCallback((s: Status) => {
    if (s.now) skew.current = new Date(s.now).getTime() - Date.now();
    setStatus(s);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`${API}?site=${encodeURIComponent(site)}`, { cache: "no-store" });
      if (!r.ok) throw new Error(String(r.status));
      apply(await r.json());
    } catch {
      setStatus((prev) => (prev.state === "active" ? prev : { state: "error" }));
    }
  }, [site, apply]);

  useEffect(() => {
    refresh();
    // Re-check each minute so a staff reset or the expiry lands without a reload.
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  // Back from Stripe. The page only unlocks once the server says "paid" (set by
  // the Stripe webhook), so ?checkout=success on its own unlocks nothing.
  const [returning, setReturning] = useState<"no" | "confirming" | "thanks" | "slow" | "done">("no");
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("checkout") !== "success") return;
    url.searchParams.delete("checkout");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    setReturning("confirming");
  }, []);

  useEffect(() => {
    if (returning !== "confirming") return;
    if (status.state === "paid") return setReturning("thanks");
    // The webhook usually lands within a couple of seconds of the redirect.
    let tries = 0;
    const id = setInterval(() => {
      if (++tries > 20) setReturning("slow");
      else refresh();
    }, 2500);
    return () => clearInterval(id);
  }, [returning, status.state, refresh]);

  const showReturn = returning === "confirming" || returning === "thanks" || returning === "slow";
  const locked = !isStaff && (showReturn || (status.state !== "active" && status.state !== "paid"));

  useEffect(() => {
    const root = document.documentElement;
    if (locked) root.style.overflow = "hidden";
    return () => {
      root.style.overflow = "";
    };
  }, [locked]);

  return (
    <>
      <style>{CSS}</style>
      {isStaff ? (
        <StaffBar site={site} status={status} apply={apply} refresh={refresh} skew={skew} />
      ) : showReturn ? (
        <Thanks clientName={clientName} phase={returning as "confirming" | "thanks" | "slow"} onView={() => setReturning("done")} />
      ) : status.state === "paid" ? null : locked ? (
        <Lock
          site={site}
          clientName={clientName}
          status={status}
          apply={apply}
          refresh={refresh}
          expiredCta={expiredCta}
        />
      ) : (
        <Active site={site} clientName={clientName} expiresAt={status.expiresAt!} skew={skew} onExpire={refresh} expiredCta={expiredCta} />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ lock */

function Lock({
  site,
  clientName,
  status,
  apply,
  refresh,
  expiredCta,
}: {
  site: string;
  clientName: string;
  status: Status;
  apply: (s: Status) => void;
  refresh: () => void;
  expiredCta?: Props["expiredCta"];
}) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 1) setTimeout(() => emailRef.current?.focus({ preventScroll: true }), 450);
  }, [step]);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ site, action: "start", email }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.status === 403) setError("That email doesn't match the one we have for this preview.");
      else if (r.status === 429) setError("Too many attempts. Please wait 15 minutes and try again.");
      else if (!r.ok) setError("Something went wrong. Please try again.");
      else apply(data);
    } catch {
      setError("Couldn't connect. Check your internet and try again.");
    } finally {
      setBusy(false);
    }
  }

  const s = status.state;
  const hours = status.hours ?? 48;

  return (
    <div className="pg-overlay" role="dialog" aria-modal="true" aria-labelledby="pg-title">
      <div className="pg-card">
        <div className="pg-brand">
          <span className="pg-dot" />
          Preview · {clientName}
        </div>

        {s === "loading" && (
          <div className="pg-center">
            <span className="pg-spinner" aria-label="Loading" />
          </div>
        )}

        {s === "error" && (
          <div className="pg-pane">
            <h2 id="pg-title" className="pg-h">We couldn&rsquo;t load your preview.</h2>
            <p className="pg-p">Please check your connection and try again.</p>
            <button className="pg-btn" onClick={refresh}>
              <span>Try again</span>
            </button>
          </div>
        )}

        {s === "unconfigured" && (
          <div className="pg-pane">
            <h2 id="pg-title" className="pg-h">Your preview is almost ready.</h2>
            <p className="pg-p">We&rsquo;re putting the finishing touches on your home page. We&rsquo;ll let you know as soon as it&rsquo;s ready.</p>
          </div>
        )}

        {s === "expired" && <Offer mode="ended" site={site} expiredCta={expiredCta} />}

        {s === "ready" && (
          <div className="pg-viewport">
            <div className="pg-track" style={{ transform: `translateX(${step * -50}%)` }}>
              <div className="pg-pane" aria-hidden={step !== 0}>
                <Sender />
                <h2 id="pg-title" className="pg-h">Hey, Thomas from Rankify here. Your home page preview is ready!</h2>
                <p className="pg-p">
                  Before you jump in: we build these previews for free, so each one is only open for{" "}
                  <strong>{formatHours(hours)}</strong>. The timer starts the moment you open it, so
                  pick a time when you can have a proper look.
                </p>
                <button className="pg-btn" onClick={() => setStep(1)} tabIndex={step === 0 ? 0 : -1}>
                  <span>Next</span>
                </button>
              </div>

              <form className="pg-pane" onSubmit={start} aria-hidden={step !== 1}>
                <div className="pg-label">Step 2 of 2</div>
                <h2 className="pg-h">Confirm it&rsquo;s you.</h2>
                <p className="pg-p">Enter the email address we sent your preview to, and your {formatHours(hours)} will start.</p>
                <input
                  ref={emailRef}
                  className="pg-input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  placeholder="you@business.com.au"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  tabIndex={step === 1 ? 0 : -1}
                />
                {error && <p className="pg-error" role="alert">{error}</p>}
                <button className="pg-btn" type="submit" disabled={busy} tabIndex={step === 1 ? 0 : -1}>
                  <span>{busy ? "Opening…" : "Show me my homepage!"}</span>
                </button>
                <button type="button" className="pg-back" onClick={() => setStep(0)} tabIndex={step === 1 ? 0 : -1}>
                  ← Back
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type Quote = {
  buildCents: number;
  hostingCents: number;
  now: string;
  offer: { endsAt: string; buildCents: number; hostingFirstYearCents: number; savingCents: number } | null;
};

/** Prices from the checkout server, incl. the live offer; re-prices when the offer runs out. */
function useQuote(site: string) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const skew = useRef(0);

  const loadQuote = useCallback(() => {
    fetch(`${CHECKOUT_API}?site=${encodeURIComponent(site)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((q: Quote | null) => {
        if (!q) return;
        skew.current = new Date(q.now).getTime() - Date.now();
        setQuote(q);
      })
      .catch(() => {});
  }, [site]);

  useEffect(loadQuote, [loadQuote]);

  // When the offer runs out on screen, re-price from the server.
  const offerMs = useRemaining(quote?.offer?.endsAt, skew);
  useEffect(() => {
    if (quote?.offer && offerMs === 0) loadQuote();
  }, [offerMs, quote, loadQuote]);

  return { quote, offerMs };
}

/**
 * The price card + checkout. "ended" sits inside the lock screen once the
 * preview is over; "early" is the same card opened from the nudge or the
 * countdown pill while the preview is still running.
 */
function Offer({
  site,
  mode,
  expiredCta,
}: {
  site: string;
  mode: "ended" | "early";
  expiredCta?: Props["expiredCta"];
}) {
  const { quote, offerMs } = useQuote(site);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(CHECKOUT_API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ site, returnUrl: window.location.origin + window.location.pathname }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data.url) throw new Error();
      window.location.href = data.url;
    } catch {
      setError("Couldn't open checkout. Please try again.");
      setBusy(false);
    }
  }

  const offer = quote?.offer;
  const fullToday = quote ? quote.buildCents + quote.hostingCents : 0;

  return (
    <div className="pg-pane">
      <Sender />
      <h2 id="pg-title" className="pg-h">{mode === "ended" ? "Your preview has ended." : "Love your new home page?"}</h2>
      <p className="pg-p">
        {mode === "ended"
          ? offer
            ? <>Loved what you saw? Go ahead before the offer ends and save <strong>{aud(offer.savingCents)}</strong> on your new website.</>
            : <>Loved what you saw? Go ahead today and we&rsquo;ll turn your preview into your full website.</>
          : offer
            ? <>Go ahead before the offer ends and we&rsquo;ll take <strong>{aud(offer.savingCents)}</strong> off your new website.</>
            : <>Go ahead today and we&rsquo;ll turn your preview into your full website.</>}
      </p>

      {offer && offerMs !== null && offerMs > 0 && (
        <div className="pg-offer">
          <span className="pg-offer-tag">{aud(offer.savingCents)} OFF</span>
          <span className="pg-offer-label">Offer ends in</span>
          <span className="pg-offer-time">{formatClock(offerMs)}</span>
        </div>
      )}

      {quote && (
        <dl className="pg-quote">
          <dt>Website build</dt>
          <dd>
            {offer && <s>{aud(quote.buildCents)}</s>}
            {aud(offer ? offer.buildCents : quote.buildCents)}
          </dd>
          <dt>Hosting, first year</dt>
          <dd>
            {offer && <s>{aud(quote.hostingCents)}</s>}
            {aud(offer ? offer.hostingFirstYearCents : quote.hostingCents)}
          </dd>
          {offer && (
            <>
              <dt className="pg-quote-save">You save</dt>
              <dd className="pg-quote-save">{aud(offer.savingCents)}</dd>
            </>
          )}
          <dt className="pg-quote-total">Due today</dt>
          <dd className="pg-quote-total">
            {offer && <s>{aud(fullToday)}</s>}
            {aud(offer ? offer.buildCents + offer.hostingFirstYearCents : fullToday)}
          </dd>
        </dl>
      )}

      {error && <p className="pg-error" role="alert">{error}</p>}
      <button className="pg-btn" onClick={checkout} disabled={busy || !quote}>
        <span>{busy ? "Opening checkout…" : offer ? `Go ahead and save ${aud(offer.savingCents)}` : "Go ahead with my website"}</span>
      </button>
      {expiredCta && (
        <a className="pg-btn pg-btn-ghost" href={expiredCta.href}>
          <span>{expiredCta.label}</span>
        </a>
      )}
      <p className="pg-fine">
        Secure checkout with Stripe.
        {quote ? (offer ? ` Hosting renews at ${aud(quote.hostingCents)} per year from your second year.` : ` Hosting renews at ${aud(quote.hostingCents)} per year.`) : ""}
      </p>
    </div>
  );
}

function Thanks({ clientName, phase, onView }: { clientName: string; phase: "confirming" | "thanks" | "slow"; onView: () => void }) {
  if (phase !== "thanks") {
    return (
      <div className="pg-overlay" role="dialog" aria-modal="true" aria-labelledby="pg-title">
        <div className="pg-card">
          <div className="pg-brand">
            <span className="pg-dot" />
            Preview · {clientName}
          </div>
          <div className="pg-pane">
            <Sender />
            <h2 id="pg-title" className="pg-h">{phase === "confirming" ? "Confirming your payment…" : "Still confirming your payment."}</h2>
            <p className="pg-p">
              {phase === "confirming"
                ? "This only takes a moment."
                : "Stripe is taking a little longer than usual. Your payment is safe, so refresh this page in a minute to view your home page."}
            </p>
            {phase === "confirming" && <span className="pg-spinner" aria-label="Loading" />}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="pg-overlay" role="dialog" aria-modal="true" aria-labelledby="pg-title">
      <div className="pg-card">
        <div className="pg-brand">
          <span className="pg-dot pg-dot-active" />
          Confirmed · {clientName}
        </div>
        <div className="pg-pane">
          <Sender />
          <h2 id="pg-title" className="pg-h">You&rsquo;re all set. Thank you!</h2>
          <p className="pg-p">Your payment went through and a receipt is on its way to your inbox. I&rsquo;ll be in touch shortly to get your new website started.</p>
          <button className="pg-btn" onClick={onView}>
            <span>View my home page</span>
          </button>
        </div>
      </div>
    </div>
  );
}

const aud = (cents: number) =>
  (cents / 100).toLocaleString("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0, maximumFractionDigits: 2 });

function Sender() {
  return (
    <div className="pg-sender">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pg-avatar" src={THOMAS} alt="Thomas Flood" width={48} height={48} />
      <div>
        <div className="pg-sender-name">Thomas Flood</div>
        <div className="pg-sender-role">High Performance Web Developer</div>
      </div>
    </div>
  );
}

// Thomas's headshot, inlined (~2.5KB) so the gate has no extra file to host per site.
const THOMAS = "data:image/webp;base64,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";

/* ---------------------------------------------------------------- active */

/**
 * While the preview is running. On the first unlock in this browser the timer
 * stays out of the way: once they've scrolled 20% of the page, Thomas pops up
 * bottom-right with the offer. After that (or on any later visit) it's the
 * countdown pill, which re-opens the offer when tapped.
 */
function Active({
  site,
  clientName,
  expiresAt,
  skew,
  onExpire,
  expiredCta,
}: {
  site: string;
  clientName: string;
  expiresAt: string;
  skew: React.RefObject<number>;
  onExpire: () => void;
  expiredCta?: Props["expiredCta"];
}) {
  const nudgeKey = `rankify-preview-nudge-${site}`;
  const [phase, setPhase] = useState<"waiting" | "nudge" | "pill">("waiting");
  const [sheet, setSheet] = useState(false);
  const { quote, offerMs } = useQuote(site);

  useEffect(() => {
    try {
      if (localStorage.getItem(nudgeKey)) setPhase("pill");
    } catch {}
  }, [nudgeKey]);

  useEffect(() => {
    if (phase !== "waiting" || !quote) return;
    const check = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0 || window.scrollY / max < 0.2) return;
      setPhase("nudge");
      try {
        localStorage.setItem(nudgeKey, "1");
      } catch {}
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, [phase, quote, nudgeKey]);

  useEffect(() => {
    if (!sheet) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheet(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [sheet]);

  const offer = quote?.offer && offerMs ? quote.offer : null;
  const hoursLeft = offerMs ? Math.max(1, Math.round(offerMs / 3_600_000)) : 0;

  return (
    <>
      <Countdown
        expiresAt={expiresAt}
        skew={skew}
        onExpire={onExpire}
        hidden={phase !== "pill" || sheet}
        onOpen={() => setSheet(true)}
      />

      {phase === "nudge" && !sheet && (
        <div className="pg-nudge" role="dialog" aria-labelledby="pg-nudge-title">
          <button className="pg-nudge-x" onClick={() => setPhase("pill")} aria-label="Close">
            ×
          </button>
          <div className="pg-nudge-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="pg-avatar pg-avatar-sm" src={THOMAS} alt="" width={36} height={36} />
            <div>
              <div className="pg-sender-name">Thomas Flood</div>
              <div className="pg-sender-role">High Performance Web Developer</div>
            </div>
          </div>
          <p id="pg-nudge-title" className="pg-nudge-text">
            <strong>Hey, hope you&rsquo;re liking your new home page!</strong>{" "}
            {offer ? (
              <>
                Go ahead within the next {hoursLeft} hours and we&rsquo;ll take <strong>{aud(offer.savingCents)} off</strong> your website.
              </>
            ) : (
              <>If you&rsquo;d like to go ahead, you can lock in your new website here.</>
            )}
          </p>
          <div className="pg-nudge-actions">
            <button
              className="pg-mini"
              onClick={() => {
                setPhase("pill");
                setSheet(true);
              }}
            >
              {offer ? `Claim ${aud(offer.savingCents)} off` : "Go ahead"}
            </button>
            <button className="pg-back pg-back-inline" onClick={() => setPhase("pill")}>
              Maybe later
            </button>
          </div>
        </div>
      )}

      {sheet && (
        <div
          className="pg-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pg-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSheet(false);
          }}
        >
          <div className="pg-card">
            <div className="pg-brand">
              <span className="pg-dot pg-dot-live" />
              Preview · {clientName}
              <button className="pg-card-x" onClick={() => setSheet(false)} aria-label="Close">
                ×
              </button>
            </div>
            <Offer mode="early" site={site} expiredCta={expiredCta} />
          </div>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------- countdown */

function useRemaining(expiresAt: string | undefined | null, skew: React.RefObject<number>) {
  const [ms, setMs] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) return setMs(null);
    const end = new Date(expiresAt).getTime();
    const tick = () => setMs(Math.max(0, end - (Date.now() + (skew.current ?? 0))));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, skew]);
  return ms;
}

function Countdown({
  expiresAt,
  skew,
  onExpire,
  hidden,
  onOpen,
}: {
  expiresAt: string;
  skew: React.RefObject<number>;
  onExpire: () => void;
  hidden?: boolean;
  onOpen?: () => void;
}) {
  const ms = useRemaining(expiresAt, skew);
  const fired = useRef(false);
  useEffect(() => {
    if (ms === 0 && !fired.current) {
      fired.current = true;
      onExpire();
    }
  }, [ms, onExpire]);
  const drag = useDraggableCorner(onOpen);
  if (ms === null || hidden) return null;
  return (
    <div
      ref={drag.ref}
      className={`pg-pill pg-pill-${drag.corner}${drag.dragging ? " pg-pill-dragging" : ""}`}
      style={drag.style}
      role="timer"
      aria-live="off"
      title={onOpen ? "Tap for your offer · drag to move" : "Drag to move"}
      {...drag.handlers}
    >
      <span className="pg-grip" aria-hidden="true" />
      <span className="pg-dot pg-dot-live" />
      <span className="pg-pill-label">Preview ends in</span>
      <span className="pg-pill-time">{formatClock(ms)}</span>
    </div>
  );
}

type Corner = "tl" | "tr" | "bl" | "br";
const CORNER_STORAGE = "rankify-preview-pill-corner";

/**
 * Drag the pill anywhere; on release it snaps to the nearest corner and that
 * corner is remembered per browser, so a client who moves it off their menu
 * button doesn't have to do it again on every visit.
 */
function useDraggableCorner(onTap?: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const [corner, setCorner] = useState<Corner>("br");
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const start = useRef<{ px: number; py: number; left: number; top: number } | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(CORNER_STORAGE);
    } catch {}
    if (saved === "tl" || saved === "tr" || saved === "bl" || saved === "br") setCorner(saved);
    else if (window.innerWidth < 768) setCorner("bl");
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    start.current = { px: e.clientX, py: e.clientY, left: r.left, top: r.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = start.current;
    const el = ref.current;
    if (!st || !el) return;
    const dx = e.clientX - st.px;
    const dy = e.clientY - st.py;
    if (!pos && Math.hypot(dx, dy) < 4) return; // a tap, not a drag
    const maxX = window.innerWidth - el.offsetWidth;
    const maxY = window.innerHeight - el.offsetHeight;
    setPos({ x: Math.min(Math.max(st.left + dx, 0), maxX), y: Math.min(Math.max(st.top + dy, 0), maxY) });
  };

  const onPointerUp = () => {
    const el = ref.current;
    if (pos && el) {
      const cx = pos.x + el.offsetWidth / 2;
      const cy = pos.y + el.offsetHeight / 2;
      const next = `${cy < window.innerHeight / 2 ? "t" : "b"}${cx < window.innerWidth / 2 ? "l" : "r"}` as Corner;
      setCorner(next);
      try {
        localStorage.setItem(CORNER_STORAGE, next);
      } catch {}
    } else if (start.current) {
      onTap?.();
    }
    start.current = null;
    setPos(null);
  };

  return {
    ref,
    corner,
    dragging: pos !== null,
    style: pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" } : undefined,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  };
}

/* ------------------------------------------------------------- staff bar */

function StaffBar({
  site,
  status,
  apply,
  refresh,
  skew,
}: {
  site: string;
  status: Status;
  apply: (s: Status) => void;
  refresh: () => void;
  skew: React.RefObject<number>;
}) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");
  const [msg, setMsg] = useState("");
  const [full, setFull] = useState<Status["record"] | null>(null);

  const admin = useCallback(
    async (body: Record<string, unknown>) => {
      setMsg("");
      const r = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ site, ...body }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg(data.error || "Request failed.");
        return null;
      }
      setFull(data.record ?? null);
      apply(data);
      return data;
    },
    [site, apply],
  );

  // Load the full record (with email) whenever the public status changes.
  useEffect(() => {
    if (status.state !== "loading") admin({ action: "status" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.state, status.startedAt]);

  const ms = useRemaining(status.state === "active" ? status.expiresAt : null, skew);

  const badge: Record<State, string> = {
    loading: "Loading",
    error: "Offline",
    unconfigured: "Not set up",
    ready: "Not started",
    active: "Live",
    expired: "Expired",
    paid: "Paid",
  };

  if (!open) {
    return (
      <button className="pg-staff-tab" onClick={() => setOpen(true)}>
        <span className={`pg-dot pg-dot-${status.state}`} /> Staff
      </button>
    );
  }

  return (
    <div className="pg-staff">
      <div className="pg-staff-row">
        <span className="pg-label pg-label-inline">Staff view</span>
        <span className="pg-badge">
          <span className={`pg-dot pg-dot-${status.state}`} />
          {badge[status.state]}
        </span>
        {status.state === "active" && ms !== null && <span className="pg-staff-time">{formatClock(ms)} left</span>}
        <span className="pg-staff-spacer" />
        <button className="pg-staff-x" onClick={() => setOpen(false)} aria-label="Minimise">
          –
        </button>
      </div>

          <dl className="pg-staff-dl">
            <dt>Client</dt>
            <dd>{full?.email ?? "—"}{full?.label ? ` · ${full.label}` : ""}</dd>
            <dt>Started</dt>
            <dd>{full?.startedAt ? `${formatWhen(full.startedAt)}${full.startedFrom ? ` · ${full.startedFrom}` : ""}` : "—"}</dd>
            <dt>{full?.paidAt ? "Paid" : "Ends"}</dt>
            <dd>{full?.paidAt ? `${formatWhen(full.paidAt)} · unlocked for good` : full?.expiresAt ? formatWhen(full.expiresAt) : `${formatHours(full?.hours ?? 48)} after they start`}</dd>
          </dl>

          {editing ? (
            <form
              className="pg-staff-row pg-wrap"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await admin({ action: "configure", email, label: label || undefined })) setEditing(false);
              }}
            >
              <input className="pg-input pg-input-sm" type="email" required placeholder="Client email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className="pg-input pg-input-sm" placeholder="Business name (as in CRM)" value={label} onChange={(e) => setLabel(e.target.value)} />
              <button className="pg-mini" type="submit">Save</button>
              <button className="pg-mini pg-mini-ghost" type="button" onClick={() => setEditing(false)}>Cancel</button>
            </form>
          ) : (
            <div className="pg-staff-row">
              <button
                className="pg-mini"
                onClick={() => {
                  setEmail(full?.email ?? "");
                  setLabel(full?.label ?? "");
                  setEditing(true);
                }}
              >
                {full ? "Change client" : "Set client"}
              </button>
              {full && (
                <button
                  className="pg-mini pg-mini-ghost"
                  onClick={() => {
                    if (confirm("Reset the timer? The client will see the lock screen again.")) admin({ action: "reset" });
                  }}
                >
                  Reset timer
                </button>
              )}
              <button className="pg-mini pg-mini-ghost" onClick={refresh}>Refresh</button>
            </div>
          )}
      {msg && <p className="pg-error">{msg}</p>}
    </div>
  );
}

/* --------------------------------------------------------------- helpers */

function formatClock(ms: number) {
  const t = Math.floor(ms / 1000);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatHours(h: number) {
  if (h < 1) return `${Math.round(h * 60)} minutes`;
  return h === 1 ? "1 hour" : `${Math.round(h * 10) / 10} hours`;
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-AU", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

/* ------------------------------------------------------------------- css */

const CSS = `
.pg-overlay,.pg-pill,.pg-staff,.pg-staff-tab{
  --pg-ink:#16161a;--pg-muted:#5d5d66;--pg-line:rgba(22,22,26,.1);--pg-accent:#16161a;
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Inter,Roboto,sans-serif;
  color:var(--pg-ink);-webkit-font-smoothing:antialiased;letter-spacing:0;line-height:1.5;
  box-sizing:border-box;
}
.pg-overlay *,.pg-pill *,.pg-staff *,.pg-staff-tab *{box-sizing:border-box}
.pg-overlay{
  position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;
  padding:16px;background:rgba(245,244,241,.38);
  -webkit-backdrop-filter:blur(22px) saturate(1.3);backdrop-filter:blur(22px) saturate(1.3);
}
.pg-card{
  width:100%;max-width:440px;overflow:hidden auto;max-height:calc(100dvh - 32px);border-radius:20px;
  background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.9);
  -webkit-backdrop-filter:blur(18px) saturate(1.4);backdrop-filter:blur(18px) saturate(1.4);
  box-shadow:0 1px 0 rgba(255,255,255,.8) inset,0 30px 80px -20px rgba(20,20,30,.35);
  animation:pg-rise .6s cubic-bezier(.2,.8,.2,1) both;
}
@keyframes pg-rise{from{transform:translateY(14px) scale(.985)}to{transform:none}}
.pg-brand{
  display:flex;align-items:center;gap:8px;padding:10px 12px 10px 22px;min-height:46px;border-bottom:1px solid var(--pg-line);
  font:500 11px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--pg-muted);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.pg-dot{width:7px;height:7px;border-radius:2px;background:#16161a;flex:none;display:inline-block}
.pg-dot-live,.pg-dot-active,.pg-dot-paid{background:#1f9d55;box-shadow:0 0 0 3px rgba(31,157,85,.18)}
.pg-dot-ready{background:#d99a1e}.pg-dot-expired,.pg-dot-error{background:#d6453d}.pg-dot-unconfigured,.pg-dot-loading{background:#9a9aa3}
.pg-viewport{overflow:hidden}
.pg-track{display:flex;width:200%;transition:transform .55s cubic-bezier(.65,0,.2,1)}
.pg-track>.pg-pane{width:50%}
.pg-pane{padding:26px 22px 24px;display:flex;flex-direction:column;align-items:flex-start}
.pg-center{padding:56px 0;display:flex;justify-content:center}
.pg-label{font:500 11px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--pg-muted);margin-bottom:14px}
.pg-label-inline{margin:0}
.pg-sender{display:flex;align-items:center;gap:12px;margin-bottom:18px}
.pg-avatar{width:48px;height:48px;border-radius:50%;object-fit:cover;flex:none;display:block;border:2px solid #fff;box-shadow:0 4px 14px -4px rgba(20,20,30,.35)}
.pg-sender-name{font-size:14px;font-weight:500;line-height:1.2;color:var(--pg-ink)}
.pg-sender-role{white-space:nowrap;font:500 10px/1.6 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--pg-muted)}
.pg-h{margin:0 0 10px;font-size:24px;line-height:1.15;font-weight:400;letter-spacing:-.02em;color:var(--pg-ink)}
.pg-p{margin:0 0 22px;font-size:15px;font-weight:400;color:var(--pg-muted)}
.pg-p strong{color:var(--pg-ink);font-weight:500}
.pg-btn{
  appearance:none;border:0;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;
  width:100%;min-height:50px;padding:0 26px;background:var(--pg-accent);color:#fff;
  border-radius:999px;font-size:15px;font-weight:500;
  transition:transform .2s ease,background .2s ease,opacity .2s;
}
.pg-btn:hover{transform:translateY(-1px);background:#000}
.pg-btn:disabled{opacity:.6;cursor:default}
.pg-btn-ghost{margin-top:10px;background:rgba(22,22,26,.07);color:var(--pg-ink)}
.pg-btn-ghost:hover{background:rgba(22,22,26,.12)}
.pg-quote{width:100%;display:grid;grid-template-columns:1fr auto;gap:8px 16px;margin:0 0 20px;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,.6);border:1px solid var(--pg-line);font-size:14px}
.pg-quote dt{color:var(--pg-muted)}
.pg-quote dd{margin:0;text-align:right;font-variant-numeric:tabular-nums;color:var(--pg-ink)}
.pg-quote s{margin-right:8px;color:var(--pg-muted);font-weight:400;text-decoration-thickness:1px}
.pg-quote .pg-quote-save{color:#1f9d55;font-weight:500}
.pg-offer{width:100%;display:flex;align-items:center;gap:10px;margin:0 0 12px;padding:10px 12px 10px 10px;border-radius:999px;background:#16161a;color:#fff;white-space:nowrap}
.pg-offer-tag{padding:4px 10px;border-radius:999px;background:#1f9d55;font-size:12px;font-weight:600;letter-spacing:.02em}
.pg-offer-label{font:500 10px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.65);margin-left:auto}
.pg-offer-time{font:500 13px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-variant-numeric:tabular-nums}
.pg-quote .pg-quote-total{padding-top:8px;border-top:1px solid var(--pg-line);color:var(--pg-ink);font-weight:500}
.pg-fine{margin:12px 0 0;width:100%;text-align:center;font-size:12px;color:var(--pg-muted)}
.pg-btn:focus-visible,.pg-input:focus-visible,.pg-back:focus-visible,.pg-mini:focus-visible{outline:2px solid #16161a;outline-offset:3px}
.pg-input{
  width:100%;height:50px;padding:0 20px;margin:0 0 12px;border-radius:999px;border:1px solid rgba(22,22,26,.16);
  background:rgba(255,255,255,.85);color:var(--pg-ink);font-size:16px;font-weight:400;font-family:inherit;outline:none;
}
.pg-input:focus{border-color:#16161a}
.pg-input-sm{height:36px;font-size:14px;margin:0;flex:1;min-width:0}
.pg-error{margin:0 0 12px;font-size:13px;color:#b3261e}
.pg-back{appearance:none;border:0;background:none;margin:14px auto 0;color:var(--pg-muted);font-size:13px;font-weight:400;font-family:inherit;cursor:pointer;padding:6px}
.pg-back:hover{color:var(--pg-ink)}
.pg-spinner{width:22px;height:22px;border-radius:50%;border:2px solid var(--pg-line);border-top-color:#16161a;animation:pg-spin .8s linear infinite}
@keyframes pg-spin{to{transform:rotate(360deg)}}

.pg-pill{
  position:fixed;z-index:2147483000;
  display:flex;align-items:center;gap:10px;padding:9px 14px 9px 10px;border-radius:999px;white-space:nowrap;
  cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;
  transition:left .25s cubic-bezier(.2,.8,.2,1),top .25s cubic-bezier(.2,.8,.2,1),box-shadow .2s;
  background:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.9);
  -webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);
  box-shadow:0 10px 30px -10px rgba(20,20,30,.3);
}
.pg-pill-label{font:500 10px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--pg-muted)}
.pg-pill-time{font:500 13px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-variant-numeric:tabular-nums;color:var(--pg-ink)}
.pg-pill-tl{top:max(16px,env(safe-area-inset-top));left:16px}
.pg-pill-tr{top:max(16px,env(safe-area-inset-top));right:16px}
.pg-pill-bl{bottom:calc(max(16px,env(safe-area-inset-bottom)) + var(--pg-bottom-offset,0px));left:16px}
.pg-pill-br{bottom:calc(max(16px,env(safe-area-inset-bottom)) + var(--pg-bottom-offset,0px));right:16px}
.pg-pill-dragging{cursor:grabbing;transition:none;box-shadow:0 18px 40px -10px rgba(20,20,30,.45)}
.pg-grip{width:6px;height:12px;flex:none;opacity:.45;background-image:radial-gradient(circle,#16161a 1px,transparent 1.2px);background-size:3px 4px}
@media (max-width:767px){.pg-pill{padding:7px 12px 7px 9px;gap:8px}.pg-pill-label{display:none}}

.pg-nudge{
  position:fixed;z-index:2147483000;right:16px;bottom:calc(max(16px,env(safe-area-inset-bottom)) + var(--pg-bottom-offset,0px));width:min(340px,calc(100vw - 32px));
  padding:16px 16px 14px;border-radius:18px;background:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.9);
  -webkit-backdrop-filter:blur(16px) saturate(1.4);backdrop-filter:blur(16px) saturate(1.4);
  box-shadow:0 24px 60px -18px rgba(20,20,30,.4);
  font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Inter,Roboto,sans-serif;color:#16161a;line-height:1.5;box-sizing:border-box;
  animation:pg-nudge-in .5s cubic-bezier(.2,.8,.2,1) both;
}
.pg-nudge *{box-sizing:border-box}
@keyframes pg-nudge-in{from{transform:translateY(24px)}to{transform:none}}
.pg-nudge-head{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.pg-avatar-sm{width:36px;height:36px}
.pg-nudge-text{margin:0 0 12px;font-size:14px;color:#5d5d66}
.pg-nudge-text strong{color:#16161a;font-weight:500}
.pg-nudge-actions{display:flex;align-items:center;gap:6px}
.pg-back-inline{margin:0}
.pg-nudge-x,.pg-card-x{appearance:none;border:0;background:none;cursor:pointer;color:#5d5d66;font-size:20px;line-height:1;padding:4px 6px}
.pg-nudge-x{position:absolute;top:8px;right:8px}
.pg-card-x{margin-left:auto}
.pg-nudge-x:hover,.pg-card-x:hover{color:#16161a}
@media (prefers-reduced-motion:reduce){.pg-nudge{animation:none}}

.pg-staff{
  position:fixed;z-index:2147483000;right:16px;bottom:16px;width:min(380px,calc(100vw - 32px));
  padding:12px 14px;border-radius:14px;display:flex;flex-direction:column;gap:10px;font-size:13px;
  background:rgba(255,255,255,.78);border:1px solid rgba(255,255,255,.9);
  -webkit-backdrop-filter:blur(16px) saturate(1.4);backdrop-filter:blur(16px) saturate(1.4);
  box-shadow:0 20px 50px -15px rgba(20,20,30,.35);
}
.pg-staff-row{display:flex;align-items:center;gap:8px;flex-wrap:nowrap}
.pg-staff-row.pg-wrap{flex-wrap:wrap}
.pg-staff-row.pg-wrap .pg-input-sm{flex:1 1 140px}
.pg-staff-spacer{flex:1}
.pg-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:6px;background:rgba(22,22,26,.06);font-weight:500;white-space:nowrap}
.pg-staff-time{font:500 12px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-variant-numeric:tabular-nums;white-space:nowrap}
.pg-staff-x{appearance:none;border:0;background:none;font-size:18px;line-height:1;cursor:pointer;color:var(--pg-muted);padding:2px 6px}
.pg-staff-dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:0}
.pg-staff-dl dt{font:500 10px/18px ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--pg-muted)}
.pg-staff-dl dd{margin:0;color:var(--pg-ink);overflow-wrap:anywhere}
.pg-mini{appearance:none;border:0;cursor:pointer;height:32px;padding:0 14px;border-radius:999px;background:#16161a;color:#fff;font-size:12px;font-weight:500;font-family:inherit;white-space:nowrap}
.pg-mini-ghost{background:rgba(22,22,26,.07);color:var(--pg-ink)}
.pg-staff-tab{
  position:fixed;z-index:2147483000;right:16px;bottom:16px;appearance:none;border:1px solid rgba(255,255,255,.9);cursor:pointer;
  display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:500;
  background:rgba(255,255,255,.78);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 10px 30px -10px rgba(20,20,30,.3);
}
@media (prefers-reduced-motion:reduce){.pg-card{animation:none}.pg-track{transition:none}}
`;
