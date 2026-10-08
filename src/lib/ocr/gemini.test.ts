import { describe, expect, it } from 'vitest';
import {
  normalizeLocalDateTime,
  normalizeReceiptResponse,
  normalizeStudentCardResponse,
} from './gemini';

describe('Gemini OCR response normalization', () => {
  it('학번에서 숫자 외 문자를 제거한 뒤 정확히 10자리만 허용한다', () => {
    expect(
      normalizeStudentCardResponse({
        studentNo: '2026-123-456',
        name: '홍길동',
        department: '',
        college: '',
        isKwangwoon: true,
        confidence: 'high',
      }).studentNo,
    ).toBe('2026123456');
    expect(
      normalizeStudentCardResponse({
        studentNo: '2026-123',
        name: '홍길동',
        department: '',
        college: '',
        isKwangwoon: true,
        confidence: 'high',
      }).studentNo,
    ).toBe('');
  });

  it('단과대가 비어 있으면 학과명으로 단과대를 채운다', () => {
    expect(
      normalizeStudentCardResponse({
        studentNo: '2026123456',
        name: '홍길동',
        department: '소프트웨어학부',
        college: '',
        isKwangwoon: true,
        confidence: 'high',
      }).college,
    ).toBe('인공지능융합대학');
  });

  it('실재하는 로컬 날짜와 시간만 유지한다', () => {
    expect(normalizeLocalDateTime('2026-02-28T09:30')).toBe('2026-02-28T09:30');
    expect(normalizeLocalDateTime('2026-02-30T09:30')).toBe('');
    expect(normalizeLocalDateTime('2026-10-08T25:00')).toBe('');
  });

  it('영수증 인원은 모델의 partySize 대신 admissionItems 수량 합을 쓴다', () => {
    expect(
      normalizeReceiptResponse({
        partySize: 5,
        dateTime: '',
        amount: 12000,
        venueName: '아이스링크',
        admissionItems: [
          { label: '대인', qty: 2 },
          { label: '청소년', qty: 1 },
        ],
      }).partySize,
    ).toBe(3);
  });
});
