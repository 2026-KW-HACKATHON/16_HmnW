const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
const pad = (value: number) => String(value).padStart(2, '0');
const dayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export function formatEventDateTime(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]}) ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatClock(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatExpiry(date: Date, now = new Date()) {
  const days = Math.round((dayStart(date).getTime() - dayStart(now).getTime()) / 86_400_000);
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (days === 0) return `오늘 ${time}까지`;
  if (days === 1) return `내일 ${time}까지`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일까지`;
}

export function formatRedemptionTime(date: Date, now = new Date()) {
  const days = Math.round((dayStart(now).getTime() - dayStart(date).getTime()) / 86_400_000);
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (days === 0) return `오늘 ${time}`;
  return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]}) ${time}`;
}
