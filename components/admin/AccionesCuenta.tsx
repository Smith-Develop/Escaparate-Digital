"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { Chip } from "@/components/ui/Chip";
import {
  cambiarCorreo,
  cambiarSuspension,
  mandarRecuperacion,
  ponerContrasenaTemporal,
  type Duracion,
  type Ficha,
} from "@/lib/admin/api";
import { cuantoFalta, fechaCorta } from "@/lib/admin/formato";

/**
 * Las tres cosas que el panel puede cambiarle a una cuenta.
 *
 * Todas pasan por una hoja con su confirmación, y ninguna es silenciosa: son
 * cambios que la persona del otro lado va a notar sin haberlos pedido, así que
 * la pantalla dice exactamente qué va a ocurrir antes de que ocurra y qué ha
 * ocurrido después.
 */
export function AccionesCuenta({ ficha, alCambiar }: { ficha: Ficha; alCambiar: () => void }) {
  const [abierta, setAbierta] = useState<"correo" | "contrasena" | "suspension" | null>(null);

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        <Accion onClick={() => setAbierta("correo")}>Cambiar correo</Accion>
        <Accion onClick={() => setAbierta("contrasena")}>Restablecer contraseña</Accion>
        <Accion onClick={() => setAbierta("suspension")}>
          {ficha.suspendidoHasta ? "Levantar suspensión" : "Suspender"}
        </Accion>
      </div>

      <HojaCorreo
        ficha={ficha}
        open={abierta === "correo"}
        onClose={() => setAbierta(null)}
        alCambiar={alCambiar}
      />
      <HojaContrasena ficha={ficha} open={abierta === "contrasena"} onClose={() => setAbierta(null)} />
      <HojaSuspension
        ficha={ficha}
        open={abierta === "suspension"}
        onClose={() => setAbierta(null)}
        alCambiar={alCambiar}
      />
    </>
  );
}

function Accion({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="edge min-h-10 rounded-full bg-surface px-4 text-sm text-ink"
    >
      {children}
    </button>
  );
}

/** Mensaje de error de una hoja, siempre en el mismo sitio y con el mismo tono. */
function Error({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return (
    <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
      {texto}
    </p>
  );
}

/* ── Correo ────────────────────────────────────────────────────────────── */

function HojaCorreo({
  ficha,
  open,
  onClose,
  alCambiar,
}: {
  ficha: Ficha;
  open: boolean;
  onClose: () => void;
  alCambiar: () => void;
}) {
  const [correo, setCorreo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<string | null>(null);

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      const { correo: ahora } = await cambiarCorreo(ficha.id, correo);
      setHecho(ahora);
      alCambiar();
    } catch (e) {
      setError(e instanceof globalThis.Error ? e.message : "Algo ha fallado");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Cambiar el correo">
      <div className="flex flex-col gap-5">
        <p className="text-sm leading-relaxed text-ink-muted">
          La cuenta pasará a entrar con el correo nuevo, ya confirmado y sin tener que abrir
          ningún enlace. La contraseña no cambia.
        </p>

        <div>
          <Label>Correo actual</Label>
          <p className="truncate text-sm text-ink">{ficha.correo}</p>
        </div>

        <label className="block">
          <Label>Correo nuevo</Label>
          <Input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="nombre@dominio.com"
            autoComplete="off"
          />
        </label>

        <Error texto={error} />

        {hecho ? (
          <>
            <p className="rounded-xl bg-pastel-menta px-4 py-3 text-sm text-pastel-menta-ink">
              Hecho. La cuenta entra ahora con {hecho}. Avísale: nadie le ha dicho que ha cambiado.
            </p>
            <Button full variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </>
        ) : (
          <>
            <Button
              full
              onClick={guardar}
              loading={guardando}
              disabled={!correo.includes("@") || correo.trim().toLowerCase() === ficha.correo}
            >
              Cambiar el correo
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

/* ── Contraseña ────────────────────────────────────────────────────────── */

function HojaContrasena({
  ficha,
  open,
  onClose,
}: {
  ficha: Ficha;
  open: boolean;
  onClose: () => void;
}) {
  const [trabajando, setTrabajando] = useState<"temporal" | "correo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [temporal, setTemporal] = useState<string | null>(null);
  const [enviado, setEnviado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const hacer = async (modo: "temporal" | "correo") => {
    setTrabajando(modo);
    setError(null);
    try {
      if (modo === "temporal") setTemporal((await ponerContrasenaTemporal(ficha.id)).contrasena);
      else setEnviado((await mandarRecuperacion(ficha.id)).enviado);
    } catch (e) {
      setError(e instanceof globalThis.Error ? e.message : "Algo ha fallado");
    } finally {
      setTrabajando(null);
    }
  };

  const copiar = async () => {
    if (!temporal) return;
    try {
      await navigator.clipboard.writeText(temporal);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      // Sin permiso de portapapeles queda a la vista para copiarla a mano.
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Restablecer la contraseña">
      <div className="flex flex-col gap-5">
        {temporal ? (
          <>
            <p className="text-sm leading-relaxed text-ink-muted">
              Esta es la contraseña de {ficha.nombre}. <strong>Se enseña una sola vez</strong>: no
              queda guardada en ningún sitio, tampoco en el registro de administración.
            </p>
            <p className="edge select-all rounded-2xl bg-surface-2 px-4 py-4 text-center font-display text-2xl tracking-wide">
              {temporal}
            </p>
            <Button full onClick={copiar}>
              {copiado ? "Copiada ✓" : "Copiar"}
            </Button>
            <Button full variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </>
        ) : enviado ? (
          <>
            <p className="rounded-xl bg-pastel-menta px-4 py-3 text-sm text-pastel-menta-ink">
              Correo enviado a {enviado}. El enlace la lleva a elegir una contraseña nueva.
            </p>
            <Button full variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-ink-muted">
              Dos caminos. El correo es el normal y tú no llegas a ver ninguna contraseña; la
              temporal sirve cuando el correo no llega —o no existe— y se la tienes que dictar.
            </p>

            <Error texto={error} />

            <Button full onClick={() => hacer("correo")} loading={trabajando === "correo"}>
              Mandarle el correo de recuperación
            </Button>
            <Button
              full
              variant="secondary"
              onClick={() => hacer("temporal")}
              loading={trabajando === "temporal"}
            >
              Ponerle una contraseña temporal
            </Button>
            <Button full variant="ghost" onClick={onClose} disabled={Boolean(trabajando)}>
              Cancelar
            </Button>
          </>
        )}
      </div>
    </Sheet>
  );
}

/* ── Suspensión ────────────────────────────────────────────────────────── */

const DURACIONES: { id: Duracion; label: string }[] = [
  { id: "24h", label: "24 horas" },
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
];

function HojaSuspension({
  ficha,
  open,
  onClose,
  alCambiar,
}: {
  ficha: Ficha;
  open: boolean;
  onClose: () => void;
  alCambiar: () => void;
}) {
  const [duracion, setDuracion] = useState<Duracion>("24h");
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<string | null | undefined>(undefined);

  const aplicar = async (valor: Duracion) => {
    setTrabajando(true);
    setError(null);
    try {
      const { suspendidoHasta } = await cambiarSuspension(ficha.id, valor);
      setHecho(suspendidoHasta);
      alCambiar();
    } catch (e) {
      setError(e instanceof globalThis.Error ? e.message : "Algo ha fallado");
    } finally {
      setTrabajando(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Suspensión de la cuenta">
      <div className="flex flex-col gap-5">
        {hecho !== undefined ? (
          <>
            <p className="rounded-xl bg-pastel-menta px-4 py-3 text-sm text-pastel-menta-ink">
              {hecho
                ? `Suspendida hasta el ${fechaCorta(hecho)}.`
                : "Suspensión levantada: ya puede volver a entrar."}
            </p>
            <Button full variant="ghost" onClick={onClose}>
              Cerrar
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-ink-muted">
              Mientras esté suspendida, la cuenta no puede iniciar sesión. Sus prendas, sus looks y
              sus fotos se quedan donde están: esto no borra nada.
            </p>
            <p className="text-xs leading-relaxed text-ink-faint">
              Si ahora mismo la tiene abierta en su móvil, seguirá dentro hasta que caduque su
              sesión, que es como mucho una hora. A partir de ahí, no vuelve a entrar.
            </p>

            {ficha.suspendidoHasta ? (
              <>
                <p className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm text-pastel-rosa-ink">
                  Suspendida hasta el {fechaCorta(ficha.suspendidoHasta)} · quedan{" "}
                  {cuantoFalta(ficha.suspendidoHasta)}
                </p>
                <Error texto={error} />
                <Button full onClick={() => aplicar("ninguna")} loading={trabajando}>
                  Levantar la suspensión
                </Button>
              </>
            ) : (
              <>
                <div>
                  <Label>Durante</Label>
                  <div className="flex flex-wrap gap-2">
                    {DURACIONES.map((d) => (
                      <Chip key={d.id} active={duracion === d.id} onClick={() => setDuracion(d.id)}>
                        {d.label}
                      </Chip>
                    ))}
                  </div>
                </div>
                <Error texto={error} />
                <Button full onClick={() => aplicar(duracion)} loading={trabajando}>
                  Suspender la cuenta
                </Button>
              </>
            )}

            <Button full variant="ghost" onClick={onClose} disabled={trabajando}>
              Cancelar
            </Button>
          </>
        )}
      </div>
    </Sheet>
  );
}
