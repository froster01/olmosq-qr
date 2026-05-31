import type { Metadata, Viewport } from "next";
import { Inter, Quicksand } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const quicksand = Quicksand({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "Olmosq Coffee",
  title: "Olmosq Coffee - QR Ordering",
  description: "Scan, order, enjoy. QR-based ordering system for Olmosq Coffee.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Olmosq",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      {
        url: "/icons/olmosq-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/olmosq-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/olmosq-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#496f2c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${quicksand.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
