"use client";

import { useState } from "react";
import { Button, Field, areaClass, inputClass } from "@/components/ui";
import { CheckIcon } from "@/components/icons";
import { useToast } from "@/components/providers";

export function ContactForm() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", phone: "", body: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.phone.trim() || !form.body.trim()) {
      setError("لطفاً نام، شماره تماس و پیام را کامل کنید");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "error");
      setState("sent");
      toast("پیام شما ارسال شد");
    } catch {
      setError("ارسال پیام ناموفق بود، دوباره تلاش کنید");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-lg border border-line bg-brand-soft p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand">
          <CheckIcon width={24} height={24} />
        </div>
        <p className="mt-4 text-[15px] font-semibold text-ink">پیام شما ثبت شد</p>
        <p className="mt-1.5 text-[13px] text-muted">در ساعات کاری به شماره شما تماس می‌گیریم.</p>
        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={() => {
            setForm({ name: "", phone: "", body: "" });
            setState("idle");
          }}
        >
          ارسال پیام دیگر
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-line p-5 md:p-6">
      <h2 className="text-[16px] font-bold text-ink">ارسال پیام</h2>
      <p className="mt-1.5 text-[13px] text-muted">سوال، درخواست قیمت عمده یا پیشنهاد خود را بنویسید.</p>
      <div className="mt-5 space-y-4">
        <Field label="نام" required>
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="شماره تماس" required>
          <input className={inputClass} dir="ltr" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+93 700 000 000" />
        </Field>
        <Field label="پیام" required>
          <textarea className={areaClass} rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
        </Field>
      </div>
      {error ? <p className="mt-3 text-[12.5px] text-danger">{error}</p> : null}
      <Button type="submit" className="mt-5 w-full" disabled={state === "sending"}>
        {state === "sending" ? "در حال ارسال…" : "ارسال پیام"}
      </Button>
    </form>
  );
}
