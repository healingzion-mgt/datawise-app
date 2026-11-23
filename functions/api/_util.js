// Shared helpers for DataWise Cloudflare Pages Functions

export function cors(res) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return res;
}

export function json(data, status) {
  return cors(new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "Content-Type": "application/json" }
  }));
}

export async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function makeToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Resolve the logged-in user from a ?token= query param. Returns user_id or null.
export async function getUserId(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return null;
  const row = await env.DB.prepare(`SELECT user_id FROM sessions WHERE token = ?`).bind(token).first();
  return row ? row.user_id : null;
}
