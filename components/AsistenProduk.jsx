"use client";

import { useActionState, useState } from "react";
import { tanyaAsistenProduk } from "@/app/asisten/actions";

export default function AsistenProduk() {
  const [buka, setBuka] = useState(false);
  const [state, action, pending] = useActionState(tanyaAsistenProduk, null);
  return <div className="fixed bottom-4 left-4 z-40">
    {buka && <section aria-label="Asisten produk" className="mb-3 w-[min(92vw,22rem)] rounded-2xl border border-garis bg-latar p-4 text-teks shadow-xl">
      <div className="flex items-center justify-between"><h2 className="font-bold">Tanya asisten produk</h2><button type="button" onClick={() => setBuka(false)} aria-label="Tutup asisten" className="px-2">Tutup</button></div>
      <p className="mt-1 text-xs text-teks-lembut">Jawaban memakai info produk dan toko yang tersedia di katalog.</p>
      {state?.jawaban && <p className="mt-3 rounded-lg bg-permukaan p-3 text-sm leading-6" role="status">{state.jawaban}</p>}
      {state?.error && <p className="mt-3 text-sm text-red-700" role="alert">{state.error}</p>}
      <form action={action} className="mt-3 flex flex-col gap-2"><label htmlFor="pertanyaan-asisten" className="sr-only">Pertanyaan tentang produk</label><textarea id="pertanyaan-asisten" name="pertanyaan" minLength={3} maxLength={500} required rows={3} placeholder="Tanya harga, stok, atau varian…" className="rounded-lg border border-garis bg-latar px-3 py-2 text-sm" /><button disabled={pending} className="rounded-lg bg-utama px-3 py-2 text-sm font-bold text-white disabled:opacity-60">{pending ? "Mencari jawaban…" : "Kirim pertanyaan"}</button></form>
    </section>}
    <button type="button" aria-expanded={buka} onClick={() => setBuka(!buka)} className="rounded-full bg-utama px-4 py-3 font-bold text-white shadow-lg">{buka ? "Tutup asisten" : "Tanya produk"}</button>
  </div>;
}
