const DAY = 86_400_000;
const recent = (date: Date | null, now: Date) =>
  date && date.getTime() <= now.getTime() + 5 * 60_000 && date.getTime() >= now.getTime() - DAY;

export function validateTicketResult(
  title: string,
  date: Date | null,
  eventDate: Date,
  now = new Date(),
) {
  if (!title.trim()) return '공연명을 입력해 주세요.';
  if (!date || Number.isNaN(date.getTime())) return '공연 일시를 입력해 주세요.';
  const ticketDay = new Date(date);
  ticketDay.setHours(0, 0, 0, 0);
  const eventDay = new Date(eventDate);
  eventDay.setHours(0, 0, 0, 0);
  if (ticketDay.getTime() < eventDay.getTime() - DAY || ticketDay.getTime() > eventDay.getTime())
    return '티켓 일시는 선택한 공연의 전날부터 당일 사이여야 해요.';
  if (date.getTime() > now.getTime() + DAY) return '아직 확인할 수 없는 미래 티켓이에요.';
  return '';
}
export function validateRinkResult(partySize: number, date: Date | null, now = new Date()) {
  if (!Number.isInteger(partySize) || partySize < 1 || partySize > 20)
    return '인원은 1~20명으로 입력해 주세요.';
  if (!date || Number.isNaN(date.getTime())) return '이용 일시를 입력해 주세요.';
  if (!recent(date, now)) return '영수증 일시는 현재 기준 24시간 이내여야 해요.';
  return '';
}
export function validateTicketWithoutEvent(title: string, date: Date | null, now = new Date()) {
  if (!title.trim()) return '공연명을 입력해 주세요.';
  if (!date || Number.isNaN(date.getTime())) return '공연 일시를 입력해 주세요.';
  const start = new Date(now);
  start.setDate(start.getDate() - 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return date < start || date > end ? '티켓 일시는 어제부터 오늘 사이여야 해요.' : '';
}
