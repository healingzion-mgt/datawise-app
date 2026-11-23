import { json, hashPassword, makeToken } from "./_util.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const name = (body.name || "").trim();

    if (!email || !password) {
      return json({ ok: false, error: "Email and password are required" }, 400);
    }

    const existing = await env.DB.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first();
    if (existing) {
      return json({ ok: false, error: "An account with this email already exists" }, 409);
    }

    const hashed = await hashPassword(password);
    const result = await env.DB.prepare(
      `INSERT INTO users (email, password, name) VALUES (?, ?, ?)`
    ).bind(email, hashed, name).run();

    const userId = result.meta.last_row_id;

    // defaults
    await env.DB.prepare(`INSERT INTO settings (user_id) VALUES (?)`).bind(userId).run();
    await env.DB.prepare(`INSERT INTO budgets (user_id) VALUES (?)`).bind(userId).run();

    const token = makeToken();
    await env.DB.prepare(`INSERT INTO sessions (token, user_id) VALUES (?, ?)`).bind(token, userId).run();

    return json({ ok: true, token, user: { id: userId, email, name } });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
