// Recorte automatico de imagenes de producto: las fotos del catalogo traen
// cantidades de espacio en blanco muy distintas alrededor del producto
// (algunas lo llenan, otras lo dejan chico en una esquina), lo que se ve
// inconsistente en el grid aunque se muestren completas con object-contain.
//
// Este modulo analiza los pixeles de la imagen (via canvas) para detectar
// el bounding box del "contenido" (lo que no es fondo), y genera un
// recorte centrado en ese contenido, escalado para que siempre ocupe la
// misma proporcion del cuadro final -- asi todas las fotos se ven a la
// misma "escala visual" sin importar el encuadre original.
//
// Importante: el recorte NO se fuerza a ser cuadrado. Muchas fotos de
// telefono son verticales (el producto ocupa casi toda la altura de una
// imagen mas alta que ancha); forzar un cuadrado limitado al lado mas
// corto cortaria el producto. En vez de eso, se recorta respetando el
// aspecto del contenido detectado (con relleno independiente por eje) y
// se deja que el contenedor lo encuadre con object-contain -- el recorte
// solo elimina el exceso de fondo, nunca el producto en si.
//
// Si el host de la imagen no habilita CORS, el canvas queda "tainted" y
// falla al leer los pixeles: en ese caso se descarta (throw) y el llamador
// debe seguir usando la imagen original tal cual (ver ProductImage.tsx).

const OUTPUT_SIZE = 480;
const ANALYSIS_SIZE = 160;
const CONTENT_THRESHOLD = 18; // distancia de color minima para contar como "contenido"
const TARGET_FILL = 0.72; // fraccion del cuadro final que debe ocupar el contenido detectado, por eje
const BBOX_MARGIN = 0.1; // margen de seguridad alrededor del bbox detectado (evita cortar el producto)

const cropCache = new Map<string, string>();
const failedSrcs = new Set<string>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen para analisis: ${src}`));
    img.src = src;
  });
}

function colorDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

/**
 * Devuelve una data URL PNG con el producto recortado/centrado de forma
 * consistente (el lienzo de salida conserva el aspecto del recorte, no es
 * necesariamente cuadrado). Lanza si la imagen no carga o si el canvas
 * queda inhabilitado por CORS -- el llamador debe capturar el error y usar
 * la imagen original sin recorte.
 */
export async function getAutoCroppedSquare(src: string): Promise<string> {
  const cached = cropCache.get(src);
  if (cached) return cached;
  if (failedSrcs.has(src)) throw new Error("Recorte previamente fallido para esta imagen");

  try {
    const img = await loadImage(src);
    const dataUrl = cropToContent(img);
    cropCache.set(src, dataUrl);
    return dataUrl;
  } catch (err) {
    failedSrcs.add(src);
    throw err;
  }
}

function detectContentBBox(img: HTMLImageElement) {
  // Analizar a baja resolucion para encontrar el bounding box del
  // contenido (rapido, no depende del tamano real de la foto).
  const scale = Math.min(1, ANALYSIS_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
  const aw = Math.max(1, Math.round(img.naturalWidth * scale));
  const ah = Math.max(1, Math.round(img.naturalHeight * scale));

  const analysisCanvas = document.createElement("canvas");
  analysisCanvas.width = aw;
  analysisCanvas.height = ah;
  const actx = analysisCanvas.getContext("2d", { willReadFrequently: true });
  if (!actx) throw new Error("Canvas 2D no disponible");
  actx.drawImage(img, 0, 0, aw, ah);

  const { data } = actx.getImageData(0, 0, aw, ah); // puede lanzar SecurityError si hay CORS

  // Color de fondo: promedio de todo el perimetro exterior de la imagen
  // (no solo las 4 esquinas), para no confundirse con fondos en degrade o
  // con sombras cerca de una esquina puntual.
  let br = 0;
  let bg = 0;
  let bb = 0;
  let perimeterCount = 0;
  const addSample = (x: number, y: number) => {
    const i = (y * aw + x) * 4;
    br += data[i];
    bg += data[i + 1];
    bb += data[i + 2];
    perimeterCount++;
  };
  for (let x = 0; x < aw; x++) {
    addSample(x, 0);
    addSample(x, ah - 1);
  }
  for (let y = 0; y < ah; y++) {
    addSample(0, y);
    addSample(aw - 1, y);
  }
  const background: [number, number, number] = [
    br / perimeterCount,
    bg / perimeterCount,
    bb / perimeterCount,
  ];

  let minX = aw;
  let minY = ah;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < ah; y++) {
    for (let x = 0; x < aw; x++) {
      const i = (y * aw + x) * 4;
      const alpha = data[i + 3];
      if (alpha < 10) continue; // transparente cuenta como fondo
      const pixel: [number, number, number] = [data[i], data[i + 1], data[i + 2]];
      if (colorDistance(pixel, background) > CONTENT_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Sin contenido detectable (imagen plana/analisis inconcluso): usar la
  // imagen completa tal cual, sin zoom.
  if (maxX < 0 || maxY < 0) {
    minX = 0;
    minY = 0;
    maxX = aw - 1;
    maxY = ah - 1;
  }

  // Expandir el bbox detectado con un margen de seguridad -- el analisis a
  // baja resolucion puede subestimar los bordes reales del producto
  // (antialiasing, sombras suaves), y preferimos dejar algo de aire de mas
  // antes que cortar el producto.
  const bboxWidthPx = maxX - minX;
  const bboxHeightPx = maxY - minY;
  minX = clamp(minX - bboxWidthPx * BBOX_MARGIN, 0, aw - 1);
  maxX = clamp(maxX + bboxWidthPx * BBOX_MARGIN, 0, aw - 1);
  minY = clamp(minY - bboxHeightPx * BBOX_MARGIN, 0, ah - 1);
  maxY = clamp(maxY + bboxHeightPx * BBOX_MARGIN, 0, ah - 1);

  // Mapear el bounding box (en espacio de analisis) a coordenadas
  // naturales de la imagen original.
  const nx0 = minX / aw;
  const ny0 = minY / ah;
  const nx1 = (maxX + 1) / aw;
  const ny1 = (maxY + 1) / ah;

  return {
    width: Math.max((nx1 - nx0) * img.naturalWidth, 1),
    height: Math.max((ny1 - ny0) * img.naturalHeight, 1),
    centerX: ((nx0 + nx1) / 2) * img.naturalWidth,
    centerY: ((ny0 + ny1) / 2) * img.naturalHeight,
  };
}

function cropToContent(img: HTMLImageElement): string {
  const bbox = detectContentBBox(img);

  // Relleno independiente por eje para alcanzar TARGET_FILL, sin forzar
  // un recorte cuadrado -- asi nunca hace falta comprimir un producto
  // alto y angosto dentro de un cuadro mas corto que el, que es lo que lo
  // cortaria. cropW/cropH siempre son >= bbox.width/height (por
  // construccion: bbox.width/TARGET_FILL >= bbox.width ya que
  // TARGET_FILL < 1, y bbox.width <= naturalWidth por definicion), asi que
  // el area recortada contiene siempre el bbox completo, con cualquier
  // clamp de posicion que se aplique despues.
  const cropW = Math.min(bbox.width / TARGET_FILL, img.naturalWidth);
  const cropH = Math.min(bbox.height / TARGET_FILL, img.naturalHeight);

  const sx = clamp(bbox.centerX - cropW / 2, 0, img.naturalWidth - cropW);
  const sy = clamp(bbox.centerY - cropH / 2, 0, img.naturalHeight - cropH);

  // Lienzo de salida con el mismo aspecto que el recorte (acotado a
  // OUTPUT_SIZE en su lado mas largo) -- object-contain en la tarjeta se
  // encarga de encuadrarlo dentro del cuadro cuadrado de la UI.
  const aspect = cropW / cropH;
  const outW = aspect >= 1 ? OUTPUT_SIZE : Math.max(1, Math.round(OUTPUT_SIZE * aspect));
  const outH = aspect >= 1 ? Math.max(1, Math.round(OUTPUT_SIZE / aspect)) : OUTPUT_SIZE;

  const outCanvas = document.createElement("canvas");
  outCanvas.width = outW;
  outCanvas.height = outH;
  const octx = outCanvas.getContext("2d");
  if (!octx) throw new Error("Canvas 2D no disponible");
  octx.imageSmoothingQuality = "high";
  octx.drawImage(img, sx, sy, cropW, cropH, 0, 0, outW, outH);

  return outCanvas.toDataURL("image/png"); // puede lanzar SecurityError si hay CORS
}
