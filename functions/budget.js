import { json, getUserId } from "./_util.js";

export async function onRequestGet({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ ok: false, error: "Not logged in" }, 401);

  const row = await env.DB.prepare(`SELECT * FROM budgets WHERE user_id = ?`).bind(userId).first();
  return json({ ok: true, budget: row || null });
}

export async function onRequestPost({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ ok: false, error: "Not logged in" }, 401);

  const b = await request.json();
  await env.DB.prepare(
    `UPDATE budgets SET daily_data_mb=?, weekly_data_mb=?, monthly_data_mb=?, daily_airtime=?, weekly_airtime=?, monthly_airtime=?, updated_at=datetime('now') WHERE user_id=?`
  ).bind(
    b.daily_data_mb || null, b.weekly_data_mb || null, b.monthly_data_mb || null,
    b.daily_airtime || null, b.weekly_airtime || null, b.monthly_airtime || null,
    userId
  ).run();

  return json({ ok: true });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
