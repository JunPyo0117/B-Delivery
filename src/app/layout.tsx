import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import AuthSessionProvider from "@/components/providers/session-provider";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: {
    default: "비디릴버리",
    template: "%s | 비디릴버리",
  },
  description: "위치 기반 음식 주문/배달 플랫폼",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${notoSansKR.variable} font-sans antialiased`} suppressHydrationWarning>
        <AuthSessionProvider>
          <div className="mx-auto min-h-dvh max-w-[480px] bg-background">
            {children}
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
