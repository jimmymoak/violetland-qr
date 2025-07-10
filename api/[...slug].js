// api/[...slug].js  — Edge Function (runs worldwide)
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const path = new URL(req.url).pathname.replace(/^\/api\//, '');
  if (path.startsWith('favicon')) {
    // Skip browser's favicon request
    return new Response(null, { status: 204 });
  }

  const now = new Date().toISOString();
  const ip  = req.headers.get('x-forwarded-for') || 'unknown';

  /* 1️⃣  Redirect visitor immediately */
  const dest = process.env.DEST_URL || 'https://violetland.com';
  const response = Response.redirect(dest, 307);

  /* 2️⃣  Log scan to free KV (fire-and-forget) */
  fetch('https://v0.api.vercel-kv.com/set', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key: `${path}:${now}`, val: ip })
  }).catch(() => {});

  /* 3️⃣  Textbelt SMS (fire-and-forget) */
  if (process.env.TEXTBELT_KEY) {
    fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        phone: process.env.TEXTBELT_TO,
        message: `QR ${path} scanned ${now}`,
        key: process.env.TEXTBELT_KEY
      })
    }).catch(() => {});
  }

  return response;
}
