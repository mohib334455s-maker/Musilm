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
