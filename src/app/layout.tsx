import type { Metadata, Viewport } from "next";
import AuthSessionProvider from "@/shared/providers/session-provider";
import "./globals.css";

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
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AuthSessionProvider>
          <div className="min-h-dvh bg-background">
            {children}
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
