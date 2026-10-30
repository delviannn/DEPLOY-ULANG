"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ubahStatusProduk } from "@/app/admin/actions";

export default function TombolStatusProduk({ id, aktif }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return <button type="button" disabled={pending} onClick={() => start(async () => {
    const result = await ubahStatusProduk(id, !aktif);
    if (result?.error) alert(result.error);
    else router.refresh();
  })} className="rounded-lg border border-garis px-2.5 py-1.5 text-xs font-semibold hover:border-utama disabled:opacity-50">
    {pending ? "Menyimpan…" : aktif ? "Nonaktifkan" : "Aktifkan"}
  </button>;
}
