-- 20260728000000_uto_users_telegram_id.sql
-- Unified Telegram identity: link key on the identity spine (uto.users).
-- Idempotent and safe to run more than once.

alter table if exists uto.users
  add column if not exists telegram_id bigint,
  add column if not exists telegram_username text,
  add column if not exists telegram_photo_url text;

-- One Telegram account maps to at most one uto.users row.
-- Partial index so existing rows (telegram_id null) don't collide.
create unique index if not exists users_telegram_id_key
  on uto.users (telegram_id)
  where telegram_id is not null;

comment on column uto.users.telegram_id is
  'Telegram numeric user id. Link key for the telegram-auth Edge Function (unified Mini App + workspace login).';
