import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from './icons';

export function AppBar({
  title,
  root,
  action,
}: {
  title?: string;
  root?: boolean;
  action?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header className={`app-bar ${root ? 'app-bar--root' : 'app-bar--sub'}`}>
      {!root && (
        <button className="icon-button" aria-label="뒤로 가기" onClick={() => navigate(-1)}>
          <ArrowLeftIcon />
        </button>
      )}
      <strong className="app-bar__title">{title}</strong>
      <div className="app-bar__action">{action}</div>
    </header>
  );
}
