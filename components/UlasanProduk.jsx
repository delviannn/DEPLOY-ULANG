"use client";

import { useActionState } from "react";
import { kirimUlasan } from "@/app/ulasan/actions";

export default function UlasanProduk({ produkId, ulasan = [] }) {
  const [state, action, pending] = useActionState(kirimUlasan, null);
  const rataRata = ulasan.length ? (ulasan.reduce((sum, item) => sum + item.rating, 0) / ulasan.length).toFixed(1) : "—";
  return <section className="mt-8 border-t border-garis pt-6">
    <h2 className="text-xl font-bold">Ulasan pembeli</h2>
    <p className="mt-1 text-sm text-teks-lembut">{ulasan.length ? `★ ${rataRata} dari 5 · ${ulasan.length} ulasan` : "Belum ada ulasan yang disetujui."}</p>
    <ul className="mt-4 flex flex-col gap-3">{ulasan.map((item) => <li key={item.id} className="rounded-xl border border-garis p-4"><div className="flex justify-between gap-3"><strong>{item.nama}</strong><span aria-label={`Rating ${item.rating} dari 5`} className="text-amber-600">{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</span></div><p className="mt-2 whitespace-pre-line text-sm text-teks-lembut">{item.isi}</p></li>)}</ul>
    <form action={action} className="mt-5 grid gap-3 rounded-xl border border-garis p-4 sm:grid-cols-2">
      <input type="hidden" name="produk_id" value={produkId} />
      <label className="flex flex-col gap-1 text-sm font-semibold">Nama<input name="nama" minLength={2} maxLength={80} required className="rounded-lg border border-garis bg-latar px-3 py-2 font-normal" aria-invalid={Boolean(state?.fieldErrors?.nama)} />{state?.fieldErrors?.nama && <span className="text-xs text-red-700">{state.fieldErrors.nama}</span>}</label>
      <label className="flex flex-col gap-1 text-sm font-semibold">Rating<select name="rating" defaultValue="5" required className="rounded-lg border border-garis bg-latar px-3 py-2 font-normal"><option value="">Pilih rating</option>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating} dari 5</option>)}</select>{state?.fieldErrors?.rating && <span className="text-xs text-red-700">{state.fieldErrors.rating}</span>}</label>
      <label className="flex flex-col gap-1 text-sm font-semibold sm:col-span-2">Ulasan<textarea name="isi" minLength={5} maxLength={1200} required rows={4} className="rounded-lg border border-garis bg-latar px-3 py-2 font-normal" aria-invalid={Boolean(state?.fieldErrors?.isi)} />{state?.fieldErrors?.isi && <span className="text-xs text-red-700">{state.fieldErrors.isi}</span>}</label>
      <label aria-hidden="true" className="pointer-events-none absolute -left-[10000px] top-auto h-px w-px overflow-hidden">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      {state?.error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{state.error}</p>}
      {state?.sukses && <p role="status" className="text-sm text-emerald-700 sm:col-span-2">{state.sukses}</p>}
      <button disabled={pending} className="w-fit rounded-lg bg-utama px-4 py-2 font-semibold text-white disabled:opacity-60">{pending ? "Mengirim…" : "Kirim ulasan"}</button>
    </form>
  </section>;
}
