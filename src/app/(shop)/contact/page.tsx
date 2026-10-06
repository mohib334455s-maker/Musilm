import { getSettings } from "@/lib/settings";
import { listZones } from "@/lib/store-data";
import { ContactForm } from "@/components/contact-form";
import { Reveal } from "@/components/ui";
import { PhoneIcon, PinIcon, TruckIcon } from "@/components/icons";
import { num } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "تماس با ما | Muslim Store" };

export default async function ContactPage() {
  const s = await getSettings();
  const zoneRows = await listZones();

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
            {
              Icon: TruckIcon,
              label: "ایمیل",
              value: s.email,
              dir: "ltr" as const,
              extra: `ارسال رایگان بالای ${num(Number(s.freeDeliveryThreshold))} افغانی`,
            },
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
              <table className="w-full text-right text-[12.5px]">
                <thead className="bg-brand-soft text-[11px] text-muted">
                  <tr>
                    <th className="px-3 py-2.5 font-medium">منطقه</th>
                    <th className="px-3 py-2.5 font-medium">کرایه</th>
                    <th className="px-3 py-2.5 font-medium">زمان</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {zoneRows.map((z) => (
                    <tr key={z.id}>
                      <td className="px-3 py-2.5 text-ink">{z.name}</td>
                      <td className="num px-3 py-2.5 text-muted">{z.fee === 0 ? "رایگان" : `${num(z.fee)} ؋`}</td>
                      <td className="num px-3 py-2.5 text-muted">{z.eta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>
        </div>

        <Reveal delay={60}>
          <div className="rounded-lg border border-line p-5 md:p-6">
            <h2 className="text-[18px] font-bold text-ink">ارسال پیام</h2>
            <p className="mt-1.5 text-[13px] text-muted">پیام شما در پنل مدیریت ثبت می‌شود.</p>
            <div className="mt-5">
              <ContactForm />
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
