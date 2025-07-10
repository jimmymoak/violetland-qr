// api/[...slug].js  — Edge Function
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const slug = new URL(req.url).pathname.replace(/^\/api\//, '') || 'home';

  // 1️⃣  Redirect first (never fails)
  const response = Response.redirect(
    (process.env.DEST_URL || 'https://violetland.com'),
    307
  );

  // 2️⃣  Fire-and-forget logging
  const ip  = req.headers.get('x-forwarded-for') || 'unknown';
  const now = new Date().toISOString();

  fetch('https://v0.api.vercel-kv.com/set', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key: `${slug}:${now}`, val: ip })
  }).catch(() => {});

  if (process.env.WEBHOOK_URL) {
    fetch(process.env.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value1: slug, value2: now, value3: ip })
    }).catch(() => {});
  }

  return response;
}
