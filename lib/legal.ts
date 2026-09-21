/**
 * Los datos que aparecen en las páginas legales.
 *
 * Viven aquí y no dentro de cada página porque se repiten en las tres y porque
 * son lo primero que hay que revisar antes de publicar: un aviso de privacidad
 * con un correo de contacto equivocado no sirve de nada.
 *
 * No están en los ajustes del panel a propósito: estas páginas tienen que poder
 * leerse **sin cuenta**, y los ajustes solo los lee quien tiene sesión.
 */

/** Quién responde de los datos. Nombre o razón social de quien publica la app. */
export const RESPONSABLE = "Jhon Smith";

/** A dónde escribe quien quiera ejercer sus derechos o preguntar algo. */
export const CONTACTO = "developers.smith@gmail.com";

/** Dónde están físicamente los datos. Es el país del servidor, no el tuyo. */
export const UBICACION = "un servidor propio alojado en la Unión Europea";

/** Última revisión de los textos. Se actualiza al cambiarlos. */
export const ACTUALIZADO = "21 de septiembre de 2026";
