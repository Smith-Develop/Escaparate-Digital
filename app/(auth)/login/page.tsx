"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { Titulo } from "@/components/Titulo";
import { entrar } from "@/lib/auth-cliente";

export default function LoginPage() {
  const router = useRouter();

  return (
    <>
      <Titulo>Entrar</Titulo>
      <AuthForm
        mode="login"
        onSubmit={async (datos) => {
          await entrar({ email: datos.email, password: datos.password });
          router.replace("/dashboard");
        }}
        pie={
          <p className="text-center text-sm text-ink-muted">
            ¿Aún no tienes armario?{" "}
            <Link
              href="/register"
              className="text-accent-ink underline underline-offset-4"
            >
              Crea tu cuenta
            </Link>
          </p>
        }
      />
    </>
  );
}
