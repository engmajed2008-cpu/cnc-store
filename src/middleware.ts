import createMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
});

export function middleware(request: NextRequest) {
  // إعادة توجيه /ar/admin/* أو /en/admin/* → /admin/*
  if (/^\/(ar|en)(\/admin.*)$/.test(request.nextUrl.pathname)) {
    const adminPath = request.nextUrl.pathname.replace(/^\/(ar|en)/, "");
    return NextResponse.redirect(new URL(adminPath, request.url));
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|admin|.*\\..*).*)"],
};
