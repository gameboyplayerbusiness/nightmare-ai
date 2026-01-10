import { NextResponse } from "next/server";

const MODEL = process.env.OPENAI_MODEL_SHORT || "gpt-4o-mini";

export async function POST(req) {
  try {
    const { dream } = await req.json();
    if (!dream || !dream.trim()) {
      return NextResponse.json({ error: "No dream provided" }, { status: 400 });
    }

    const prompt = `
You are an expert dream analyst with a subtle psychological-thriller undertone.
Write a SHORT dream reading: 2–3 sentences MAX, then ONE quiet question.

Hard rules:
- No markdown, no asterisks, no *** emphasis, no emojis.
- Do NOT continue the dream or invent new events.
- Be specific: reference 2–3 concrete details from the user’s dream.
- Use dream-analysis language lightly and naturally (emotion tagging, threat simulation, memory consolidation, schemas, continuity hypothesis, archetypes).
- Keep the eerie undertone subtle: like something was noticed that the dream tried to hide.
- Avoid cliché horror language ("haunted", "demon", etc.).
- Do not mention therapy, diagnosis, or disclaimers.
- Do NOT frame this as "a mirror speaking" or brand it as a mirror experience.

Goal:
Make it feel precise and personal, grounded in dream science, with a hook question.

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
        temperature: 0.58,
        max_output_tokens: 170,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error("OPENAI SHORT ERROR:", data);
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
    console.error("INTERPRET ERROR:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
