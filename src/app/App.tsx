import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from '../screens/Home';
import Nearby from '../screens/Nearby';
import Verify from '../screens/Verify';
import VerifyCode from '../screens/VerifyCode';
import StudentCard from '../screens/StudentCard';
import StudentQr from '../screens/StudentQr';
import Visitor from '../screens/Visitor';
import CouponDetail from '../screens/CouponDetail';
import CouponUse from '../screens/CouponUse';
import MyCoupons from '../screens/MyCoupons';
import More from '../screens/More';
import Owner from '../screens/owner/Owner';
import ShopPoster from '../screens/ShopPoster';
import Dev from '../screens/Dev';
import { TabBar } from '../ui/TabBar';
import { AuthErrorBanner } from '../ui/AuthErrorBanner';
import { useSession } from './Session';

export default function App() {
  const session = useSession();
  const { pathname } = useLocation();
  const [online, setOnline] = useState(navigator.onLine);
  const hasTabs = ['/', '/nearby', '/coupons', '/verify', '/more'].includes(pathname);

  useEffect(() => {
    const connect = () => setOnline(true);
    const disconnect = () => setOnline(false);
    window.addEventListener('online', connect);
    window.addEventListener('offline', disconnect);
    return () => {
      window.removeEventListener('online', connect);
      window.removeEventListener('offline', disconnect);
    };
  }, []);

  return (
    <div className={`app${hasTabs ? ' app--with-tabs' : ''}`}>
      {!online && (
        <div className="offline-banner" role="status">
          인터넷 연결이 끊겼어요. 저장된 혜택만 보여요
        </div>
      )}
      {session.authError && (
        <AuthErrorBanner error={session.authError} onRetry={() => void session.retryAuth()} />
      )}
      {session.dataError && (
        <div className="offline-banner" role="status">
          <span>데이터를 불러오지 못했어요 ·</span>
          <button
            type="button"
            className="text-action text-action--warning"
            onClick={session.retryData}
          >
            다시 시도
          </button>
        </div>
      )}
      {session.presentation && <span className="presentation-pill">발표 모드</span>}
      <main className="app__main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nearby" element={<Nearby />} />
          <Route path="/coupons" element={<MyCoupons />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify/code" element={<VerifyCode />} />
          <Route path="/verify/student/card" element={<StudentCard />} />
          <Route path="/verify/student/qr" element={<StudentQr />} />
          <Route path="/verify/visitor/:venue" element={<Visitor />} />
          <Route path="/coupon/:id" element={<CouponDetail />} />
          <Route path="/coupon/:id/use" element={<CouponUse />} />
          <Route path="/more" element={<More />} />
          <Route path="/owner/poster/:shopId" element={<ShopPoster />} />
          <Route path="/owner/*" element={<Owner />} />
          <Route path="/dev" element={<Dev />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  );
}
