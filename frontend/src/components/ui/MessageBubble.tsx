export function MessageBubble({
  from,
  children,
}: {
  from: "customer" | "agent" | "owner";
  children: React.ReactNode;
}) {
  const base = "max-w-[75%] rounded-2xl px-4 py-2 text-sm";
  if (from === "customer") {
    return <div className={`${base} ms-auto bg-accent text-accent-ink`}>{children}</div>;
  }
  if (from === "agent") {
    return <div className={`${base} bg-bg-subtle text-ink`}>{children}</div>;
  }
  return <div className={`${base} bg-surface border border-border text-ink`}>{children}</div>;
}