"use client";

import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Titulo } from "@/components/Titulo";
import { AccountCard } from "@/components/profile/AccountCard";
import { BodyPhoto } from "@/components/profile/BodyPhoto";
import { MeasuresSection } from "@/components/profile/MeasuresSection";
import { CerrarSesion } from "@/components/profile/CerrarSesion";
import { BorrarCuenta } from "@/components/profile/BorrarCuenta";
import { Credenciales } from "@/components/profile/Credenciales";
import { EntradaPanel } from "@/components/profile/EntradaPanel";
import { BloqueApoyo } from "@/components/profile/BloqueApoyo";
import { DescargarApp } from "@/components/profile/DescargarApp";
import { Espacio } from "@/components/profile/Espacio";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Aparece, ApareceSeccion } from "@/components/ui/Aparece";
import { Stat } from "@/components/ui/Stat";
import { centimosRedondeados } from "@/lib/dinero";
import { useEspejo } from "@/lib/local/espejo";
import { useSesion } from "@/components/SesionProvider";

/**
 * Perfil: la cuenta, la foto con la que se viste y las medidas del maniquí.
 *
 * Ordenado por lo que se toca a menudo: arriba quién eres y el resumen del
 * armario; en medio la foto, que es lo que cambia la cara del probador; y abajo
 * las medidas y los ajustes, que se tocan una vez y se olvidan.
 */
export default function ProfilePage() {
  const { email } = useSesion();
  const items = useEspejo((s) => s.items);
  const looks = useEspejo((s) => s.looks);
  const avatar = useEspejo((s) => s.avatar);
  const perfil = useEspejo((s) => s.perfil);

  const invertido = items.reduce((suma, i) => suma + (i.priceCents ?? 0), 0);

  return (
    <>
      <Titulo>Perfil</Titulo>
      <Header title="Perfil" />

      <div className="flex flex-col gap-8 pb-24">
        <Aparece index={0}>
        <AccountCard
          name={perfil?.name ?? "…"}
          email={email ?? ""}
          photoUrl={avatar?.photoUrl ?? null}
          since={(perfil?.createdAt ?? new Date()).toLocaleDateString("es-ES", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          })}
        />
        </Aparece>

        <Aparece index={1} className="grid grid-cols-3 gap-3 px-5">
          <Stat value={items.length} label="Prendas" href="/dashboard/closet" />
          <Stat value={looks.length} label="Looks" href="/dashboard/looks" />
          <Stat
            value={centimosRedondeados(invertido)}
            label="Invertido"
            href="/dashboard"
          />
        </Aparece>

        {avatar && (
          <Aparece index={2}>
            <BodyPhoto avatar={avatar} />
          </Aparece>
        )}
        {avatar && (
          <Aparece index={3}>
            <MeasuresSection avatar={avatar} />
          </Aparece>
        )}

        <ApareceSeccion index={4} className="px-5">
          <h2 className="mb-2 text-xs uppercase tracking-[0.14em] text-ink-faint">Apariencia</h2>
          <ThemeToggle />
        </ApareceSeccion>

        <ApareceSeccion index={5} className="px-5">
          <h2 className="mb-2 text-xs uppercase tracking-[0.14em] text-ink-faint">
            En este dispositivo
          </h2>
          <Espacio />
        </ApareceSeccion>

        {/* Solo en la web y solo si está encendido desde el panel. */}
        <DescargarApp />

        <ApareceSeccion index={6} className="px-5">
          <h2 className="mb-2 text-xs uppercase tracking-[0.14em] text-ink-faint">Cuenta</h2>
          <div className="flex flex-col gap-2">
            <Credenciales />
            <CerrarSesion />
            <BorrarCuenta />
          </div>
          <p className="mt-3 text-center text-[11px] text-ink-faint">
            <Link href="/privacidad" className="underline underline-offset-4">
              Privacidad
            </Link>
            {" · "}
            <Link href="/terminos" className="underline underline-offset-4">
              Condiciones
            </Link>
          </p>
        </ApareceSeccion>

        {/* Solo aparece si el servicio dice que esta cuenta administra. */}
        <EntradaPanel />

        {/* Y esto, solo si está encendido desde el panel. */}
        <BloqueApoyo />
      </div>
    </>
  );
}
