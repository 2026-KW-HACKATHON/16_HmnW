import { expect, it } from 'vitest';
import { audienceSummary, goldenTimePreset, timeBand } from './Owner';

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
});

it('시간대는 5개 구간으로 나뉘고 밤은 자정을 넘겨도 포함한다', () => {
  expect(timeBand(7)).toBe('오전');
  expect(timeBand(12)).toBe('점심');
  expect(timeBand(15)).toBe('오후');
  expect(timeBand(19)).toBe('저녁');
  expect(timeBand(23)).toBe('밤');
  expect(timeBand(2)).toBe('밤');
});

it('스케이트 골든타임 프리셋은 goldenTime 상수로 평일·주말 시간을 계산한다', () => {
  expect(goldenTimePreset('rink-weekday')).toEqual({
    days: 'weekday',
    timeFrom: '16:50',
    timeTo: '17:50',
  });
  expect(goldenTimePreset('rink-weekend')).toEqual({
    days: 'weekend',
    timeFrom: '15:50',
    timeTo: '16:50',
  });
});

it('공연·주말 저녁 프리셋은 고정 시간대와 방문객 대상을 돌려준다', () => {
  expect(goldenTimePreset('show')).toEqual({ days: 'all', timeFrom: '21:30', timeTo: '22:30' });
  expect(goldenTimePreset('weekend-evening')).toEqual({
    days: 'weekend',
    timeFrom: '17:00',
    timeTo: '22:00',
    audience: 'visitor',
  });
});
