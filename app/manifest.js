import { ambilPengaturanToko } from "@/lib/toko-public";

// US-13: Web App Manifest untuk PWA
export default async function manifest() {
  const toko = await ambilPengaturanToko();
  return {
    name: toko.nama,
    short_name: toko.nama,
    description: toko.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f766e",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}

