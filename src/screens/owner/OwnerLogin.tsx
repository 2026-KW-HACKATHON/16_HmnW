import { useState, type FormEvent } from 'react';
import { AppBar } from '../../ui/AppBar';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';

export function OwnerLogin({
  onSubmit,
  message,
}: {
  onSubmit(event: FormEvent<HTMLFormElement>): void;
  message: string;
}) {
  const [signup, setSignup] = useState(false);
  return (
    <section className="screen owner-login">
      <AppBar />
      <div className="screen__content">
        <h1 className="screen__title">
          {signup ? '사장님 계정을' : '사장님 계정으로'}
          <br />
          {signup ? '만들어요' : '로그인해 주세요'}
        </h1>
        <form className="form" onSubmit={onSubmit}>
          <Field label="이메일">
            <input name="email" type="email" placeholder="owner@example.com" required />
          </Field>
          <Field label="비밀번호" help={signup ? '8자 이상 입력해 주세요' : undefined}>
            <input name="password" type="password" minLength={signup ? 8 : 6} required />
          </Field>
          <input type="hidden" name="mode" value={signup ? 'signup' : 'login'} />
          <Button size="l" full>
            {signup ? '가입하고 가게 등록하기' : '로그인하기'}
          </Button>
          <Button
            type="button"
            variant="text"
            size="m"
            full
            onClick={() => setSignup((value) => !value)}
          >
            {signup ? '이미 계정이 있나요? 로그인하기' : '처음이신가요? 가입하기'}
          </Button>
          <p role="status">{message}</p>
        </form>
      </div>
    </section>
  );
}
