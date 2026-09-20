"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const TABS = [
  { href: "/dashboard", label: "Inicio", icon: HomeIcon },
  { href: "/dashboard/closet", label: "Armario", icon: HangerIcon },
  { href: "/dashboard/studio", label: "Estudio", icon: AvatarIcon },
  { href: "/dashboard/looks", label: "Looks", icon: CalendarIcon },
  { href: "/dashboard/profile", label: "Perfil", icon: UserIcon },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    // `shrink-0` y nada de `sticky`: la barra es el último hijo de una columna de
    // altura fija, así que está abajo por construcción. Con `sticky bottom-0`
    // dependía de que la página tuviera scroll, y en las que no lo tienen
    // —estudio, o perfil en una pantalla alta— se quedaba flotando a media
    // altura, allí donde terminara el contenido.
    //
    // No ocupa todo el ancho ni lleva borde: es una pastilla blanca que flota
    // sobre el fondo de salvia, como el resto de las superficies del diseño.
    <nav className="z-30 shrink-0 px-4 pb-safe pt-1">
      <ul className="edge mx-auto flex max-w-lg rounded-[1.75rem] bg-surface px-1 py-1">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center gap-1 rounded-[1.5rem] px-1 pb-1.5 pt-2"
              >
                {/* El punto sobre el icono es la marca de «estás aquí» del
                    diseño; se mueve de una pestaña a otra en vez de aparecer
                    y desaparecer. */}
                {active && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute top-0.5 size-1.5 rounded-full bg-ink"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon className={active ? "text-ink" : "text-ink-faint"} />
                <span
                  className={`text-[10px] ${active ? "font-medium text-ink" : "text-ink-faint"}`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type IconProps = { className?: string };
const svg = (className?: string) => ({
  className: `size-5 ${className ?? ""}`,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

function HomeIcon({ className }: IconProps) {
  return (
    <svg {...svg(className)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
    </svg>
  );
}

function HangerIcon({ className }: IconProps) {
  return (
    <svg {...svg(className)}>
      <path d="M12 7a2.5 2.5 0 1 1 2.5-2.5" />
      <path d="M12 7v2.2L3.8 15.6a1.2 1.2 0 0 0 .7 2.2h15a1.2 1.2 0 0 0 .7-2.2L12 9.2" />
    </svg>
  );
}

function AvatarIcon({ className }: IconProps) {
  return (
    <svg {...svg(className)}>
      <circle cx="12" cy="4.8" r="2.3" />
      <path d="M12 7.1v6.4M8 9.5 12 8l4 1.5M9.8 13.5 8.6 21M14.2 13.5 15.4 21" />
    </svg>
  );
}

function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...svg(className)}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
    </svg>
  );
}

function UserIcon({ className }: IconProps) {
  return (
    <svg {...svg(className)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}
