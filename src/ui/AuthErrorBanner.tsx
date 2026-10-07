export function authErrorMessage(code: string) {
  return code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed'
    ? 'Firebase 콘솔에서 익명 로그인을 켜야 해요'
    : '로그인 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.';
}

export function AuthErrorBanner({ error, onRetry }: { error: string; onRetry(): void }) {
  return (
    <div className="offline-banner" role="status">
      <span>{authErrorMessage(error)}</span>
      <button type="button" className="text-action text-action--warning" onClick={onRetry}>
        다시 시도
      </button>
    </div>
  );
}
