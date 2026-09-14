"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import type { AuthState } from "@/app/(auth)/actions";

type Props = {
  mode: "login" | "register";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
};

export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});
  const isRegister = mode === "register";

  return (
    <motion.form
      action={formAction}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6"
    >
      <h1 className="font-display text-2xl">{isRegister ? "Crea tu cuenta" : "Bienvenido"}</h1>

      {isRegister && (
        <label className="block">
          <Label>Nombre</Label>
          <Input
          name="name"
          autoComplete="name"
          required
          placeholder="Alex…"
          defaultValue={state.values?.name}
        />
        </label>
      )}

      <label className="block">
        <Label>Correo</Label>
        <Input
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="alex@correo.com…"
          defaultValue={state.values?.email}
        />
      </label>

      <label className="block">
        <Label>Contraseña</Label>
        <Input
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={8}
          placeholder="Mínimo 8 caracteres…"
        />
      </label>

      {state.error && (
        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}

      <Button type="submit" full loading={pending}>
        {isRegister ? "Empezar" : "Entrar"}
      </Button>
    </motion.form>
  );
}
