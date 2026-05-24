export default function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={params.locale} dir={params.locale === "ar" ? "rtl" : "ltr"}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, background: "#111111", color: "#F5F3EE", fontFamily: "Cairo, sans-serif" }}>
        <style>{`a { text-decoration: none; color: inherit; }`}</style>
        {children}
      </body>
    </html>
  );
}