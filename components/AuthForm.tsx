"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Input, Label } from "@/components/ui/Field";

export type DatosAcceso = { name: string; email: string; password: string };

type Props = {
  mode: "login" | "register";
  /**
   * Devuelve "confirmar-correo" si la cuenta se ha creado pero falta pulsar el
   * enlace que llega por correo.
   */
  onSubmit: (datos: DatosAcceso) => Promise<string | undefined | void>;
  /** Lo que va debajo del botón: el enlace a la otra pantalla de acceso. */
  pie?: React.ReactNode;
};

/**
 * Entrar y registrarse.
 *
 * Antes esto iba con una server action y `useActionState`. Ya no hay servidor:
 * el formulario llama a Supabase Auth desde el propio dispositivo, así que el
 * estado de envío y el error se llevan a mano, que además permite conservar lo
 * escrito cuando algo falla.
 */
export function AuthForm({ mode, onSubmit, pie }: Props) {
  const isRegister = mode === "register";
  const [datos, setDatos] = useState<DatosAcceso>({ name: "", email: "", password: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);

  const set = <K extends keyof DatosAcceso>(clave: K, valor: string) =>
    setDatos((d) => ({ ...d, [clave]: valor }));

  if (confirmar) {
    return (
      <div className="edge my-auto flex flex-col gap-3 rounded-[1.75rem] bg-surface p-6">
        <h1 className="font-display text-2xl">Revisa tu correo</h1>
        <p className="text-sm leading-relaxed text-ink-muted">
          Te hemos enviado un enlace a <strong className="text-ink">{datos.email}</strong>. Púlsalo
          para confirmar la cuenta y luego vuelve aquí para entrar.
        </p>
        <p className="text-xs text-ink-faint">
          Si no aparece en unos minutos, mira en la carpeta de correo no deseado.
        </p>
      </div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-1 flex-col"
      onSubmit={async (e) => {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        try {
          const resultado = await onSubmit(datos);
          if (resultado === "confirmar-correo") setConfirmar(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Algo ha fallado");
        } finally {
          setEnviando(false);
        }
      }}
    >
      <div className="pb-6 pt-6 text-center">
        <h1 className="font-display text-[2rem] uppercase leading-none tracking-[0.02em]">
          {isRegister ? "Crea tu cuenta" : "Bienvenido"}
        </h1>
        <p className="mx-auto mt-3 max-w-[17rem] text-xs uppercase leading-relaxed tracking-[0.12em] text-ink-muted">
          {isRegister
            ? "Empieza a digitalizar tu armario en un minuto"
            : "Entra y sigue combinando donde lo dejaste"}
        </p>
      </div>

      <div className="edge flex flex-col gap-4 rounded-[1.75rem] bg-surface p-5">

      {isRegister && (
        <label className="block">
          <Label>Nombre</Label>
          <Input
            className="!bg-surface-2 !shadow-none"
            name="name"
            autoComplete="name"
            required
            placeholder="Alex…"
            value={datos.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </label>
      )}

      <label className="block">
        <Label>Correo</Label>
        <Input
          className="!bg-surface-2 !shadow-none"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="alex@correo.com…"
          value={datos.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </label>

      <label className="block">
        <Label>Contraseña</Label>
        <Input
          className="!bg-surface-2 !shadow-none"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres…"
          value={datos.password}
          onChange={(e) => set("password", e.target.value)}
        />
      </label>

      </div>

      {/* Anclada abajo, como en la portada: es la única acción de la pantalla. */}
      <div className="mt-auto flex flex-col gap-3 pb-4 pt-8">
        {error && (
          <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-center text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="inline-flex min-h-13 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold uppercase tracking-[0.12em] text-on-accent disabled:opacity-50"
        >
          {enviando ? "Un momento…" : isRegister ? "Crear mi armario" : "Iniciar sesión"}
        </button>
        {pie}
      </div>
    </motion.form>
  );
}
