import Stripe from 'stripe';

import {headers} from "next/headers";
import { NextApiRequest } from 'next';
import { NextResponse } from "next/server";
import { stripe } from "@/lib/get-stripe";
import { Order } from "@/models/cart.model";
import Database from '@/lib/database';



export async function POST(req : Request){
    const body = await req.text();
    const signature = headers().get("Stripe-Signature") as string;
    
    let event: Stripe.Event;
    

    try{
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET!)
        console.log(event);
    }
    catch (error : any){
        console.log(error);
        return new NextResponse(`Webhook Error : ${error.message},`, { status : 400})
    }
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session?.metadata?.orderId;
    await Database();
    if (event.type == "checkout.session.completed"){
        //console.log("hello world");
        console.log(event);
        const update_order = await Order.findOneAndUpdate({_id : orderId }, {paid : true}, {new : true});
        console.log(update_order);
        
        //console.log(`Payment of Order id : ${orderId} succeeded check the database`);
    }

    return NextResponse.json({}, {status : 200});
}

