const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8870306435:AAHtmuo8X4kjUcWdLCKriZj-8nGQjbGG6BE';
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;

async function setupWebhookOnRender() {
  if (!RENDER_URL) {
    console.log('ℹ️ RENDER_EXTERNAL_URL topilmadi (lokal rejim).');
    return;
  }

  const cleanUrl = RENDER_URL.replace(/\/$/, '');
  const webhookUrl = `${cleanUrl}/api/bot`;

  console.log(`🔗 Render server ishga tushdi: ${cleanUrl}`);
  console.log(`🤖 Telegram Webhook ulanmoqda: ${webhookUrl}`);

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
    );
    const data = await res.json();
    console.log('✅ Webhook holati:', data);
  } catch (err) {
    console.error('⚠️ Webhook ulashda xatolik:', err.message);
  }

  // Har 10 daqiqada server uyg'oq turishi uchun keep-alive so'rov
  setInterval(async () => {
    try {
      await fetch(`${cleanUrl}/api/bot`);
    } catch {}
  }, 10 * 60 * 1000);
}

// Next.js production serverini ishga tushirish
const nextStart = spawn('npx', ['next', 'start', '-p', String(PORT), '-H', '0.0.0.0'], {
  stdio: 'inherit',
  shell: true,
});

// Server ko'tarilgach 5 soniyadan keyin webhookni avtomatik ulash
setTimeout(() => {
  setupWebhookOnRender();
}, 5000);

nextStart.on('close', (code) => {
  process.exit(code || 0);
});
