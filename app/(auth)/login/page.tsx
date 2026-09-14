import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { loginAction } from "../actions";

export const metadata = { title: "Entrar · Escaparate" };

export default function LoginPage() {
  return (
    <>
      <AuthForm mode="login" action={loginAction} />
      <p className="mt-6 text-center text-sm text-ink-muted">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/register" className="text-accent underline-offset-4 hover:underline">
          Crear una
        </Link>
      </p>
    </>
  );
}
