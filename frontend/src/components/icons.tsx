import type { SVGProps } from "react";

/**
 * Set mínimo de íconos de línea (24x24, stroke=currentColor) usado en toda
 * la app en vez de emojis, para un look consistente y propio.
 */

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function MailIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m14.5 5-7 7 7 7" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m9.5 5 7 7-7 7" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="m5 9 7 7 7-7" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  );
}

export function BoxIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </svg>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="3" width="14" height="18" rx="1.2" />
      <path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h6" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8.5" r="3.3" />
      <path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" />
    </svg>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M14 3.5V8h4M9 12.5h6M9 15.5h6" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 5 6v5.5c0 4.7 3.1 8.2 7 9.5 3.9-1.3 7-4.8 7-9.5V6l-7-2.5Z" />
      <path d="m9.3 12.2 1.9 1.9 3.5-3.9" />
    </svg>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M14 7V5.5A1.5 1.5 0 0 0 12.5 4h-6A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20h6a1.5 1.5 0 0 0 1.5-1.5V17" />
      <path d="M10 12h10m0 0-3-3m3 3-3 3" />
    </svg>
  );
}

export function TagIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3.5 11.5 12 3h6a3 3 0 0 1 3 3v6l-8.5 8.5a2 2 0 0 1-2.8 0l-6.2-6.2a2 2 0 0 1 0-2.8Z" />
      <path d="M16.5 8h.01" />
    </svg>
  );
}

export function ImageOffIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="m3.5 16 4.5-4.5a2 2 0 0 1 2.8 0l3.2 3.2M14.5 12l1-1a2 2 0 0 1 2.8 0l2.2 2.2" />
      <circle cx="8.3" cy="8.8" r="1.4" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <path d="M12 10v4.2M12 17.2h.01" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.3 2.4 2.4 4.6-5.4" />
    </svg>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 4h3l1.4 4.2-2 1.5a10 10 0 0 0 4.9 4.9l1.5-2L19.5 14v3a1.5 1.5 0 0 1-1.6 1.5A15 15 0 0 1 5 6.1 1.5 1.5 0 0 1 6.5 4Z" />
    </svg>
  );
}

export function ExpandIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5V9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M4 15v3.5A1.5 1.5 0 0 0 5.5 20H9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8.5" r="2.8" />
      <path d="M3.5 19c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2" />
      <path d="M15.3 6.2a2.8 2.8 0 0 1 0 5.4M18 19c0-2.4-1.6-4.4-3.8-5" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 10a8 8 0 0 1 14.5-4.5M20 14a8 8 0 0 1-14.5 4.5" />
      <path d="M18.5 3v3.5H15M5.5 21v-3.5H9" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="9" width="11" height="11" rx="1.8" />
      <path d="M6 15H5.5A1.5 1.5 0 0 1 4 13.5v-8A1.5 1.5 0 0 1 5.5 4h8A1.5 1.5 0 0 1 15 5.5V6" />
    </svg>
  );
}
