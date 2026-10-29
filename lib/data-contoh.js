// DATA CONTOH: referensi data untuk seed database dan pengembangan lokal.
// Data produksi dimuat dari Supabase melalui app/page.jsx.

export const produkContoh = [
  {
    id: 1,
    nama: "Kopi Bubuk Robusta 250 g",
    harga: 45000,
    deskripsi:
      "Biji robusta disangrai sedang lalu digiling halus. Cocok untuk kopi tubruk dan kopi susu.",
    foto_url: "/produk/kopi.svg",
    kategori: "Minuman",
    stok: 20,
    aktif: true,
    urutan: 1,
  },
  {
    id: 2,
    nama: "Keripik Singkong Balado",
    harga: 15000,
    deskripsi: "Singkong iris tipis, digoreng renyah, dibalut bumbu balado pedas manis.",
    foto_url: "/produk/keripik.svg",
    kategori: "Camilan",
    stok: 35,
    aktif: true,
    urutan: 2,
  },
  {
    id: 3,
    nama: "Sambal Bawang Botol 150 ml",
    harga: 25000,
    deskripsi: "Cabai rawit dan bawang putih goreng dengan minyak, tahan hingga 2 bulan.",
    foto_url: "/produk/sambal.svg",
    kategori: "Bumbu",
    stok: 18,
    aktif: true,
    urutan: 3,
  },
  {
    id: 4,
    nama: "Kue Nastar Toples 500 g",
    harga: 85000,
    deskripsi: "Nastar lembut dengan selai nanas buatan sendiri. Dikemas toples kedap udara.",
    foto_url: "/produk/nastar.svg",
    kategori: "Kue kering",
    stok: 12,
    aktif: true,
    urutan: 4,
  },
  {
    id: 5,
    nama: "Tas Anyaman Pandan",
    harga: 120000,
    deskripsi: "Dianyam tangan dari daun pandan kering, dilapisi kain di bagian dalam.",
    foto_url: "/produk/tas.svg",
    kategori: "Kerajinan",
    stok: 8,
    aktif: true,
    urutan: 5,
  },
  {
    id: 6,
    nama: "Kain Batik Cap 2 m",
    harga: 175000,
    deskripsi: "Batik cap motif parang di atas kain katun primisima, panjang 2 meter.",
    foto_url: "/produk/batik.svg",
    kategori: "Kain",
    stok: 6,
    aktif: true,
    urutan: 6,
  },
];

export function cariProdukContoh(id) {
  return produkContoh.find((produk) => String(produk.id) === String(id));
}
