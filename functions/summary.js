import { json, getUserId } from "./_util.js";

export async function onRequestGet({ request, env }) {
  const userId = await getUserId(request, env);
  if (!userId) return json({ ok: false, error: "Not logged in" }, 401);

  const sub = await env.DB.prepare(
    `SELECT * FROM subscriptions WHERE user_id = ? AND active = 1 ORDER BY id DESC LIMIT 1`
  ).bind(userId).first();

  const budget = await env.DB.prepare(`SELECT * FROM budgets WHERE user_id = ?`).bind(userId).first();
  const settings = await env.DB.prepare(`SELECT * FROM settings WHERE user_id = ?`).bind(userId).first();

  const todayData = await env.DB.prepare(
    `SELECT COALESCE(SUM(mb_used),0) as mb FROM data_logs WHERE user_id = ? AND date(logged_at) = date('now')`
  ).bind(userId).first();

  const weekData = await env.DB.prepare(
    `SELECT COALESCE(SUM(mb_used),0) as mb FROM data_logs WHERE user_id = ? AND logged_at >= datetime('now','-7 days')`
  ).bind(userId).first();

  const monthData = await env.DB.prepare(
    `SELECT COALESCE(SUM(mb_used),0) as mb FROM data_logs WHERE user_id = ? AND logged_at >= datetime('now','-30 days')`
  ).bind(userId).first();

  const last7 = await env.DB.prepare(
    `SELECT date(logged_at) as day, COALESCE(SUM(mb_used),0) as mb
     FROM data_logs WHERE user_id = ? AND logged_at >= datetime('now','-6 days')
     GROUP BY date(logged_at) ORDER BY day ASC`
  ).bind(userId).all();

  const topupSum = await env.DB.prepare(
    `SELECT COALESCE(SUM(amount),0) as total FROM airtime_logs WHERE user_id = ? AND type = 'topup'`
  ).bind(userId).first();
  const spendSum = await env.DB.prepare(
    `SELECT COALESCE(SUM(amount),0) as total FROM airtime_logs WHERE user_id = ? AND type = 'spend'`
  ).bind(userId).first();

  const estimatedAirtimeBalance = (topupSum.total || 0) - (spendSum.total || 0);

  const monthAirtimeSpend = await env.DB.prepare(
    `SELECT COALESCE(SUM(amount),0) as total FROM airtime_logs WHERE user_id = ? AND type='spend' AND logged_at >= datetime('now','-30 days')`
  ).bind(userId).first();

  return json({
    ok: true,
    subscription: sub || null,
    budget: budget || null,
    settings: settings || null,
    usage: {
      today_mb: todayData.mb,
      week_mb: weekData.mb,
      month_mb: monthData.mb,
      last7: last7.results
    },
    airtime: {
      estimated_balance: estimatedAirtimeBalance,
      month_spend: monthAirtimeSpend.total
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
