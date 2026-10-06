import { expect, it } from 'vitest';
import { ALL_CLUBS, CLUB_GROUPS } from './clubs';

it('중앙동아리 목록에 중복·빈 이름이 없고 분과명도 겹치지 않는다', () => {
  expect(ALL_CLUBS.length).toBeGreaterThanOrEqual(30);
  expect(new Set(ALL_CLUBS).size).toBe(ALL_CLUBS.length);
  expect(ALL_CLUBS.every((club) => club.length > 0 && club === club.trim())).toBe(true);
  const groups = CLUB_GROUPS.map((item) => item.group);
  expect(new Set(groups).size).toBe(groups.length);
});
