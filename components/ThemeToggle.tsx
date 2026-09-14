"use client";

import { useSyncExternalStore } from "react";
import {
  readPreference,
  subscribePreference,
  THEMES,
  writePreference,
  type ThemePreference,
} from "@/lib/theme";

/** Selector de apariencia: claro, oscuro o el que use el sistema. */
export function ThemeToggle() {
  // La preferencia vive en localStorage; se lee como store externo para no
  // duplicarla en un estado de React que habría que sincronizar a mano.
  const preference = useSyncExternalStore<ThemePreference>(
    subscribePreference,
    readPreference,
    () => "sistema",
  );

  return (
    <div
      role="radiogroup"
      aria-label="Apariencia"
      className="edge grid grid-cols-3 rounded-full bg-surface p-1"
    >
      {THEMES.map((theme) => {
        const active = preference === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => writePreference(theme.id)}
            className={[
              "min-h-9 rounded-full text-sm transition-colors",
              active ? "bg-accent font-medium text-on-accent" : "text-ink-muted",
            ].join(" ")}
          >
            {theme.label}
          </button>
        );
      })}
    </div>
  );
}
