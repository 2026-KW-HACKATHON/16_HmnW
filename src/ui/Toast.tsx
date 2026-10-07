import { useEffect } from 'react';
import { CircleCheckIcon } from './icons';
export function Toast({ message, onClose }: { message: string; onClose(): void }) {
  useEffect(() => {
    const id = window.setTimeout(onClose, 3000);
    return () => clearTimeout(id);
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <CircleCheckIcon size={20} />
      {message}
    </div>
  );
}
