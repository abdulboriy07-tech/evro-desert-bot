import Stripe from 'stripe'

export const stripe = new Stripe((process.env.NEXT_PUBLIC_SECRET_KEY || 'sk_placeholder') as string, {
    apiVersion : "2024-04-10",
    typescript : true,
});