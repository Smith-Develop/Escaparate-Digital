"use client";

import Link from "next/link";
import { Apartado, Documento } from "@/components/legal/Documento";
import { CONTACTO } from "@/lib/legal";

/**
 * Cómo borrar la cuenta.
 *
 * Google Play pide dos caminos para esto: uno dentro de la app y una dirección
 * web a la que se pueda llegar **sin instalarla**. Esta página es la segunda, y
 * por eso explica el procedimiento en vez de limitarse a un botón: quien llega
 * aquí puede no tener la app puesta.
 */
export default function BorrarCuentaPage() {
  return (
    <Documento
      titulo="Borrar tu cuenta"
      entradilla="Puedes cerrar tu cuenta cuando quieras, tú mismo y sin pedir permiso. Esto explica qué se borra y cómo."
    >
      <Apartado titulo="Desde la app, en tres pasos">
        <p>1· Abre Escaparate y entra con tu cuenta.</p>
        <p>
          2· Ve a <strong className="text-ink">Perfil</strong> y baja hasta el apartado{" "}
          <strong className="text-ink">Cuenta</strong>.
        </p>
        <p>
          3· Pulsa <strong className="text-ink">Borrar mi cuenta</strong>, escribe tu correo para
          confirmar y listo. Es inmediato.
        </p>
        <p className="pt-1">
          <Link
            href="/dashboard/profile"
            className="inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-semibold text-on-accent"
          >
            Ir a mi perfil
          </Link>
        </p>
      </Apartado>

      <Apartado titulo="Qué se borra">
        <p>
          Todo lo tuyo: las prendas con sus fotos, los conjuntos, las etiquetas que hayas creado,
          tus medidas, tu foto de cuerpo entero si la subiste, y la cuenta misma. No se guarda
          ninguna copia ni queda nada en espera de borrarse: ocurre en el momento.
        </p>
        <p>
          Del registro interno de administración queda únicamente la constancia de que una cuenta
          se borró y cuándo, sin ningún dato tuyo dentro. Es lo que permite demostrar que el
          borrado se hizo.
        </p>
        <p>
          <strong className="text-ink">No tiene vuelta atrás.</strong> Si quieres conservar alguna
          foto, guárdala en el móvil antes de borrar.
        </p>
      </Apartado>

      <Apartado titulo="Si no puedes entrar">
        <p>
          Si has perdido el acceso, prueba primero a{" "}
          <Link href="/recuperar" className="text-accent-ink underline underline-offset-4">
            recuperar tu contraseña
          </Link>
          .
        </p>
        <p>
          Si aun así no puedes, escribe desde la dirección de tu cuenta a{" "}
          <a href={`mailto:${CONTACTO}`} className="text-accent-ink underline underline-offset-4">
            {CONTACTO}
          </a>{" "}
          pidiendo el borrado. Se hace en un plazo máximo de 30 días, normalmente en el mismo día.
        </p>
      </Apartado>

      <Apartado titulo="Solo quieres dejar de usarla">
        <p>
          Cerrar sesión borra el armario descargado en ese móvil y deja la cuenta intacta: puedes
          volver cuando quieras y lo encontrarás todo. Es lo que conviene si solo cambias de
          teléfono o lo prestas.
        </p>
      </Apartado>
    </Documento>
  );
}
