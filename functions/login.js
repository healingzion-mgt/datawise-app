import { json, hashPassword, makeToken } from "./_util.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    const user = await env.DB.prepare(`SELECT * FROM users WHERE email = ?`).bind(email).first();
    if (!user) return json({ ok: false, error: "No account with that email" }, 401);

    const hashed = await hashPassword(password);
    if (hashed !== user.password) return json({ ok: false, error: "Wrong password" }, 401);

    const token = makeToken();
    await env.DB.prepare(`INSERT INTO sessions (token, user_id) VALUES (?, ?)`).bind(token, user.id).run();

    return json({ ok: true, token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
