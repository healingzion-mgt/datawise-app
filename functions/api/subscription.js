import { json, getUserId } from "./_util.js";

export async function onRequestGet({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ ok: false, error: "Not logged in" }, 401);

  const row = await env.DB.prepare(
    `SELECT * FROM subscriptions WHERE user_id = ? AND active = 1 ORDER BY id DESC LIMIT 1`
  ).bind(userId).first();

  return json({ ok: true, subscription: row || null });
}

export async function onRequestPost({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ ok: false, error: "Not logged in" }, 401);

  const body = await request.json();
  const {
    network, plan_name, plan_cost, data_total_mb, is_unlimited, start_date, end_date
  } = body;

  // deactivate previous active subscription
  await env.DB.prepare(`UPDATE subscriptions SET active = 0 WHERE user_id = ? AND active = 1`).bind(userId).run();

  await env.DB.prepare(
    `INSERT INTO subscriptions (user_id, network, plan_name, plan_cost, data_total_mb, data_used_mb, is_unlimited, start_date, end_date, active)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, 1)`
  ).bind(
    userId, network || null, plan_name || null, plan_cost || 0,
    data_total_mb || 0, is_unlimited ? 1 : 0, start_date || null, end_date || null
  ).run();

  return json({ ok: true });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
