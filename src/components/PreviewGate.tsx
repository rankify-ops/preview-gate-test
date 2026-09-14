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
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const API = "https://rankify-previews.vercel.app/api/preview";
const ADMIN_KEY_STORAGE = "rankify-preview-admin-key";

type State = "loading" | "error" | "unconfigured" | "ready" | "active" | "expired";

type Status = {
  state: State;
  hours?: number;
  startedAt?: string;
  expiresAt?: string;
  now?: string;
  record?: {
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

  const locked = !isStaff && status.state !== "active";

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
      ) : locked ? (
        <Lock
          site={site}
          clientName={clientName}
          status={status}
          apply={apply}
          refresh={refresh}
          expiredCta={expiredCta}
        />
      ) : (
        <Countdown expiresAt={status.expiresAt!} skew={skew} onExpire={refresh} />
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
  const hours = status.hours ?? 24;

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

        {s === "expired" && (
          <div className="pg-pane">
            <div className="pg-label">Preview ended</div>
            <h2 id="pg-title" className="pg-h">Your preview has ended.</h2>
            <p className="pg-p">Thanks for taking a look. If you&rsquo;d like to go ahead with your new website, get in touch with us and we&rsquo;ll take it from here.</p>
            {expiredCta && (
              <a className="pg-btn" href={expiredCta.href}>
                <span>{expiredCta.label}</span>
              </a>
            )}
          </div>
        )}

        {s === "ready" && (
          <div className="pg-viewport">
            <div className="pg-track" style={{ transform: `translateX(${step * -50}%)` }}>
              <div className="pg-pane" aria-hidden={step !== 0}>
                <div className="pg-label">Ready</div>
                <h2 id="pg-title" className="pg-h">Hey, your preview home page is ready.</h2>
                <p className="pg-p">
                  When you&rsquo;re ready, click below to begin your preview. Your preview only lasts{" "}
                  <strong>{hours === 24 ? "24 hours" : formatHours(hours)}</strong>, and the timer starts as soon as you open it.
                </p>
                <button className="pg-btn" onClick={() => setStep(1)} tabIndex={step === 0 ? 0 : -1}>
                  <span>Next</span>
                </button>
              </div>

              <form className="pg-pane" onSubmit={start} aria-hidden={step !== 1}>
                <div className="pg-label">Step 2 of 2</div>
                <h2 className="pg-h">Confirm it&rsquo;s you.</h2>
                <p className="pg-p">Enter the email address we sent your preview to.</p>
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

function Countdown({ expiresAt, skew, onExpire }: { expiresAt: string; skew: React.RefObject<number>; onExpire: () => void }) {
  const ms = useRemaining(expiresAt, skew);
  const fired = useRef(false);
  useEffect(() => {
    if (ms === 0 && !fired.current) {
      fired.current = true;
      onExpire();
    }
  }, [ms, onExpire]);
  if (ms === null) return null;
  return (
    <div className="pg-pill" role="timer" aria-live="off">
      <span className="pg-dot pg-dot-live" />
      <span className="pg-pill-label">Preview ends in</span>
      <span className="pg-pill-time">{formatClock(ms)}</span>
    </div>
  );
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
  const [key, setKey] = useState("");
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [label, setLabel] = useState("");
  const [msg, setMsg] = useState("");
  const [full, setFull] = useState<Status["record"] | null>(null);

  useEffect(() => {
    try {
      setKey(localStorage.getItem(ADMIN_KEY_STORAGE) || "");
    } catch {}
  }, []);

  const admin = useCallback(
    async (body: Record<string, unknown>) => {
      setMsg("");
      const r = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ site, ...body }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.status === 401) {
        setMsg("Admin key rejected.");
        return null;
      }
      if (!r.ok) {
        setMsg(data.error || "Request failed.");
        return null;
      }
      setFull(data.record ?? null);
      apply(data);
      return data;
    },
    [key, site, apply],
  );

  // Load the full record (with email) whenever the public status changes.
  useEffect(() => {
    if (key && status.state !== "loading") admin({ action: "status" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, status.state, status.startedAt]);

  const ms = useRemaining(status.state === "active" ? status.expiresAt : null, skew);

  function saveKey(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = String(new FormData(e.currentTarget).get("key") || "").trim();
    try {
      localStorage.setItem(ADMIN_KEY_STORAGE, v);
    } catch {}
    setKey(v);
  }

  const badge: Record<State, string> = {
    loading: "Loading",
    error: "Offline",
    unconfigured: "Not set up",
    ready: "Not started",
    active: "Live",
    expired: "Expired",
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

      {!key ? (
        <form className="pg-staff-row" onSubmit={saveKey}>
          <input className="pg-input pg-input-sm" name="key" type="password" placeholder="Admin key" autoComplete="off" />
          <button className="pg-mini" type="submit">Unlock</button>
        </form>
      ) : (
        <>
          <dl className="pg-staff-dl">
            <dt>Client</dt>
            <dd>{full?.email ?? "—"}{full?.label ? ` · ${full.label}` : ""}</dd>
            <dt>Started</dt>
            <dd>{full?.startedAt ? `${formatWhen(full.startedAt)}${full.startedFrom ? ` · ${full.startedFrom}` : ""}` : "—"}</dd>
            <dt>Ends</dt>
            <dd>{full?.expiresAt ? formatWhen(full.expiresAt) : `${formatHours(full?.hours ?? 24)} after they start`}</dd>
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
              <input className="pg-input pg-input-sm" placeholder="Name for alerts" value={label} onChange={(e) => setLabel(e.target.value)} />
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
        </>
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
  width:100%;max-width:440px;overflow:hidden;border-radius:20px;
  background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.9);
  -webkit-backdrop-filter:blur(18px) saturate(1.4);backdrop-filter:blur(18px) saturate(1.4);
  box-shadow:0 1px 0 rgba(255,255,255,.8) inset,0 30px 80px -20px rgba(20,20,30,.35);
  animation:pg-rise .6s cubic-bezier(.2,.8,.2,1) both;
}
@keyframes pg-rise{from{transform:translateY(14px) scale(.985)}to{transform:none}}
.pg-brand{
  display:flex;align-items:center;gap:8px;padding:14px 22px;border-bottom:1px solid var(--pg-line);
  font:500 11px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--pg-muted);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.pg-dot{width:7px;height:7px;border-radius:2px;background:#16161a;flex:none;display:inline-block}
.pg-dot-live,.pg-dot-active{background:#1f9d55;box-shadow:0 0 0 3px rgba(31,157,85,.18)}
.pg-dot-ready{background:#d99a1e}.pg-dot-expired,.pg-dot-error{background:#d6453d}.pg-dot-unconfigured,.pg-dot-loading{background:#9a9aa3}
.pg-viewport{overflow:hidden}
.pg-track{display:flex;width:200%;transition:transform .55s cubic-bezier(.65,0,.2,1)}
.pg-track>.pg-pane{width:50%}
.pg-pane{padding:26px 22px 24px;display:flex;flex-direction:column;align-items:flex-start}
.pg-center{padding:56px 0;display:flex;justify-content:center}
.pg-label{font:500 11px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--pg-muted);margin-bottom:14px}
.pg-label-inline{margin:0}
.pg-h{margin:0 0 10px;font-size:26px;line-height:1.15;font-weight:400;letter-spacing:-.02em;color:var(--pg-ink)}
.pg-p{margin:0 0 22px;font-size:15px;font-weight:400;color:var(--pg-muted)}
.pg-p strong{color:var(--pg-ink);font-weight:500}
.pg-btn{
  appearance:none;border:0;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;
  width:100%;min-height:50px;padding:0 26px;background:var(--pg-accent);color:#fff;
  transform:skewX(-12deg);border-radius:4px;font-size:15px;font-weight:500;
  transition:transform .2s ease,background .2s ease,opacity .2s;
}
.pg-btn>span{display:inline-block;transform:skewX(12deg)}
.pg-btn:hover{transform:skewX(-12deg) translateY(-1px);background:#000}
.pg-btn:disabled{opacity:.6;cursor:default}
.pg-btn:focus-visible,.pg-input:focus-visible,.pg-back:focus-visible,.pg-mini:focus-visible{outline:2px solid #16161a;outline-offset:3px}
.pg-input{
  width:100%;height:50px;padding:0 16px;margin:0 0 12px;border-radius:10px;border:1px solid rgba(22,22,26,.16);
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
  position:fixed;z-index:2147483000;right:16px;bottom:var(--pg-bottom,16px);
  display:flex;align-items:center;gap:10px;padding:9px 14px;border-radius:999px;white-space:nowrap;
  background:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.9);
  -webkit-backdrop-filter:blur(14px) saturate(1.4);backdrop-filter:blur(14px) saturate(1.4);
  box-shadow:0 10px 30px -10px rgba(20,20,30,.3);
}
.pg-pill-label{font:500 10px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--pg-muted)}
.pg-pill-time{font:500 13px/1 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-variant-numeric:tabular-nums;color:var(--pg-ink)}
@media (max-width:767px){.pg-pill{bottom:auto;top:var(--pg-top-mobile,10px);right:50%;transform:translateX(50%);padding:7px 12px;gap:8px}.pg-pill-label{display:none}}

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
.pg-mini{appearance:none;border:0;cursor:pointer;height:32px;padding:0 12px;border-radius:7px;background:#16161a;color:#fff;font-size:12px;font-weight:500;font-family:inherit;white-space:nowrap}
.pg-mini-ghost{background:rgba(22,22,26,.07);color:var(--pg-ink)}
.pg-staff-tab{
  position:fixed;z-index:2147483000;right:16px;bottom:16px;appearance:none;border:1px solid rgba(255,255,255,.9);cursor:pointer;
  display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:500;
  background:rgba(255,255,255,.78);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);box-shadow:0 10px 30px -10px rgba(20,20,30,.3);
}
@media (prefers-reduced-motion:reduce){.pg-card{animation:none}.pg-track{transition:none}}
`;
