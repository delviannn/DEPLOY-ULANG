"use client";

import { useActionState, useState, useTransition } from "react";
import Input from "@/components/Input";
import Tombol from "@/components/Tombol";
import { buatDeskripsiAI } from "@/app/admin/actions";

// Dipakai untuk tambah produk (US-08) dan ubah produk (US-09), dilengkapi AI generator (US-14)
export default function FormProduk({ action, produk = {}, labelTombol = "Simpan produk", daftarKategori = [] }) {
  const [state, formAction, pending] = useActionState(action, null);

  // State untuk form fields yang terhubung dengan AI generator
  const [nama, setNama] = useState(produk.nama || "");
  const [kategori, setKategori] = useState(produk.kategori || "");
  const [deskripsi, setDeskripsi] = useState(produk.deskripsi || "");
  const [varian, setVarian] = useState(Array.isArray(produk.varian) ? produk.varian.map(({ nama: namaVarian, harga }) => ({ nama: namaVarian || "", harga: harga === undefined || harga === null ? "" : Number(harga) })) : []);

  // State untuk AI generator
  const [pesanAI, setPesanAI] = useState(null);
  const [sedangGenerateAI, startGenerateAI] = useTransition();

  const handleGenerateAI = () => {
    if (!nama.trim()) {
      setPesanAI({ error: "Isi nama produk terlebih dahulu untuk membuat deskripsi AI." });
      return;
    }

    setPesanAI(null);
    startGenerateAI(async () => {
      const res = await buatDeskripsiAI({
        nama,
        kategori,
        fitur: "",
        target_user: "",
      });

      if (res?.error) {
        setPesanAI({ error: res.error });
      } else if (res?.hasil) {
        setDeskripsi(res.hasil);
        setPesanAI({ sukses: "Deskripsi berhasil dibuat dengan AI!" });
      }
    });
  };

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {produk.id && <input type="hidden" name="id" value={produk.id} />}

      <Input
        label="Nama produk"
        name="nama"
        error={state?.fieldErrors?.nama}
        value={nama}
        onChange={(e) => setNama(e.target.value)}
        placeholder="Contoh: Kopi Bubuk Robusta 250 g"
        required
      />

      <Input
        label="Harga (Rp)"
        name="harga"
        type="number"
        min="1"
        error={state?.fieldErrors?.harga}
        defaultValue={produk.harga || ""}
        placeholder="Contoh: 45000"
        required
      />

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-teks">Kategori
        <select name="kategori" value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full rounded-lg border border-garis bg-latar px-3 py-2.5 text-base text-teks">
          <option value="">Tanpa kategori</option>
          {[...new Set([...daftarKategori, ...(kategori && !daftarKategori.includes(kategori) ? [kategori] : [])])].map((nama) => <option key={nama} value={nama}>{nama}</option>)}
        </select>
        <a href="/admin/kategori" className="text-xs font-medium text-utama underline">Kelola daftar kategori</a>
      </label>

      <Input
        label="Link foto (URL atau path)"
        name="foto_url"
        error={state?.fieldErrors?.foto_url}
        placeholder="https://... atau /produk/nama-file.svg"
        defaultValue={produk.foto_url || ""}
      />
      <Input label="Atau unggah foto utama (JPEG, PNG, WebP, maks. 5 MB)" name="foto_file" type="file" accept="image/jpeg,image/png,image/webp" />

      <Input
        label="Stok"
        name="stok"
        type="number"
        min="0"
        error={state?.fieldErrors?.stok}
        defaultValue={produk.stok ?? 0}
        placeholder="Contoh: 10"
      />

      <Input label="Urutan tampil" name="urutan" type="number" min="0" error={state?.fieldErrors?.urutan} defaultValue={produk.urutan ?? 0} />

      <Input label="Harga sebelum promo (opsional)" name="harga_coret" type="number" min="0" error={state?.fieldErrors?.harga_coret} defaultValue={produk.harga_coret ?? ""} placeholder="Kosongkan bila tidak promo" />
      <Input label="Foto tambahan (URL, satu per baris)" name="foto_lainnya" error={state?.fieldErrors?.foto_lainnya} textarea defaultValue={(produk.foto_lainnya || []).join("\n")} placeholder="https://..." />
      <fieldset className="flex flex-col gap-3 rounded-xl border border-garis p-4">
        <legend className="px-1 text-sm font-semibold">Varian dan harga per ukuran</legend>
        <input type="hidden" name="varian" value={JSON.stringify(varian)} />
        {varian.map((item, index) => <div key={index} className="grid gap-2 rounded-lg bg-permukaan p-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
          <label className="flex flex-col gap-1 text-sm font-medium">Nama varian<input value={item.nama} onChange={(event) => setVarian((lama) => lama.map((varianItem, i) => i === index ? { ...varianItem, nama: event.target.value } : varianItem))} maxLength={80} required className="rounded-lg border border-garis bg-latar px-3 py-2 font-normal" placeholder="Contoh: 250 g" /></label>
          <label className="flex flex-col gap-1 text-sm font-medium">Harga (Rp)<input type="number" min="0" max="1000000000" step="1" value={item.harga} onChange={(event) => setVarian((lama) => lama.map((varianItem, i) => i === index ? { ...varianItem, harga: event.target.value === "" ? "" : Number(event.target.value) } : varianItem))} required className="rounded-lg border border-garis bg-latar px-3 py-2 font-normal" placeholder="45000" /></label>
          <button type="button" onClick={() => setVarian((lama) => lama.filter((_, i) => i !== index))} className="rounded-lg border border-garis px-3 py-2 text-sm text-bahaya">Hapus</button>
        </div>)}
        {state?.fieldErrors?.varian && <p className="text-xs font-medium text-red-700" role="alert">{state.fieldErrors.varian}</p>}
        <button type="button" disabled={varian.length >= 20} onClick={() => setVarian((lama) => [...lama, { nama: "", harga: "" }])} className="w-fit rounded-lg border border-garis px-3 py-2 text-sm font-semibold disabled:opacity-50">Tambah varian</button>
        <p className="text-xs text-teks-lembut">Tambahkan ukuran dan harga jualnya. Maksimal 20 varian.</p>
      </fieldset>

      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Status Produk
        <select
          name="aktif"
          defaultValue={produk.aktif === false ? "false" : "true"}
          className="w-full rounded-lg border border-garis bg-latar px-3 py-2.5 text-base text-teks focus:border-utama focus:outline-none"
        >
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </label>

      {/* US-14: Deskripsi dengan Tombol Buat Deskripsi AI Langsung Terlihat */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-teks">
            Deskripsi Produk
          </label>
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={sedangGenerateAI}
            className="inline-flex items-center gap-1.5 rounded-lg border border-utama/30 bg-utama/10 px-3 py-1 text-xs font-semibold text-utama hover:bg-utama hover:text-white transition-colors disabled:opacity-50"
          >
            {sedangGenerateAI ? "Menulis..." : "✨ Buat deskripsi dengan AI"}
          </button>
        </div>

        <textarea
          name="deskripsi"
          rows={6}
          value={deskripsi}
          onChange={(e) => setDeskripsi(e.target.value)}
          placeholder="Tulis deskripsi atau klik tombol 'Buat deskripsi dengan AI' di atas..."
          className="w-full rounded-lg border border-garis bg-latar px-3 py-2.5 text-base text-teks placeholder:text-teks-lembut focus:border-utama focus:outline-none"
        />

        {pesanAI?.error && (
          <p className="text-xs text-red-600 font-medium">{pesanAI.error}</p>
        )}
        {pesanAI?.sukses && (
          <p className="text-xs text-green-600 font-medium">{pesanAI.sukses}</p>
        )}
      </div>

      {state?.error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {state?.sukses && (
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
          {state.sukses}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Tombol type="submit" disabled={pending}>
          {pending ? "Menyimpan…" : labelTombol}
        </Tombol>
        <Tombol href="/admin" varian="garis">
          Batal
        </Tombol>
      </div>
    </form>
  );
}
