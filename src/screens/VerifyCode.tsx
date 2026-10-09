import { useCallback, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../app/Session';
import { normalizeAccessCode } from '../data/accessCodes';
import { AppBar } from '../ui/AppBar';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';

export default function VerifyCode() {
  const session = useSession();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [toast, setToast] = useState('');
  const [pending, setPending] = useState(false);
  const closeToast = useCallback(() => setToast(''), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code || !session.data || !session.auth) return;
    setPending(true);
    setMessage('');
    try {
      const result = await session.data.accessCodes.redeem(code);
      await session.refreshUser();
      setToast(`${result.label} 자격이 열렸어요`);
      window.setTimeout(() => navigate('/'), 900);
    } catch (error) {
      const errorCode = (error as { code?: string })?.code;
      setMessage(
        errorCode === 'expired-code'
          ? '만료된 코드예요'
          : errorCode === 'invalid-code'
            ? '코드를 찾을 수 없어요'
            : '네트워크를 확인해 주세요',
      );
      setPending(false);
    }
  }

  return (
    <section className="screen verify-code">
      <AppBar title="코드로 인증해요" />
      <div className="screen__content">
        <h1 className="screen__title">코드로 인증해요</h1>
        <p className="screen__description">
          체험용 코드나 스태프 코드를 입력하면 바로 자격이 열려요
        </p>
        <form className="form verify-code__form" onSubmit={submit}>
          <label>
            코드
            <input
              value={code}
              onChange={(event) => setCode(normalizeAccessCode(event.target.value))}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              required
            />
          </label>
          <p role="status">{message}</p>
          <Button size="l" full disabled={pending || !code || !!session.authError}>
            {pending ? '인증 중…' : '인증하기'}
          </Button>
        </form>
      </div>
      {toast && <Toast message={toast} onClose={closeToast} />}
    </section>
  );
}
