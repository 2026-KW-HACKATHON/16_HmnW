import { createWorker, PSM, type Worker } from 'tesseract.js';
let singleton: Promise<Worker> | null = null;
let onProgressRef: ((value: number) => void) | undefined;
export function ensureWorker() {
  if (!singleton)
    singleton = createWorker('kor+eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') onProgressRef?.(m.progress);
      },
    });
  return singleton;
}
export async function recognizeImage(
  image: Blob | string,
  onProgress?: (value: number) => void,
  pageSegMode: '4' | '6' = '6',
) {
  const worker = await ensureWorker();
  onProgressRef = onProgress;
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: pageSegMode === '4' ? PSM.SINGLE_COLUMN : PSM.SINGLE_BLOCK,
    });
    return (await worker.recognize(image)).data.text;
  } catch (error) {
    const message = String(error);
    if (/network|fetch|traineddata|load language|download/i.test(message))
      throw Object.assign(new Error('ocr-download-failed'), { code: 'ocr-download-failed' });
    throw error;
  } finally {
    onProgressRef = undefined;
  }
}
/** 같은 워커로 PSM을 바꿔가며 순차 인식해, 합친 텍스트와 각 단계별 텍스트를 함께 돌려준다. */
export async function recognizeImageMulti(
  image: Blob | string,
  psms: PSM[],
  onProgress?: (value: number) => void,
) {
  const worker = await ensureWorker();
  const n = psms.length;
  try {
    const texts: string[] = [];
    for (let i = 0; i < n; i += 1) {
      onProgressRef = (value) => onProgress?.((i + value) / n);
      await worker.setParameters({ tessedit_pageseg_mode: psms[i] });
      texts.push((await worker.recognize(image)).data.text);
    }
    return { texts, text: texts.join('\n') };
  } catch (error) {
    const message = String(error);
    if (/network|fetch|traineddata|load language|download/i.test(message))
      throw Object.assign(new Error('ocr-download-failed'), { code: 'ocr-download-failed' });
    throw error;
  } finally {
    onProgressRef = undefined;
  }
}
/** 무대 Wi-Fi 대비: 언어팩을 미리 받아 둡니다. 멱등이고 실패해도 무시해요. */
export function warmupOcr() {
  ensureWorker().catch(() => {});
}
