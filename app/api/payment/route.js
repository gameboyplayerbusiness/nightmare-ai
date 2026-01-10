import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function POST(req) {
  try {
    const { dream } = await req.json();
    if (!dream || !dream.trim()) {
      return NextResponse.json({ error: "No dream provided" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { name: "Nightmare AI — Full Reveal" },
            unit_amount: 200,
          },
          quantity: 1,
        },
      ],
      // IMPORTANT: Checkout returns to /portal first (loading journey), then it routes to /reveal
      success_url: `${baseUrl}/portal?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
      metadata: {
        dream: dream.slice(0, 4500),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("STRIPE ERROR:", e);
    return NextResponse.json(
      { error: "Stripe session creation failed" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get("session_id");
    if (!session_id) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    const paid =
      session.payment_status === "paid" ||
      session.status === "complete";

    return NextResponse.json({
      paid,
      dream: session?.metadata?.dream || "",
      currency: session.currency || "gbp",
      amount_total: session.amount_total || null,
    });
  } catch (e) {
    console.error("STRIPE VERIFY ERROR:", e);
    return NextResponse.json({ error: "Verify failed" }, { status: 500 });
  }
}
