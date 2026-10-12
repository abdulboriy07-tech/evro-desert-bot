import { NextResponse } from 'next/server';
import { listOrders, getAdminChatIds } from '@/lib/orderStore';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const pin = url.searchParams.get('pin') || req.headers.get('x-admin-pin');
  const ADMIN_PIN = process.env.ADMIN_PIN || '8686';

  if (pin !== ADMIN_PIN) {
    return NextResponse.json(
      { error: 'Unauthorized. Ushbu ma\'lumotlar faqat do\'kon ma\'muriyati uchun himoyalangan.' },
      { status: 401 }
    );
  }

  const orders = listOrders();
  return NextResponse.json({
    status: 'ok',
    count: orders.length,
    registeredAdminsCount: getAdminChatIds().length,
    orders: orders.slice(0, 50),
  });
}
