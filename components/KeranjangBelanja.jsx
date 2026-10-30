"use client";

import { useEffect, useMemo, useState } from "react";
import { toko } from "@/lib/toko";
import { formatRupiah } from "@/lib/format";

const CART_KEY = "katalog:keranjang:v1";

function bacaKeranjang() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item && Number.isSafeInteger(item.id) && Number.isSafeInteger(item.harga) && Number.isSafeInteger(item.jumlah) && item.jumlah > 0) : [];
  } catch {
    return [];
  }
}

function simpan(list) {
  localStorage.setItem(CART_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("katalog:keranjang"));
}

export function simpanKeKeranjang(item) {
  try {
    const list = bacaKeranjang();
    const index = list.findIndex((entry) => entry.id === item.id && entry.varian === item.varian);
    if (index >= 0) list[index].jumlah = Math.min(1000, list[index].jumlah + item.jumlah);
    else if (list.length < 30) list.push(item);
    else return false;
    simpan(list);
    return true;
  } catch {
    return false;
  }
}

export default function KeranjangBelanja({ nomorWhatsApp = toko.nomorWhatsApp }) {
  const [items, setItems] = useState([]);
  const [terbuka, setTerbuka] = useState(false);
  useEffect(() => {
    const update = () => setItems(bacaKeranjang());
    update();
    window.addEventListener("katalog:keranjang", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("katalog:keranjang", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const totalItems = items.reduce((total, item) => total + item.jumlah, 0);
  const totalHarga = items.reduce((total, item) => total + item.harga * item.jumlah, 0);
  const pesan = useMemo(() => [
    "Halo, saya ingin memesan produk berikut:",
    ...items.map((item) => `- ${item.nama}${item.varian ? ` (${item.varian})` : ""} x ${item.jumlah} = ${formatRupiah(item.harga * item.jumlah)}`),
    `Total: ${formatRupiah(totalHarga)}`,
  ].join("\n"), [items, totalHarga]);
  const href = `https://wa.me/${nomorWhatsApp}?text=${encodeURIComponent(pesan)}`;

  function ubahJumlah(item, delta) {
    const next = items.map((entry) => entry === item ? { ...entry, jumlah: Math.max(1, Math.min(1000, entry.jumlah + delta)) } : entry);
    simpan(next);
    setItems(next);
  }

  function hapusItem(item) {
    const next = items.filter((entry) => entry !== item);
    simpan(next);
    setItems(next);
    if (!next.length) setTerbuka(false);
  }

  if (!items.length) return null;
  return <div className="relative">
    <button type="button" aria-expanded={terbuka} onClick={() => setTerbuka(!terbuka)} className="rounded-lg bg-utama px-3 py-2 text-sm font-semibold text-white">
      Keranjang ({totalItems})
    </button>
    {terbuka && <section aria-label="Isi keranjang" className="absolute right-0 top-full z-50 mt-3 w-[min(92vw,26rem)] rounded-2xl border border-garis bg-latar p-4 text-teks shadow-xl">
      <div className="flex items-center justify-between"><h2 className="font-bold">Keranjang belanja</h2><button type="button" onClick={() => setTerbuka(false)} aria-label="Tutup keranjang" className="rounded px-2 py-1">Tutup</button></div>
      <ul className="mt-3 divide-y divide-garis">
        {items.map((item, index) => <li key={`${item.id}-${item.varian || ""}-${index}`} className="py-3">
          <div className="flex items-start justify-between gap-3"><div><a href={`/produk/${item.id}`} className="font-semibold hover:text-utama">{item.nama}</a>{item.varian && <p className="text-xs text-teks-lembut">{item.varian}</p>}<p className="mt-1 text-sm text-teks-lembut">{formatRupiah(item.harga)} / item</p></div><button type="button" onClick={() => hapusItem(item)} className="text-xs text-bahaya underline">Hapus</button></div>
          <div className="mt-2 flex items-center justify-between"><div className="flex items-center gap-2"><button type="button" onClick={() => ubahJumlah(item, -1)} aria-label={`Kurangi jumlah ${item.nama}`} className="h-8 w-8 rounded border border-garis">−</button><span aria-live="polite" className="min-w-6 text-center">{item.jumlah}</span><button type="button" onClick={() => ubahJumlah(item, 1)} aria-label={`Tambah jumlah ${item.nama}`} className="h-8 w-8 rounded border border-garis">+</button></div><strong>{formatRupiah(item.harga * item.jumlah)}</strong></div>
        </li>)}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-garis pt-3 font-bold"><span>Total</span><span>{formatRupiah(totalHarga)}</span></div>
      <a href={href} target="_blank" rel="noopener noreferrer" className="mt-3 block rounded-lg bg-utama px-4 py-3 text-center text-sm font-bold text-white">Pesan semua via WhatsApp</a>
    </section>}
  </div>;
}
