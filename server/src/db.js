const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

function buildPgConfig() {
  const useSsl = process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined;

  if (connectionString) {
    try {
      const u = new URL(connectionString);
      const hasPassword = typeof u.password === 'string' && u.password.length > 0;

      if (!hasPassword) {
        const envPwd = process.env.PGPASSWORD;
        const hasEnvPwd = typeof envPwd === 'string' && envPwd.length > 0;
        if (hasEnvPwd) {
          // Prefer discrete PG* vars when DATABASE_URL has no password
          return {
            host: process.env.PGHOST || u.hostname || 'localhost',
            port: parseInt(process.env.PGPORT || (u.port || '5432'), 10),
            user: process.env.PGUSER || (u.username ? decodeURIComponent(u.username) : 'postgres'),
            password: envPwd,
            database: process.env.PGDATABASE || (u.pathname ? u.pathname.replace(/^\//, '') : 'mindmesh'),
            ssl: useSsl
          };
        }
        if (process.env.PG_ALLOW_PASSWORDLESS === 'true') {
          // Intentionally allow passwordless only if server-side auth is configured accordingly (trust/peer)
          return {
            host: process.env.PGHOST || u.hostname || 'localhost',
            port: parseInt(process.env.PGPORT || (u.port || '5432'), 10),
            user: process.env.PGUSER || (u.username ? decodeURIComponent(u.username) : 'postgres'),
            // Provide an empty string to satisfy pg's requirement that password be a string if SASL is negotiated
            // (server may still reject if it requires a real password)
            password: process.env.PGPASSWORD ?? '',
            database: process.env.PGDATABASE || (u.pathname ? u.pathname.replace(/^\//, '') : 'mindmesh'),
            ssl: useSsl
          };
        }
        // Emit a clear message early instead of the generic SCRAM error from pg
        throw new Error('DATABASE_URL is set but has no password. Set PGPASSWORD env var or include password in DATABASE_URL (postgres://user:pass@host:port/db). To intentionally allow passwordless, set PG_ALLOW_PASSWORDLESS=true (requires server trust/peer auth).');
      }
      return { connectionString, ssl: useSsl };
    } catch (e) {
      // If URL parsing fails, fall back to discrete env vars below
    }
  }

  return {
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'mindmesh',
    ssl: useSsl
  };
}

const pool = new Pool(buildPgConfig());

async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

async function init() {
  // Create tables if not exist
  await query(`
  create table if not exists users (
    id uuid primary key,
    name text not null,
    email text unique not null,
    password_hash text not null,
    role text not null default 'user',
    avatar text,
    created_at timestamptz not null default now()
  );

  create table if not exists journals (
    id uuid primary key,
    user_id uuid not null references users(id) on delete cascade,
    title text,
    content text,
    mood numeric,
    tags jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists habits (
    id uuid primary key,
    user_id uuid not null references users(id) on delete cascade,
    name text not null,
    frequency text not null,
    goal_per_week int,
    target_per_day int,
    days_of_week int[],
    color text,
    archived boolean not null default false,
    created_at timestamptz not null default now()
  );

  create table if not exists habit_completions (
    id uuid primary key,
    habit_id uuid not null references habits(id) on delete cascade,
    timestamp timestamptz not null default now(),
    date_key date not null
  );

  create table if not exists therapists (
    id uuid primary key,
    name text not null,
    specialty text,
    rating numeric,
    reviews int,
    experience text,
    location text,
    avatar text,
    price numeric,
    available text[]
  );

  create table if not exists bookings (
    id uuid primary key,
    user_id uuid not null references users(id) on delete cascade,
    therapist_id uuid not null,
    therapist_name text,
    date date not null,
    time text not null,
    price numeric,
    status text not null default 'confirmed',
    created_at timestamptz not null default now()
  );

  create table if not exists sessions (
    id uuid primary key,
    booking_id uuid,
    user_id uuid not null references users(id) on delete cascade,
    therapist_id uuid,
    therapist_name text,
    room_id text,
    status text not null,
    started_at timestamptz,
    completed_at timestamptz,
    scheduled_date date,
    scheduled_time text,
    duration int,
    notes text,
    video_call_data jsonb,
    emotion_data jsonb
  );

  create table if not exists emotions (
    id uuid primary key,
    user_id uuid not null references users(id) on delete cascade,
    emotion text not null,
    confidence numeric,
    notes text,
    context text,
    timestamp timestamptz not null default now()
  );
  `);

  // Ensure therapists.user_id exists
  try { await query('alter table therapists add column if not exists user_id uuid unique'); } catch (e) {}

  // Seed therapists if empty
  const count = await query('select count(*) from therapists');
  if (parseInt(count.rows[0].count, 10) === 0) {
    const { v4: uuidv4 } = require('uuid');
    const docs = [
      { name: 'Dr. Sarah Johnson', specialty: 'Anxiety & Depression', rating: 4.9, reviews: 127, experience: '12 years', location: 'Remote', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', price: 120, available: ['Mon','Wed','Fri'] },
      { name: 'Dr. Michael Chen', specialty: 'Trauma & PTSD', rating: 4.8, reviews: 98, experience: '15 years', location: 'Remote', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael', price: 150, available: ['Tue','Thu','Sat'] },
      { name: 'Dr. Emily Rodriguez', specialty: 'Stress Management', rating: 4.9, reviews: 156, experience: '10 years', location: 'Remote', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily', price: 110, available: ['Mon','Tue','Wed','Thu'] },
      { name: 'Dr. James Williams', specialty: 'Relationship Counseling', rating: 4.7, reviews: 89, experience: '8 years', location: 'Remote', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', price: 130, available: ['Wed','Thu','Fri'] }
    ];
    for (const t of docs) {
      await query('insert into therapists (id, name, specialty, rating, reviews, experience, location, avatar, price, available) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [uuidv4(), t.name, t.specialty, t.rating, t.reviews, t.experience, t.location, t.avatar, t.price, t.available]);
    }
  }
}
module.exports = { query, init, pool };