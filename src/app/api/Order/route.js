import { saveOrder, notifyAdmins } from '@/lib/orderStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    status: 'ok',
    message: 'EVRO DESERT Order API is active.',
  });
}

export async function POST(req) {
  try {
    const data = await req.json();
    // console.log("🎂 [Yangi Buyurtma qabul qilindi]:", data);

    // Mahsulotlar ro'yxatini standartlashtirish
    let items = [];
    if (Array.isArray(data.items) && data.items.length > 0) {
      items = data.items.map((i) => ({
        id: i.id,
        name: i.name,
        price: Number(i.price) || 0,
        quantity: Number(i.quantity) || 1,
        filling: i.filling || '',
        customText: i.customText || '',
        weight: i.weight || '',
      }));
    } else if (data.product) {
      items = [
        {
          name: data.product,
          price: Number(data.price) || 0,
          quantity: Number(data.quantity) || 1,
          filling: data.filling || '',
          customText: data.customText || '',
          weight: data.weight || '',
        },
      ];
    }

    const total =
      Number(data.total) ||
      Number(data.price) ||
      items.reduce((sum, it) => sum + it.price * it.quantity, 0);

    const subtotal = Number(data.subtotal) || total;
    const deliveryFee = Number(data.deliveryFee) || 0;

    // orderStore orqali saqlash
    const order = saveOrder({
      name: data.name || '',
      phone: data.phone || '',
      address: data.address || '',
      deliveryType: data.deliveryType || 'delivery',
      deliveryTime: data.deliveryTime || data.date || 'Bugun (Tezkor 2 soat)',
      items,
      subtotal,
      deliveryFee,
      total,
      notes: data.notes || '',
    });

    // Telegram adminlarga xabar yuborish
    try {
      const itemsList = items
        .map(
          (it, idx) =>
            `${idx + 1}. <b>${it.name}</b> (${it.quantity} dona x ${it.price.toLocaleString('uz-UZ')} so'm)` +
            (it.filling ? `\n   🍓 Nachinka: <i>${it.filling}</i>` : '') +
            (it.customText ? `\n   ✍️ Tabrik: <i>"${it.customText}"</i>` : '')
        )
        .join('\n');

      const adminNotice =
        `🎂 <b>YANGI BUYURTMA KELDI!</b>\n\n` +
        `🆔 <b>Buyurtma kodi:</b> <code>#${order.id}</code>\n` +
        (order.name ? `👤 <b>Mijoz:</b> ${order.name}\n` : '') +
        (order.phone ? `📞 <b>Telefon:</b> ${order.phone}\n` : '') +
        `🍰 <b>Tarkib:</b>\n${itemsList}\n\n` +
        `💰 <b>Jami summa:</b> <b>${total.toLocaleString('uz-UZ')} so'm</b>\n` +
        `🚚 <b>Yetkazish turi:</b> ${order.deliveryType === 'pickup' ? "O'zi olib ketadi" : (order.address || 'Yetkazib berish')}\n` +
        `📅 <b>Vaqt:</b> ${data.date || 'Tez orada'}`;

      await notifyAdmins(adminNotice);
    } catch (tgErr) {
      console.warn('Admin notify warning:', tgErr);
    }

    // MongoDB ga saqlash (ixtiyoriy)
    try {
      if (process.env.MONGODB_URI) {
        const { default: Database } = await import('@/lib/database');
        const { Order } = await import('@/models/cart.model');
        await Database();
        await Order.create({
          username: order.name || 'Tezkor mijoz',
          Address: order.address || 'Pickup',
          Email: order.phone || 'Telefon kiritilmadi',
          cartProducts: items,
        });
      }
    } catch (dbError) {
      // DB error is non-blocking
    }

    return Response.json({
      success: true,
      message: 'Buyurtma muvaffaqiyatli qabul qilindi!',
      orderId: order.id,
      cleanCode: order.cleanCode,
    });
  } catch (error) {
    console.error('Order processing error:', error);
    return Response.json(
      { success: false, message: 'Buyurtmani qabul qilishda xatolik yuz berdi.' },
      { status: 500 }
    );
  }
}