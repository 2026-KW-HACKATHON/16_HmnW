import { expect, it } from 'vitest';
import { accessCodeCandidates, normalizeAccessCode } from './accessCodes';

it('코드의 소문자와 공백을 대문자 코드로 정규화한다', () => {
  expect(normalizeAccessCode('  visit 2026 ')).toBe('VISIT2026');
});

it('하이픈 코드에는 원본과 하이픈 없는 조회 후보를 만든다', () => {
  expect(accessCodeCandidates(' donghae-staff ')).toEqual(['DONGHAE-STAFF', 'DONGHAESTAFF']);
  expect(accessCodeCandidates('donghaestaff')).toEqual(['DONGHAESTAFF', 'DONGHAE-STAFF']);
});
