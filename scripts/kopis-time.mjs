const weekdays = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };

export function parseDtGuidance(value) {
  const result = new Map();
  for (const match of value.matchAll(
    /([일월화수목금토])요일\s*(?:[~～-]\s*([일월화수목금토])요일)?\s*\(([^()]*)\)/g,
  )) {
    const start = weekdays[match[1]],
      end = match[2] ? weekdays[match[2]] : start;
    const times = [...match[3].matchAll(/(?:[01]?\d|2[0-3]):[0-5]\d/g)].map((x) =>
      x[0].padStart(5, '0'),
    );
    if (!times.length) continue;
    let day = start;
    while (true) {
      result.set(day, [...new Set([...(result.get(day) || []), ...times])]);
      if (day === end) break;
      day = (day + 1) % 7;
      if (day === start) break;
    }
  }
  return result;
}

const parseDate = (value) => {
  const [y, m, d] = value.split('.').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const dateKey = (date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
export function expandDtGuidance(from, to, value) {
  const schedule = parseDtGuidance(value),
    result = [];
  for (
    let date = parseDate(from), end = parseDate(to);
    date <= end;
    date = new Date(date.getTime() + 86_400_000)
  )
    for (const time of schedule.get(date.getUTCDay()) || [])
      result.push(`${dateKey(date)}T${time}:00+09:00`);
  return result;
}
