import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../app/Session';
import { AppBar } from '../ui/AppBar';
import { ButtonLink } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { Toast } from '../ui/Toast';
import { ChevronRightIcon, SettingsIcon, StoreIcon } from '../ui/icons';

export default function More() {
  const session = useSession();
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [themeOpen, setThemeOpen] = useState(false);
  const [toast, setToast] = useState('');
  const closeToast = useCallback(() => setToast(''), []);
  const tapVersion = () => {
    const next = count + 1;
    setCount(next);
    if (next === 3) setToast('4번 더 누르면 발표 모드가 켜져요');
    if (next >= 7) {
      session.setPresentation(true);
      setToast('발표 모드를 켰어요');
      navigate('/dev');
    }
  };
  const setTheme = (theme: string) => {
    if (theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
    setThemeOpen(false);
  };
  return (
    <section className="screen more">
      <AppBar root title="더보기" />
      <div className="screen__content">
        <article className="owner-entry">
          <StoreIcon />
          <div>
            <h2>{session.user?.role === 'owner' ? '가게를 관리해 보세요' : '사장님이신가요?'}</h2>
            <p>가게를 등록하고 혜택을 바로 올려 보세요</p>
          </div>
          <ButtonLink to="/owner" size="m">
            {session.user?.role === 'owner' ? '대시보드 열기' : '사장님으로 시작하기'}
          </ButtonLink>
        </article>
        <ul className="settings-list">
          <li>
            <button onClick={() => setThemeOpen(true)}>
              <SettingsIcon />
              <span>화면 테마</span>
              <small>시스템 설정 따름</small>
              <ChevronRightIcon />
            </button>
          </li>
          <li>
            <button>
              <span>인증 정보 지우기</span>
              <ChevronRightIcon />
            </button>
          </li>
          <li>
            <button>
              <span>개인정보는 이렇게 다뤄요</span>
              <ChevronRightIcon />
            </button>
          </li>
          <li>
            <button>
              <span>문의하기</span>
              <ChevronRightIcon />
            </button>
          </li>
          {session.presentation && (
            <li>
              <Link to="/dev">
                <span>개발자 메뉴 · 샘플 QR 만들기</span>
                <ChevronRightIcon />
              </Link>
            </li>
          )}
        </ul>
        <button className="version" onClick={tapVersion}>
          버전 1.0.0
        </button>
        <p className="more__credit">2026 KW 해커톤 16조 유구무언</p>
        {session.data?.mode === 'local' && <p className="more__credit">데모 데이터로 실행 중</p>}
      </div>
      <Sheet open={themeOpen} title="화면 테마" onClose={() => setThemeOpen(false)}>
        <div className="theme-options">
          <button onClick={() => setTheme('system')}>시스템 설정 따름</button>
          <button onClick={() => setTheme('light')}>라이트</button>
          <button onClick={() => setTheme('dark')}>다크</button>
        </div>
      </Sheet>
      {toast && <Toast message={toast} onClose={closeToast} />}
    </section>
  );
}
