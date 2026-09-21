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
        pie={
          <div className="flex flex-col gap-2">
            <p className="text-center text-sm text-ink-muted">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-accent-ink underline underline-offset-4">
                Entra aquí
              </Link>
            </p>
            {/* Consentimiento a la vista antes de crear la cuenta, no escondido
                en un enlace del pie de otra página. */}
            <p className="text-center text-[11px] leading-relaxed text-ink-faint">
              Al crear tu armario aceptas las{" "}
              <Link href="/terminos" className="underline underline-offset-4">
                condiciones
              </Link>{" "}
              y la{" "}
              <Link href="/privacidad" className="underline underline-offset-4">
                política de privacidad
              </Link>
              .
            </p>
          </div>
        }
      />
    </>
  );
}
