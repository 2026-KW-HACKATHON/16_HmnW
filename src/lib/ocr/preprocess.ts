async function decodeImage(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    const url = URL.createObjectURL(file);
    const image = new Image();
    try {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () =>
          reject(Object.assign(new Error('image-decode-failed'), { code: 'image-decode-failed' }));
        image.src = url;
      });
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function sourceDimensions(source: CanvasImageSource) {
  const dimensions = source as {
    width?: number;
    height?: number;
    displayWidth?: number;
    displayHeight?: number;
  };
  const width =
    source instanceof HTMLVideoElement
      ? source.videoWidth
      : source instanceof HTMLImageElement
        ? source.naturalWidth
        : dimensions.width || dimensions.displayWidth || 0;
  const height =
    source instanceof HTMLVideoElement
      ? source.videoHeight
      : source instanceof HTMLImageElement
        ? source.naturalHeight
        : dimensions.height || dimensions.displayHeight || 0;
  return { width, height };
}

function grayscale(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.data.length; i += 4) {
    const g = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
    data.data[i] = data.data[i + 1] = data.data[i + 2] = g;
  }
  ctx.putImageData(data, 0, 0);
}

function toBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (v) =>
        v
          ? resolve(v)
          : reject(new Error('이미지를 변환하지 못했어요. 다른 사진을 선택해 주세요.')),
      'image/jpeg',
      0.85,
    ),
  );
}

export async function preprocessCanvasSource(source: CanvasImageSource, maxLongSide = 1600) {
  const { width, height } = sourceDimensions(source);
  const scale = Math.min(1, maxLongSide / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  grayscale(ctx, canvas);
  return toBlob(canvas);
}

export interface BrightBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface BrightBoxOptions {
  thresholdLum?: number;
  rowFrac?: number;
  colFrac?: number;
  margin?: number;
}

/**
 * 밝은 배경(예: 청바지 위 학생증 카드) 영역을 행/열 단위 밝은 픽셀 수로 찾아 바운딩 박스를 돌려준다.
 * 박스 면적이 전체의 15% 미만이거나 찾지 못하면 null(크롭하지 않음).
 */
export function brightBox(
  lum: Uint8Array | number[],
  W: number,
  H: number,
  options: BrightBoxOptions = {},
): BrightBox | null {
  const { thresholdLum = 175, rowFrac = 0.25, colFrac = 0.15, margin = 8 } = options;
  const rowCounts = new Array<number>(H).fill(0);
  const colCounts = new Array<number>(W).fill(0);
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      if (lum[y * W + x] > thresholdLum) {
        rowCounts[y] += 1;
        colCounts[x] += 1;
      }
    }
  }
  const rowThreshold = W * rowFrac;
  const colThreshold = H * colFrac;
  let top = -1;
  let bottom = -1;
  let left = -1;
  let right = -1;
  for (let y = 0; y < H; y += 1) {
    if (rowCounts[y] > rowThreshold) {
      if (top === -1) top = y;
      bottom = y;
    }
  }
  for (let x = 0; x < W; x += 1) {
    if (colCounts[x] > colThreshold) {
      if (left === -1) left = x;
      right = x;
    }
  }
  if (top === -1 || left === -1) return null;
  const x = Math.max(0, left - margin);
  const y = Math.max(0, top - margin);
  const w = Math.min(W, right + margin + 1) - x;
  const h = Math.min(H, bottom + margin + 1) - y;
  if (w * h < W * H * 0.15) return null;
  return { x, y, w, h };
}

function luminance(data: Uint8ClampedArray) {
  const lum = new Uint8Array(data.length / 4);
  for (let i = 0; i < lum.length; i += 1) {
    const o = i * 4;
    lum[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
  }
  return lum;
}

export interface PreprocessImageOptions {
  crop?: 'bright' | 'none';
  maxEdge?: number;
}

export async function preprocessImage(file: Blob, options: PreprocessImageOptions = {}) {
  const { crop = 'none', maxEdge = 1400 } = options;
  const image = await decodeImage(file);
  try {
    if (crop !== 'bright') return await preprocessCanvasSource(image);

    const { width, height } = sourceDimensions(image);
    const detectScale = Math.min(1, 1600 / Math.max(width, height));
    const detect = document.createElement('canvas');
    detect.width = Math.round(width * detectScale);
    detect.height = Math.round(height * detectScale);
    const detectCtx = detect.getContext('2d')!;
    detectCtx.drawImage(image, 0, 0, detect.width, detect.height);
    const lum = luminance(detectCtx.getImageData(0, 0, detect.width, detect.height).data);
    const box = brightBox(lum, detect.width, detect.height);

    if (!box) {
      // 크롭 실패: 이미 그려 둔 전체 이미지를 그대로 사용한다
      grayscale(detectCtx, detect);
      return toBlob(detect);
    }

    const origScale = Math.max(width, height) / Math.max(detect.width, detect.height);
    const origBox = {
      x: box.x * origScale,
      y: box.y * origScale,
      w: box.w * origScale,
      h: box.h * origScale,
    };
    const outScale = maxEdge / Math.max(origBox.w, origBox.h);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(origBox.w * outScale);
    canvas.height = Math.round(origBox.h * outScale);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      origBox.x,
      origBox.y,
      origBox.w,
      origBox.h,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    grayscale(ctx, canvas);
    return toBlob(canvas);
  } finally {
    if ('close' in image) image.close();
  }
}
