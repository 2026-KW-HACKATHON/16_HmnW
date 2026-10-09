import { expect, it } from 'vitest';
import { audienceSummary, timeBand } from './Owner';

it('대상 요약은 가장 앞 항목과 나머지 개수를 보여준다', () => {
  expect(audienceSummary({ type: 'all' })).toBe('누구나');
  expect(audienceSummary({ type: 'student' })).toBe('학생');
  expect(audienceSummary({ type: 'student', colleges: ['공과대학'] })).toBe('학생 · 공과대학');
  expect(audienceSummary({ type: 'student', colleges: ['공과대학', '경영대학'] })).toBe(
    '학생 · 공과대학 외 1',
  );
  expect(audienceSummary({ type: 'visitor' })).toBe('방문객');
  expect(audienceSummary({ type: 'visitor', venues: ['icerink'] })).toBe('방문객 · 아이스링크');
  expect(audienceSummary({ type: 'visitor', venues: ['donghae', 'icerink'] })).toBe('방문객');
  expect(audienceSummary({ type: 'student_or_visitor' })).toBe('학생·방문객');
  expect(
    audienceSummary({
      type: 'student_or_visitor',
      colleges: ['공과대학', '경영대학'],
      venues: ['icerink'],
    }),
  ).toBe('학생·방문객 · 공과대학 외 1 · 아이스링크');
});

it('시간대는 5개 구간으로 나뉘고 밤은 자정을 넘겨도 포함한다', () => {
  expect(timeBand(7)).toBe('오전');
  expect(timeBand(12)).toBe('점심');
  expect(timeBand(15)).toBe('오후');
  expect(timeBand(19)).toBe('저녁');
  expect(timeBand(23)).toBe('밤');
  expect(timeBand(2)).toBe('밤');
});
