const normalize = (s: string) => s.toLowerCase().replace(/[^가-힣a-z0-9]/g, '');
export function titleSimilarity(a: string, b: string) {
  const x = normalize(a),
    y = normalize(b);
  if (!x || !y) return 0;
  if (x.includes(y) || y.includes(x)) return 1;
  const bigrams = (s: string) =>
    new Set(Array.from({ length: Math.max(0, s.length - 1) }, (_, i) => s.slice(i, i + 2)));
  const A = bigrams(x),
    B = bigrams(y);
  let n = 0;
  A.forEach((v) => {
    if (B.has(v)) n++;
  });
  return A.size + B.size ? (2 * n) / (A.size + B.size) : 0;
}
// ponytail: p.m/a.m 토큰은 라틴 "a/p"+"m" 조합 어디서나 매치하는 느슨한 휴리스틱,
// 오탐이 보이면 공연 라벨 주변으로 범위를 좁힐 것
const PM_MARK = /오후|저녁|p[\s.,]*m\.?/i;
const AM_MARK = /오전|a[\s.,]*m\.?/i;
export function parseKoreanDateTime(text: string, year = new Date().getFullYear()) {
  const m = text.match(
    /(?:(20\d{2})[.\-/년]\s*)?(\d{1,2})[.\-/월]\s*(\d{1,2})(?:일)?(?:\s*\([일월화수목금토]\))?([^\d]{0,16})(\d{1,2})\s*(?:[:시]\s*)?(?:(\d{1,2})\s*분?)?([^\n]{0,12})/,
  );
  if (!m) return null;
  const [, y, mo, d, pre, h, mi, post] = m;
  let hour = Number(h);
  const marker = pre + post;
  if (PM_MARK.test(marker)) {
    if (hour < 12) hour += 12;
  } else if (AM_MARK.test(marker) && hour === 12) {
    hour = 0;
  }
  return new Date(Number(y || year), Number(mo) - 1, Number(d), hour, Number(mi || 0));
}
const amount = (t: string) => {
  const m = t.match(/(?:합계|총액|결제금액)\s*[:：]?\s*([\d,]+)\s*원?/);
  return m ? Number(m[1].replace(/,/g, '')) : undefined;
};
const party = (t: string) => {
  const m =
    t.match(/(?:성인|대인|소인|청소년|어린이|본교생)\s*(?:x\s*)?(\d+)\s*(?:매|명)?/i) ||
    t.match(/(?<!\d)(\d+)\s*(?:매|명)/);
  return m ? Number(m[1]) : undefined;
};
// ponytail: 좌석/매수 꼬리표는 "숫자+층/매", "A~Z+석" 패턴으로만 걸러내는 휴리스틱,
// 공연명이 실제로 그 패턴으로 끝나면 같이 잘려나갈 수 있음
const NOISE_PREFIX = /^[A-Za-z|]{1,2}[).:]?\s+(?=[가-힣])/;
const NOISE_SUFFIX = /(?:\s*(?:\d+층\s*[A-Za-z가-힣]{0,2}구역|[A-Za-z]?석|\d+매))+\s*$/;
const cleanTitle = (s: string) =>
  s
    .replace(/^[-*\s]+/, '')
    .replace(NOISE_PREFIX, '')
    .replace(NOISE_SUFFIX, '')
    .trim();
const EXCLUDE_LINE =
  /주최|주관|예매|문의|좌석|가격|티켓|예약번호|예매번호|일시|장소|출연|\(주\)|Tel|www|http/i;
const BONUS_KEYWORD = /콘서트|공연|뮤지컬|연극|음악회|페스티벌|내한|투어|CONCERT|LIVE|TOUR/i;
// ponytail: 날짜 줄 탐지는 느슨한 숫자/월/오전오후 휴리스틱, 날짜 형식이 늘면 패턴 추가
const DATE_LINE =
  /\d{1,2}[.\-/]\s*\d{1,2}|\d{4}[.\-/년]|\d{1,2}월|\d{1,2}\s*[:시]\s*\d{0,2}|오전|오후|[ap]\s*\.?\s*m\.?/i;
const ratioOf = (s: string, re: RegExp) => (s.length ? (s.match(re) || []).length / s.length : 0);
// 공연명 줄 선택: 제외 조건을 통과한 줄 중 가점이 가장 높은 줄(동점이면 위쪽 줄)을 고른다
const pickTitleLine = (lines: string[]) => {
  const dateIdx = lines.findIndex((x) => DATE_LINE.test(x));
  let best = -1;
  let bestScore = -Infinity;
  lines.forEach((line, i) => {
    if (!/[가-힣]{3,}/.test(line)) return;
    if (EXCLUDE_LINE.test(line)) return;
    if (ratioOf(line, /[,:#|()]/g) >= 0.2) return;
    if (ratioOf(line, /\d/g) >= 0.3) return;
    let score = 0;
    if (BONUS_KEYWORD.test(line)) score += 3;
    if (dateIdx >= 0 && (i === dateIdx - 1 || i === dateIdx - 2)) score += 2;
    if (i < lines.length / 3) score += 1;
    if (ratioOf(line, /[가-힣]/g) >= 0.5) score += 1;
    if (line.length >= 4 && line.length <= 30) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best >= 0 ? lines[best] : undefined;
};
export function parseTicket(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const labeled = lines.find((x) => /(공연명|공 연 명|작품명)/.test(x));
  const title = cleanTitle(
    labeled?.split(/[:：]/).slice(1).join(':').trim() || pickTitleLine(lines) || '',
  );
  return {
    title,
    dateTime: parseKoreanDateTime(text),
    partySize: party(text),
    bookingNo: text.match(/(?:예매번호\s*[:：]?\s*)?([A-Z]\d{8,})/i)?.[1],
  };
}
// 대여/부가 품목(장갑·스케이트·헬멧·보관함 등) 줄은 인원 집계에서 제외. 대여 줄에 입장 단어가 같이 있어도 제외가 우선.
const RINK_EXCLUDE_LINE =
  /대여|렌탈|렌트|장갑|스케이트|헬멧|보호대|보관함|사물함|락커|양말|포켓|보증금|합계|총액|부가세|카드|승인/;
const RINK_ADMISSION_LINE =
  /입장권|입장료|입장|이용권|대인|소인|성인|청소년|어린이|학생|본교생|일반|자유이용/;
const RINK_ADMISSION_QTY =
  /(?:입장권|입장료|입장|이용권|대인|소인|성인|청소년|어린이|학생|본교생|일반|자유이용)\s*(?:x\s*)?(\d+)/gi;
const rinkLineQty = (line: string) => {
  const m =
    line.match(/(\d+)\s*(?:매|명|개)/) ||
    line.match(/[x×]\s*(\d+)/i) ||
    line.match(/수량\s*[:：]?\s*(\d+)/) ||
    line.match(/^(\d+)$/);
  return m ? Number(m[1]) : undefined;
};
// 입장 품목 줄의 수량만 합산하고, 입장 줄이 없을 때만 대여 줄을 제외한 나머지에서 수량을 폴백으로 찾는다.
const partySizeOfRink = (text: string) => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const safeLines = lines.filter((l) => !RINK_EXCLUDE_LINE.test(l));
  const admissionLines = safeLines.filter((l) => RINK_ADMISSION_LINE.test(l));
  if (admissionLines.length) {
    let sum = 0;
    admissionLines.forEach((l) => {
      for (const m of l.matchAll(RINK_ADMISSION_QTY)) sum += Number(m[1]);
    });
    if (sum > 0) return sum;
  }
  for (const l of safeLines) {
    const q = rinkLineQty(l);
    if (q !== undefined) return q;
  }
  return undefined;
};
export function parseRinkReceipt(text: string, today = new Date()) {
  const parsedAmount = amount(text);
  const parsedDate = parseKoreanDateTime(text);
  return {
    dateTime: parsedDate || (parsedAmount !== undefined ? new Date(today) : null),
    partySize: partySizeOfRink(text) || (parsedAmount !== undefined ? 1 : undefined),
    amount: parsedAmount,
    dateDefaulted: !parsedDate && parsedAmount !== undefined,
  };
}
