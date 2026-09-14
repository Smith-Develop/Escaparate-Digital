import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col justify-center px-6 pb-safe pt-safe">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/" className="mb-10 block text-center">
          <span className="font-display text-3xl tracking-tight">Escaparate</span>
          <span className="mt-2 block text-xs uppercase tracking-[0.3em] text-ink-faint">
            Armario virtual
          </span>
        </Link>
        {children}
      </div>
    </main>
  );
}
