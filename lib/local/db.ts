"use client";

/**
 * El espejo del armario dentro del móvil.
 *
 * IndexedDB a pelo, sin biblioteca: son cuatro operaciones y añadir una
 * dependencia de 15 kB para esto no sale a cuenta.
 *
 * **Una base por cuenta.** Dos personas en el mismo teléfono —o uno mismo con
 * dos cuentas— compartirían armario y fotos si la base fuera única, y la
 * segunda vería el armario de la primera hasta la siguiente sincronización.
 */

export const ALMACENES = ["items", "looks", "tags", "sueltos", "fotos"] as const;
export type Almacen = (typeof ALMACENES)[number];

const VERSION = 1;
const nombre = (uid: string) => `escaparate-${uid}`;

const abiertas = new Map<string, Promise<IDBDatabase>>();

function abrir(uid: string): Promise<IDBDatabase> {
  const existente = abiertas.get(uid);
  if (existente) return existente;

  const promesa = new Promise<IDBDatabase>((resolve, reject) => {
    const peticion = indexedDB.open(nombre(uid), VERSION);
    peticion.onupgradeneeded = () => {
      const db = peticion.result;
      // `items`, `looks` y `tags` van por su id; `fotos`, por su ruta en el
      // almacén; `sueltos` guarda lo que es único (avatar, perfil, marcas).
      for (const almacen of ALMACENES) {
        if (!db.objectStoreNames.contains(almacen)) {
          db.createObjectStore(almacen, { keyPath: almacen === "fotos" ? "path" : "id" });
        }
      }
    };
    peticion.onsuccess = () => resolve(peticion.result);
    peticion.onerror = () => reject(peticion.error);
  });

  abiertas.set(uid, promesa);
  return promesa;
}

const transaccion = async (uid: string, almacen: Almacen, modo: IDBTransactionMode) =>
  (await abrir(uid)).transaction(almacen, modo).objectStore(almacen);

const esperar = <T>(peticion: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    peticion.onsuccess = () => resolve(peticion.result);
    peticion.onerror = () => reject(peticion.error);
  });

export async function leerTodo<T>(uid: string, almacen: Almacen): Promise<T[]> {
  return esperar((await transaccion(uid, almacen, "readonly")).getAll() as IDBRequest<T[]>);
}

export async function leerUno<T>(uid: string, almacen: Almacen, clave: string): Promise<T | undefined> {
  return esperar((await transaccion(uid, almacen, "readonly")).get(clave) as IDBRequest<T | undefined>);
}

export async function guardarUno(uid: string, almacen: Almacen, valor: unknown) {
  return esperar((await transaccion(uid, almacen, "readwrite")).put(valor) as IDBRequest<IDBValidKey>);
}

export async function borrarUno(uid: string, almacen: Almacen, clave: string) {
  return esperar((await transaccion(uid, almacen, "readwrite")).delete(clave) as IDBRequest<undefined>);
}

/** Sustituye el contenido entero de un almacén, en una sola transacción. */
export async function reemplazar(uid: string, almacen: Almacen, filas: unknown[]) {
  const db = await abrir(uid);
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(almacen, "readwrite");
    const store = tx.objectStore(almacen);
    store.clear();
    for (const fila of filas) store.put(fila);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Al cerrar sesión: que no quede nada de esa cuenta en el dispositivo. */
export async function borrarBase(uid: string) {
  const db = await abiertas.get(uid);
  db?.close();
  abiertas.delete(uid);
  await new Promise<void>((resolve) => {
    const peticion = indexedDB.deleteDatabase(nombre(uid));
    peticion.onsuccess = peticion.onerror = peticion.onblocked = () => resolve();
  });
}

/**
 * Pide que el sistema no borre el espejo cuando ande justo de disco.
 *
 * En Android suele concederse; en iOS, Safari no lo concede nunca, así que allí
 * el espejo puede desaparecer sin avisar y hay que saber rehacerlo.
 */
export async function pedirPersistencia() {
  try {
    if (!navigator.storage?.persist) return false;
    return (await navigator.storage.persisted()) || (await navigator.storage.persist());
  } catch {
    return false;
  }
}

/** Cuánto ocupa el espejo, para poder enseñarlo en el perfil. */
export async function espacioUsado() {
  try {
    const { usage = 0, quota = 0 } = (await navigator.storage?.estimate?.()) ?? {};
    return { usado: usage, disponible: quota };
  } catch {
    return { usado: 0, disponible: 0 };
  }
}
