export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-bg-subtle" style={{ width: `${100 - i * 8}%` }} />
      ))}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger" role="alert">
      {message || "Something went wrong."}
    </div>
  );
}