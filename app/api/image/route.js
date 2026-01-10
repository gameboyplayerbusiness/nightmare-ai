import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Light safety transform:
 * If the dream contains gore-y terms, we keep the scene symbolic/abstract,
 * and explicitly forbid gore/blood/body-horror.
 */
function sanitizeDream(dream) {
  const text = String(dream || "").trim();
  if (!text) return "";

  const goreTerms = [
    "blood",
    "bleed",
    "gore",
    "gory",
    "sever",
    "decap",
    "dismember",
    "intestine",
    "organs",
    "eyeball",
    "teeth",
    "tooth",
    "pull",
    "rip",
    "tear",
    "cut",
    "knife",
    "stab",
    "murder",
    "corpse",
    "dead body",
    "skull",
    "bone",
    "vomit",
    "self harm",
    "suicide",
  ];

  const lower = text.toLowerCase();
  const containsGore = goreTerms.some((t) => lower.includes(t));

  if (!containsGore) return text;

  // We don’t delete the dream; we “defang” it into dream symbolism.
  return (
    text +
    "\n\n[NOTE: Render this symbolically and abstractly. Do NOT show blood, wounds, injury, or body horror. Imply dread through environment, shadows, surreal geometry, reflections, mist, and atmosphere.]"
  );
}

function buildPrompt(dreamText) {
  // This is the exact style lock you approved.
  // Keep it consistent for brand look + viral cohesion.
  return `
Create a single, scroll-stopping dream image based on the user nightmare.

STYLE (must follow):
- cinematic surreal horror, dreamlike, unsettling, NOT gory
- desaturated green/teal color grade (“sickly emerald haze”), low saturation
- heavy atmosphere: fog/mist, volumetric light beams, dust motes
- subtle film grain + vignette + faint lens haze
- realistic photographic look, high detail, moody contrast
- liminal spaces, uncanny scale, quiet dread
- no blood, no gore, no exposed wounds, no body horror

COMPOSITION:
- ONE image only (not a collage), vertical framing
- clear focal point and readable silhouette
- minimal text or none (no captions, no typography)
- avoid jump-scare comedy; keep it grounded and eerie

CONTENT RULES:
- interpret the nightmare symbolically, not literally
- keep it plausible in dream logic: wrong-house familiarity, endless corridors, forest paths, stairwells, waterline light, cracked ground, etc.
- if the nightmare mentions violence or injury, imply it abstractly via symbolism, shadows, environment, or impossible geometry (no explicit harm)

Add “uneasy stillness” and “an implied presence” (subtle, not explicit) to increase dread.

Now render the scene.
Nightmare: “${dreamText}”
`.trim();
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawDream = body?.dream;

    if (!rawDream || typeof rawDream !== "string" || !rawDream.trim()) {
      return new Response(JSON.stringify({ error: "Missing dream text." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const dream = sanitizeDream(rawDream);
    const prompt = buildPrompt(dream);

    // IMPORTANT:
    // - No `response_format` parameter here (that caused your 400 earlier).
    // - We request b64 output by reading `b64_json` from the response.
    // - Use a vertical size: 1024x1536 (portrait). Great for IG/TikTok cropping.
    const result = await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1536",
    });

    const b64 = result?.data?.[0]?.b64_json;

    if (!b64) {
      return new Response(JSON.stringify({ error: "Image generation failed." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ b64 }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err?.message || "Image server error.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
