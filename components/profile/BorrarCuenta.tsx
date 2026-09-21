"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { borrarMiCuenta } from "@/lib/admin/api";
import { salir } from "@/lib/auth-cliente";
import { useEspejo } from "@/lib/local/espejo";
import { useSesion } from "@/components/SesionProvider";

/**
 * Cerrar la cuenta.
 *
 * Google Play lo exige para cualquier app con registro, pero antes que eso es
 * lo justo: esta app guarda fotos de la ropa —y a veces del cuerpo— de quien la
 * usa, y esa persona tiene que poder retirarlas sin pedirle permiso a nadie.
 *
 * La pantalla dice **qué se borra y que no hay vuelta atrás**, y pide escribir
 * el correo entero. No es burocracia: es el único freno entre un dedo torpe y
 * un armario de doscientas fotos que no se puede recuperar. Al terminar se
 * limpia también el espejo del dispositivo, porque si no las fotos seguirían
 * aquí después de que la cuenta ya no exista.
 */
export function BorrarCuenta() {
  const router = useRouter();
  const { uid, email } = useSesion();
  const cerrarEspejo = useEspejo((s) => s.cerrar);
  const items = useEspejo((s) => s.items);
  const looks = useEspejo((s) => s.looks);

  const [abierta, setAbierta] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coincide = confirmacion.trim().toLowerCase() === (email ?? "").toLowerCase();

  async function borrar() {
    setBorrando(true);
    setError(null);
    try {
      await borrarMiCuenta(confirmacion);
      if (uid) await cerrarEspejo(uid);
      await salir();
      router.replace("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo ha fallado");
      setBorrando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className="min-h-11 w-full rounded-full text-sm text-danger"
      >
        Borrar mi cuenta
      </button>

      <Sheet
        open={abierta}
        onClose={() => !borrando && setAbierta(false)}
        title="Borrar tu cuenta"
      >
        <div className="flex flex-col gap-5">
          <p className="text-sm leading-relaxed text-ink-muted">
            Se borra <strong className="text-ink">todo</strong> y no se puede deshacer: tus{" "}
            {items.length} {items.length === 1 ? "prenda" : "prendas"} con sus fotos, tus{" "}
            {looks.length} {looks.length === 1 ? "look" : "looks"}, tus etiquetas, tus medidas, tu
            foto de cuerpo entero y la propia cuenta. No queda copia en el servidor.
          </p>

          <label className="block">
            <Label>Escribe tu correo para confirmar</Label>
            <Input
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              type="email"
              autoComplete="off"
              placeholder={email ?? "tu@correo.com"}
            />
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <Button full variant="secondary" onClick={borrar} loading={borrando} disabled={!coincide}>
            Borrar mi cuenta para siempre
          </Button>
          <Button full variant="ghost" onClick={() => setAbierta(false)} disabled={borrando}>
            Cancelar
          </Button>
        </div>
      </Sheet>
    </>
  );
}
