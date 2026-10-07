export type Point = { lat: number; lng: number };
const EARTH_RADIUS_METERS = 6371e3;

export function distanceMeters(a: Point, b: Point) {
  const p1 = (a.lat * Math.PI) / 180,
    p2 = (b.lat * Math.PI) / 180,
    dp = ((b.lat - a.lat) * Math.PI) / 180,
    dl = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export const withinRadius = (a: Point, b: Point, m: number) => distanceMeters(a, b) <= m;
export const formatDistance = (m: number) =>
  m < 1000 ? `${Math.round(m / 10) * 10}m` : `${(m / 1000).toFixed(1)}km`;
export function mapLinks(name: string, p: Point) {
  return {
    naver: `https://map.naver.com/p/directions/-/${p.lng},${p.lat},${encodeURIComponent(name)}`,
    kakao: `https://map.kakao.com/link/to/${encodeURIComponent(name)},${p.lat},${p.lng}`,
  };
}

function projected(point: Point, latitude: number) {
  return {
    x: ((point.lng * Math.PI) / 180) * EARTH_RADIUS_METERS * Math.cos(latitude),
    y: ((point.lat * Math.PI) / 180) * EARTH_RADIUS_METERS,
  };
}

function nearestOnPolyline(point: Point, polyline: Point[]) {
  if (!polyline.length) return { distance: Infinity, progress: 0 };
  if (polyline.length === 1) return { distance: distanceMeters(point, polyline[0]), progress: 0 };

  const latitude = (point.lat * Math.PI) / 180;
  const target = projected(point, latitude);
  let bestDistance = Infinity;
  let bestProgress = 0;
  let traversed = 0;

  for (let index = 0; index < polyline.length - 1; index += 1) {
    const start = projected(polyline[index], latitude);
    const end = projected(polyline[index + 1], latitude);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const squaredLength = dx * dx + dy * dy;
    const ratio = squaredLength
      ? Math.max(
          0,
          Math.min(1, ((target.x - start.x) * dx + (target.y - start.y) * dy) / squaredLength),
        )
      : 0;
    const nearestX = start.x + ratio * dx;
    const nearestY = start.y + ratio * dy;
    const distance = Math.hypot(target.x - nearestX, target.y - nearestY);
    const segmentLength = Math.hypot(dx, dy);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestProgress = traversed + ratio * segmentLength;
    }
    traversed += segmentLength;
  }

  return { distance: bestDistance, progress: bestProgress };
}

export const distanceToPolylineMeters = (point: Point, polyline: Point[]) =>
  nearestOnPolyline(point, polyline).distance;

export const progressAlongPolylineMeters = (point: Point, polyline: Point[]) =>
  nearestOnPolyline(point, polyline).progress;
