"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SessionUser } from "@/lib/auth";

export type CartItem = {
  id: number;
  slug: string;
  name: string;
  image: string | null;
  sizeLabel: string | null;
  unit: string;
  price: number;
  wholesalePrice: number | null;
  wholesaleMin: number;
  discount: number;
  stock: number;
  qty: number;
};

export type ProductLite = Omit<CartItem, "qty">;

const CART_KEY = "ms_cart_v1";
const FAV_KEY = "ms_favorites_v1";

type CartCtx = {
  items: CartItem[];
  ready: boolean;
  count: number;
  subtotal: number;
  savings: number;
  add: (product: ProductLite, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartCtx | null>(null);

type FavCtx = {
  favorites: number[];
  toggle: (id: number) => void;
  has: (id: number) => boolean;
};
const FavContext = createContext<FavCtx | null>(null);

type ToastCtx = { toast: (message: string) => void };
const ToastContext = createContext<ToastCtx | null>(null);

export function unitPrice(item: {
  price: number;
  wholesalePrice: number | null;
  wholesaleMin: number;
  discount: number;
  qty: number;
}): number {
  if (item.wholesalePrice != null && item.qty >= item.wholesaleMin) return item.wholesalePrice;
  return item.discount > 0 ? Math.round((item.price * (100 - item.discount)) / 100) : item.price;
}

function readStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function Providers({
  children,
  user,
}: {
  children: ReactNode;
  user: SessionUser | null;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setItems(readStore<CartItem[]>(CART_KEY, []));
    setFavorites(readStore<number[]>(FAV_KEY, []));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items, ready]);

  useEffect(() => {
    if (ready) window.localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
  }, [favorites, ready]);

  const toast = useCallback((text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage((m) => (m === text ? null : m)), 2200);
  }, []);

  const add = useCallback(
    (product: ProductLite, qty = 1) => {
      setItems((prev) => {
        const found = prev.find((i) => i.id === product.id);
        if (found) {
          const nextQty = Math.min(found.stock || 999, found.qty + qty);
          return prev.map((i) => (i.id === product.id ? { ...i, ...product, qty: nextQty } : i));
        }
        return [...prev, { ...product, qty: Math.min(product.stock || 999, qty) }];
      });
      toast(`${product.name} به سبد اضافه شد`);
    },
    [toast],
  );

  const setQty = useCallback((id: number, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, qty: Math.max(1, Math.min(i.stock || 999, qty)) } : i,
      ),
    );
  }, []);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const toggle = useCallback((id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
  }, []);

  const { count, subtotal, savings } = useMemo(() => {
    let c = 0;
    let s = 0;
    let saved = 0;
    for (const item of items) {
      const unit = unitPrice(item);
      c += item.qty;
      s += unit * item.qty;
      saved += (item.price - unit) * item.qty;
    }
    return { count: c, subtotal: s, savings: Math.max(0, saved) };
  }, [items]);

  const cartValue = useMemo(
    () => ({ items, ready, count, subtotal, savings, add, setQty, remove, clear }),
    [items, ready, count, subtotal, savings, add, setQty, remove, clear],
  );

  const favValue = useMemo(
    () => ({
      favorites,
      toggle,
      has: (id: number) => favorites.includes(id),
    }),
    [favorites, toggle],
  );

  return (
    <CartContext.Provider value={cartValue}>
      <FavContext.Provider value={favValue}>
        <ToastContext.Provider value={{ toast }}>
          <SessionContext.Provider value={user}>{children}</SessionContext.Provider>
          {message ? (
            <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 md:bottom-8">
              <div className="animate-toast rounded-full bg-ink px-5 py-2.5 text-sm text-white shadow-[0_6px_24px_rgba(31,39,35,0.18)]">
                {message}
              </div>
            </div>
          ) : null}
        </ToastContext.Provider>
      </FavContext.Provider>
    </CartContext.Provider>
  );
}

const SessionContext = createContext<SessionUser | null>(null);

export function useCart(): CartCtx {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside Providers");
  return ctx;
}

export function useFavorites(): FavCtx {
  const ctx = useContext(FavContext);
  if (!ctx) throw new Error("useFavorites must be used inside Providers");
  return ctx;
}

export function useToast(): ToastCtx {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside Providers");
  return ctx;
}

export function useSession(): SessionUser | null {
  return useContext(SessionContext);
}

export function toProductLite(p: {
  id: number;
  slug: string;
  name: string;
  image: string | null;
  sizeLabel: string | null;
  unit: string;
  price: number;
  wholesalePrice: number | null;
  wholesaleMin: number;
  discount: number;
  stock: number;
}): ProductLite {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    image: p.image,
    sizeLabel: p.sizeLabel,
    unit: p.unit,
    price: p.price,
    wholesalePrice: p.wholesalePrice,
    wholesaleMin: p.wholesaleMin,
    discount: p.discount,
    stock: p.stock,
  };
}
