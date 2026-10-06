# Muslim Store | مسلم استور

فروشگاه آنلاین مواد خوراکی عمده و پرچون در مزارشریف — برندهای افغانستانی با پنل مدیریت کامل.

## اجرا

```bash
npm install
# PostgreSQL را با DATABASE_URL در .env تنظیم کنید
npx drizzle-kit push
node scripts/seed.mjs
npm run dev
```

برای دیتابیس محلی بدون نصب سیستمی:

```bash
node scripts/dev-db.mjs
```

سپس در ترمینال دیگر `npm run dev`.

## ادمین

- ورود با حساب ادمین از `/account`
- پنل: `/admin`
- مدیریت محصولات، دسته‌ها، سفارش‌ها، مشتریان، پیام‌ها، نقدها، موجودی، مناطق تحویل، پرداخت، تخفیف و تنظیمات

## دیپلوی روی Vercel

در **Project Settings → Environment Variables** این‌ها را برای Production (و Preview) ست کنید:

| متغیر | توضیح |
|--------|--------|
| `DATABASE_URL` | اتصال PostgreSQL (مثلاً Neon / Supabase / Vercel Postgres) با `?sslmode=require` |
| `AUTH_SECRET` | یک رشته تصادفی بلند |
| `NEXT_PUBLIC_SITE_URL` | آدرس دامنه Vercel شما |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | برای seed اولیه (اختیاری بعد از اولین seed) |

بعد از اولین دیپلوی، روی دیتابیس cloud یک‌بار schema و seed را اجرا کنید:

```bash
npx drizzle-kit push
node scripts/seed.mjs
```

(با همان `DATABASE_URL` ابری در `.env` محلی.)
