// api/[...slug].js
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const path = new URL(req.url).pathname.replace(/^\/api\//, '');
  if (path.startsWith('favicon')) {
    // serve a 204 No Content so the browser stops asking
    return new Response(null, { status: 204 });
  }

  const ip  = req.headers.get('x-forwarded-for') || 'unknown';
  const now = new Date().toISOString();

  /* log & notify (unchanged) */
  fetch('https://v0.api.vercel-kv.com/set', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key: `${path}:${now}`, val: ip })
  }).catch(() => {});

  if (process.env.WEBHOOK_URL) {
    fetch(process.env.WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value1: path, value2: now, value3: ip })
    }).catch(() => {});
  }

  return Response.redirect(process.env.DEST_URL || 'https://violetland.com', 307);
}
