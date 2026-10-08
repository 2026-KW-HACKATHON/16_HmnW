import { describe, expect, it } from 'vitest';
import { assessStudentCard, COLLEGES, parseStudentCard, redactSensitive } from './student';

// 가공 데이터: 실제 학번/이름/카드번호가 아님
const FAKE_CARD_TEXT = [
  '12345678',
  '2026123456',
  '홍길동',
  '정보융합학부',
  '광운대학교 KwangWoon University',
  '1234 5678 9012 3456',
  'MONTH/YEAR 03/31   CVC 123',
  'CHOI YUMIN',
  '서명 후 본인만 사용 가능',
  '후불교통카드 / TRAVLOG / 하나카드 / [ Check ] / 1800-1111',
].join('\n');

describe('학생증 OCR 필드 추출', () => {
  it('숫자 정확히 10자리 학번만 추출한다', () => {
    expect(parseStudentCard('학번 2026123456 이름 홍길동').studentNo).toBe('2026123456');
    expect(parseStudentCard('학번 20261234567').studentNo).toBe('');
  });
  it('9개 공식 단과대 명칭을 제공한다', () =>
    expect(COLLEGES).toEqual([
      '전자정보공과대학',
      '인공지능융합대학',
      '공과대학',
      '자연과학대학',
      '인문사회과학대학',
      '정책법학대학',
      '경영대학',
      '참빛인재대학',
      '인제니움대학',
    ]));
  it('학과 문자열로 단과대를 자동 선택한다', () => {
    expect(parseStudentCard('광운대학교 전자공학과 2026123456').college).toBe('전자정보공과대학');
    expect(parseStudentCard('KWANGWOON 소프트웨어학부 2026123456').college).toBe(
      '인공지능융합대학',
    );
    expect(parseStudentCard('인제니움대학 2026123456').college).toBe('인제니움대학');
  });
});

describe('학생증 신뢰도 평가', () => {
  it('유효한 학번, 학교 토큰, 한글 이름이 있으면 high다', () => {
    expect(
      assessStudentCard(
        { studentNo: '2021123456', name: '홍길동', college: '공과대학' },
        '광운대학교 학생증',
        2026,
      ).confidence,
    ).toBe('high');
  });
  it('입학 연도가 범위를 벗어나면 low다', () => {
    expect(
      assessStudentCard(
        { studentNo: '2009123456', name: '홍길동', college: '공과대학' },
        'KWANGWOON UNIVERSITY',
        2026,
      ).confidence,
    ).toBe('low');
  });
  it('학교 토큰이나 2~4자 한글 이름이 없으면 low다', () => {
    expect(
      assessStudentCard(
        { studentNo: '2021123456', name: '홍길동님', college: '공과대학' },
        '학생증',
        2026,
      ).confidence,
    ).toBe('low');
  });
});

describe('실물 학생증 레이아웃 파싱', () => {
  it('학번/이름/학과를 추출하고 학과로 단과대를 자동 매핑한다', () => {
    const parsed = parseStudentCard(FAKE_CARD_TEXT, 2026);
    expect(parsed.studentNo).toBe('2026123456');
    expect(parsed.name).toBe('홍길동');
    expect(parsed.department).toBe('정보융합학부');
    expect(parsed.college).toBe('인공지능융합대학');
  });

  it('redact된 텍스트에는 카드번호와 CVC/유효기간 값이 남지 않는다', () => {
    const redacted = redactSensitive(FAKE_CARD_TEXT);
    expect(redacted).not.toContain('1234 5678 9012 3456');
    expect(redacted).not.toContain('03/31');
    expect(redacted).not.toMatch(/CVC\s*123\b/);
    expect(redacted).not.toContain('1800-1111');
    expect(redacted).toContain('[삭제됨]');
  });

  it('학번 숫자 사이 공백 노이즈 한 칸은 허용한다', () => {
    const noisy = '학번\n2026 404030\n홍길동';
    expect(parseStudentCard(noisy, 2026).studentNo).toBe('2026404030');
  });

  it('학번 다음 줄이 금칙어면 건너뛰고 실제 이름을 찾는다', () => {
    const text = '2026123456\n서명\n홍길동';
    expect(parseStudentCard(text, 2026).name).toBe('홍길동');
  });

  it('이름의 공백·영문을 제거해 한글 2~4자로 정규화한다', () => {
    expect(parseStudentCard('2026123456\n최 유민', 2026).name).toBe('최유민');
    expect(parseStudentCard('2026123456\n최유민 CHOI', 2026).name).toBe('최유민');
  });
});
