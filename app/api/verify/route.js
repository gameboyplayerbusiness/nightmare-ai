import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get('session_id');
    if (!session_id) return NextResponse.json({ paid: false });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const paid = session?.payment_status === 'paid';

    return NextResponse.json({ paid });
  } catch (error) {
    console.error('VERIFY ERROR:', error);
    return NextResponse.json({ paid: false });
  }
}
