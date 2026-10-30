"use client";

import { useActionState, useTransition } from "react";
import { tambahKategori, ubahKategori, hapusKategori } from "@/app/admin/actions";

function Pesan({ state }) {
  if (state?.error) return <p role="alert" className="text-sm text-red-700">{state.error}</p>;
  if (state?.sukses) return <p role="status" className="text-sm text-emerald-700">{state.sukses}</p>;
  return null;
}

function Hapus({ id }) {
  const [pending, start] = useTransition();
  return <button type="button" disabled={pending} onClick={() => {
    if (confirm("Hapus kategori ini? Kategori yang masih dipakai produk tidak dapat dihapus.")) start(async () => {
      const result = await hapusKategori(id);
      if (result?.error) alert(result.error);
      else window.location.reload();
    });
  }} className="text-sm text-bahaya underline disabled:opacity-50">{pending ? "Memproses…" : "Hapus"}</button>;
}

function FormUbahKategori({ item }) {
  const [state, action, pending] = useActionState(ubahKategori, null);
  return <form action={action} className="flex min-w-60 flex-1 flex-wrap gap-2"><input type="hidden" name="id" value={item.id} /><label className="sr-only" htmlFor={`kategori-${item.id}`}>Nama kategori</label><input id={`kategori-${item.id}`} name="nama" defaultValue={item.nama} required maxLength={60} className="min-w-0 flex-1 rounded-lg border border-garis bg-latar px-3 py-2" /><button disabled={pending} className="rounded-lg border border-garis px-3 py-2 text-sm font-semibold disabled:opacity-50">{pending ? "Menyimpan…" : "Simpan"}</button>{state?.error && <span role="alert" className="w-full text-xs text-red-700">{state.error}</span>}{state?.sukses && <span role="status" className="w-full text-xs text-emerald-700">{state.sukses}</span>}</form>;
}

export default function KelolaKategori({ kategori }) {
  const [state, action, pending] = useActionState(tambahKategori, null);
  return <div className="flex flex-col gap-5 py-8">
    <div><h1 className="text-2xl font-extrabold">Kelola kategori</h1><p className="mt-1 text-sm text-teks-lembut">Kategori yang dipakai produk tidak dapat dihapus.</p></div>
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-xl border border-garis p-4">
      <label className="flex min-w-60 flex-1 flex-col gap-1 text-sm font-semibold">Kategori baru<input name="nama" required maxLength={60} className="rounded-lg border border-garis bg-latar px-3 py-2 font-normal" /></label>
      <button disabled={pending} className="rounded-lg bg-utama px-4 py-2 font-semibold text-white">{pending ? "Menyimpan…" : "Tambah kategori"}</button><Pesan state={state} />
    </form>
    <ul className="divide-y divide-garis rounded-xl border border-garis">{kategori.map((item) => <li key={item.id} className="flex flex-wrap items-center gap-3 p-4">
      <FormUbahKategori item={item} />
      <span className="min-w-20 text-xs text-teks-lembut">/{item.slug}</span><Hapus id={item.id} />
    </li>)}</ul>
    {!kategori.length && <p className="rounded-xl border border-garis p-5 text-sm text-teks-lembut">Belum ada kategori.</p>}
  </div>;
}
