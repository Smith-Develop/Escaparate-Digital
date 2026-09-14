"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-on-accent font-semibold hover:bg-accent/90",
  secondary: "edge bg-surface-2 text-ink hover:bg-line",
  ghost: "text-ink-muted hover:text-ink",
  danger: "bg-danger/15 text-danger border border-danger/30",
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
        // 44px de alto: el mínimo cómodo para el pulgar en móvil.
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm",
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
