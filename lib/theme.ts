/** Preferencia de apariencia del usuario. */
export type ThemePreference = "sistema" | "claro" | "oscuro";

export const THEME_KEY = "escaparate-tema";
export const THEMES: { id: ThemePreference; label: string }[] = [
  { id: "claro", label: "Claro" },
  { id: "oscuro", label: "Oscuro" },
  { id: "sistema", label: "Sistema" },
];

/** Traduce la preferencia al tema que se pinta realmente. */
export function resolveTheme(preference: ThemePreference): "claro" | "oscuro" {
  if (preference !== "sistema") return preference;
  const prefersLight =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: light)").matches;
  return prefersLight ? "claro" : "oscuro";
}

/** Aplica el tema al documento y sincroniza el color de la barra del navegador. */
export function applyTheme(preference: ThemePreference) {
  const resolved = resolveTheme(preference);
  document.documentElement.dataset.theme = resolved;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const canvas = getComputedStyle(document.documentElement)
      .getPropertyValue("--canvas")
      .trim();
    if (canvas) meta.setAttribute("content", canvas);
  }
}

/* ── Suscripción ───────────────────────────────────────────────────────────
   La preferencia vive en localStorage, fuera de React. Se expone como un store
   externo para que los componentes la lean con useSyncExternalStore en vez de
   copiarla a un estado dentro de un efecto.                                 */

const listeners = new Set<() => void>();

export function subscribePreference(onChange: () => void) {
  listeners.add(onChange);
  // Otra pestaña de la app puede cambiar la preferencia.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function writePreference(preference: ThemePreference) {
  try {
    localStorage.setItem(THEME_KEY, preference);
  } catch {
    // Sin almacenamiento la elección solo dura esta sesión.
  }
  applyTheme(preference);
  listeners.forEach((listener) => listener());
}

export function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "claro" || stored === "oscuro" || stored === "sistema") return stored;
  } catch {
    // Modo privado o almacenamiento bloqueado: se usa la preferencia del sistema.
  }
  return "sistema";
}

/**
 * Script que se ejecuta antes de pintar nada.
 *
 * Sin él, la página se dibujaría con el tema por defecto y cambiaría de golpe
 * al hidratarse React: el clásico destello blanco al abrir la app de noche.
 */
export const THEME_BOOTSTRAP = `(function(){try{
var p=localStorage.getItem('${THEME_KEY}')||'sistema';
var r=p==='sistema'?(matchMedia('(prefers-color-scheme: light)').matches?'claro':'oscuro'):p;
document.documentElement.dataset.theme=r;
}catch(e){document.documentElement.dataset.theme='oscuro';}})();`;
