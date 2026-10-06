"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PinIcon } from "@/components/icons";
import { toFa } from "@/lib/format";

const CENTER: [number, number] = [36.7069, 67.1147];

export function MapPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [status, setStatus] = useState("روی نقشه کلیک کنید تا محل تحویل مشخص شود");

  useEffect(() => {
    if (!holder.current || mapRef.current) return;
    const map = L.map(holder.current, { zoomControl: true, attributionControl: false }).setView(
      [lat ?? CENTER[0], lng ?? CENTER[1]],
      13,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

    const icon = L.divIcon({
      className: "",
      html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#0F5132;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 3px 10px rgba(15,81,50,.35)"></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 26],
    });

    const marker = L.marker([lat ?? CENTER[0], lng ?? CENTER[1]], { draggable: true, icon }).addTo(map);
    marker.on("dragend", () => {
      const p = marker.getLatLng();
      onChange(Number(p.lat.toFixed(5)), Number(p.lng.toFixed(5)));
    });
    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChange(Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5)));
    });

    mapRef.current = map;
    markerRef.current = marker;
    const t = window.setTimeout(() => map.invalidateSize(), 250);
    return () => {
      window.clearTimeout(t);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (lat == null || lng == null || !markerRef.current) return;
    const current = markerRef.current.getLatLng();
    if (Math.abs(current.lat - lat) > 1e-6 || Math.abs(current.lng - lng) > 1e-6) {
      markerRef.current.setLatLng([lat, lng]);
    }
  }, [lat, lng]);

  function locateMe() {
    if (!navigator.geolocation) {
      setStatus("مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند");
      return;
    }
    setStatus("در حال دریافت موقعیت…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        mapRef.current?.setView(next, 15);
        markerRef.current?.setLatLng(next);
        onChange(Number(next[0].toFixed(5)), Number(next[1].toFixed(5)));
        setStatus("موقعیت شما ثبت شد");
      },
      () => setStatus("دسترسی به موقعیت داده نشد — روی نقشه کلیک کنید"),
      { timeout: 8000 },
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-line">
      <div ref={holder} className="h-[280px] w-full bg-brand-soft md:h-[320px]" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white px-3.5 py-2.5">
        <p className="flex items-center gap-2 text-[12px] text-muted">
          <PinIcon width={15} height={15} className="text-brand" />
          {lat != null && lng != null ? (
            <span className="num" dir="ltr">
              {toFa(lat.toFixed(5))}, {toFa(lng.toFixed(5))}
            </span>
          ) : (
            status
          )}
        </p>
        <button
          type="button"
          onClick={locateMe}
          className="rounded-md border border-line px-3 py-1.5 text-[12px] text-ink transition hover:border-brand hover:text-brand"
        >
          موقعیت من
        </button>
      </div>
    </div>
  );
}
