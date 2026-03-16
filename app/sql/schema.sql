-- ВДЕ Карта України — схема БД
-- Запускати в Supabase: Dashboard → SQL Editor → Run
-- Тільки таблиця заявок — станції зберігаються у all_stations.js

create table if not exists update_requests (
  id               bigserial primary key,
  station_id       text,
  submitter_name   text,
  submitter_phone  text,
  submitter_email  text,
  capacity_mw      double precision,
  lat              double precision,
  lon              double precision,
  address_update   text,
  comment          text,
  status           text default 'new' check (status in ('new','reviewed','applied','rejected')),
  created_at       timestamptz default now()
);

-- Індекс для швидкого пошуку нових заявок
create index if not exists update_requests_status_idx on update_requests(status, created_at desc);
