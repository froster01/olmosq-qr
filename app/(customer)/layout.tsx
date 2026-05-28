export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}
