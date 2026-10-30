import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PWARegister from "@/components/PWARegister";
import AsistenProduk from "@/components/AsistenProduk";
import { ambilPengaturanToko } from "@/lib/toko-public";
import { headers } from "next/headers";

export async function generateMetadata() {
  const identitas = await ambilPengaturanToko();
  return { title: identitas.nama, description: identitas.tagline, manifest: "/manifest.webmanifest", appleWebApp: { capable: true, statusBarStyle: "default", title: identitas.nama }, icons: { apple: "/icons/icon-192.png" } };
}

export const viewport = {
  themeColor: "#0f766e",
};

export default async function RootLayout({ children }) {
  // Reads the request so nonce-based CSP is applied to dynamically rendered scripts.
  await headers();
  const identitas = await ambilPengaturanToko();
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Header toko={identitas} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4">{children}</main>
        <Footer toko={identitas} />
        <PWARegister />
        <AsistenProduk />
      </body>
    </html>
  );
}
