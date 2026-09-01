const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const MAX_LENGTHS = {
  name: 120,
  email: 254,
  preference: 40,
  topic: 160,
  message: 4000,
};

const requestLog = new Map();

function clean(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isAllowedOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;

  const configuredOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
    .filter(Boolean)
    .map((host) => `https://${host}`);
  const allowedOrigins = new Set([
    'https://selinunal.com',
    'https://www.selinunal.com',
    'http://localhost:3000',
    'http://localhost:4321',
    'http://localhost:4322',
    'http://localhost:4323',
    ...configuredOrigins,
    ...vercelOrigins,
  ]);

  return allowedOrigins.has(origin);
}

function isRateLimited(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = String(Array.isArray(forwarded) ? forwarded[0] : forwarded || req.socket?.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
  const now = Date.now();
  const windowStart = now - 10 * 60 * 1000;
  const recent = (requestLog.get(ip) || []).filter((timestamp) => timestamp > windowStart);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > 5;
}

function renderEmail({ name, email, preference, topic, message }) {
  const rows = [
    ['Ad Soyad', name],
    ['E-posta', email],
    ['Görüşme Tercihi', preference || 'Belirtilmedi'],
    ['Başvuru Konusu', topic || 'Belirtilmedi'],
  ];
  const detailRows = rows.map(([label, value]) => `
    <tr>
      <td style="padding:10px 0;color:#858b7e;font-size:12px;vertical-align:top;width:150px">${label}</td>
      <td style="padding:10px 0;color:#30352e;font-size:14px;vertical-align:top">${escapeHtml(value)}</td>
    </tr>`).join('');

  return `<!doctype html>
  <html lang="tr">
    <body style="margin:0;background:#f1f2e8;font-family:Arial,sans-serif;color:#30352e">
      <div style="padding:32px 16px">
        <div style="max-width:620px;margin:0 auto;overflow:hidden;border:1px solid #e3e9dc;border-radius:20px;background:#fffdf7">
          <div style="padding:28px 32px;background:#5f745f;color:#fffdf7">
            <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;opacity:.8">selinunal.com</div>
            <h1 style="margin:8px 0 0;font-family:Georgia,serif;font-size:28px;font-weight:400">Yeni randevu talebi</h1>
          </div>
          <div style="padding:26px 32px 32px">
            <table role="presentation" style="width:100%;border-collapse:collapse">${detailRows}</table>
            <div style="margin-top:18px;padding-top:22px;border-top:1px solid #e3e9dc">
              <div style="margin-bottom:8px;color:#858b7e;font-size:12px">Mesaj</div>
              <div style="white-space:pre-wrap;color:#30352e;font-size:14px;line-height:1.7">${escapeHtml(message)}</div>
            </div>
            <a href="mailto:${encodeURIComponent(email)}" style="display:inline-block;margin-top:26px;padding:13px 22px;border-radius:999px;background:#5f745f;color:#fffdf7;font-size:13px;text-decoration:none">Danışana yanıt ver</a>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Yalnızca POST isteği kabul edilir.' });
  }

  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ message: 'Bu kaynaktan gönderime izin verilmiyor.' });
  }

  if (isRateLimited(req)) {
    return res.status(429).json({ message: 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin.' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  } catch {
    return res.status(400).json({ message: 'Geçersiz form verisi gönderildi.' });
  }
  if (body.website) {
    return res.status(200).json({ message: 'Mesajınız iletildi.' });
  }

  const payload = {
    name: clean(body.name, MAX_LENGTHS.name),
    email: clean(body.email, MAX_LENGTHS.email).toLowerCase(),
    preference: clean(body.preference, MAX_LENGTHS.preference),
    topic: clean(body.topic, MAX_LENGTHS.topic),
    message: clean(body.message, MAX_LENGTHS.message),
  };

  if (!payload.name || !isEmail(payload.email) || !payload.message || body.consent !== true) {
    return res.status(400).json({ message: 'Lütfen zorunlu alanları kontrol edin.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL || 'psk.selinunal@gmail.com';
  const from = process.env.RESEND_FROM_EMAIL || 'Selin Ünal Web Sitesi <randevu@selinunal.com>';
  if (!apiKey) {
    return res.status(503).json({ message: 'E-posta servisi henüz yapılandırılmadı.' });
  }

  try {
    const resendResponse = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: payload.email,
        subject: `Yeni randevu talebi — ${payload.name}`,
        html: renderEmail(payload),
        text: [
          'selinunal.com — Yeni randevu talebi',
          `Ad Soyad: ${payload.name}`,
          `E-posta: ${payload.email}`,
          `Görüşme Tercihi: ${payload.preference || 'Belirtilmedi'}`,
          `Başvuru Konusu: ${payload.topic || 'Belirtilmedi'}`,
          '',
          'Mesaj:',
          payload.message,
        ].join('\n'),
      }),
    });

    const result = await resendResponse.json().catch(() => ({}));
    if (!resendResponse.ok) {
      console.error('Resend gönderim hatası:', result?.message || result?.name || resendResponse.status);
      return res.status(502).json({ message: 'Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.' });
    }
  } catch (error) {
    console.error('Resend bağlantı hatası:', error instanceof Error ? error.message : 'Bilinmeyen hata');
    return res.status(502).json({ message: 'Mesaj gönderilemedi. Lütfen daha sonra tekrar deneyin.' });
  }

  return res.status(200).json({ message: 'Mesajınız iletildi. En kısa sürede size dönüş yapacağım.' });
}
