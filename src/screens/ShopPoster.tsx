import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../app/Session';
import { Button } from '../ui/Button';
import { audienceSummary } from './owner/Owner';

const dayLabel = { all: '매일', weekday: '평일', weekend: '주말' } as const;
const QR_SIZE = 320;
const QR_ACCENT = '#0B7D6B'; // ponytail: QR 생성 옵션에만 허용된 고정 색(토큰 CSS 밖)

export default function ShopPoster() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const session = useSession();
  const [qr, setQr] = useState('');

  const shop = session.shops.find((item) => item.id === shopId);
  const owner = session.user?.role === 'owner' && !!shop && shop.ownerUid === session.auth?.uid;
  const qrValue = shop ? `${window.location.origin}/?shop=${shop.id}` : '';

  useEffect(() => {
    if (!owner || !qrValue) return;
    let active = true;
    QRCode.toDataURL(qrValue, {
      width: QR_SIZE,
      margin: 1,
      color: { dark: QR_ACCENT, light: '#ffffff' },
    }).then((url) => {
      if (active) setQr(url);
    });
    return () => {
      active = false;
    };
  }, [owner, qrValue]);

  if (session.loading) {
    return (
      <div className="route-loading" role="status">
        가게 정보를 불러오는 중이에요
      </div>
    );
  }
  if (!owner || !shop) return <Navigate to="/owner" replace />;

  const coupons = session.coupons.filter((c) => c.shopId === shop.id && c.active).slice(0, 3);

  async function savePng() {
    if (!shop) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d')!;
    const textColor =
      getComputedStyle(document.documentElement).getPropertyValue('--color-text-primary').trim() ||
      '#17191d';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.font = 'bold 56px sans-serif';
    ctx.fillText(shop.name, canvas.width / 2, 160, canvas.width - 120);
    if (qr) {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = qr;
      });
      const size = 800;
      ctx.drawImage(img, (canvas.width - size) / 2, 280, size, size);
    }
    const a = document.createElement('a');
    a.download = `${shop.name}-qr-poster.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  return (
    <section className="screen shop-poster">
      <div className="shop-poster__toolbar">
        <Button variant="text" size="s" onClick={() => navigate(-1)}>
          뒤로
        </Button>
      </div>
      <div className="shop-poster__sheet">
        <p className="shop-poster__wordmark">위월계더</p>
        <h1 className="shop-poster__shop">{shop.name}</h1>
        <p className="shop-poster__tagline">광운대 학생·공연장 방문객 혜택 있어요</p>
        {qr && (
          <img
            className="shop-poster__qr"
            src={qr}
            width={QR_SIZE}
            height={QR_SIZE}
            alt="매장 QR"
          />
        )}
        <ul className="shop-poster__coupons">
          {coupons.map((c) => (
            <li key={c.id}>
              <b>{c.title}</b>
              <span>
                {audienceSummary(c.audience)} ·{' '}
                {Array.isArray(c.days) ? c.days.join('·') : dayLabel[c.days]} {c.timeFrom}–
                {c.timeTo}
              </span>
            </li>
          ))}
        </ul>
        <p className="shop-poster__footer">
          QR을 찍으면 내 자격에 맞는 혜택이 바로 보여요 · 매장에서 화면 제시 후 사용
        </p>
      </div>
      <div className="shop-poster__actions">
        <Button onClick={savePng}>이미지로 저장</Button>
        <Button variant="outline" onClick={() => window.print()}>
          인쇄
        </Button>
      </div>
    </section>
  );
}
