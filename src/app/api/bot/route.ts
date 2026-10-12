import { NextRequest, NextResponse } from 'next/server';
import {
  BOT_TOKEN,
  BOT_USERNAME,
  CARD_NUMBER,
  CARD_HOLDER,
  SHOP_PHONE,
  findOrder,
  findLatestOrderByChat,
  saveOrder,
  updateOrder,
  listOrders,
  registerAdminChat,
  removeAdminChat,
  getAdminChatIds,
  isAdminChat,
  getOrderStats,
  getOrderStatusDisplay,
  notifyAdmins,
  notifyAdminsPhoto,
  sendTelegramMessage,
  editTelegramMessage,
  editTelegramCaption,
  answerCallbackQuery,
  decodeOrderFromParam,
  parseOrderFromText,
  resetChatMenuButton,
  syncAdminsWithTelegramCloud,
} from '@/lib/orderStore';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://bakery-magician.vercel.app';
const ADMIN_PIN = process.env.ADMIN_PIN || '8686';

// -------------------------------------------------------------
// 1. KLAVIATURALAR: MIJOZ VA ADMIN MENYUSINI MUTLAQO ALOHIDA AJRATISH
// -------------------------------------------------------------

// Oddiy mijozlar klaviaturasi (Hech qanday admin tugmasi yo'q)
function getUserKeyboard() {
  return {
    keyboard: [
      [{ text: '📦 Buyurtmam holati' }],
      [{ text: '🌐 Rasmiy sayt' }, { text: '📞 Aloqa' }],
    ],
    resize_keyboard: true,
  };
}

// Do'kon administratori klaviaturasi (Faqat paroldan o'tgan adminlar uchun)
function getAdminKeyboard() {
  return {
    keyboard: [
      [{ text: '📋 Buyurtmalar' }, { text: '⏳ Yangi cheklar' }],
      [{ text: '📊 Statistika' }, { text: '👑 Admin menyu' }],
      [{ text: '👤 Mijoz menyusiga o\'tish' }],
    ],
    resize_keyboard: true,
  };
}

function getMainKeyboard(chatId: number | string) {
  return isAdminChat(chatId) ? getAdminKeyboard() : getUserKeyboard();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const setup = searchParams.get('setup');

  if (getAdminChatIds().length === 0) {
    await syncAdminsWithTelegramCloud();
  }

  let webhookResult = null;
  if (setup === '1') {
    try {
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
      const protocol = host?.includes('localhost') ? 'http' : 'https';
      const baseUrl = host ? `${protocol}://${host}` : SITE_URL;
      const webhookUrl = `${baseUrl}/api/bot`;
      const res = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
      );
      webhookResult = await res.json();
    } catch (e: any) {
      webhookResult = { error: e.message };
    }
  }

  let info = null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    info = await res.json();
  } catch (e: any) {
    info = { error: e.message };
  }

  return NextResponse.json({
    status: 'ok',
    bot: BOT_USERNAME,
    adminCount: getAdminChatIds().length,
    webhookInfo: info,
    webhookSetupAttempt: webhookResult,
    usage: 'Open /api/bot?setup=1 to bind webhook to this domain.',
  });
}

export async function POST(req: NextRequest) {
  try {
    if (getAdminChatIds().length === 0) {
      await syncAdminsWithTelegramCloud();
    }

    const update = await req.json();

    // =========================================================
    // 1. INLINE CALLBACK QUERY ISHLASH (Tugmalar bosilganda)
    // =========================================================
    if (update.callback_query) {
      const cq = update.callback_query;
      const cqId = cq.id;
      const data = cq.data || '';
      const fromUser = cq.from;
      const chatId = cq.message?.chat?.id;
      const messageId = cq.message?.message_id;

      // Web App tugmasini doimiy tozalash
      if (chatId) resetChatMenuButton(chatId).catch(() => {});

      // -------------------------------------------------------
      // A) MIJOZ: [ 💳 To'lov qilish ] (Barcha foydalanuvchilar uchun)
      // -------------------------------------------------------
      if (data.startsWith('pay_')) {
        const rawId = data.replace('pay_', '');
        let order = findOrder(rawId) || findLatestOrderByChat(chatId);

        if (!order && cq.message?.text) {
          const parsed = parseOrderFromText(cq.message.text);
          if (parsed) {
            order = saveOrder({
              ...parsed,
              customerChatId: chatId,
              telegramUser: {
                id: fromUser.id,
                username: fromUser.username,
                firstName: fromUser.first_name,
                lastName: fromUser.last_name,
              },
            });
          }
        }

        await answerCallbackQuery(cqId, "💳 To'lov ma'lumotlari");

        const displayCode = order ? `#${order.id}` : `#ED-${rawId.replace(/^ED-/i, '')}`;
        const totalLine = order?.total
          ? `💰 <b>To'lov summasi:</b> <b>${order.total.toLocaleString('uz-UZ')} so'm</b>\n\n`
          : '';

        const payMessage =
          `💳 <b>EVRO DESERT — To'lov ma'lumotlari:</b>\n\n` +
          `🆔 <b>Buyurtma kodi:</b> <code>${displayCode}</code>\n` +
          totalLine +
          `💳 <b>Karta raqami:</b>\n<code>${CARD_NUMBER}</code>\n` +
          `<i>(Nusxalash uchun karta raqami ustiga bosing)</i>\n\n` +
          `👤 <b>Karta egasi:</b> ${CARD_HOLDER}\n` +
          `📲 <b>Click / Payme orqali:</b> ${SHOP_PHONE}\n\n` +
          `📸 <b>Iltimos, to'lovni amalga oshirgach, to'lov cheki (skrinshot)ni ushbu chatga rasm qilib yuboring!</b>`;

        await sendTelegramMessage(chatId, payMessage, getMainKeyboard(chatId));

        if (order) {
          updateOrder(order.id, {
            status: 'pending_payment',
            customerChatId: fromUser.id,
          });
        }

        return NextResponse.json({ ok: true });
      }

      // -------------------------------------------------------
      // B) MIJOZ: [ 🔄 Holatni yangilash ] (O'z buyurtmasini kuzatish)
      // -------------------------------------------------------
      if (data.startsWith('track_')) {
        const orderId = data.replace('track_', '');
        const order = findOrder(orderId) || findLatestOrderByChat(chatId);
        await answerCallbackQuery(cqId, "🔄 Holat yangilandi");

        if (order) {
          const display = getOrderStatusDisplay(order.status, order.deliveryType);
          const trackText =
            `📦 <b>BUYURTMANGIZ HOLATI</b>\n\n` +
            `🆔 <b>Buyurtma:</b> <code>#${order.id}</code>\n` +
            `🍰 <b>Tarkib:</b> ${(order.items || []).map((i) => `${i.name} (${i.quantity} dona)`).join(', ')}\n` +
            `💰 <b>Summa:</b> <b>${order.total.toLocaleString('uz-UZ')} so'm</b>\n` +
            `🚚 <b>Usul:</b> ${order.deliveryType === 'pickup' ? "🏬 Olib ketish" : `🚚 Yetkazib berish (${order.address || "Qo'qon"})`}\n` +
            `⏰ <b>Muddat:</b> ${order.deliveryTime || '2 soat ichida'}\n\n` +
            `📊 <b>Bosqich:</b>\n<code>${display.progress}</code>\n\n` +
            `ℹ️ <b>Holat:</b> <b>${display.badge}</b>\n` +
            `<i>${display.desc}</i>`;

          await sendTelegramMessage(chatId, trackText, {
            inline_keyboard: [
              [{ text: '🔄 Yana yangilash', callback_data: `track_${order.id}` }],
            ],
          });
        }
        return NextResponse.json({ ok: true });
      }

      // =======================================================
      // ADMIN AMALLARI UCHUN XAVFSIZLIK FILTRI (RBAC GUARD)
      // Oddiy mijozlar admin tugmalarini bosa olmaydi!
      // =======================================================
      const isActorAdmin = isAdminChat(fromUser.id) || isAdminChat(chatId);
      const isAdminAction =
        data.startsWith('accept_') ||
        data.startsWith('ready_') ||
        data.startsWith('deliver_') ||
        data.startsWith('cancel_') ||
        data.startsWith('admin_');

      if (isAdminAction && !isActorAdmin) {
        await answerCallbackQuery(
          cqId,
          "⛔️ Ushbu amal faqat do'kon administratori uchun!",
          true
        );
        return NextResponse.json({ ok: true });
      }

      // -------------------------------------------------------
      // C) ADMIN: [ ✅ Buyurtmani qabul qilish ]
      // -------------------------------------------------------
      if (data.startsWith('accept_')) {
        const payload = data.replace('accept_', '');
        const parts = payload.split('_');
        const orderId = parts[0];
        const targetCustomerChatId = parts[1] || null;

        const order = findOrder(orderId);
        const customerChatId =
          targetCustomerChatId ||
          order?.customerChatId ||
          order?.telegramUser?.id;

        await answerCallbackQuery(cqId, "✅ Buyurtma qabul qilindi!");

        if (order) {
          updateOrder(order.id, { status: 'confirmed' });
        }

        const readyCbData = customerChatId
          ? `ready_${orderId}_${customerChatId}`
          : `ready_${orderId}`;

        const cancelCbData = customerChatId
          ? `cancel_${orderId}_${customerChatId}`
          : `cancel_${orderId}`;

        const adminNewCaption =
          `✅ <b>BUYURTMA QABUL QILINDI!</b>\n\n` +
          `🆔 <b>Buyurtma:</b> #${order?.id || orderId}\n` +
          (order?.name ? `👤 <b>Mijoz:</b> ${order.name} (${order.phone || ''})\n` : '') +
          (order?.total ? `💰 <b>Summa:</b> ${order.total.toLocaleString('uz-UZ')} so'm\n` : '') +
          `🚚 <b>Usul:</b> ${order?.deliveryType === 'pickup' ? "Olib ketish" : `Yetkazish (${order?.address || "Qo'qon"})`}\n` +
          `🕒 <b>Holat:</b> 👨‍🍳 Qandolatchi tayyorlamoqda...`;

        const adminNextButtons = {
          inline_keyboard: [
            [
              {
                text: '🎂 Tayyor bo\'ldi',
                callback_data: readyCbData,
              },
            ],
            [
              {
                text: '❌ Bekor qilish',
                callback_data: cancelCbData,
              },
            ],
          ],
        };

        if (cq.message?.caption !== undefined || Boolean(cq.message?.photo)) {
          await editTelegramCaption(chatId, messageId, adminNewCaption, adminNextButtons);
        } else {
          await editTelegramMessage(chatId, messageId, adminNewCaption, adminNextButtons);
        }

        // MIJOZGA DARHOL XABAR (Faqat mijoz xabarnoma oladi)
        if (customerChatId) {
          const deliveryNote =
            order?.deliveryType === 'pickup'
              ? '🏬 Buyurtmangiz tayyor bo\'lgach, do\'konimizdan olib ketishingiz mumkin.'
              : `🚚 Belgilangan muddatda (${order?.deliveryTime || '2 soat ichida'}) yetkazib beriladi yoki olib ketishingiz mumkin.`;

          const customerMessage =
            `✅ <b>Buyurtmangiz qabul qilindi!</b> 🎉\n\n` +
            `To'lov cheki tasdiqlandi. Qandolatchi mutaxassisimiz buyurtmangizni tayyorlashga kirishdi.\n\n` +
            `${deliveryNote}\n\n` +
            `Buyurtma tayyor bo'lishi bilan sizga xabar beramiz! 🍰\n` +
            `Rahmat, <b>EVRO DESERT</b>! ✨`;

          await sendTelegramMessage(customerChatId, customerMessage, getUserKeyboard());
        }

        return NextResponse.json({ ok: true });
      }

      // -------------------------------------------------------
      // D) ADMIN: [ 🎂 Tayyor bo'ldi ]
      // -------------------------------------------------------
      if (data.startsWith('ready_')) {
        const payload = data.replace('ready_', '');
        const parts = payload.split('_');
        const orderId = parts[0];
        const targetCustomerChatId = parts[1] || null;

        const order = findOrder(orderId);
        const customerChatId =
          targetCustomerChatId ||
          order?.customerChatId ||
          order?.telegramUser?.id;

        await answerCallbackQuery(cqId, "🎂 Mijozga tayyorligi bildirildi!");

        if (order) {
          updateOrder(order.id, { status: 'ready' });
        }

        const deliverCbData = customerChatId
          ? `deliver_${orderId}_${customerChatId}`
          : `deliver_${orderId}`;

        const cancelCbData = customerChatId
          ? `cancel_${orderId}_${customerChatId}`
          : `cancel_${orderId}`;

        const adminReadyCaption =
          `🎂 <b>BUYURTMA TAYYOR BO'LDI!</b>\n\n` +
          `🆔 <b>Buyurtma:</b> #${order?.id || orderId}\n` +
          (order?.name ? `👤 <b>Mijoz:</b> ${order.name} (${order.phone || ''})\n` : '') +
          (order?.total ? `💰 <b>Summa:</b> ${order.total.toLocaleString('uz-UZ')} so'm\n` : '') +
          `✅ <i>Mijozga tayyor bo'lgani haqida xabarnoma yuborildi!</i>`;

        const adminDeliverButtons = {
          inline_keyboard: [
            [
              {
                text: '🚚 Topshirildi / Yetkazildi',
                callback_data: deliverCbData,
              },
            ],
            [
              {
                text: '❌ Bekor qilish',
                callback_data: cancelCbData,
              },
            ],
          ],
        };

        if (cq.message?.caption !== undefined || Boolean(cq.message?.photo)) {
          await editTelegramCaption(chatId, messageId, adminReadyCaption, adminDeliverButtons);
        } else {
          await editTelegramMessage(chatId, messageId, adminReadyCaption, adminDeliverButtons);
        }

        // MIJOZGA DARHOL XABAR
        if (customerChatId) {
          const readyNote =
            order?.deliveryType === 'pickup'
              ? '🏬 Do\'konimizga kelib olib ketishingiz mumkin! Manzil: Qo\'qon shahri.'
              : '🚚 Kuryerimiz buyurtmangizni manzilingizga yetkazish uchun yo\'lga chiqmoqda!';

          const customerReadyMessage =
            `🎂 <b>Buyurtmangiz tayyor bo'ldi!</b> 🎉✨\n\n` +
            `🍰 Siz buyurtma qilgan shirinlik to'liq tayyor bo'ldi!\n\n` +
            `${readyNote}\n\n` +
            `Yoqimli ishtaha tilaymiz! 💖\n` +
            `📞 Aloqa: ${SHOP_PHONE}`;

          await sendTelegramMessage(customerChatId, customerReadyMessage, getUserKeyboard());
        }

        return NextResponse.json({ ok: true });
      }

      // -------------------------------------------------------
      // E) ADMIN: [ 🚚 Topshirildi / Yetkazildi ]
      // -------------------------------------------------------
      if (data.startsWith('deliver_')) {
        const payload = data.replace('deliver_', '');
        const parts = payload.split('_');
        const orderId = parts[0];
        const targetCustomerChatId = parts[1] || null;

        const order = findOrder(orderId);
        const customerChatId =
          targetCustomerChatId ||
          order?.customerChatId ||
          order?.telegramUser?.id;

        await answerCallbackQuery(cqId, "🚚 Buyurtma topshirildi!");

        if (order) {
          updateOrder(order.id, { status: 'delivered' });
        }

        const adminFinalCaption =
          `✨ <b>BUYURTMA MUVAFFAQIYATLI TOPSHIRILDI!</b>\n\n` +
          `🆔 <b>Buyurtma:</b> #${order?.id || orderId}\n` +
          (order?.name ? `👤 <b>Mijoz:</b> ${order.name} (${order.phone || ''})\n` : '') +
          `✅ <i>Buyurtma yopildi.</i>`;

        if (cq.message?.caption !== undefined || Boolean(cq.message?.photo)) {
          await editTelegramCaption(chatId, messageId, adminFinalCaption);
        } else {
          await editTelegramMessage(chatId, messageId, adminFinalCaption);
        }

        if (customerChatId) {
          await sendTelegramMessage(
            customerChatId,
            `💖 <b>Buyurtmangiz muvaffaqiyatli topshirildi!</b>\n\n` +
              `EVRO DESERT shirinliklari dasturxoningizga fayz bag'ishlasin! Yoqimli ishtaha tilaymiz! ✨🍰`,
            getUserKeyboard()
          );
        }

        return NextResponse.json({ ok: true });
      }

      // -------------------------------------------------------
      // F) ADMIN: [ ❌ Bekor qilish ]
      // -------------------------------------------------------
      if (data.startsWith('cancel_')) {
        const payload = data.replace('cancel_', '');
        const parts = payload.split('_');
        const orderId = parts[0];
        const targetCustomerChatId = parts[1] || null;

        const order = findOrder(orderId);
        const customerChatId =
          targetCustomerChatId ||
          order?.customerChatId ||
          order?.telegramUser?.id;

        await answerCallbackQuery(cqId, "❌ Buyurtma bekor qilindi");

        if (order) {
          updateOrder(order.id, { status: 'cancelled' });
        }

        const cancelCaption = `❌ <b>Buyurtma bekor qilindi.</b> (#${orderId})`;
        if (cq.message?.caption !== undefined || Boolean(cq.message?.photo)) {
          await editTelegramCaption(chatId, messageId, cancelCaption);
        } else {
          await editTelegramMessage(chatId, messageId, cancelCaption);
        }

        if (customerChatId) {
          await sendTelegramMessage(
            customerChatId,
            `⚠️ <b>Buyurtmangiz bekor qilindi.</b>\n\nSavollaringiz bo'lsa, iltimos administrator bilan bog'laning: ${SHOP_PHONE}`,
            getUserKeyboard()
          );
        }

        return NextResponse.json({ ok: true });
      }

      // -------------------------------------------------------
      // G) ADMIN PANEL BOSHQARUV FILTIRLARI
      // -------------------------------------------------------
      if (data.startsWith('admin_')) {
        const action = data.replace('admin_', '');
        await answerCallbackQuery(cqId);

        if (action === 'stats') {
          const stats = getOrderStats();
          const statsMsg =
            `📊 <b>EVRO DESERT — Buyurtmalar statistikasi:</b>\n\n` +
            `📦 <b>Jami buyurtmalar:</b> ${stats.totalOrders} ta\n` +
            `💰 <b>Umumiy aylanma:</b> ${stats.totalSum.toLocaleString('uz-UZ')} so'm\n\n` +
            `⏳ <b>Chek kutilmoqda:</b> ${stats.paidChecking} ta\n` +
            `👨‍🍳 <b>Tayyorlanmoqda:</b> ${stats.confirmed} ta\n` +
            `🎂 <b>Tayyor bo'lganlar:</b> ${stats.ready} ta\n` +
            `🚚 <b>Topshirilganlar:</b> ${stats.delivered} ta\n` +
            `❌ <b>Bekor qilingan:</b> ${stats.cancelled} ta`;

          await sendTelegramMessage(chatId, statsMsg, getAdminKeyboard());
          return NextResponse.json({ ok: true });
        }

        if (action === 'checks') {
          const orders = listOrders().filter((o) => o.status === 'paid_checking');
          if (orders.length === 0) {
            await sendTelegramMessage(
              chatId,
              `✅ <i>Hozirda yangi to'lov cheklari mavjud emas.</i>`,
              getAdminKeyboard()
            );
          } else {
            for (const o of orders.slice(0, 5)) {
              const custChat = o.customerChatId || o.telegramUser?.id || '';
              await sendTelegramMessage(
                chatId,
                `⏳ <b>Yangi to'lov cheki:</b>\n` +
                  `🆔 <b>#${o.id}</b> | 💰 ${o.total.toLocaleString('uz-UZ')} so'm\n` +
                  `👤 ${o.name} (${o.phone})\n` +
                  `🍰 ${(o.items || []).map((i) => i.name).join(', ')}`,
                {
                  inline_keyboard: [
                    [
                      {
                        text: '✅ Qabul qilish',
                        callback_data: `accept_${o.id}_${custChat}`,
                      },
                      {
                        text: '❌ Bekor qilish',
                        callback_data: `cancel_${o.id}_${custChat}`,
                      },
                    ],
                  ],
                }
              );
            }
          }
          return NextResponse.json({ ok: true });
        }

        if (action === 'cooking') {
          const orders = listOrders().filter((o) => o.status === 'confirmed');
          if (orders.length === 0) {
            await sendTelegramMessage(
              chatId,
              `👨‍🍳 <i>Hozirda tayyorlanayotgan buyurtmalar yo'q.</i>`,
              getAdminKeyboard()
            );
          } else {
            for (const o of orders.slice(0, 5)) {
              const custChat = o.customerChatId || o.telegramUser?.id || '';
              await sendTelegramMessage(
                chatId,
                `👨‍🍳 <b>Jarayondagi buyurtma:</b>\n` +
                  `🆔 <b>#${o.id}</b> | 💰 ${o.total.toLocaleString('uz-UZ')} so'm\n` +
                  `👤 ${o.name} (${o.phone})\n` +
                  `🍰 ${(o.items || []).map((i) => `${i.name} (x${i.quantity})`).join(', ')}\n` +
                  `⏰ ${o.deliveryTime || '2 soat'} | 🚚 ${o.deliveryType === 'pickup' ? 'Olib ketish' : o.address}`,
                {
                  inline_keyboard: [
                    [
                      {
                        text: '🎂 Tayyor bo\'ldi',
                        callback_data: `ready_${o.id}_${custChat}`,
                      },
                      {
                        text: '❌ Bekor qilish',
                        callback_data: `cancel_${o.id}_${custChat}`,
                      },
                    ],
                  ],
                }
              );
            }
          }
          return NextResponse.json({ ok: true });
        }

        if (action === 'all') {
          const orders = listOrders();
          if (orders.length === 0) {
            await sendTelegramMessage(
              chatId,
              `📋 <i>Tizimda hozircha buyurtmalar yo'q.</i>`,
              getAdminKeyboard()
            );
          } else {
            const listText = orders
              .slice(0, 8)
              .map((o, idx) => {
                const badge =
                  o.status === 'confirmed'
                    ? '👨‍🍳 Tayyorlanmoqda'
                    : o.status === 'ready'
                    ? '🎂 Tayyor'
                    : o.status === 'delivered'
                    ? '🚚 Topshirildi'
                    : o.status === 'paid_checking'
                    ? '⏳ Chek kutilmoqda'
                    : '🟡 Yangi';
                return `${idx + 1}. <b>#${o.id}</b> [${badge}]\n   👤 ${o.name || 'Mijoz'} (${o.phone})\n   💰 ${o.total.toLocaleString('uz-UZ')} so'm`;
              })
              .join('\n\n');

            await sendTelegramMessage(
              chatId,
              `📋 <b>Oxirgi buyurtmalar:</b>\n\n${listText}`,
              getAdminKeyboard()
            );
          }
          return NextResponse.json({ ok: true });
        }

        if (action === 'logout') {
          removeAdminChat(chatId);
          await sendTelegramMessage(
            chatId,
            `👋 <b>Administrator panelidan chiqdingiz.</b>\n\nSiz hozirda oddiy mijoz rejimidasiz. Qayta kirish uchun: <code>/admin PAROL</code>`,
            getUserKeyboard()
          );
          return NextResponse.json({ ok: true });
        }

        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    // =========================================================
    // 2. MATN YOKI RASMLI XABARLAR ISHLASH
    // =========================================================
    if (!update || !update.message) {
      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    const chatId = message.chat.id;
    const userId = message.from?.id;
    const userName =
      message.from?.first_name ||
      message.from?.username ||
      'Hurmatli mijoz';
    const text = (message.text || '').trim();

    // Har bir chatda Web App "Shirinlik xarid qilish" tugmasini tozalab, standart buyruqlar menyusiga o'tkazish
    resetChatMenuButton(chatId).catch(() => {});

    // ---------------------------------------------------------
    // A) ADMIN: /admin yoki /login BUYRUQLARI
    // ---------------------------------------------------------
    const adminLoginMatch = text.match(/^\/(?:admin|login)(?:\s+([A-Za-z0-9_-]+))?$/i);
    if (adminLoginMatch) {
      const providedPin = adminLoginMatch[1]?.trim();

      // Agar parol to'g'ri kiritilgan bo'lsa
      if (providedPin === ADMIN_PIN) {
        registerAdminChat(chatId);
        const stats = getOrderStats();

        const adminDashboard =
          `👑 <b>Xush kelibsiz, Administrator!</b>\n\n` +
          `Siz muvaffaqiyatli tizimga kirdingiz. Sizning ID: <code>${chatId}</code>\n\n` +
          `📊 <b>Bugungi ko'rsatkichlar:</b>\n` +
          `• 📦 Jami buyurtmalar: <b>${stats.totalOrders} ta</b>\n` +
          `• 💰 Umumiy summa: <b>${stats.totalSum.toLocaleString('uz-UZ')} so'm</b>\n` +
          `• ⏳ Chek kutilmoqda: <b>${stats.paidChecking} ta</b>\n` +
          `• 👨‍🍳 Jarayonda: <b>${stats.confirmed} ta</b>\n` +
          `• 🎂 Tayyor: <b>${stats.ready} ta</b>\n\n` +
          `<i>Buyurtmalarni tezkor boshqarish uchun quyidagi bo'limni tanlang:</i>`;

        await sendTelegramMessage(chatId, adminDashboard, {
          inline_keyboard: [
            [
              { text: `⏳ Yangi cheklar (${stats.paidChecking})`, callback_data: 'admin_checks' },
              { text: `👨‍🍳 Tayyorlanayotganlar (${stats.confirmed})`, callback_data: 'admin_cooking' },
            ],
            [
              { text: '📋 Barcha buyurtmalar', callback_data: 'admin_all' },
              { text: '📊 Statistika', callback_data: 'admin_stats' },
            ],
            [
              { text: '🚪 Chiqish (Logout)', callback_data: 'admin_logout' },
            ],
          ],
        });

        await sendTelegramMessage(
          chatId,
          `🔔 <i>Admin boshqaruv tugmalari pastki menyuda faollashtirildi.</i>`,
          getAdminKeyboard()
        );
        return NextResponse.json({ ok: true });
      }

      // Agar foydalanuvchi allaqachon avtorizatsiyadan o'tgan admin bo'lsa
      if (isAdminChat(chatId)) {
        const stats = getOrderStats();
        const adminDashboard =
          `👑 <b>EVRO DESERT — Administrator Paneli</b>\n\n` +
          `📊 <b>Bugungi ko'rsatkichlar:</b>\n` +
          `• 📦 Jami buyurtmalar: <b>${stats.totalOrders} ta</b>\n` +
          `• 💰 Umumiy summa: <b>${stats.totalSum.toLocaleString('uz-UZ')} so'm</b>\n` +
          `• ⏳ Chek kutilmoqda: <b>${stats.paidChecking} ta</b>\n` +
          `• 👨‍🍳 Jarayonda: <b>${stats.confirmed} ta</b>\n` +
          `• 🎂 Tayyor: <b>${stats.ready} ta</b>`;

        await sendTelegramMessage(chatId, adminDashboard, {
          inline_keyboard: [
            [
              { text: `⏳ Yangi cheklar (${stats.paidChecking})`, callback_data: 'admin_checks' },
              { text: `👨‍🍳 Tayyorlanayotganlar (${stats.confirmed})`, callback_data: 'admin_cooking' },
            ],
            [
              { text: '📋 Barcha buyurtmalar', callback_data: 'admin_all' },
              { text: '📊 Statistika', callback_data: 'admin_stats' },
            ],
            [
              { text: '🚪 Chiqish (Logout)', callback_data: 'admin_logout' },
            ],
          ],
        });
        return NextResponse.json({ ok: true });
      }

      // Agar oddiy foydalanuvchi /admin yozsa va parol xato bo'lsa yoki kiritilmagan bo'lsa:
      await sendTelegramMessage(
        chatId,
        `🔒 <b>Administrator Paneli — Kirish</b>\n\n` +
          `Ushbu bo'lim faqat do'kon ma'muriyati uchun mo'ljallangan.\n\n` +
          `Agar siz administrator bo'lsangiz, maxfiy PIN parolni quyidagicha yuboring:\n` +
          `👉 <code>/admin PAROL</code>`,
        getUserKeyboard()
      );
      return NextResponse.json({ ok: true });
    }

    // ---------------------------------------------------------
    // B) ADMIN: /logout yoki "👤 Mijoz menyusiga o'tish"
    // ---------------------------------------------------------
    if (text === '/logout' || text === '👤 Mijoz menyusiga o\'tish') {
      removeAdminChat(chatId);
      await sendTelegramMessage(
        chatId,
        `👤 <b>Mijoz rejimi yoqildi.</b>\n\nSiz hozirda oddiy mijoz interfeysini ko'rmoqdasiz. Admin paneliga qaytish uchun: <code>/admin PAROL</code>`,
        getUserKeyboard()
      );
      return NextResponse.json({ ok: true });
    }

    // ---------------------------------------------------------
    // C) ADMIN BO'LIMLARI (Faqat paroldan o'tgan adminlar uchun)
    // ---------------------------------------------------------
    if (text === '👑 Admin menyu' || text === '/panel' || text === '/dashboard') {
      if (!isAdminChat(chatId)) {
        await sendTelegramMessage(
          chatId,
          `🔒 <i>Ushbu bo'lim faqat administratorlar uchun mo'ljallangan.</i>`,
          getUserKeyboard()
        );
        return NextResponse.json({ ok: true });
      }

      const stats = getOrderStats();
      const adminDashboard =
        `👑 <b>EVRO DESERT — Administrator Paneli</b>\n\n` +
        `• 📦 Jami buyurtmalar: <b>${stats.totalOrders} ta</b>\n` +
        `• 💰 Umumiy summa: <b>${stats.totalSum.toLocaleString('uz-UZ')} so'm</b>\n` +
        `• ⏳ Chek kutilmoqda: <b>${stats.paidChecking} ta</b>\n` +
        `• 👨‍🍳 Jarayonda: <b>${stats.confirmed} ta</b>\n` +
        `• 🎂 Tayyor: <b>${stats.ready} ta</b>`;

      await sendTelegramMessage(chatId, adminDashboard, {
        inline_keyboard: [
          [
            { text: `⏳ Yangi cheklar (${stats.paidChecking})`, callback_data: 'admin_checks' },
            { text: `👨‍🍳 Tayyorlanayotganlar (${stats.confirmed})`, callback_data: 'admin_cooking' },
          ],
          [
            { text: '📋 Barcha buyurtmalar', callback_data: 'admin_all' },
            { text: '📊 Statistika', callback_data: 'admin_stats' },
          ],
          [
            { text: '🚪 Chiqish (Logout)', callback_data: 'admin_logout' },
          ],
        ],
      });
      return NextResponse.json({ ok: true });
    }

    if (text === '📋 Buyurtmalar' || text === '/orders' || text === '/buyurtmalar') {
      if (!isAdminChat(chatId)) {
        await sendTelegramMessage(
          chatId,
          `⛔️ <b>Ruxsat berilmadi!</b>\n\nBarcha buyurtmalar ro'yxati faqat administratorlar uchun ko'rinadi.\nO'zingizning buyurtmangizni ko'rish uchun <b>"📦 Buyurtmam holati"</b> tugmasini bosing.`,
          getUserKeyboard()
        );
        return NextResponse.json({ ok: true });
      }

      const orders = listOrders();
      if (orders.length === 0) {
        await sendTelegramMessage(chatId, `📋 <i>Tizimda hali buyurtmalar yo'q.</i>`, getAdminKeyboard());
      } else {
        const topOrders = orders
          .slice(0, 5)
          .map((o, idx) => {
            const statusLabel =
              o.status === 'confirmed'
                ? '👨‍🍳 Tayyorlanmoqda'
                : o.status === 'ready'
                ? '🎂 Tayyor'
                : o.status === 'delivered'
                ? '🚚 Topshirildi'
                : o.status === 'paid_checking'
                ? '⏳ Chek kutilmoqda'
                : '🟡 Yangi';
            return (
              `${idx + 1}. <b>#${o.id}</b> [${statusLabel}]\n` +
              `   👤 ${o.name || 'Mijoz'} (${o.phone || 'Tel yo\'q'})\n` +
              `   🍰 ${(o.items || []).map((i) => `${i.name} (x${i.quantity})`).join(', ')}\n` +
              `   💰 <b>${o.total.toLocaleString('uz-UZ')} so'm</b> | 🚚 ${o.deliveryType === 'pickup' ? 'Olib ketish' : 'Yetkazish'}`
            );
          })
          .join('\n\n');

        await sendTelegramMessage(chatId, `📋 <b>EVRO DESERT — Oxirgi 5 ta buyurtma:</b>\n\n${topOrders}`, getAdminKeyboard());
      }
      return NextResponse.json({ ok: true });
    }

    if (text === '⏳ Yangi cheklar' || text === '/checks' || text === '/cheklar') {
      if (!isAdminChat(chatId)) {
        await sendTelegramMessage(chatId, `⛔️ <i>Ushbu bo'lim faqat administratorlar uchun.</i>`, getUserKeyboard());
        return NextResponse.json({ ok: true });
      }

      const orders = listOrders().filter((o) => o.status === 'paid_checking');
      if (orders.length === 0) {
        await sendTelegramMessage(chatId, `✅ <i>Hozirda tasdiqlash kutilayotgan to'lov cheklari yo'q.</i>`, getAdminKeyboard());
      } else {
        for (const o of orders.slice(0, 5)) {
          const custChat = o.customerChatId || o.telegramUser?.id || '';
          await sendTelegramMessage(
            chatId,
            `⏳ <b>Yangi to'lov cheki:</b>\n` +
              `🆔 <b>#${o.id}</b> | 💰 ${o.total.toLocaleString('uz-UZ')} so'm\n` +
              `👤 ${o.name} (${o.phone})\n` +
              `🍰 ${(o.items || []).map((i) => i.name).join(', ')}`,
            {
              inline_keyboard: [
                [
                  { text: '✅ Qabul qilish', callback_data: `accept_${o.id}_${custChat}` },
                  { text: '❌ Bekor qilish', callback_data: `cancel_${o.id}_${custChat}` },
                ],
              ],
            }
          );
        }
      }
      return NextResponse.json({ ok: true });
    }

    if (text === '📊 Statistika' || text === '/stats' || text === '/statistika') {
      if (!isAdminChat(chatId)) {
        await sendTelegramMessage(chatId, `⛔️ <i>Ushbu bo'lim faqat administratorlar uchun.</i>`, getUserKeyboard());
        return NextResponse.json({ ok: true });
      }

      const stats = getOrderStats();
      const statsMsg =
        `📊 <b>EVRO DESERT — Buyurtmalar statistikasi:</b>\n\n` +
        `📦 <b>Jami buyurtmalar:</b> ${stats.totalOrders} ta\n` +
        `💰 <b>Umumiy aylanma:</b> ${stats.totalSum.toLocaleString('uz-UZ')} so'm\n\n` +
        `⏳ <b>Chek kutilmoqda:</b> ${stats.paidChecking} ta\n` +
        `👨‍🍳 <b>Tayyorlanmoqda:</b> ${stats.confirmed} ta\n` +
        `🎂 <b>Tayyor bo'lganlar:</b> ${stats.ready} ta\n` +
        `🚚 <b>Topshirilganlar:</b> ${stats.delivered} ta\n` +
        `❌ <b>Bekor qilingan:</b> ${stats.cancelled} ta`;

      await sendTelegramMessage(chatId, statsMsg, getAdminKeyboard());
      return NextResponse.json({ ok: true });
    }

    // ---------------------------------------------------------
    // D) MIJOZ: "📦 Buyurtmam holati" yoki /status
    // ---------------------------------------------------------
    if (text === '📦 Buyurtmam holati' || text === '/status' || text === '/buyurtmam') {
      const activeOrder = findLatestOrderByChat(chatId);

      if (!activeOrder) {
        await sendTelegramMessage(
          chatId,
          `📦 <b>Sizda hozircha faol buyurtma mavjud emas.</b>\n\n` +
            `Shirinliklarni tanlash va buyurtma berish uchun rasmiy saytimizga tashrif buyuring:\n` +
            `👉 <b>${SITE_URL}</b>\n\n` +
            `Saytda buyurtmani tasdiqlaganingizdan so'ng, ushbu bot orqali uning holatini onlayn kuzatishingiz mumkin! ✨`,
          getUserKeyboard()
        );
        return NextResponse.json({ ok: true });
      }

      const display = getOrderStatusDisplay(activeOrder.status, activeOrder.deliveryType);
      const itemsList = (activeOrder.items || [])
        .map((i) => `• <b>${i.name}</b> (${i.quantity} dona x ${i.price.toLocaleString('uz-UZ')} so'm)`)
        .join('\n');

      const statusCard =
        `📦 <b>BUYURTMANGIZ HOLATI</b>\n\n` +
        `🆔 <b>Buyurtma kodi:</b> <code>#${activeOrder.id}</code>\n` +
        `🍰 <b>Tarkib:</b>\n${itemsList || '• Tort / Desert'}\n\n` +
        `💰 <b>Jami summa:</b> <b>${activeOrder.total.toLocaleString('uz-UZ')} so'm</b>\n` +
        `🚚 <b>Qabul qilish:</b> ${activeOrder.deliveryType === 'pickup' ? "🏬 Do'kondan olib ketish" : `🚚 Yetkazib berish (${activeOrder.address || "Qo'qon"})`}\n` +
        `⏰ <b>Muddat:</b> ${activeOrder.deliveryTime || '2 soat ichida'}\n\n` +
        `📊 <b>Joriy bosqich:</b>\n<code>${display.progress}</code>\n\n` +
        `ℹ️ <b>Holat:</b> <b>${display.badge}</b>\n` +
        `<i>${display.desc}</i>`;

      const extraButtons: any[] = [];
      if (activeOrder.status === 'new' || activeOrder.status === 'pending_payment') {
        extraButtons.push([
          { text: '💳 To\'lov qilish', callback_data: `pay_${activeOrder.id}` },
        ]);
      }
      extraButtons.push([
        { text: '🔄 Holatni yangilash', callback_data: `track_${activeOrder.id}` },
        { text: '📞 Do\'kon bilan aloqa', url: `tel:${SHOP_PHONE.replace(/[^0-9+]/g, '')}` },
      ]);

      await sendTelegramMessage(chatId, statusCard, {
        inline_keyboard: extraButtons,
      });

      return NextResponse.json({ ok: true });
    }

    // ---------------------------------------------------------
    // E) MIJOZ: "🌐 Rasmiy sayt" yoki "📞 Aloqa"
    // ---------------------------------------------------------
    if (text === '🌐 Rasmiy sayt') {
      await sendTelegramMessage(
        chatId,
        `🌐 <b>EVRO DESERT rasmiy sayti:</b>\n\n` +
          `Barcha tortlar, bentolar va yangi pishiriqlar katalogimiz bilan saytimizda tanishishingiz va oson xarid qilishingiz mumkin:\n\n` +
          `👉 <b>${SITE_URL}</b>`,
        getMainKeyboard(chatId)
      );
      return NextResponse.json({ ok: true });
    }

    if (text === '📞 Aloqa') {
      await sendTelegramMessage(
        chatId,
        `📞 <b>EVRO DESERT bilan bog'lanish:</b>\n\n` +
          `📍 <b>Manzil:</b> Farg'ona viloyati, Qo'qon shahri\n` +
          `📲 <b>Telefon:</b> ${SHOP_PHONE}\n` +
          `⏰ <b>Ish vaqti:</b> Har kuni 08:00 dan 22:00 gacha\n` +
          `🚚 Qo'qon shahri bo'ylab yetkazib berish mavjud!`,
        getMainKeyboard(chatId)
      );
      return NextResponse.json({ ok: true });
    }

    // ---------------------------------------------------------
    // F) TO'LOV CHEKI (RASM) YUBORILGANDA (📸 message.photo)
    // ---------------------------------------------------------
    if (message.photo && message.photo.length > 0) {
      const photoFileId = message.photo[message.photo.length - 1].file_id;
      let activeOrder = findLatestOrderByChat(chatId);

      if (!activeOrder) {
        activeOrder = saveOrder({
          id: `ED-${Math.floor(100000 + Math.random() * 900000)}`,
          name: userName,
          customerChatId: chatId,
          status: 'paid_checking',
          receiptFileId: photoFileId,
        });
      } else {
        updateOrder(activeOrder.id, {
          status: 'paid_checking',
          receiptFileId: photoFileId,
          customerChatId: chatId,
        });
      }

      // 1. MIJOZGA DARHOL JAVOB (Mijoz faqat tasdiq xabari oladi, admin tugmasini EMAS!):
      await sendTelegramMessage(
        chatId,
        `⏳ <b>Buyurtmangiz va to'lov chekingiz tasdiqlanmoqda...</b>\n\n` +
          `Administrator to'lov chekini tekshirib, buyurtmangizni tez orada tasdiqlaydi. Iltimos, kuting! ⏱\n\n` +
          `<i>Buyurtmangiz holatini bilish uchun <b>"📦 Buyurtmam holati"</b> tugmasini bosishingiz mumkin.</i>`,
        getUserKeyboard()
      );

      // 2. FAQAT HAQIQIY ADMINLARGA RASMLI BILDIRISHNOMA VA TUGMALAR YUBORISH:
      const itemsSummary = (activeOrder.items || [])
        .map(
          (it, idx) =>
            `${idx + 1}. <b>${it.name}</b> (${it.quantity} dona x ${it.price.toLocaleString('uz-UZ')} so'm)` +
            (it.filling ? `\n   🍓 Nachinka: <i>${it.filling}</i>` : '') +
            (it.customText ? `\n   ✍️ Tabrik: <i>"${it.customText}"</i>` : '')
        )
        .join('\n');

      const adminCaption =
        `📸 <b>YANGI TO'LOV CHEKI VA BUYURTMA!</b>\n\n` +
        `🆔 <b>Buyurtma kodi:</b> <code>#${activeOrder.id}</code>\n` +
        `👤 <b>Mijoz:</b> ${activeOrder.name || userName}\n` +
        `📞 <b>Telefon:</b> ${activeOrder.phone || 'Kiritilmagan'}\n` +
        `🚚 <b>Usul:</b> ${activeOrder.deliveryType === 'pickup' ? "🏬 Olib ketish (Do'kondan)" : `🚚 Yetkazib berish`}\n` +
        (activeOrder.deliveryType !== 'pickup' && activeOrder.address
          ? `🏠 <b>Manzil:</b> ${activeOrder.address}\n`
          : '') +
        `⏰ <b>Muddat:</b> ${activeOrder.deliveryTime || '2 soat ichida'}\n\n` +
        (itemsSummary ? `🍰 <b>Tarkib:</b>\n${itemsSummary}\n\n` : '') +
        `💰 <b>TO'LOV SUMMASI:</b> <b>${activeOrder.total ? activeOrder.total.toLocaleString('uz-UZ') + " so'm" : 'Hisoblanmoqda'}</b>\n\n` +
        `<i>Chekni tekshirib, pastdagi tugmani bosing:</i>`;

      const adminKeyboard = {
        inline_keyboard: [
          [
            {
              text: '✅ Buyurtmani qabul qilish',
              callback_data: `accept_${activeOrder.id}_${chatId}`,
            },
          ],
          [
            {
              text: '❌ Bekor qilish',
              callback_data: `cancel_${activeOrder.id}_${chatId}`,
            },
          ],
        ],
      };

      await notifyAdminsPhoto(photoFileId, adminCaption, adminKeyboard);

      return NextResponse.json({ ok: true });
    }

    // ---------------------------------------------------------
    // G) DEEP-LINK BILAN START BOSILGANDA (/start ED829103_180k_901234567_D)
    // ---------------------------------------------------------
    const startOrderMatch = text.match(/^\/start\s+([A-Za-z0-9_-]+)/i);

    if (startOrderMatch) {
      const rawParam = startOrderMatch[1];
      let order = findOrder(rawParam);

      if (!order) {
        const decoded = decodeOrderFromParam(rawParam);
        if (decoded) {
          order = saveOrder({
            ...decoded,
            name: decoded.name || userName,
            customerChatId: chatId,
            telegramUser: {
              id: userId,
              username: message.from?.username,
              firstName: message.from?.first_name,
              lastName: message.from?.last_name,
            },
          });
        }
      }

      if (order) {
        updateOrder(order.id, {
          customerChatId: chatId,
          telegramUser: {
            id: userId,
            username: message.from?.username,
            firstName: message.from?.first_name,
            lastName: message.from?.last_name,
          },
        });

        const itemsText = (order.items || [])
          .map((item, idx) => {
            let res = `${idx + 1}. <b>${item.name}</b> (${item.quantity} dona x ${item.price.toLocaleString('uz-UZ')} so'm)`;
            if (item.filling) res += `\n   🍓 Nachinka: <i>${item.filling}</i>`;
            if (item.customText) res += `\n   ✍️ Tabrik: <i>"${item.customText}"</i>`;
            return res;
          })
          .join('\n\n');

        const replyHtml =
          `🎂 <b>Assalomu alaykum, ${order.name || userName}!</b>\n\n` +
          `✅ <b>Saytdan bergan buyurtmangiz qabul qilindi!</b> 🎉\n\n` +
          `🆔 <b>Buyurtma kodi:</b> <code>#${order.id}</code>\n` +
          (order.name ? `👤 <b>Mijoz:</b> ${order.name}\n` : '') +
          (order.phone ? `📞 <b>Telefon:</b> ${order.phone}\n` : '') +
          `🚚 <b>Usul:</b> ${order.deliveryType === 'pickup' ? "🏬 Olib ketish (Do'kondan)" : `🚚 Yetkazib berish (${order.address || "Qo'qon"})`}\n\n` +
          (itemsText ? `🍰 <b>Tafsilotlar:</b>\n${itemsText}\n\n` : '') +
          `-------------------------------\n` +
          `💰 <b>JAMI TO'LOV:</b> <b>${order.total.toLocaleString('uz-UZ')} so'm</b>\n` +
          `-------------------------------\n\n` +
          `👇 <b>Buyurtmani tasdiqlash uchun to'lov qiling:</b>`;

        await sendTelegramMessage(chatId, replyHtml, {
          inline_keyboard: [
            [
              {
                text: '💳 To\'lov qilish',
                callback_data: `pay_${order.id}`,
              },
            ],
          ],
        });

        return NextResponse.json({ ok: true });
      }
    }

    // ---------------------------------------------------------
    // H) SAYTDAN KELGAN BUYURTMA MATNI YUBORILGANDA
    // ---------------------------------------------------------
    if (
      text.includes('buyurtma') ||
      text.includes('Mahsulot:') ||
      text.includes('EVRO DESERT') ||
      text.includes('Buyurtma kodi') ||
      text.includes("JAMI TO'LOV") ||
      text.includes("Jami summa")
    ) {
      let order = findLatestOrderByChat(chatId);
      const parsed = parseOrderFromText(text);

      if (parsed) {
        order = saveOrder({
          ...parsed,
          name: parsed.name || userName,
          customerChatId: chatId,
          telegramUser: {
            id: userId,
            username: message.from?.username,
            firstName: message.from?.first_name,
            lastName: message.from?.last_name,
          },
        });
      }

      const orderKey = order ? order.id : 'latest';
      const itemsText = (order?.items || [])
        .map((item, idx) => {
          let res = `${idx + 1}. <b>${item.name}</b> (${item.quantity} dona x ${item.price.toLocaleString('uz-UZ')} so'm)`;
          if (item.filling) res += `\n   🍓 Nachinka: <i>${item.filling}</i>`;
          if (item.customText) res += `\n   ✍️ Tabrik: <i>"${item.customText}"</i>`;
          return res;
        })
        .join('\n\n');

      const orderConfirmHtml =
        `🎂 <b>Assalomu alaykum, ${order?.name || userName}!</b>\n\n` +
        `✅ <b>Saytdan bergan buyurtmangiz qabul qilindi!</b> 🎉\n\n` +
        (order
          ? `🆔 <b>Buyurtma kodi:</b> <code>#${order.id}</code>\n` +
            (order.name ? `👤 <b>Mijoz:</b> ${order.name}\n` : '') +
            (order.phone ? `📞 <b>Telefon:</b> ${order.phone}\n` : '') +
            `🚚 <b>Usul:</b> ${order.deliveryType === 'pickup' ? "🏬 Olib ketish (Do'kondan)" : `🚚 Yetkazib berish (${order.address || "Qo'qon"})`}\n\n` +
            (itemsText ? `🍰 <b>Tafsilotlar:</b>\n${itemsText}\n\n` : '') +
            `-------------------------------\n` +
            `💰 <b>JAMI TO'LOV:</b> <b>${order.total.toLocaleString('uz-UZ')} so'm</b>\n` +
            `-------------------------------\n\n`
          : '') +
        `👇 <b>Buyurtmani tasdiqlash uchun to'lov qiling:</b>`;

      await sendTelegramMessage(chatId, orderConfirmHtml, {
        inline_keyboard: [
          [
            {
              text: '💳 To\'lov qilish',
              callback_data: `pay_${orderKey}`,
            },
          ],
        ],
      });

      return NextResponse.json({ ok: true });
    }

    // ---------------------------------------------------------
    // I) ODDIY /start BUYRUG'I (Faqat Mijoz ma'lumotlari)
    // ---------------------------------------------------------
    if (text.startsWith('/start')) {
      const welcomeHtml =
        `👋 <b>Assalomu alaykum, ${userName}!</b>\n\n` +
        `🧁 <b>EVRO DESERT mijozlarga xizmat ko'rsatish botiga xush kelibsiz!</b> ✨\n\n` +
        `ℹ️ <b>Eslatma:</b> Ushbu bot orqali faqat saytdan berilgan buyurtmalarni to'lash va uning holatini onlayn kuzatish mumkin.\n\n` +
        `🍰 <b>Shirinliklarga buyurtma berish uchun rasmiy saytimizga kiring:</b>\n` +
        `👉 <b>${SITE_URL}</b>\n\n` +
        `<i>Buyurtmangiz holatini bilish uchun quyidagi <b>"📦 Buyurtmam holati"</b> tugmasini bosing:</i>`;

      await sendTelegramMessage(chatId, welcomeHtml, getMainKeyboard(chatId));
      return NextResponse.json({ ok: true });
    }

    // ---------------------------------------------------------
    // J) BOSHQA MATNLI MUROJAATLAR
    // ---------------------------------------------------------
    const replyText =
      `Hurmatli <b>${userName}</b>, xabaringiz qabul qilindi! 💌\n\n` +
      `Shirinliklarga buyurtma berish uchun rasmiy saytimiz: <b>${SITE_URL}</b>\n` +
      `Buyurtmangiz holatini kuzatish uchun: <b>"📦 Buyurtmam holati"</b> tugmasini bosing.\n` +
      `Qo'shimcha savollar uchun: <b>${SHOP_PHONE}</b> 📞`;

    await sendTelegramMessage(chatId, replyText, getMainKeyboard(chatId));

    await notifyAdmins(
      `💬 <b>MIJOZDAN XABAR:</b>\n\n` +
        `👤 <b>Kimdan:</b> ${userName} (@${message.from?.username || 'yo\'q'})\n` +
        `🆔 <b>Chat ID:</b> <code>${chatId}</code>\n` +
        `📝 <b>Matn:</b>\n<i>"${text}"</i>`
    );

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Telegram webhook handling error:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
