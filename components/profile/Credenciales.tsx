"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { useSesion } from "@/components/SesionProvider";
import { supabase } from "@/lib/supabase/cliente";

/**
 * Cambiar la contraseña y el correo desde dentro.
 *
 * Hasta ahora la única forma de cambiar la contraseña era el enlace del correo,
 * y el correo solo lo podía cambiar quien administra. Las dos cosas son de uno
 * mismo y tienen que poder hacerse sin pedirle nada a nadie.
 *
 * El correo **no cambia al instante**: GoTrue manda un aviso a la dirección
 * nueva y hasta que no se pulsa ese enlace se sigue entrando con la antigua.
 * Eso es deliberado —si no, un despiste tecleando dejaría la cuenta
 * inaccesible— y la pantalla lo dice en vez de fingir que ya está hecho.
 */
export function Credenciales() {
  const { email } = useSesion();
  const [abierta, setAbierta] = useState<"contrasena" | "correo" | null>(null);

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setAbierta("contrasena")}
          className="edge min-h-11 w-full rounded-full bg-surface text-sm text-ink"
        >
          Cambiar mi contraseña
        </button>
        <button
          type="button"
          onClick={() => setAbierta("correo")}
          className="edge min-h-11 w-full rounded-full bg-surface text-sm text-ink"
        >
          Cambiar mi correo
        </button>
      </div>

      <HojaContrasena open={abierta === "contrasena"} onClose={() => setAbierta(null)} />
      <HojaCorreo
        open={abierta === "correo"}
        actual={email ?? ""}
        onClose={() => setAbierta(null)}
      />
    </>
  );
}

function Aviso({ tono, children }: { tono: "bien" | "mal"; children: React.ReactNode }) {
  return (
    <p
      role={tono === "mal" ? "alert" : "status"}
      className={[
        "rounded-xl px-4 py-3 text-sm",
        tono === "bien" ? "bg-pastel-menta text-pastel-menta-ink" : "bg-danger/10 text-danger",
      ].join(" ")}
    >
      {children}
    </p>
  );
}

function HojaContrasena({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [contrasena, setContrasena] = useState("");
  const [repetida, setRepetida] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);

  const valida = contrasena.length >= 8 && contrasena === repetida;

  async function guardar() {
    setGuardando(true);
    setError(null);
    const { error: fallo } = await supabase().auth.updateUser({ password: contrasena });
    setGuardando(false);
    if (fallo) {
      setError(
        /same.*password|should be different/i.test(fallo.message)
          ? "Esa es la contraseña que ya tenías"
          : fallo.message,
      );
      return;
    }
    setContrasena("");
    setRepetida("");
    setHecho(true);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Cambiar tu contraseña">
      <div className="flex flex-col gap-5">
        {hecho ? (
          <>
            <Aviso tono="bien">
              Cambiada. La sesión de este dispositivo sigue abierta; en los demás habrá que entrar
              con la nueva.
            </Aviso>
            <Button full variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-ink-muted">
              No hace falta la anterior: estás dentro, y eso ya demuestra que la cuenta es tuya.
            </p>

            <label className="block">
              <Label>Contraseña nueva</Label>
              <Input
                type="password"
                autoComplete="new-password"
                minLength={8}
                placeholder="Mínimo 8 caracteres…"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
              />
            </label>

            <label className="block">
              <Label>Repítela</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={repetida}
                onChange={(e) => setRepetida(e.target.value)}
              />
            </label>

            {repetida.length > 0 && contrasena !== repetida && (
              <p className="text-xs text-ink-faint">Las dos no coinciden todavía.</p>
            )}
            {error && <Aviso tono="mal">{error}</Aviso>}

            <Button full onClick={guardar} loading={guardando} disabled={!valida}>
              Guardar la contraseña
            </Button>
            <Button full variant="ghost" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
          </>
        )}
      </div>
    </Sheet>
  );
}

function HojaCorreo({
  open,
  actual,
  onClose,
}: {
  open: boolean;
  actual: string;
  onClose: () => void;
}) {
  const [correo, setCorreo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pedido, setPedido] = useState<string | null>(null);

  async function guardar() {
    setGuardando(true);
    setError(null);
    const limpio = correo.trim().toLowerCase();
    const { error: fallo } = await supabase().auth.updateUser({ email: limpio });
    setGuardando(false);
    if (fallo) {
      setError(
        /already|registered|exists/i.test(fallo.message)
          ? "Ya hay una cuenta con ese correo"
          : /sending|smtp|mailer/i.test(fallo.message)
            ? "No se ha podido enviar el aviso al correo nuevo. Avisa a quien administra."
            : fallo.message,
      );
      return;
    }
    setPedido(limpio);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Cambiar tu correo">
      <div className="flex flex-col gap-5">
        {pedido ? (
          <>
            <Aviso tono="bien">
              Hemos enviado un enlace a {pedido}. Ábrelo desde ese buzón para terminar el cambio.
            </Aviso>
            <p className="text-xs leading-relaxed text-ink-faint">
              Hasta entonces sigues entrando con {actual}. Si el enlace no llega, revisa el correo
              no deseado o pídeselo a quien administra.
            </p>
            <Button full variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </>
        ) : (
          <>
            <div>
              <Label>Correo actual</Label>
              <p className="truncate text-sm text-ink">{actual}</p>
            </div>

            <label className="block">
              <Label>Correo nuevo</Label>
              <Input
                type="email"
                inputMode="email"
                autoComplete="off"
                placeholder="nombre@dominio.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </label>

            <p className="text-xs leading-relaxed text-ink-faint">
              Recibirás un enlace en la dirección nueva para confirmarla. El cambio no se aplica
              hasta que lo pulses.
            </p>

            {error && <Aviso tono="mal">{error}</Aviso>}

            <Button
              full
              onClick={guardar}
              loading={guardando}
              disabled={!correo.includes("@") || correo.trim().toLowerCase() === actual}
            >
              Enviar el enlace
            </Button>
            <Button full variant="ghost" onClick={onClose} disabled={guardando}>
              Cancelar
            </Button>
          </>
        )}
      </div>
    </Sheet>
  );
}
