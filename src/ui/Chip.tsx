import type { ButtonHTMLAttributes } from 'react';
export function Chip({
  pressed,
  ...props
}: { pressed?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className="chip" aria-pressed={pressed} {...props} />;
}
