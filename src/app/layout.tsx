// src/app/layout.tsx
import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "WCC Oranye Capture — Wedding Management",
  description: "Sistem manajemen booking & timeline wedding photography. Kelola jadwal, klien, dan dokumen pernikahan dengan mudah.",
  keywords: ["wedding management", "booking system", "wedding photography", "WCC", "wedding planner", "manajemen pernikahan"],
  authors: [{ name: "WCC Oranye Capture" }],
  creator: "WCC Oranye Capture",
  metadataBase: new URL("https://wcc.vercel.app"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/logo.webp",
    shortcut: "/logo.webp",
    apple: "/logo.webp",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://wcc.vercel.app",
    siteName: "WCC Oranye Capture",
    title: "WCC Oranye Capture — Wedding Management",
    description: "Sistem manajemen booking & timeline wedding photography. Kelola jadwal, klien, dan dokumen pernikahan dengan mudah.",
    images: [
      {
        url: "/logo.webp",
        width: 512,
        height: 512,
        alt: "WCC Oranye Capture Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WCC Oranye Capture — Wedding Management",
    description: "Sistem manajemen booking & timeline wedding photography.",
    images: ["/logo.webp"],
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
