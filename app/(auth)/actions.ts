"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";

/** React 19 vacía los formularios no controlados al terminar una server action,
 *  así que devolvemos lo ya escrito para que el usuario no tenga que repetirlo
 *  cuando el envío falla. */
export type AuthState = { error?: string; values?: { name?: string; email?: string } };

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const values = { name, email };
  if (name.length < 2) return { error: "Escribe tu nombre", values };
  if (!EMAIL.test(email)) return { error: "El correo no tiene un formato válido", values };
  if (password.length < 8) {
    return { error: "La contraseña necesita al menos 8 caracteres", values };
  }

  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "Ya existe una cuenta con ese correo", values };
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      // Las medidas se crean con valores por defecto para que el maniquí de
      // referencia exista desde el primer momento; se ajustan en el perfil.
      avatar: { create: {} },
    },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  // Mismo mensaje para usuario inexistente y contraseña incorrecta: así no se
  // puede averiguar qué correos están registrados.
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Correo o contraseña incorrectos", values: { email } };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
