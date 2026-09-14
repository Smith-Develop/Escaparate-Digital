"use client";

/** Utilidades de imagen que se ejecutan en el navegador: reescalado previo,
 *  recorte de fondo y extracción del color dominante de la prenda. */

const MAX_EDGE = 1280;

/** Reduce la foto antes de procesarla: las cámaras de móvil dan 12 MP y el
 *  modelo de recorte no gana nada con tanto detalle, pero sí tarda mucho más. */
export async function downscale(file: Blob, maxEdge = MAX_EDGE): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  if (scale === 1) {
    bitmap.close();
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise<Blob>((resolve) =>
    canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.9),
  );
}

export type Progress = (percent: number, label: string) => void;

/**
 * Recorta el fondo de la prenda. El modelo (unos 40 MB) se descarga del CDN de
 * IMG.LY la primera vez y queda en la caché del navegador. Si falla —sin red,
 * CDN bloqueado, dispositivo sin memoria— devolvemos la foto original para no
 * bloquear el catálogo; el usuario siempre puede repetirlo más tarde.
 */
export async function removeBackgroundSafe(
  file: Blob,
  onProgress?: Progress,
): Promise<{ blob: Blob; removed: boolean }> {
  try {
    const { removeBackground } = await import("@imgly/background-removal");
    const blob = await removeBackground(file, {
      // fp16 pesa la mitad que el modelo completo: mejor para datos móviles.
      model: "isnet_fp16",
      output: { format: "image/png" },
      progress: (key, current, total) => {
        const percent = total > 0 ? Math.round((current / total) * 100) : 0;
        onProgress?.(percent, key.startsWith("fetch") ? "Descargando modelo" : "Recortando prenda");
      },
    });
    return { blob, removed: true };
  } catch (error) {
    console.warn("No se pudo recortar el fondo:", error);
    return { blob: file, removed: false };
  }
}

/**
 * Color medio de los píxeles opacos: es el color con el que se pinta la prenda
 * en la ficha y los filtros del armario, así que ignoramos el fondo y los píxeles
 * casi negros de las sombras, que ensuciarían la media.
 */
export async function dominantColor(blob: Blob): Promise<string> {
  try {
    const bitmap = await createImageBitmap(blob);
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0, size, size);
    bitmap.close();

    const { data } = ctx.getImageData(0, 0, size, size);
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 200) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    if (count === 0) return "#B9B4AC";

    const hex = (v: number) =>
      Math.round(v / count)
        .toString(16)
        .padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  } catch {
    return "#B9B4AC";
  }
}

/**
 * Recorta el margen transparente que deja el borrado de fondo.
 *
 * Importa más de lo que parece: el probador coloca la prenda ocupando una zona
 * concreta del cuerpo, y si la imagen lleva medio centímetro de aire alrededor,
 * la camisa se dibuja flotando y más pequeña de lo que debería. Recortando al
 * contenido, el ancho de la imagen es el ancho real de la prenda.
 */
export async function trimTransparent(blob: Blob): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        if (data[(y * canvas.width + x) * 4 + 3] <= 12) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    // Imagen sin transparencia (el recorte de fondo falló): se deja tal cual.
    if (maxX < 0 || (minX === 0 && minY === 0 && maxX === canvas.width - 1)) return blob;

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    out.getContext("2d")!.drawImage(canvas, minX, minY, width, height, 0, 0, width, height);

    return await new Promise<Blob>((resolve) =>
      out.toBlob((result) => resolve(result ?? blob), "image/png"),
    );
  } catch {
    return blob;
  }
}

/** Dimensiones de la imagen: la silueta las necesita para colocar la prenda
 *  sin deformarla. */
export async function imageSize(blob: Blob): Promise<{ width: number; height: number }> {
  try {
    const bitmap = await createImageBitmap(blob);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: 0, height: 0 };
  }
}

export function blobToFile(blob: Blob, name: string) {
  return new File([blob], name, { type: blob.type || "image/png" });
}
