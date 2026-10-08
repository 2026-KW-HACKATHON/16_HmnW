import type { AccessCode } from './types';

export const normalizeAccessCode = (value: string) => value.toUpperCase().replace(/\s+/g, '');

export function accessCodeCandidates(value: string) {
  const normalized = normalizeAccessCode(value);
  const candidates = [normalized];
  const withoutHyphen = normalized.replace(/-/g, '');
  if (withoutHyphen !== normalized) candidates.push(withoutHyphen);
  else if (normalized === 'DONGHAESTAFF') candidates.push('DONGHAE-STAFF');
  return candidates;
}

export function validateAccessCode(code: AccessCode, now = new Date()) {
  if (!code.active) throw { code: 'invalid-code' };
  if (code.until && new Date(code.until).getTime() <= now.getTime()) throw { code: 'expired-code' };
  return code;
}

export function semesterEnd(now = new Date()) {
  const year = now.getFullYear();
  return now.getMonth() < 6 ? `${year}-06-30T23:59:59+09:00` : `${year}-12-31T23:59:59+09:00`;
}
