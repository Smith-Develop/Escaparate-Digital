"use client";

import Link from "next/link";
import { Apartado, Documento } from "@/components/legal/Documento";
import { CONTACTO, RESPONSABLE, UBICACION } from "@/lib/legal";

/**
 * Política de privacidad.
 *
 * Es obligatoria para publicar en Google Play y para cumplir el RGPD, pero
 * sobre todo es lo mínimo que merece alguien a quien le pides fotos de su ropa:
 * saber qué guardas, dónde, cuánto tiempo y cómo llevárselo.
 *
 * Está escrita para leerse, no para cubrirse las espaldas: frases cortas, sin
 * «en virtud de lo dispuesto» y diciendo lo que de verdad hace la app.
 */
export default function PrivacidadPage() {
  return (
    <Documento
      titulo="Privacidad"
      entradilla="Qué guarda Escaparate, dónde lo guarda y cómo te lo llevas cuando quieras."
    >
      <Apartado titulo="Quién responde de tus datos">
        <p>
          {RESPONSABLE}. Para cualquier cosa relacionada con tus datos, escribe a{" "}
          <a href={`mailto:${CONTACTO}`} className="text-accent-ink underline underline-offset-4">
            {CONTACTO}
          </a>
          .
        </p>
      </Apartado>

      <Apartado titulo="Qué se guarda">
        <p>
          <strong className="text-ink">Tu cuenta</strong>: el correo con el que entras y el nombre
          que escribes. La contraseña no se guarda: se guarda una huella con la que se comprueba,
          que no permite recuperarla.
        </p>
        <p>
          <strong className="text-ink">Tu armario</strong>: las fotos de tus prendas y lo que
          escribas de cada una —tipo, color, talla, marca, precio aproximado, fecha de compra,
          notas—, tus etiquetas propias y los conjuntos que montes.
        </p>
        <p>
          <strong className="text-ink">Tu figura, si quieres</strong>: las medidas que introduzcas
          y, si decides hacértela, una foto de cuerpo entero para que la ropa se vea sobre ti en
          vez de sobre un maniquí. Es opcional, la puedes quitar cuando quieras desde Perfil, y sin
          ella la app funciona igual.
        </p>
        <p>
          No se recoge nada más: ni tu ubicación, ni tu agenda, ni tus contactos, ni identificadores
          de publicidad. La app no lleva anuncios ni rastreadores de terceros.
        </p>
      </Apartado>

      <Apartado titulo="Dónde está y quién puede verlo">
        <p>
          Todo vive en {UBICACION}, no en servicios de terceros. Cada armario está aislado del
          resto por la propia base de datos: las fotos se sirven con enlaces firmados que caducan y
          no hay ninguna dirección pública desde la que llegar a ellas.
        </p>
        <p>
          Quien administra el servicio puede consultar cuentas y armarios para dar soporte, y esas
          consultas quedan registradas. Nadie más tiene acceso, y tus datos no se venden, ni se
          ceden, ni se usan para entrenar nada.
        </p>
      </Apartado>

      <Apartado titulo="Lo que pasa dentro de tu móvil">
        <p>
          El recorte del fondo de las prendas se hace <strong className="text-ink">en tu
          dispositivo</strong>: la foto no se manda a ningún servicio para eso. La primera vez se
          descarga el modelo que hace el recorte desde una red de distribución pública; en esa
          descarga no viaja ninguna foto ni ningún dato tuyo.
        </p>
        <p>
          Tu armario se guarda también dentro del móvil para poder verlo sin conexión. Se borra al
          cerrar sesión y al borrar la cuenta.
        </p>
      </Apartado>

      <Apartado titulo="Correos">
        <p>
          Solo se te escribe por algo que hayas pedido: recuperar la contraseña, o avisarte de un
          cambio en tu cuenta hecho por quien administra. No hay boletines ni promociones. El envío
          lo hace el proveedor de correo configurado en el servicio, que recibe tu dirección para
          poder entregarte el mensaje.
        </p>
      </Apartado>

      <Apartado titulo="Cuánto tiempo">
        <p>
          Mientras tengas la cuenta. Cuando la borras, se borra todo de inmediato: prendas, fotos,
          conjuntos, etiquetas, medidas y la cuenta misma. Del registro de administración queda
          solo la constancia de que hubo un borrado, sin tus datos dentro.
        </p>
      </Apartado>

      <Apartado titulo="Tus derechos">
        <p>
          Puedes acceder a tus datos, corregirlos y borrarlos desde la propia app. Para lo demás
          —oposición, limitación, portabilidad— escribe a{" "}
          <a href={`mailto:${CONTACTO}`} className="text-accent-ink underline underline-offset-4">
            {CONTACTO}
          </a>
          . Si crees que no se te atiende bien, puedes reclamar ante la Agencia Española de
          Protección de Datos.
        </p>
        <p>
          Para borrar la cuenta:{" "}
          <Link href="/borrar-cuenta" className="text-accent-ink underline underline-offset-4">
            cómo borrar tu cuenta
          </Link>
          .
        </p>
      </Apartado>

      <Apartado titulo="Menores">
        <p>
          Escaparate no está dirigida a menores de 14 años y no se crean cuentas a sabiendas para
          ellos.
        </p>
      </Apartado>

      <Apartado titulo="Cambios">
        <p>
          Si esto cambia, cambia la fecha de arriba. Si el cambio afecta a qué se guarda o a quién
          puede verlo, se avisa dentro de la app antes de aplicarlo.
        </p>
      </Apartado>
    </Documento>
  );
}
