import { useEffect, type ReactNode } from 'react';
export function Sheet({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose(): void;
}) {
  useEffect(() => {
    const close = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, [onClose]);
  if (!open) return null;
  return (
    <div
      className="sheet"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        className="sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
      >
        <span className="sheet__handle" />
        <h2 id="sheet-title" tabIndex={-1}>
          {title}
        </h2>
        {children}
      </section>
    </div>
  );
}
