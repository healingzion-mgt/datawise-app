import { json, getUserId } from "./_util.js";

export async function onRequestGet({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ ok: false, error: "Not logged in" }, 401);

  const { results } = await env.DB.prepare(
    `SELECT * FROM airtime_logs WHERE user_id = ? ORDER BY logged_at DESC LIMIT 200`
  ).bind(userId).all();

  return json({ ok: true, logs: results });
}

export async function onRequestPost({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ ok: false, error: "Not logged in" }, 401);

  const body = await request.json();
  const amount = Number(body.amount);
  const type = body.type === "topup" ? "topup" : "spend";
  if (!amount || amount <= 0) return json({ ok: false, error: "amount must be a positive number" }, 400);

  await env.DB.prepare(
    `INSERT INTO airtime_logs (user_id, network, type, amount, note) VALUES (?, ?, ?, ?, ?)`
  ).bind(userId, body.network || null, type, amount, body.note || null).run();

  return json({ ok: true });
}

export async function onRequestPatch({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ ok: false, error: "Not logged in" }, 401);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ ok: false, error: "id required" }, 400);

  const body = await request.json();
  const amount = Number(body.amount);
  const type = body.type === "topup" ? "topup" : "spend";
  if (!amount || amount <= 0) return json({ ok: false, error: "amount must be a positive number" }, 400);

  await env.DB.prepare(
    `UPDATE airtime_logs SET network=?, type=?, amount=?, note=? WHERE id=? AND user_id=?`
  ).bind(body.network || null, type, amount, body.note || null, id, userId).run();

  return json({ ok: true });
}

export async function onRequestDelete({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ ok: false, error: "Not logged in" }, 401);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ ok: false, error: "id required" }, 400);

  await env.DB.prepare(`DELETE FROM airtime_logs WHERE id=? AND user_id=?`).bind(id, userId).run();
  return json({ ok: true });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
                                      }
