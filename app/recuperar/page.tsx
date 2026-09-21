"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Adornos } from "@/components/ilustraciones/Adornos";
import { Titulo } from "@/components/Titulo";
import { Input, Label } from "@/components/ui/Field";
import { APARECE } from "@/lib/animaciones";
import { hayPanel, pedirRecuperacion } from "@/lib/admin/api";
import { supabase } from "@/lib/supabase/cliente";

/**
 * Recuperar la contraseña, las dos mitades en la misma pantalla.
 *
 * Quien llega por su propio pie ve un campo de correo y pide el enlace. Quien
 * llega **desde el enlace** trae un testigo de recuperación en la dirección:
 * supabase-js lo canjea por una sesión al arrancar, y entonces esto se
 * convierte en «elige tu contraseña nueva».
 *
 * Vive fuera del grupo de pantallas de acceso a propósito: aquel marco manda al
 * armario a quien tenga sesión, y quien viene del enlace la tiene —esa es toda
 * la gracia del enlace—, así que ahí dentro esta pantalla no llegaría a verse
 * nunca.
 */
export default function RecuperarPage() {
  const router = useRouter();

  // Se lee como store externo y no como estado: la página está pregenerada, así
  // que en el HTML que llega no puede haber ningún testigo. Decidir el modo
  // durante el dibujo daría un desajuste de hidratación; así, React pinta
  // «pedir» —lo que dice el HTML— y cambia en cuanto mira el navegador.
  const enRecuperacion = useSyncExternalStore(suscribirARecuperacion, hayRecuperacion, () => false);

  // El testigo llega en el fragmento de la dirección y supabase-js lo canjea y
  // lo borra; por eso, una vez visto, se recuerda. El evento cubre el caso de
  // que el canje ocurra antes de que esta pantalla mire.
  useEffect(() => {
    const { data } = supabase().auth.onAuthStateChange((evento) => {
      if (evento === "PASSWORD_RECOVERY") marcarRecuperacion();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col overflow-hidden px-6 pb-safe pt-safe">
      <Adornos />
      <Titulo>Recuperar la contraseña</Titulo>

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="py-1">
          <Link
            href="/login"
            aria-label="Volver al acceso"
            className="edge grid size-10 place-items-center rounded-full bg-surface text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
        </div>

        {enRecuperacion ? (
          <ElegirNueva alTerminar={() => router.replace("/dashboard")} />
        ) : (
          <PedirEnlace />
        )}
      </div>
    </main>
  );
}

/* ── Pedir el enlace ───────────────────────────────────────────────────── */

function PedirEnlace() {
  const [correo, setCorreo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  /**
   * Quien manda el correo es el servicio de administración, con el proveedor
   * que haya puesto el panel; así cambiarlo no obliga a redesplegar Supabase.
   * Si esta compilación no lo tiene configurado, se pide por el camino de
   * siempre, que usa el SMTP de la instancia.
   */
  async function pedir(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      if (hayPanel) {
        await pedirRecuperacion(correo.trim().toLowerCase());
      } else {
        const { error: fallo } = await supabase().auth.resetPasswordForEmail(
          correo.trim().toLowerCase(),
          { redirectTo: `${window.location.origin}/recuperar/` },
        );
        if (fallo) throw new Error(fallo.message);
      }
      setEnviado(true);
    } catch (fallo) {
      const mensaje = fallo instanceof Error ? fallo.message : "";
      setError(
        /rate|limit|demasiados/i.test(mensaje)
          ? "Has pedido demasiados correos seguidos. Espera un poco."
          : mensaje || "No se ha podido enviar el correo. Inténtalo más tarde.",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <motion.div {...APARECE} className="edge my-auto flex flex-col gap-3 rounded-[1.75rem] bg-surface p-6">
        <h1 className="font-display text-2xl">Mira tu correo</h1>
        <p className="text-sm leading-relaxed text-ink-muted">
          Si hay una cuenta con <strong className="text-ink">{correo}</strong>, le acaba de llegar
          un enlace para elegir una contraseña nueva.
        </p>
        <p className="text-xs text-ink-faint">
          No aparece de inmediato en todos los correos; si tarda, mira en la carpeta de no deseado.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form {...APARECE} className="flex flex-1 flex-col" onSubmit={pedir}>
      <div className="pb-6 pt-6 text-center">
        <h1 className="font-display text-[2rem] uppercase leading-none tracking-[0.02em]">
          Tu contraseña
        </h1>
        <p className="mx-auto mt-3 max-w-[17rem] text-xs uppercase leading-relaxed tracking-[0.12em] text-ink-muted">
          Te mandamos un enlace para elegir otra
        </p>
      </div>

      <div className="edge flex flex-col gap-4 rounded-[1.75rem] bg-surface p-5">
        <label className="block">
          <Label>Correo</Label>
          <Input
            className="!bg-surface-2 !shadow-none"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="alex@correo.com…"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </label>
      </div>

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
          {enviando ? "Enviando…" : "Mandarme el enlace"}
        </button>
        <p className="text-center text-sm text-ink-muted">
          ¿Te acuerdas?{" "}
          <Link href="/login" className="text-accent-ink underline underline-offset-4">
            Volver a entrar
          </Link>
        </p>
      </div>
    </motion.form>
  );
}

/* ── Elegir la nueva ───────────────────────────────────────────────────── */

function ElegirNueva({ alTerminar }: { alTerminar: () => void }) {
  const [contrasena, setContrasena] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enlace, setEnlace] = useState<"canjeando" | "listo" | "caducado">("canjeando");

  // Canjear el testigo del correo por una sesión tarda un instante, y sin esa
  // sesión el cambio de contraseña no tiene a quién cambiársela. Se espera a
  // que llegue antes de dejar guardar: si no, quien escribe rápido se
  // encuentra un «falta la sesión» que no significa nada para él.
  useEffect(() => {
    let vigente = true;
    const cliente = supabase();

    void (async () => {
      const { data } = await cliente.auth.getSession();
      if (!vigente) return;
      if (data.session) {
        setEnlace("listo");
        return;
      }

      // supabase-js canjea el testigo del fragmento al crearse, pero si la
      // pantalla ya estaba abierta —el enlace abre una pestaña que ya andaba
      // por aquí— el cliente existe desde antes y nadie lo canjea. Se hace a
      // mano con lo que trae la dirección.
      const trozos = new URLSearchParams(window.location.hash.slice(1));
      const access_token = trozos.get("access_token");
      const refresh_token = trozos.get("refresh_token");
      if (!access_token || !refresh_token) return;

      const { error: fallo } = await cliente.auth.setSession({ access_token, refresh_token });
      if (vigente && !fallo) setEnlace("listo");
    })();

    const { data } = cliente.auth.onAuthStateChange((_evento, sesion) => {
      if (vigente && sesion) setEnlace("listo");
    });

    // Si en unos segundos no hay sesión, el enlace ya no vale: se ha usado, ha
    // caducado o lo ha abierto un lector de correo que se comió el fragmento.
    const reloj = setTimeout(() => {
      if (vigente) setEnlace((previo) => (previo === "canjeando" ? "caducado" : previo));
    }, 8000);

    return () => {
      vigente = false;
      clearTimeout(reloj);
      data.subscription.unsubscribe();
    };
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (enlace !== "listo") return;
    if (contrasena.length < 8) {
      setError("La contraseña necesita al menos 8 caracteres");
      return;
    }
    setGuardando(true);
    setError(null);
    const { error: fallo } = await supabase().auth.updateUser({ password: contrasena });
    setGuardando(false);
    if (fallo) {
      setError(
        /expired|invalid/i.test(fallo.message)
          ? "El enlace ha caducado. Pide otro desde la pantalla de acceso."
          : fallo.message,
      );
      return;
    }
    // La sesión del enlace ya vale como sesión normal: se entra directo.
    alTerminar();
  }

  return (
    <motion.form {...APARECE} className="flex flex-1 flex-col" onSubmit={guardar}>
      <div className="pb-6 pt-6 text-center">
        <h1 className="font-display text-[2rem] uppercase leading-none tracking-[0.02em]">
          Contraseña nueva
        </h1>
        <p className="mx-auto mt-3 max-w-[17rem] text-xs uppercase leading-relaxed tracking-[0.12em] text-ink-muted">
          Elígela y entras directo a tu armario
        </p>
      </div>

      <div className="edge flex flex-col gap-4 rounded-[1.75rem] bg-surface p-5">
        <label className="block">
          <Label>Contraseña</Label>
          <Input
            className="!bg-surface-2 !shadow-none"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres…"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-auto flex flex-col gap-3 pb-4 pt-8">
        {enlace === "caducado" && !error && (
          <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-center text-sm text-danger">
            Este enlace ya no vale: se ha usado o ha caducado.
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-center text-sm text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={guardando || enlace !== "listo"}
          className="inline-flex min-h-13 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold uppercase tracking-[0.12em] text-on-accent disabled:opacity-50"
        >
          {guardando
            ? "Guardando…"
            : enlace === "canjeando"
              ? "Comprobando el enlace…"
              : "Guardar y entrar"}
        </button>

        {enlace === "caducado" && (
          <button
            type="button"
            onClick={() => window.location.replace("/recuperar/")}
            className="text-center text-sm text-accent-ink underline underline-offset-4"
          >
            Pedir un enlace nuevo
          </button>
        )}
      </div>
    </motion.form>
  );
}

/* ── ¿Venimos del enlace del correo? ───────────────────────────────────── */

/** Una vez visto el testigo, se recuerda: supabase-js limpia el fragmento. */
let visto = false;
const oyentes = new Set<() => void>();

function hayRecuperacion() {
  if (!visto && /type=recovery/.test(window.location.hash)) visto = true;
  return visto;
}

function marcarRecuperacion() {
  visto = true;
  oyentes.forEach((avisar) => avisar());
}

function suscribirARecuperacion(avisar: () => void) {
  oyentes.add(avisar);
  window.addEventListener("hashchange", avisar);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("hashchange", avisar);
  };
}
