export const config = { runtime: "edge" };

export default async function handler(req) {
  // ── 1. Parse slug ──────────────────────────────────────────────
  const slug = new URL(req.url).pathname.replace(/^\/api\//, "");

  // Skip favicon or anything not matching the pattern XX-YY-123
  const validSlugRegex = /^[A-Z]{2}-[A-Z]{2}-\d+$/;
  if (!validSlugRegex.test(slug)) {
    return new Response(null, { status: 204 }); // or 400/404 if you prefer
  }

  const now = new Date().toISOString();
  const ip  = req.headers.get("x-forwarded-for") || "unknown";

  // ── 2. Redirect ────────────────────────────────────────────────
  const redirectUrl = process.env.DEST_URL || "https://violetland.com";
  const response    = Response.redirect(redirectUrl, 307);

  // ── 3. Log the scan ────────────────────────────────────────────
  fetch("https://v0.api.vercel-kv.com/set", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ key: `${slug}:${now}`, val: ip })
  }).catch(() => {});

  // ── 4. Send SMS via ClickSend ──────────────────────────────────
  if (process.env.CS_USER) {
    try {
      const smsRes = await fetch('https://rest.clicksend.com/v3/sms/send', {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${process.env.CS_USER}:${process.env.CS_KEY}`),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{
            to: process.env.CS_TO,
            body: `QR ${slug} scanned ${now}`
          }]
        })
      });

      const data = await smsRes.json();
      console.log('ClickSend response:', JSON.stringify(data));

    } catch (e) {
      console.error('ClickSend fetch failed:', e);
    }
  }

  return response;
}
