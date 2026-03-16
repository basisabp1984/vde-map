-- RLS — Row Level Security
-- Запускати після schema.sql

-- update_requests: вставляють всі (анонімні), читає тільки service key (адмін)
alter table update_requests enable row level security;

create policy "update_requests_public_insert"
  on update_requests for insert
  with check (true);

-- Для перегляду заявок: Supabase Dashboard → Table Editor → update_requests
-- або підключайтесь через SUPABASE_SERVICE_KEY (не anon key)
