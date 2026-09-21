"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Titulo } from "@/components/Titulo";
import { Foto } from "@/components/ui/Foto";
import { ApareceItem } from "@/components/ui/Aparece";
import { Chip } from "@/components/ui/Chip";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Cargando, Fallo, useCarga } from "@/components/admin/Estado";
import { borrarFoto, pedirBiblioteca, type FotoDelAlmacen } from "@/lib/admin/api";
import { fechaCorta, tamano } from "@/lib/admin/formato";

/**
 * Todas las imágenes subidas, de todo el mundo.
 *
 * Sirve para dos cosas: ver qué hay guardado —el almacén es de pago y crece
 * solo— y encontrar lo que ya no usa nadie. Una foto es **huérfana** cuando no
 * la referencia ninguna prenda ni ninguna foto de cuerpo: pasa al retocar una
 * imagen, al borrar una prenda desde un móvil sin red, o al abandonar el alta a
 * medias.
 */
export default function BibliotecaPage() {
  return (
    <Suspense fallback={<Cargando />}>
      <Biblioteca />
    </Suspense>
  );
}

function Biblioteca() {
  const parametros = useSearchParams();
  const [soloHuerfanas, setSoloHuerfanas] = useState(parametros.get("huerfanas") === "1");
  const [usuario, setUsuario] = useState("");
  const [mirando, setMirando] = useState<FotoDelAlmacen | null>(null);

  const { datos, error, cargando, recargar } = useCarga(() => pedirBiblioteca());

  const visibles = useMemo(() => {
    const fotos = datos?.fotos ?? [];
    return fotos.filter(
      (f) => (!usuario || f.usuario === usuario) && (!soloHuerfanas || f.huerfana),
    );
  }, [datos, usuario, soloHuerfanas]);

  const bytes = visibles.reduce((suma, f) => suma + f.bytes, 0);

  if (cargando) return <Cargando que="Cargando la biblioteca" />;
  if (error) return <Fallo error={error} reintentar={recargar} />;

  return (
    <>
      <Titulo>Biblioteca · Administración</Titulo>

      <div className="sticky top-0 z-10 -mx-5 bg-canvas/95 px-5 pb-3 pt-5 backdrop-blur">
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          <Chip active={!usuario} onClick={() => setUsuario("")}>
            Todos
          </Chip>
          {(datos?.usuarios ?? []).map((u) => (
            <Chip key={u.id} active={usuario === u.id} onClick={() => setUsuario(u.id)}>
              {u.nombre}
            </Chip>
          ))}
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="tabular text-xs text-ink-faint">
            {visibles.length} {visibles.length === 1 ? "imagen" : "imágenes"} · {tamano(bytes)}
          </p>
          <Chip active={soloHuerfanas} onClick={() => setSoloHuerfanas((v) => !v)}>
            Solo huérfanas
          </Chip>
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-sm text-ink-muted">
          {soloHuerfanas
            ? "No hay ninguna imagen suelta: todo lo guardado pertenece a una prenda."
            : "Aquí no hay ninguna imagen."}
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {visibles.map((foto, index) => (
            <ApareceItem key={foto.ruta} index={index}>
              <button
                type="button"
                onClick={() => setMirando(foto)}
                className="edge relative block aspect-square w-full overflow-hidden rounded-2xl bg-display p-2"
              >
                <Foto ruta={foto.url} alt={foto.usadaPor ?? "Imagen suelta"} fill className="object-contain p-1" />
                {foto.huerfana && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-pastel-rosa px-2 py-0.5 text-[9px] font-semibold text-pastel-rosa-ink">
                    Huérfana
                  </span>
                )}
              </button>
            </ApareceItem>
          ))}
        </ul>
      )}

      <DetalleFoto foto={mirando} onClose={() => setMirando(null)} alBorrar={recargar} />
    </>
  );
}

function DetalleFoto({
  foto,
  onClose,
  alBorrar,
}: {
  foto: FotoDelAlmacen | null;
  onClose: () => void;
  alBorrar: () => void;
}) {
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const borrar = async () => {
    if (!foto) return;
    setBorrando(true);
    setError(null);
    try {
      await borrarFoto(foto.ruta);
      alBorrar();
      onClose();
      setConfirmando(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo ha fallado");
    } finally {
      setBorrando(false);
    }
  };

  return (
    <Sheet open={Boolean(foto)} onClose={onClose} title={foto?.usadaPor ?? "Imagen suelta"}>
      {foto && (
        <div className="flex flex-col gap-5">
          <span className="edge block aspect-square w-full overflow-hidden rounded-2xl bg-display p-3">
            <Foto ruta={foto.url} alt="" fill className="object-contain" />
          </span>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Dato titulo="De" valor={foto.nombreDelUsuario} />
            <Dato titulo="Subida" valor={fechaCorta(foto.creada)} />
            <Dato titulo="Tamaño" valor={tamano(foto.bytes)} />
            <Dato titulo="Tipo" valor={foto.tipo || "—"} />
            <div className="col-span-2 min-w-0">
              <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">En uso por</dt>
              <dd className="truncate">{foto.usadaPor ?? "Nadie: no pertenece a ninguna prenda"}</dd>
            </div>
          </dl>

          <Link
            href={`/admin/usuario?id=${foto.usuario}`}
            className="text-sm text-accent-ink underline underline-offset-4"
          >
            Ver la cuenta de {foto.nombreDelUsuario}
          </Link>

          {error && (
            <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          {foto.borrable ? (
            confirmando ? (
              <>
                <p className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm text-pastel-rosa-ink">
                  Se borra del almacén para siempre. No la usa ninguna prenda, así que nadie verá
                  un hueco, pero no hay forma de recuperarla.
                </p>
                <Button full variant="secondary" onClick={borrar} loading={borrando}>
                  Sí, borrarla
                </Button>
                <Button full variant="ghost" onClick={() => setConfirmando(false)} disabled={borrando}>
                  Mejor no
                </Button>
              </>
            ) : (
              <Button full variant="secondary" onClick={() => setConfirmando(true)}>
                Borrar esta imagen
              </Button>
            )
          ) : (
            <p className="text-xs leading-relaxed text-ink-faint">
              {foto.huerfana
                ? "Se subió hace menos de un día: puede ser una prenda a medio catalogar, así que todavía no se ofrece borrarla."
                : "Está en uso: para que desaparezca, su dueño tiene que borrar la prenda desde la app."}
            </p>
          )}
        </div>
      )}
    </Sheet>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{titulo}</dt>
      <dd className="truncate">{valor}</dd>
    </div>
  );
}
