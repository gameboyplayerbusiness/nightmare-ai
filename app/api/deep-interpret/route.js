import { NextResponse } from "next/server";

const MODEL = process.env.OPENAI_MODEL_DEEP || "gpt-4o-mini";

export async function POST(req) {
  try {
    const { dream } = await req.json();
    if (!dream || !dream.trim()) {
      return NextResponse.json({ error: "No dream provided" }, { status: 400 });
    }

    const prompt = `
You are an expert dream analyst. Your tone is grounded, specific, and slightly eerie in a psychological-thriller way.
You must INTERPRET the dream, not expand it. Do not invent new dream events.

Dream-science grounding (use naturally, not as buzzwords):
- threat simulation / rehearsal
- emotion tagging
- memory consolidation
- schemas / prediction
- continuity hypothesis
- archetypal imagery (light touch)

Style rules:
- No markdown emphasis (no **, no ***), no emojis.
- No "as an AI". No therapy/medical disclaimers.
- Avoid cliché horror language.
- Reference 3–6 concrete dream details from the user text.
- Do NOT brand this as a "mirror" experience. The mirror/portal idea can be a subtle undertone only (e.g., "a detail that looked back", "the dream refused to stay vague"), but never as the main framing.

Return EXACTLY these headings and sections, in this order:

TITLE:
DREAM PROFILE: (1–2 sentences)
INTERPRETATION: (5–7 sentences)
SYMBOLS & ASSOCIATIONS: (3–5 hyphen bullets)
LIKELY TRIGGER: (1 paragraph)
WHAT YOUR BRAIN IS DOING: (1 paragraph)
TONIGHT’S EXPERIMENT: (3 short lines)
POST TEXT:
- CAPTION: (2–4 lines, comment-bait, ends with: Find yours at <SITE_URL>)
- ON-IMAGE TEXT: (1–2 lines)

CAPTION rules:
- Punchy, human, specific to the dream.
- Invite comments with a question.
- End with the CTA line exactly: "Find yours at <SITE_URL>"

ON-IMAGE TEXT rules:
- 1–2 lines max, intriguing, no URL.

Nightmare (user text):
"""${dream.trim()}"""
`.trim();

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        input: prompt,
        temperature: 0.62,
        max_output_tokens: 900,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error("OPENAI DEEP ERROR:", data);
      return NextResponse.json({ error: "AI request failed" }, { status: 500 });
    }

    const text =
      data?.output?.[0]?.content?.map((c) => c?.text).filter(Boolean).join("\n") ||
      data?.output_text ||
      "";

    const cleaned = String(text)
      .replace(/\*\*\*/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .trim();

    return NextResponse.json({ text: cleaned });
  } catch (e) {
    console.error("DEEP ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
