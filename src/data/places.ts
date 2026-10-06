import type { Area, Venue } from './types';

// 출처: OSM/Nominatim 및 Overpass. 상세 근거는 docs/domain.md §A를 참조합니다.
export const AREA_POINTS: Record<Area, { lat: number; lng: number }> = {
  main_gate: { lat: 37.6192755, lng: 127.0582184 }, // 광운대학교 정문, OSM
  back_gate: { lat: 37.6202386, lng: 127.0610944 }, // 광운대학교 후문, OSM
  station: { lat: 37.6236987, lng: 127.0618193 }, // 광운대역, OSM
  uicheon: { lat: 37.6175875, lng: 127.0574992 }, // 우이천변, OSM
};
export const VENUE_POINTS: Record<Venue, { lat: number; lng: number }> = {
  donghae: { lat: 37.6202512, lng: 127.0573526 }, // 동해문화예술관 node, OSM/Nominatim
  icerink: { lat: 37.6203081, lng: 127.0571642 }, // 아이스링크 way 804473754, OSM Overpass
};
