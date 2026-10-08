import type { Bbox, Page } from 'tesseract.js';
import { preprocessImage } from './preprocess';
import { recognizeImageWithBlocks } from './worker';

export interface OcrWordBox {
  text: string;
  bbox: Bbox;
}

export interface OrientationScoreInput {
  rotation: 0 | 90 | 180 | 270;
  width: number;
  height: number;
  text: string;
}

interface RecognizedOrientation extends OrientationScoreInput {
  image: Blob;
  ocrWidth: number;
  ocrHeight: number;
  words: OcrWordBox[];
}

export interface PreparedStudentCard {
  geminiImage: Blob;
  orientedImage: Blob;
  sparseText: string;
  rotation: OrientationScoreInput['rotation'];
  maskedCardNumber: boolean;
}

export function scoreOrientationText(text: string) {
  const compact = text.replace(/[\s-]/g, '');
  const studentNo = /(?:^|\D)\d{10}(?:\D|$)/.test(compact) ? 3 : 0;
  const school = /광운|Kwang/i.test(text) ? 2 : 0;
  const koreanCount = (text.match(/[가-힣]/g) || []).length;
  return studentNo + school + Math.min(2, koreanCount / 50);
}

export function selectBestOrientation<T extends OrientationScoreInput>(candidates: T[]): T {
  if (candidates.length === 0) throw new Error('orientation-candidates-empty');
  return candidates.reduce((best, candidate) => {
    const scoreDifference = scoreOrientationText(candidate.text) - scoreOrientationText(best.text);
    if (scoreDifference > 0) return candidate;
    if (scoreDifference < 0) return best;
    const candidatePortrait = candidate.height >= candidate.width;
    const bestPortrait = best.height >= best.width;
    return candidatePortrait && !bestPortrait ? candidate : best;
  });
}

function digitsOnly(text: string) {
  return /^\d+$/.test(text) ? text : '';
}

function sameLine(a: OcrWordBox, b: OcrWordBox) {
  const overlap = Math.min(a.bbox.y1, b.bbox.y1) - Math.max(a.bbox.y0, b.bbox.y0);
  return overlap > 0 && overlap >= Math.min(a.bbox.y1 - a.bbox.y0, b.bbox.y1 - b.bbox.y0) * 0.4;
}

export function selectSensitiveWordIndexes(words: OcrWordBox[]) {
  const selected = new Set<number>();
  for (let index = 0; index < words.length; index += 1) {
    const value = words[index].text.trim();
    const digits = digitsOnly(value);

    if (digits.length >= 13 && digits.length <= 19) selected.add(index);

    if (digits.length === 4) {
      const run = words.slice(index, index + 4);
      if (
        run.length === 4 &&
        run.every((word) => digitsOnly(word.text.trim()).length === 4) &&
        run.every((word) => sameLine(words[index], word))
      ) {
        for (let offset = 0; offset < 4; offset += 1) selected.add(index + offset);
      }
    }

    if (/^(?:MONTH\s*\/\s*YEAR|MM\s*\/\s*YY)$/i.test(value)) {
      selected.add(index);
      const next = words[index + 1];
      if (next && sameLine(words[index], next) && /^\d{2}\s*\/\s*\d{2}$/.test(next.text.trim()))
        selected.add(index + 1);
    }

    if (/^(?:CVC|CVV):?$/i.test(value)) {
      selected.add(index);
      const next = words[index + 1];
      if (next && sameLine(words[index], next) && /^\d{3,4}$/.test(next.text.trim()))
        selected.add(index + 1);
    }

    if (/^\d{3,4}-\d{3,4}$/.test(value)) selected.add(index);
  }

  const lines: number[][] = [];
  words.forEach((word, index) => {
    const line = lines.find((indexes) => sameLine(words[indexes[0]], word));
    if (line) line.push(index);
    else lines.push([index]);
  });
  for (const line of lines) {
    const ordered = [...line].sort((a, b) => words[a].bbox.x0 - words[b].bbox.x0);
    const text = ordered.map((index) => words[index].text.trim()).join(' ');
    if (/^[A-Z]{2,}(?: [A-Z]{2,})+$/.test(text)) ordered.forEach((index) => selected.add(index));
  }

  return selected;
}

function canvasBlob(canvas: HTMLCanvasElement, quality = 0.85) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('image-conversion-failed'))),
      'image/jpeg',
      quality,
    ),
  );
}

async function transformImage(source: Blob, rotation: 0 | 90 | 180 | 270, maxLongSide: number) {
  const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
  try {
    const rotated = rotation === 90 || rotation === 270;
    const targetWidth = rotated ? bitmap.height : bitmap.width;
    const targetHeight = rotated ? bitmap.width : bitmap.height;
    const scale = Math.min(1, maxLongSide / Math.max(targetWidth, targetHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(targetWidth * scale));
    canvas.height = Math.max(1, Math.round(targetHeight * scale));
    const context = canvas.getContext('2d')!;
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((rotation * Math.PI) / 180);
    context.drawImage(
      bitmap,
      (-bitmap.width * scale) / 2,
      (-bitmap.height * scale) / 2,
      bitmap.width * scale,
      bitmap.height * scale,
    );
    return { blob: await canvasBlob(canvas), width: canvas.width, height: canvas.height };
  } finally {
    bitmap.close();
  }
}

function pageWords(page: Page): OcrWordBox[] {
  return (page.blocks || []).flatMap((block) =>
    block.paragraphs.flatMap((paragraph) =>
      paragraph.lines.flatMap((line) => line.words.map(({ text, bbox }) => ({ text, bbox }))),
    ),
  );
}

async function maskWords(candidate: RecognizedOrientation, indexes: Set<number>) {
  const bitmap = await createImageBitmap(candidate.image, { imageOrientation: 'from-image' });
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(bitmap, 0, 0);
    context.fillStyle = '#fff';
    const scaleX = canvas.width / candidate.ocrWidth;
    const scaleY = canvas.height / candidate.ocrHeight;
    for (const index of indexes) {
      const box = candidate.words[index]?.bbox;
      if (!box) continue;
      const x = Math.max(0, box.x0 * scaleX - 8);
      const y = Math.max(0, box.y0 * scaleY - 8);
      const right = Math.min(canvas.width, box.x1 * scaleX + 8);
      const bottom = Math.min(canvas.height, box.y1 * scaleY + 8);
      context.fillRect(x, y, right - x, bottom - y);
    }
    return canvasBlob(canvas);
  } finally {
    bitmap.close();
  }
}

async function topFallback(source: Blob) {
  const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = Math.max(1, Math.round(bitmap.height * 0.58));
    canvas
      .getContext('2d')!
      .drawImage(bitmap, 0, 0, bitmap.width, canvas.height, 0, 0, canvas.width, canvas.height);
    return canvasBlob(canvas);
  } finally {
    bitmap.close();
  }
}

export async function prepareStudentCardImage(
  file: Blob,
  onProgress?: (value: number) => void,
): Promise<PreparedStudentCard> {
  const cropped = await preprocessImage(file, { crop: 'bright', maxEdge: 1200 });
  const source = await createImageBitmap(cropped, { imageOrientation: 'from-image' });
  const rotations: Array<0 | 90 | 270> = source.width > source.height ? [90, 270] : [0];
  source.close();

  const candidates: RecognizedOrientation[] = [];
  for (let index = 0; index < rotations.length; index += 1) {
    const rotation = rotations[index];
    const full = await transformImage(cropped, rotation, 1200);
    const ocr = await transformImage(full.blob, 0, 1000);
    const page = await recognizeImageWithBlocks(ocr.blob, (value) =>
      onProgress?.((index + value) / rotations.length),
    );
    candidates.push({
      rotation,
      width: full.width,
      height: full.height,
      image: full.blob,
      ocrWidth: ocr.width,
      ocrHeight: ocr.height,
      text: page.text,
      words: pageWords(page),
    });
  }

  const selected = selectBestOrientation(candidates);
  const sensitive = selectSensitiveWordIndexes(selected.words);
  const cardNumberIndexes = new Set(
    [...sensitive].filter((index) => {
      const digits = digitsOnly(selected.words[index]?.text.trim() || '');
      if (digits.length >= 13 && digits.length <= 19) return true;
      return (
        digits.length === 4 &&
        [...sensitive].filter((i) => digitsOnly(selected.words[i]?.text.trim() || '').length === 4)
          .length >= 4
      );
    }),
  );
  const maskedCardNumber = cardNumberIndexes.size > 0;
  const geminiImage = maskedCardNumber
    ? await maskWords(selected, sensitive)
    : await topFallback(selected.image);
  onProgress?.(1);
  return {
    geminiImage,
    orientedImage: selected.image,
    sparseText: selected.text,
    rotation: selected.rotation,
    maskedCardNumber,
  };
}
