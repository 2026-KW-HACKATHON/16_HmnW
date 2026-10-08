import type { ReactNode } from 'react';
import { AppBar } from '../../ui/AppBar';
import { Button } from '../../ui/Button';

export function OwnerDashboard({
  shopName,
  message,
  onLogout,
  children,
}: {
  shopName: string;
  message: string;
  onLogout(): void;
  children: ReactNode;
}) {
  return (
    <section className="screen">
      <AppBar root title={shopName || '사장님 대시보드'} />
      <div className="owner">
        <div className="owner__meta">
          <p role="status">{message}</p>
          <Button variant="text" size="s" onClick={onLogout}>
            로그아웃
          </Button>
        </div>
        {children}
      </div>
    </section>
  );
}
