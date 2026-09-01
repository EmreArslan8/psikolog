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
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePreference = escapeHtml(preference || 'Belirtilmedi');
  const safeTopic = escapeHtml(topic || 'Belirtilmedi');
  const safeMessage = escapeHtml(message);

  return `<!doctype html>
  <html lang="tr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        @media only screen and (max-width: 620px) {
          .email-shell { width: 100% !important; }
          .content-pad { padding-left: 22px !important; padding-right: 22px !important; }
          .detail-cell { display: block !important; width: 100% !important; box-sizing: border-box !important; }
          .detail-gap { height: 10px !important; }
          .title { font-size: 30px !important; line-height: 1.12 !important; }
        }
      </style>
    </head>
    <body style="margin:0;padding:0;background:#eef0e8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#2f372f">
      <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${safeName} tarafından yeni bir randevu talebi gönderildi.</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#eef0e8;border-collapse:collapse">
        <tr>
          <td align="center" style="padding:38px 14px">
            <table role="presentation" class="email-shell" width="640" cellspacing="0" cellpadding="0" border="0" style="width:640px;max-width:640px;background:#fffdf8;border:1px solid #dfe4d9;border-radius:24px;overflow:hidden;border-collapse:separate;box-shadow:0 14px 36px rgba(55,67,54,.08)">
              <tr>
                <td class="content-pad" style="padding:30px 38px 34px;background:#617861;color:#fffdf8">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse">
                    <tr>
                      <td style="font-family:Georgia,'Times New Roman',serif;font-size:17px;letter-spacing:.02em;color:#fffdf8">Selin Ünal</td>
                      <td align="right">
                        <span style="display:inline-block;padding:7px 11px;border:1px solid rgba(255,255,255,.32);border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#fffdf8">Yeni başvuru</span>
                      </td>
                    </tr>
                  </table>
                  <div style="height:42px;line-height:42px">&nbsp;</div>
                  <div style="font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#dce6d8">Randevu formu bildirimi</div>
                  <h1 class="title" style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:38px;line-height:1.12;font-weight:400;letter-spacing:-.02em;color:#fffdf8">Yeni bir görüşme talebi var.</h1>
                </td>
              </tr>
              <tr>
                <td class="content-pad" style="padding:32px 38px 38px">
                  <div style="margin-bottom:6px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#8a9487">Başvuru sahibi</div>
                  <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.25;color:#2f372f">${safeName}</div>
                  <a href="mailto:${safeEmail}" style="display:inline-block;margin-top:6px;font-size:14px;line-height:1.5;color:#617861;text-decoration:underline;text-decoration-color:#bdc9b8;text-underline-offset:3px">${safeEmail}</a>

                  <div style="height:26px;line-height:26px">&nbsp;</div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse">
                    <tr>
                      <td class="detail-cell" width="49%" style="width:49%;padding:17px 18px;background:#f3f4ed;border:1px solid #e4e8df;border-radius:14px;vertical-align:top">
                        <div style="margin-bottom:7px;font-size:10px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:#8a9487">Görüşme tercihi</div>
                        <div style="font-size:15px;line-height:1.45;color:#354035">${safePreference}</div>
                      </td>
                      <td class="detail-gap" width="2%" style="width:2%">&nbsp;</td>
                      <td class="detail-cell" width="49%" style="width:49%;padding:17px 18px;background:#f3f4ed;border:1px solid #e4e8df;border-radius:14px;vertical-align:top">
                        <div style="margin-bottom:7px;font-size:10px;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:#8a9487">Başvuru konusu</div>
                        <div style="font-size:15px;line-height:1.45;color:#354035">${safeTopic}</div>
                      </td>
                    </tr>
                  </table>

                  <div style="margin-top:28px;padding:24px 25px;background:#faf7ef;border-left:4px solid #c8a56a;border-radius:4px 14px 14px 4px">
                    <div style="margin-bottom:10px;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#97876b">Danışanın mesajı</div>
                    <div style="white-space:pre-wrap;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.7;color:#303830">${safeMessage}</div>
                  </div>

                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:28px;border-collapse:separate">
                    <tr>
                      <td align="center" style="background:#617861;border-radius:999px">
                        <a href="mailto:${safeEmail}" style="display:inline-block;padding:14px 23px;font-size:13px;font-weight:700;line-height:1;color:#ffffff;text-decoration:none">E-posta ile yanıtla&nbsp;&nbsp;→</a>
                      </td>
                    </tr>
                  </table>

                  <div style="margin-top:30px;padding-top:20px;border-top:1px solid #e5e8df;font-size:11px;line-height:1.7;color:#92998f">
                    Bu bildirim <a href="https://selinunal.com" style="color:#6f806d;text-decoration:none">selinunal.com</a> iletişim formundan otomatik olarak oluşturuldu. Yanıtladığınızda e-posta doğrudan danışana gider.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
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
