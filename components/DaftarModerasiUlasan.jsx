"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { moderasiUlasan } from "@/app/ulasan/actions";

function Aksi({ id, aksi, children }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return <button type="button" disabled={pending} onClick={() => start(async () => {
    const result = await moderasiUlasan(id, aksi);
    if (result?.error) alert(result.error); else router.refresh();
  })} className="rounded-lg border border-garis px-3 py-1.5 text-sm font-semibold disabled:opacity-50">{pending ? "Memproses…" : children}</button>;
}

export default function DaftarModerasiUlasan({ ulasan }) {
  return <ul className="mt-5 flex flex-col gap-3">{ulasan.map((item) => <li key={item.id} className="rounded-xl border border-garis p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><strong>{item.nama} · {item.rating}/5 · Produk #{item.produk_id}</strong><span className="text-xs text-teks-lembut">{item.status}</span></div>
    <p className="mt-2 whitespace-pre-line text-sm">{item.isi}</p>
    <div className="mt-3 flex flex-wrap gap-2"><Aksi id={item.id} aksi="setujui">Setujui</Aksi><Aksi id={item.id} aksi="tolak">Tolak</Aksi><Aksi id={item.id} aksi="hapus">Hapus</Aksi></div>
  </li>)}</ul>;
}
