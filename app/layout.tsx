import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANJU · Care Platform",
  description: "Resident profiles, meal planning and kitchen operations management",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US">
      <body className="antialiased">{children}</body>
    </html>
  );
}
