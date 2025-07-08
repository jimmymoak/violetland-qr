// app/[[...slug]]/route.js      ← create or overwrite
export const runtime = 'edge';

export async function GET(request, { params }) {
  const slug = params.slug?.join('/') || 'home';
  const ip   = request.headers.get('x-forwarded-for') || 'unknown';
  const now  = new Date().toISOString();

  /* 1️⃣  Log scan */
  fetch('https://v0.api.vercel-kv.com/set', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key: `${slug}:${now}`, val: ip })
  }).catch(()=>{});

  /* 2️⃣  Optional SMS / push */
  if (process.env.WEBHOOK_URL) {
    fetch(process.env.WEBHOOK_URL, {
      method: 'POST',
      body: JSON.stringify({ slug, time: now, ip })
    }).catch(()=>{});
  }

  /* 3️⃣  Redirect — pulled from ENV so you can switch hosts later */
  const dest = process.env.DEST_URL || 'https://violetland.com';
  return Response.redirect(dest, 307);
}
