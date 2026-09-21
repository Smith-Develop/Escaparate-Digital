"use client";

import { useState } from "react";
import { Titulo } from "@/components/Titulo";
import { Aparece } from "@/components/ui/Aparece";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { Cargando, Fallo, useCarga } from "@/components/admin/Estado";
import {
  guardarApoyo,
  guardarCorreo,
  pedirAjustes,
  probarCorreo,
  type Apoyo,
  type CorreoAjustes,
} from "@/lib/admin/api";

/**
 * Lo que se puede cambiar sin volver a desplegar.
 *
 * Dos cosas que antes vivían en variables de Coolify y obligaban a redesplegar
 * la instancia entera para cambiarlas: a dónde manda el bloque de apoyo y por
 * qué servidor salen los correos. Las dos cambian con el tiempo —hoy Ko-fi,
 * mañana otra cosa; hoy un proveedor de correo, mañana otro— y ninguna merece
 * un despliegue.
 */
export default function AjustesPage() {
  const { datos, error, cargando, recargar } = useCarga(pedirAjustes);

  if (cargando) return <Cargando que="Cargando los ajustes" />;
  if (error) return <Fallo error={error} reintentar={recargar} />;
  if (!datos) return null;

  return (
    <>
      <Titulo>Ajustes · Administración</Titulo>
      <div className="flex flex-col gap-4 pt-5">
        <TarjetaApoyo inicial={datos.apoyo} />
        <TarjetaCorreo inicial={datos.correo} />
      </div>
    </>
  );
}

/** Aviso de resultado, el mismo en las dos tarjetas. */
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

function Tarjeta({
  titulo,
  explicacion,
  children,
  index,
}: {
  titulo: string;
  explicacion: string;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <Aparece index={index} className="edge rounded-[1.5rem] bg-surface p-5">
      <h2 className="font-display text-xl leading-tight">{titulo}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{explicacion}</p>
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </Aparece>
  );
}

/* ── Apoyo ─────────────────────────────────────────────────────────────── */

function TarjetaApoyo({ inicial }: { inicial: Apoyo }) {
  const [apoyo, setApoyo] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState(false);

  const campo = <K extends keyof Apoyo>(clave: K, valor: Apoyo[K]) => {
    setApoyo((a) => ({ ...a, [clave]: valor }));
    setHecho(false);
  };

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      const { apoyo: guardado } = await guardarApoyo(apoyo);
      setApoyo(guardado);
      setHecho(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo ha fallado");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Tarjeta
      index={0}
      titulo="Bloque de apoyo"
      explicacion="Aparece al final del perfil de cada usuario. Sirve para pedir una donación sin meter publicidad en la app: enciéndelo, escribe el texto y pon el enlace a donde cobres."
    >
      <label className="flex items-center justify-between gap-3">
        <span className="text-sm">Enseñarlo en el perfil</span>
        <input
          type="checkbox"
          checked={apoyo.activo}
          onChange={(e) => campo("activo", e.target.checked)}
          className="edge relative h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-surface-2
                     transition-colors checked:bg-accent
                     before:absolute before:left-0.5 before:top-0.5 before:size-5 before:rounded-full
                     before:bg-ink before:transition-transform checked:before:translate-x-5
                     checked:before:bg-on-accent"
        />
      </label>

      <label className="block">
        <Label>Título</Label>
        <Input
          value={apoyo.titulo}
          onChange={(e) => campo("titulo", e.target.value)}
          maxLength={60}
          placeholder="Apoyar Escaparate"
        />
      </label>

      <label className="block">
        <Label>Texto</Label>
        <textarea
          value={apoyo.texto}
          onChange={(e) => campo("texto", e.target.value)}
          maxLength={400}
          rows={3}
          placeholder="Escaparate no tiene anuncios ni vende tus datos…"
          className="edge w-full rounded-2xl bg-surface px-4 py-3 text-sm leading-relaxed text-ink outline-none"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <Label>Texto del botón</Label>
          <Input
            value={apoyo.boton}
            onChange={(e) => campo("boton", e.target.value)}
            maxLength={30}
            placeholder="Invitar a un café"
          />
        </label>
        <label className="block">
          <Label>Enlace</Label>
          <Input
            value={apoyo.enlace}
            onChange={(e) => campo("enlace", e.target.value)}
            type="url"
            inputMode="url"
            placeholder="https://ko-fi.com/…"
          />
        </label>
      </div>

      {error && <Aviso tono="mal">{error}</Aviso>}
      {hecho && (
        <Aviso tono="bien">
          Guardado. {apoyo.activo ? "Ya se ve en el perfil de todos." : "Está apagado: no se ve."}
        </Aviso>
      )}

      <Button full onClick={guardar} loading={guardando}>
        Guardar el bloque
      </Button>
    </Tarjeta>
  );
}

/* ── Correo ────────────────────────────────────────────────────────────── */

function TarjetaCorreo({ inicial }: { inicial: CorreoAjustes }) {
  const [correo, setCorreo] = useState(inicial);
  const [contrasena, setContrasena] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [probando, setProbando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hecho, setHecho] = useState<string | null>(null);

  const campo = <K extends keyof CorreoAjustes>(clave: K, valor: CorreoAjustes[K]) => {
    setCorreo((c) => ({ ...c, [clave]: valor }));
    setHecho(null);
  };

  async function guardar() {
    setGuardando(true);
    setError(null);
    setHecho(null);
    try {
      const { correo: guardado } = await guardarCorreo({ ...correo, contrasena });
      setCorreo(guardado);
      setContrasena("");
      setHecho("Guardado. Prueba el envío para asegurarte de que el servidor lo acepta.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo ha fallado");
    } finally {
      setGuardando(false);
    }
  }

  async function probar() {
    setProbando(true);
    setError(null);
    setHecho(null);
    try {
      const { enviado } = await probarCorreo();
      setHecho(`Enviado a ${enviado}. Si no llega en un par de minutos, mira en no deseado.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo ha fallado");
    } finally {
      setProbando(false);
    }
  }

  return (
    <Tarjeta
      index={1}
      titulo="Correo"
      explicacion="Por aquí salen los correos de «he olvidado mi contraseña» y los que mandas tú desde la ficha de un usuario. Cambiar de proveedor es cambiar estos campos: no hay que tocar Coolify ni redesplegar nada."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <Label>Servidor</Label>
          <Input
            value={correo.host}
            onChange={(e) => campo("host", e.target.value)}
            placeholder="smtp.proveedor.com"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <Label>Puerto</Label>
          <Input
            value={String(correo.puerto)}
            onChange={(e) => campo("puerto", Number(e.target.value) || 0)}
            inputMode="numeric"
            placeholder="587"
          />
        </label>
      </div>

      <label className="flex items-center justify-between gap-3">
        <span className="min-w-0 text-sm">
          Conexión cifrada desde el principio
          <span className="mt-0.5 block text-xs text-ink-faint">
            Enciéndelo solo con el puerto 465. En el 587 y el 25 se cifra después, con STARTTLS.
          </span>
        </span>
        <input
          type="checkbox"
          checked={correo.seguro}
          onChange={(e) => campo("seguro", e.target.checked)}
          className="edge relative h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-surface-2
                     transition-colors checked:bg-accent
                     before:absolute before:left-0.5 before:top-0.5 before:size-5 before:rounded-full
                     before:bg-ink before:transition-transform checked:before:translate-x-5
                     checked:before:bg-on-accent"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <Label>Usuario</Label>
          <Input
            value={correo.usuario}
            onChange={(e) => campo("usuario", e.target.value)}
            placeholder="apikey, o tu correo"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <Label>Contraseña</Label>
          <Input
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            type="password"
            autoComplete="new-password"
            placeholder={correo.hayContrasena ? "•••••••• (guardada)" : "La del proveedor"}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <Label>Remitente</Label>
          <Input
            value={correo.remitente}
            onChange={(e) => campo("remitente", e.target.value)}
            type="email"
            placeholder="hola@tu-dominio.com"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <Label>Nombre del remitente</Label>
          <Input
            value={correo.nombre}
            onChange={(e) => campo("nombre", e.target.value)}
            maxLength={60}
            placeholder="Escaparate"
          />
        </label>
      </div>

      {/* La contraseña guardada no se puede leer desde aquí, y es a propósito. */}
      <p className="text-xs leading-relaxed text-ink-faint">
        {correo.hayContrasena
          ? "Hay una contraseña guardada. Déjala en blanco para conservarla; escribe una nueva solo si la cambias."
          : "Todavía no hay contraseña guardada."}{" "}
        El panel nunca la vuelve a enseñar: si la pierdes, se pone otra.
      </p>

      {error && <Aviso tono="mal">{error}</Aviso>}
      {hecho && <Aviso tono="bien">{hecho}</Aviso>}

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Button full onClick={guardar} loading={guardando}>
          Guardar
        </Button>
        <Button
          full
          variant="secondary"
          onClick={probar}
          loading={probando}
          disabled={!correo.configurado}
        >
          Mandarme un correo de prueba
        </Button>
      </div>
    </Tarjeta>
  );
}
