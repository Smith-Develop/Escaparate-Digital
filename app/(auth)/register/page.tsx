"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { Titulo } from "@/components/Titulo";
import { registrar } from "@/lib/auth-cliente";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <>
      <Titulo>Crear cuenta</Titulo>
      <AuthForm
        mode="register"
        onSubmit={async (datos) => {
          const { haySesion } = await registrar(datos);
          // Si el servidor exige confirmar el correo no hay sesión todavía; lo
          // dice el propio formulario en vez de dejar la pantalla parada.
          if (haySesion) router.replace("/dashboard");
          return haySesion ? undefined : "confirmar-correo";
        }}
      />
      <p className="mt-6 text-center text-sm text-ink-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-accent underline underline-offset-4">
          Entra aquí
        </Link>
      </p>
    </>
  );
}
