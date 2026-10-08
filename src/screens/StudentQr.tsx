import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../app/Session';
import { sha256Hex } from '../lib/hash';
import { decodeQrImage, parseDemoQr } from '../lib/qr';
import { AppBar } from '../ui/AppBar';
import { authErrorMessage } from '../ui/AuthErrorBanner';
import { Button } from '../ui/Button';
import { Stepper } from '../ui/Stepper';

export default function StudentQr() {
  const s = useSession(),
    nav = useNavigate(),
    imageInput = useRef<HTMLInputElement>(null),
    [preview, setPreview] = useState(''),
    [decoding, setDecoding] = useState(false),
    [message, setMessage] = useState('');
  async function verify(value: string) {
    // INTEGRATION: 실서비스에서는 KLAS QR 서명 검증 또는 학교 API로 서버 검증합니다.
    const parsed = await parseDemoQr(value);
    await s.data!.students.claim(await sha256Hex(parsed.studentNo), s.auth!.uid);
    const now = new Date();
    await s.data!.users.update(s.auth!.uid, {
      student: {
        method: 'qr',
        studentNoMasked: parsed.studentNo.slice(0, 4) + '******',
        college: parsed.college,
        clubs: [],
        verifiedAt: now.toISOString(),
        expiresAt: '2026-12-31T23:59:59+09:00',
      },
    });
    await s.refreshUser();
    nav('/');
  }
  async function readCapture(file?: File) {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setDecoding(true);
    setMessage('');
    try {
      const value = await decodeQrImage(file);
      if (!value) return setMessage('QR이 선명하게 보이는 캡처를 올려 주세요');
      await verify(value);
    } catch (error) {
      setMessage(
        (error as { code?: string }).code === 'already-claimed'
          ? '이미 다른 기기에서 인증된 학번이에요. 본인이라면 더보기 → 문의하기로 알려 주세요'
          : String(error),
      );
    } finally {
      setDecoding(false);
    }
  }
  return (
    <section className="screen verify-flow">
      <AppBar />
      <Stepper current={1} total={1} label="QR 인증" />
      <div className="screen__content capture-step">
        <h1 className="screen__title">KLAS QR 캡처로 인증해요</h1>
        <p className="screen__description">
          KLAS 앱(하나원큐 모바일학생증)에서 학생증 QR을 열고 화면을 캡처한 뒤 올려 주세요.
        </p>
        <div className="qr-guide">
          <p>① KLAS 앱 → 모바일학생증 → QR 열기</p>
          <p>② 화면 캡처(전원+볼륨↓)</p>
          <p>③ 아래 버튼으로 캡처 올리기</p>
        </div>
        {preview ? (
          <>
            <img className="capture-preview" src={preview} alt="캡처한 QR" />
            <button className="text-action" onClick={() => imageInput.current?.click()}>
              다시 올리기
            </button>
          </>
        ) : (
          <Button
            size="l"
            full
            onClick={() => imageInput.current?.click()}
            disabled={!!s.authError}
          >
            캡처 이미지 올리기
          </Button>
        )}
        <input
          ref={imageInput}
          className="file-input"
          type="file"
          accept="image/*"
          onChange={(event) => readCapture(event.target.files?.[0])}
        />
        <p role="status">
          {s.authError ? authErrorMessage(s.authError) : decoding ? 'QR을 읽고 있어요' : message}
        </p>
        {s.presentation && (
          <Link className="text-action" to="/dev">
            발표용 샘플 QR
          </Link>
        )}
      </div>
    </section>
  );
}
