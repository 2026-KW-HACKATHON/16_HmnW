export type Venue = 'donghae' | 'icerink';
export type Area = 'main_gate' | 'back_gate' | 'station' | 'uicheon';
export type Audience = {
  type: 'all' | 'student' | 'visitor';
  colleges?: string[];
  clubs?: string[];
  venues?: Venue[];
};
export type StudentQualification = {
  method: 'card' | 'qr';
  studentNoMasked: string;
  college: string;
  clubs: string[];
  verifiedAt: string;
  expiresAt: string;
};
export type VisitorQualification = {
  venue: Venue;
  eventId?: string;
  partySize?: number;
  verifiedAt: string;
  expiresAt: string;
};
export type UserDoc = {
  id: string;
  role: 'customer' | 'owner';
  createdAt: string;
  student?: StudentQualification;
  visitor?: VisitorQualification;
};
export type Shop = {
  id: string;
  ownerUid: string;
  name: string;
  category: string;
  area: Area;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  hours?: string;
  photoDataUrl?: string;
  pinHash?: string;
  createdAt: string;
};
export type Coupon = {
  id: string;
  shopId: string;
  title: string;
  desc?: string;
  audience: Audience;
  days: 'all' | 'weekday' | 'weekend' | number[];
  timeFrom: string;
  timeTo: string;
  validFrom?: string;
  validTo?: string;
  limit: 'once_per_day' | 'once_per_verification' | 'unlimited';
  active: boolean;
  createdAt: string;
};
export type Redemption = {
  id: string;
  uid: string;
  couponId: string;
  shopId: string;
  at: string;
  dayKey: string;
  verificationAt?: string;
};
export type EventDoc = {
  id: string;
  venue: 'donghae';
  title: string;
  startsAt: string;
  endsAt?: string;
  hall?: string;
  kopisId?: string;
  poster?: string;
};
export type AuthUser = { uid: string; email?: string | null };
export type Unsubscribe = () => void;
