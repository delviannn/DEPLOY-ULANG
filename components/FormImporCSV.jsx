"use client";

import { useActionState } from "react";
import { imporProdukCSV } from "@/app/admin/actions";

export default function FormImporCSV() {
  const [state, action, pending] = useActionState(imporProdukCSV, null);
  return <><p className="rounded-xl bg-permukaan p-4 font-mono text-xs">nama,harga,kategori,deskripsi,foto_url,foto_lainnya,stok,aktif,harga_coret,urutan,varian</p>
    <form action={action} className="flex max-w-xl flex-col gap-4 rounded-xl border border-garis p-4"><label className="flex flex-col gap-2 text-sm font-semibold">File CSV<input type="file" name="file" accept=".csv,text/csv" required className="rounded-lg border border-garis p-2" /></label>{state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}{state?.sukses && <p role="status" className="text-sm text-emerald-700">{state.sukses}</p>}<button disabled={pending} className="w-fit rounded-lg bg-utama px-4 py-2 font-semibold text-white disabled:opacity-50">{pending ? "Mengimpor…" : "Impor produk"}</button></form>
  </>;
}
