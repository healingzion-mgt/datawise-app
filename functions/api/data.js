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

export async function onRequestPatch({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ ok: false, error: "Not logged in" }, 401);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ ok: false, error: "id required" }, 400);

  const body = await request.json();
  const newMb = Number(body.mb_used);
  if (!newMb || newMb <= 0) return json({ ok: false, error: "mb_used must be a positive number" }, 400);

  const row = await env.DB.prepare(`SELECT mb_used FROM data_logs WHERE id=? AND user_id=?`).bind(id, userId).first();
  if (!row) return json({ ok: false, error: "Not found" }, 404);
  const delta = newMb - row.mb_used;

  await env.DB.prepare(
    `UPDATE data_logs SET app_name=?, mb_used=?, note=? WHERE id=? AND user_id=?`
  ).bind(body.app_name || null, newMb, body.note || null, id, userId).run();

  await env.DB.prepare(
    `UPDATE subscriptions SET data_used_mb = max(0, data_used_mb + ?) WHERE user_id = ? AND active = 1`
  ).bind(delta, userId).run();

  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ ok: false, error: "Not logged in" }, 401);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ ok: false, error: "id required" }, 400);

  const row = await env.DB.prepare(`SELECT mb_used FROM data_logs WHERE id=? AND user_id=?`).bind(id, userId).first();
  if (!row) return json({ ok: false, error: "Not found" }, 404);

  await env.DB.prepare(`DELETE FROM data_logs WHERE id=? AND user_id=?`).bind(id, userId).run();

  await env.DB.prepare(
    `UPDATE subscriptions SET data_used_mb = max(0, data_used_mb - ?) WHERE user_id = ? AND active = 1`
  ).bind(row.mb_used, userId).run();

  return json({ ok: true });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
