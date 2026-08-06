// Convierte HSL a hex. Se usa tanto para el color "de firma" por nombre
// como para normalizar el color medio sacado de un logo, así todos los
// colores de casa acaban con una saturación/luminosidad legible como
// etiqueta (ni apagados ni demasiado oscuros/claros).
function hslAHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const canal = (n) => Math.round(255 * f(n)).toString(16).padStart(2, "0");
  return `#${canal(0)}${canal(8)}${canal(4)}`;
}

function rgbAHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return h;
}

// Color determinista a partir del nombre (mismo nombre = siempre el mismo
// color): hash simple del texto convertido en un tono de la rueda de color.
export function colorDesdeNombre(nombre) {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) {
    hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  }
  const tono = Math.abs(hash) % 360;
  return hslAHex(tono, 55, 42);
}

// Lee el logo (imagen en base64) y calcula su color medio, ignorando
// píxeles casi transparentes o casi blancos/negros (el fondo típico de un
// logo), para quedarse solo con el color que de verdad lo identifica.
export function extraerColorDominante(logoBase64) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const tam = 32;
        const lienzo = document.createElement("canvas");
        lienzo.width = tam;
        lienzo.height = tam;
        const ctx = lienzo.getContext("2d");
        ctx.drawImage(img, 0, 0, tam, tam);
        const { data } = ctx.getImageData(0, 0, tam, tam);

        let sumaR = 0;
        let sumaG = 0;
        let sumaB = 0;
        let contados = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 128) continue;
          const brillo = (r + g + b) / 3;
          if (brillo < 25 || brillo > 235) continue;
          sumaR += r;
          sumaG += g;
          sumaB += b;
          contados++;
        }

        if (contados === 0) {
          resolve(null);
          return;
        }

        const tono = rgbAHsl(sumaR / contados, sumaG / contados, sumaB / contados);
        resolve(hslAHex(tono, 55, 42));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = logoBase64;
  });
}
