// api/[...slug].js   — runs at Vercel Edge (no server to manage)
export const config = { runtime: 'edge' };

export default async function handler(request) {
  const url  = new URL(request.url);
  const slug = url.pathname.replace(/^\/api\//, '') || 'home';

  /* 1️⃣  Tiny scan log — stores "slug:timestamp → IP" in a free KV endpoint */
  const ip  = request.headers.get('x-forwarded-for') || 'unknown';
  const now = new Date().toISOString();
  fetch('https://v0.api.vercel-kv.com/set', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key: `${slug}:${now}`, val: ip })
  }).catch(()=>{});

  /* 2️⃣  Optional instant push  (add WEBHOOK_URL later in Vercel Settings) */
  if (process.env.WEBHOOK_URL) {
    fetch(process.env.WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({ slug, time: now, ip })
    }).catch(()=>{});
  }

  /* 3️⃣  Redirect the visitor */
  const destBase = process.env.DEST_BASE
        || 'https://violetland.com/explainer?ref=';
  return Response.redirect(destBase + slug, 307);
}
