import { ambilPengaturanToko } from "@/lib/toko-public";

export async function generateMetadata() {
  const toko = await ambilPengaturanToko();
  return { title: `Tentang ${toko.nama}`, description: toko.tagline };
}

export default async function HalamanTentang() {
  const toko = await ambilPengaturanToko();
  const tautanWhatsApp = `https://wa.me/${toko.nomorWhatsApp}?text=${encodeURIComponent(`Halo ${toko.nama}, saya ingin bertanya tentang toko.`)}`;
  return <article className="max-w-prose py-12">
    <p className="text-sm font-semibold text-utama">Cerita kami</p>
    <h1 className="mt-2 text-3xl font-extrabold">Tentang {toko.nama}</h1>
    <p className="mt-4 leading-7 text-teks-lembut">{toko.tagline} Kami memilih produk dengan perhatian pada kualitas, dibuat oleh usaha dan perajin lokal.</p>
    <h2 className="mt-8 text-xl font-bold">Kunjungi toko</h2>
    <p className="mt-2 text-teks-lembut">{toko.alamat}<br />{toko.jamBuka}</p>
    <h2 className="mt-8 text-xl font-bold">Hubungi kami</h2>
    <p className="mt-2 text-teks-lembut">WhatsApp: +{toko.nomorWhatsApp}</p>
    <a className="mt-4 inline-flex rounded-xl bg-utama px-5 py-3 font-semibold text-white hover:bg-utama-gelap" href={tautanWhatsApp} target="_blank" rel="noopener noreferrer">Chat WhatsApp</a>
  </article>;
}
