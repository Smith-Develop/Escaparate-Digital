"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  // El ámbar con texto oscuro es la acción principal en todo el diseño; el
  // blanco flotando, la secundaria. Con este dorado, el texto blanco no llega
  // al contraste necesario, y por eso `--on-accent` es casi negro.
  primary: "bg-accent text-on-accent font-semibold hover:brightness-[0.97]",
  secondary: "edge bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink-muted hover:text-ink",
  danger: "bg-danger/12 text-danger",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  full?: boolean;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", full, loading, className = "", children, disabled, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      disabled={disabled || loading}
      className={[
        // 48px de alto: el mínimo cómodo para el pulgar, y el porte que piden
        // los botones redondos del diseño.
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm",
        "transition-colors disabled:opacity-50 disabled:pointer-events-none",
        VARIANTS[variant],
        full ? "w-full" : "",
        className,
      ].join(" ")}
      {...(rest as React.ComponentProps<typeof motion.button>)}
    >
      {loading && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </motion.button>
  );
});
