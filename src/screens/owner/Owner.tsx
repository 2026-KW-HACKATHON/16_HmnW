import { useEffect, useState, type FormEvent } from 'react';
import { useSession } from '../../app/Session';
import type { Area, Audience, Coupon, Redemption, Venue } from '../../data/types';
import { geocodeAddress } from '../../lib/geocode';
import { sha256Hex } from '../../lib/hash';
import { COLLEGES } from '../../lib/ocr/student';
import { Chip } from '../../ui/Chip';
import { ClubPicker } from '../../ui/ClubPicker';
import { ButtonLink } from '../../ui/Button';
import { areaName } from '../shared';
import { OwnerDashboard } from './OwnerDashboard';
import { OwnerLogin } from './OwnerLogin';

const venueShortName: Record<Venue, string> = { donghae: '동해문화예술관', icerink: '아이스링크' };

function ownerLoginErrorMessage(code: string | undefined) {
  if (code === 'auth/wrong-password' || code === 'auth/invalid-credential')
    return '비밀번호가 올바르지 않아요.';
  if (code === 'auth/user-not-found') return '해당 이메일로 가입된 계정이 없어요.';
  if (code === 'auth/network-request-failed') return '네트워크 연결을 확인해 주세요.';
  if (code === 'auth/too-many-requests') return '시도가 너무 많아요. 잠시 후 다시 시도해 주세요.';
  if (code === 'permission-denied') return '권한 설정 문제로 로그인 정보를 저장하지 못했어요.';
  return '로그인하지 못했어요. 이메일·비밀번호를 다시 확인해 주세요.';
}

export function audienceSummary(a: Audience): string {
  if (a.type === 'all') return '누구나';
  if (a.type === 'student' || a.type === 'student_or_visitor') {
    const parts: string[] = [];
    if (a.colleges?.length)
      parts.push(
        a.colleges.length > 1 ? `${a.colleges[0]} 외 ${a.colleges.length - 1}` : a.colleges[0],
      );
    if (a.clubs?.length)
      parts.push(a.clubs.length > 1 ? `${a.clubs[0]} 외 ${a.clubs.length - 1}` : a.clubs[0]);
    if (a.type === 'student_or_visitor') {
      if (a.venues?.length === 1) parts.push(venueShortName[a.venues[0]]);
      return parts.length ? `학생·방문객 · ${parts.join(' · ')}` : '학생·방문객';
    }
    return parts.length ? `학생 · ${parts.join(', ')}` : '학생';
  }
  if (a.venues?.length === 1) return `방문객 · ${venueShortName[a.venues[0]]}`;
  return '방문객';
}

export const BANDS = ['오전', '점심', '오후', '저녁', '밤'] as const;
export function timeBand(hour: number): (typeof BANDS)[number] {
  if (hour >= 6 && hour < 11) return '오전';
  if (hour >= 11 && hour < 14) return '점심';
  if (hour >= 14 && hour < 18) return '오후';
  if (hour >= 18 && hour < 21) return '저녁';
  return '밤';
}
const audienceTypeLabel: Record<Audience['type'], string> = {
  student: '학생',
  visitor: '방문객',
  all: '누구나',
  student_or_visitor: '학생·방문객',
};

export default function Owner() {
  const s = useSession(),
    [message, setMessage] = useState(''),
    [redemptions, setRedemptions] = useState<Redemption[]>([]),
    [audienceType, setAudienceType] = useState<Audience['type']>('all'),
    [colleges, setColleges] = useState<string[]>([]),
    [clubs, setClubs] = useState<string[]>([]),
    [venues, setVenues] = useState<Venue[]>(['donghae', 'icerink']);
  const owner = s.user?.role === 'owner',
    myShops = s.shops.filter((shop) => shop.ownerUid === s.auth?.uid),
    myIds = myShops.map((shop) => shop.id);
  useEffect(() => {
    if (!owner || !s.data || !myIds.length) {
      setRedemptions([]);
      return;
    }
    const byShop: Record<string, Redemption[]> = {};
    const merge = () => setRedemptions(Object.values(byShop).flat());
    const offs = myIds.map((shopId) =>
      s.data!.redemptions.subscribeByShop(shopId, (items) => {
        byShop[shopId] = items;
        merge();
      }),
    );
    return () => offs.forEach((off) => off());
  }, [owner, s.data, s.shops]);
  async function logout() {
    await s.data!.auth.signOut();
    await s.retryAuth();
  }
  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const element = e.currentTarget,
      form = new FormData(element);
    try {
      const auth = await s.ownerLogin(
        String(form.get('email')),
        String(form.get('password')),
        form.get('mode') === 'signup',
      );
      setMessage(`${auth.email} 계정으로 시작했어요.`);
    } catch (error) {
      setMessage(ownerLoginErrorMessage((error as { code?: string })?.code));
    }
  }
  async function addShop(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const element = e.currentTarget,
      form = new FormData(element),
      area = form.get('area') as Area,
      position = await geocodeAddress(String(form.get('address')), area),
      pin = String(form.get('pin') || '');
    await s.data!.shops.create({
      ownerUid: s.auth!.uid,
      name: String(form.get('name')),
      category: String(form.get('category')),
      area,
      address: String(form.get('address')),
      lat: position.lat,
      lng: position.lng,
      phone: String(form.get('phone')) || undefined,
      hours: `${String(form.get('hoursFrom'))}–${String(form.get('hoursTo'))}`,
      pinHash: pin ? await sha256Hex(pin) : undefined,
      createdAt: new Date().toISOString(),
    });
    setMessage(
      position.source === 'preset'
        ? '주소 좌표를 찾지 못해 선택한 구역의 대표 좌표로 등록했어요.'
        : '가게를 등록했어요.',
    );
    element.reset();
  }
  async function addCoupon(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const element = e.currentTarget,
      form = new FormData(element),
      audience: Audience = { type: audienceType };
    const both = audienceType === 'student_or_visitor';
    if (audienceType === 'student' || both) {
      if (colleges.length) audience.colleges = colleges;
      if (clubs.length) audience.clubs = clubs;
    }
    if ((audienceType === 'visitor' || both) && venues.length) audience.venues = venues;
    await s.data!.coupons.create({
      shopId: String(form.get('shopId')),
      title: String(form.get('title')),
      desc: String(form.get('desc')) || undefined,
      audience,
      days: String(form.get('days')) as Coupon['days'],
      timeFrom: String(form.get('timeFrom')),
      timeTo: String(form.get('timeTo')),
      limit: String(form.get('limit')) as Coupon['limit'],
      active: true,
      createdAt: new Date().toISOString(),
    });
    setMessage('혜택을 등록했어요. 홈에 바로 보여요.');
    element.reset();
    setAudienceType('all');
    setColleges([]);
    setClubs([]);
    setVenues(['donghae', 'icerink']);
  }
  if (!owner) return <OwnerLogin onSubmit={login} message={message} />;
  const now = Date.now(),
    today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = redemptions.filter((x) => new Date(x.at) >= today).length,
    weekCount = redemptions.filter((x) => new Date(x.at).getTime() >= now - 7 * 86_400_000).length;
  const chartRows = (['student', 'visitor', 'all'] as const).map((type) => {
    const row = Object.fromEntries(BANDS.map((b) => [b, 0])) as Record<
      (typeof BANDS)[number],
      number
    >;
    redemptions.forEach((r) => {
      const coupon = s.coupons.find((c) => c.id === r.couponId);
      if (coupon?.audience.type !== type) return;
      row[timeBand(new Date(r.at).getHours())]++;
    });
    return { type, row };
  });
  const chartMax = Math.max(1, ...chartRows.flatMap((r) => Object.values(r.row)));
  return (
    <OwnerDashboard
      shopName={myShops[0]?.name || '사장님 대시보드'}
      message={message}
      onLogout={logout}
    >
      <div className="owner__stats">
        <article>
          <b>{todayCount}</b>
          <span>오늘 사용</span>
        </article>
        <article>
          <b>{weekCount}</b>
          <span>최근 7일</span>
        </article>
      </div>
      <h2>대상별 · 시간대별 사용</h2>
      <div className="owner__chart" aria-label="대상별 시간대 사용 현황">
        {chartRows.map(({ type, row }) => (
          <div className="owner__chart-row" key={type}>
            <span>{audienceTypeLabel[type]}</span>
            <div className="owner__chart-bars">
              {BANDS.map((band) => (
                <div className="owner__chart-bar" key={band}>
                  <div
                    className="owner__chart-bar-fill"
                    style={{ height: `${(row[band] / chartMax) * 100}%` }}
                  />
                  <b>{row[band]}</b>
                  <small>{band}</small>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {!!myShops.length && (
        <>
          <h2>내 가게</h2>
          {myShops.map((shop) => (
            <p key={shop.id}>
              {shop.name}{' '}
              <ButtonLink to={`/owner/poster/${shop.id}`} variant="outline" size="s">
                매장 QR 포스터
              </ButtonLink>
            </p>
          ))}
        </>
      )}
      <form className="form" onSubmit={addShop}>
        <h2>가게 등록</h2>
        <label>
          가게 이름
          <input name="name" required />
        </label>
        <label>
          업종
          <input name="category" required />
        </label>
        <label>
          구역
          <select name="area">
            {Object.entries(areaName).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          주소
          <input name="address" required />
        </label>
        <label>
          전화
          <input name="phone" />
        </label>
        <label>
          영업 시작
          <input name="hoursFrom" type="time" defaultValue="10:00" required />
        </label>
        <label>
          영업 종료
          <input name="hoursTo" type="time" defaultValue="22:00" required />
        </label>
        <label>
          직원 PIN
          <input name="pin" inputMode="numeric" pattern="\d{4}" />
        </label>
        <button>가게 등록</button>
      </form>
      <form className="form" onSubmit={addCoupon}>
        <h2>혜택 등록</h2>
        <p>학생이 빠지는 주말·저녁엔 방문객에게 혜택을 열어 보세요.</p>
        <label>
          가게
          <select name="shopId" required>
            {myShops.map((shop) => (
              <option value={shop.id} key={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          제목
          <input name="title" required />
        </label>
        <label>
          설명
          <input name="desc" />
        </label>
        <label>
          대상
          <select
            name="audience"
            value={audienceType}
            onChange={(e) => setAudienceType(e.target.value as Audience['type'])}
          >
            <option value="all">누구나</option>
            <option value="student">학생</option>
            <option value="visitor">방문객</option>
            <option value="student_or_visitor">학생 + 방문객</option>
          </select>
        </label>
        {(audienceType === 'student' || audienceType === 'student_or_visitor') && (
          <>
            <div className="owner__chips" aria-label="대상 단과대(선택, 미선택이면 전체)">
              {COLLEGES.map((college) => (
                <Chip
                  key={college}
                  pressed={colleges.includes(college)}
                  onClick={() =>
                    setColleges((current) =>
                      current.includes(college)
                        ? current.filter((x) => x !== college)
                        : [...current, college],
                    )
                  }
                >
                  {college}
                </Chip>
              ))}
            </div>
            <fieldset>
              <legend>동아리(선택, 미선택이면 전체)</legend>
              <ClubPicker value={clubs} onChange={setClubs} />
            </fieldset>
          </>
        )}
        {(audienceType === 'visitor' || audienceType === 'student_or_visitor') && (
          <div className="owner__chips" aria-label="대상 방문지">
            {(Object.entries(venueShortName) as [Venue, string][]).map(([value, label]) => (
              <Chip
                key={value}
                pressed={venues.includes(value)}
                onClick={() =>
                  setVenues((current) =>
                    current.includes(value)
                      ? current.filter((x) => x !== value)
                      : [...current, value],
                  )
                }
              >
                {label}
              </Chip>
            ))}
          </div>
        )}
        <label>
          요일
          <select name="days">
            <option value="all">매일</option>
            <option value="weekday">평일</option>
            <option value="weekend">주말</option>
          </select>
        </label>
        <label>
          시작
          <input name="timeFrom" type="time" defaultValue="09:00" required />
        </label>
        <label>
          끝<input name="timeTo" type="time" defaultValue="22:00" required />
        </label>
        <label>
          제한
          <select name="limit">
            <option value="once_per_day">하루 1회</option>
            <option value="once_per_verification">인증당 1회</option>
            <option value="unlimited">무제한</option>
          </select>
        </label>
        <button disabled={!myShops.length}>혜택 등록</button>
      </form>
      <h2>내 혜택</h2>
      {s.coupons
        .filter((c) => myIds.includes(c.shopId))
        .map((c) => (
          <p key={c.id}>
            {c.title} · {audienceSummary(c.audience)} · {c.active ? '노출 중' : '중지됨'}{' '}
            <button onClick={() => s.data!.coupons.update(c.id, { active: !c.active })}>
              {c.active ? '끄기' : '켜기'}
            </button>
          </p>
        ))}
      <h2>최근 사용 내역</h2>
      <ul>
        {redemptions
          .sort((a, b) => b.at.localeCompare(a.at))
          .slice(0, 5)
          .map((item) => (
            <li key={item.id}>
              {s.coupons.find((c) => c.id === item.couponId)?.title || '혜택'} ·{' '}
              {new Date(item.at).toLocaleString('ko-KR')}
            </li>
          ))}
      </ul>
      {!redemptions.length && <p>아직 사용 내역이 없어요.</p>}
    </OwnerDashboard>
  );
}
