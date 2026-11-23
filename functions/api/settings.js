import { json, getUserId } from "./_util.js";

export async function onRequestGet({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ ok: false, error: "Not logged in" }, 401);

  const row = await env.DB.prepare(`SELECT * FROM settings WHERE user_id = ?`).bind(userId).first();
  return json({ ok: true, settings: row || null });
}

export async function onRequestPost({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ ok: false, error: "Not logged in" }, 401);

  const s = await request.json();
  await env.DB.prepare(
    `UPDATE settings SET emergency_mode=?, dark_mode=?, notif_low_data=?, notif_low_airtime=?, notif_subscription=? WHERE user_id=?`
  ).bind(
    s.emergency_mode ? 1 : 0, s.dark_mode ? 1 : 0,
    s.notif_low_data ? 1 : 0, s.notif_low_airtime ? 1 : 0, s.notif_subscription ? 1 : 0,
    userId
  ).run();

  return json({ ok: true });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
