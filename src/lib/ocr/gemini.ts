import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from 'firebase/ai';
import { preprocessImage } from './preprocess';
import { COLLEGES, DEPARTMENT_TO_COLLEGE, normalizeName } from './student';

// 2.5 세대는 신규 프로젝트에 제공 종료(404). 3.1 flash-lite: 학생증 3.6s·티켓 2.9s로 확인(2026-10-08).
export const GEMINI_MODEL = 'gemini-3.1-flash-lite';
const TIMEOUT_MS = 12_000;
let aiInstance: ReturnType<typeof getAI> | null = null;

export interface GeminiStudentCardResult {
  studentNo: string;
  name: string;
  department: string;
  college: string;
  isKwangwoon: boolean;
  confidence: 'high' | 'low';
}

export interface GeminiTicketResult {
  title: string;
  dateTime: string;
  partySize: number | null;
  bookingNo: string;
  venue: string;
}

export interface GeminiReceiptResult {
  partySize: number | null;
  dateTime: string;
  amount: number | null;
  venueName: string;
}

export interface GeminiAdmissionItem {
  label: string;
  qty: number;
}

const studentSchema = Schema.object({
  properties: {
    studentNo: Schema.string(),
    name: Schema.string(),
    department: Schema.string(),
    college: Schema.string(), // enum에 빈 문자열을 넣으면 400 → 문자열로 받고 아래에서 목록·학부 매핑으로 정규화
    isKwangwoon: Schema.boolean(),
    confidence: Schema.enumString({ enum: ['high', 'low'] }),
  },
});

const ticketSchema = Schema.object({
  properties: {
    title: Schema.string(),
    dateTime: Schema.string(),
    partySize: Schema.integer({ nullable: true }),
    bookingNo: Schema.string(),
    venue: Schema.string(),
  },
});

const admissionItemSchema = Schema.object({
  properties: {
    label: Schema.string(),
    qty: Schema.integer(),
  },
});

const receiptSchema = Schema.object({
  properties: {
    partySize: Schema.integer({ nullable: true }),
    dateTime: Schema.string(),
    amount: Schema.number({ nullable: true }),
    venueName: Schema.string(),
    admissionItems: Schema.array({ items: admissionItemSchema }),
  },
});

function unavailable(): Error & { code: string } {
  return Object.assign(new Error('gemini-unavailable'), { code: 'gemini-unavailable' });
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function nullableNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function normalizeLocalDateTime(value: unknown) {
  const input = text(value);
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return '';
  const [, year, month, day, hour, minute] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
  return date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day) &&
    date.getHours() === Number(hour) &&
    date.getMinutes() === Number(minute)
    ? input
    : '';
}

export function normalizeStudentCardResponse(value: unknown): GeminiStudentCardResult {
  const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const digits = text(source.studentNo).replace(/\D/g, '');
  const studentNo = /^\d{10}$/.test(digits) ? digits : '';
  const name = normalizeName(text(source.name));
  const department = text(source.department);
  const candidateCollege = text(source.college);
  const college = COLLEGES.includes(candidateCollege as (typeof COLLEGES)[number])
    ? candidateCollege
    : DEPARTMENT_TO_COLLEGE[department] || '';
  const isKwangwoon = source.isKwangwoon === true;
  return {
    studentNo,
    name,
    department,
    college,
    isKwangwoon,
    confidence: studentNo && name && isKwangwoon ? 'high' : 'low',
  };
}

function normalizeTicketResponse(value: unknown): GeminiTicketResult {
  const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const partySize = nullableNumber(source.partySize);
  return {
    title: text(source.title),
    dateTime: normalizeLocalDateTime(source.dateTime),
    partySize: partySize !== null && Number.isInteger(partySize) ? partySize : null,
    bookingNo: text(source.bookingNo),
    venue: text(source.venue),
  };
}

// 입장 품목(admissionItems) 수량 합이 있으면 모델이 내놓은 partySize보다 우선한다.
function admissionItemsPartySize(value: unknown): number | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  let sum = 0;
  let found = false;
  for (const item of value) {
    const source = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const qty = nullableNumber(source.qty);
    if (qty !== null && Number.isInteger(qty)) {
      sum += qty;
      found = true;
    }
  }
  return found ? sum : null;
}

export function normalizeReceiptResponse(value: unknown): GeminiReceiptResult {
  const source = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const partySize = nullableNumber(source.partySize);
  const admissionPartySize = admissionItemsPartySize(source.admissionItems);
  return {
    partySize:
      admissionPartySize ?? (partySize !== null && Number.isInteger(partySize) ? partySize : null),
    dateTime: normalizeLocalDateTime(source.dateTime),
    amount: nullableNumber(source.amount),
    venueName: text(source.venueName),
  };
}

async function canvasJpeg(source: Blob, topFraction = 1) {
  const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' });
  try {
    const sourceHeight = Math.max(1, Math.round(bitmap.height * topFraction));
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, sourceHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    canvas
      .getContext('2d')!
      .drawImage(bitmap, 0, 0, bitmap.width, sourceHeight, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(unavailable())), 'image/jpeg', 0.85),
    );
  } finally {
    bitmap.close();
  }
}

async function base64(blob: Blob) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(unavailable());
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.readAsDataURL(blob);
  });
}

async function generate(schema: Schema, prompt: string, image: Blob) {
  if (!import.meta.env.VITE_FIREBASE_API_KEY || navigator.onLine === false) throw unavailable();
  try {
    const { app } = await import('../../data/firebase');
    if (!app) throw unavailable();
    aiInstance ||= getAI(app, { backend: new GoogleAIBackend() });
    const model = getGenerativeModel(aiInstance, {
      model: GEMINI_MODEL,
      generationConfig: { responseMimeType: 'application/json', responseSchema: schema },
    });
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const result = await model.generateContent(
        [prompt, { inlineData: { data: await base64(image), mimeType: 'image/jpeg' } }],
        { signal: controller.signal },
      );
      return JSON.parse(result.response.text()) as unknown;
    } finally {
      window.clearTimeout(timer);
    }
  } catch {
    throw unavailable();
  }
}

export async function geminiStudentCard(file: Blob) {
  try {
    const response = await generate(
      studentSchema,
      `광운대학교 학생증 사진이다. 학번(10자리 숫자), 이름(한글), 학부/학과, 단과대(${COLLEGES.join(', ')})를 추출하라. 보이지 않거나 확실하지 않은 문자열은 빈 문자열로 반환하라. 카드번호·유효기간·CVC는 절대 출력하지 말 것.`,
      file,
    );
    return normalizeStudentCardResponse(response);
  } catch {
    throw unavailable();
  }
}

export async function geminiTicket(file: Blob) {
  try {
    const cropped = await preprocessImage(file, { crop: 'bright' });
    const image = await canvasJpeg(cropped);
    return normalizeTicketResponse(
      await generate(
        ticketSchema,
        "공연 티켓 사진에서 공연명, 이용 일시, 인원, 예매번호, 장소를 추출하라. 일시는 현지 시각 'YYYY-MM-DDTHH:mm' 형식으로, 확실하지 않은 문자열은 빈 문자열, 숫자는 null로 반환하라.",
        image,
      ),
    );
  } catch {
    throw unavailable();
  }
}

export async function geminiReceipt(file: Blob) {
  try {
    const cropped = await preprocessImage(file, { crop: 'bright' });
    const image = await canvasJpeg(cropped);
    return normalizeReceiptResponse(
      await generate(
        receiptSchema,
        "영수증 사진에서 이용 인원, 이용 일시, 결제 금액, 장소명을 추출하라. admissionItems에는 입장권·이용권(대인/소인/청소년/어린이 등) 품목만 label과 qty로 나열하라. 스케이트·장갑·헬멧·보관함 등 대여/부가 품목은 admissionItems에 넣지 말고, partySize는 admissionItems 수량의 합과 같게 계산하라(대여/부가 품목 수량은 인원에 포함하지 말 것). 일시는 현지 시각 'YYYY-MM-DDTHH:mm' 형식으로, 확실하지 않은 문자열은 빈 문자열, 숫자는 null로 반환하라.",
        image,
      ),
    );
  } catch {
    throw unavailable();
  }
}
