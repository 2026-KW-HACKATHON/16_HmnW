import type { ReactNode } from 'react';
export function Field({
  label,
  auto,
  help,
  error,
  children,
}: {
  label: string;
  auto?: boolean;
  help?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className={`field${error ? ' field--error' : ''}`}>
      <span className="field__label">
        {label}
        {auto && <small>자동 입력</small>}
      </span>
      {children}
      {(error || help) && <span className="field__help">{error || help}</span>}
    </label>
  );
}
