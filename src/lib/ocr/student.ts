export const COLLEGES = [
  '전자정보공과대학',
  '인공지능융합대학',
  '공과대학',
  '자연과학대학',
  '인문사회과학대학',
  '정책법학대학',
  '경영대학',
  '참빛인재대학',
  '인제니움대학',
] as const;

// 2026 기준 추정 매핑. 학과 개편/신설로 어긋날 수 있으며, 미매칭 시 화면에서 수동 선택한다.
// 참빛인재대학·인제니움대학은 하위 학과명이 공개되어 있지 않아 단과대명이 그대로 노출될 때만
// COLLEGES 직접 일치로 잡힌다.
export const DEPARTMENT_TO_COLLEGE: Record<string, (typeof COLLEGES)[number]> = {
  전자공학과: '전자정보공과대학',
  전자통신공학과: '전자정보공과대학',
  전자융합공학과: '전자정보공과대학',
  전기공학과: '전자정보공과대학',
  전자재료공학과: '전자정보공과대학',
  로봇학부: '전자정보공과대학',
  컴퓨터정보공학부: '인공지능융합대학',
  소프트웨어학부: '인공지능융합대학',
  정보융합학부: '인공지능융합대학',
  건축공학과: '공과대학',
  건축학과: '공과대학',
  화학공학과: '공과대학',
  환경공학과: '공과대학',
  수학과: '자연과학대학',
  전자바이오물리학과: '자연과학대학',
  화학과: '자연과학대학',
  스포츠융합과학과: '자연과학대학',
  국어국문학과: '인문사회과학대학',
  영어산업학과: '인문사회과학대학',
  미디어커뮤니케이션학부: '인문사회과학대학',
  산업심리학과: '인문사회과학대학',
  동북아문화산업학부: '인문사회과학대학',
  행정학과: '정책법학대학',
  법학부: '정책법학대학',
  국제학부: '정책법학대학',
  자산관리학과: '정책법학대학',
  경영학부: '경영대학',
  국제통상학부: '경영대학',
};

const FORBIDDEN_NAMES = new Set([
  '광운대학교',
  '광운',
  '대학교',
  '서명',
  '후불교통카드',
  '하나카드',
  'TRAVLOG',
]);

/**
 * 학생증/체크카드 OCR 원문에서 카드번호, 유효기간, CVC, 전화번호를 [삭제됨]으로 치환한다.
 * `parseStudentCard`는 이 함수를 거친 텍스트만 파싱에 사용하므로, 반환값(studentNo/name/
 * college/department) 어디에도 원문 민감정보가 섞이지 않는다.
 * 주의: 화면(StudentCard.tsx/Visitor.tsx)의 "인식된 글자 보기"는 live.ts가 들고 있는
 * 원본 OCR 텍스트를 그대로 표시하며 이 redact를 거치지 않는다. live.ts에서 onFrame/onResult로
 * 넘기는 rawText에 redactSensitive를 적용하도록 다음 작업자에게 전달 필요.
 */
export function redactSensitive(text: string): string {
  return text
    .replace(/\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{4}/g, '[삭제됨]')
    .replace(/(?<!\d)\d{16}(?!\d)/g, '[삭제됨]')
    .replace(/(MONTH\s*\/\s*YEAR\s*)\d{2}\s*\/\s*\d{2}/gi, '$1[삭제됨]')
    .replace(/(CVC|CVV)\s*:?\s*\d{3,4}/gi, '$1 [삭제됨]')
    .replace(/(?<!\d)\d{3,4}-\d{3,4}(?!\d)/g, '[삭제됨]');
}

function findStudentNo(text: string, currentYear: number): string {
  // OCR 노이즈로 숫자 사이에 공백이 하나 섞이는 경우(예: "2026 404030")까지 허용한다.
  const candidates = [...text.matchAll(/(?<!\d)\d+(?: \d+)?(?!\d)/g)]
    .map((match) => match[0].replace(/ /g, ''))
    .filter((digits) => digits.length === 10);
  const validYear = (digits: string) => {
    const year = Number(digits.slice(0, 4));
    return year >= 2010 && year <= currentYear;
  };
  return candidates.find(validYear) || candidates[0] || '';
}

/** 공백·구두점·영문을 제거하고 한글 2~4자만 이름으로 인정한다. */
export function normalizeName(raw: string): string {
  const hangul = raw.replace(/[^가-힣]/g, '');
  return /^[가-힣]{2,4}$/.test(hangul) ? hangul : '';
}

function findName(text: string, studentNo: string): string {
  if (!studentNo) return '';
  const lines = text.split(/\r?\n/);
  const studentLineIndex = lines.findIndex((line) => line.replace(/\s/g, '').includes(studentNo));
  if (studentLineIndex === -1) return '';
  for (let i = studentLineIndex + 1; i < lines.length; i += 1) {
    const candidate = normalizeName(lines[i]);
    if (candidate && !FORBIDDEN_NAMES.has(candidate)) return candidate;
  }
  return '';
}

function findCollege(text: string): { college: string; department: string } {
  const compact = text.replace(/\s/g, '');
  const direct = COLLEGES.find((college) => compact.includes(college));
  if (direct) return { college: direct, department: '' };
  const deptEntry = Object.entries(DEPARTMENT_TO_COLLEGE).find(([department]) =>
    compact.includes(department),
  );
  return deptEntry
    ? { college: deptEntry[1], department: deptEntry[0] }
    : { college: '', department: '' };
}

export interface ParsedStudentCard {
  studentNo: string;
  name: string;
  college: string;
  department?: string;
}

export function parseStudentCard(
  text: string,
  currentYear = new Date().getFullYear(),
): ParsedStudentCard {
  const redacted = redactSensitive(text);
  const studentNo = findStudentNo(redacted, currentYear);
  const name = findName(redacted, studentNo);
  const { college, department } = findCollege(redacted);
  return { studentNo, name, college, department };
}

export function assessStudentCard(
  parsed: ParsedStudentCard,
  rawText: string,
  currentYear = new Date().getFullYear(),
) {
  const year = Number(parsed.studentNo.slice(0, 4));
  const checks = {
    studentNo: /^\d{10}$/.test(parsed.studentNo) && year >= 2010 && year <= currentYear,
    school: /광운|KWANGWOON|대학교/i.test(rawText),
    name: /^[가-힣]{2,4}$/.test(parsed.name),
    // 학부/학과 매칭은 가점용 정보일 뿐, high 판정의 필수 조건은 아니다.
    department: Boolean(parsed.college),
  };
  const required = [checks.studentNo, checks.school, checks.name];
  return {
    confidence: required.every(Boolean) ? ('high' as const) : ('low' as const),
    checks,
  };
}
