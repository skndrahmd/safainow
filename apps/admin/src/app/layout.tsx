import type { Metadata } from "next";
import { Onest } from "next/font/google";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
  weight: ["300", "500"],
});

export const metadata: Metadata = {
  title: 'SafaiNow Admin',
  description: 'SafaiNow platform management dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${onest.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
