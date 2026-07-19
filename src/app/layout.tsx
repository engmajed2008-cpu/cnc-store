export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
