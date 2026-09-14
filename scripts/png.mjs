import { deflateSync } from "node:zlib";

/* Codificador PNG mínimo (RGBA de 8 bits, sin filtros). Suficiente para
   generar las prendas de ejemplo sin depender de librerías de imagen. */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = -1;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/** @param {Uint8Array} rgba  width*height*4 */
export function encodePng(rgba, width, height) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filtro "none"
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // profundidad de bits
  ihdr[9] = 6; // color RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Lienzo muy simple: polígonos rellenos con suavizado por supermuestreo. */
export function createCanvas(size) {
  const pixels = new Uint8Array(size * size * 4);
  const shapes = [];

  return {
    /** @param {[number,number][]} points coordenadas 0..1 */
    polygon(points, color, texture) {
      shapes.push({ points: points.map(([x, y]) => [x * size, y * size]), color, texture });
    },
    /** Devuelve el PNG recortado al contenido, igual que hace la app al subir
     *  una foto: sin aire transparente alrededor de la prenda. */
    render() {
      const SS = 2; // 2x2 muestras por píxel
      for (let py = 0; py < size; py++) {
        for (let px = 0; px < size; px++) {
          let r = 0;
          let g = 0;
          let b = 0;
          let hits = 0;
          for (let sy = 0; sy < SS; sy++) {
            for (let sx = 0; sx < SS; sx++) {
              const x = px + (sx + 0.5) / SS;
              const y = py + (sy + 0.5) / SS;
              for (let i = shapes.length - 1; i >= 0; i--) {
                if (!inside(shapes[i].points, x, y)) continue;
                const [cr, cg, cb] = shade(shapes[i], x, y, size);
                r += cr;
                g += cg;
                b += cb;
                hits++;
                break;
              }
            }
          }
          const total = SS * SS;
          const o = (py * size + px) * 4;
          if (hits > 0) {
            pixels[o] = r / hits;
            pixels[o + 1] = g / hits;
            pixels[o + 2] = b / hits;
            pixels[o + 3] = Math.round((hits / total) * 255);
          }
        }
      }
      return crop(pixels, size);
    },
  };
}

/** Recorta la imagen al rectángulo que contiene píxeles opacos. */
function crop(pixels, size) {
  let minX = size;
  let minY = size;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (pixels[(y * size + x) * 4 + 3] <= 12) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return { png: encodePng(pixels, size, size), width: size, height: size };

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const out = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const from = ((y + minY) * size + minX) * 4;
    out.set(pixels.subarray(from, from + width * 4), y * width * 4);
  }
  return { png: encodePng(out, width, height), width, height };
}

function shade(shape, x, y, size) {
  const [r, g, b] = shape.color;
  if (!shape.texture) return [r, g, b];
  // Rayas o motas sutiles para que el tejido se note en el render 3D.
  const t =
    shape.texture === "rayas"
      ? Math.sin((x / size) * 60) * 0.5 + 0.5
      : ((Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1) * 0.5 + 0.5;
  const k = shape.texture === "rayas" ? 0.68 + t * 0.5 : 0.88 + t * 0.2;
  return [Math.min(255, r * k), Math.min(255, g * k), Math.min(255, b * k)];
}

function inside(points, x, y) {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
