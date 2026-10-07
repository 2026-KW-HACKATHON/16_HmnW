import { NavLink, useLocation } from 'react-router-dom';
import { DotsIcon, MapPinIcon, ShieldIcon, TicketIcon, WalletIcon } from './icons';

const tabs = [
  ['/', '혜택', TicketIcon],
  ['/nearby', '주변', MapPinIcon],
  ['/coupons', '내 쿠폰', WalletIcon],
  ['/verify', '인증', ShieldIcon],
  ['/more', '더보기', DotsIcon],
] as const;
export function TabBar() {
  const { pathname } = useLocation();
  if (!['/', '/nearby', '/coupons', '/verify', '/more'].includes(pathname)) return null;
  return (
    <nav className="tab-bar" aria-label="주 메뉴">
      {tabs.map(([to, label, Glyph]) => (
        <NavLink key={to} to={to} end={to === '/'}>
          <Glyph />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
