import { json, getUserId } from "./_util.js";

export async function onRequestGet({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ ok: false, error: "Not logged in" }, 401);

  const { results } = await env.DB.prepare(
    `SELECT * FROM data_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 200`
  ).bind(userId).all();

  return json({ ok: true, logs: results });
}

export async function onRequestPost({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ ok: false, error: "Not logged in" }, 401);

  const body = await request.json();
  const mb_used = Number(body.mb_used);
  if (!mb_used || mb_used <= 0) return json({ ok: false, error: "mb_used must be a positive number" }, 400);

  await env.DB.prepare(
    `INSERT INTO data_logs (user_id, app_name, mb_used, note) VALUES (?, ?, ?, ?)`
  ).bind(userId, body.app_name || null, mb_used, body.note || null).run();

  // bump the active subscription's used counter
  await env.DB.prepare(
    `UPDATE subscriptions SET data_used_mb = data_used_mb + ? WHERE user_id = ? AND active = 1`
  ).bind(mb_used, userId).run();

  return json({ ok: true });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
