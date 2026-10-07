import type { ReactNode } from 'react';
import { TicketIcon } from './icons';
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon || <TicketIcon size={40} />}
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </div>
  );
}
