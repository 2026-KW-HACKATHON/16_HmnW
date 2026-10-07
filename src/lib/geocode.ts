import { AREA_POINTS } from '../data/places';
import type { Area } from '../data/types';
export async function geocodeAddress(address: string, fallback: Area) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=kr&q=${encodeURIComponent(address)}`,
      { headers: { 'Accept-Language': 'ko' } },
    );
    if (!r.ok) throw new Error();
    const [x] = (await r.json()) as { lat: string; lon: string }[];
    if (x) return { lat: Number(x.lat), lng: Number(x.lon), source: 'nominatim' as const };
  } catch {}
  return { ...AREA_POINTS[fallback], source: 'preset' as const };
}
