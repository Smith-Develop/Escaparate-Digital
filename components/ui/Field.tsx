import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

// El canto es una sombra en vez de un borde, y el foco lo pinta la regla
// global de :focus-visible: quitar el contorno sin sustituirlo dejaba a quien
// navega con teclado sin saber dónde está.
const base =
  "edge w-full rounded-xl bg-surface px-4 py-3 text-ink placeholder:text-ink-faint " +
  "transition-shadow";

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-xs uppercase tracking-[0.14em] text-ink-faint">
      {children}
    </span>
  );
}

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${base} ${className}`} {...rest} />;
}

export function Textarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${base} min-h-24 resize-y ${className}`} {...rest} />;
}

export function Select({ className = "", ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${base} appearance-none ${className}`} {...rest} />;
}
