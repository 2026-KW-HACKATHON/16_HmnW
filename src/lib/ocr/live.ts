import { PSM } from 'tesseract.js';
import { parseRinkReceipt, parseTicket } from './parse';
import { preprocessCanvasSource } from './preprocess';
import { parseStudentCard, redactSensitive, type ParsedStudentCard } from './student';
import { ensureWorker } from './worker';

type FieldKey<Fields extends object> = Extract<keyof Fields, string>;
type ParsedFields<Fields extends object> = Partial<Fields>;
type Frame<Fields extends object> = { parsed: ParsedFields<Fields>; rawText: string };
type LiveAccumulator<Fields extends object> = {
  push: (
    parsed: ParsedFields<Fields>,
    rawText: string,
  ) => {
    fields: ParsedFields<Fields>;
    parsed: ParsedFields<Fields>;
    rawText: string;
    confirmed: boolean;
  };
};

const hasValue = (value: unknown) => value !== undefined && value !== null && value !== '';
const valueKey = (value: unknown) =>
  value instanceof Date ? `date:${value.getTime()}` : `${typeof value}:${String(value)}`;

export function createLiveAccumulator(windowSize?: number): LiveAccumulator<ParsedStudentCard>;
export function createLiveAccumulator<Fields extends object>(
  options: {
    requiredKeys: FieldKey<Fields>[];
    isStable?: (fields: ParsedFields<Fields>) => boolean;
  },
  windowSize?: number,
): LiveAccumulator<Fields>;
export function createLiveAccumulator<Fields extends object>(
  optionsOrWindow:
    | {
        requiredKeys: FieldKey<Fields>[];
        isStable?: (fields: ParsedFields<Fields>) => boolean;
      }
    | number = 6,
  configuredWindowSize = 6,
): LiveAccumulator<Fields> {
  const studentMode = typeof optionsOrWindow === 'number';
  const windowSize = studentMode ? optionsOrWindow : configuredWindowSize;
  const options = studentMode
    ? {
        requiredKeys: ['studentNo'] as FieldKey<Fields>[],
        isStable: undefined,
      }
    : optionsOrWindow;
  const frames: Frame<Fields>[] = [];
  let sawSchool = false;

  return {
    push(parsed: ParsedFields<Fields>, text: string) {
      // 체크카드 겸용 학생증·영수증의 카드번호/CVC가 화면("인식된 글자 보기")이나 상태로 새지 않게 원문은 삭제본만 보관
      const rawText = redactSensitive(text);
      if (studentMode) sawSchool ||= /광운|KWANGWOON/i.test(rawText);
      frames.push({ parsed, rawText });
      if (frames.length > windowSize) frames.shift();

      const keys = new Set<FieldKey<Fields>>();
      frames.forEach((frame) =>
        Object.keys(frame.parsed).forEach((key) => keys.add(key as FieldKey<Fields>)),
      );
      const fields: ParsedFields<Fields> = {};
      const repeats = new Map<FieldKey<Fields>, number>();

      keys.forEach((key) => {
        const counts = new Map<string, { count: number; last: number; value: unknown }>();
        frames.forEach((frame, index) => {
          const value = frame.parsed[key];
          if (!hasValue(value)) return;
          const identity = valueKey(value);
          const current = counts.get(identity) || { count: 0, last: index, value };
          counts.set(identity, { count: current.count + 1, last: index, value });
        });
        const winner = [...counts.values()].sort((a, b) => b.count - a.count || b.last - a.last)[0];
        if (winner) {
          fields[key] = winner.value as Fields[typeof key];
          repeats.set(key, winner.count);
        }
      });

      const requiredStable = options.requiredKeys.every(
        (key) => hasValue(fields[key]) && (repeats.get(key) || 0) >= 2,
      );
      return {
        fields,
        parsed: fields,
        rawText,
        confirmed:
          requiredStable && (studentMode ? sawSchool : (options.isStable?.(fields) ?? true)),
      };
    },
  };
}

export function createStudentLiveAccumulator(windowSize = 6) {
  return createLiveAccumulator(windowSize);
}

export interface LiveScanOptions<Fields extends object> {
  parse: (text: string) => ParsedFields<Fields>;
  requiredKeys: FieldKey<Fields>[];
  isStable?: (fields: ParsedFields<Fields>) => boolean;
  intervalMs?: number;
  onFrame: (fields: ParsedFields<Fields>, rawText: string) => void;
  onResult: (fields: ParsedFields<Fields>, rawText: string, partial?: boolean) => void;
  onTimeout: () => void;
  timeoutMs?: number;
  pageSegMode?: '4' | '6';
  retryShortText?: boolean;
  resultOnTimeout?: boolean;
  createAccumulator?: () => ReturnType<typeof createLiveAccumulator<Fields>>;
}

export async function startLiveScan<Fields extends object>(
  video: HTMLVideoElement,
  options: LiveScanOptions<Fields>,
) {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('camera-unsupported');
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment', width: { ideal: 1280 } },
  });
  video.srcObject = stream;
  try {
    await video.play();
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    throw error;
  }

  let stopped = false;
  let busy = false;
  let best: { fields: ParsedFields<Fields>; rawText: string } = { fields: {}, rawText: '' };
  const accumulator =
    options.createAccumulator?.() ||
    createLiveAccumulator<Fields>({
      requiredKeys: options.requiredKeys,
      isStable: options.isStable,
    });
  let timer = 0;
  let timeout = 0;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    window.clearInterval(timer);
    window.clearTimeout(timeout);
    stream.getTracks().forEach((track) => track.stop());
  };
  const recognize = async (pageSegMode: '4' | '6') => {
    const worker = await ensureWorker();
    await worker.setParameters({
      tessedit_pageseg_mode: pageSegMode === '4' ? PSM.SINGLE_COLUMN : PSM.SINGLE_BLOCK,
    });
    return (await worker.recognize(await preprocessCanvasSource(video, 1000))).data.text;
  };
  const scan = async () => {
    if (stopped || busy || !video.videoWidth) return;
    busy = true;
    try {
      let text = await recognize(options.pageSegMode || '6');
      if (options.retryShortText && text.trim().length < 20) text = await recognize('6');
      if (stopped) return;
      const state = accumulator.push(options.parse(text), text);
      best = {
        fields: { ...best.fields, ...state.fields },
        rawText: state.rawText,
      };
      options.onFrame(state.fields, state.rawText);
      if (state.confirmed) {
        stop();
        options.onResult(state.fields, state.rawText, false);
      }
    } finally {
      busy = false;
    }
  };

  timer = window.setInterval(scan, Math.max(900, options.intervalMs || 900));
  timeout = window.setTimeout(() => {
    stop();
    if (options.resultOnTimeout && Object.values(best.fields).some(hasValue)) {
      options.onResult(best.fields, best.rawText, true);
    } else {
      options.onTimeout();
    }
  }, options.timeoutMs ?? 60_000);
  void scan();
  return stop;
}

type StudentScanCallbacks = {
  intervalMs?: number;
  timeoutMs?: number;
  onFrame: (fields: ParsedStudentCard, rawText: string) => void;
  onResult: (fields: ParsedStudentCard, rawText: string, partial?: boolean) => void;
  onTimeout: () => void;
};

export function startStudentLiveScan(video: HTMLVideoElement, options: StudentScanCallbacks) {
  const complete = (fields: Partial<ParsedStudentCard>): ParsedStudentCard => ({
    studentNo: fields.studentNo || '',
    name: fields.name || '',
    college: fields.college || '',
  });
  return startLiveScan<ParsedStudentCard>(video, {
    parse: parseStudentCard,
    requiredKeys: ['studentNo'],
    createAccumulator: () => createStudentLiveAccumulator(),
    intervalMs: options.intervalMs,
    timeoutMs: options.timeoutMs,
    onFrame: (fields, rawText) => options.onFrame(complete(fields), rawText),
    onResult: (fields, rawText, partial) => options.onResult(complete(fields), rawText, partial),
    onTimeout: options.onTimeout,
  });
}

export function startTicketLiveScan(
  video: HTMLVideoElement,
  options: Omit<LiveScanOptions<ReturnType<typeof parseTicket>>, 'parse' | 'requiredKeys'>,
) {
  return startLiveScan(video, {
    ...options,
    parse: parseTicket,
    requiredKeys: ['title', 'dateTime'],
    pageSegMode: '6',
  });
}

export function startRinkReceiptLiveScan(
  video: HTMLVideoElement,
  options: Omit<LiveScanOptions<ReturnType<typeof parseRinkReceipt>>, 'parse' | 'requiredKeys'>,
) {
  return startLiveScan(video, {
    ...options,
    parse: parseRinkReceipt,
    requiredKeys: ['partySize'],
    pageSegMode: '4',
    retryShortText: true,
    timeoutMs: 12_000,
    resultOnTimeout: true,
  });
}
