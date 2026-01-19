"use client";

import { useEffect, useMemo, useState } from "react";

function section(text, label) {
  const t = (text || "").trim();
  const i = t.indexOf(label);
  if (i === -1) return "";
  const rest = t.slice(i + label.length).trim();

  const labels = [
    "TITLE:",
    "DREAM PROFILE:",
    "INTERPRETATION:",
    "SYMBOLS & ASSOCIATIONS:",
    "LIKELY TRIGGER:",
    "WHAT YOUR BRAIN IS DOING:",
    "TONIGHT’S EXPERIMENT:",
    "POST TEXT:",
    "- CAPTION:",
    "- ON-IMAGE TEXT:",
  ].filter((x) => x !== label);

  let cut = rest.length;
  for (const l of labels) {
    const j = rest.indexOf(l);
    if (j !== -1) cut = Math.min(cut, j);
  }
  return rest.slice(0, cut).trim();
}

function safeTrim(s) {
  return String(s || "")
  .trim()
  .replace(/<\s*<SITE_URL>/g, siteUrl);
}

async function copy(text) {
  await navigator.clipboard.writeText(text);
}

export default function Reveal() {
  const params = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  const sessionId = params.get("session_id");

  const [paid, setPaid] = useState(false);
  const [dream, setDream] = useState("");
  const [deepText, setDeepText] = useState("");
  const [imgB64, setImgB64] = useState("");
  const [imgErr, setImgErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function run() {
      setLoading(true);
      setImgErr("");
      setToast("");

      if (!sessionId) {
        setLoading(false);
        return;
      }

      let verifiedDream = "";
      try {
        const vr = await fetch(`/api/payment?session_id=${encodeURIComponent(sessionId)}`);
        const vdata = await vr.json();
        if (!vr.ok || !vdata?.paid) {
          setPaid(false);
          setLoading(false);
          return;
        }
        setPaid(true);
        verifiedDream = vdata.dream || "";
        setDream(verifiedDream);

        if (!verifiedDream && typeof window !== "undefined") {
          verifiedDream = localStorage.getItem("na_last_dream") || "";
          setDream(verifiedDream);
        }
      } catch {
        setPaid(false);
        setLoading(false);
        return;
      }

      try {
        const dr = await fetch("/api/deep-interpret", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dream: verifiedDream }),
        });
        const ddata = await dr.json();
        if (!dr.ok) throw new Error(ddata?.error || "Deep failed");
        setDeepText(ddata.text || "");
      } catch {
        setDeepText("");
      }

      try {
        const ir = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dream: verifiedDream }),
        });
        const idata = await ir.json();
        if (!ir.ok) setImgErr(idata?.error || "Image unavailable");
        else setImgB64(idata.b64 || "");
      } catch {
        setImgErr("Image unavailable");
      }

      setLoading(false);
    }

    run();
  }, [sessionId]);

  const title = useMemo(() => safeTrim(section(deepText, "TITLE:")), [deepText]);
  const profile = useMemo(() => safeTrim(section(deepText, "DREAM PROFILE:")), [deepText]);
  const interpretation = useMemo(() => safeTrim(section(deepText, "INTERPRETATION:")), [deepText]);
  const symbols = useMemo(() => safeTrim(section(deepText, "SYMBOLS & ASSOCIATIONS:")), [deepText]);
  const trigger = useMemo(() => safeTrim(section(deepText, "LIKELY TRIGGER:")), [deepText]);
  const brain = useMemo(() => safeTrim(section(deepText, "WHAT YOUR BRAIN IS DOING:")), [deepText]);
  const tonight = useMemo(() => safeTrim(section(deepText, "TONIGHT’S EXPERIMENT:")), [deepText]);

  const caption = useMemo(() => safeTrim(section(deepText, "- CAPTION:")), [deepText]);
  const onImage = useMemo(() => safeTrim(section(deepText, "- ON-IMAGE TEXT:")), [deepText]);

  const siteUrl =
  (typeof window !== "undefined" && window.location?.origin) ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.nightmare-ai.co.uk";

const postTextToCopy = useMemo(() => {
  const cleanedCaption = (caption || "").replace(/<SITE_URL>/g, siteUrl);

  return (
    cleanedCaption ||
    `This dream is pointing at something I keep avoiding...\nWhat do you think it's about?\nFind yours at ${siteUrl}`
  );
}, [caption, siteUrl]);

  async function doCopy(label, text) {
    try {
      await copy(text);
      setToast(`${label} copied.`);
      setTimeout(() => setToast(""), 1100);
    } catch {
      setToast("Copy failed.");
      setTimeout(() => setToast(""), 1100);
    }
  }

  if (!sessionId) {
    return (
      <main className="min-h-screen bg-void text-white flex items-center justify-center px-6">
        <div className="glass rounded-2xl p-6 max-w-lg text-center">
          <div className="text-xl font-semibold mb-2">No session found</div>
          <div className="text-white/70 text-sm">Return home and unlock the full analysis again.</div>
          <a className="inline-block mt-4 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15" href="/">
            Go home
          </a>
        </div>
      </main>
    );
  }

  if (!loading && !paid) {
    return (
      <main className="min-h-screen bg-void text-white flex items-center justify-center px-6">
        <div className="glass rounded-2xl p-6 max-w-lg text-center">
          <div className="text-xl font-semibold mb-2">Payment not confirmed.</div>
          <div className="text-white/70 text-sm">Try again from the home page.</div>
          <a className="inline-block mt-4 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15" href="/">
            Return
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-void text-white">
      <div className="absolute inset-0 -z-10">
        <img src="/ui/bg-hybrid.png" alt="" className="w-full h-full object-cover opacity-[0.62]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black/90" />
        <img src="/ui/particles.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.22] animate-shimmer" />
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

        <a href="/" className="text-xs text-white/60 hover:text-white/80">
          New dream
        </a>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-10 pb-14 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div className="glass rounded-2xl p-6 border border-white/10">
          <div className="brandTag">Full analysis</div>

          {loading ? (
            <div className="mt-5 text-white/80">
              Pulling the pattern together<span className="cursor" />
              <div className="mt-2 text-xs text-white/55">Hold still.</div>
            </div>
          ) : (
            <div className="mt-5 animate-softReveal">
              <div className="text-3xl font-semibold leading-tight">
                {title || "The Detail That Wouldn’t Stay Vague"}
              </div>

              {profile ? <div className="mt-3 text-white/70 leading-relaxed">{profile}</div> : null}

              <div className="mt-6">
                <div className="text-sm text-white/60 mb-2">Interpretation</div>
                <div className="text-white/90 leading-relaxed whitespace-pre-wrap">{interpretation}</div>
              </div>

              {symbols ? (
                <div className="mt-6">
                  <div className="text-sm text-white/60 mb-2">Symbols & Associations</div>
                  <div className="text-white/85 whitespace-pre-wrap">{symbols}</div>
                </div>
              ) : null}

              {trigger ? (
                <div className="mt-6">
                  <div className="text-sm text-white/60 mb-2">Likely Trigger</div>
                  <div className="text-white/90 leading-relaxed whitespace-pre-wrap">{trigger}</div>
                </div>
              ) : null}

              {brain ? (
                <div className="mt-6">
                  <div className="text-sm text-white/60 mb-2">What Your Brain Is Doing</div>
                  <div className="text-white/90 leading-relaxed whitespace-pre-wrap">{brain}</div>
                </div>
              ) : null}

              {tonight ? (
                <div className="mt-6">
                  <div className="text-sm text-white/60 mb-2">Tonight’s Experiment</div>
                  <div className="text-white/90 whitespace-pre-wrap">{tonight}</div>
                </div>
              ) : null}

              <div className="mt-6 border-t border-white/10 pt-5">
                <div className="text-sm text-white/60 mb-2">Your original nightmare</div>
                <div className="text-white/80 whitespace-pre-wrap">{dream || "—"}</div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="brandTag">Save & post</div>
                <div className="mt-2 text-xl font-semibold">Share Pack</div>
                <div className="mt-2 text-sm text-white/65">
                  Save the image, paste the caption, ask people what they notice first.
                </div>
              </div>
              <div className="text-xs text-white/50">NightmareAI</div>
            </div>

            <div className="mt-5 rounded-2xl overflow-hidden border border-white/10 bg-black/40 relative">
              <div className="absolute inset-0 pointer-events-none">
                <img src="/ui/flash.png" alt="" className="w-full h-full object-cover opacity-[0.18] mix-blend-screen" />
              </div>

              {imgB64 ? (
                <img src={`data:image/png;base64,${imgB64}`} alt="" className="w-full aspect-square object-cover" />
              ) : (
                <div className="w-full aspect-square flex flex-col items-center justify-center p-8 text-center">
                  <div className="text-white/85 font-semibold">Image unavailable</div>
                  <div className="mt-2 text-sm text-white/60">The frame is ready.</div>
                  {imgErr ? <div className="mt-2 text-xs text-white/50">{imgErr}</div> : null}
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/35 to-transparent">
                <div className="flex items-center justify-between text-xs text-white/70">
                  <span>NightmareAI</span>
                  <span className="text-white/55">dream analysis</span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-black/35 p-4">
              <div className="text-sm text-white/60">Post text</div>
              <div className="mt-2 text-white/90 whitespace-pre-wrap">{postTextToCopy}</div>

              {onImage ? (
                <>
                  <div className="mt-4 text-sm text-white/60">On-image text</div>
                  <div className="mt-2 text-white/85 whitespace-pre-wrap">{onImage}</div>
                </>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  className="btn rounded-xl px-4 py-3 bg-emerald-200/15 hover:bg-emerald-200/22 border border-emerald-200/20 text-left"
                  onClick={() => doCopy("Post text", postTextToCopy)}
                >
                  <div className="font-semibold">Copy post text</div>
                  <div className="text-xs text-white/55 mt-1">Caption + CTA</div>
                </button>

                {typeof navigator !== "undefined" && navigator.share ? (
                  <button
                    className="btn rounded-xl px-4 py-3 bg-white/12 hover:bg-white/18 text-left"
                    onClick={async () => {
                      try {
                        await navigator.share({
                          title: "Nightmare AI",
                          text: postTextToCopy,
                          url: window.location.origin,
                        });
                        setToast("Shared.");
                        setTimeout(() => setToast(""), 1100);
                      } catch {}
                    }}
                  >
                    <div className="font-semibold">Share</div>
                    <div className="text-xs text-white/55 mt-1">Share sheet</div>
                  </button>
                ) : null}
              </div>

              {toast ? <div className="mt-3 text-xs text-white/60">{toast}</div> : null}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
