import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  if (!(await getCurrentUser())) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">{children}</div>
      <MobileNav />
    </div>
  );
}
