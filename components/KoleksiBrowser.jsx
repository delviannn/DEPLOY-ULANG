"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import KartuProduk from "@/components/KartuProduk";
import { formatRupiah } from "@/lib/format";

const KEYS = {
  favorit: "katalog:favorit:v1",
  terakhir: "katalog:terakhir-dilihat:v1",
  bandingkan: "katalog:bandingkan:v1",
};
const JUDUL = { favorit: "Produk Favorit", terakhir: "Terakhir Dilihat", bandingkan: "Bandingkan Produk" };

export default function KoleksiBrowser({ jenis }) {
  const [ids, setIds] = useState([]);
  const [produk, setProduk] = useState([]);
  const [error, setError] = useState("");
  const [siap, setSiap] = useState(false);
  const [memuatProduk, setMemuatProduk] = useState(false);

  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem(KEYS[jenis]) || "[]");
      const valid = Array.isArray(value) ? value.map(String).filter((id) => /^\d{1,15}$/.test(id)).slice(0, jenis === "bandingkan" ? 2 : 12) : [];
      setIds(valid);
    } catch { setIds([]); }
    setSiap(true);
  }, [jenis]);

  useEffect(() => {
    let cancelled = false;
    setError("");
    if (!ids.length) { setProduk([]); setMemuatProduk(false); return; }
    setMemuatProduk(true);
    fetch(`/api/katalog/tersimpan?ids=${encodeURIComponent(ids.join(","))}`, { cache: "no-store" })
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data) => { if (!cancelled) { setProduk(data.produk || []); setMemuatProduk(false); } })
      .catch(() => { if (!cancelled) { setError("Produk tidak dapat dimuat. Coba muat ulang halaman."); setMemuatProduk(false); } });
    return () => { cancelled = true; };
  }, [ids]);

  function hapus(id) {
    const next = ids.filter((entry) => entry !== String(id));
    localStorage.setItem(KEYS[jenis], JSON.stringify(next));
    setIds(next);
    setProduk((old) => old.filter((item) => String(item.id) !== String(id)));
  }

  return <section className="py-8">
    <h1 className="text-2xl font-extrabold text-teks">{JUDUL[jenis]}</h1>
    {error ? <p role="alert" className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">{error}</p>
      : !siap ? <p className="mt-5 text-sm text-teks-lembut">Memuat daftar…</p>
      : !ids.length ? <div className="mt-5 rounded-xl border border-garis p-6 text-sm text-teks-lembut">Belum ada produk di daftar ini. <Link className="font-semibold text-utama underline" href="/">Jelajahi katalog</Link></div>
      : memuatProduk ? <p className="mt-5 text-sm text-teks-lembut">Memuat produk…</p>
      : !produk.length ? <p className="mt-5 text-sm text-teks-lembut">Produk di daftar tidak tersedia lagi.</p>
      : jenis === "bandingkan" ? <>
        <p className="mt-2 text-sm text-teks-lembut">Pilih maksimal dua produk. Produk yang sudah tidak aktif tidak ditampilkan.</p>
        <div className="mt-5 overflow-x-auto rounded-xl border border-garis"><table className="w-full min-w-[36rem] border-collapse text-left text-sm"><thead><tr><th className="border-b border-garis p-3">Perbandingan</th>{produk.map((item) => <th key={item.id} className="border-b border-garis p-3"><div className="flex items-center justify-between gap-2"><Link href={`/produk/${item.id}`} className="text-teks hover:text-utama">{item.nama}</Link><button type="button" onClick={() => hapus(item.id)} className="text-xs text-bahaya underline">Hapus</button></div></th>)}</tr></thead><tbody>
          {[["Foto", (item) => <img src={item.foto_url || "/produk/placeholder.svg"} alt={item.nama} className="h-32 w-full rounded-lg object-cover" />], ["Kategori", (item) => item.kategori || "—"], ["Harga", (item) => formatRupiah(item.harga)], ["Stok", (item) => item.stok > 0 ? `${item.stok} tersedia` : "Stok habis"], ["Deskripsi", (item) => item.deskripsi || "Belum ada deskripsi"]].map(([label, render]) => <tr key={label}><th className="border-b border-garis p-3 align-top">{label}</th>{produk.map((item) => <td key={item.id} className="border-b border-garis p-3 align-top">{render(item)}</td>)}</tr>)}
        </tbody></table></div>
      </> : <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">{produk.map((item) => <div key={item.id} className="relative"><KartuProduk produk={item} /><button type="button" onClick={() => hapus(item.id)} className="absolute bottom-3 right-3 rounded-md bg-latar px-2 py-1 text-xs text-bahaya shadow">Hapus dari daftar</button></div>)}</div>}
  </section>;
}
