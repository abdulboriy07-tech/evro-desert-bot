import fs from 'fs';
import path from 'path';

export interface OrderItem {
  id?: string | number;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  filling?: string;
  customText?: string;
  weight?: string;
}

export type OrderStatus =
  | 'new'
  | 'pending_payment'
  | 'paid_checking'
  | 'confirmed'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export interface OrderRecord {
  id: string; // masalan: "ED-829103"
  cleanCode: string; // masalan: "829103"
  createdAt: string;
  status: OrderStatus;
  name: string;
  phone: string;
  deliveryType: 'delivery' | 'pickup';
  address: string;
  deliveryTime?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string;
  customerChatId?: number | string;
  receiptFileId?: string;
  adminNotified?: boolean;
  telegramUser?: {
    id: number;
    username?: string;
    firstName?: string;
    lastName?: string;
  };
}

const ORDERS_FILE = '/tmp/evro_orders.json';
const ADMINS_FILE = '/tmp/evro_admins.json';

// In-Memory store across hot reloads and serverless invocations
declare global {
  // eslint-disable-next-line no-var
  var __EVRO_ORDERS__: Map<string, OrderRecord> | undefined;
  // eslint-disable-next-line no-var
  var __EVRO_ADMIN_CHATS__: Set<string> | undefined;
}

const ordersMap: Map<string, OrderRecord> =
  global.__EVRO_ORDERS__ || (global.__EVRO_ORDERS__ = new Map());

const adminChatsSet: Set<string> =
  global.__EVRO_ADMIN_CHATS__ || (global.__EVRO_ADMIN_CHATS__ = new Set());

// Load persisted state from /tmp if available
try {
  if (fs.existsSync(ORDERS_FILE)) {
    const raw = fs.readFileSync(ORDERS_FILE, 'utf8');
    const parsed: OrderRecord[] = JSON.parse(raw);
    for (let i = 0; i < parsed.length; i++) {
      ordersMap.set(parsed[i].id, parsed[i]);
      ordersMap.set(parsed[i].cleanCode, parsed[i]);
    }
  }
} catch {}

try {
  if (fs.existsSync(ADMINS_FILE)) {
    const raw = fs.readFileSync(ADMINS_FILE, 'utf8');
    const parsed: string[] = JSON.parse(raw);
    for (let i = 0; i < parsed.length; i++) {
      adminChatsSet.add(parsed[i]);
    }
  }
} catch {}

if (process.env.TELEGRAM_CHAT_ID && process.env.TELEGRAM_CHAT_ID.trim()) {
  process.env.TELEGRAM_CHAT_ID.split(',').forEach((id) => {
    if (id.trim()) adminChatsSet.add(id.trim());
  });
}

if (process.env.ADMIN_CHAT_ID && process.env.ADMIN_CHAT_ID.trim()) {
  process.env.ADMIN_CHAT_ID.split(',').forEach((id) => {
    if (id.trim()) adminChatsSet.add(id.trim());
  });
}

function persistState() {
  try {
    const seen = new Set<string>();
    const list: OrderRecord[] = [];
    const records = Array.from(ordersMap.values());
    for (let i = 0; i < records.length; i++) {
      if (!seen.has(records[i].id)) {
        seen.add(records[i].id);
        list.push(records[i]);
      }
    }
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(list.slice(-100)), 'utf8');
  } catch {}

  try {
    fs.writeFileSync(
      ADMINS_FILE,
      JSON.stringify(Array.from(adminChatsSet)),
      'utf8'
    );
  } catch {}
}

export const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN || '8870306435:AAHtmuo8X4kjUcWdLCKriZj-8nGQjbGG6BE';

export const BOT_USERNAME =
  process.env.NEXT_PUBLIC_SHOP_TELEGRAM || 'evro_desert86bot';

export const CARD_NUMBER = '8600 3100 4520 8181';
export const CARD_HOLDER = 'EVRO DESERT (Qandolat uyi)';
export const SHOP_PHONE = '+998 (90) 360-59-03';

/**
 * Yangi unikal 6-xonali orderId yaratish (masalan: ED-741920)
 */
export function generateOrderId(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return `ED-${code}`;
}

/**
 * Buyurtmani saqlash
 */
export function saveOrder(orderData: Partial<OrderRecord>): OrderRecord {
  const cleanCode =
    orderData.cleanCode ||
    (orderData.id ? orderData.id.replace(/^ED-/i, '').replace(/[^0-9]/g, '') : null) ||
    Math.floor(100000 + Math.random() * 900000).toString();
  const id = orderData.id || `ED-${cleanCode}`;

  const existing = ordersMap.get(id) || ordersMap.get(cleanCode);

  const mergedItems =
    orderData.items && orderData.items.length > 0 && orderData.items[0].name !== 'Tort / Bento'
      ? orderData.items
      : existing?.items && existing.items.length > 0
      ? existing.items
      : orderData.items || [];

  const fullRecord: OrderRecord = {
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

/**
 * Telegram deep link parametri orqali buyurtmani dekodlash
 * Namuna: ED829103_180k_901234567_D yoki buyurtma_829103
 */
export function decodeOrderFromParam(param: string): Partial<OrderRecord> | null {
  if (!param) return null;
  const clean = param.trim();

  // Pattern: ED829103_180k_901234567_D
  const matchFull = clean.match(/^ED([0-9]{5,7})_([0-9]+)k_([0-9]{9})_([DP])$/i);
  if (matchFull) {
    const code = matchFull[1];
    const totalThousands = parseInt(matchFull[2], 10);
    const total = totalThousands * 1000;
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
      items: [
        {
          name: 'Tort / Bento',
          price: total,
          quantity: 1,
        },
      ],
    };
  }

  // Pattern: buyurtma_829103 or ED829103 or 829103
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

/**
 * Saytdan kelgan buyurtma matnini parse qilish
 */
export function parseOrderFromText(text: string): Partial<OrderRecord> | null {
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
  const totalMatch = text.match(/(?:JAMI TO'LOV|Jami summa|Summa):\*?\s*([0-9\s,]+)\s*so'?m/i);

  const cleanCode = codeMatch ? codeMatch[1] : Math.floor(100000 + Math.random() * 900000).toString();
  const id = `ED-${cleanCode}`;

  let total = 0;
  if (totalMatch) {
    total = parseInt(totalMatch[1].replace(/[^0-9]/g, ''), 10) || 0;
  }

  const name = nameMatch ? nameMatch[1].trim() : '';
  const phone = phoneMatch ? phoneMatch[1].trim() : '';

  let deliveryType: 'delivery' | 'pickup' = 'delivery';
  let address = '';
  if (deliveryMatch) {
    const delText = deliveryMatch[1].toLowerCase();
    if (delText.includes('olib ketish') || delText.includes('dokon') || delText.includes("do'kon")) {
      deliveryType = 'pickup';
      address = "Do'kondan olib ketish";
    } else {
      deliveryType = 'delivery';
      const bracketMatch = deliveryMatch[1].match(/\(([^)]+)\)/);
      if (bracketMatch) {
        address = bracketMatch[1].trim();
      }
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

/**
 * Buyurtmani qidirish (ED-123456 yoki 123456 orqali)
 */
export function findOrder(codeOrId: string): OrderRecord | null {
  if (!codeOrId) return null;
  // Deep-link format: ED829103_180k_901234567_D yoki #ED-829103
  const matchParam = codeOrId.match(/^#?ED-?([0-9]{5,7})/i);
  if (matchParam) {
    const code = matchParam[1];
    const found = ordersMap.get(`ED-${code}`) || ordersMap.get(code);
    if (found) return found;
  }
  const clean = codeOrId.replace(/^#?ED-/i, '').replace(/[^0-9]/g, '');
  return ordersMap.get(`ED-${clean}`) || ordersMap.get(clean) || null;
}

/**
 * Mijozning chat ID si bo'yicha eng oxirgi faol buyurtmasini topish
 */
export function findLatestOrderByChat(chatId: number | string): OrderRecord | null {
  if (!chatId) return null;
  const strChatId = chatId.toString();
  const records = Array.from(ordersMap.values());
  const userOrders = records.filter(
    (o) =>
      o.customerChatId?.toString() === strChatId ||
      o.telegramUser?.id?.toString() === strChatId
  );
  if (userOrders.length === 0) return null;
  userOrders.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return userOrders[0];
}

/**
 * Barcha buyurtmalarni ro'yxat qilish (eng yangilari birinchi)
 */
export function listOrders(): OrderRecord[] {
  const seen = new Set<string>();
  const list: OrderRecord[] = [];
  const records = Array.from(ordersMap.values());
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (!seen.has(record.id)) {
      seen.add(record.id);
      list.push(record);
    }
  }
  return list.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Buyurtma statusi yoki ma'lumotlarini yangilash
 */
export function updateOrder(
  id: string,
  updates: Partial<OrderRecord>
): OrderRecord | null {
  const existing = findOrder(id);
  if (!existing) return null;

  const updated: OrderRecord = {
    ...existing,
    ...updates,
  };

  ordersMap.set(existing.id, updated);
  ordersMap.set(existing.cleanCode, updated);

  persistState();

  return updated;
}

/**
 * Telegram Cloud orqali adminlarni saqlash va yuklab olish
 */
export async function syncAdminsWithTelegramCloud(): Promise<string[]> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMyCommands?language_code=eo`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.result)) {
      const adminCmd = data.result.find((c: any) => c.command === 'admins');
      if (adminCmd && adminCmd.description) {
        const ids: string[] = JSON.parse(adminCmd.description);
        for (let i = 0; i < ids.length; i++) {
          adminChatsSet.add(ids[i].toString());
        }
      }
    }
  } catch {}
  return Array.from(adminChatsSet);
}

export async function persistAdminsToTelegramCloud(): Promise<boolean> {
  try {
    const list = Array.from(adminChatsSet);
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_code: 'eo',
        commands: [
          {
            command: 'admins',
            description: JSON.stringify(list),
          },
        ],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Admin chatlarini boshqarish
 */
export function registerAdminChat(chatId: number | string): boolean {
  if (!chatId) return false;
  adminChatsSet.add(chatId.toString());
  persistState();
  persistAdminsToTelegramCloud().catch(() => {});
  return true;
}

export function removeAdminChat(chatId: number | string): boolean {
  if (!chatId) return false;
  adminChatsSet.delete(chatId.toString());
  persistState();
  persistAdminsToTelegramCloud().catch(() => {});
  return true;
}

export function getAdminChatIds(): string[] {
  return Array.from(adminChatsSet);
}

export function isAdminChat(chatId: number | string): boolean {
  if (!chatId) return false;
  return adminChatsSet.has(chatId.toString());
}

export interface OrderStats {
  totalOrders: number;
  totalSum: number;
  paidChecking: number;
  confirmed: number;
  ready: number;
  delivered: number;
  cancelled: number;
}

export function getOrderStats(): OrderStats {
  const orders = listOrders();
  const stats: OrderStats = {
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

export function getOrderStatusDisplay(
  status: OrderStatus,
  deliveryType: 'delivery' | 'pickup' = 'delivery'
) {
  switch (status) {
    case 'new':
    case 'pending_payment':
      return {
        badge: '🟡 To\'lov kutilmoqda',
        progress: '🟡 [To\'lov kutilmoqda] ➔ ⏳ [Chek tekshirish] ➔ 👨‍🍳 [Tayyorlash] ➔ 🎂 [Tayyor]',
        desc: 'Buyurtmangiz qabul qilingan. Iltimos, to\'lovni amalga oshirib, chekni yuboring.',
      };
    case 'paid_checking':
      return {
        badge: '⏳ To\'lov cheki tekshirilmoqda',
        progress: '✅ [To\'lov] ➔ ⏳ [Chek tekshirilmoqda] ➔ 👨‍🍳 [Tayyorlash] ➔ 🎂 [Tayyor]',
        desc: 'To\'lov chekingiz yuborildi. Administrator chekni tekshirib, tez orada tasdiqlaydi.',
      };
    case 'confirmed':
      return {
        badge: '👨‍🍳 Tayyorlanmoqda',
        progress: '✅ [To\'lov] ➔ ✅ [Chek tasdiqlandi] ➔ 👨‍🍳 [Qandolatchi tayyorlamoqda] ➔ 🎂 [Tayyor]',
        desc: 'Buyurtmangiz tasdiqlandi! Qandolatchi mutaxassisimiz shirinlikni tayyorlashga kirishdi.',
      };
    case 'ready':
      return {
        badge: '🎂 Tayyor bo\'ldi!',
        progress: '✅ [Tayyorlandi] ➔ 🎉 [Tayyor bo\'ldi!]',
        desc:
          deliveryType === 'pickup'
            ? 'Shirinligingiz tayyor bo\'ldi! Qo\'qon shahridagi do\'konimizdan olib ketishingiz mumkin.'
            : 'Shirinligingiz tayyor bo\'ldi! Kuryerimiz manzilingizga yetkazish uchun yo\'lga chiqmoqda.',
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
        desc: 'Ushbu buyurtma bekor qilindi. Savollaringiz bo\'lsa: ' + SHOP_PHONE,
      };
    default:
      return {
        badge: '🟡 Qabul qilingan',
        progress: '🟡 [Ko\'rib chiqilmoqda]',
        desc: 'Buyurtmangiz tizimda qayta ishlanmoqda.',
      };
  }
}

/**
 * Barcha adminlarga Telegram orqali xabar yuborish
 */
export async function notifyAdmins(
  text: string,
  replyMarkup?: any
): Promise<number> {
  let chatIds = getAdminChatIds();
  if (chatIds.length === 0) {
    chatIds = await syncAdminsWithTelegramCloud();
  }
  if (chatIds.length === 0) return 0;

  let successCount = 0;
  for (let i = 0; i < chatIds.length; i++) {
    const chatId = chatIds[i];
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: 'HTML',
            reply_markup: replyMarkup,
          }),
        }
      );
      if (res.ok) successCount++;
    } catch (err) {
      console.error(`Telegram notify error to ${chatId}:`, err);
    }
  }
  return successCount;
}

/**
 * Adminlarga rasm (masalan: to'lov cheki) yuborish
 */
export async function notifyAdminsPhoto(
  photoFileId: string,
  caption: string,
  replyMarkup?: any
): Promise<number> {
  let chatIds = getAdminChatIds();
  if (chatIds.length === 0) {
    chatIds = await syncAdminsWithTelegramCloud();
  }
  if (chatIds.length === 0) return 0;

  let successCount = 0;
  for (let i = 0; i < chatIds.length; i++) {
    const chatId = chatIds[i];
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            photo: photoFileId,
            caption,
            parse_mode: 'HTML',
            reply_markup: replyMarkup,
          }),
        }
      );
      if (res.ok) successCount++;
    } catch (err) {
      console.error(`Telegram notify photo error to ${chatId}:`, err);
    }
  }
  return successCount;
}

/**
 * Foydalanuvchiga Telegram xabari yuborish
 */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: any
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        }),
      }
    );
    return res.ok;
  } catch (err) {
    console.error(`Error sending message to ${chatId}:`, err);
    return false;
  }
}

/**
 * Telegram xabarni tahrirlash (Edit Message Text)
 */
export async function editTelegramMessage(
  chatId: number | string,
  messageId: number | string,
  text: string,
  replyMarkup?: any
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        }),
      }
    );
    return res.ok;
  } catch (err) {
    console.error(`Error editing message:`, err);
    return false;
  }
}

/**
 * Telegram rasm tagidagi yozuvni tahrirlash (Edit Message Caption)
 */
export async function editTelegramCaption(
  chatId: number | string,
  messageId: number | string,
  caption: string,
  replyMarkup?: any
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/editMessageCaption`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          caption,
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        }),
      }
    );
    return res.ok;
  } catch (err) {
    console.error(`Error editing caption:`, err);
    return false;
  }
}

/**
 * Callback query javobini yuborish (Spinner'ni o'chirish)
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert: boolean = false
): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callbackQueryId,
          text,
          show_alert: showAlert,
        }),
      }
    );
    return res.ok;
  } catch (err) {
    return false;
  }
}

/**
 * Chatdagi Web App / Shirinlik xarid qilish menyu tugmasini tozalash
 */
export async function resetChatMenuButton(chatId?: number | string): Promise<boolean> {
  try {
    const body: any = { menu_button: { type: 'commands' } };
    if (chatId) body.chat_id = chatId;
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}
