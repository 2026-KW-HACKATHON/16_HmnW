import type { Coupon } from '../data/types';

/** Firestore 문서 id로 쓸 수 있게 영숫자 외 문자를 '-'로 바꿉니다. */
const safeKey = (s: string) => s.replace(/[^a-zA-Z0-9]/g, '-');

/**
 * 1인 제한을 서버(규칙)에서도 강제하기 위해 결정적인 redemption 문서 id를 만듭니다.
 * 같은 uid·coupon·제한 단위로는 항상 같은 id가 나와, setDoc(merge 없음)이
 * 기존 문서를 update로 취급해 거부되는 식으로 중복 생성을 막습니다.
 */
export function redemptionId(
  uid: string,
  coupon: Pick<Coupon, 'id' | 'limit'>,
  dayKey: string,
  verificationAt?: string,
): string {
  if (coupon.limit === 'once_per_day') return `${uid}_${coupon.id}_${dayKey}`;
  if (coupon.limit === 'once_per_verification')
    return `${uid}_${coupon.id}_${verificationAt ? safeKey(verificationAt) : 'novf'}`;
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${uid}_${coupon.id}_${Date.now()}_${rand}`;
}
