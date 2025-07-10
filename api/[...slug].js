// api/[...slug].js  – Edge Function
export const config = { runtime: "edge" };

export default async function handler(req) {
  // ── 1. Parse slug, skip favicon ────────────────────────────────
  const slug = new URL(req.url).pathname.replace(/^\/api\//, "");
  if (slug.startsWith("favicon")) return new Response(null, { status: 204 });

  const now = new Date().toISOString();
  const ip  = req.headers.get("x-forwarded-for") || "unknown";

  // ── 2. Send visitor on their way immediately ───────────────────
  const redirectUrl = process.env.DEST_URL || "https://violetland.com";
  const response    = Response.redirect(redirectUrl, 307);

  // ── 3. Fire-and-forget: log scan (free KV) ─────────────────────
  fetch("https://v0.api.vercel-kv.com/set", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body:   JSON.stringify({ key: `${slug}:${now}`, val: ip })
  }).catch(() => {});

  // ── 4. Fire-and-forget: Textbelt SMS ───────────────────────────
  if (process.env.TEXTBELT_KEY) {
    fetch("https://textbelt.com/text", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        phone: process.env.TEXTBELT_TO,
        message: `QR ${slug} scanned ${now}`,
        key: process.env.TEXTBELT_KEY
      })
    }).catch(() => {});
  }

  return response;
}
