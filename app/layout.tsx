import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../components/Providers";

export const metadata: Metadata = {
  title: "MyNook.AI",
  description: "AI Powered Interior & Exterior Design Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* 临时保留 Tailwind CDN 引用，直到完全验证本地 Tailwind 配置无误 */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
