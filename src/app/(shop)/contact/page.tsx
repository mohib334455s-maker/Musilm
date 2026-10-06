import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { zones } from "@/db/schema";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/ui";
import { PhoneIcon, PinIcon, TruckIcon } from "@/components/icons";
import { num } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "تماس با ما | Muslim Store" };

export default async function ContactPage() {
  const s = await getSettings();
  const zoneRows = await db.select().from(zones).where(eq(zones.isActive, true)).orderBy(asc(zones.id));

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-6 md:py-14">
      <div className="border-b border-line pb-6">
        <h1 className="text-[28px] font-bold text-ink md:text-[36px]">تماس با ما</h1>
        <p className="mt-2 max-w-xl text-[14px] leading-8 text-muted">
          برای سفارش عمده، سوال درباره قیمت‌ها یا هماهنگی تحویل با ما در تماس باشید.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3">
          {[
            { Icon: PhoneIcon, label: "تلفن / واتساپ", value: s.phone, dir: "ltr" as const, extra: s.workingHours },
            { Icon: PinIcon, label: "آدرس انبار", value: s.address, extra: s.pickupAddress },
            { Icon: TruckIcon, label: "ایمیل", value: s.email, dir: "ltr" as const, extra: `ارسال رایگان بالای ${num(Number(s.freeDeliveryThreshold))} افغانی` },
          ].map(({ Icon, label, value, extra, dir }) => (
            <Reveal key={label}>
              <div className="flex items-start gap-4 rounded-lg border border-line p-5 transition hover:border-brand/40">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
                  <Icon width={18} height={18} />
                </span>
                <div>
                  <p className="text-[12.5px] text-muted">{label}</p>
                  <p className="num mt-1 text-[15px] font-semibold text-ink" dir={dir}>
                    {value}
                  </p>
                  {extra ? <p className="mt-1 text-[12px] text-muted">{extra}</p> : null}
                </div>
              </div>
            </Reveal>
          ))}

          <Reveal delay={80}>
            <div className="overflow-hidden rounded-lg border border-line">
              <iframe
                title="نقشه مزارشریف"
                className="h-[240px] w-full border-0"
                loading="lazy"
                src="https://www.openstreetmap.org/export/embed.html?bbox=67.05%2C36.66%2C67.18%2C36.76&layer=mapnik&marker=36.7069%2C67.1147"
              />
            </div>
          </Reveal>
        </div>

        <Reveal delay={40}>
          <ContactForm />
        </Reveal>
      </div>

      <div className="mt-12">
        <h2 className="border-b border-line pb-4 text-[20px] font-bold text-ink">مناطق تحت پوشش</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {zoneRows.map((z) => (
            <div key={z.id} className="rounded-lg border border-line p-4">
              <p className="text-[14px] font-semibold text-ink">{z.name}</p>
              <dl className="num mt-2.5 space-y-1 text-[12.5px] text-muted">
                <div className="flex justify-between">
                  <dt>کرایه</dt>
                  <dd>{z.fee === 0 ? "رایگان" : `${num(z.fee)} ؋`}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>حداقل سفارش</dt>
                  <dd>{num(z.minOrder)} ؋</dd>
                </div>
                <div className="flex justify-between">
                  <dt>ارسال رایگان از</dt>
                  <dd className="text-brand">{num(z.freeOver)} ؋</dd>
                </div>
                <div className="flex justify-between">
                  <dt>زمان تحویل</dt>
                  <dd>{z.eta}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
