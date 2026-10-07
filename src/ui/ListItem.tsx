import { Link } from 'react-router-dom';
import type { Audience } from '../data/types';
import { Badge } from './Badge';
import { CheckIcon, ClockIcon, LockIcon } from './icons';

type TicketCardProps = {
  to: string;
  shopName: string;
  category: string;
  title: string;
  audience: Audience['type'];
  condition: string;
  distance: string;
  walkMinutes: number;
  usableNow: boolean;
  used: boolean;
  goldenTime?: boolean;
  lockedReason?: string;
  stubSecondary?: string;
};

export function TicketCard({
  to,
  shopName,
  category,
  title,
  audience,
  condition,
  distance,
  walkMinutes,
  usableNow,
  used,
  goldenTime = false,
  lockedReason,
  stubSecondary,
}: TicketCardProps) {
  const StatusIcon = lockedReason ? LockIcon : used ? CheckIcon : ClockIcon;
  const statusLabel = lockedReason
    ? lockedReason
    : used
      ? '사용함'
      : usableNow
        ? '지금 사용 가능'
        : '지금은 사용 시간 아님';

  return (
    <li
      className={`ticket-card${used ? ' ticket-card--used' : ''}${lockedReason ? ' ticket-card--locked' : ''}`}
    >
      <Link to={to}>
        <span className="ticket-card__body">
          <span className="ticket-card__shop">
            {shopName} · {category}
          </span>
          <strong className="ticket-card__title">{title}</strong>
          <span className="ticket-card__condition">
            <Badge audience={audience} />
            {goldenTime && <span className="ticket-card__golden-badge">골든타임</span>}
            <span>{condition}</span>
          </span>
          <span
            className={`ticket-card__status${usableNow && !used ? ' ticket-card__status--active' : ''}`}
          >
            <StatusIcon size={14} />
            {statusLabel}
          </span>
        </span>
        <span
          className={`ticket-card__stub${usableNow && !used ? ' ticket-card__stub--active' : ''}`}
        >
          <strong className="num">{distance}</strong>
          <small>{stubSecondary || `걸어서 ${walkMinutes}분`}</small>
          {used && <i>사용함</i>}
        </span>
      </Link>
    </li>
  );
}

export function TicketSkeleton() {
  return (
    <li className="ticket-card ticket-card--skeleton" aria-hidden="true">
      <span className="ticket-card__body">
        <i />
        <i />
        <i />
        <i />
      </span>
      <span className="ticket-card__stub">
        <i />
        <i />
      </span>
    </li>
  );
}
