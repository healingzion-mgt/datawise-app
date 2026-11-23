import { json, getUserId } from "./_util.js";

export async function onRequestGet({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ ok: false, error: "Not logged in" }, 401);

  const { results } = await env.DB.prepare(
    `SELECT * FROM hotspot_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 100`
  ).bind(userId).all();

  return json({ ok: true, logs: results });
}

export async function onRequestPost({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ ok: false, error: "Not logged in" }, 401);

  const body = await request.json();
  await env.DB.prepare(
    `INSERT INTO hotspot_logs (user_id, devices_connected, duration_minutes, mb_used) VALUES (?, ?, ?, ?)`
  ).bind(userId, body.devices_connected || 0, body.duration_minutes || 0, body.mb_used || 0).run();

  return json({ ok: true });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
