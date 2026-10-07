import type { ReactNode } from 'react';

export function FixedCta({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`fixed-cta ${className}`.trim()}>
      <div className="fixed-cta__inner">{children}</div>
    </div>
  );
}
