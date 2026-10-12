const http = require('http');
const fs = require('fs');
const url = require('url');

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8870306435:AAHtmuo8X4kjUcWdLCKriZj-8nGQjbGG6BE';
const BOT_USERNAME = process.env.NEXT_PUBLIC_SHOP_TELEGRAM || 'evro_desert86bot';
const SITE_URL = process.env.SITE_URL || 'https://bakery-magician.vercel.app';
const ADMIN_PIN = process.env.ADMIN_PIN || '8686';

const CARD_NUMBER = '8600 3100 4520 8181';
const CARD_HOLDER = 'EVRO DESERT (Qandolat uyi)';
const SHOP_PHONE = '+998 (90) 360-59-03';

const ORDERS_FILE = '/tmp/evro_orders.json';
const ADMINS_FILE = '/tmp/evro_admins.json';

const ordersMap = new Map();
const adminChatsSet = new Set();

// Load persisted state from /tmp if available
try {
  if (fs.existsSync(ORDERS_FILE)) {
    const parsed = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    for (const o of parsed) {
      ordersMap.set(o.id, o);
      ordersMap.set(o.cleanCode, o);
    }
  }
} catch {}

try {
  if (fs.existsSync(ADMINS_FILE)) {
    const parsed = JSON.parse(fs.readFileSync(ADMINS_FILE, 'utf8'));
    for (const id of parsed) {
      adminChatsSet.add(String(id));
    }
  }
} catch {}

if (process.env.TELEGRAM_CHAT_ID) {
  process.env.TELEGRAM_CHAT_ID.split(',').forEach((id) => {
    if (id.trim()) adminChatsSet.add(id.trim());
  });
}
if (process.env.ADMIN_CHAT_ID) {
  process.env.ADMIN_CHAT_ID.split(',').forEach((id) => {
    if (id.trim()) adminChatsSet.add(id.trim());
  });
}

function persistState() {
  try {
    const seen = new Set();
    const list = [];
    for (const rec of ordersMap.values()) {
      if (!seen.has(rec.id)) {
        seen.add(rec.id);
        list.push(rec);
      }
    }
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(list.slice(-100)), 'utf8');
  } catch {}

  try {
    fs.writeFileSync(ADMINS_FILE, JSON.stringify(Array.from(adminChatsSet)), 'utf8');
  } catch {}
}

// Cloud Sync for Admins (language_code = 'eo')
async function syncAdminsWithTelegramCloud() {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMyCommands?language_code=eo`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.result)) {
      const adminCmd = data.result.find((c) => c.command === 'admins');
      if (adminCmd && adminCmd.description) {
        const ids = JSON.parse(adminCmd.description);
        for (const id of ids) {
          adminChatsSet.add(String(id));
        }
      }
    }
  } catch {}
  return Array.from(adminChatsSet);
}

async function persistAdminsToTelegramCloud() {
  try {
    const list = Array.from(adminChatsSet);
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_code: 'eo',
        commands: [{ command: 'admins', description: JSON.stringify(list).slice(0, 255) }],
      }),
    });
  } catch {}
}

// Cloud Sync for Orders (language_code = 'la')
async function fetchOrderFromTelegramCloud(cleanCode) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMyCommands?language_code=la`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.result)) {
      const cmd = data.result.find((c) => c.command === `ord_${cleanCode}`);
      if (cmd && cmd.description) {
        const c = JSON.parse(cmd.description);
        return {
          id: `ED-${cleanCode}`,
          cleanCode: String(cleanCode),
          name: c.n || '',
          phone: c.p || '',
          deliveryType: c.dt === 'P' ? 'pickup' : 'delivery',
          address: c.a || '',
          total: Number(c.t) || 0,
          subtotal: Number(c.t) || 0,
          items: [
            {
              name: c.i || 'Tort / Desert',
              price: Number(c.u) || Number(c.t) || 0,
              quantity: Number(c.q) || 1,
              filling: c.f || '',
              customText: c.c || '',
            },
          ],
        };
      }
    }
  } catch {}
  return null;
}

function registerAdminChat(chatId) {
  if (!chatId) return false;
  adminChatsSet.add(String(chatId));
  persistState();
  persistAdminsToTelegramCloud().catch(() => {});
  return true;
}

function removeAdminChat(chatId) {
  if (!chatId) return false;
  adminChatsSet.delete(String(chatId));
  persistState();
  persistAdminsToTelegramCloud().catch(() => {});
  return true;
}

function getAdminChatIds() {
  return Array.from(adminChatsSet);
}

function isAdminChat(chatId) {
  if (!chatId) return false;
  return adminChatsSet.has(String(chatId));
}

function saveOrder(orderData) {
  const cleanCode =
    orderData.cleanCode ||
    (orderData.id ? String(orderData.id).replace(/^ED-/i, '').replace(/[^0-9]/g, '') : null) ||
    Math.floor(100000 + Math.random() * 900000).toString();
  const id = orderData.id || `ED-${cleanCode}`;

  const existing = ordersMap.get(id) || ordersMap.get(cleanCode);

  const mergedItems =
    orderData.items && orderData.items.length > 0 && orderData.items[0].name !== 'Tort / Bento'
      ? orderData.items
      : existing?.items && existing.items.length > 0
      ? existing.items
      : orderData.items || [];

  const fullRecord = {
    id,
    cleanCode,
    createdAt: existing?.createdAt || new Date().toISOString(),
    status: orderData.status || existing?.status || 'new',
    name: orderData.name || existing?.name || '',
    phone: orderData.phone || existing?.phone || '',
    deliveryType: orderData.deliveryType || existing?.deliveryType || 'delivery',
    address: orderData.address || existing?.address || '',
    deliveryTime: orderData.deliveryTime || existing?.deliveryTime || 'Bugun (Tezkor 2 soat)',
    items: mergedItems,
    subtotal: orderData.subtotal || existing?.subtotal || 0,
    deliveryFee: orderData.deliveryFee || existing?.deliveryFee || 0,
    total: orderData.total || existing?.total || orderData.subtotal || 0,
    notes: orderData.notes || existing?.notes || '',
    customerChatId: orderData.customerChatId || existing?.customerChatId,
    receiptFileId: orderData.receiptFileId || existing?.receiptFileId,
    telegramUser: orderData.telegramUser || existing?.telegramUser,
  };

  ordersMap.set(id, fullRecord);
  ordersMap.set(cleanCode, fullRecord);
  persistState();
  return fullRecord;
}

function findOrder(codeOrId) {
  if (!codeOrId) return null;
  const matchParam = String(codeOrId).match(/^#?ED-?([0-9]{5,7})/i);
  if (matchParam) {
    const code = matchParam[1];
    const found = ordersMap.get(`ED-${code}`) || ordersMap.get(code);
    if (found) return found;
  }
  const clean = String(codeOrId).replace(/^#?ED-/i, '').replace(/[^0-9]/g, '');
  return ordersMap.get(`ED-${clean}`) || ordersMap.get(clean) || null;
}

function findLatestOrderByChat(chatId) {
  if (!chatId) return null;
  const strChatId = String(chatId);
  const userOrders = Array.from(ordersMap.values()).filter(
    (o) =>
      String(o.customerChatId || '') === strChatId ||
      String(o.telegramUser?.id || '') === strChatId
  );
  if (userOrders.length === 0) return null;
  userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return userOrders[0];
}

function listOrders() {
  const seen = new Set();
  const list = [];
  for (const record of ordersMap.values()) {
    if (!seen.has(record.id)) {
      seen.add(record.id);
      list.push(record);
    }
  }
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function updateOrder(id, updates) {
  const existing = findOrder(id);
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  ordersMap.set(existing.id, updated);
  ordersMap.set(existing.cleanCode, updated);
  persistState();
  return updated;
}

function getOrderStats() {
  const orders = listOrders();
  const stats = {
    totalOrders: orders.length,
    totalSum: 0,
    paidChecking: 0,
    confirmed: 0,
    ready: 0,
    delivered: 0,
    cancelled: 0,
  };
  for (const o of orders) {
    stats.totalSum += o.total || 0;
    if (o.status === 'paid_checking') stats.paidChecking++;
    else if (o.status === 'confirmed') stats.confirmed++;
    else if (o.status === 'ready') stats.ready++;
    else if (o.status === 'delivered') stats.delivered++;
    else if (o.status === 'cancelled') stats.cancelled++;
  }
  return stats;
}

function getOrderStatusDisplay(status, deliveryType = 'delivery') {
  switch (status) {
    case 'new':
    case 'pending_payment':
      return {
        badge: "🟡 To'lov kutilmoqda",
        progress: "🟡 [To'lov kutilmoqda] ➔ ⏳ [Chek tekshirish] ➔ 👨‍🍳 [Tayyorlash] ➔ 🎂 [Tayyor]",
        desc: "Buyurtmangiz qabul qilingan. Iltimos, to'lovni amalga oshirib, chekni yuboring.",
      };
    case 'paid_checking':
      return {
        badge: "⏳ To'lov cheki tekshirilmoqda",
        progress: "✅ [To'lov] ➔ ⏳ [Chek tekshirilmoqda] ➔ 👨‍🍳 [Tayyorlash] ➔ 🎂 [Tayyor]",
        desc: "To'lov chekingiz yuborildi. Administrator chekni tekshirib, tez orada tasdiqlaydi.",
      };
    case 'confirmed':
      return {
        badge: '👨‍🍳 Tayyorlanmoqda',
        progress: "✅ [To'lov] ➔ ✅ [Chek tasdiqlandi] ➔ 👨‍🍳 [Qandolatchi tayyorlamoqda] ➔ 🎂 [Tayyor]",
        desc: 'Buyurtmangiz tasdiqlandi! Qandolatchi mutaxassisimiz shirinlikni tayyorlashga kirishdi.',
      };
    case 'ready':
      return {
        badge: "🎂 Tayyor bo'ldi!",
        progress: "✅ [Tayyorlandi] ➔ 🎉 [Tayyor bo'ldi!]",
        desc:
          deliveryType === 'pickup'
            ? "Shirinligingiz tayyor bo'ldi! Qo'qon shahridagi do'konimizdan olib ketishingiz mumkin."
            : "Shirinligingiz tayyor bo'ldi! Kuryerimiz manzilingizga yetkazish uchun yo'lga chiqmoqda.",
      };
    case 'delivered':
      return {
        badge: '🚚 Topshirildi',
        progress: '✅ [Buyurtma muvaffaqiyatli topshirildi]',
        desc: 'Buyurtma sizga topshirildi. EVRO DESERT ni tanlaganingiz uchun rahmat, yoqimli ishtaha!',
      };
    case 'cancelled':
      return {
        badge: '❌ Bekor qilingan',
        progress: '❌ [Buyurtma bekor qilingan]',
        desc: "Ushbu buyurtma bekor qilindi. Savollaringiz bo'lsa: " + SHOP_PHONE,
      };
    default:
      return {
        badge: '🟡 Qabul qilingan',
        progress: "🟡 [Ko'rib chiqilmoqda]",
        desc: 'Buyurtmangiz tizimda qayta ishlanmoqda.',
      };
  }
}

function decodeOrderFromParam(param) {
  if (!param) return null;
  const clean = String(param).trim();
  const matchFull = clean.match(/^ED([0-9]{5,7})_([0-9]+)k_([0-9]{9})_([DP])$/i);
  if (matchFull) {
    const code = matchFull[1];
    const total = parseInt(matchFull[2], 10) * 1000;
    const phoneRaw = matchFull[3];
    const phone = `+998 (${phoneRaw.slice(0, 2)}) ${phoneRaw.slice(2, 5)}-${phoneRaw.slice(5, 7)}-${phoneRaw.slice(7, 9)}`;
    const deliveryType = matchFull[4].toUpperCase() === 'P' ? 'pickup' : 'delivery';
    return {
      id: `ED-${code}`,
      cleanCode: code,
      total,
      subtotal: total,
      phone,
      deliveryType,
      address: deliveryType === 'pickup' ? "Do'kondan olib ketish" : "Qo'qon shahri",
      deliveryTime: 'Bugun (Tezkor 2 soat)',
      items: [{ name: 'Tort / Bento', price: total, quantity: 1 }],
    };
  }
  const matchSimple = clean.match(/^(?:buyurtma_)?(?:ED)?([0-9]{5,7})$/i);
  if (matchSimple) {
    const code = matchSimple[1];
    return {
      id: `ED-${code}`,
      cleanCode: code,
      deliveryType: 'delivery',
      deliveryTime: 'Bugun (Tezkor 2 soat)',
    };
  }
  return null;
}

function parseOrderFromText(text) {
  if (!text) return null;
  const codeMatch = text.match(/#?ED-?([0-9]{5,7})/i);
  const nameMatch = text.match(/(?:Mijoz|Ism):\*?\s*([^\n\r*]+)/i);
  const phoneMatch = text.match(/(?:Telefon):\*?\s*([^\n\r*]+)/i);
  const deliveryMatch = text.match(/(?:Qabul qilish usuli|Yetkazish turi|Yetkazish):\*?\s*([^\n\r*]+)/i);
  const addressMatch = text.match(/(?:Manzil):\*?\s*([^\n\r*]+)/i);
  const timeMatch = text.match(/(?:Muddat):\*?\s*([^\n\r*]+)/i);
  const productMatch = text.match(/(?:Mahsulot):\*?\s*([^\n\r*]+)/i);
  const fillingMatch = text.match(/(?:Nachinka):\*?\s*([^\n\r*]+)/i);
  const customTextMatch = text.match(/(?:Tabrik(?: yozuvi)?):\*?\s*"([^"]+)"/i);
  const qtyMatch = text.match(/(?:Soni):\*?\s*(\d+)/i);
  const totalMatch = text.match(/(?:JAMI TO'LOV|Jami summa|Summa):\*?\s*([0-9\s,\.]+)\s*so'?m/i);

  const cleanCode = codeMatch ? codeMatch[1] : Math.floor(100000 + Math.random() * 900000).toString();
  const id = `ED-${cleanCode}`;
  let total = 0;
  if (totalMatch) {
    total = parseInt(totalMatch[1].replace(/[^0-9]/g, ''), 10) || 0;
  }
  const name = nameMatch ? nameMatch[1].trim() : '';
  const phone = phoneMatch ? phoneMatch[1].trim() : '';
  let deliveryType = 'delivery';
  let address = '';

  if (deliveryMatch) {
    const delText = deliveryMatch[1].toLowerCase();
    if (delText.includes('olib ketish') || delText.includes('dokon') || delText.includes("do'kon")) {
      deliveryType = 'pickup';
      address = "Do'kondan olib ketish";
    } else {
      deliveryType = 'delivery';
      const bracketMatch = deliveryMatch[1].match(/\(([^)]+)\)/);
      if (bracketMatch) address = bracketMatch[1].trim();
    }
  }
  if (addressMatch && addressMatch[1].trim()) {
    address = addressMatch[1].trim();
  }

  const productName = productMatch ? productMatch[1].trim() : 'Tort / Desert';
  const filling = fillingMatch ? fillingMatch[1].trim() : '';
  const customText = customTextMatch ? customTextMatch[1].trim() : '';
  const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

  return {
    id,
    cleanCode,
    name,
    phone,
    deliveryType,
    address: address || (deliveryType === 'pickup' ? "Do'kondan olib ketish" : "Qo'qon shahri"),
    deliveryTime: timeMatch ? timeMatch[1].trim() : 'Bugun (Tezkor 2 soat)',
    total,
    subtotal: total,
    items: [
      {
        name: productName,
        price: total && quantity ? Math.round(total / quantity) : total,
        quantity,
        filling,
        customText,
      },
    ],
  };
}

// Telegram API Helpers
async function sendTelegramMessage(chatId, text, replyMarkup) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function editTelegramMessage(chatId, messageId, text, replyMarkup) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function editTelegramCaption(chatId, messageId, caption, replyMarkup) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageCaption`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        caption,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function answerCallbackQuery(callbackQueryId, text, showAlert = false) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function resetChatMenuButton(chatId) {
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        menu_button: { type: 'commands' },
      }),
    });
  } catch {}
}

async function notifyAdmins(text, replyMarkup) {
  let chatIds = getAdminChatIds();
  if (chatIds.length === 0) {
    chatIds = await syncAdminsWithTelegramCloud();
  }
  let count = 0;
  for (const chatId of chatIds) {
    const ok = await sendTelegramMessage(chatId, text, replyMarkup);
    if (ok) count++;
  }
  return count;
}

async function notifyAdminsPhoto(photoFileId, caption, replyMarkup) {
  let chatIds = getAdminChatIds();
  if (chatIds.length === 0) {
    chatIds = await syncAdminsWithTelegramCloud();
  }
  let count = 0;
  for (const chatId of chatIds) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoFileId,
          caption,
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        }),
      });
      if (res.ok) count++;
    } catch {}
  }
  return count;
}

function getUserKeyboard() {
  return {
    keyboard: [
      [{ text: '📦 Buyurtmam holati' }],
      [{ text: '🌐 Rasmiy sayt' }, { text: '📞 Aloqa' }],
    ],
    resize_keyboard: true,
  };
}

function getAdminKeyboard() {
  return {
    keyboard: [
      [{ text: '📋 Buyurtmalar' }, { text: '⏳ Yangi cheklar' }],
      [{ text: '📊 Statistika' }, { text: '👑 Admin menyu' }],
      [{ text: "👤 Mijoz menyusiga o'tish" }],
    ],
    resize_keyboard: true,
  };
}

function getMainKeyboard(chatId) {
  return isAdminChat(chatId) ? getAdminKeyboard() : getUserKeyboard();
}

// Handle incoming Telegram webhook update
async function handleBotUpdate(update) {
  if (getAdminChatIds().length === 0) {
    await syncAdminsWithTelegramCloud();
  }

  // 1. CALLBACK QUERY
  if (update.callback_query) {
    const cq = update.callback_query;
    const cqId = cq.id;
    const data = cq.data || '';
    const fromUser = cq.from;
    const chatId = cq.message?.chat?.id;
    const messageId = cq.message?.message_id;

    if (chatId) resetChatMenuButton(chatId).catch(() => {});

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
        updateOrder(order.id, { status: 'pending_payment', customerChatId: fromUser.id });
      }
      return;
    }

    if (data.startsWith('track_')) {
      const orderId = data.replace('track_', '');
      const order = findOrder(orderId) || findLatestOrderByChat(chatId);
      await answerCallbackQuery(cqId, '🔄 Holat yangilandi');
      if (order) {
        const display = getOrderStatusDisplay(order.status, order.deliveryType);
        const trackText =
          `📦 <b>BUYURTMANGIZ HOLATI</b>\n\n` +
          `🆔 <b>Buyurtma:</b> <code>#${order.id}</code>\n` +
          `🍰 <b>Tarkib:</b> ${(order.items || []).map((i) => `${i.name} (${i.quantity} dona)`).join(', ')}\n` +
          `💰 <b>Summa:</b> <b>${order.total.toLocaleString('uz-UZ')} so'm</b>\n` +
          `🚚 <b>Usul:</b> ${order.deliveryType === 'pickup' ? '🏬 Olib ketish' : `🚚 Yetkazib berish (${order.address || "Qo'qon"})`}\n` +
          `⏰ <b>Muddat:</b> ${order.deliveryTime || '2 soat ichida'}\n\n` +
          `📊 <b>Bosqich:</b>\n<code>${display.progress}</code>\n\n` +
          `ℹ️ <b>Holat:</b> <b>${display.badge}</b>\n` +
          `<i>${display.desc}</i>`;

        await sendTelegramMessage(chatId, trackText, {
          inline_keyboard: [[{ text: '🔄 Yana yangilash', callback_data: `track_${order.id}` }]],
        });
      }
      return;
    }

    // RBAC Guard for Admin Actions
    const isActorAdmin = isAdminChat(fromUser.id) || isAdminChat(chatId);
    const isAdminAction =
      data.startsWith('accept_') ||
      data.startsWith('ready_') ||
      data.startsWith('deliver_') ||
      data.startsWith('cancel_') ||
      data.startsWith('admin_');

    if (isAdminAction && !isActorAdmin) {
      await answerCallbackQuery(cqId, "⛔️ Ushbu amal faqat do'kon administratori uchun!", true);
      return;
    }

    if (data.startsWith('accept_')) {
      const parts = data.replace('accept_', '').split('_');
      const orderId = parts[0];
      const targetCustomerChatId = parts[1] || null;
      const order = findOrder(orderId);
      const customerChatId = targetCustomerChatId || order?.customerChatId || order?.telegramUser?.id;

      await answerCallbackQuery(cqId, '✅ Buyurtma qabul qilindi!');
      if (order) updateOrder(order.id, { status: 'confirmed' });

      const readyCbData = customerChatId ? `ready_${orderId}_${customerChatId}` : `ready_${orderId}`;
      const cancelCbData = customerChatId ? `cancel_${orderId}_${customerChatId}` : `cancel_${orderId}`;

      const adminNewCaption =
        `✅ <b>BUYURTMA QABUL QILINDI!</b>\n\n` +
        `🆔 <b>Buyurtma:</b> #${order?.id || orderId}\n` +
        (order?.name ? `👤 <b>Mijoz:</b> ${order.name} (${order.phone || ''})\n` : '') +
        (order?.total ? `💰 <b>Summa:</b> ${order.total.toLocaleString('uz-UZ')} so'm\n` : '') +
        `🚚 <b>Usul:</b> ${order?.deliveryType === 'pickup' ? 'Olib ketish' : `Yetkazish (${order?.address || "Qo'qon"})`}\n` +
        `🕒 <b>Holat:</b> 👨‍🍳 Qandolatchi tayyorlamoqda...`;

      const adminNextButtons = {
        inline_keyboard: [
          [{ text: "🎂 Tayyor bo'ldi", callback_data: readyCbData }],
          [{ text: '❌ Bekor qilish', callback_data: cancelCbData }],
        ],
      };

      if (cq.message?.caption !== undefined || Boolean(cq.message?.photo)) {
        await editTelegramCaption(chatId, messageId, adminNewCaption, adminNextButtons);
      } else {
        await editTelegramMessage(chatId, messageId, adminNewCaption, adminNextButtons);
      }

      if (customerChatId) {
        const deliveryNote =
          order?.deliveryType === 'pickup'
            ? "🏬 Buyurtmangiz tayyor bo'lgach, do'konimizdan olib ketishingiz mumkin."
            : `🚚 Belgilangan muddatda (${order?.deliveryTime || '2 soat ichida'}) yetkazib beriladi yoki olib ketishingiz mumkin.`;

        const customerMessage =
          `✅ <b>Buyurtmangiz qabul qilindi!</b> 🎉\n\n` +
          `To'lov cheki tasdiqlandi. Qandolatchi mutaxassisimiz buyurtmangizni tayyorlashga kirishdi.\n\n` +
          `${deliveryNote}\n\n` +
          `Buyurtma tayyor bo'lishi bilan sizga xabar beramiz! 🍰\n` +
          `Rahmat, <b>EVRO DESERT</b>! ✨`;

        await sendTelegramMessage(customerChatId, customerMessage, getUserKeyboard());
      }
      return;
    }

    if (data.startsWith('ready_')) {
      const parts = data.replace('ready_', '').split('_');
      const orderId = parts[0];
      const targetCustomerChatId = parts[1] || null;
      const order = findOrder(orderId);
      const customerChatId = targetCustomerChatId || order?.customerChatId || order?.telegramUser?.id;

      await answerCallbackQuery(cqId, "🎂 Mijozga tayyorligi bildirildi!");
      if (order) updateOrder(order.id, { status: 'ready' });

      const deliverCbData = customerChatId ? `deliver_${orderId}_${customerChatId}` : `deliver_${orderId}`;
      const cancelCbData = customerChatId ? `cancel_${orderId}_${customerChatId}` : `cancel_${orderId}`;

      const adminReadyCaption =
        `🎂 <b>BUYURTMA TAYYOR BO'LDI!</b>\n\n` +
        `🆔 <b>Buyurtma:</b> #${order?.id || orderId}\n` +
        (order?.name ? `👤 <b>Mijoz:</b> ${order.name} (${order.phone || ''})\n` : '') +
        (order?.total ? `💰 <b>Summa:</b> ${order.total.toLocaleString('uz-UZ')} so'm\n` : '') +
        `✅ <i>Mijozga tayyor bo'lgani haqida xabarnoma yuborildi!</i>`;

      const adminDeliverButtons = {
        inline_keyboard: [
          [{ text: '🚚 Topshirildi / Yetkazildi', callback_data: deliverCbData }],
          [{ text: '❌ Bekor qilish', callback_data: cancelCbData }],
        ],
      };

      if (cq.message?.caption !== undefined || Boolean(cq.message?.photo)) {
        await editTelegramCaption(chatId, messageId, adminReadyCaption, adminDeliverButtons);
      } else {
        await editTelegramMessage(chatId, messageId, adminReadyCaption, adminDeliverButtons);
      }

      if (customerChatId) {
        const readyNote =
          order?.deliveryType === 'pickup'
            ? "🏬 Do'konimizga kelib olib ketishingiz mumkin! Manzil: Qo'qon shahri."
            : "🚚 Kuryerimiz buyurtmangizni manzilingizga yetkazish uchun yo'lga chiqmoqda!";

        const customerReadyMessage =
          `🎂 <b>Buyurtmangiz tayyor bo'ldi!</b> 🎉✨\n\n` +
          `🍰 Siz buyurtma qilgan shirinlik to'liq tayyor bo'ldi!\n\n` +
          `${readyNote}\n\n` +
          `Yoqimli ishtaha tilaymiz! 💖\n` +
          `📞 Aloqa: ${SHOP_PHONE}`;

        await sendTelegramMessage(customerChatId, customerReadyMessage, getUserKeyboard());
      }
      return;
    }

    if (data.startsWith('deliver_')) {
      const parts = data.replace('deliver_', '').split('_');
      const orderId = parts[0];
      const targetCustomerChatId = parts[1] || null;
      const order = findOrder(orderId);
      const customerChatId = targetCustomerChatId || order?.customerChatId || order?.telegramUser?.id;

      await answerCallbackQuery(cqId, '🚚 Buyurtma topshirildi!');
      if (order) updateOrder(order.id, { status: 'delivered' });

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
          `💖 <b>Buyurtmangiz muvaffaqiyatli topshirildi!</b>\n\nEVRO DESERT shirinliklari dasturxoningizga fayz bag'ishlasin! Yoqimli ishtaha tilaymiz! ✨🍰`,
          getUserKeyboard()
        );
      }
      return;
    }

    if (data.startsWith('cancel_')) {
      const parts = data.replace('cancel_', '').split('_');
      const orderId = parts[0];
      const targetCustomerChatId = parts[1] || null;
      const order = findOrder(orderId);
      const customerChatId = targetCustomerChatId || order?.customerChatId || order?.telegramUser?.id;

      await answerCallbackQuery(cqId, '❌ Buyurtma bekor qilindi');
      if (order) updateOrder(order.id, { status: 'cancelled' });

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
      return;
    }

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
        return;
      }

      if (action === 'checks') {
        const orders = listOrders().filter((o) => o.status === 'paid_checking');
        if (orders.length === 0) {
          await sendTelegramMessage(chatId, `✅ <i>Hozirda yangi to'lov cheklari mavjud emas.</i>`, getAdminKeyboard());
        } else {
          for (const o of orders.slice(0, 5)) {
            const custChat = o.customerChatId || o.telegramUser?.id || '';
            await sendTelegramMessage(
              chatId,
              `⏳ <b>Yangi to'lov cheki:</b>\n🆔 <b>#${o.id}</b> | 💰 ${o.total.toLocaleString('uz-UZ')} so'm\n👤 ${o.name} (${o.phone})\n🍰 ${(o.items || []).map((i) => i.name).join(', ')}`,
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
        return;
      }

      if (action === 'cooking') {
        const orders = listOrders().filter((o) => o.status === 'confirmed');
        if (orders.length === 0) {
          await sendTelegramMessage(chatId, `👨‍🍳 <i>Hozirda tayyorlanayotgan buyurtmalar yo'q.</i>`, getAdminKeyboard());
        } else {
          for (const o of orders.slice(0, 5)) {
            const custChat = o.customerChatId || o.telegramUser?.id || '';
            await sendTelegramMessage(
              chatId,
              `👨‍🍳 <b>Jarayondagi buyurtma:</b>\n🆔 <b>#${o.id}</b> | 💰 ${o.total.toLocaleString('uz-UZ')} so'm\n👤 ${o.name} (${o.phone})\n🍰 ${(o.items || []).map((i) => `${i.name} (x${i.quantity})`).join(', ')}\n⏰ ${o.deliveryTime || '2 soat'} | 🚚 ${o.deliveryType === 'pickup' ? 'Olib ketish' : o.address}`,
              {
                inline_keyboard: [
                  [
                    { text: "🎂 Tayyor bo'ldi", callback_data: `ready_${o.id}_${custChat}` },
                    { text: '❌ Bekor qilish', callback_data: `cancel_${o.id}_${custChat}` },
                  ],
                ],
              }
            );
          }
        }
        return;
      }

      if (action === 'all') {
        const orders = listOrders();
        if (orders.length === 0) {
          await sendTelegramMessage(chatId, `📋 <i>Tizimda hozircha buyurtmalar yo'q.</i>`, getAdminKeyboard());
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
          await sendTelegramMessage(chatId, `📋 <b>Oxirgi buyurtmalar:</b>\n\n${listText}`, getAdminKeyboard());
        }
        return;
      }

      if (action === 'logout') {
        removeAdminChat(chatId);
        await sendTelegramMessage(
          chatId,
          `👋 <b>Administrator panelidan chiqdingiz.</b>\n\nSiz hozirda oddiy mijoz rejimidasiz. Qayta kirish uchun: <code>/admin PAROL</code>`,
          getUserKeyboard()
        );
        return;
      }
    }
    return;
  }

  // 2. MESSAGE UPDATES
  if (!update || !update.message) return;

  const message = update.message;
  const chatId = message.chat.id;
  const userId = message.from?.id;
  const userName = message.from?.first_name || message.from?.username || 'Hurmatli mijoz';
  const text = (message.text || '').trim();

  resetChatMenuButton(chatId).catch(() => {});

  // A) ADMIN LOGIN
  const adminLoginMatch = text.match(/^\/(?:admin|login)(?:\s+([A-Za-z0-9_-]+))?$/i);
  if (adminLoginMatch) {
    const providedPin = adminLoginMatch[1]?.trim();
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
          [{ text: '🚪 Chiqish (Logout)', callback_data: 'admin_logout' }],
        ],
      });
      await sendTelegramMessage(chatId, `🔔 <i>Admin boshqaruv tugmalari pastki menyuda faollashtirildi.</i>`, getAdminKeyboard());
      return;
    }

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
          [{ text: '🚪 Chiqish (Logout)', callback_data: 'admin_logout' }],
        ],
      });
      return;
    }

    await sendTelegramMessage(
      chatId,
      `🔒 <b>Administrator Paneli — Kirish</b>\n\nUshbu bo'lim faqat do'kon ma'muriyati uchun mo'ljallangan.\n\nAgar siz administrator bo'lsangiz, maxfiy PIN parolni quyidagicha yuboring:\n👉 <code>/admin PAROL</code>`,
      getUserKeyboard()
    );
    return;
  }

  // B) ADMIN LOGOUT
  if (text === '/logout' || text === "👤 Mijoz menyusiga o'tish") {
    removeAdminChat(chatId);
    await sendTelegramMessage(
      chatId,
      `👤 <b>Mijoz rejimi yoqildi.</b>\n\nSiz hozirda oddiy mijoz interfeysini ko'rmoqdasiz. Admin paneliga qaytish uchun: <code>/admin PAROL</code>`,
      getUserKeyboard()
    );
    return;
  }

  // C) ADMIN COMMANDS
  if (text === '👑 Admin menyu' || text === '/panel' || text === '/dashboard') {
    if (!isAdminChat(chatId)) {
      await sendTelegramMessage(chatId, `🔒 <i>Ushbu bo'lim faqat administratorlar uchun mo'ljallangan.</i>`, getUserKeyboard());
      return;
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
        [{ text: '🚪 Chiqish (Logout)', callback_data: 'admin_logout' }],
      ],
    });
    return;
  }

  if (text === '📋 Buyurtmalar' || text === '/orders' || text === '/buyurtmalar') {
    if (!isAdminChat(chatId)) {
      await sendTelegramMessage(
        chatId,
        `⛔️ <b>Ruxsat berilmadi!</b>\n\nBarcha buyurtmalar ro'yxati faqat administratorlar uchun ko'rinadi.\nO'zingizning buyurtmangizni ko'rish uchun <b>"📦 Buyurtmam holati"</b> tugmasini bosing.`,
        getUserKeyboard()
      );
      return;
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
            `   👤 ${o.name || 'Mijoz'} (${o.phone || "Tel yo'q"})\n` +
            `   🍰 ${(o.items || []).map((i) => `${i.name} (x${i.quantity})`).join(', ')}\n` +
            `   💰 <b>${o.total.toLocaleString('uz-UZ')} so'm</b> | 🚚 ${o.deliveryType === 'pickup' ? 'Olib ketish' : 'Yetkazish'}`
          );
        })
        .join('\n\n');
      await sendTelegramMessage(chatId, `📋 <b>EVRO DESERT — Oxirgi 5 ta buyurtma:</b>\n\n${topOrders}`, getAdminKeyboard());
    }
    return;
  }

  if (text === '⏳ Yangi cheklar' || text === '/checks' || text === '/cheklar') {
    if (!isAdminChat(chatId)) {
      await sendTelegramMessage(chatId, `⛔️ <i>Ushbu bo'lim faqat administratorlar uchun.</i>`, getUserKeyboard());
      return;
    }
    const orders = listOrders().filter((o) => o.status === 'paid_checking');
    if (orders.length === 0) {
      await sendTelegramMessage(chatId, `✅ <i>Hozirda tasdiqlash kutilayotgan to'lov cheklari yo'q.</i>`, getAdminKeyboard());
    } else {
      for (const o of orders.slice(0, 5)) {
        const custChat = o.customerChatId || o.telegramUser?.id || '';
        await sendTelegramMessage(
          chatId,
          `⏳ <b>Yangi to'lov cheki:</b>\n🆔 <b>#${o.id}</b> | 💰 ${o.total.toLocaleString('uz-UZ')} so'm\n👤 ${o.name} (${o.phone})\n🍰 ${(o.items || []).map((i) => i.name).join(', ')}`,
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
    return;
  }

  if (text === '📊 Statistika' || text === '/stats' || text === '/statistika') {
    if (!isAdminChat(chatId)) {
      await sendTelegramMessage(chatId, `⛔️ <i>Ushbu bo'lim faqat administratorlar uchun.</i>`, getUserKeyboard());
      return;
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
    return;
  }

  // D) CUSTOMER: ORDER STATUS
  if (text === '📦 Buyurtmam holati' || text === '/status' || text === '/buyurtmam') {
    const activeOrder = findLatestOrderByChat(chatId);
    if (!activeOrder) {
      await sendTelegramMessage(
        chatId,
        `📦 <b>Sizda hozircha faol buyurtma mavjud emas.</b>\n\nShirinliklarni tanlash va buyurtma berish uchun rasmiy saytimizga tashrif buyuring:\n👉 <b>${SITE_URL}</b>\n\nSaytda buyurtmani tasdiqlaganingizdan so'ng, ushbu bot orqali uning holatini onlayn kuzatishingiz mumkin! ✨`,
        getUserKeyboard()
      );
      return;
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

    const extraButtons = [];
    if (activeOrder.status === 'new' || activeOrder.status === 'pending_payment') {
      extraButtons.push([{ text: "💳 To'lov qilish", callback_data: `pay_${activeOrder.id}` }]);
    }
    extraButtons.push([{ text: '🔄 Holatni yangilash', callback_data: `track_${activeOrder.id}` }]);

    await sendTelegramMessage(chatId, statusCard, { inline_keyboard: extraButtons });
    return;
  }

  if (text === '🌐 Rasmiy sayt') {
    await sendTelegramMessage(
      chatId,
      `🌐 <b>EVRO DESERT rasmiy sayti:</b>\n\nBarcha tortlar, bentolar va yangi pishiriqlar katalogimiz bilan saytimizda tanishishingiz va oson xarid qilishingiz mumkin:\n\n👉 <b>${SITE_URL}</b>`,
      getMainKeyboard(chatId)
    );
    return;
  }

  if (text === '📞 Aloqa') {
    await sendTelegramMessage(
      chatId,
      `📞 <b>EVRO DESERT bilan bog'lanish:</b>\n\n📍 <b>Manzil:</b> Farg'ona viloyati, Qo'qon shahri\n📲 <b>Telefon:</b> ${SHOP_PHONE}\n⏰ <b>Ish vaqti:</b> Har kuni 08:00 dan 22:00 gacha\n🚚 Qo'qon shahri bo'ylab yetkazib berish mavjud!`,
      getMainKeyboard(chatId)
    );
    return;
  }

  // F) PHOTO RECEIPT
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

    await sendTelegramMessage(
      chatId,
      `⏳ <b>Buyurtmangiz va to'lov chekingiz tasdiqlanmoqda...</b>\n\nAdministrator to'lov chekini tekshirib, buyurtmangizni tez orada tasdiqlaydi. Iltimos, kuting! ⏱\n\n<i>Buyurtmangiz holatini bilish uchun <b>"📦 Buyurtmam holati"</b> tugmasini bosishingiz mumkin.</i>`,
      getUserKeyboard()
    );

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
      `🚚 <b>Usul:</b> ${activeOrder.deliveryType === 'pickup' ? "🏬 Olib ketish (Do'kondan)" : '🚚 Yetkazib berish'}\n` +
      (activeOrder.deliveryType !== 'pickup' && activeOrder.address ? `🏠 <b>Manzil:</b> ${activeOrder.address}\n` : '') +
      `⏰ <b>Muddat:</b> ${activeOrder.deliveryTime || '2 soat ichida'}\n\n` +
      (itemsSummary ? `🍰 <b>Tarkib:</b>\n${itemsSummary}\n\n` : '') +
      `💰 <b>TO'LOV SUMMASI:</b> <b>${activeOrder.total ? activeOrder.total.toLocaleString('uz-UZ') + " so'm" : 'Hisoblanmoqda'}</b>\n\n` +
      `<i>Chekni tekshirib, pastdagi tugmani bosing:</i>`;

    const adminKeyboard = {
      inline_keyboard: [
        [{ text: '✅ Buyurtmani qabul qilish', callback_data: `accept_${activeOrder.id}_${chatId}` }],
        [{ text: '❌ Bekor qilish', callback_data: `cancel_${activeOrder.id}_${chatId}` }],
      ],
    };

    await notifyAdminsPhoto(photoFileId, adminCaption, adminKeyboard);
    return;
  }

  // G) DEEP-LINK /start
  const startOrderMatch = text.match(/^\/start\s+([A-Za-z0-9_-]+)/i);
  if (startOrderMatch) {
    const rawParam = startOrderMatch[1];
    let order = findOrder(rawParam);

    if (!order) {
      const codeMatch = rawParam.match(/^ED-?([0-9]{5,7})/i);
      if (codeMatch) {
        const cloudOrder = await fetchOrderFromTelegramCloud(codeMatch[1]);
        if (cloudOrder) {
          order = saveOrder({
            ...cloudOrder,
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
    }

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
        inline_keyboard: [[{ text: "💳 To'lov qilish", callback_data: `pay_${order.id}` }]],
      });
      return;
    }
  }

  // H) ORDER TEXT MESSAGE
  if (
    text.includes('buyurtma') ||
    text.includes('Mahsulot:') ||
    text.includes('EVRO DESERT') ||
    text.includes('Buyurtma kodi') ||
    text.includes("JAMI TO'LOV") ||
    text.includes('Jami summa')
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
      inline_keyboard: [[{ text: "💳 To'lov qilish", callback_data: `pay_${orderKey}` }]],
    });
    return;
  }

  // I) PLAIN /start
  if (text.startsWith('/start')) {
    const welcomeHtml =
      `👋 <b>Assalomu alaykum, ${userName}!</b>\n\n` +
      `🧁 <b>EVRO DESERT mijozlarga xizmat ko'rsatish botiga xush kelibsiz!</b> ✨\n\n` +
      `ℹ️ <b>Eslatma:</b> Ushbu bot orqali faqat saytdan berilgan buyurtmalarni to'lash va uning holatini onlayn kuzatish mumkin.\n\n` +
      `🍰 <b>Shirinliklarga buyurtma berish uchun rasmiy saytimizga kiring:</b>\n` +
      `👉 <b>${SITE_URL}</b>\n\n` +
      `<i>Buyurtmangiz holatini bilish uchun quyidagi <b>"📦 Buyurtmam holati"</b> tugmasini bosing:</i>`;

    await sendTelegramMessage(chatId, welcomeHtml, getMainKeyboard(chatId));
    return;
  }

  // J) OTHER MESSAGES
  const replyText =
    `Hurmatli <b>${userName}</b>, xabaringiz qabul qilindi! 💌\n\n` +
    `Shirinliklarga buyurtma berish uchun rasmiy saytimiz: <b>${SITE_URL}</b>\n` +
    `Buyurtmangiz holatini kuzatish uchun: <b>"📦 Buyurtmam holati"</b> tugmasini bosing.\n` +
    `Qo'shimcha savollar uchun: <b>${SHOP_PHONE}</b> 📞`;

  await sendTelegramMessage(chatId, replyText, getMainKeyboard(chatId));
  await notifyAdmins(
    `💬 <b>MIJOZDAN XABAR:</b>\n\n👤 <b>Kimdan:</b> ${userName} (@${message.from?.username || "yo'q"})\n🆔 <b>Chat ID:</b> <code>${chatId}</code>\n📝 <b>Matn:</b>\n<i>"${text}"</i>`
  );
}

// Create HTTP server for Render
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url || '/', true);
  const pathname = parsedUrl.pathname || '/';

  // CORS headers so website can also post orders directly if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-pin');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET / or GET /api/bot
  if (req.method === 'GET' && (pathname === '/' || pathname === '/api/bot')) {
    if (getAdminChatIds().length === 0) {
      await syncAdminsWithTelegramCloud();
    }

    let webhookResult = null;
    if (parsedUrl.query.setup === '1') {
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const protocol = host?.includes('localhost') ? 'http' : 'https';
      const baseUrl = host ? `${protocol}://${host}` : process.env.RENDER_EXTERNAL_URL || SITE_URL;
      const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/bot`;
      try {
        const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
        webhookResult = await r.json();
      } catch (e) {
        webhookResult = { error: e.message };
      }
    }

    let info = null;
    try {
      const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
      info = await r.json();
    } catch {}

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'EVRO DESERT Telegram Bot (Render)',
        bot: BOT_USERNAME,
        adminCount: getAdminChatIds().length,
        webhookInfo: info,
        webhookSetupAttempt: webhookResult,
      })
    );
    return;
  }

  // POST /api/bot
  if (req.method === 'POST' && (pathname === '/api/bot' || pathname === '/')) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const update = JSON.parse(body || '{}');
        await handleBotUpdate(update);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // GET /api/orders
  if (req.method === 'GET' && pathname === '/api/orders') {
    const pin = parsedUrl.query.pin || req.headers['x-admin-pin'];
    if (pin !== ADMIN_PIN) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: "Unauthorized. Ushbu ma'lumotlar faqat do'kon ma'muriyati uchun himoyalangan." }));
      return;
    }
    const orders = listOrders();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        count: orders.length,
        registeredAdminsCount: getAdminChatIds().length,
        orders: orders.slice(0, 50),
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'not_found' }));
});

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 EVRO DESERT Bot Server listening on port ${PORT}`);
  await syncAdminsWithTelegramCloud();

  const renderUrl = process.env.RENDER_EXTERNAL_URL;
  if (renderUrl) {
    const cleanUrl = renderUrl.replace(/\/$/, '');
    const webhookUrl = `${cleanUrl}/api/bot`;
    try {
      const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
      const data = await r.json();
      console.log(`✅ Webhook auto-bound to ${webhookUrl}:`, data);
    } catch (e) {
      console.error('⚠️ Auto-webhook error:', e.message);
    }

    setInterval(async () => {
      try {
        await fetch(`${cleanUrl}/api/bot`);
      } catch {}
    }, 10 * 60 * 1000);
  }
});
