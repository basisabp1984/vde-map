# SETUP — Деплой ВДЕ Карта України

Потрібно: акаунт [Supabase](https://supabase.com) (безкоштовний) + акаунт [Vercel](https://vercel.com) (безкоштовний).

---

## Крок 1 — Supabase: створити проєкт

1. Зайдіть на [app.supabase.com](https://app.supabase.com) → **New project**
2. Назва і пароль — будь-які, регіон — EU (Frankfurt)

---

## Крок 2 — Supabase: створити таблицю

1. Dashboard → **SQL Editor** → **New query**
2. Вставте вміст файлу `sql/schema.sql` → натисніть **Run**
3. Новий query → вставте вміст `sql/rls.sql` → **Run**

---

## Крок 3 — Скопіювати ключі

Dashboard → **Settings** → **API**

Запишіть:
- **Project URL** — вигляд `https://xxxx.supabase.co`
- **anon public key** — рядок що починається з `eyJ...`

Відкрийте `js/config.js` і замініть:

```js
window.APP_CONFIG = {
  supabaseUrl:     'https://xxxx.supabase.co',  // ← ваш Project URL
  supabaseAnonKey: 'eyJhbGc...',                // ← ваш anon key
};
```

---

## Крок 4 — Деплой на Vercel

### Варіант А — через GitHub (рекомендовано)

1. Залийте папку `app/` у GitHub репозиторій
2. Зайдіть на [vercel.com](https://vercel.com) → **Add New Project**
3. Оберіть репозиторій → **Deploy**
4. Vercel автоматично знайде `index.html` у корені

### Варіант Б — через Vercel CLI

```bash
npm i -g vercel
cd app
vercel deploy --prod
```

---

## Перевірка після деплою

- [ ] Сторінка відкривається без помилок у консолі браузера
- [ ] Число станцій у топбарі не `—` (842 або близько)
- [ ] Маркери з'являються на карті
- [ ] Кнопка «Оновити дані» відкриває форму
- [ ] Після заповнення форми → запис з'являється у Supabase → `update_requests`

---

## Обробка заявок від власників

Supabase Dashboard → **Table Editor** → `update_requests`

Нові заявки мають статус `new`. Переглядайте, уточнюйте і оновлюйте статус вручну або через SQL.

---

## Структура файлів

```
app/
├── index.html          — сторінка
├── all_stations.js     — 842 станції (статичні дані)
├── css/                — 7 CSS-файлів
├── js/
│   ├── config.js       — Supabase URL і ключ ← редагувати
│   ├── state.js        — спільний стан APP
│   ├── utils.js        — утиліти
│   ├── data.js         — Supabase клієнт (тільки для заявок)
│   ├── map.js          — Leaflet карта
│   ├── overview.js     — таб Огляд
│   ├── oblast.js       — таб Область
│   ├── registry.js     — таб Станція
│   ├── market.js       — таб Трейдинг
│   ├── update-form.js  — форма власника
│   └── app.js          — ініціалізація
└── sql/
    ├── schema.sql      — CREATE TABLE update_requests
    └── rls.sql         — права доступу
```
