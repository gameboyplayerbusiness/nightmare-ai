"use client";

import { useEffect, useMemo, useState } from "react";

function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readFreeCookie() {
  if (typeof document === "undefined") return { date: getTodayKey(), count: 0 };
  const raw = document.cookie
    .split("; ")
    .find((x) => x.startsWith("na_free="))
    ?.split("=")[1];

  if (!raw) return { date: getTodayKey(), count: 0 };

  try {
    const decoded = decodeURIComponent(raw);
    const [date, countStr] = decoded.split("|");
    const today = getTodayKey();
    if (date !== today) return { date: today, count: 0 };
    return { date, count: Math.max(0, Math.min(99, Number(countStr || "0"))) };
  } catch {
    return { date: getTodayKey(), count: 0 };
  }
}

function writeFreeCookie(count) {
  const date = getTodayKey();
  const value = encodeURIComponent(`${date}|${count}`);
  const exp = new Date(Date.now() + 1000 * 60 * 60 * 48).toUTCString();
  document.cookie = `na_free=${value}; expires=${exp}; path=/; SameSite=Lax`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function revealText(setter, text) {
  setter("");
  const clean = String(text || "").trim();
  let out = "";
  for (let i = 0; i < clean.length; i++) {
    out += clean[i];
    setter(out);
    await sleep(10 + Math.random() * 16);
  }
}

export default function Home() {
  const [dream, setDream] = useState("");
  const [shortReading, setShortReading] = useState("");
  const [loadingShort, setLoadingShort] = useState(false);
  const [loadingPay, setLoadingPay] = useState(false);
  const [status, setStatus] = useState("");

  const [freeCount, setFreeCount] = useState(0);

  useEffect(() => {
    const info = readFreeCookie();
    setFreeCount(info.count);
  }, []);

  const freeLeft = useMemo(() => Math.max(0, 3 - freeCount), [freeCount]);

  async function handleShort() {
    if (!dream.trim()) {
      setStatus("One scene. One detail you can’t drop.");
      return;
    }
    if (freeLeft <= 0) {
      setStatus("That’s all for today. Come back tomorrow.");
      return;
    }

    setStatus("");
    setLoadingShort(true);
    setShortReading("");

    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dream }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Interpret failed");

      await revealText(setShortReading, data.text || "");

      const next = freeCount + 1;
      setFreeCount(next);
      writeFreeCookie(next);
    } catch {
      setStatus("It slipped away. Try again.");
    } finally {
      setLoadingShort(false);
    }
  }

  async function handlePay() {
    if (!dream.trim()) {
      setStatus("Say it plainly. No context. No explanation.");
      return;
    }
    setStatus("");
    setLoadingPay(true);

    try {
      localStorage.setItem("na_last_dream", dream);

      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dream }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Payment failed");
      if (!data?.url) throw new Error("No checkout url");

      window.location.href = data.url;
    } catch {
      setStatus("Something blocked it. Try again.");
      setLoadingPay(false);
    }
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-void">
      {/* Background stack */}
      <div className="absolute inset-0 -z-10">
        <img src="/ui/bg-hybrid.png" alt="" className="w-full h-full object-cover opacity-[0.58]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-black/85" />
        <img src="/ui/particles.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.22] animate-shimmer" />
        <img src="/ui/glow.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.33] animate-mistDrift" />
        <img src="/ui/grain.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.10] mix-blend-overlay" />
      </div>

      {/* Mist layer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%]">
        <img src="/ui/mist.png" alt="" className="w-full h-full object-cover opacity-[0.72] animate-mistDrift" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
      </div>

      {/* Header */}
      <header className="max-w-6xl mx-auto px-6 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full glass flex items-center justify-center text-sm tracking-widest">
            NM
          </div>
          <div className="leading-tight">
            <div className="font-semibold">Nightmare AI</div>
            <div className="text-xs text-white/60">Dream analysis with a bite.</div>
          </div>
        </div>
        <div className="text-xs text-white/55">
          Free today: <span className="text-white/75">{freeLeft}</span>/3
        </div>
      </header>

      {/* Main */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        {/* Left */}
        <div>
          <div className="brandTag">Write it down</div>
          <h1 className="mt-3 text-5xl md:text-6xl font-semibold leading-[0.95] tracking-tight">
            Don’t explain it.
            <br />
            <span className="text-white/70">Just describe what happened.</span>
          </h1>

          <p className="mt-6 text-white/70 max-w-xl">
            You’ll get a short read first. The full analysis unlocks after you open it.
          </p>

          <div className="mt-8 glass rounded-2xl p-5 border border-white/10 max-w-xl">
            <label className="text-sm text-white/70">Describe the nightmare</label>
            <textarea
              value={dream}
              onChange={(e) => setDream(e.target.value)}
              placeholder="I was in a house I’ve never seen before, but it felt like mine..."
              rows={5}
              className="input w-full mt-2 rounded-xl p-4 text-white/90 placeholder:text-white/35"
            />

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleShort}
                disabled={loadingShort || freeLeft <= 0}
                className={`btn rounded-xl px-5 py-3 font-semibold ${
                  freeLeft <= 0
                    ? "bg-white/10 text-white/40 cursor-not-allowed"
                    : "bg-white/12 hover:bg-white/18 text-white"
                }`}
              >
                {loadingShort ? "Reading…" : "Get a short reading (Free)"}
              </button>

              <button
                onClick={handlePay}
                disabled={loadingPay}
                className="btn rounded-xl px-5 py-3 font-semibold bg-emerald-200/15 hover:bg-emerald-200/22 text-emerald-50 border border-emerald-200/20"
              >
                {loadingPay ? "Opening…" : "Unlock full analysis (£2)"}
              </button>
            </div>

            <div className="mt-3 text-xs text-white/55">
              Free readings reset daily. Full unlock includes deeper analysis + a post-ready share pack.
            </div>

            {status ? <div className="mt-4 text-sm text-emerald-100/80">{status}</div> : null}

            {shortReading ? (
              <div className="mt-5 rounded-xl border border-white/10 bg-black/35 p-4 animate-softReveal">
                <div className="text-sm text-white/70 mb-2">Short reading</div>
                <div className="text-white/90 leading-relaxed">
                  {shortReading}
                  <span className="cursor" />
                </div>
                <div className="mt-3 text-xs text-white/55">
                  If that hit close, the full analysis goes further.
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 text-sm text-white/55">
            <span className="text-white/70">Tip:</span> one scene, one fear, one detail you couldn’t change.
          </div>
        </div>

        {/* Right (visual stays) */}
        <div className="relative flex items-center justify-center">
          <div className="relative">
            <img
              src="/ui/portal.png"
              alt=""
              className="w-[360px] sm:w-[440px] md:w-[520px] animate-portalPulse drop-shadow-[0_0_50px_rgba(155,183,165,0.14)]"
            />
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-30"
              style={{ boxShadow: "0 0 90px rgba(155,183,165,0.18)" }}
            />
          </div>

          <div className="absolute -bottom-6 text-xs text-white/55">
            Don’t reinterpret it yet.
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 pb-10 text-xs text-white/45">
        © {new Date().getFullYear()} Nightmare AI — entertainment experience. If you feel unsafe, speak to someone you trust.
      </footer>
    </main>
  );
}
