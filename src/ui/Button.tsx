import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Common = {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'inverse';
  size?: 's' | 'm' | 'l';
  full?: boolean;
};
export const Button = forwardRef<
  HTMLButtonElement,
  Common & ButtonHTMLAttributes<HTMLButtonElement>
>(function Button({ variant = 'primary', size = 'm', full, className = '', ...props }, ref) {
  return (
    <button
      ref={ref}
      className={`button button--${variant} button--${size}${full ? ' button--full' : ''} ${className}`}
      {...props}
    />
  );
});
export function ButtonLink({
  variant = 'primary',
  size = 'm',
  full,
  className = '',
  ...props
}: Common & LinkProps) {
  return (
    <Link
      className={`button button--${variant} button--${size}${full ? ' button--full' : ''} ${className}`}
      {...props}
    />
  );
}
