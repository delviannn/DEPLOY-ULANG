"use client";

import { useActionState } from "react";
import { simpanPengaturanToko } from "@/app/admin/actions";

export default function FormPengaturanToko({ toko }) {
  const [state, action, pending] = useActionState(simpanPengaturanToko, null);
  return <div><h1 className="text-2xl font-extrabold">Pengaturan toko</h1>
    <form action={action} className="mt-5 grid max-w-2xl gap-4 rounded-xl border border-garis p-5">
      {[ ["Nama toko", "nama", toko.nama], ["Tagline", "tagline", toko.tagline], ["Nomor WhatsApp (62...)", "nomor_whatsapp", toko.nomorWhatsApp], ["Alamat", "alamat", toko.alamat], ["Jam buka", "jam_buka", toko.jamBuka], ["Judul banner", "banner_judul", toko.bannerJudul], ["Deskripsi banner", "banner_deskripsi", toko.bannerDeskripsi], ["Foto banner (URL atau path)", "banner_foto", toko.bannerFoto], ["Tautan tombol banner (URL HTTPS atau path lokal)", "banner_tautan", toko.bannerTautan] ].map(([label, name, value]) => <label key={name} className="flex flex-col gap-1.5 text-sm font-semibold">{label}{name === "banner_deskripsi" ? <textarea name={name} defaultValue={value || ""} maxLength={500} rows={3} className="rounded-lg border border-garis bg-latar px-3 py-2 font-normal" /> : <input name={name} defaultValue={value || ""} maxLength={name === "tagline" ? 240 : name === "banner_tautan" ? 500 : 300} required={["nama", "tagline", "nomor_whatsapp"].includes(name)} className="rounded-lg border border-garis bg-latar px-3 py-2 font-normal" />}</label>)}
      <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="banner_aktif" value="true" defaultChecked={toko.bannerAktif} /> Tampilkan banner promo di beranda</label>
      {state?.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}{state?.sukses && <p role="status" className="text-sm text-emerald-700">{state.sukses}</p>}
      <button disabled={pending} className="w-fit rounded-lg bg-utama px-4 py-2 font-semibold text-white disabled:opacity-50">{pending ? "Menyimpan…" : "Simpan pengaturan"}</button>
    </form>
  </div>;
}
