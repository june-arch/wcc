// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "WCC Oranye Capture — Acrylic Oranye Craft",
  description: "Sistem manajemen booking & timeline wedding photography. Kelola jadwal, klien, dan dokumen pernikahan dengan mudah.",
  keywords: ["wedding management", "booking system", "wedding photography", "WCC", "wedding planner", "manajemen pernikahan"],
  authors: [{ name: "Oranye Group" }],
  creator: "Oranye Group",
  metadataBase: new URL("https://wcc-liart.vercel.app"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://wcc-liart.vercel.app",
    siteName: "Oranye Group",
    title: "WCC Oranye Capture — Acrylic Oranye Craft",
    description: "Sistem manajemen booking & timeline wedding photography. Kelola jadwal, klien, dan dokumen pernikahan dengan mudah.",
    images: [
      {
        url: "/favicon.ico",
        width: 512,
        height: 512,
        alt: "Oranye Group Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WCC Oranye Capture — Acrylic Oranye Craft",
    description: "Sistem manajemen booking & timeline wedding photography.",
    images: ["/favicon.ico"],
    creator: "@wcc_oranye",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1C1917",
              color: "#FAFAF9",
              borderRadius: "10px",
              border: "1px solid #292524",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#F97316", secondary: "#1C1917" } },
          }}
        />
      </body>
    </html>
  );
}
