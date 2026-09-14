import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { registerAction } from "../actions";

export const metadata = { title: "Crear cuenta · Escaparate" };

export default function RegisterPage() {
  return (
    <>
      <AuthForm mode="register" action={registerAction} />
      <p className="mt-6 text-center text-sm text-ink-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-accent underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </>
  );
}
