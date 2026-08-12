interface ConnectionBannerProps {
  connected: boolean;
}

export function ConnectionBanner({ connected }: ConnectionBannerProps) {
  if (connected) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-400 text-yellow-900 text-center text-sm font-bold py-2 px-4 flex items-center justify-center gap-2">
      <span className="w-2 h-2 rounded-full bg-yellow-700 animate-pulse inline-block" />
      Reconnecting to server...
    </div>
  );
}
