import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;

const base = (p: P) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

export const SearchIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);

export const UserIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
  </svg>
);

export const HeartIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20s-7.2-4.4-7.2-9.4A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.2 2.4C19.2 15.6 12 20 12 20Z" />
  </svg>
);

export const CartIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 4h2.2l2 11.2h10L19.6 7H6.2" />
    <circle cx="9" cy="19.4" r="1.4" />
    <circle cx="17" cy="19.4" r="1.4" />
  </svg>
);

export const MenuIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const PlusIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const MinusIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M9 7V4.8h6V7M6.4 7l.8 12.2h9.6L17.6 7M10 11v5M14 11v5" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

export const ChevronLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="M14.5 5.5 8 12l6.5 6.5" />
  </svg>
);

export const ChevronDown = (p: P) => (
  <svg {...base(p)}>
    <path d="M5.5 9.5 12 16l6.5-6.5" />
  </svg>
);

export const ArrowLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
  </svg>
);

export const PinIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s6.6-6.1 6.6-11A6.6 6.6 0 0 0 5.4 10c0 4.9 6.6 11 6.6 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </svg>
);

export const TruckIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.8 6.5h10.4v9.8H2.8zM13.2 9.8h3.6l3 3v3.5h-6.6" />
    <circle cx="6.6" cy="18" r="1.6" />
    <circle cx="16.4" cy="18" r="1.6" />
  </svg>
);

export const PhoneIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6.4 3.8h3l1.4 3.6-2 1.4a10.6 10.6 0 0 0 5.4 5.4l1.4-2 3.6 1.4v3a2 2 0 0 1-2.2 2A15.8 15.8 0 0 1 4.4 6a2 2 0 0 1 2-2.2Z" />
  </svg>
);

export const BoxIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.4 20.4 8v8L12 20.6 3.6 16V8L12 3.4Z" />
    <path d="M3.6 8 12 12.6 20.4 8M12 12.6v8" />
  </svg>
);

export const GridIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="7" height="7" rx="1.4" />
    <rect x="13" y="4" width="7" height="7" rx="1.4" />
    <rect x="4" y="13" width="7" height="7" rx="1.4" />
    <rect x="13" y="13" width="7" height="7" rx="1.4" />
  </svg>
);

export const ChartIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20V4M4 20h16M8 17v-5M12.5 17V8M17 17v-7" />
  </svg>
);

export const TagIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 11.4V4.4h7l8.6 8.6-7 7L4 11.4Z" />
    <circle cx="8.2" cy="8.2" r="1.2" />
  </svg>
);

export const GearIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 3.6v2.2M12 18.2v2.2M4.8 7.8l1.9 1.1M17.3 15.1l1.9 1.1M4.8 16.2l1.9-1.1M17.3 8.9l1.9-1.1" />
  </svg>
);

export const UsersIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8.4" r="3.2" />
    <path d="M3.4 19.4a5.6 5.6 0 0 1 11.2 0M16.4 6.2a3 3 0 0 1 0 5.8M17.6 19.4a5.4 5.4 0 0 0-1.6-3.8" />
  </svg>
);

export const CardIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.2" y="5.6" width="17.6" height="12.8" rx="2" />
    <path d="M3.2 10h17.6M6.8 14.4h3.2" />
  </svg>
);

export const AlertIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4.6 21 19.4H3L12 4.6Z" />
    <path d="M12 10v4M12 16.6v.6" />
  </svg>
);

export const EditIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.6 19.4h3L19 8a2.1 2.1 0 0 0-3-3L4.6 16.4v3Z" />
  </svg>
);

export const LogoutIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M14.5 4.6H6.2v14.8h8.3M11 12h8.6m0 0-3-3m3 3-3 3" />
  </svg>
);

export const CalendarIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="5.6" width="16" height="14" rx="2" />
    <path d="M4 10h16M8.6 3.6v3.6M15.4 3.6v3.6" />
  </svg>
);

export const StarIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 4.6 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4L4.2 10.3l5.4-.8L12 4.6Z" />
  </svg>
);
