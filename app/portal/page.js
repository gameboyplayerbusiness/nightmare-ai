"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

function pickLine() {
  const lines = [
    "It keeps replaying the part you tried to blur.",
    "A detail is being pulled into focus.",
    "Hold still.",
    "Don’t reinterpret it yet.",
    "Your brain flagged something as a threat. It wants you to notice.",
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default function PortalLoading() {
  const router = useRouter();
  const params = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);
  const sessionId = params.get("session_id");

  const [line, setLine] = useState(pickLine());
  const [sub, setSub] = useState("Tagging the emotion…");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let t1, t2;
    t1 = setInterval(() => setLine(pickLine()), 2200);
    t2 = setInterval(() => setProgress((p) => Math.min(100, p + 6)), 450);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  useEffect(() => {
    async function run() {
      if (!sessionId) {
        setSub("No session found. Return and try again.");
        return;
      }

      const minMs = 4200;
      const start = Date.now();

      try {
        const vr = await fetch(`/api/payment?session_id=${encodeURIComponent(sessionId)}`);
        const vdata = await vr.json();
        if (!vr.ok || !vdata?.paid) {
          setSub("Payment wasn’t confirmed.");
          return;
        }
      } catch {
        // reveal handles failures too
      }

      const elapsed = Date.now() - start;
      if (elapsed < minMs) await sleep(minMs - elapsed);

      router.replace(`/reveal?session_id=${encodeURIComponent(sessionId)}`);
    }

    run();
  }, [sessionId, router]);

  return (
    <main className="min-h-screen relative overflow-hidden bg-void">
      <div className="absolute inset-0 -z-10">
        <img src="/ui/bg-hybrid.png" alt="" className="w-full h-full object-cover opacity-[0.60]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/90" />
        <img src="/ui/particles.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.20] animate-shimmer" />
        <img src="/ui/glow.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.33] animate-mistDrift" />
        <img src="/ui/grain.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.10] mix-blend-overlay" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%]">
        <img src="/ui/mist.png" alt="" className="w-full h-full object-cover opacity-[0.78] animate-mistDrift" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
      </div>

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
        <div className="text-xs text-white/55">Processing…</div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-12 pb-16 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="glass rounded-2xl p-6 border border-white/10">
          <div className="brandTag">Building the pattern</div>
          <div className="mt-3 text-3xl md:text-4xl font-semibold leading-tight">
            {line}
          </div>
          <div className="mt-4 text-white/70">{sub}</div>

          <div className="mt-6">
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-emerald-200/25" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-3 text-xs text-white/55">
              Don’t refresh.
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="relative">
            <img
              src="/ui/portal.png"
              alt=""
              className="w-[340px] sm:w-[420px] md:w-[500px] animate-portalPulse drop-shadow-[0_0_60px_rgba(155,183,165,0.16)]"
            />
            <img
              src="/ui/flash.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-[0.12] mix-blend-screen"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
