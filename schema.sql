-- DataWise schema

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  network TEXT NOT NULL,            -- MTN / Airtel / Glo / 9mobile
  plan_name TEXT,
  plan_cost INTEGER,                 -- naira
  data_total_mb INTEGER,             -- total data allowance in MB (0 = unlimited)
  data_used_mb INTEGER DEFAULT 0,
  is_unlimited INTEGER DEFAULT 0,
  start_date TEXT,
  end_date TEXT,                     -- expiry date
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS data_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  app_name TEXT,                     -- optional, which app/activity
  mb_used INTEGER NOT NULL,
  note TEXT,
  logged_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS airtime_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  network TEXT,
  type TEXT NOT NULL,                -- 'topup' or 'spend'
  amount INTEGER NOT NULL,           -- naira
  note TEXT,
  logged_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  daily_data_mb INTEGER,
  weekly_data_mb INTEGER,
  monthly_data_mb INTEGER,
  daily_airtime INTEGER,
  weekly_airtime INTEGER,
  monthly_airtime INTEGER,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hotspot_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  devices_connected INTEGER,
  duration_minutes INTEGER,
  mb_used INTEGER,
  logged_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  user_id INTEGER PRIMARY KEY,
  emergency_mode INTEGER DEFAULT 0,
  dark_mode INTEGER DEFAULT 0,
  notif_low_data INTEGER DEFAULT 1,
  notif_low_airtime INTEGER DEFAULT 1,
  notif_subscription INTEGER DEFAULT 1,
  call_rate REAL DEFAULT 0,
  sms_rate REAL DEFAULT 0
);
