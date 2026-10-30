"use client";

import { useState, useTransition } from "react";
import { geserUrutanProduk } from "@/app/admin/actions";

export default function TombolUrutanProduk({ id, nama }) {
  const [pesan, setPesan] = useState("");
  const [pending, startTransition] = useTransition();
  function geser(arah) {
    setPesan("");
    startTransition(async () => {
      const hasil = await geserUrutanProduk(id, arah);
      setPesan(hasil?.error || "Urutan produk disimpan.");
    });
  }
  return <div className="flex items-center gap-1">
    <button type="button" disabled={pending} onClick={() => geser(-1)} aria-label={`Naikkan urutan ${nama}`} title="Naikkan urutan" className="rounded border border-garis px-2 py-1 text-sm disabled:opacity-50">↑</button>
    <button type="button" disabled={pending} onClick={() => geser(1)} aria-label={`Turunkan urutan ${nama}`} title="Turunkan urutan" className="rounded border border-garis px-2 py-1 text-sm disabled:opacity-50">↓</button>
    {pesan && <span role="status" aria-live="polite" className="sr-only">{pesan}</span>}
  </div>;
}
