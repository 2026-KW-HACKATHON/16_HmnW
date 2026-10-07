import { describe, expect, it } from 'vitest';
import { parseKoreanDateTime, parseRinkReceipt, parseTicket, titleSimilarity } from './parse';
describe('OCR 파싱', () => {
  it('한국식 날짜와 시간을 읽는다', () => {
    expect(parseKoreanDateTime('2026.10.08 (목) 19:30')?.getFullYear()).toBe(2026);
    expect(parseKoreanDateTime('10/08 19:30', 2026)?.getMonth()).toBe(9);
  });
  it('노이즈 속 티켓 정보를 읽는다', () => {
    const r = parseTicket(
      '*** 동해문화예술관\n공 연 명 : 가을 음악회!!\n2026-10-08 19:30\n성인 2매\n예매번호 T1234567890',
    );
    expect(r.partySize).toBe(2);
    expect(r.bookingNo).toBe('T1234567890');
    expect(r.title).toContain('가을 음악회');
  });
  it('링크 영수증 정보를 읽는다', () => {
    const r = parseRinkReceipt('아이스링크 입장권\n2026.10.08 14:10\n2명\n합계 12,000원');
    expect(r.partySize).toBe(2);
    expect(r.amount).toBe(12000);
  });
  it('노이즈가 섞인 아이스링크 영수증을 읽는다', () => {
    const r = parseRinkReceipt(
      'NO:001\n광운 아이스링크\n이용  03 명\n2026/10/08 09:05\n결제금액 : 36,000 원\n감사합니다',
    );
    expect(r.partySize).toBe(3);
    expect(r.dateTime?.getHours()).toBe(9);
    expect(r.amount).toBe(36000);
  });
  it.each(['대인 2매', '청소년 x2', '본교생 2명'])('%s 수량을 읽는다', (quantity) => {
    expect(parseRinkReceipt(`아이스링크\n${quantity}\n합계 12,000원`).partySize).toBe(2);
  });
  it('금액만 있으면 인원 1명과 오늘 날짜를 기본으로 채운다', () => {
    const today = new Date('2026-10-08T10:00:00+09:00');
    const result = parseRinkReceipt('아이스링크\n결제금액 6,000원', today);
    expect(result.partySize).toBe(1);
    expect(result.dateTime?.toDateString()).toBe(today.toDateString());
    expect(result.dateDefaulted).toBe(true);
  });
  it('대여 품목 수량은 인원에 섞이지 않는다', () => {
    const r = parseRinkReceipt('대인 입장 2매\n스케이트 대여 2\n장갑 1');
    expect(r.partySize).toBe(2);
  });
  it('여러 입장 품목 줄의 수량을 합산하고 대여 줄은 뺀다', () => {
    const r = parseRinkReceipt('청소년 1 어린이 1\n헬멧 대여 2');
    expect(r.partySize).toBe(2);
  });
  it('입장 줄이 없으면 대여 수량을 인원으로 쓰지 않는다', () => {
    const r = parseRinkReceipt('장갑 2\n보관함 1');
    expect(r.partySize).not.toBe(3);
  });
  it('공백과 특수문자를 무시해 공연명을 비교한다', () =>
    expect(titleSimilarity('가을 음악회!', '2026 가을음악회')).toBeGreaterThan(0.6));
  it('p.m 노이즈가 섞인 티켓 시각을 24시간제로 바꾼다', () => {
    expect(parseKoreanDateTime('2017년 1월 14일(토) 5:00 p.m')?.getHours()).toBe(17);
    expect(parseKoreanDateTime('2017년 1월 14일(토) 5:00 p, m')?.getHours()).toBe(17);
  });
  it('노이즈 접두·접미가 섞인 공연명을 정리한다', () => {
    const r = parseTicket('A. 러블리즈 1층 A구역\n2017년 1월 14일(토) 5:00 p.m\n1매');
    expect(r.title).toBe('러블리즈');
  });
  it('실제 인터파크 티켓에서 주최/주관 줄 대신 공연명을 고른다', () => {
    const r = parseTicket(
      [
        '인터파크 티켓',
        'A. 러블리즈 콘서트',
        '2층 A구역 15열 20번',
        '일시: 2017년 1월 14일(토) 5:00 p.m',
        '공연장소 : 올림픽공원 체조경기장',
        '예매번호 : T1234567890',
        '주최,주관 : (주)올림엔터테인먼트 , (주)인터파크 #',
      ].join('\n'),
    );
    expect(r.title).toBe('러블리즈 콘서트');
  });
});
